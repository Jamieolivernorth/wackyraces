import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateAlphaLeaks } from '../lib/alphaLeaks';
import { Token } from '../types/game';

export const AlphaLeakPanel = () => {
    const tokens = useGameStore(state => state.tokens);
    const raceId = useGameStore(state => state.raceId);

    const [leaks, setLeaks] = useState<{ token: Token, text: string }[]>([]);
    const phase = useGameStore(state => state.phase);

    useEffect(() => {
        // Only regenerate when betting phase starts (to prevent endless loops on price ticks)
        if (phase === 'BETTING') {
            const activeTokens = Object.values(tokens);
            if (activeTokens.length > 0) {
                setLeaks(generateAlphaLeaks(activeTokens));
            }
        }
    }, [phase, tokens]);

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-xl flex flex-col justify-start">
            <h3 className="text-gray-500 font-bold uppercase text-[10px] mb-3 flex items-center justify-between">
                <span>⚠️ Alpha Leaks (X / News Scans)</span>
                <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span>
            </h3>

            <div className="flex flex-col gap-3">
                {leaks.map((leak, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-gray-800/40 p-2 rounded-lg border border-gray-700/50">
                        <div className="w-6 h-6 shrink-0 rounded flex justify-center items-center text-[8px] font-bold text-black" style={{ backgroundColor: leak.token.color }}>
                            {leak.token.symbol}
                        </div>
                        <p className="text-xs text-gray-300 italic">
                            "{leak.text}"
                        </p>
                    </div>
                ))}
            </div>

        </div>
    );
};
