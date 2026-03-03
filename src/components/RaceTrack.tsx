import React from 'react';
import { useGameStore } from '../store/gameStore';
import { FootballEventOverlay } from './FootballEventOverlay';

export const RaceTrack = () => {
    const contenders = useGameStore((state) => state.contenders);
    const phase = useGameStore((state) => state.phase);
    const lastWinner = useGameStore((state) => state.lastWinner);
    const racingTimePassed = useGameStore((state) => state.racingTimePassed);
    const mode = useGameStore((state) => state.mode);

    const showRankings = phase === 'RACING' && (
        mode === 'CRYPTO' ? (
            (racingTimePassed >= 15 && racingTimePassed <= 18) ||
            (racingTimePassed >= 35 && racingTimePassed <= 38) ||
            (racingTimePassed >= 50 && racingTimePassed <= 53)
        ) : (
            (racingTimePassed >= 60 && racingTimePassed <= 63) ||
            (racingTimePassed >= 120 && racingTimePassed <= 123) ||
            (racingTimePassed >= 180 && racingTimePassed <= 183) ||
            (racingTimePassed >= 240 && racingTimePassed <= 243)
        )
    );

    const isFinal30s = mode === 'FOOTBALL' && phase === 'RACING' && racingTimePassed >= 270;

    const sortedContenders = Object.values(contenders).sort((a: any, b: any) => b.position - a.position);

    const getLanePath = (index: number) => {
        const R = 80 + index * 30;
        return `M 300 ${250 + R} L 700 ${250 + R} A ${R} ${R} 0 0 0 700 ${250 - R} L 300 ${250 - R} A ${R} ${R} 0 0 0 300 ${250 + R} Z`;
    };

    const getPointOnOval = (progress: number, laneIndex: number) => {
        const R = 80 + laneIndex * 30;
        const STR = 400; // Straight length (700-300)
        const CRV = Math.PI * R; // Curve length
        const L = 2 * STR + 2 * CRV; // Total track length

        let mappedProgress = progress;
        let dist = (mappedProgress / 100) * L;
        const PI = Math.PI;

        // START/FINISH is now at (300, 250+R). Moving Right on bottom straight.
        if (dist <= STR) {
            return { x: 300 + dist, y: 250 + R };
        }
        dist -= STR;

        // Right Curve
        if (dist <= CRV) {
            const angle = dist / R;
            const theta = PI / 2 - angle; // from 90 to -90
            return { x: 700 + R * Math.cos(theta), y: 250 + R * Math.sin(theta) };
        }
        dist -= CRV;

        // Top Straight (Moving Left)
        if (dist <= STR) {
            return { x: 700 - dist, y: 250 - R };
        }
        dist -= STR;

        // Left Curve
        if (dist <= CRV) {
            const angle = dist / R;
            const theta = -PI / 2 - angle; // from -90 to -270(90)
            return { x: 300 + R * Math.cos(theta), y: 250 + R * Math.sin(theta) };
        }
        dist -= CRV;

        // Overflow
        return { x: 300 + dist, y: 250 + R };
    };

    const laneCount = Object.keys(contenders).length; // 6

    return (
        <div className={`w-full bg-black/40 backdrop-blur-xl border rounded-3xl p-4 md:p-8 relative shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] transition-all ${isFinal30s ? 'border-red-500/80 shadow-[0_0_50px_rgba(239,68,68,0.3)] animate-[pulse_1s_ease-in-out_infinite]' : 'border-white/10'}`}>
            {isFinal30s && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600/20 border border-red-500 text-red-500 text-xs font-black uppercase tracking-widest px-4 py-1 rounded-full animate-bounce z-50">
                    FINAL 30 SECONDS (3x MULTIPLIER)
                </div>
            )}
            <div className="relative w-full" style={{ paddingBottom: '60%' /* 1000x600 equivalent */ }}>
                <svg
                    viewBox="0 -50 1000 600"
                    className="absolute top-0 left-0 w-full h-full overflow-visible"
                >
                    <defs>
                        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                            <feGaussianBlur stdDeviation="4" result="blur" />
                            <feComposite in="SourceGraphic" in2="blur" operator="over" />
                        </filter>
                    </defs>
                    {/* Track Background */}
                    <rect x="50" y="20" width="900" height="460" rx="230" fill="#1a1c23" stroke="#374151" strokeWidth="4" />
                    <rect x="250" y="220" width="500" height="60" rx="30" fill="#0f1115" stroke="#374151" strokeWidth="4" />

                    {/* Lanes */}
                    {Object.keys(contenders).map((_, i) => (
                        <path
                            key={`lane-${i}`}
                            d={getLanePath(i)}
                            fill="none"
                            stroke="#3b82f6"
                            strokeWidth="2"
                            strokeDasharray="10 5"
                            opacity="0.3"
                        />
                    ))}

                    {/* Finish / Start Line */}
                    <line x1="300" y1="250" x2="300" y2="480" stroke="#fcd34d" strokeWidth="6" strokeDasharray="12 12" className="animate-pulse" />
                    <text x="295" y="470" fill="#fcd34d" fontSize="16" fontWeight="bold" textAnchor="end" transform="rotate(-90 295 470)" className="drop-shadow-[0_0_8px_rgba(252,211,77,0.8)]">
                        START / FINISH
                    </text>

                    {/* Contenders */}
                    {Object.values(contenders).map((contender: any, i: number) => {
                        // Assign a specific lane index to each contender for layout
                        const laneIndex = i; // 0 to 5
                        const { x, y } = getPointOnOval(contender.position, laneIndex);
                        const isWinner = phase === 'FINISHED' && lastWinner === contender.id;

                        return (
                            <foreignObject
                                key={contender.id}
                                x={x - 40} // Center object (width=80)
                                y={y - 40} // Center object (height=80)
                                width="80"
                                height="80"
                                className="overflow-visible"
                                style={{
                                    transition: (phase === 'RACING' || phase === 'PHOTO_FINISH') ? 'x 1s linear, y 1s linear' : 'all 0.5s ease-out'
                                }}
                            >
                                <div
                                    className={`relative w-full h-full flex flex-col items-center justify-center transform ${isWinner ? 'scale-125 animate-pulse' : ''}`}
                                >
                                    {mode === 'FOOTBALL' && <FootballEventOverlay events={contender.recentEvents || []} racingTimePassed={racingTimePassed} />}
                                    <div className="bg-gray-900 rounded-full w-10 h-10 flex items-center justify-center text-sm font-bold relative z-10"
                                        style={{ backgroundColor: contender.color, color: '#fff', filter: 'url(#glow)', boxShadow: `0 0 20px ${contender.color}` }}>
                                        {contender.symbol}
                                    </div>
                                    <div className="bg-black/60 text-[10px] font-mono whitespace-nowrap px-1 mt-1 rounded text-gray-300">
                                        {contender.position.toFixed(1)}%
                                    </div>
                                </div>
                            </foreignObject>
                        );
                    })}
                </svg>

                {/* Interim Ranking Overlay */}
                {showRankings && (
                    <div className="absolute inset-x-0 top-4 flex justify-center pointer-events-none z-50 opacity-90 transition-opacity">
                        <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-full px-6 py-2 shadow-2xl flex items-center gap-6">
                            <span className="text-yellow-400 font-bold text-xs uppercase tracking-widest opacity-80 animate-pulse">Live</span>
                            <div className="flex gap-4">
                                {sortedContenders.map((c: any, index: number) => (
                                    <div key={c.id} className="flex items-center gap-2">
                                        <span className={`font-black text-xs ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-gray-300' : index === 2 ? 'text-amber-600' : 'text-gray-500'}`}>
                                            #{index + 1}
                                        </span>
                                        <div
                                            className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px]"
                                            style={{ backgroundColor: c.color, color: '#fff' }}
                                        >
                                            {c.symbol}
                                        </div>
                                        <span className="text-white text-xs font-semibold">{c.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Photo Finish Zoom Camera */}
                {phase === 'PHOTO_FINISH' && (
                    <div className="absolute right-4 bottom-4 w-48 h-48 sm:w-64 sm:h-64 rounded-full border-4 border-yellow-400 overflow-hidden shadow-[0_0_50px_rgba(250,204,21,0.6)] z-40 bg-black animate-in fade-in zoom-in duration-500">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] sm:text-xs font-black px-3 py-0.5 rounded-full z-10 animate-pulse uppercase tracking-widest shadow-lg">
                            PHOTO FINISH
                        </div>
                        <svg
                            viewBox="200 130 200 320" // Zoomed to show entire vertical span of finish line
                            className="absolute top-0 left-0 w-full h-full object-cover"
                        >
                            <rect x="50" y="20" width="900" height="460" rx="230" fill="#1a1c23" stroke="#374151" strokeWidth="4" />
                            <rect x="250" y="220" width="500" height="60" rx="30" fill="#0f1115" stroke="#374151" strokeWidth="4" />

                            {/* Lanes */}
                            {Object.keys(contenders).map((_, i) => (
                                <path
                                    key={`lane-${i}`}
                                    d={getLanePath(i)}
                                    fill="none"
                                    stroke="#3b82f6"
                                    strokeWidth="2"
                                    strokeDasharray="10 5"
                                    opacity="0.3"
                                />
                            ))}

                            {/* Finish / Start Line */}
                            <line x1="300" y1="210" x2="300" y2="480" stroke="#fcd34d" strokeWidth="6" strokeDasharray="12 12" />

                            {/* Contenders */}
                            {Object.values(contenders).map((contender: any, i: number) => {
                                const laneIndex = i;
                                const { x, y } = getPointOnOval(contender.position, laneIndex);

                                return (
                                    <foreignObject
                                        key={`pip-${contender.id}`}
                                        x={x - 40}
                                        y={y - 40}
                                        width="80"
                                        height="80"
                                        className="overflow-visible"
                                        style={{ transition: 'x 1s linear, y 1s linear' }}
                                    >
                                        <div className="w-full h-full flex flex-col items-center justify-center">
                                            <div className="bg-gray-900 rounded-full w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center text-[10px] sm:text-xs font-bold relative z-10"
                                                style={{ backgroundColor: contender.color, color: '#fff', filter: 'url(#glow)', boxShadow: `0 0 10px ${contender.color}` }}>
                                                {contender.symbol}
                                            </div>
                                        </div>
                                    </foreignObject>
                                );
                            })}
                        </svg>
                    </div>
                )}
            </div>
        </div>
    );
};
