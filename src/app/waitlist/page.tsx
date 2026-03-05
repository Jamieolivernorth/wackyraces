'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Twitter, Copy, CheckCircle2, ChevronRight, Fingerprint, Zap, Mail, Instagram, Download, Loader2 } from 'lucide-react';
import Link from 'next/link';
import * as htmlToImage from 'html-to-image';

export default function WaitlistPage() {
    const { publicKey, connected } = useWallet();
    const [referralLink, setReferralLink] = useState('');
    const [copied, setCopied] = useState(false);
    const [spotsLeft, setSpotsLeft] = useState(0);

    // Form state
    const [email, setEmail] = useState('');
    const [twitter, setTwitter] = useState('');
    const [instagram, setInstagram] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const posterRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Mock a countdown of waitlist spots out of 500 for FOMO
        setSpotsLeft(Math.floor(500 - (Math.random() * 50 + 440)));
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/waitlist', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    twitter: twitter || undefined,
                    instagram: instagram || undefined,
                    wallet: connected && publicKey ? publicKey.toBase58() : undefined
                })
            });

            const data = await res.json();

            if (res.ok) {
                setReferralLink(`https://wackyraces.fun/waitlist?ref=${data.trackingRef}`);
                setIsSuccess(true);
            } else {
                setErrorMsg(data.error || 'Failed to join waitlist. Please verify your info.');
            }
        } catch (err) {
            setErrorMsg('Network error. Please try again later.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(referralLink);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleXShare = () => {
        const text = `Are you ready to get wacky? 🏁\n\nI just secured my spot for the @WackyRaces Alpha. Sign up using my ticket to capture a 50% lifetime rake share at launch. 👇`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(referralLink)}`;
        window.open(url, '_blank');
    };

    const handleDownloadPoster = () => {
        if (!posterRef.current) return;

        htmlToImage.toPng(posterRef.current, { backgroundColor: '#050505' })
            .then((dataUrl) => {
                const link = document.createElement('a');
                link.download = 'wacky-races-beta-ticket.png';
                link.href = dataUrl;
                link.click();
            })
            .catch(err => console.error("Failed to generate image", err));
    };

    return (
        <div className="min-h-screen bg-black text-white font-sans flex flex-col relative overflow-hidden selection:bg-pink-500/30">

            {/* Nav */}
            <header className="absolute top-0 w-full p-6 flex justify-between items-center z-50 border-b border-white/5 bg-black/50 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <img src="/logo-white.png" alt="Wacky Races Logo" className="h-6 md:h-8 w-auto" />
                    <span className="text-pink-500 text-xs font-mono font-bold tracking-widest ml-1 opacity-70">BETA</span>
                </div>
                {connected && (
                    <Link href="/" className="text-xs font-mono font-bold text-gray-400 hover:text-white transition-colors flex items-center gap-1 uppercase">
                        Launch Dapp <ChevronRight className="w-4 h-4" />
                    </Link>
                )}
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10 text-center container mx-auto max-w-4xl mt-24">

                <div className="flex flex-col lg:flex-row items-center gap-12 w-full max-w-6xl mx-auto mb-20 text-left">
                    <div className="flex-1 flex flex-col items-center lg:items-start w-full">
                        <div className="inline-flex items-center gap-2 bg-[#050505] text-gray-400 font-mono text-[10px] uppercase font-bold px-4 py-2 rounded-full border border-gray-800 mb-8 shadow-[0_0_15px_rgba(219,39,119,0.1)]">
                            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                            Exclusive Access Event
                        </div>

                        <h2 className="text-5xl md:text-6xl lg:text-7xl font-black italic tracking-tighter mb-6 leading-[1.0] text-white text-center lg:text-left">
                            ARE YOU READY TO GET <br /> <span className="text-transparent bg-clip-text bg-gradient-to-b from-pink-400 to-pink-600">WACKY?</span>
                        </h2>

                        <p className="text-gray-400 text-lg md:text-xl mb-8 max-w-xl leading-relaxed font-light text-center lg:text-left">
                            The pari-mutuel exchange engineered for pure volume. <br />
                            <span className="text-white font-bold block mt-4">
                                The first 500 signups gain a lifetime 50% referral rake share.
                            </span>
                        </p>

                        <div className="relative w-full max-w-md group">
                            {/* Ambient Glow behind card */}
                            <div className="absolute inset-0 bg-pink-600/10 blur-[100px] rounded-full mix-blend-screen opacity-50 group-hover:opacity-70 transition-opacity duration-1000" />
                            <div className="bg-[#050505] backdrop-blur-3xl border border-gray-800 rounded-2xl p-8 relative z-10 shadow-2xl transition-all duration-300">

                                {!isSuccess ? (
                                    <div className="flex flex-col items-center gap-6">
                                        <div className="w-16 h-16 bg-pink-900/20 rounded-2xl flex items-center justify-center border border-pink-500/20 group-hover:scale-110 transition-transform">
                                            <Zap className="w-8 h-8 text-pink-500 animate-[pulse_2s_infinite]" />
                                        </div>
                                        <div className="space-y-2 text-center w-full">
                                            <h3 className="text-3xl font-bold tracking-tight">Secure Your Spot</h3>
                                            <p className="text-gray-500 text-sm font-mono">Join the elite rank before capacity closes.</p>
                                        </div>

                                        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                <input
                                                    type="email"
                                                    required
                                                    value={email}
                                                    onChange={e => setEmail(e.target.value)}
                                                    placeholder="Enter your email"
                                                    className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-all font-mono text-sm"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="relative">
                                                    <Twitter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                    <input
                                                        type="text"
                                                        value={twitter}
                                                        onChange={e => setTwitter(e.target.value)}
                                                        placeholder="X handle (opt)"
                                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 transition-all font-mono text-sm"
                                                    />
                                                </div>
                                                <div className="relative">
                                                    <Instagram className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                                    <input
                                                        type="text"
                                                        value={instagram}
                                                        onChange={e => setInstagram(e.target.value)}
                                                        placeholder="IG handle (opt)"
                                                        className="w-full bg-gray-900/50 border border-gray-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-400 focus:ring-1 focus:ring-pink-400 transition-all font-mono text-sm"
                                                    />
                                                </div>
                                            </div>

                                            {!connected ? (
                                                <div className="text-center mt-2 mb-2">
                                                    <p className="text-xs text-gray-600 mb-2">Optional: Connect wallet for on-chain tracking</p>
                                                    <div className="flex justify-center">
                                                        <WalletMultiButton className="!bg-gray-800 hover:!bg-gray-700 !text-white transition-colors !rounded-lg !h-10 !px-6 !font-bold !text-xs !font-sans" />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center mt-2 mb-2 border border-green-500/20 bg-green-900/10 rounded-lg py-2">
                                                    <p className="text-xs text-green-400 font-mono flex justify-center items-center gap-2">
                                                        <CheckCircle2 className="w-3 h-3" /> Wallet On-Chain Tracking Enabled
                                                    </p>
                                                </div>
                                            )}

                                            {errorMsg && <p className="text-red-400 text-xs text-center font-mono bg-red-900/20 py-2 rounded">{errorMsg}</p>}

                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="w-full bg-pink-600 hover:bg-pink-500 text-white font-bold py-4 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2 shadow-[0_0_20px_rgba(219,39,119,0.3)] disabled:opacity-50"
                                            >
                                                {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Enter the Event'}
                                            </button>
                                        </form>

                                        <div className="flex items-center justify-center gap-3 text-xs text-pink-400 font-mono mt-2 bg-pink-950/30 px-4 py-2 rounded-lg border border-pink-900/50 w-full animate-pulse shadow-[0_0_15px_rgba(219,39,119,0.2)]">
                                            <Zap className="w-4 h-4" />
                                            <span>CRITICAL LIMIT: <strong className="text-white ml-1">{spotsLeft} / 500 Remaining</strong></span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center gap-6 animate-fade-in text-left w-full">
                                        <div className="w-full flex items-center gap-4 border-b border-gray-800 pb-6 mb-2">
                                            <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center border border-green-500/20 shrink-0">
                                                <CheckCircle2 className="w-6 h-6 text-green-500" />
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <h3 className="text-xl font-bold text-white tracking-tight truncate">Spot Secured</h3>
                                                <p className="text-gray-500 font-mono text-xs truncate">
                                                    Welcome to the underground.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="w-full">
                                            <h4 className="font-bold mb-2 text-sm text-gray-300 tracking-wide uppercase">Your Edge: 50% Lifetime Rake</h4>
                                            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
                                                Generate hype. Distribute your unique link below to capture a <strong className="text-pink-400">50% net revenue share</strong> on all trading volume generated by your referrals.
                                            </p>

                                            <div className="space-y-4">
                                                <div className="flex gap-2 relative">
                                                    <input
                                                        type="text"
                                                        readOnly
                                                        value={referralLink}
                                                        className="flex-1 bg-black border border-gray-800 rounded-lg px-4 py-3 text-xs text-gray-300 font-mono outline-none focus:border-pink-500 transition-colors"
                                                    />
                                                    <button
                                                        onClick={handleCopy}
                                                        className="bg-white hover:bg-gray-200 text-black rounded-lg px-4 transition-colors font-bold flex items-center justify-center shrink-0"
                                                        title="Copy Link"
                                                    >
                                                        {copied ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <button
                                                        onClick={handleXShare}
                                                        className="w-full bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 border border-[#1DA1F2]/30 text-[#1DA1F2] rounded-lg py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 group"
                                                    >
                                                        <Twitter className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                                        Share to X
                                                    </button>
                                                    <button
                                                        onClick={handleDownloadPoster}
                                                        className="w-full bg-pink-600/10 hover:bg-pink-600/20 border border-pink-500/30 text-pink-400 rounded-lg py-3 text-sm font-bold transition-colors flex items-center justify-center gap-2 group"
                                                    >
                                                        <Download className="w-4 h-4 group-hover:-translate-y-1 transition-transform" />
                                                        Save Ticket
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 w-full max-w-2xl relative group perspective-[1000px]">
                        <div className="absolute inset-0 bg-pink-500/10 blur-[80px] rounded-full mix-blend-screen opacity-60 group-hover:opacity-100 transition-opacity duration-1000" />
                        <img
                            src="/hero-track.jpg"
                            alt="Crypto tokens racing on track"
                            className="w-full h-auto object-cover rounded-3xl border border-white/10 shadow-[0_20px_60px_-15px_rgba(219,39,119,0.2)] relative z-10 transform-gpu hover:scale-[1.02] transition-transform duration-700"
                        />
                    </div>
                </div>
            </main>

            {/* Informational Sections */}
            <section className="max-w-7xl mx-auto mt-24 mb-16 px-4 relative z-10 w-full">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-black italic neon-text-pink text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600 inline-block mb-4">How It Works</h2>
                    <div className="w-24 h-1 bg-pink-500 mx-auto rounded-full neon-text-pink opacity-50"></div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                    {/* Connecting Line (Desktop) */}
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-[2px] bg-gradient-to-r from-gray-900 via-pink-500/30 to-gray-900 -z-10 translate-y-[-50%]"></div>

                    <div className="bg-black/80 backdrop-blur-md border border-gray-800 rounded-2xl p-8 text-center hover:border-pink-500/50 transition-colors group">
                        <div className="w-16 h-16 rounded-full bg-pink-900/30 border border-pink-500/50 text-pink-400 font-black text-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-pink-500 group-hover:text-black transition-all">1</div>
                        <h3 className="text-xl font-bold mb-3 text-white">Choose Your Tier</h3>
                        <p className="text-gray-400 text-sm">Select from Casual, Pro, or High Roller tracks. Different tracks run simultaneously with segregated liquidity pools.</p>
                    </div>

                    <div className="bg-black/80 backdrop-blur-md border border-gray-800 rounded-2xl p-8 text-center hover:border-purple-500/50 transition-colors group">
                        <div className="w-16 h-16 rounded-full bg-purple-900/30 border border-purple-500/50 text-purple-400 font-black text-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-purple-500 group-hover:text-black transition-all">2</div>
                        <h3 className="text-xl font-bold mb-3 text-white">Place Your Bet</h3>
                        <p className="text-gray-400 text-sm">Review the contenders and stage your prediction. All bets go into a pari-mutuel pool—you're playing against other traders, not the house.</p>
                    </div>

                    <div className="bg-black/80 backdrop-blur-md border border-gray-800 rounded-2xl p-8 text-center hover:border-pink-500/50 transition-colors group">
                        <div className="w-16 h-16 rounded-full bg-pink-900/30 border border-pink-500/50 text-pink-400 font-black text-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 group-hover:bg-pink-500 group-hover:text-black transition-all">3</div>
                        <h3 className="text-xl font-bold mb-3 text-white">Ride The Lightning</h3>
                        <p className="text-gray-400 text-sm">Watch the live 5-minute race powered by real-world token volatility or live sports data. Winners split the net pool automatically via Smart Contract.</p>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="max-w-4xl mx-auto mt-16 mb-24 px-4 relative z-10 w-full">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-black italic neon-text-pink text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-600 inline-block mb-4">Underground Intel (FAQ)</h2>
                    <div className="w-24 h-1 bg-pink-500 mx-auto rounded-full neon-text-pink opacity-50"></div>
                </div>

                <div className="space-y-4 text-left">
                    {[
                        { q: "Is this real money?", a: "Currently, Wacky Races runs entirely on the Solana Devnet/Testnet. You do not wager real money. It is a proof of concept." },
                        { q: "How is player movement calculated?", a: "In Crypto Mode, movement is driven by 1-second interval Binance websocket price ticks. In Match Day Mode, movement is driven by live football events evaluated over a rolling 30-second window." },
                        { q: "What is Pari-Mutuel betting?", a: "Instead of fixed odds set by a bookmaker, all bets placed enter a shared pool. The house takes a slight rake, and the remaining pool is split entirely between those who backed the winning contender, proportionally to their bet size." },
                        { q: "What happens if a race fails to start?", a: "If the minimum player liquidity threshold map is not met before the timer expires, the race cancels and all staged bets are automatically refunded to your Wallet." }
                    ].map((faq, i) => (
                        <div key={i} className="bg-black/60 border border-gray-800 rounded-xl p-6 hover:border-gray-600 transition-colors">
                            <h4 className="text-lg font-bold text-gray-200 mb-2 font-mono flex items-start gap-3">
                                <span className="text-pink-500">{'>'}</span> {faq.q}
                            </h4>
                            <p className="text-gray-400 text-sm pl-6 leading-relaxed">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Hidden Poster Generator */}
            <div className="fixed top-[-9999px] left-[-9999px] z-[-1]">
                <div ref={posterRef} className="w-[800px] h-[1000px] bg-black text-white p-12 flex flex-col justify-between items-center relative overflow-hidden font-sans border border-gray-800" style={{ backgroundImage: "url('/hero-track.jpg')", backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <div className="absolute inset-0 bg-black/70 mix-blend-overlay"></div>
                    <div className="absolute inset-0 bg-gradient-to-b from-black/90 via-black/40 to-black/90"></div>

                    {/* Content */}
                    <div className="relative z-10 w-full flex flex-col items-center justify-center flex-1 text-center">
                        <img src="/logo-3d.png" alt="Wacky Races Logo" className="w-80 mb-12 drop-shadow-2xl" />
                        <h2 className="text-7xl font-black italic tracking-tighter mb-8 leading-[0.9]">
                            ARE YOU READY TO GET <br /> <span className="text-transparent bg-clip-text bg-gradient-to-b from-pink-400 to-pink-600">WACKY?</span>
                        </h2>

                        <div className="bg-black/60 backdrop-blur-xl border border-pink-500/30 p-8 rounded-3xl mt-8 shadow-[0_0_50px_rgba(219,39,119,0.3)] min-w-[500px]">
                            <p className="text-pink-400 font-mono text-xl mb-4 font-bold tracking-widest text-center">BETA ACCESS SECURED</p>
                            <p className="text-gray-300 text-2xl font-light text-center">
                                My Referral Code: <br />
                                <span className="font-mono text-4xl text-white font-bold block mt-6 border-b-2 border-pink-500 pb-2 inline-block">
                                    {referralLink.split('ref=')[1] || 'PENDING'}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="border-t border-gray-900 bg-black/50 py-8 lg:py-12 mt-auto w-full relative z-10">
                <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between opacity-50 text-xs">
                    <div className="flex items-center gap-2 opacity-80 hover:opacity-100 transition-opacity">
                        <img src="/logo-white.png" alt="Wacky Races Logo" className="h-6 w-auto" />
                    </div>
                    <div className="mt-4 md:mt-0">© {new Date().getFullYear()} All Rights Reserved. Not financial advice.</div>
                </div>
            </footer>
        </div>
    );
}
