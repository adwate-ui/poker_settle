export interface Player {
  id: string;
  name: string;
  phone?: string;
  buyIns: number;
  finalStack: number;
  netAmount: number; // Positive = profit, Negative = loss
}

export interface Game {
  id: string;
  date: string;
  players: Player[];
  buyInAmount: number;
  isComplete: boolean;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}