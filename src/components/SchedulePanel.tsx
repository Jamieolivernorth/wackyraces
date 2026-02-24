import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { format } from 'date-fns';

export const SchedulePanel = () => {
    const history = useGameStore((state) => state.history);
    const raceId = useGameStore((state) => state.raceId);
    const phase = useGameStore((state) => state.phase);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const lastRace = history[0];

    return (
        <div className="w-full bg-gray-900 border border-gray-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-gray-800 p-4 border-b border-gray-700">
                <h3 className="font-bold text-gray-200">Race Schedule</h3>
                <p className="text-xs text-gray-500 font-mono">{format(currentTime, 'HH:mm:ss')} UTC</p>
            </div>

            <div className="p-4 flex flex-col gap-4">
                {/* Previous Result */}
                <div>
                    <h4 className="text-[10px] uppercase font-bold text-gray-500 mb-2">Last Result</h4>
                    {lastRace ? (
                        <div className="flex justify-between items-center bg-gray-800/50 p-2 rounded border border-gray-700">
                            <span className="text-xs font-mono text-gray-400">RACE-{lastRace.id.split('-')[1]}</span>
                            <div className="flex gap-2 items-center">
                                <span className="text-xs font-bold text-yellow-400">WINNER:</span>
                                <span className="text-xs font-bold px-2 py-0.5 rounded bg-black" style={{ color: lastRace.winner.color }}>
                                    {lastRace.winner.symbol}
                                </span>
                            </div>
                        </div>
                    ) : (
                        <div className="text-xs text-gray-600 italic">No previous races.</div>
                    )}
                </div>

                {/* Upcoming Races */}
                <div>
                    <h4 className="text-[10px] uppercase font-bold text-gray-500 mb-2">Upcoming</h4>
                    <div className="flex flex-col gap-2">
                        {[0, 1, 2].map(offset => (
                            <div key={offset} className={`flex justify-between items-center p-2 rounded border ${offset === 0 ? 'bg-blue-900/20 border-blue-500/50' : 'bg-gray-800/20 border-gray-800'}`}>
                                <span className="text-xs font-mono text-gray-300">RACE-{raceId + offset}</span>
                                <span className="text-xs text-gray-500">
                                    {offset === 0 ? (phase !== 'FINISHED' ? 'IN PROGRESS' : 'NEXT') : `T+${offset * 5}m`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
};
