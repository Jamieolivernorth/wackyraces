import React from 'react';
import { useGameStore, TRACK_CONFIGS } from '../store/gameStore';
import { ContenderId } from '../types/game';
import { TrackSelector } from './TrackSelector';
import { ChevronLeft } from 'lucide-react';

export const BettingPanel = () => {
    const { contenders, bets, stagedBets, userBalance, stageBet, phase, currentRake, mode, selectedTrackId, setSelectedTrack } = useGameStore();

    if (!selectedTrackId) {
        return <TrackSelector />;
    }

    const track = TRACK_CONFIGS[selectedTrackId];

    const trackBets = bets.filter(b => b.trackId === selectedTrackId);
    const trackStagedBets = stagedBets.filter(b => b.trackId === selectedTrackId);

    const handleBet = (contenderId: ContenderId) => {
        stageBet(contenderId, track.entryFee);
    };

    const totalStaged = trackStagedBets.reduce((sum: number, b: any) => sum + b.amount, 0);
    const availableBalance = userBalance - stagedBets.reduce((sum: number, b: any) => sum + b.amount, 0);

    // Check if user has an active entry in this track
    const hasEntry = trackStagedBets.some((b: any) => b.userId === 'me') || trackBets.some((b: any) => b.userId === 'me');

    const totalPlayerPool = trackBets.reduce((sum: number, b: any) => sum + b.amount, 0) + totalStaged;
    const totalPool = totalPlayerPool + track.platformSeed;
    const netPool = (totalPlayerPool * (1 - currentRake)) + track.platformSeed;

    const uniquePlayers = new Set([...trackBets.map((b: any) => b.userId), ...trackStagedBets.map((b: any) => b.userId)]).size;

    return (
        <div className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] flex flex-col gap-4 sm:gap-6">

            <div className="flex justify-between items-center -mb-2">
                <button
                    onClick={() => setSelectedTrack(null)}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                >
                    <ChevronLeft className="w-4 h-4" /> Back to Tracks
                </button>
                <div className="text-right">
                    <span className="text-lg font-black italic uppercase text-white">{track.name} Tier</span>
                </div>
            </div>

            {/* Header Info */}
            <div className="flex justify-between items-center bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex flex-col gap-1">
                    <p className="text-gray-400 text-sm">Race Liquidity</p>
                    <div className="flex items-center gap-2">
                        <p className="text-xl font-bold text-white">{uniquePlayers}/{track.minPlayers} Players</p>
                        {uniquePlayers < track.minPlayers && (
                            <span className="text-[10px] text-orange-400 bg-orange-500/20 px-2 py-0.5 rounded border border-orange-500/30">
                                {track.minPlayers - uniquePlayers} more needed
                            </span>
                        )}
                        {uniquePlayers >= track.minPlayers && (
                            <span className="text-[10px] text-green-400 bg-green-500/20 px-2 py-0.5 rounded border border-green-500/30">
                                Ready to Race ✓
                            </span>
                        )}
                    </div>
                </div>
                <div className="text-right flex flex-col gap-1">
                    <p className="text-gray-400 text-sm">Total Pool</p>
                    <p className="text-2xl font-bold text-yellow-400">${totalPool.toFixed(2)}</p>
                </div>
            </div>

            {/* Betting Grid */}
            <div className="grid grid-cols-1 gap-4">
                {Object.values(contenders).map((contender: any) => {
                    const contenderBets = trackBets.filter((b: any) => b.contenderId === contender.id);
                    const totalContenderBet = contenderBets.reduce((sum: number, b: any) => sum + b.amount, 0);

                    // Calculate dynamic odds - ProjectedMultiplier = Net / (EntriesOnRunner * E)
                    let multiplier = 0;
                    if (totalContenderBet > 0) {
                        multiplier = netPool / totalContenderBet;
                    } else if (netPool > 0) {
                        multiplier = netPool / track.entryFee; // Projected output if you are the first bet on this runner
                    }

                    const myContenderBets = contenderBets.filter((b: any) => b.userId === 'me').reduce((sum: number, b: any) => sum + b.amount, 0);

                    return (
                        <div key={contender.id} className="bg-white/5 rounded-xl p-3 sm:p-4 border border-white/10 flex flex-col gap-2 sm:gap-3 transition-all duration-300 hover:scale-[1.02] hover:border-blue-500/50 hover:bg-white/10 hover:shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white shadow-[0_0_10px_rgba(255,255,255,0.3)]" style={{ backgroundColor: contender.color }}>
                                        {contender.symbol}
                                    </div>
                                    <span className="font-bold text-white">{contender.name}</span>
                                    {mode === 'FOOTBALL' && (
                                        <span className="bg-green-600/30 text-green-400 text-[10px] px-2 py-0.5 rounded ml-2 border border-green-500/30">
                                            {contender.currentMetric} / {contender.targetMetric} Touches
                                        </span>
                                    )}
                                    {mode === 'CRYPTO' && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded ml-2 border ${contender.performance >= 0 ? 'bg-green-600/30 text-green-400 border-green-500/30' : 'bg-red-600/30 text-red-400 border-red-500/30'}`}>
                                            {contender.performance >= 0 ? '+' : ''}{(contender.performance * 100).toFixed(2)}%
                                        </span>
                                    )}
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] text-gray-400 block uppercase font-bold tracking-wider">Est Payout</span>
                                    <span className="text-sm font-bold text-yellow-400">{multiplier > 0 ? `${multiplier.toFixed(2)}x` : '-'}</span>
                                </div>
                            </div>

                            <div className="flex justify-between text-xs text-gray-400 bg-black/20 p-2 rounded-lg">
                                <span>Pool: <span className="text-white font-mono">${totalContenderBet.toFixed(0)}</span></span>
                                <span>Your Bet: <span className="text-green-400 font-mono">${myContenderBets.toFixed(0)}</span></span>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    disabled={phase !== 'BETTING' || hasEntry || availableBalance < track.entryFee}
                                    onClick={() => handleBet(contender.id)}
                                    className={`flex-1 ${hasEntry ? 'bg-gray-600/50' : 'bg-blue-600/80 hover:bg-blue-500'} disabled:opacity-50 border border-white/10 text-white py-2.5 rounded-lg text-sm font-bold transition-all text-center flex items-center justify-center gap-2`}
                                >
                                    {hasEntry ? 'Entry Locked' : `Select Runner ($${track.entryFee})`}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

        </div>
    );
};
