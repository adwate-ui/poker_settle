export interface Player {
  id: string;
  name: string;
  total_games: number;
  total_profit: number;
  /** @deprecated Use phone_number instead for WhatsApp integration */
  email?: string;
  phone_number?: string;
  upi_id?: string;
  payment_preference?: string;
}

export interface GamePlayer {
  id: string;
  game_id: string;
  player_id: string;
  player: Player;
  buy_ins: number; // Strict number
  final_stack: number; // Strict number
  net_amount: number; // Strict number
}

export interface Game {
  id: string;
  date: string;
  buy_in_amount: number;
  is_complete: boolean;
  small_blind?: number;
  big_blind?: number;
  game_players: GamePlayer[];
  settlements?: Settlement[];
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface SettlementConfirmation {
  id: string;
  game_id: string;
  player_name: string;
  settlement_from: string;
  settlement_to: string;
  amount: number;
  confirmed: boolean;
  confirmed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface SeatPosition {
  seat: number;
  player_id: string;
  player_name: string;
}

// Helper type for Supabase JSON compatibility
export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface TablePositionInsert {
  game_id: string;
  positions: Json; // Supabase expects strictly JSON type for jsonb columns
  snapshot_timestamp: string;
}

export interface TablePosition {
  id: string;
  game_id: string;
  snapshot_timestamp: string;
  positions: SeatPosition[];
  created_at: string;
}

export interface PokerHand {
  id: string;
  game_id: string;
  hand_number: number;
  button_player_id: string;
  pot_size: number;
  final_stage: 'Preflop' | 'Flop' | 'Turn' | 'River' | 'Showdown';
  winner_player_id: string | null;
  winner_player_ids: string[];
  hero_position: string | null;
  is_hero_win: boolean | null;
  positions?: SeatPosition[];
  created_at: string;
  updated_at: string;
}

export interface StreetCard {
  id: string;
  hand_id: string;
  street_type: 'Flop' | 'Turn' | 'River';
  cards_notation: string;
  created_at: string;
}

export interface PlayerAction {
  id: string;
  hand_id: string;
  player_id: string;
  street_type: 'Preflop' | 'Flop' | 'Turn' | 'River';
  action_sequence: number;
  action_type: 'Small Blind' | 'Big Blind' | 'Straddle' | 'Re-Straddle' | 'Check' | 'Call' | 'Raise' | 'Fold' | 'All-In';
  bet_size: number;
  is_hero: boolean;
  hole_cards: string | null;
  position: string | null;
  created_at: string;
}

export interface BuyInHistory {
  id: string;
  game_player_id: string;
  timestamp: string;
  buy_ins_added: number;
  total_buy_ins_after: number;
  created_at: string;
}

// Database record types (for any unknown fields from DB)
export type DatabaseRecord = Record<string, unknown>;

// Error response type
export interface DatabaseError {
  message: string;
  details?: string;
  hint?: string;
  code?: string;
}