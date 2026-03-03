export type ContenderId = string;
export type TrackId = 'casual' | 'pro' | 'high_roller';

export type GameMode = 'CRYPTO' | 'FOOTBALL';

export type FootballEventType = 'Touch' | 'Pass' | 'ForwardPass' | 'KeyPass' | 'Shot' | 'ShotOnTarget' | 'Assist' | 'Goal' | 'Dispossessed' | 'YellowCard' | 'RedCard';

export interface FootballEvent {
  id: string;
  type: FootballEventType;
  points: number;
  timestamp: number; // relative to racingTimePassed
}

// Generalized participant in the race
export interface Contender {
  id: ContenderId;
  name: string;
  symbol: string;      // e.g., 'BTC' or 'MCI' (Man City)
  color: string;
  imageUrl?: string;

  // Generic Metrics
  startMetric: number;   // e.g., Start Price (65000) or Start Touches (0)
  currentMetric: number; // e.g., Current Price (66000) or Current Touches (15)
  targetMetric?: number; // Needed for Football (e.g. 35 Touches to win)

  performance: number;   // Percentage change for Crypto
  position: number;      // 0 to 100 representing percentage around the track
  recentEvents?: FootballEvent[]; // Football rolling 30s window events
}

export interface PastRace {
  id: string;
  mode: GameMode;
  winner: Contender;
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
  contenderId: ContenderId;
  amount: number;
  trackId: TrackId;
}
