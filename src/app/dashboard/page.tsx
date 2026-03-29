'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { LogOut, LayoutDashboard, UserCircle, PlayCircle, Trophy, Zap, ChevronRight, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
    const { user, ready, authenticated, logout, linkEmail } = usePrivy();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [isPrivateModalOpen, setIsPrivateModalOpen] = useState(false);
    const [privateEntryFee, setPrivateEntryFee] = useState<number>(10);
    const [privateMode, setPrivateMode] = useState<string>('CRYPTO');
    const [isCreatingPrivateRace, setIsCreatingPrivateRace] = useState(false);

    const handleCreatePrivateRace = async () => {
        if (!user?.wallet?.address) return;
        setIsCreatingPrivateRace(true);
        try {
            const res = await fetch('/api/race/private/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    hostWallet: user.wallet.address,
                    mode: privateMode,
                    entryFee: privateEntryFee
                })
            });
            const data = await res.json();
            if (data.success) {
                router.push(`/game/private/${data.raceId}`);
            }
        } catch (e) {
            console.error('Failed to create private race', e);
        } finally {
            setIsCreatingPrivateRace(false);
        }
    };

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Redirect if not authenticated (basic protection)
    // BYPASS: If the user is hitting the /demo backdoor URL, bypass this auth check.
    useEffect(() => {
        if (typeof window !== 'undefined' && window.location.pathname === '/demo') {
            return;
        }
        if (ready && !authenticated) {
            router.push('/');
        }
    }, [ready, authenticated, router]);

    if (!isClient || !ready || (!authenticated && typeof window !== 'undefined' && window.location.pathname !== '/demo')) {
        console.log("Loading state: ", { isClient, ready, authenticated, pathname: typeof window !== 'undefined' ? window.location.pathname : 'server' });
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    // Determine user display identifier
    const userIdentifier = user?.wallet?.address
        ? `${user.wallet.address.slice(0, 4)}...${user.wallet.address.slice(-4)}`
        : user?.email?.address
            ? user.email.address
            : 'Unknown Operator';

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col selection:bg-blue-500/30">
            {/* Top Navigation */}
            <header className="w-full p-4 border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <img src="/logo-white.png" alt="Wacky Races Logo" className="h-6 sm:h-8 w-auto mix-blend-screen opacity-90 hover:opacity-100 transition-opacity" />
                    </Link>
                    <div className="h-4 w-[1px] bg-gray-800 hidden sm:block" />
                    <nav className="hidden sm:flex gap-4 text-sm font-bold text-gray-400">
                        <Link href="/dashboard" className="text-white flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-md"><LayoutDashboard className="w-4 h-4" /> Console</Link>
                        <Link href="/leaderboard" className="hover:text-white flex items-center gap-2 px-3 py-1.5 transition-colors"><Trophy className="w-4 h-4" /> Leaderboard</Link>
                        <Link href="/profile" className="hover:text-white flex items-center gap-2 px-3 py-1.5 transition-colors"><UserCircle className="w-4 h-4" /> Profile</Link>
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <div className="bg-[#111] border border-gray-800 rounded-full px-4 py-1.5 flex items-center gap-2 text-sm font-mono text-gray-400">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        {userIdentifier}
                    </div>
                    <button
                        onClick={logout}
                        className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                        title="Disconnect"
                    >
                        <LogOut className="w-5 h-5" />
                    </button>
                </div>
            </header>

            {/* Main Dashboard Content */}
            <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-8">

                {/* Email Verification Banner */}
                {authenticated && !user?.email && (
                    <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <span className="text-red-400 text-2xl">⚠️</span>
                            <div>
                                <h4 className="font-bold text-red-400">Action Required: Link Email to Play</h4>
                                <p className="text-sm text-red-300/80">You logged in with a wallet. For sybil resistance, an email is required to access the terminals.</p>
                            </div>
                        </div>
                        <button
                            onClick={linkEmail}
                            className="bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-6 rounded-lg whitespace-nowrap"
                        >
                            Link Email Now
                        </button>
                    </div>
                )}

                {/* Welcome Section */}
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl md:text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-700 tracking-tighter">
                        WACKY RACES CONSOLE
                    </h1>
                    <p className="text-gray-400 font-mono text-sm max-w-xl">
                        Select a game module below to play. Free-to-play beta is currently active.
                    </p>
                </div>

                {/* Default Live Race Teaser (Featured) */}
                <div className="w-full relative group overflow-hidden rounded-2xl border border-blue-500/30">
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900/40 to-black z-0" />
                    <div className="absolute inset-0 bg-[url('/hero-track.jpg')] bg-cover bg-center mix-blend-overlay opacity-30 group-hover:scale-105 transition-transform duration-700 z-0" />

                    <div className="relative z-10 p-6 md:p-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="flex flex-col gap-4 max-w-lg">
                            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-400 font-bold text-xs px-3 py-1 rounded-full border border-blue-500/30 uppercase tracking-wider w-fit">
                                <Activity className="w-3 h-3" /> Featured Pool
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black italic drop-shadow-lg">CRYPTO SPRINT</h2>
                            <p className="text-gray-300 font-medium">
                                High-speed pari-mutuel racing powered by live Binance 1-second price ticks for BTC, ETH, and SOL.
                            </p>
                            <div className="flex items-center gap-4 text-sm font-mono text-gray-400 bg-black/40 w-fit px-4 py-2 rounded-lg border border-white/5 backdrop-blur-md">
                                <div className="flex items-center gap-1"><Trophy className="w-4 h-4 text-yellow-500" /> $5,000 Volume</div>
                                <div className="flex items-center gap-1"><Zap className="w-4 h-4 text-purple-500" /> 5 Min Rounds</div>
                            </div>
                        </div>

                        <div className="shrink-0 w-full md:w-auto flex flex-col gap-3">
                            <button
                                onClick={() => router.push('/game/1')}
                                disabled={!user?.email}
                                className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black italic text-xl px-10 py-5 rounded-xl transition-all hover:scale-105 shadow-[0_0_30px_rgba(37,99,235,0.4)] flex items-center justify-center gap-3 border border-blue-400"
                            >
                                <PlayCircle className="w-6 h-6" /> JOIN POOL
                            </button>
                            <button
                                onClick={() => setIsPrivateModalOpen(true)}
                                disabled={!user?.email}
                                className="w-full md:w-auto bg-transparent hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed text-blue-400 font-bold text-sm px-6 py-3 rounded-xl transition-all border border-blue-500/30 flex items-center justify-center gap-2"
                            >
                                Create Private Race
                            </button>
                        </div>
                    </div>
                </div>

                {isPrivateModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                        <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 w-full max-w-md flex flex-col gap-6">
                            <div>
                                <h3 className="text-2xl font-black italic text-white flex justify-between items-center">
                                    PRIVATE RACE
                                    <button onClick={() => setIsPrivateModalOpen(false)} className="text-gray-500 hover:text-white text-xl p-1">&times;</button>
                                </h3>
                                <p className="text-gray-400 text-sm mt-1">Host your own derby and invite friends to compete.</p>
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-bold text-gray-300">Entry Fee (Select Tier)</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[10, 50, 100].map(fee => (
                                        <button
                                            key={fee}
                                            onClick={() => setPrivateEntryFee(fee)}
                                            className={`py-3 rounded-xl border font-bold transition-all ${privateEntryFee === fee ? 'border-blue-500 bg-blue-500/20 text-blue-400' : 'border-gray-800 bg-[#0a0a0a] text-gray-500 hover:border-gray-600'}`}
                                        >
                                            ${fee}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <label className="text-sm font-bold text-gray-300">Race Mode</label>
                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={() => setPrivateMode('CRYPTO')}
                                        className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all ${privateMode === 'CRYPTO' ? 'border-blue-500 bg-blue-500/10' : 'border-gray-800 bg-[#0a0a0a] hover:border-gray-600'}`}
                                    >
                                        <div>
                                            <div className={`font-bold ${privateMode === 'CRYPTO' ? 'text-blue-400' : 'text-gray-300'}`}>Crypto Sprint</div>
                                            <div className="text-xs text-gray-500">Live prices driving the race</div>
                                        </div>
                                    </button>
                                    <button disabled className="p-3 rounded-xl border border-gray-800 bg-black opacity-50 flex items-center justify-between text-left cursor-not-allowed">
                                        <div>
                                            <div className="font-bold text-gray-500">Meme Madness</div>
                                            <div className="text-xs text-gray-600">Extreme volatility. Doge, Shiba, Pepe.</div>
                                        </div>
                                        <span className="text-[10px] bg-pink-500/20 text-pink-400 px-2 py-1 rounded-sm uppercase tracking-wider font-bold">Coming Soon</span>
                                    </button>
                                    <button disabled className="p-3 rounded-xl border border-gray-800 bg-black opacity-50 flex items-center justify-between text-left cursor-not-allowed">
                                        <div>
                                            <div className="font-bold text-gray-500">Football Derby</div>
                                            <div className="text-xs text-gray-600">Live sports data driving the race.</div>
                                        </div>
                                        <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-1 rounded-sm uppercase tracking-wider font-bold">Coming Soon</span>
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleCreatePrivateRace}
                                disabled={isCreatingPrivateRace}
                                className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black italic text-lg py-4 rounded-xl mt-2 transition-all shadow-lg"
                            >
                                {isCreatingPrivateRace ? 'INITIALIZING...' : 'CREATE LOBBY'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Grid of Other Modes */}
                <div className="flex flex-col gap-4 mt-4">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-200">
                        Available Terminals <ChevronRight className="w-5 h-5 text-blue-500" />
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

                        {/* Meme Mode */}
                        <div
                            onClick={() => {
                                if (user?.email) router.push('/game/meme');
                            }}
                            className={`bg-[#111] border border-gray-800 rounded-2xl p-6 flex flex-col gap-4 transition-all group ${user?.email ? 'hover:border-pink-500/50 hover:bg-[#151515] cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                        >
                            <div className="w-12 h-12 bg-pink-900/30 rounded-xl flex items-center justify-center border border-pink-500/30 group-hover:bg-pink-500/20">
                                <span className="text-2xl">🐕</span>
                            </div>
                            <div>
                                <h4 className={`text-xl font-black italic text-white ${user?.email ? 'group-hover:text-pink-400 transition-colors' : ''}`}>MEMECOIN MELEE</h4>
                                <p className="text-sm text-gray-500 mt-1">Extreme volatility. Doge, Shiba, Pepe, and more. Risk on.</p>
                            </div>
                            <div className="mt-auto pt-4 flex items-center justify-between text-xs font-mono text-gray-600 border-t border-gray-800">
                                <span>DEX SCREENER</span>
                                <span className="text-pink-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-pink-500 animate-pulse" /> HOT</span>
                            </div>
                        </div>

                        {/* World Cup Pens */}
                        <div
                            onClick={() => {
                                if (user?.email) router.push('/world-cup-pens');
                            }}
                            className={`bg-[#111] border border-gray-800 rounded-2xl p-6 flex flex-col gap-4 transition-all group ${user?.email ? 'hover:border-green-500/50 hover:bg-[#151515] cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}
                        >
                            <div className="w-12 h-12 bg-green-900/30 rounded-xl flex items-center justify-center border border-green-500/30 group-hover:bg-green-500/20">
                                <span className="text-2xl">🥅</span>
                            </div>
                            <div>
                                <h4 className={`text-xl font-black italic text-white ${user?.email ? 'group-hover:text-green-400 transition-colors' : ''}`}>WORLD CUP PENS</h4>
                                <p className="text-sm text-gray-500 mt-1">Odds-based penalty shootout. Pick your team, upgrade strikers, climb ranks.</p>
                            </div>
                            <div className="mt-auto pt-4 flex items-center justify-between text-xs font-mono text-gray-600 border-t border-gray-800">
                                <span>SOLO MODE</span>
                                <span className="text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> LIVE</span>
                            </div>
                        </div>
                        <div className="bg-black border border-dashed border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 opacity-80 cursor-default relative overflow-hidden group">
                            <div className="absolute top-3 right-3 bg-green-500/20 text-green-400 text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded">Coming Soon</div>
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-900 border border-gray-800">
                                <span className="text-2xl">⚽</span>
                            </div>
                            <div className="text-center">
                                <h4 className="text-lg font-bold text-gray-300">Football Derby</h4>
                                <p className="text-xs text-gray-500 mt-1 max-w-[200px] leading-relaxed">Live match day data driving the race. Back your squad.</p>
                            </div>
                            <button
                                onClick={async () => {
                                    if (!user?.email?.address) return;
                                    try {
                                        const res = await fetch('/api/waitlist', {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ email: user.email.address })
                                        });
                                        if (res.ok) alert('You are on the list! We will notify you when Football Derby goes live.');
                                        else if (res.status === 409) alert('You are already on the notification list.');
                                        else alert('Failed to join notification list.');
                                    } catch (e) { }
                                }}
                                className="mt-2 text-xs font-bold text-white bg-green-600 hover:bg-green-500 px-4 py-2 rounded-lg transition-colors cursor-pointer z-10"
                            >
                                NOTIFY ME
                            </button>
                        </div>

                    </div>
                </div>

            </main>
        </div>
    );
}
