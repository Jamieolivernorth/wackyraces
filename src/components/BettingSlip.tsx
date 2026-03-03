import React, { useCallback, useRef } from 'react';
import { useGameStore, TRACK_CONFIGS } from '../store/gameStore';
import * as htmlToImage from 'html-to-image';
import { Twitter, Trash2 } from 'lucide-react';

export const BettingSlip = () => {
    const { bets, stagedBets, contenders, phase, walletAddress, removeStagedBet, confirmBets, currentRake } = useGameStore();
    const slipRef = useRef<HTMLDivElement>(null);

    const myBets = bets.filter((b: any) => b.userId === 'me');

    const shareToX = useCallback(() => {
        if (!slipRef.current) return;

        htmlToImage.toPng(slipRef.current, { backgroundColor: '#111827' })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = 'my-wacky-races-bets.png';
                link.href = dataUrl;
                link.click();

                let tweetText = 'Just placed my bets on Wacky Races! 🏁🐎\n\nWin big with me:';
                let shareUrl = 'https://wackyraces.fun';
                if (walletAddress) shareUrl += `?ref=${walletAddress}`;

                const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;
                window.open(intentUrl, '_blank');
            })
            .catch(err => console.error("Failed to generate image", err));
    }, [walletAddress]);

    if (myBets.length === 0 && stagedBets.length === 0) {
        return (
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
                <h3 className="text-gray-500 font-bold uppercase text-[10px] mb-3">🧾 My Betting Slip</h3>
                <p className="text-xs text-gray-500 italic text-center py-2">No active bets placed for this race.</p>
            </div>
        );
    }

    const unconfirmedTotal = stagedBets.reduce((sum, b) => sum + b.amount, 0);

    return (
        <div className="flex flex-col gap-3" ref={slipRef}>
            {Object.values(TRACK_CONFIGS).map(track => {
                const trackStagedBets = stagedBets.filter(b => b.trackId === track.id);
                const trackMyBets = myBets.filter(b => b.trackId === track.id);

                if (trackStagedBets.length === 0 && trackMyBets.length === 0) return null;

                const trackBetsTotal = bets.filter(b => b.trackId === track.id);
                const totalDraftAmount = trackStagedBets.reduce((sum: number, b: any) => sum + b.amount, 0);
                const totalPlayerPool = trackBetsTotal.reduce((sum: number, b: any) => sum + b.amount, 0) + totalDraftAmount;
                const netPool = (totalPlayerPool * (1 - currentRake)) + track.platformSeed;
                const totalStakedTrack = trackMyBets.reduce((sum: number, b: any) => sum + b.amount, 0);

                return (
                    <div key={track.id} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] flex flex-col gap-4">
                        <h3 className="text-gray-500 font-bold uppercase text-[10px] flex justify-between items-center">
                            <span>🧾 {track.name} Slip</span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded ${phase === 'BETTING' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                                {phase === 'BETTING' ? 'OPEN' : 'LOCKED'}
                            </span>
                        </h3>

                        {/* Draft Bets Section */}
                        {trackStagedBets.length > 0 && (
                            <div className="flex flex-col gap-2 relative">
                                <div className="text-[10px] font-bold text-blue-400 bg-blue-900/20 px-2 py-1 inline-block rounded w-max mb-1">DRAFT BETS ✍️</div>
                                {trackStagedBets.map((bet: any) => {
                                    const contender = contenders[bet.contenderId];
                                    if (!contender) return null;

                                    const originalIndex = stagedBets.findIndex(b => b.trackId === track.id && b.contenderId === bet.contenderId);
                                    const totalContenderBets = trackBetsTotal.filter(b => b.contenderId === bet.contenderId).reduce((s, b) => s + b.amount, 0) + trackStagedBets.filter(b => b.contenderId === bet.contenderId).reduce((s, b) => s + b.amount, 0);

                                    let estimatedPayout = 0;
                                    if (totalContenderBets > 0) {
                                        estimatedPayout = (track.entryFee / totalContenderBets) * netPool;
                                    } else if (netPool > 0) {
                                        estimatedPayout = netPool;
                                    }

                                    return (
                                        <div key={`staged-${bet.contenderId}`} className="flex flex-col bg-gray-800/80 border border-blue-500/50 p-2 rounded text-xs">
                                            <div className="flex justify-between items-center w-full">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-bold text-black" style={{ backgroundColor: contender.color }}>
                                                        {contender.symbol}
                                                    </div>
                                                    <span className="font-medium text-gray-300">To Win</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="font-mono text-green-400 font-bold drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">${bet.amount.toLocaleString()}</span>
                                                    <button onClick={() => removeStagedBet(originalIndex)} className="text-gray-500 hover:text-red-400 transition-colors">
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="text-[10px] text-gray-400 mt-2 border-t border-gray-700/50 pt-1 flex justify-between">
                                                <span>Est. Win If Locked:</span>
                                                <span className="text-yellow-400 font-mono">${estimatedPayout.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Confirmed Bets Section */}
                        {trackMyBets.length > 0 && (
                            <div className="flex flex-col gap-2">
                                {trackStagedBets.length > 0 && <div className="text-[10px] font-bold text-green-400 bg-green-900/20 px-2 py-1 inline-block rounded w-max mb-1">LOCKED BETS 🔒</div>}
                                {trackMyBets.map((bet: any) => {
                                    const contender = contenders[bet.contenderId];
                                    if (!contender) return null;

                                    const totalContenderBets = trackBetsTotal.filter(b => b.contenderId === bet.contenderId).reduce((s, b) => s + b.amount, 0);

                                    let estimatedPayout = 0;
                                    if (totalContenderBets > 0) {
                                        estimatedPayout = (track.entryFee / totalContenderBets) * netPool;
                                    } else {
                                        estimatedPayout = netPool;
                                    }

                                    return (
                                        <div key={`locked-${bet.contenderId}`} className="flex flex-col bg-gray-800/40 border border-transparent p-2 rounded text-xs">
                                            <div className="flex justify-between items-center w-full">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-bold text-black opacity-80" style={{ backgroundColor: contender.color }}>
                                                        {contender.symbol}
                                                    </div>
                                                    <span className="font-medium text-gray-400">To Win</span>
                                                </div>
                                                <span className="font-mono text-green-500 font-bold">${bet.amount.toLocaleString()}</span>
                                            </div>
                                            <div className="text-[10px] text-gray-500 mt-2 border-t border-gray-700/30 pt-1 flex justify-between">
                                                <span>Est. Live Payout:</span>
                                                <span className="text-yellow-500/80 font-mono">${estimatedPayout.toFixed(2)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        <div className="border-t border-gray-800 pt-3 flex justify-between items-center mt-1">
                            <span className="text-xs text-gray-500 font-bold uppercase">Staked (Locked)</span>
                            <span className="font-mono text-white text-sm bg-black/50 px-3 py-1 rounded-lg">${totalStakedTrack.toLocaleString()}</span>
                        </div>
                    </div>
                );
            })}

            {/* Global Actions */}
            {stagedBets.length > 0 && (
                <button
                    onClick={confirmBets}
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm py-3 rounded-xl transition-colors shadow-[0_0_15px_rgba(37,99,235,0.4)]"
                >
                    Confirm All Bets (${unconfirmedTotal})
                </button>
            )}

            <button
                onClick={shareToX}
                className="bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 text-[#1DA1F2] border border-[#1DA1F2]/50 text-xs font-bold py-2 rounded-xl transition-colors flex justify-center items-center gap-2 mt-2"
            >
                <Twitter className="w-4 h-4" /> Share Slips to X
            </button>
        </div>
    );
};
