export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      buy_in_history: {
        Row: {
          buy_ins_added: number
          created_at: string
          game_player_id: string
          id: string
          timestamp: string
          total_buy_ins_after: number
        }
        Insert: {
          buy_ins_added: number
          created_at?: string
          game_player_id: string
          id?: string
          timestamp?: string
          total_buy_ins_after: number
        }
        Update: {
          buy_ins_added?: number
          created_at?: string
          game_player_id?: string
          id?: string
          timestamp?: string
          total_buy_ins_after?: number
        }
        Relationships: [
          {
            foreignKeyName: "buy_in_history_game_player_id_fkey"
            columns: ["game_player_id"]
            isOneToOne: false
            referencedRelation: "game_players"
            referencedColumns: ["id"]
          },
        ]
      }
      game_players: {
        Row: {
          buy_ins: number
          created_at: string
          final_stack: number | null
          game_id: string
          id: string
          is_host: boolean | null
          net_amount: number | null
          player_id: string
          updated_at: string
        }
        Insert: {
          buy_ins?: number
          created_at?: string
          final_stack?: number | null
          game_id: string
          id?: string
          is_host?: boolean | null
          net_amount?: number | null
          player_id: string
          updated_at?: string
        }
        Update: {
          buy_ins?: number
          created_at?: string
          final_stack?: number | null
          game_id?: string
          id?: string
          is_host?: boolean | null
          net_amount?: number | null
          player_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "game_players_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "game_players_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      games: {
        Row: {
          big_blind: number | null
          buy_in_amount: number
          created_at: string
          date: string
          id: string
          is_complete: boolean | null
          rake: number | null
          settlements: Json | null
          small_blind: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          big_blind?: number | null
          buy_in_amount: number
          created_at?: string
          date?: string
          id?: string
          is_complete?: boolean | null
          rake?: number | null
          settlements?: Json | null
          small_blind?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          big_blind?: number | null
          buy_in_amount?: number
          created_at?: string
          date?: string
          id?: string
          is_complete?: boolean | null
          rake?: number | null
          settlements?: Json | null
          small_blind?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      player_actions: {
        Row: {
          action_sequence: number
          action_type: string
          bet_size: number | null
          created_at: string
          hand_id: string
          hole_cards: string | null
          id: string
          is_hero: boolean | null
          player_id: string
          position: string | null
          street_type: string
        }
        Insert: {
          action_sequence: number
          action_type: string
          bet_size?: number | null
          created_at?: string
          hand_id: string
          hole_cards?: string | null
          id?: string
          is_hero?: boolean | null
          player_id: string
          position?: string | null
          street_type: string
        }
        Update: {
          action_sequence?: number
          action_type?: string
          bet_size?: number | null
          created_at?: string
          hand_id?: string
          hole_cards?: string | null
          id?: string
          is_hero?: boolean | null
          player_id?: string
          position?: string | null
          street_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_actions_hand_id_fkey"
            columns: ["hand_id"]
            isOneToOne: false
            referencedRelation: "poker_hands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_actions_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      player_relationships: {
        Row: {
          created_at: string
          id: string
          player_id: string
          related_player_id: string
          relationship_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          player_id: string
          related_player_id: string
          relationship_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          player_id?: string
          related_player_id?: string
          relationship_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "player_relationships_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "player_relationships_related_player_id_fkey"
            columns: ["related_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      players: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          payment_preference: string | null
          phone_number: string | null
          total_games: number | null
          total_profit: number | null
          updated_at: string
          upi_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          payment_preference?: string | null
          phone_number?: string | null
          total_games?: number | null
          total_profit?: number | null
          updated_at?: string
          upi_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          payment_preference?: string | null
          phone_number?: string | null
          total_games?: number | null
          total_profit?: number | null
          updated_at?: string
          upi_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      poker_hands: {
        Row: {
          button_player_id: string
          created_at: string
          final_stage: string | null
          game_id: string
          hand_number: number
          hero_position: string | null
          id: string
          is_hero_win: boolean | null
          is_split: boolean | null
          positions: Json | null
          pot_size: number | null
          updated_at: string
          winner_player_id: string | null
          winner_player_ids: string[] | null
        }
        Insert: {
          button_player_id: string
          created_at?: string
          final_stage?: string | null
          game_id: string
          hand_number: number
          hero_position?: string | null
          id?: string
          is_hero_win?: boolean | null
          is_split?: boolean | null
          positions?: Json | null
          pot_size?: number | null
          updated_at?: string
          winner_player_id?: string | null
          winner_player_ids?: string[] | null
        }
        Update: {
          button_player_id?: string
          created_at?: string
          final_stage?: string | null
          game_id?: string
          hand_number?: number
          hero_position?: string | null
          id?: string
          is_hero_win?: boolean | null
          is_split?: boolean | null
          positions?: Json | null
          pot_size?: number | null
          updated_at?: string
          winner_player_id?: string | null
          winner_player_ids?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "poker_hands_button_player_id_fkey"
            columns: ["button_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poker_hands_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "poker_hands_winner_player_id_fkey"
            columns: ["winner_player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          chip_denominations: Json | null
          created_at: string
          default_big_blind: number | null
          default_buy_in: number | null
          default_rake: number | null
          default_small_blind: number | null
          email: string | null
          full_name: string | null
          gemini_api_key: string | null
          id: string
          theme: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          chip_denominations?: Json | null
          created_at?: string
          default_big_blind?: number | null
          default_buy_in?: number | null
          default_rake?: number | null
          default_small_blind?: number | null
          email?: string | null
          full_name?: string | null
          gemini_api_key?: string | null
          id: string
          theme?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          chip_denominations?: Json | null
          created_at?: string
          default_big_blind?: number | null
          default_buy_in?: number | null
          default_rake?: number | null
          default_small_blind?: number | null
          email?: string | null
          full_name?: string | null
          gemini_api_key?: string | null
          id?: string
          theme?: string
          updated_at?: string
        }
        Relationships: []
      }
      rounder_baseline_node_stats: {
        Row: {
          action: string
          archetype: string | null
          backoff_level: number
          created_at: string
          frequency: number
          id: number
          n: number
          node_key: string
        }
        Insert: {
          action: string
          archetype?: string | null
          backoff_level: number
          created_at?: string
          frequency: number
          id?: number
          n: number
          node_key: string
        }
        Update: {
          action?: string
          archetype?: string | null
          backoff_level?: number
          created_at?: string
          frequency?: number
          id?: number
          n?: number
          node_key?: string
        }
        Relationships: []
      }
      rounder_corpus_archetypes: {
        Row: {
          aggression_factor: number | null
          archetype: string
          classified: boolean
          created_at: string
          hand_count: number
          pfr: number | null
          player_hash: string
          three_bet_pct: number | null
          vpip: number | null
          wtsd: number | null
        }
        Insert: {
          aggression_factor?: number | null
          archetype: string
          classified?: boolean
          created_at?: string
          hand_count: number
          pfr?: number | null
          player_hash: string
          three_bet_pct?: number | null
          vpip?: number | null
          wtsd?: number | null
        }
        Update: {
          aggression_factor?: number | null
          archetype?: string
          classified?: boolean
          created_at?: string
          hand_count?: number
          pfr?: number | null
          player_hash?: string
          three_bet_pct?: number | null
          vpip?: number | null
          wtsd?: number | null
        }
        Relationships: []
      }
      rounder_leaks: {
        Row: {
          better_line: string
          computed_at: string
          confidence: string
          description: string
          deviation: number
          estimated_cost_bb_100: number
          example_hand_ids: string[]
          id: string
          leak_type: string
          player_id: string
          player_value: number
          shrinkage_weight: number
          target_value: number
          user_id: string
        }
        Insert: {
          better_line: string
          computed_at?: string
          confidence: string
          description: string
          deviation: number
          estimated_cost_bb_100: number
          example_hand_ids?: string[]
          id?: string
          leak_type: string
          player_id: string
          player_value: number
          shrinkage_weight: number
          target_value: number
          user_id: string
        }
        Update: {
          better_line?: string
          computed_at?: string
          confidence?: string
          description?: string
          deviation?: number
          estimated_cost_bb_100?: number
          example_hand_ids?: string[]
          id?: string
          leak_type?: string
          player_id?: string
          player_value?: number
          shrinkage_weight?: number
          target_value?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rounder_leaks_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      rounder_player_stats: {
        Row: {
          aggression_factor: number | null
          cbet_flop: number | null
          computed_at: string
          fold_to_cbet: number | null
          hand_count: number
          pfr: number | null
          player_id: string
          three_bet_pct: number | null
          user_id: string
          vpip: number | null
          wtsd: number | null
        }
        Insert: {
          aggression_factor?: number | null
          cbet_flop?: number | null
          computed_at?: string
          fold_to_cbet?: number | null
          hand_count?: number
          pfr?: number | null
          player_id: string
          three_bet_pct?: number | null
          user_id: string
          vpip?: number | null
          wtsd?: number | null
        }
        Update: {
          aggression_factor?: number | null
          cbet_flop?: number | null
          computed_at?: string
          fold_to_cbet?: number | null
          hand_count?: number
          pfr?: number | null
          player_id?: string
          three_bet_pct?: number | null
          user_id?: string
          vpip?: number | null
          wtsd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "rounder_player_stats_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: true
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      rounder_preflop_ranges: {
        Row: {
          action_class: string
          created_at: string
          id: number
          pfr_target: number | null
          position: string
          range_notation: string
          table_band: string
          vpip_target: number | null
        }
        Insert: {
          action_class: string
          created_at?: string
          id?: number
          pfr_target?: number | null
          position: string
          range_notation: string
          table_band: string
          vpip_target?: number | null
        }
        Update: {
          action_class?: string
          created_at?: string
          id?: number
          pfr_target?: number | null
          position?: string
          range_notation?: string
          table_band?: string
          vpip_target?: number | null
        }
        Relationships: []
      }
      settlement_confirmations: {
        Row: {
          amount: number
          confirmed: boolean | null
          confirmed_at: string | null
          created_at: string
          game_id: string
          id: string
          player_name: string
          settlement_from: string
          settlement_to: string
          updated_at: string
        }
        Insert: {
          amount: number
          confirmed?: boolean | null
          confirmed_at?: string | null
          created_at?: string
          game_id: string
          id?: string
          player_name: string
          settlement_from: string
          settlement_to: string
          updated_at?: string
        }
        Update: {
          amount?: number
          confirmed?: boolean | null
          confirmed_at?: string | null
          created_at?: string
          game_id?: string
          id?: string
          player_name?: string
          settlement_from?: string
          settlement_to?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "settlement_confirmations_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_links: {
        Row: {
          access_token: string
          created_at: string
          id: string
          resource_id: string
          resource_type: string
          short_code: string
          user_id: string
        }
        Insert: {
          access_token?: string
          created_at?: string
          id?: string
          resource_id: string
          resource_type: string
          short_code: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          id?: string
          resource_id?: string
          resource_type?: string
          short_code?: string
          user_id?: string
        }
        Relationships: []
      }
      street_cards: {
        Row: {
          cards_notation: string
          created_at: string
          hand_id: string
          id: string
          street_type: string
        }
        Insert: {
          cards_notation: string
          created_at?: string
          hand_id: string
          id?: string
          street_type: string
        }
        Update: {
          cards_notation?: string
          created_at?: string
          hand_id?: string
          id?: string
          street_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "street_cards_hand_id_fkey"
            columns: ["hand_id"]
            isOneToOne: false
            referencedRelation: "poker_hands"
            referencedColumns: ["id"]
          },
        ]
      }
      table_positions: {
        Row: {
          created_at: string
          game_id: string
          id: string
          positions: Json
          snapshot_timestamp: string
        }
        Insert: {
          created_at?: string
          game_id: string
          id?: string
          positions?: Json
          snapshot_timestamp?: string
        }
        Update: {
          created_at?: string
          game_id?: string
          id?: string
          positions?: Json
          snapshot_timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "table_positions_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
        ]
      }
      user_api_keys: {
        Row: {
          created_at: string
          gemini_api_key: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          gemini_api_key: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          gemini_api_key?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_notification_queue: {
        Row: {
          created_at: string
          error: string | null
          game_id: string
          id: string
          message_text: string
          phone_number: string
          player_id: string
          sent_at: string | null
          status: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          game_id: string
          id?: string
          message_text: string
          phone_number: string
          player_id: string
          sent_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          game_id?: string
          id?: string
          message_text?: string
          phone_number?: string
          player_id?: string
          sent_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_notification_queue_game_id_fkey"
            columns: ["game_id"]
            isOneToOne: false
            referencedRelation: "games"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_notification_queue_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_game_via_player_link: {
        Args: { _game_id: string; _token: string }
        Returns: boolean
      }
      can_view_player: {
        Args: { _player_id: string; _token: string }
        Returns: boolean
      }
      can_view_player_in_game_context: {
        Args: { _player_id: string; _token: string }
        Returns: boolean
      }
      claim_pending_whatsapp_notifications: {
        Args: { batch_size?: number }
        Returns: {
          created_at: string
          error: string | null
          game_id: string
          id: string
          message_text: string
          phone_number: string
          player_id: string
          sent_at: string | null
          status: string
        }[]
        SetofOptions: {
          from: "*"
          to: "whatsapp_notification_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_next_hand_number: { Args: never; Returns: number }
      get_shared_link_owner: { Args: { _token: string }; Returns: string }
      has_any_valid_link: {
        Args: { _token: string; _user_id: string }
        Returns: boolean
      }
      is_valid_game_link: {
        Args: { _game_id: string; _token: string }
        Returns: boolean
      }
      is_valid_player_link: {
        Args: { _player_id: string; _token: string }
        Returns: boolean
      }
      resolve_short_link: {
        Args: { _short_code: string }
        Returns: {
          access_token: string
          resource_id: string
          resource_type: string
        }[]
      }
      validate_share_token: {
        Args: { _token: string }
        Returns: {
          resource_id: string
          resource_type: string
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
