import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { TokenId } from '../types/game';

export const BettingPanel = () => {
    const { tokens, bets, userBalance, placeBet, phase, walletAddress } = useGameStore();
    const [betAmounts, setBetAmounts] = useState<Record<TokenId, string>>({
        btc: '', eth: '', sol: '', doge: '', far: '', ltc: ''
    });

    const handleBet = (tokenId: TokenId) => {
        const amount = parseFloat(betAmounts[tokenId]);
        if (!isNaN(amount) && amount > 0) {
            placeBet(tokenId, amount, walletAddress || undefined);
            setBetAmounts(prev => ({ ...prev, [tokenId]: '' }));
        }
    };

    const totalPool = bets.reduce((sum, b) => sum + b.amount, 0);
    const netPool = totalPool * 0.9;

    return (
        <div className="w-full bg-gray-900 border-2 border-gray-800 rounded-2xl p-6 shadow-2xl flex flex-col gap-6">

            {/* Header Info */}
            <div className="flex justify-between items-center bg-gray-800/50 p-4 rounded-xl border border-gray-700">
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
                        <div key={token.id} className="bg-gray-800 rounded-xl p-4 border border-gray-700 flex flex-col gap-3 transition-colors hover:border-gray-500">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white" style={{ backgroundColor: token.color }}>
                                        {token.symbol}
                                    </div>
                                    <span className="font-bold text-white">{token.name}</span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs text-gray-400 block">Est Payout</span>
                                    <span className="text-sm font-bold text-yellow-400">{multiplier > 0 ? `${multiplier.toFixed(2)}x` : '-'}</span>
                                </div>
                            </div>

                            <div className="flex justify-between text-xs text-gray-400">
                                <span>Pool: ${totalTokenBet.toFixed(0)}</span>
                                <span className="text-green-400">Your Bet: ${myTokenBets.toFixed(0)}</span>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    step="10"
                                    disabled={phase !== 'BETTING'}
                                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white outline-none focus:border-blue-500 disabled:opacity-50"
                                    placeholder="0.00"
                                    value={betAmounts[token.id as TokenId]}
                                    onChange={(e) => setBetAmounts(prev => ({ ...prev, [token.id as TokenId]: e.target.value }))}
                                />
                                <button
                                    disabled={phase !== 'BETTING' || !betAmounts[token.id]}
                                    onClick={() => handleBet(token.id)}
                                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold transition-colors"
                                >
                                    Bet
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
};
