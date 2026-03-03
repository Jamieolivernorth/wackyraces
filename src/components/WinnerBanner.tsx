import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Twitter, Instagram, Trophy } from 'lucide-react';

export const WinnerBanner = () => {
    const phase = useGameStore((state) => state.phase);
    const lastWinnerId = useGameStore((state) => state.lastWinner);
    const contenders = useGameStore((state) => state.contenders);
    const mode = useGameStore((state) => state.mode);
    const lastPayout = useGameStore((state) => state.lastPayout);

    const [isCalculating, setIsCalculating] = useState(false);
    const [showPayout, setShowPayout] = useState(false);

    // Drumroll Effect
    useEffect(() => {
        if (phase === 'FINISHED' && lastWinnerId) {
            setIsCalculating(true);
            setShowPayout(false);

            // 2.5 second drumroll delay
            const timer = setTimeout(() => {
                setIsCalculating(false);
                setShowPayout(true);
            }, 2500);

            return () => clearTimeout(timer);
        } else {
            setIsCalculating(false);
            setShowPayout(false);
        }
    }, [phase, lastWinnerId]);

    if (phase === 'PHOTO_FINISH') {
        return (
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-50 pointer-events-none flex justify-center items-center drop-shadow-2xl px-4 animate-pulse">
                <div className="w-full max-w-2xl bg-black border-4 border-yellow-500 rounded-2xl p-6 text-center shadow-[0_0_50px_rgba(234,179,8,0.5)]">
                    <h1 className="text-4xl md:text-5xl font-black uppercase italic text-yellow-500 mb-2">📸 PHOTO FINISH 📸</h1>
                    <p className="text-white text-xl font-bold tracking-widest">CALCULATING METRICS</p>
                </div>
            </div>
        );
    }

    if (phase !== 'FINISHED' || !lastWinnerId) return null;

    const winner = contenders[lastWinnerId];

    // Check if the user won
    const didIWin = lastPayout > 0;

    const handleXShare = () => {
        const text = `I just nailed a massive ${lastPayout} prediction on @WackyRaces ⚡️\n\nThe underground crypto derby is wild.\nGet in here. 👇`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent('https://wackyraces.fun')}`;
        window.open(url, '_blank');
    };

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
                        <p className="text-gray-400 text-sm md:text-base mb-1 uppercase font-bold text-[10px] tracking-widest">
                            {mode === 'FOOTBALL' ? 'TARGET METRIC' : 'FINAL VELOCITY'}
                        </p>
                        <p className="text-2xl md:text-4xl font-mono text-green-400 font-bold">
                            {mode === 'CRYPTO'
                                ? `+${(winner.position / 60).toFixed(2)} / sec`
                                : `${winner.currentMetric} Touches`
                            }
                        </p>
                    </div>
                </div>

                {/* Drumroll and Win Reveal Logic */}
                {didIWin && (
                    <div className="mt-8 pt-8 border-t border-gray-800/50 flex flex-col items-center">
                        {isCalculating ? (
                            <div className="animate-pulse flex flex-col items-center pointer-events-auto">
                                <Trophy className="w-12 h-12 text-yellow-500 mb-4 opacity-50" />
                                <p className="text-yellow-500 font-mono tracking-[0.2em] font-bold text-xl uppercase">Calculating Winnings...</p>
                            </div>
                        ) : showPayout ? (
                            <div className="animate-in zoom-in fade-in duration-500 pointer-events-auto flex flex-col items-center">
                                <div className="bg-green-500/10 border border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.3)] rounded-2xl p-6 mb-6">
                                    <h3 className="text-green-500 font-black italic text-2xl uppercase tracking-widest mb-1">YOU WON</h3>
                                    <p className="text-5xl md:text-6xl font-black text-white font-mono">
                                        <span className="text-green-400 text-3xl">$</span> {lastPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </p>
                                </div>

                                {/* Social Share Buttons */}
                                <div className="flex gap-4">
                                    <button
                                        onClick={handleXShare}
                                        className="bg-black hover:bg-gray-900 text-white border border-gray-700 py-3 px-6 rounded-full font-bold flex items-center gap-2 transition-all hover:scale-105 pointer-events-auto cursor-pointer"
                                    >
                                        <Twitter className="w-5 h-5 text-[#1DA1F2]" />
                                        Share on X
                                    </button>
                                    <button
                                        className="bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 from-purple-600 to-pink-600 text-white py-3 px-6 rounded-full font-bold flex items-center gap-2 transition-all hover:scale-105 pointer-events-auto cursor-pointer"
                                    >
                                        <Instagram className="w-5 h-5" />
                                        Share on IG
                                    </button>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
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
