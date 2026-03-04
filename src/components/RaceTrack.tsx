import React from 'react';
import { useGameStore } from '../store/gameStore';
import { FootballEventOverlay } from './FootballEventOverlay';

export const RaceTrack = () => {
    const contenders = useGameStore((state) => state.contenders);
    const phase = useGameStore((state) => state.phase);
    const lastWinner = useGameStore((state) => state.lastWinner);
    const racingTimePassed = useGameStore((state) => state.racingTimePassed);
    const mode = useGameStore((state) => state.mode);

    const isFinal30s = mode === 'FOOTBALL' && phase === 'RACING' && racingTimePassed >= 270;

    const sortedContenders = Object.values(contenders).sort((a: any, b: any) => b.position - a.position);

    const getLanePath = (index: number) => {
        const R = 75 + index * 30; // 6 lanes: 75, 105, 135, 165, 195, 225
        return `M ${300 + R} 250 
                L ${300 + R} 750 
                A ${R} ${R} 0 0 1 ${300 - R} 750 
                L ${300 - R} 250 
                A ${R} ${R} 0 0 1 ${300 + R} 250 Z`;
    };

    const getPointOnOval = (progress: number, laneIndex: number) => {
        const R = 75 + laneIndex * 30;
        const STR = 500; // Straight length (750 - 250)
        const CRV = Math.PI * R; // Half-circle curve length
        const L = 2 * STR + 2 * CRV; // Total track length

        let mappedProgress = progress;
        // Cap progress at 100 for visual finish
        if (mappedProgress > 100) mappedProgress = 100;

        let dist = (mappedProgress / 100) * L;
        const PI = Math.PI;

        // Start at Top Right Straight (300+R, 250). Moving Down.
        if (dist <= STR) {
            return { x: 300 + R, y: 250 + dist };
        }
        dist -= STR;

        // Bottom Curve
        if (dist <= CRV) {
            const angle = dist / R;
            const theta = angle; // from 0 to PI
            return { x: 300 + R * Math.cos(theta), y: 750 + R * Math.sin(theta) };
        }
        dist -= CRV;

        // Left Straight (Moving Up)
        if (dist <= STR) {
            return { x: 300 - R, y: 750 - dist };
        }
        dist -= STR;

        // Top Curve
        if (dist <= CRV) {
            const angle = dist / R;
            const theta = PI + angle; // from PI to 2PI
            return { x: 300 + R * Math.cos(theta), y: 250 + R * Math.sin(theta) };
        }
        dist -= CRV;

        // Overflow
        return { x: 300 + R, y: 250 + dist };
    };

    return (
        <div className={`w-full bg-black/40 backdrop-blur-xl border rounded-3xl p-4 md:p-8 relative shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] transition-all ${isFinal30s ? 'border-red-500/80 shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-[pulse_1s_ease-in-out_infinite]' : 'border-white/10'}`}>

            {isFinal30s && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600/20 border border-red-500 text-red-500 text-[10px] md:text-xs font-black uppercase tracking-widest px-4 py-1 rounded-full animate-bounce z-50 whitespace-nowrap">
                    FINAL 30 SECONDS (3x MULTIPLIER)
                </div>
            )}

            {/* Live Leaderboard Overlay Overlaying the Track Top Left */}
            <div className="absolute top-6 left-6 flex flex-col gap-1.5 z-40 bg-black/60 backdrop-blur-md rounded-2xl p-3 border border-white/10 shadow-xl pointer-events-none transition-all hidden sm:flex">
                <div className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 px-1 flex justify-between items-center gap-4">
                    <span>Live Standings</span>
                    {phase === 'RACING' && <span className="text-red-500 animate-pulse text-[8px] sm:text-[10px]">• REC</span>}
                </div>
                {sortedContenders.map((c: any, idx: number) => (
                    <div key={c.id} className="flex items-center justify-between gap-6 px-2 py-1 rounded bg-white/5 border border-white/5">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 font-mono w-3">{idx + 1}</span>
                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: c.color, boxShadow: `0 0 5px ${c.color}` }} />
                            <span className="font-bold text-[10px] sm:text-xs text-white">{c.symbol}</span>
                        </div>
                        <span className="text-[10px] sm:text-xs text-gray-400 font-mono text-right">{c.position.toFixed(1)}%</span>
                    </div>
                ))}
            </div>

            {/* Mobile Leaderboard inline block */}
            <div className="sm:hidden mb-4 bg-black/50 backdrop-blur-md rounded-xl p-3 border border-white/10 shadow-xl w-full sticky top-4 z-40">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1 flex justify-between items-center">
                    <span>Live Standings</span>
                    {phase === 'RACING' && <span className="text-red-500 animate-pulse text-[8px]">• REC</span>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    {sortedContenders.map((c: any, idx: number) => (
                        <div key={c.id} className="flex items-center justify-between gap-1 px-2 py-1.5 rounded bg-white/5 border border-white/5">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-gray-500 font-mono w-2">{idx + 1}</span>
                                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                                <span className="font-bold text-[9px] text-white truncate max-w-[35px]">{c.symbol}</span>
                            </div>
                            <span className="text-[9px] text-gray-400 font-mono text-right">{c.position.toFixed(1)}%</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className="relative w-full overflow-hidden flex justify-center">
                <svg
                    viewBox="0 0 600 1000"
                    className="w-full max-w-[500px] h-auto drop-shadow-[0_0_15px_rgba(255,255,255,0.05)]"
                >
                    <defs>
                        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="6" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>

                    {/* Track Background */}
                    <rect x="60" y="10" width="480" height="980" rx="240" fill="#111318" stroke="#2d3748" strokeWidth="4" />
                    <rect x="240" y="190" width="120" height="620" rx="60" fill="#0b0d10" stroke="#2d3748" strokeWidth="4" />

                    {/* Lanes */}
                    {Object.keys(contenders).map((_, i) => (
                        <path
                            key={`lane-${i}`}
                            d={getLanePath(i)}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeDasharray="8 6"
                            opacity="0.25"
                        />
                    ))}

                    {/* Finish / Start Line (at Y=250 right side) */}
                    <line x1="300" y1="250" x2="540" y2="250" stroke="#fcd34d" strokeWidth="6" strokeDasharray="12 12" className="animate-pulse" />
                    <text x="535" y="240" fill="#fcd34d" fontSize="16" fontWeight="bold" textAnchor="end" className="drop-shadow-[0_0_8px_rgba(252,211,77,0.8)] opacity-90">
                        START / FINISH
                    </text>

                    {/* Contenders Dots */}
                    {Object.values(contenders).map((contender: any, i: number) => {
                        const { x, y } = getPointOnOval(contender.position, i);
                        const isWinner = phase === 'FINISHED' && lastWinner === contender.id;

                        return (
                            <g
                                key={contender.id}
                                style={{
                                    transform: `translate(${x}px, ${y}px)`,
                                    transition: (phase === 'RACING' || phase === 'PHOTO_FINISH') ? 'transform 1s linear' : 'transform 0.5s ease-out'
                                }}
                            >
                                <circle
                                    r={isWinner ? "20" : "12"}
                                    fill={contender.color}
                                    filter="url(#glow)"
                                    className={isWinner ? "animate-pulse" : ""}
                                />
                                <circle
                                    r={isWinner ? "20" : "12"}
                                    fill="none"
                                    stroke="#ffffff"
                                    strokeWidth="3"
                                    opacity="0.9"
                                    className="drop-shadow-lg"
                                />

                                {mode === 'FOOTBALL' && (
                                    <foreignObject x="-50" y="-50" width="100" height="100" className="overflow-visible pointer-events-none">
                                        <div className="w-full h-full flex flex-col items-center justify-center">
                                            <FootballEventOverlay events={contender.recentEvents || []} racingTimePassed={racingTimePassed} />
                                        </div>
                                    </foreignObject>
                                )}
                            </g>
                        );
                    })}
                </svg>

                {/* Photo Finish Zoom Camera */}
                {phase === 'PHOTO_FINISH' && (
                    <div className="absolute left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 bottom-4 md:right-4 w-48 h-48 sm:w-64 sm:h-64 rounded-full border-4 border-yellow-400 overflow-hidden shadow-[0_0_50px_rgba(250,204,21,0.6)] z-40 bg-black animate-in fade-in zoom-in duration-500">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] sm:text-xs font-black px-3 py-0.5 rounded-full z-10 animate-pulse uppercase tracking-widest shadow-lg whitespace-nowrap">
                            PHOTO FINISH
                        </div>
                        <svg
                            viewBox="280 120 280 260"
                            className="absolute top-0 left-0 w-full h-full object-cover"
                        >
                            <rect x="60" y="10" width="480" height="980" rx="240" fill="#111318" stroke="#2d3748" strokeWidth="4" />
                            <rect x="240" y="190" width="120" height="620" rx="60" fill="#0b0d10" stroke="#2d3748" strokeWidth="4" />

                            {Object.keys(contenders).map((_, i) => (
                                <path
                                    key={`lane-${i}-zoom`}
                                    d={getLanePath(i)}
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="2"
                                    strokeDasharray="8 6"
                                    opacity="0.25"
                                />
                            ))}

                            <line x1="300" y1="250" x2="540" y2="250" stroke="#fcd34d" strokeWidth="6" strokeDasharray="12 12" />

                            {Object.values(contenders).map((contender: any, i: number) => {
                                const { x, y } = getPointOnOval(contender.position, i);
                                return (
                                    <g key={`zoom-pip-${contender.id}`} style={{ transform: `translate(${x}px, ${y}px)`, transition: 'transform 1s linear' }}>
                                        <circle r="14" fill={contender.color} filter="url(#glow)" />
                                        <circle r="14" fill="none" stroke="white" strokeWidth="3" opacity="0.9" />
                                    </g>
                                );
                            })}
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
};
