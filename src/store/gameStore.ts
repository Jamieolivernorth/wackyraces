import { create } from 'zustand';
import { Token, TokenId, GamePhase, Bet, PHASE_DURATIONS, PastRace } from '../types/game';
import { calculateMovement } from '../lib/mathEngine';
import { getRandomTokens } from '../lib/tokens';
import { binanceFeed } from '../lib/binanceFeed';

interface GameState {
    phase: GamePhase;
    phaseTimeRemaining: number;
    tokens: Record<TokenId, Token>;
    bets: Bet[];
    userBalance: number;
    lastWinner: TokenId | null;
    history: PastRace[];
    raceId: number;
    walletAddress: string | null;
    alphaLeaks: { token: Token, text: string }[];
    racingTimePassed: number;

    // Actions
    placeBet: (tokenId: TokenId, amount: number, walletPublicKey?: string) => void;
    tickTimer: () => void;
    resetRace: () => void;
    updateRaceTick: () => void;
    updateLivePrice: (symbol: string, currentPrice: number) => void;
    setUserBalance: (amount: number) => void;
    setWalletAddress: (address: string | null) => void;
}

// Initial setup
const initialTokens = getRandomTokens() as Record<string, Token>;
// Initiate first subscription
setTimeout(() => {
    binanceFeed.subscribe(Object.keys(initialTokens));
}, 1000);

