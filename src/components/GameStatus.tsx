import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const GameStatus = () => {
    const { phase, phaseTimeRemaining, racingTimePassed, tickTimer } = useGameStore();

    useEffect(() => {
        const timer = setInterval(() => {
            tickTimer();
        }, 1000);
        return () => clearInterval(timer);
    }, [tickTimer]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const getPhaseColor = () => {
        switch (phase) {
            case 'BETTING': return 'text-green-400';
            case 'LOCKED': return 'text-yellow-400';
            case 'RACING': return 'text-red-400';
            case 'PHOTO_FINISH': return 'text-purple-400';
            case 'FINISHED': return 'text-blue-400';
            default: return 'text-white';
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-3 sm:px-6 bg-black/60 backdrop-blur-2xl border border-white/20 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] min-w-[160px]">
            <h2 className={cn("text-xl sm:text-2xl font-black uppercase tracking-widest mb-1 drop-shadow-md", getPhaseColor())}>
                {phase}
            </h2>
            <p className="text-4xl sm:text-5xl font-mono text-white tracking-widest font-bold tabular-nums" style={{ textShadow: '0 0 20px rgba(255,255,255,0.8), 0 0 10px rgba(255,255,255,0.4)' }}>
                {phase === 'RACING' || phase === 'PHOTO_FINISH' ? formatTime(racingTimePassed) : formatTime(phaseTimeRemaining)}
            </p>
        </div>
    );
};
