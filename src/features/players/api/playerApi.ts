import { supabase } from "@/integrations/supabase/client";
import { Player } from "@/types/poker";
import { toast } from "sonner";
import { z } from "zod";

import { SupabaseClient } from "@supabase/supabase-js";

const playerNameSchema = z.string().trim().min(1, "Player name is required").max(100, "Player name must be less than 100 characters");

export const fetchPlayers = async (userId: string, client?: SupabaseClient): Promise<Player[]> => {
    try {
        const supabaseClient = client || supabase;
        const { data, error } = await supabaseClient
            .from("players")
            .select("*")
            .eq("user_id", userId)
            .order("name");

        if (error) throw error;
        return data || [];
    } catch (error) {
        console.error("Error fetching players:", error);
        toast.error("Failed to fetch players");
        return [];
    }
};

export const createOrFindPlayer = async (userId: string, name: string): Promise<Player> => {
    // Validate player name
    try {
        playerNameSchema.parse(name);
    } catch (error) {
        if (error instanceof z.ZodError) {
            throw new Error(error.errors[0].message);
        }
        throw error;
    }

    try {
        // First check if player already exists for this user
        const { data: existingPlayers, error: searchError } = await supabase
            .from("players")
            .select("*")
            .eq("name", name.trim())
            .eq("user_id", userId)
            .limit(1);

        if (searchError) throw searchError;

        if (existingPlayers && existingPlayers.length > 0) {
            return existingPlayers[0];
        }

        // If player doesn't exist, create new one
        const { data, error } = await supabase
            .from("players")
            .insert([{ name: name.trim(), user_id: userId }])
            .select()
            .single();

        if (error) throw error;

        return data;
    } catch (error) {
        console.error("Error creating/finding player:", error);
        throw error;
    }
};
