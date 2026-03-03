import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { generateAlphaLeaks } from '../lib/alphaLeaks';
import { Contender } from '../types/game';

export const AlphaLeakPanel = () => {
    const raceId = useGameStore(state => state.raceId);
    const mode = useGameStore(state => state.mode);
    const phase = useGameStore(state => state.phase);

    const [leaks, setLeaks] = useState<{ contender: Contender, text: string }[]>([]);

    useEffect(() => {
        if (mode !== 'CRYPTO') return;

        // Only regenerate when betting phase starts
        if (phase === 'BETTING') {
            const activeContenders = Object.values(useGameStore.getState().contenders);
            if (activeContenders.length > 0) {
                setLeaks(generateAlphaLeaks(activeContenders));
            }
        }
    }, [phase, raceId, mode]);

    if (mode !== 'CRYPTO') return null;

    return (
        <div className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] flex flex-col justify-start">
            <h3 className="text-gray-500 font-bold uppercase text-[10px] mb-3 flex items-center justify-between">
                <span>⚠️ Alpha Leaks (X / News Scans)</span>
                <span className="animate-pulse w-2 h-2 bg-red-500 rounded-full"></span>
            </h3>

            <div className="flex flex-col gap-3">
                {leaks.map((leak, idx) => (
                    <div key={idx} className="flex gap-2 items-start bg-gray-800/40 p-2 rounded-lg border border-gray-700/50">
                        <div className="w-6 h-6 shrink-0 rounded flex justify-center items-center text-[8px] font-bold text-black" style={{ backgroundColor: leak.contender.color }}>
                            {leak.contender.symbol}
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
