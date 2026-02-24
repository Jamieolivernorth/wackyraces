import React from 'react';
import { useGameStore } from '../store/gameStore';

export const RaceTrack = () => {
    const tokens = useGameStore((state) => state.tokens);
    const phase = useGameStore((state) => state.phase);
    const lastWinner = useGameStore((state) => state.lastWinner);

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

    const laneCount = Object.keys(tokens).length; // 6

    return (
        <div className="w-full bg-gray-900 border-2 border-gray-800 rounded-2xl p-4 md:p-8 relative overflow-hidden shadow-2xl">
            <div className="relative w-full" style={{ paddingBottom: '60%' /* 1000x600 equivalent */ }}>
                <svg
                    viewBox="0 -50 1000 600"
                    className="absolute top-0 left-0 w-full h-full overflow-visible"
                >
                    {/* Track Background */}
                    <rect x="50" y="20" width="900" height="460" rx="230" fill="#1a1c23" stroke="#374151" strokeWidth="4" />
                    <rect x="250" y="220" width="500" height="60" rx="30" fill="#0f1115" stroke="#374151" strokeWidth="4" />

                    {/* Lanes */}
                    {Object.keys(tokens).map((_, i) => (
                        <path
                            key={`lane-${i}`}
                            d={getLanePath(i)}
                            fill="none"
                            stroke="#2d3748"
                            strokeWidth="2"
                            strokeDasharray="10 5"
                            opacity="0.5"
                        />
                    ))}

                    {/* Finish / Start Line */}
                    <line x1="300" y1="250" x2="300" y2="480" stroke="#fcd34d" strokeWidth="6" strokeDasharray="12 12" />
                    <text x="295" y="470" fill="#fcd34d" fontSize="16" fontWeight="bold" textAnchor="end" transform="rotate(-90 295 470)">
                        START / FINISH
                    </text>

                    {/* Tokens */}
                    {Object.values(tokens).map((token, i) => {
                        // Assign a specific lane index to each token for layout
                        const laneIndex = i; // 0 to 5
                        const { x, y } = getPointOnOval(token.position, laneIndex);
                        const isWinner = phase === 'FINISHED' && lastWinner === token.id;

                        return (
                            <foreignObject
                                key={token.id}
                                x={x - 40} // Center object (width=80)
                                y={y - 40} // Center object (height=80)
                                width="80"
                                height="80"
                                className="overflow-visible"
                                style={{
                                    transition: phase === 'RACING' ? 'x 1s linear, y 1s linear' : 'all 0.5s ease-out'
                                }}
                            >
                                <div
                                    className={`w-full h-full flex flex-col items-center justify-center transform ${isWinner ? 'scale-125 animate-pulse' : ''}`}
                                >
                                    <div className="bg-gray-900 border-2 border-white/20 rounded-full w-10 h-10 flex items-center justify-center shadow-[0_0_15px_rgba(255,255,255,0.2)] text-sm font-bold relative z-10"
                                        style={{ backgroundColor: token.color, color: '#fff' }}>
                                        {token.symbol}
                                    </div>
                                    <div className="bg-black/60 text-[10px] font-mono whitespace-nowrap px-1 mt-1 rounded text-gray-300">
                                        {token.position.toFixed(1)}%
                                    </div>
                                </div>
                            </foreignObject>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
};
