import React from 'react';
import { useGameStore } from '../store/gameStore';
import { TokenId } from '../types/game';

export const BettingPanel = () => {
    const { tokens, bets, userBalance, placeBet, phase, walletAddress } = useGameStore();

    const handleBet = (tokenId: TokenId, amount: number) => {
        if (!isNaN(amount) && amount > 0) {
            placeBet(tokenId, amount, walletAddress || undefined);
        }
    };

    const totalPool = bets.reduce((sum, b) => sum + b.amount, 0);
    const netPool = totalPool * 0.9;

    return (
        <div className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] flex flex-col gap-6">

            {/* Header Info */}
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                <div>
                    <p className="text-gray-400 text-sm">Your Balance</p>
                    <p className="text-2xl font-bold text-green-400">${userBalance.toFixed(2)}</p>
                </div>
                <div className="text-right">
                    <p className="text-gray-400 text-sm">Total Pool</p>
                    <p className="text-2xl font-bold text-yellow-400">${totalPool.toFixed(2)}</p>
                </div>
            </div>

            {/* Betting Grid */}
            <div className="grid grid-cols-1 gap-4">
                {Object.values(tokens).map(token => {
                    const tokenBets = bets.filter(b => b.tokenId === token.id);
                    const totalTokenBet = tokenBets.reduce((sum, b) => sum + b.amount, 0);

                    // Calculate dynamic odds
                    let multiplier = 0;
                    if (totalTokenBet > 0) {
                        multiplier = netPool / totalTokenBet;
                    } else if (netPool > 0) {
                        multiplier = netPool; // Max theoretical payout if you are the first bet
                    }

                    const myTokenBets = tokenBets.filter(b => b.userId === 'me').reduce((sum, b) => sum + b.amount, 0);

                    return (
                        <div key={token.id} className="bg-white/5 rounded-xl p-4 border border-white/10 flex flex-col gap-3 transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/50 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ backgroundColor: token.color }}>
                                        {token.symbol}
                                    </div>
                                    <span className="font-bold text-white">{token.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">Est Payout</span>
                                    <span className="text-sm font-bold text-yellow-400">{multiplier > 0 ? `${multiplier.toFixed(2)}x` : '-'}</span>
                                </div>
                            </div>

                            <div className="flex justify-between text-xs text-gray-400 bg-black/20 p-2 rounded-lg">
                                <span>Pool: <span className="text-white font-mono">${totalTokenBet.toFixed(0)}</span></span>
                                <span>Your Bet: <span className="text-green-400 font-mono">${myTokenBets.toFixed(0)}</span></span>
                            </div>

                            <div className="flex gap-2">
                                {[10, 50, 100].map(val => (
                                    <button
                                        key={val}
                                        disabled={phase !== 'BETTING' || userBalance < val}
                                        onClick={() => handleBet(token.id, val)}
                                        className="flex-1 bg-white/5 hover:bg-blue-600/50 disabled:bg-black/20 disabled:opacity-50 border border-white/10 hover:border-blue-400 text-white py-1.5 rounded-lg text-xs font-bold transition-all text-center"
                                    >
                                        +${val}
                                    </button>
                                ))}
                                <button
                                    disabled={phase !== 'BETTING' || userBalance <= 0}
                                    onClick={() => handleBet(token.id, userBalance)}
                                    className="flex-1 bg-white/5 hover:bg-red-600/50 disabled:bg-black/20 disabled:opacity-50 border border-white/10 hover:border-red-400 text-red-400 hover:text-white py-1.5 rounded-lg text-xs font-bold transition-all text-center uppercase"
                                >
                                    MAX
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
};
