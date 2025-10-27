export interface Player {
  id: string;
  name: string;
  total_games: number;
  total_profit: number;
}

export interface GamePlayer {
  id: string;
  game_id: string;
  player_id: string;
  player: Player;
  buy_ins: number;
  final_stack: number;
  net_amount: number;
}

export interface Game {
  id: string;
  date: string;
  buy_in_amount: number;
  is_complete: boolean;
  small_blind?: number;
  big_blind?: number;
  game_players: GamePlayer[];
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface SeatPosition {
  seat: number;
  player_id: string;
  player_name: string;
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
  hero_position: string | null;
  is_hero_win: boolean | null;
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
  created_at: string;
}