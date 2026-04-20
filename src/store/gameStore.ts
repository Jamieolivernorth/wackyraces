import { create } from 'zustand';
import { Contender, ContenderId, GamePhase, Bet, GameMode, PHASE_DURATIONS, PastRace, TrackId } from '../types/game';
import { calculateMovement, calculateFootballMovement } from '../lib/mathEngine';
import { getRandomContenders, getFootballContenders, getRandomMemeContenders, TOP_TOKENS, MEME_TOKENS } from '../lib/tokens';
import { binanceFeed } from '../lib/binanceFeed';
import { footballSimulator, getRoleFromIndex } from '../lib/footballEngine';

export interface TrackConfig {
    id: TrackId;
    name: string;
    entryFee: number;
    minPlayers: number;
    platformSeed: number;
    currency: 'CASH' | 'COINS';
}

export const TRACK_CONFIGS: Record<TrackId, TrackConfig> = {
    casual: { id: 'casual', name: 'Le Mans (Casual)', entryFee: 100, minPlayers: 10, platformSeed: 0, currency: 'COINS' },
    sponsored_weekly: { id: 'sponsored_weekly', name: '$1K Weekly Splash', entryFee: 1000, minPlayers: 10, platformSeed: 0, currency: 'COINS' },
    pro: { id: 'pro', name: 'Monaco (Pro)', entryFee: 10, minPlayers: 10, platformSeed: 0, currency: 'CASH' },
    high_roller: { id: 'high_roller', name: 'Mount Panorama (High Roller)', entryFee: 50, minPlayers: 10, platformSeed: 0, currency: 'CASH' },
};

// Timing configurations
const TICK_RATE_MS = 1000;
export interface MatchDayConfig {
    provider: 'Mock Engine' | 'Opta' | 'StatsPerform';
    apiKey?: string;
    matchId?: string;
    players: Record<string, Omit<Contender, 'id'>>;
}

interface GameState {
    mode: GameMode;
    phase: GamePhase;
    phaseTimeRemaining: number;
    isMatchDayActive: boolean;
    matchDayConfig: MatchDayConfig | null;
    contenders: Record<ContenderId, Contender>;
    upcomingRaces: Record<ContenderId, Contender>[];
    bets: Bet[];
    stagedBets: Bet[];
    userBalance: number;
    wcBalance: number;
    lastWinner: ContenderId | null;
    history: PastRace[];
    raceId: number;
    walletAddress: string | null;
    alphaLeaks: { contender: Contender, text: string }[];
    racingTimePassed: number;
    currentRake: number;
    referralFee: number;
    onchainEnabled: boolean;
    selectedTrackId: TrackId | null;
    lastPayout: number;
    isPrivateRace: boolean;
}

export interface GameActions {
    placeBet: (contenderId: ContenderId, amount: number, userId?: string, token?: string) => void;
    stageBet: (contenderId: ContenderId, amount: number) => void;
    removeStagedBet: (index: number) => void;
    confirmBets: (token?: string) => void;
    tickTimer: () => void;
    resetRace: () => void;
    updateRaceTick: (speedMultiplier?: number) => void;
    updateLivePrice: (symbol: string, currentPrice: number) => void;
    updateLiveTouches: (contenderId: ContenderId, newTouches: number) => void;
    setUserBalance: (amount: number) => void;
    setWcBalance: (amount: number) => void;
    setWalletAddress: (address: string | null) => void;
    fetchSettings: () => Promise<void>;
    setGameMode: (mode: GameMode, targetTouches?: number) => void;
    setSelectedTrack: (trackId: TrackId | null) => void;
    setMatchDayActive: (isActive: boolean) => void;
    setMatchDayConfig: (config: MatchDayConfig | null) => void;
    startPrivateRace: (participants: any[], entryFee: number) => void;
}

// Initial setup
const initialContenders = getRandomContenders() as Record<ContenderId, Contender>;
const initialUpcoming = [
    getRandomContenders() as Record<ContenderId, Contender>,
    getRandomContenders() as Record<ContenderId, Contender>,
    getRandomContenders() as Record<ContenderId, Contender>
];

// Listen to initial set
binanceFeed.subscribe(Object.keys(initialContenders));

