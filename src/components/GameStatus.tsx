import React, { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export const GameStatus = () => {
    const { phase, phaseTimeRemaining, tickTimer } = useGameStore();

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
            case 'FINISHED': return 'text-blue-400';
            default: return 'text-white';
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 bg-gray-900 border border-gray-800 rounded-xl shadow-2xl backdrop-blur-md bg-opacity-80">
            <h2 className={cn("text-3xl font-black uppercase tracking-wider mb-1", getPhaseColor())}>
                {phase} PHASE
            </h2>
            <p className="text-5xl font-mono text-white tracking-widest font-bold">
                {formatTime(phaseTimeRemaining)}
            </p>
        </div>
    );
};
