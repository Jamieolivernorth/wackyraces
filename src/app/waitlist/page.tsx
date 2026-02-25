'use client';

import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Twitter, Copy, CheckCircle2, ChevronRight, Gift } from 'lucide-react';
import Link from 'next/link';

export default function WaitlistPage() {
    const { publicKey, connected } = useWallet();
    const [referralLink, setReferralLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [spotsLeft, setSpotsLeft] = useState(0);

    useEffect(() => {
        // Mock a countdown of waitlist spots
        setSpotsLeft(Math.floor(1000 - (Math.random() * 200 + 750)));
    }, []);

    useEffect(() => {
        if (connected && publicKey) {
            setReferralLink(`https://wackyraces.fun/waitlist?ref=${publicKey.toBase58()}`);
        }
    }, [connected, publicKey]);

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleXShare = () => {
        const text = `I'm on the waitlist for @WackyRaces 🏁🐎\n\nSign up with my link to grab a massive Testnet USDC airdrop when we launch this weekend! 👇`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans background-gradient flex flex-col relative overflow-hidden">

            {/* Nav */}
            <header className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-pink-500 drop-shadow-[0_0_10px_rgba(236,72,153,0.3)]">
                        WACKY RACES
                    </h1>
                </div>
                {connected && (
                    <Link href="/" className="text-sm font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1">
                        Go to Platform <ChevronRight className="w-4 h-4" />
                    </Link>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 text-center container mx-auto max-w-3xl mt-20">

                <div className="inline-block bg-blue-500/20 text-blue-400 font-mono text-xs font-bold px-3 py-1 rounded-full border border-blue-500/50 mb-8 animate-pulse">
                    🚀 MAINNET BETA LAUNCHING THIS WEEKEND
                </div>

                <h2 className="text-5xl md:text-7xl font-black italic tracking-tight mb-6" style={{ textShadow: '0 0 40px rgba(255,255,255,0.2)' }}>
                    SECURE YOUR SPOT.<br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-600">CLAIM YOUR AIRDROP.</span>
                </h2>

                <p className="text-gray-400 text-lg md:text-xl mb-12 max-w-2xl leading-relaxed">
                    The first 1,000 users on the waitlist will receive a massive **House Bankroll Airdrop** of Testnet USDC to bet with on Launch Day.
                </p>

                <div className="bg-black/40 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 md:p-12 shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-xl">

                    {!connected ? (
                        <div className="flex flex-col items-center gap-6">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-2">
                                <Gift className="w-8 h-8 text-blue-400" />
                            </div>
                            <h3 className="text-2xl font-bold">Connect to Join</h3>
                            <p className="text-gray-400 text-sm mb-4">Connect your Solana wallet to reserve your spot.</p>

                            <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-500 transition-colors !rounded-xl !h-14 !px-8 !font-bold !text-lg w-full flex justify-center shadow-[0_0_20px_rgba(37,99,235,0.4)]" />

                            <p className="text-xs text-gray-500 font-mono mt-4">
                                <span className="text-green-400 font-bold">{spotsLeft}</span> AIRDROP SPOTS REMAINING
                            </p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-6 animate-fade-in">
                            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mb-2 border border-green-500/50">
                                <CheckCircle2 className="w-8 h-8 text-green-400" />
                            </div>
                            <h3 className="text-2xl font-bold text-white">You're on the Waitlist!</h3>
                            <p className="text-gray-400 text-sm mb-2">
                                Connected as <span className="text-blue-400 font-mono">{publicKey?.toBase58().slice(0, 4)}...{publicKey?.toBase58().slice(-4)}</span>
                            </p>

                            <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-6 mt-4">
                                <h4 className="font-bold mb-2 text-sm text-gray-300">Invite Friends, Earn More</h4>
                                <p className="text-xs text-gray-500 mb-4">
                                    Get <strong className="text-green-400">+$100 USDC</strong> airdropped for every friend who joins via your link, plus a <strong className="text-purple-400">2% Referral Fee</strong> on all their future races!
                                </p>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        readOnly
                                        value={referralLink}
                                        className="flex-1 bg-black/50 border border-gray-700 rounded-lg px-3 py-2 text-xs text-gray-400 font-mono outline-none"
                                    />
                                    <button
                                        onClick={handleCopy}
                                        className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg p-2 transition-colors text-white"
                                        title="Copy Link"
                                    >
                                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>

                                <button
                                    onClick={handleXShare}
                                    className="w-full mt-4 bg-[#1DA1F2]/20 hover:bg-[#1DA1F2]/30 border border-[#1DA1F2]/50 text-[#1DA1F2] rounded-lg py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Twitter className="w-4 h-4" /> Share Link on X
                                </button>
                            </div>
                        </div>
                    )}

                </div>
            </main>

            {/* Background Details */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 blur-[120px] rounded-full mix-blend-screen" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-pink-600/20 blur-[120px] rounded-full mix-blend-screen" />
            </div>

        </div>
    );
}
