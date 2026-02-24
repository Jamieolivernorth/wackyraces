import React from 'react';
import { useGameStore } from '../store/gameStore';

export const WinnerBanner = () => {
    const phase = useGameStore((state) => state.phase);
    const lastWinnerId = useGameStore((state) => state.lastWinner);
    const tokens = useGameStore((state) => state.tokens);

    if (phase === 'PHOTO_FINISH') {
        return (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-50 pointer-events-none flex justify-center items-center drop-shadow-2xl px-4 animate-pulse">
                <div className="w-full max-w-2xl bg-black border-4 border-yellow-500 rounded-2xl p-6 text-center shadow-[0_0_50px_rgba(234,179,8,0.5)]">
                    <h1 className="text-4xl md:text-5xl font-black uppercase italic text-yellow-500 mb-2">📸 PHOTO FINISH 📸</h1>
                    <p className="text-white text-xl font-bold tracking-widest">CALCULATING DISTANCE</p>
                </div>
            </div>
        );
    }

    if (phase !== 'FINISHED' || !lastWinnerId) return null;

    const winner = tokens[lastWinnerId];

    return (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-50 pointer-events-none flex justify-center items-center drop-shadow-2xl px-4 animate-slide-in-bouncy">
            <div
                className="w-full max-w-4xl bg-black border-4 rounded-3xl p-6 md:p-12 text-center"
                style={{ borderColor: winner.color }}
            >
                <h1 className="text-4xl md:text-7xl font-black uppercase italic text-white mb-4 tracking-tighter" style={{ textShadow: `0 0 20px ${winner.color}` }}>
                    {winner.name} WINS!
                </h1>

                <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                    <div
                        className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center font-bold text-3xl md:text-5xl border-4 text-white shadow-2xl"
                        style={{ backgroundColor: winner.color, borderColor: '#fff' }}
                    >
                        {winner.symbol}
                    </div>
                    <div className="text-left bg-gray-900 border border-gray-700 p-4 rounded-xl">
                        <p className="text-gray-400 text-sm md:text-base mb-1">FINAL VELOCITY</p>
                        <p className="text-2xl md:text-4xl font-mono text-green-400 font-bold">
                            +{(winner.position / 60).toFixed(2)} / sec
                        </p>
                    </div>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .animate-slide-in-bouncy {
                    animation: slideInBouncy 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
                @keyframes slideInBouncy {
                    0% {
                        transform: translateY(-200%) scale(0.5);
                        opacity: 0;
                    }
                    100% {
                        transform: translateY(-50%) scale(1);
                        opacity: 1;
                    }
                }
            `}} />
        </div>
    );
};
