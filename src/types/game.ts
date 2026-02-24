export type TokenId = string;

export interface Token {
  id: TokenId;
  name: string;
  symbol: string;
  color: string;
  imageUrl?: string;
  startPrice: number;
  currentPrice: number;
  performance: number; // Percentage change
  position: number;   // 0 to 100 representing percentage around the track
}

export interface PastRace {
  id: string;
  winner: Token;
  date: Date;
  duration: number;
}

export type GamePhase = 'BETTING' | 'LOCKED' | 'RACING' | 'PHOTO_FINISH' | 'FINISHED';

// 5 minutes total = 300 seconds
// BETTING: 3 minutes 30 seconds
// LOCKED: 30 seconds
// RACING: 60 seconds
// FINISHED: 10 seconds (before looping)
export const PHASE_DURATIONS = {
  BETTING: 180, // 3 mins actually, let's make it shorter for MVP
  LOCKED: 30,
  RACING: 60,
  FINISHED: 30,
};

export interface Bet {
  userId: string;
  tokenId: TokenId;
  amount: number;
}
