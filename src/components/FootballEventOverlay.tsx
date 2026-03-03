import React from 'react';
import { FootballEvent } from '../types/game';

interface Props {
    events: FootballEvent[];
    racingTimePassed: number;
}

export const FootballEventOverlay = ({ events, racingTimePassed }: Props) => {
    // Only show events strictly from the last 2 seconds to make them feel like "pop-ups"
    const activeEvents = events.filter(e => (racingTimePassed - e.timestamp) <= 3 && (racingTimePassed - e.timestamp) >= 0);

    return (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full pointer-events-none flex flex-col items-center gap-1 z-50 mt-1">
            {activeEvents.map(e => (
                <div key={e.id} className={`text-white text-[9px] sm:text-[10px] font-black italic uppercase tracking-wider transition-all duration-1000 transform -translate-y-4 opacity-0 animate-in fade-in slide-in-from-bottom-2 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] whitespace-nowrap px-1.5 py-0.5 rounded ${e.type === 'Goal' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                        e.type === 'YellowCard' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                            e.type === 'RedCard' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                                e.points > 0 ? 'bg-green-500/20 text-green-400 border border-green-500/30' :
                                    'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}>
                    {e.type.replace('OnTarget', ' O.T.')} {e.points > 0 ? `+${e.points}` : e.points}
                </div>
            ))}
        </div>
    );
};
