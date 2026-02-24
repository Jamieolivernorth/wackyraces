import React from 'react';
import { useGameStore } from '../store/gameStore';

export const RaceHistoryTicker = () => {
    const history = useGameStore((state) => state.history);

    if (history.length === 0) {
        return (
            <div className="w-full bg-yellow-400 text-black font-bold py-1 overflow-hidden relative">
                <div className="whitespace-nowrap animate-marquee px-4 text-xs font-mono uppercase">
                    AWAITING INAUGURAL WACKY RACE RESULTS... DEGENERATE EXCHANGING SOON...
                </div>
            </div>
        );
    }

    return (
        <div className="w-full bg-yellow-400 text-black font-bold py-1 overflow-hidden relative border-y border-yellow-600 shadow-[0_0_10px_rgba(250,204,21,0.5)]">
            <div className="flex animate-marquee whitespace-nowrap min-w-full">
                {history.map((race, i) => (
                    <div key={race.id + i} className="flex items-center gap-3 px-8 text-xs font-mono uppercase shrink-0">
                        <span className="text-gray-800">#{race.id}</span>
                        <span className="bg-black text-white px-2 rounded font-bold" style={{ color: race.winner.color }}>
                            {race.winner.symbol}
                        </span>
                        <span>+{((race.winner.position > 100 ? 100 : race.winner.position) / race.duration).toFixed(1)} VELOCITY</span>
                        <span className="text-gray-700">|</span>
                    </div>
                ))}
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
        .animate-marquee {
          display: flex;
          animation: marquee 30s linear infinite;
        }
        @keyframes marquee {
          0% { transform: translateX(100vw); }
          100% { transform: translateX(-100%); }
        }
      `}} />
        </div>
    );
};
