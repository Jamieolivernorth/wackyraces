'use client';

import React, { useState, useEffect } from 'react';
import { Target, Shield, Trophy } from 'lucide-react';

export type PenaltyZone = 'LT' | 'LB' | 'C' | 'RT' | 'RB';

interface PenaltyPvPGameProps {
    isPlayerShooting: boolean;
    opponentName: string;
    onTurn: (zone: PenaltyZone) => void;
    lastShot?: {
        shooterZone: PenaltyZone;
        keeperZone: PenaltyZone;
        isGoal: boolean;
    };
    disabled?: boolean;
}

const ZONES: { id: PenaltyZone; label: string; x: string; y: string }[] = [
    { id: 'LT', label: 'Top Left', x: '15%', y: '20%' },
    { id: 'LB', label: 'Bottom Left', x: '15%', y: '70%' },
    { id: 'C', label: 'Center', x: '50%', y: '45%' },
    { id: 'RT', label: 'Top Right', x: '85%', y: '20%' },
    { id: 'RB', label: 'Bottom Right', x: '85%', y: '70%' },
];

export function PenaltyPvPGame({
    isPlayerShooting,
    opponentName,
    onTurn,
    lastShot,
    disabled = false
}: PenaltyPvPGameProps) {
    const [selectedZone, setSelectedZone] = useState<PenaltyZone | null>(null);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (lastShot && !animating) {
            setAnimating(true);
            const timer = setTimeout(() => {
                setAnimating(false);
                setSelectedZone(null); 
            }, 2000);
            return () => clearTimeout(timer);
        } else if (!lastShot && animating) {
            setAnimating(false); // Force stop if lastShot is cleared externally
        }
    }, [lastShot]);

    useEffect(() => {
        setSelectedZone(null); // Reset when role changes
    }, [isPlayerShooting]);

    const handleZoneClick = (zone: PenaltyZone) => {
        if (disabled || animating) return;
        setSelectedZone(zone);
        onTurn(zone);
    };

    return (
        <div className="relative w-full aspect-[16/9] bg-gradient-to-b from-blue-900/20 to-green-900/40 rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
            {/* Stadium Background Elements */}
            <div className="absolute inset-0 opacity-20 bg-[url('/hero-track.jpg')] bg-cover bg-center mix-blend-overlay" />
            <div className="absolute bottom-0 w-full h-1/3 bg-green-800/40 border-t border-white/10" />

            {/* Goal Frame */}
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[80%] h-[75%] border-b-[8px] border-white/80 rounded-t-lg bg-black/20 flex items-center justify-center">
                {/* Net Pattern */}
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '10px 10px' }} />
                
                {/* Goal Posts */}
                <div className="absolute -left-2 top-0 bottom-0 w-2 bg-white" />
                <div className="absolute -right-2 top-0 bottom-0 w-2 bg-white" />
                <div className="absolute top-0 -left-2 -right-2 h-2 bg-white" />
            </div>

            {/* Zones Grid */}
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[80%] h-[75%] grid grid-cols-2 grid-rows-2">
                {/* Visual grid - purely decorative */}
            </div>

            {/* Interactive Zones */}
            {ZONES.map((zone) => (
                <button
                    key={zone.id}
                    disabled={disabled || animating}
                    onClick={() => handleZoneClick(zone.id)}
                    className={`
                        absolute -translate-x-1/2 -translate-y-1/2 w-20 h-20 md:w-28 md:h-28 
                        rounded-full border-2 flex items-center justify-center transition-all duration-300
                        ${disabled || animating ? 'opacity-0 pointer-events-none' : 'opacity-100 hover:scale-110'}
                        ${selectedZone === zone.id ? 'bg-yellow-400/30 border-yellow-400' : 'bg-white/5 border-white/20 hover:border-white/50 hover:bg-white/10'}
                    `}
                    style={{ left: zone.x, top: zone.y }}
                >
                    {isPlayerShooting ? (
                        <Target className={`w-10 h-10 ${selectedZone === zone.id ? 'text-yellow-400' : 'text-white/40'}`} />
                    ) : (
                        <Shield className={`w-10 h-10 ${selectedZone === zone.id ? 'text-blue-400' : 'text-white/40'}`} />
                    )}
                </button>
            ))}

            {/* Animations Overlay */}
            {animating && lastShot && (
                <div className="absolute inset-0 pointer-events-none">
                    {/* Ball Path */}
                    <div 
                        className="absolute bottom-10 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full shadow-[0_0_20px_rgba(255,255,255,0.8)] transition-all duration-700 ease-out"
                        style={{
                            transform: `translate(${
                                lastShot.shooterZone.includes('L') ? '-300%' : lastShot.shooterZone.includes('R') ? '300%' : '0'
                            }, ${
                                lastShot.shooterZone.includes('T') ? '-350%' : lastShot.shooterZone.includes('B') ? '-150%' : '-250%'
                            }) scale(0.6)`
                        }}
                    >
                        <div className="w-full h-full rounded-full border-4 border-black/10 flex items-center justify-center overflow-hidden">
                            <div className="w-full h-1 bg-black/20 rotate-45" />
                            <div className="w-full h-1 bg-black/20 -rotate-45" />
                        </div>
                    </div>

                    {/* Keeper Dive */}
                    <div 
                        className="absolute top-[45%] left-1/2 -translate-x-1/2 w-40 h-16 bg-blue-500 rounded-full shadow-lg transition-all duration-500 ease-out flex items-center justify-center p-2"
                        style={{
                            transform: `translate(${
                                lastShot.keeperZone.includes('L') ? '-150%' : lastShot.keeperZone.includes('R') ? '150%' : '0'
                            }, ${
                                lastShot.keeperZone.includes('T') ? '-100%' : lastShot.keeperZone.includes('B') ? '100%' : '0'
                            }) rotate(${
                                lastShot.keeperZone.includes('L') ? '-30deg' : lastShot.keeperZone.includes('R') ? '30deg' : '0'
                            })`
                        }}
                    >
                        <div className="flex gap-4">
                            <div className="w-6 h-6 bg-white/20 rounded-full" />
                            <div className="w-12 h-6 bg-white/20 rounded-lg" />
                            <div className="w-6 h-6 bg-white/20 rounded-full" />
                        </div>
                    </div>

                    {/* Result Text */}
                    <div className="absolute inset-0 flex items-center justify-center animate-in zoom-in fade-in duration-500 delay-700">
                        <h2 className={`text-6xl font-black italic uppercase drop-shadow-2xl ${lastShot.isGoal ? 'text-green-500' : 'text-red-500'}`}>
                            {lastShot.isGoal ? 'GOAL!' : 'SAVED!'}
                        </h2>
                    </div>
                </div>
            )}

            {/* Turn Indicators */}
            <div className="absolute top-4 left-4 flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Opponent</span>
                <span className="text-lg font-black italic">{opponentName}</span>
            </div>

            <div className="absolute top-4 right-4 text-right flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Your Role</span>
                <span className={`text-lg font-black italic ${isPlayerShooting ? 'text-yellow-400' : 'text-blue-400'}`}>
                    {isPlayerShooting ? 'SHOOTER' : 'GOALKEEPER'}
                </span>
            </div>

            {/* Instruction Footer */}
            {!animating && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/40 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">
                    {isPlayerShooting ? 'Pick your spot' : 'Pick your dive'}
                </div>
            )}
        </div>
    );
}
