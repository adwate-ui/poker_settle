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