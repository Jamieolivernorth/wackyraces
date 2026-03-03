import React from 'react';
import { useGameStore, TRACK_CONFIGS } from '../store/gameStore';
import { Users, AlertCircle, PlayCircle } from 'lucide-react';

export const TrackSelector = () => {
    const { setSelectedTrack, bets, stagedBets, currentRake } = useGameStore();

    return (
        <div className="w-full bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
                <div>
                    <h2 className="text-xl font-black italic tracking-tighter text-white">SELECT TRACK TIER</h2>
                    <p className="text-sm text-gray-400">Choose your entry level to initialize a betting slip.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
                {Object.values(TRACK_CONFIGS).map((track) => {
                    const trackBets = bets.filter(b => b.trackId === track.id);
                    const trackStagedBets = stagedBets.filter(b => b.trackId === track.id);

                    const uniquePlayers = new Set([...trackBets.map((b: any) => b.userId), ...trackStagedBets.map((b: any) => b.userId)]).size;

                    const totalPlayerPool = trackBets.reduce((sum: number, b: any) => sum + b.amount, 0) + trackStagedBets.reduce((sum: number, b: any) => sum + b.amount, 0);
                    const netPool = (totalPlayerPool * (1 - currentRake)) + track.platformSeed;

                    return (
                        <div key={track.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-4 hover:border-blue-500/50 transition-colors group">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors uppercase">{track.name}</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="flex items-center gap-1 text-xs text-gray-400 bg-black/50 px-2 py-1 rounded">
                                            <Users className="w-3 h-3 text-blue-500" />
                                            {uniquePlayers}/{track.minPlayers} Players
                                        </div>
                                        {track.platformSeed > 0 && (
                                            <div className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded border border-green-500/30">
                                                Seed: +${track.platformSeed}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm text-gray-400 uppercase font-bold text-[10px] tracking-wider">Entry Fee</div>
                                    <div className="text-2xl font-black text-white font-mono">${track.entryFee}</div>
                                </div>
                            </div>

                            <div className="flex justify-between items-center bg-black/30 p-3 rounded-xl border border-white/5">
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-500 font-bold uppercase">Estimated Pool</span>
                                    <span className="text-yellow-400 font-mono font-bold">${netPool.toFixed(2)}</span>
                                </div>
                                <button
                                    onClick={() => setSelectedTrack(track.id)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-bold text-sm transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)] flex items-center gap-2"
                                >
                                    Select <PlayCircle className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 flex items-start gap-3 mt-2">
                <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-gray-300 leading-relaxed">
                    <strong className="text-white">Note:</strong> You can stage entries across multiple tiers simultaneously, but you may only select one runner per tier per race. If a tier fails to meet its minimum player count before the race locks, your entry fee will be fully refunded to your balance.
                </p>
            </div>
        </div>
    );
};
