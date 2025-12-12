/**
 * Hook for managing players with email and UPI functionality
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Player } from "@/types/poker";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { PlayerFormData } from "@/components/PlayerFormDialog";
import { sendPlayerWelcomeNotification } from "@/services/emailNotifications";
import { generatePlayerShareLink } from "@/services/messageTemplates";

export const usePlayerManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  /**
   * Create a new player with optional email and UPI details
   */
  const createPlayer = useCallback(
    async (playerData: PlayerFormData): Promise<Player> => {
      if (!user) throw new Error("User not authenticated");

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("players")
          .insert({
            name: playerData.name,
            email: playerData.email || null,
            upi_id: playerData.upi_id || null,
            payment_preference: playerData.payment_preference || "upi",
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        // Send welcome notification if email is provided
        if (data.email) {
          const playerLink = generatePlayerShareLink(data.id);
          const notificationResult = await sendPlayerWelcomeNotification(data, playerLink);
          
          if (notificationResult.success) {
            toast.success(`${data.name} added! Welcome email sent.`);
          } else {
            toast.success(`${data.name} added! (Email notification failed: ${notificationResult.error})`);
          }
        } else {
          toast.success(`${data.name} added!`);
        }

        return data;
      } catch (error) {
        console.error("Error creating player:", error);
        if (error instanceof Error) {
          toast.error(`Failed to create player: ${error.message}`);
        } else {
          toast.error("Failed to create player");
        }
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  /**
   * Update an existing player
   */
  const updatePlayer = useCallback(
    async (playerId: string, playerData: Partial<PlayerFormData>): Promise<Player> => {
      if (!user) throw new Error("User not authenticated");

      setLoading(true);
      try {
        // Check if email is being added (before making the update)
        // Only fetch if email is being updated to avoid unnecessary query
        let isAddingEmail = false;
        if (playerData.email !== undefined) {
          const { data: currentPlayer, error: fetchError } = await supabase
            .from("players")
            .select("email")
            .eq("id", playerId)
            .eq("user_id", user.id)
            .single();

          if (fetchError) throw fetchError;

          isAddingEmail = !currentPlayer.email && !!playerData.email;
        }

        // Build update object, treating empty strings as null to clear fields
        const updateData: {
          name?: string;
          email?: string | null;
          upi_id?: string | null;
          payment_preference?: 'upi' | 'cash';
        } = {};
        
        if (playerData.name) {
          updateData.name = playerData.name;
        }
        
        // Allow clearing email by passing empty string -> convert to null
        if (playerData.email !== undefined) {
          updateData.email = playerData.email || null;
        }
        
        // Allow clearing upi_id by passing empty string -> convert to null
        if (playerData.upi_id !== undefined) {
          updateData.upi_id = playerData.upi_id || null;
        }
        
        // Allow updating payment_preference
        if (playerData.payment_preference !== undefined) {
          updateData.payment_preference = playerData.payment_preference;
        }

        const { data, error } = await supabase
          .from("players")
          .update(updateData)
          .eq("id", playerId)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;

        // If email was just added, treat this as onboarding and send welcome notification
        if (isAddingEmail && data.email) {
          const playerLink = generatePlayerShareLink(data.id);
          const notificationResult = await sendPlayerWelcomeNotification(data, playerLink);
          
          if (notificationResult.success) {
            toast.success(`${data.name} updated! Welcome email sent.`);
          } else {
            toast.success(`${data.name} updated! (Email notification failed: ${notificationResult.error})`);
          }
        } else {
          toast.success(`${data.name} updated!`);
        }

        return data;
      } catch (error) {
        console.error("Error updating player:", error);
        if (error instanceof Error) {
          toast.error(`Failed to update player: ${error.message}`);
        } else {
          toast.error("Failed to update player");
        }
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [user]
  );

  /**
   * Create or find player by name (backward compatibility)
   * This is a simpler version for cases where only name is needed
   */
  const createOrFindPlayerByName = useCallback(
    async (name: string): Promise<Player> => {
      if (!user) throw new Error("User not authenticated");

      try {
        // First check if player exists
        const { data: existingPlayers, error: searchError } = await supabase
          .from("players")
          .select("*")
          .eq("name", name.trim())
          .eq("user_id", user.id)
          .limit(1);

        if (searchError) throw searchError;

        if (existingPlayers && existingPlayers.length > 0) {
          return existingPlayers[0];
        }

        // Create new player with just name
        return await createPlayer({
          name: name.trim(),
        });
      } catch (error) {
        console.error("Error creating/finding player:", error);
        throw error;
      }
    },
    [user, createPlayer]
  );

  return {
    createPlayer,
    updatePlayer,
    createOrFindPlayerByName,
    loading,
  };
};
