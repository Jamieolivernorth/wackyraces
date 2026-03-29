'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Trophy, UserCircle, LogOut, Medal, Activity } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

interface LeaderboardStat {
    wallet_address: string;
    total_races: number;
    total_wins: number;
    total_profit: number;
}

export default function LeaderboardPage() {
    const { user, ready, authenticated, logout } = usePrivy();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [timeframe, setTimeframe] = useState<'weekly' | 'monthly' | 'all-time'>('weekly');
    const [stats, setStats] = useState<LeaderboardStat[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!authenticated && ready && window.location.pathname !== '/demo') {
            router.push('/');
        }
    }, [ready, authenticated, router]);

    useEffect(() => {
        if (!ready) return;
        setLoading(true);
        fetch(`/api/leaderboard?timeframe=${timeframe}`)
            .then(res => res.json())
            .then(data => {
                if (data.stats) {
                    setStats(data.stats);
                }
            })
            .catch(err => console.error("Failed to load leaderboard", err))
            .finally(() => setLoading(false));
    }, [timeframe, ready]);

    if (!isClient || !ready || (!authenticated && window.location.pathname !== '/demo')) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    const userIdentifier = user?.wallet?.address
        ? `${user.wallet.address.slice(0, 4)}...${user.wallet.address.slice(-4)}`
        : user?.email?.address
            ? user.email.address
            : 'Unknown Operator';

    // Helper to format win rate
    const calculateWinRate = (wins: number, total: number) => {
        if (total < 10) return 'Requires 10 Races';
        return `${((wins / total) * 100).toFixed(1)}%`;
    };

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
                        <Link href="/dashboard" className="hover:text-white flex items-center gap-2 px-3 py-1.5 transition-colors"><LayoutDashboard className="w-4 h-4" /> Console</Link>
                        <Link href="/leaderboard" className="text-white flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-md"><Trophy className="w-4 h-4" /> Leaderboard</Link>
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

            {/* Main Leaderboard Content */}
            <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full flex flex-col gap-8">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-4">
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl md:text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 tracking-tighter flex items-center gap-4">
                            HALL OF FAME <Trophy className="w-8 h-8 md:w-10 md:h-10 text-yellow-500" />
                        </h1>
                        <p className="text-gray-400 font-mono text-sm max-w-xl">
                            Track the top operators across the network. Win rate unlocks after 10 official races.
                        </p>
                    </div>

                    <div className="flex bg-[#111] p-1 rounded-xl border border-gray-800 relative z-10 w-full md:w-auto">
                        {['weekly', 'monthly', 'all-time'].map((tf) => (
                            <button
                                key={tf}
                                onClick={() => setTimeframe(tf as any)}
                                className={`flex-1 md:flex-none capitalize px-6 py-2 rounded-lg text-sm font-bold transition-all ${timeframe === tf ? 'bg-yellow-500/20 text-yellow-500 shadow-sm border border-yellow-500/30' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {tf}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden shadow-2xl relative">
                    {/* Decorative Top Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-600 via-yellow-400 to-orange-500 z-10" />

                    <div className="overflow-x-auto relative z-10">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/40 text-gray-500 text-xs uppercase font-black tracking-widest border-b border-gray-800">
                                    <th className="p-5 w-20 text-center">Rank</th>
                                    <th className="p-5">Operator</th>
                                    <th className="p-5 text-right">Races</th>
                                    <th className="p-5 text-right">Wins</th>
                                    <th className="p-5 text-right">Win Rate</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading && (
                                    <tr>
                                        <td colSpan={5} className="p-10 text-center text-gray-500">
                                            <Activity className="w-6 h-6 animate-spin mx-auto mb-2 text-yellow-500" />
                                            Scanning Network...
                                        </td>
                                    </tr>
                                )}

                                {!loading && stats.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="p-10 text-center text-gray-500 font-mono">
                                            No intel found for this timeframe.
                                        </td>
                                    </tr>
                                )}

                                {!loading && stats.map((stat, i) => {
                                    const isMe = user?.wallet?.address === stat.wallet_address;
                                    const trClass = isMe
                                        ? "bg-blue-900/10 hover:bg-blue-900/20 border-b border-gray-800/50 transition-colors"
                                        : "hover:bg-white/5 border-b border-gray-800/50 transition-colors";

                                    return (
                                        <tr key={stat.wallet_address} className={trClass}>
                                            <td className="p-5 text-center font-black">
                                                {i === 0 ? <Medal className="w-6 h-6 text-yellow-400 mx-auto" /> :
                                                    i === 1 ? <Medal className="w-6 h-6 text-gray-400 mx-auto" /> :
                                                        i === 2 ? <Medal className="w-6 h-6 text-amber-600 mx-auto" /> :
                                                            <span className="text-gray-600">#{i + 1}</span>}
                                            </td>
                                            <td className="p-5 font-mono text-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${isMe ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-400'}`}>
                                                        {stat.wallet_address.slice(0, 2)}
                                                    </div>
                                                    <span className={isMe ? 'text-white' : 'text-gray-300'}>
                                                        {stat.wallet_address.slice(0, 4)}...{stat.wallet_address.slice(-4)}
                                                        {isMe && <span className="ml-2 bg-blue-500/20 text-blue-400 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">You</span>}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="p-5 text-right font-mono text-gray-400">
                                                {stat.total_races}
                                            </td>
                                            <td className="p-5 text-right">
                                                <span className="text-green-400 font-bold">{stat.total_wins}</span>
                                            </td>
                                            <td className="p-5 text-right font-mono text-sm">
                                                {stat.total_races >= 10 ? (
                                                    <span className="text-white bg-black/40 px-3 py-1 rounded-lg border border-gray-700 shadow-inner">
                                                        {calculateWinRate(stat.total_wins, stat.total_races)}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-600 text-xs bg-black/20 px-2 py-1 rounded">
                                                        Need {10 - stat.total_races} more
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

            </main>
        </div>
    );
}