export const useGameStore = create<GameState>((set, get) => {
    // Setup WebSocket Callback once
    binanceFeed.setCallback((symbol, price) => {
        get().updateLivePrice(symbol, price);
    });

    return {
        phase: 'BETTING',
        phaseTimeRemaining: PHASE_DURATIONS.BETTING,
        tokens: initialTokens,
        bets: [],
        userBalance: 10000,
        lastWinner: null,
        history: [],
        raceId: 1,
        walletAddress: null,
        alphaLeaks: [],
        racingTimePassed: 0,

        setWalletAddress: (address) => set({ walletAddress: address }),
        setUserBalance: (amount) => set({ userBalance: amount }),

        placeBet: async (tokenId, amount, walletPublicKey) => {
            const { phase, userBalance, bets } = get();
            if (phase !== 'BETTING') return;
            if (amount <= 0 || amount > userBalance) return;

            // Optimistic UI update
            set({
                userBalance: userBalance - amount,
                bets: [...bets, { userId: 'me', tokenId, amount }]
            });

            // If connected to a real wallet, sync with backend DB ledger
            if (walletPublicKey) {
                try {
                    await fetch('/api/user/bet', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ wallet: walletPublicKey, amount })
                    });
                } catch (e) {
                    console.error("Failed to commit bet to backend ledger", e);
                }
            }
        },

        updateLivePrice: (symbol, livePrice) => {
            // Only update prices if we are in Betting or Racing. 
            // If LOCKED, we freeze them right before Racing starts.
            const { tokens, phase } = get();
            if (phase === 'LOCKED' || phase === 'FINISHED') return;

            if (tokens[symbol]) {
                set((state) => ({
                    tokens: {
                        ...state.tokens,
                        [symbol]: {
                            ...state.tokens[symbol],
                            currentPrice: livePrice
                        }
                    }
                }));
            }
        },

        tickTimer: () => {
            const { phase, phaseTimeRemaining, tokens, racingTimePassed } = get();

            if (phase === 'RACING') {
                // In RACING, we increment time passed instead of decrementing a limit
                set({ racingTimePassed: racingTimePassed + 1 });
                get().updateRaceTick();

                // Check if ANY token has hit 100 to trigger Photo Finish
                const currentTokens = get().tokens;
                const hasCrossedLine = Object.values(currentTokens).some(t => t.position >= 100);

                if (hasCrossedLine) {
                    // Enter Photo Finish for precisely 2 seconds
                    set({ phase: 'PHOTO_FINISH', phaseTimeRemaining: 2 });
                }
            } else if (phaseTimeRemaining > 0) {
                set({ phaseTimeRemaining: phaseTimeRemaining - 1 });

                if (phase === 'PHOTO_FINISH') {
                    // Let tokens move for the last 2 camera seconds
                    get().updateRaceTick();
                    set({ racingTimePassed: racingTimePassed + 1 });
                }
            } else {
                // Phase transitions
                switch (phase) {
                    case 'BETTING':
                        set({ phase: 'LOCKED', phaseTimeRemaining: PHASE_DURATIONS.LOCKED });
                        break;
                    case 'LOCKED':
                        // Lock starting prices based on the very latest WebSocket data
                        const readyTokens = { ...tokens };
                        Object.keys(readyTokens).forEach((k) => {
                            const t = readyTokens[k as TokenId];
                            t.startPrice = t.currentPrice;
                            t.performance = 0;
                            t.position = 0;
                        });
                        // Transition to RACING phase
                        set({ phase: 'RACING', phaseTimeRemaining: 0, racingTimePassed: 0, tokens: readyTokens });
                        break;
                    case 'PHOTO_FINISH':
                        // At the exact end of Photo Finish (2s later), lock the winner
                        const winnerToken = Object.values(tokens).reduce((max, t) => t.position > max.position ? t : max);
                        const winnerId = winnerToken.id;

                        const { bets, history, raceId, walletAddress, racingTimePassed: finalDuration } = get();
                        const totalPool = bets.reduce((sum, b) => sum + b.amount, 0);
                        const rake = totalPool * 0.10;
                        const netPool = totalPool - rake;

                        const winningBets = bets.filter(b => b.tokenId === winnerId);
                        const totalWinningBetsAmount = winningBets.reduce((sum, b) => sum + b.amount, 0);

                        let payoutToUser = 0;
                        if (totalWinningBetsAmount > 0) {
                            const userWinningBets = winningBets.filter(b => b.userId === 'me');
                            const userWinningAmount = userWinningBets.reduce((sum, b) => sum + b.amount, 0);
                            payoutToUser = (userWinningAmount / totalWinningBetsAmount) * netPool;
                        }

                        // Asynchronous Backend Sync
                        if (walletAddress && totalPool > 0) {
                            // Fetch the user's referrer to correctly map payout
                            fetch(`/api/user?wallet=${walletAddress}`)
                                .then(res => res.json())
                                .then(user => {
                                    const referrerWallet = user.referred_by;
                                    const referrers = referrerWallet && payoutToUser > 0 ? [{ wallet: referrerWallet, amount: payoutToUser * 0.02 }] : [];
                                    const houseRakeValue = referrerWallet && payoutToUser > 0 ? rake * 0.8 : rake;

                                    const payload = {
                                        winnerships: payoutToUser > 0 ? [{ wallet: walletAddress, amount: payoutToUser }] : [],
                                        referrers,
                                        houseRake: houseRakeValue,
                                        poolVolume: totalPool
                                    };

                                    return fetch('/api/race/payout', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify(payload)
                                    });
                                })
                                .then(() => {
                                    // Refresh balance
                                    return fetch(`/api/user?wallet=${walletAddress}`);
                                })
                                .then(res => res.json())
                                .then(data => {
                                    if (data?.balance !== undefined) {
                                        set({ userBalance: data.balance });
                                    }
                                })
                                .catch(err => console.error("Payout error:", err));
                        }

                        const nextHistory = [{
                            id: `RACE-${raceId}`,
                            winner: winnerToken,
                            date: new Date(),
                            duration: finalDuration // Uses the accurately incremented variable
                        }, ...history].slice(0, 10);

                        set((state) => ({
                            phase: 'FINISHED',
                            phaseTimeRemaining: PHASE_DURATIONS.FINISHED,
                            lastWinner: winnerId,
                            userBalance: walletAddress ? state.userBalance : state.userBalance + payoutToUser, // If unwallet, optimistic
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

        updateRaceTick: () => {
            const { tokens } = get();
            // Recalculate performance based on the live currentPrices
            const activeTokens = { ...tokens };
            Object.keys(activeTokens).forEach((key) => {
                const t = activeTokens[key];
                t.performance = t.startPrice > 0 ? (t.currentPrice - t.startPrice) / t.startPrice : 0;
            });

            // Apply Math Engine (which normalizes the performance array and moves them)
            const movedTokens = calculateMovement(activeTokens);
            set({ tokens: movedTokens });
        },

        resetRace: () => {
            const nextTokens = getRandomTokens() as Record<string, Token>;

            // Connect WS to the new tokens
            binanceFeed.subscribe(Object.keys(nextTokens));

            set({
                phase: 'BETTING',
                phaseTimeRemaining: PHASE_DURATIONS.BETTING,
                tokens: nextTokens,
                bets: [],
                lastWinner: null,
                alphaLeaks: []
            });
        }
    };
});
