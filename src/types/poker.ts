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
  isManual?: boolean;
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
  is_split?: boolean | null;
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

// ─── Player Dashboard Types ────────────────────────────────────────────────

export interface SessionStats {
  totalGames: number;
  totalProfit: number;
  totalInvested: number;
  roi: number;                    // percentage, e.g. 42.5
  winRate: number;                // percentage, e.g. 60.0
  avgProfitPerSession: number;
  avgBuyinsPerSession: number;
  biggestWin: number;
  biggestLoss: number;
  currentStreak: number;          // positive = wins, negative = losses, e.g. 3 or -2
  bestWinStreak: number;
}

export interface MonthlyStats {
  month: string;                  // display label, e.g. "Jan 2026"
  monthKey: string;               // sortable key, e.g. "2026-01"
  profit: number;
  sessions: number;
  winRate: number;                // percentage
}

export interface CumulativePnLPoint {
  date: string;                   // formatted display label, e.g. "Jan 5"
  rawDate: string;                // ISO string for sorting
  sessionPnl: number;
  cumulative: number;
}

export interface DistributionBucket {
  label: string;                  // e.g. "0 to 1k"
  count: number;
  isProfit: boolean;
}

export interface DashboardFilters {
  timePeriod: 'all' | '3m' | '6m' | 'ytd' | 'lastyear';
  month: 'all' | string;          // 'all' or 'MMM yyyy', e.g. "Jan 2026"
  stakes: 'all' | number;         // 'all' or specific buy_in_amount
  result: 'all' | 'wins' | 'losses';
}

// Dashboard-augmented GameHistory (includes buy_in_amount for ROI calc)
export interface DashboardGameHistory {
  id: string;
  game_id: string;
  buy_ins: number;
  final_stack: number;
  net_amount: number;
  games: {
    id: string;
    date: string;
    buy_in_amount: number;
    small_blind?: number;
    big_blind?: number;
  };
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