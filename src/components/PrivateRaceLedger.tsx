import React from 'react';
import { useGameStore } from '../store/gameStore';

export const PrivateRaceLedger = () => {
    const { contenders, bets } = useGameStore();

    return (
        <div className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] flex flex-col gap-4 sm:gap-6">
            <div className="flex justify-between items-center -mb-2">
                <span className="text-lg font-black italic uppercase text-white">Race Ledger</span>
                <span className="bg-blue-600/20 text-blue-400 text-[10px] px-2 py-1 rounded-sm uppercase tracking-wider font-bold border border-blue-500/30">
                    Live Watch
                </span>
            </div>

            <div className="flex flex-col gap-3">
                {bets.map((bet, idx) => {
                    const contender = contenders[bet.contenderId];
                    if (!contender) return null;

                    const identifier = bet.userId === 'me' ? 'You' : (bet.userId
                        ? `${bet.userId.slice(0, 4)}...${bet.userId.slice(-4)}`
                        : 'Unknown');

                    return (
                        <div key={idx} className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ backgroundColor: contender.color }}>
                                    {contender.symbol}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-bold text-white text-sm">{contender.name}</span>
                                    <span className="text-xs text-gray-500 font-mono italic">Backed by {identifier}</span>
                                </div>
                            </div>

                            <div className="text-right flex flex-col items-end">
                                <span className="text-sm font-mono font-bold text-white">
                                    {(contender.position).toFixed(1)}m
                                </span>
                                <span className="text-[10px] text-green-400 font-mono italic">
                                    ${bet.amount}
                                </span>
                            </div>
                        </div>
                    );
                })}
                {bets.length === 0 && (
                    <div className="text-center text-gray-500 text-sm py-8 italic border border-dashed border-gray-700 rounded-xl">
                        Waiting for racers...
                    </div>
                )}
            </div>
        </div>
    );
};
