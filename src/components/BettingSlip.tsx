import React, { useCallback, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import * as htmlToImage from 'html-to-image';
import { Twitter } from 'lucide-react';

export const BettingSlip = () => {
    const bets = useGameStore(state => state.bets);
    const tokens = useGameStore(state => state.tokens);
    const phase = useGameStore(state => state.phase);
    const walletAddress = useGameStore(state => state.walletAddress);
    const slipRef = useRef<HTMLDivElement>(null);

    const myBets = bets.filter(b => b.userId === 'me');

    const shareToX = useCallback(() => {
        if (!slipRef.current) return;

        // 1. Generate Image
        htmlToImage.toPng(slipRef.current, { backgroundColor: '#111827' })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = 'my-wacky-races-bets.png';
                link.href = dataUrl;
                link.click();

                // 2. Open Twitter Intent
                let tweetText = 'Just placed my bets on Wacky Races! 🏁🐎\n\nWin big with me:';
                let shareUrl = 'https://wackyraces.fun';
                if (walletAddress) shareUrl += `?ref=${walletAddress}`;

                const intentUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}&url=${encodeURIComponent(shareUrl)}`;
                window.open(intentUrl, '_blank');
            })
            .catch(err => console.error("Failed to generate image", err));
    }, [walletAddress]);

    if (myBets.length === 0) {
        return (
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]">
                <h3 className="text-gray-500 font-bold uppercase text-[10px] mb-3">🧾 My Betting Slip</h3>
                <p className="text-xs text-gray-500 italic text-center py-2">No active bets placed for this race.</p>
            </div>
        );
    }

    const totalStaked = myBets.reduce((sum, b) => sum + b.amount, 0);

    return (
        <div className="flex flex-col gap-3">
            <div ref={slipRef} className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] flex flex-col">
                <h3 className="text-gray-500 font-bold uppercase text-[10px] mb-3 flex justify-between items-center">
                    <span>🧾 My Betting Slip</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${phase === 'BETTING' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'}`}>
                        {phase === 'BETTING' ? 'OPEN' : 'LOCKED'}
                    </span>
                </h3>

                <div className="flex flex-col gap-2 mb-3">
                    {myBets.map((bet, idx) => {
                        const token = tokens[bet.tokenId];
                        if (!token) return null;
                        return (
                            <div key={idx} className="flex justify-between items-center bg-gray-800/50 p-2 rounded text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-full flex items-center justify-center text-[6px] font-bold text-black" style={{ backgroundColor: token.color }}>
                                        {token.symbol}
                                    </div>
                                    <span className="font-medium text-gray-300">To Win</span>
                                </div>
                                <span className="font-mono text-green-400 font-bold">${bet.amount.toLocaleString()}</span>
                            </div>
                        );
                    })}
                </div>

                <div className="border-t border-gray-800 pt-2 flex justify-between items-center mt-auto">
                    <span className="text-xs text-gray-500 font-bold uppercase">Total Staked</span>
                    <span className="font-mono text-white">${totalStaked.toLocaleString()}</span>
                </div>
            </div>

            <button
                onClick={shareToX}
                className="bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 text-[#1DA1F2] border border-[#1DA1F2]/50 text-xs font-bold py-2 rounded-xl transition-colors flex justify-center items-center gap-2"
            >
                <Twitter className="w-4 h-4" /> Share to X
            </button>
        </div>
    );
};
