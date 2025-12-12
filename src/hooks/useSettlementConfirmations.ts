/**
 * Hook for managing settlement confirmations
 */

import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { SettlementConfirmation, Settlement } from "@/types/poker";
import { toast } from "sonner";

export const useSettlementConfirmations = () => {
  const [loading, setLoading] = useState(false);

  /**
   * Fetch settlement confirmations for a game
   */
  const fetchConfirmations = useCallback(async (gameId: string): Promise<SettlementConfirmation[]> => {
    try {
      const { data, error } = await supabase
        .from("settlement_confirmations")
        .select("*")
        .eq("game_id", gameId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching settlement confirmations:", error);
      return [];
    }
  }, []);

  /**
   * Create settlement confirmations when a game is completed
   * Uses upsert to avoid duplicate key violations
   */
  const createConfirmations = useCallback(async (
    gameId: string,
    settlements: Settlement[]
  ): Promise<void> => {
    setLoading(true);
    try {
      // Create a confirmation record for each payer (from)
      const confirmationsData = settlements.map(settlement => ({
        game_id: gameId,
        player_name: settlement.from, // The person who needs to pay
        settlement_from: settlement.from,
        settlement_to: settlement.to,
        amount: settlement.amount,
        confirmed: false,
      }));

      // Use upsert to handle existing confirmations (updates amount if changed)
      const { error } = await supabase
        .from("settlement_confirmations")
        .upsert(confirmationsData, {
          onConflict: 'game_id,player_name,settlement_from,settlement_to',
          ignoreDuplicates: false, // Update existing records with new amount
        });

      if (error) throw error;
    } catch (error) {
      console.error("Error creating settlement confirmations:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Confirm a settlement payment
   */
  const confirmSettlement = useCallback(async (
    confirmationId: string
  ): Promise<void> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("settlement_confirmations")
        .update({
          confirmed: true,
          confirmed_at: new Date().toISOString(),
        })
        .eq("id", confirmationId);

      if (error) throw error;
      toast.success("Payment confirmed!");
    } catch (error) {
      console.error("Error confirming settlement:", error);
      toast.error("Failed to confirm payment");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Unconfirm a settlement payment
   */
  const unconfirmSettlement = useCallback(async (
    confirmationId: string
  ): Promise<void> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("settlement_confirmations")
        .update({
          confirmed: false,
          confirmed_at: null,
        })
        .eq("id", confirmationId);

      if (error) throw error;
      toast.success("Payment confirmation removed");
    } catch (error) {
      console.error("Error unconfirming settlement:", error);
      toast.error("Failed to remove confirmation");
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Get confirmation status for a settlement
   */
  const getConfirmationStatus = useCallback(
    (
      confirmations: SettlementConfirmation[],
      from: string,
      to: string
    ): SettlementConfirmation | null => {
      return (
        confirmations.find(
          (c) => c.settlement_from === from && c.settlement_to === to
        ) || null
      );
    },
    []
  );

  return {
    loading,
    fetchConfirmations,
    createConfirmations,
    confirmSettlement,
    unconfirmSettlement,
    getConfirmationStatus,
  };
};
