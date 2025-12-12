/**
 * Hook for managing players with WhatsApp and UPI functionality
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Player } from "@/types/poker";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { normalizePlayerPaymentPreference } from "@/utils/playerUtils";
import { PlayerFormData } from "@/components/PlayerFormDialog";
import { sendPlayerWelcomeNotification } from "@/services/whatsappNotifications";
import { generatePlayerShareLink } from "@/services/messageTemplates";

export const usePlayerManagement = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  /**
   * Create a new player with optional WhatsApp and UPI details
   */
  const createPlayer = useCallback(
    async (playerData: PlayerFormData): Promise<Player> => {
      if (!user) throw new Error("User not authenticated");

      setLoading(true);
      try {
        // Normalize payment preference based on UPI ID
        const normalizedData = normalizePlayerPaymentPreference(playerData);

        const { data, error } = await supabase
          .from("players")
          .insert({
            name: normalizedData.name,
            phone_number: normalizedData.phone_number || null,
            upi_id: normalizedData.upi_id || null,
            payment_preference: normalizedData.payment_preference || "cash",
            user_id: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        // Send welcome notification if phone number is provided
        if (data.phone_number) {
          const playerLink = generatePlayerShareLink(data.id);
          const notificationResult = await sendPlayerWelcomeNotification(data, playerLink);
          
          if (notificationResult.success) {
            toast.success(`${data.name} added! Welcome message sent to WhatsApp.`);
          } else {
            toast.success(`${data.name} added! (WhatsApp notification failed: ${notificationResult.error})`);
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
        // Normalize payment preference based on UPI ID
        const normalizedData = normalizePlayerPaymentPreference(playerData);

        const { data, error } = await supabase
          .from("players")
          .update({
            ...(normalizedData.name && { name: normalizedData.name }),
            ...(normalizedData.phone_number !== undefined && {
              phone_number: normalizedData.phone_number || null,
            }),
            ...(normalizedData.upi_id !== undefined && {
              upi_id: normalizedData.upi_id || null,
            }),
            ...(normalizedData.payment_preference && {
              payment_preference: normalizedData.payment_preference,
            }),
          })
          .eq("id", playerId)
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;

        toast.success(`${data.name} updated!`);
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