export const useGameStore = create<GameState & GameActions>((set, get) => {
    // Note: binanceFeed.subscribe is handled above outside the store hook
    binanceFeed.setCallback((symbol, price) => {
        get().updateLivePrice(symbol, price);
    });

    return {
        mode: 'CRYPTO',
        isMatchDayActive: false,
        matchDayConfig: null,
        phase: 'BETTING',
        phaseTimeRemaining: PHASE_DURATIONS.BETTING,
        contenders: initialContenders,
        upcomingRaces: initialUpcoming,
        bets: [],
        stagedBets: [],
        userBalance: 0,
        wcBalance: 10000,
        lastWinner: null,
        history: [],
        raceId: 1,
        walletAddress: null,
        onchainEnabled: false,
        alphaLeaks: [],
        racingTimePassed: 0,
        currentRake: 0.10, // 10% default
        referralFee: 0.05, // 5% default
        selectedTrackId: null,
        lastPayout: 0,
        isPrivateRace: false,

        setSelectedTrack: (trackId: TrackId | null) => set({ selectedTrackId: trackId }),
        setGameMode: (mode: GameMode, targetTouches?: number) => set({ mode }),

        setWalletAddress: (address: string | null) => set({ walletAddress: address }),
        setUserBalance: (amount: number) => set({ userBalance: amount }),
        setWcBalance: (amount: number) => set({ wcBalance: amount }),

        fetchSettings: async () => {
            try {
                const res = await fetch('/api/admin/settings');
                if (res.ok) {
                    const data = await res.json();
                    set({
                        currentRake: data.current_rake,
                        referralFee: data.referral_fee,
                        onchainEnabled: data.onchain_enabled === true
                    });
                }
            } catch (e) {
                console.error("Failed to fetch settings", e);
            }
        },
        // Actions
        stageBet: (contenderId: ContenderId, amount: number) => {
            const { userBalance, wcBalance, stagedBets, bets, phase, selectedTrackId } = get();
            if (phase !== 'BETTING' || !selectedTrackId) return;

            const track = TRACK_CONFIGS[selectedTrackId];

            // Fixed Entry Only (no variable sizing)
            if (amount !== track.entryFee) return;

            // Enforce exactly one entry per user across BOTH staged and confirmed bets FOR THIS TRACK
            const hasDraftEntry = stagedBets.some(b => b.userId === 'me' && b.trackId === selectedTrackId);
            const hasConfirmedEntry = bets.some(b => b.userId === 'me' && b.trackId === selectedTrackId);
            if (hasDraftEntry || hasConfirmedEntry) return;

            const isCoins = track.currency === 'COINS';
            if (isCoins && amount > wcBalance) return;
            if (!isCoins && amount > userBalance) return;

            set({
                // allow multiple staged bets if they are across different tracks, 
                // but user can only build 1 slip per track.
                stagedBets: [...stagedBets, { contenderId, amount, userId: 'me', trackId: selectedTrackId, currency: track.currency }]
            });
        },

        removeStagedBet: (index: number) => {
            const { stagedBets } = get();
            const newStaged = [...stagedBets];
            newStaged.splice(index, 1);
            set({ stagedBets: newStaged });
        },

        confirmBets: async (token?: string) => {
            const { stagedBets, userBalance, wcBalance, walletAddress, phase } = get();
            if (phase !== 'BETTING' || stagedBets.length === 0) return;

            // Separate the bets by currency to ensure safe totals
            const cashBets = stagedBets.filter(b => b.currency === 'CASH');
            const coinBets = stagedBets.filter(b => b.currency === 'COINS');
            
            const totalCash = cashBets.reduce((sum, b) => sum + b.amount, 0);
            const totalCoins = coinBets.reduce((sum, b) => sum + b.amount, 0);

            if (totalCash > userBalance || totalCoins > wcBalance) return; // safety check

            // Optimistic UI update
            set((state) => ({
                userBalance: state.userBalance - totalCash,
                wcBalance: state.wcBalance - totalCoins,
                bets: [...state.bets, ...state.stagedBets],
                stagedBets: []
            }));

            if (walletAddress) {
                for (const bet of stagedBets) {
                    try {
                        fetch('/api/user/bet', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                            },
                            body: JSON.stringify({ wallet: walletAddress, amount: bet.amount, currency: bet.currency })
                        }).catch(err => console.error("Failed to sync staged bet", err));
                    } catch (err) {
                        console.error("Betting error", err);
                    }
                }
            }
        },

        placeBet: async (contenderId: ContenderId, amount: number, walletPublicKey?: string, token?: string) => {
            const { userBalance, phase, bets, selectedTrackId } = get();
            if (phase !== 'BETTING' || !selectedTrackId) return;

            const track = TRACK_CONFIGS[selectedTrackId];
            if (amount !== track.entryFee || amount > userBalance) return;

            // Keep exactly 1 entry per track
            if (bets.some(b => b.userId === 'me' && b.trackId === selectedTrackId)) return;

            // Optimistic UI Update first
            set({
                userBalance: userBalance - amount,
                bets: [...get().bets, { contenderId, amount, userId: 'me', trackId: selectedTrackId }]
            });

            if (walletPublicKey) {
                try {
                    // Background sync
                    fetch('/api/user/bet', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                        },
                        body: JSON.stringify({ wallet: walletPublicKey, amount })
                    }).catch(err => console.error("Failed to sync bet", err));
                } catch (err) {
                    console.error("Betting error", err);
                }
            }
        },

        updateLivePrice: (symbol: string, livePrice: number) => {
            const { contenders, phase } = get();
            if (phase !== 'BETTING' && phase !== 'RACING') return;

            const contenderIdToUpdate = Object.keys(contenders).find(
                k => contenders[k].symbol === symbol
            );

            if (contenderIdToUpdate) {
                set((state: GameState) => ({
                    contenders: {
                        ...state.contenders,
                        [contenderIdToUpdate]: {
                            ...state.contenders[contenderIdToUpdate],
                            currentMetric: livePrice,
                            performance: state.phase === 'RACING'
                                ? (livePrice - state.contenders[contenderIdToUpdate].startMetric) / state.contenders[contenderIdToUpdate].startMetric
                                : 0
                        }
                    }
                }));
            }
        },

        updateLiveTouches: (contenderId: ContenderId, touches: number) => {
            const { contenders, phase, mode } = get();
            if (mode !== 'FOOTBALL' || phase === 'LOCKED' || phase === 'FINISHED' || phase === 'BETTING') return;

            if (contenders[contenderId]) {
                set((state: GameState) => ({
                    contenders: {
                        ...state.contenders,
                        [contenderId]: {
                            ...state.contenders[contenderId],
                            currentMetric: touches
                        }
                    }
                }));
            }
        },

        tickTimer: () => {
            const { phase, phaseTimeRemaining, contenders, racingTimePassed } = get();

            if (phase === 'RACING') {
                const newTimePassed = racingTimePassed + 1;
                set({ racingTimePassed: newTimePassed });
                get().updateRaceTick();

                // Football Mode Simulation (Fire new events every few seconds to build the rolling window)
                if (get().mode === 'FOOTBALL' && newTimePassed % 3 === 0) {
                    const currentContenders = get().contenders;
                    const matchConfigPlayers = get().matchDayConfig?.players;

                    const newContenders = { ...currentContenders };
                    let eventsFired = false;

                    Object.keys(newContenders).forEach((key, index) => {
                        // Prefer the admin defined role, otherwise fallback to positional index
                        const customRole = matchConfigPlayers && matchConfigPlayers[key] ? (matchConfigPlayers[key] as any).role : undefined;
                        const role = customRole || newContenders[key as ContenderId].position_type || getRoleFromIndex(index);

                        const event = footballSimulator.generateEvent(role as any, newTimePassed);
                        if (event) {
                            newContenders[key as ContenderId].recentEvents = [
                                ...(newContenders[key as ContenderId].recentEvents || []),
                                event
                            ];
                            eventsFired = true;
                        }
                    });

                    if (eventsFired) {
                        set({ contenders: newContenders });
                    }
                }

                // Check if ANY token has hit 98 to trigger Photo Finish
                const currentContenders = get().contenders;
                const hasCrossedLine = Object.values(currentContenders).some((c: any) => c.position >= 98);

                // Football mode time limit is 300s
                const isFootballTimeUp = get().mode === 'FOOTBALL' && newTimePassed >= 300;

                if (hasCrossedLine || isFootballTimeUp) {
                    set({ phase: 'PHOTO_FINISH', phaseTimeRemaining: 5 });
                }
            } else if (phaseTimeRemaining > 0) {
                set({ phaseTimeRemaining: phaseTimeRemaining - 1 });

                if (phase === 'PHOTO_FINISH') {
                    get().updateRaceTick(0.4);
                    set({ racingTimePassed: racingTimePassed + 1 });
                }
            } else {
                switch (phase) {
                    case 'BETTING':
                        let refundAmount = 0;
                        const nextBets: Bet[] = [];

                        Object.values(TRACK_CONFIGS).forEach(track => {
                            const trackBets = get().bets.filter(b => b.trackId === track.id);
                            const uniquePlayers = new Set(trackBets.map(b => b.userId)).size;

                            if (uniquePlayers > 0 && uniquePlayers < track.minPlayers) {
                                // Refund this track
                                trackBets.forEach(b => {
                                    if (b.userId === 'me') refundAmount += b.amount;
                                });
                                console.log(`[${track.name}] Race minimum not met (${uniquePlayers}/${track.minPlayers}). Refunded pool.`);
                            } else {
                                // Keep these bets
                                nextBets.push(...trackBets);
                            }
                        });

                        set((state: GameState) => ({
                            userBalance: state.userBalance + refundAmount,
                            bets: nextBets,
                            phaseTimeRemaining: PHASE_DURATIONS.LOCKED,
                            phase: 'LOCKED'
                        }));
                        break;
                    case 'LOCKED':
                        const readyContenders = { ...contenders };
                        Object.keys(readyContenders).forEach((k) => {
                            const c = readyContenders[k];
                            c.startMetric = c.currentMetric;
                            c.performance = 0;
                            c.position = 0;
                        });
                        set({ phase: 'RACING', phaseTimeRemaining: 0, racingTimePassed: 0, contenders: readyContenders });
                        break;
                    case 'PHOTO_FINISH':
                        const winnerContender = Object.values(contenders).reduce((max: any, c: any) => c.position > max.position ? c : max);
                        const winnerId = winnerContender.id;

                        const { bets, history, raceId, walletAddress, racingTimePassed: finalDuration, currentRake, referralFee, mode } = get();

                        let totalPoolVolume = 0;
                        let totalRake = 0;
                        let totalAmountWon = 0; // Total numerical value just for history
                        let winnerships: { wallet: string; amount: number; currency: 'CASH' | 'COINS' }[] = [];

                        Object.values(TRACK_CONFIGS).forEach(track => {
                            const trackBets = bets.filter(b => b.trackId === track.id);
                            if (trackBets.length === 0) return;

                            const totalPlayerPool = trackBets.reduce((sum: number, b: any) => sum + b.amount, 0);
                            const rake = totalPlayerPool * currentRake;
                            const netPool = (totalPlayerPool - rake) + track.platformSeed;

                            const winningBets = trackBets.filter((b: any) => b.contenderId === winnerId);
                            const totalWinningBetsAmount = winningBets.reduce((sum: number, b: any) => sum + b.amount, 0);

                            let payoutToUser = 0;
                            if (totalWinningBetsAmount > 0) {
                                const userWinningBets = winningBets.filter((b: any) => b.userId === 'me');
                                const userWinningAmount = userWinningBets.reduce((sum: number, b: any) => sum + b.amount, 0);
                                payoutToUser = (userWinningAmount / totalWinningBetsAmount) * netPool;
                            } else {
                                // Case 0 winners. Refund everyone their original entry, seed carried over.
                                console.log(`[${track.name}] No winners. Refunding entries.`);
                                const myLostBet = trackBets.find(b => b.userId === 'me');
                                if (myLostBet) payoutToUser = myLostBet.amount;
                            }

                            if (payoutToUser > 0 && walletAddress) {
                                let payoutCurrency = track.currency;
                                if (track.id === 'sponsored_weekly') payoutCurrency = 'CASH'; // sweepstakes override
                                
                                winnerships.push({ wallet: walletAddress, amount: Math.floor(payoutToUser), currency: payoutCurrency });
                                totalAmountWon += Math.floor(payoutToUser);
                            }

                            totalPoolVolume += totalPlayerPool;
                            totalRake += rake;
                        });

                        if (walletAddress && totalPoolVolume > 0) {
                            fetch(`/api/user?wallet=${walletAddress}`)
                                .then(res => res.json())
                                .then(user => {
                                    const referrerWallet = user.referred_by;
                                    const refBonus = totalAmountWon > 0 ? (totalPoolVolume * referralFee) : 0;
                                    const referrers = referrerWallet && refBonus > 0 ? [{ wallet: referrerWallet, amount: refBonus, currency: 'CASH' as const }] : [];
                                    const houseRakeValue = referrerWallet && refBonus > 0 ? (totalPoolVolume * (currentRake - referralFee)) : totalRake;

                                    const payload = {
                                        winnerships: winnerships,
                                        referrers,
                                        houseRake: houseRakeValue,
                                        poolVolume: totalPoolVolume,
                                        participantResult: {
                                            wallet: walletAddress,
                                            isWinner: totalAmountWon > 0,
                                            amountWon: totalAmountWon,
                                            raceId: `RACE-${raceId}`,
                                            mode: mode
                                        }
                                    };

                                    return fetch('/api/race/payout', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(payload)
                                    });
                                })
                                .then(() => fetch(`/api/user?wallet=${walletAddress}`))
                                .then(res => res.json())
                                .then(data => {
                                    if (data) {
                                        if (data.balance !== undefined) set({ userBalance: data.balance });
                                        if (data.wc_balance !== undefined) set({ wcBalance: data.wc_balance });
                                    }
                                })
                                .catch(err => console.error("Payout error:", err));
                        }

                        const nextHistory = [{
                            id: `RACE-${raceId}`,
                            mode: mode,
                            winner: winnerContender,
                            date: new Date(),
                            duration: finalDuration
                        }, ...history].slice(0, 10);

                        set((state: any) => ({
                            phase: 'FINISHED',
                            phaseTimeRemaining: PHASE_DURATIONS.FINISHED,
                            lastWinner: winnerId,
                            lastPayout: totalAmountWon,
                            history: nextHistory,
                            raceId: state.raceId + 1
                        }));
                        break;
                    case 'FINISHED':
                        get().resetRace();
                        break;
                }
            }
        },

        updateRaceTick: (speedMultiplier: number = 1) => {
            const { contenders, mode } = get();
            const activeContenders = { ...contenders };

            if (mode === 'CRYPTO') {
                Object.keys(activeContenders).forEach((key) => {
                    const c = activeContenders[key];
                    c.performance = c.startMetric > 0 ? (c.currentMetric - c.startMetric) / c.startMetric : 0;
                });
                const movedContenders = calculateMovement(activeContenders, speedMultiplier);
                set({ contenders: movedContenders });
            } else if (mode === 'FOOTBALL') {
                const movedContenders = calculateFootballMovement(activeContenders, get().racingTimePassed);
                set({ contenders: movedContenders });
            }
        },

        setMatchDayActive: (isActive: boolean) => {
            const newMode = isActive ? 'FOOTBALL' : 'CRYPTO';
            set({ isMatchDayActive: isActive, mode: newMode });
            get().resetRace(); // Immediately flip the app over
        },

        setMatchDayConfig: (config: MatchDayConfig | null) => {
            set({ matchDayConfig: config });
        },

        resetRace: () => {
            const { upcomingRaces, mode, isMatchDayActive, matchDayConfig } = get();

            let nextContenders: Record<ContenderId, Contender>;

            if (isMatchDayActive && matchDayConfig && matchDayConfig.players) {
                // Convert Admin Dictionary to live Contenders
                nextContenders = {} as Record<ContenderId, Contender>;
                Object.entries(matchDayConfig.players).forEach(([id, playerProps]) => {
                    nextContenders[id as ContenderId] = {
                        id: id as ContenderId,
                        ...playerProps,
                        recentEvents: []
                    };
                });
            } else {
                nextContenders = upcomingRaces[0];
            }

            const nextUpcoming = [
                upcomingRaces[1],
                upcomingRaces[2],
                mode === 'FOOTBALL' ? getFootballContenders() as Record<ContenderId, Contender> :
                    mode === 'MEME' ? getRandomMemeContenders() as Record<ContenderId, Contender> :
                        getRandomContenders() as Record<ContenderId, Contender>
            ];

            // Connect WS to the new tokens
            if (mode === 'CRYPTO' || mode === 'MEME') {
                binanceFeed.subscribe(Object.keys(nextContenders));
            }

            set({
                mode: mode,
                phase: 'BETTING',
                phaseTimeRemaining: PHASE_DURATIONS.BETTING,
                contenders: nextContenders,
                upcomingRaces: nextUpcoming,
                bets: [],
                stagedBets: [],
                lastWinner: null,
                lastPayout: 0,
                alphaLeaks: [],
                isPrivateRace: false
            });
        },

        startPrivateRace: (participants: any[], entryFee: number) => {
            const nextContenders: Record<string, any> = {};
            participants.forEach((p) => {
                const tokenDef = TOP_TOKENS.find(t => t.id === p.selected_token) || MEME_TOKENS.find(t => t.id === p.selected_token);
                if (tokenDef) {
                    nextContenders[p.selected_token] = {
                        ...tokenDef,
                        startMetric: tokenDef.startPrice,
                        currentMetric: tokenDef.startPrice,
                        performance: 0,
                        position: 0
                    };
                }
            });

            // Connect WS to the new tokens
            binanceFeed.subscribe(Object.keys(nextContenders));

            set({
                mode: 'CRYPTO',
                phase: 'RACING',
                phaseTimeRemaining: 0,
                racingTimePassed: 0,
                contenders: nextContenders as Record<ContenderId, Contender>,
                bets: participants.map(p => ({
                    contenderId: p.selected_token,
                    amount: entryFee,
                    userId: p.wallet_address === get().walletAddress ? 'me' : p.wallet_address,
                    trackId: 'casual' // fallback, used to group payouts
                })),
                stagedBets: [],
                lastWinner: null,
                lastPayout: 0,
                alphaLeaks: [],
                isPrivateRace: true
            });
        }
    };
});
