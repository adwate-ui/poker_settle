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
      players: {
        Row: {
          created_at: string
          id: string
          name: string
          total_games: number | null
          total_profit: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          total_games?: number | null
          total_profit?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          total_games?: number | null
          total_profit?: number | null
          updated_at?: string
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
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          theme: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          theme?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          theme?: string
          updated_at?: string
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_view_player: {
        Args: { _player_id: string; _token: string }
        Returns: boolean
      }
      can_view_player_in_game_context: {
        Args: { _player_id: string; _token: string }
        Returns: boolean
      }
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
