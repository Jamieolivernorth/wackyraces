'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { LogOut, LayoutDashboard, UserCircle, History, Trophy, TrendingUp, ChevronLeft } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useGameStore } from '@/store/gameStore';

export default function ProfilePage() {
    const { user, ready, authenticated, logout } = usePrivy();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);

    const userBalance = useGameStore(state => state.userBalance);
    const history = useGameStore(state => state.history);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // Redirect if not authenticated
    useEffect(() => {
        if (ready && !authenticated) {
            router.push('/');
        }
    }, [ready, authenticated, router]);

    if (!isClient || !ready || !authenticated) {
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

    // Calculate some basic stats
    const totalRaces = history.length;
    // A mock win rate since we aren't tracking individual bet history per user perfectly yet in this UI
    const winRate = totalRaces > 0 ? 'TBD' : '0%';

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col selection:bg-blue-500/30">

            {/* Top Navigation */}
            <header className="w-full p-4 border-b border-white/10 bg-black/50 backdrop-blur-md sticky top-0 z-50 flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="bg-blue-600 w-8 h-8 rounded-lg flex items-center justify-center font-black italic">W</div>
                        <span className="font-black italic tracking-tight hidden sm:block">WACKY RACES</span>
                    </Link>
                    <div className="h-4 w-[1px] bg-gray-800 hidden sm:block" />
                    <nav className="hidden sm:flex gap-4 text-sm font-bold text-gray-400">
                        <Link href="/dashboard" className="hover:text-white flex items-center gap-2 px-3 py-1.5 transition-colors"><LayoutDashboard className="w-4 h-4" /> Hub</Link>
                        <Link href="/profile" className="text-white flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-md"><UserCircle className="w-4 h-4" /> Profile</Link>
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

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 max-w-5xl mx-auto w-full flex flex-col gap-8">

                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-10 h-10 border border-gray-800 rounded-full flex items-center justify-center hover:bg-white/5 transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter">OPERATOR PROFILE</h1>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-gray-400 font-bold mb-2">
                            <Trophy className="w-5 h-5 text-yellow-500" /> Total Balance
                        </div>
                        <div className="text-4xl font-black font-mono tracking-tighter">
                            ${userBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                    </div>

                    <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-gray-400 font-bold mb-2">
                            <History className="w-5 h-5 text-blue-500" /> Global Races Tracked
                        </div>
                        <div className="text-4xl font-black font-mono tracking-tighter">
                            {totalRaces}
                        </div>
                    </div>

                    <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 flex flex-col gap-2">
                        <div className="flex items-center gap-2 text-gray-400 font-bold mb-2">
                            <TrendingUp className="w-5 h-5 text-green-500" /> Win Rate
                        </div>
                        <div className="text-4xl font-black font-mono tracking-tighter">
                            {winRate}
                        </div>
                    </div>

                </div>

                {/* Global Race History Table */}
                <div className="flex flex-col gap-4 mt-8">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-gray-200">
                        Recent Protocol History
                    </h3>

                    <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden">
                        {history.length === 0 ? (
                            <div className="p-12 text-center text-gray-500 font-mono text-sm">
                                No race history recorded in this session.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-black/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500 font-bold">
                                            <th className="p-4">Race ID</th>
                                            <th className="p-4">Mode</th>
                                            <th className="p-4">Winner</th>
                                            <th className="p-4">Performance</th>
                                            <th className="p-4">Time</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800/50">
                                        {history.map((race, i) => (
                                            <tr key={i} className="hover:bg-white/5 transition-colors text-sm font-mono">
                                                <td className="p-4 text-blue-400">{race.id}</td>
                                                <td className="p-4 text-gray-300">{race.mode}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <img src={race.winner.imageUrl} alt={race.winner.name} className="w-6 h-6 rounded-full" />
                                                        <span className="font-bold">{race.winner.name}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-green-400">
                                                    +{((race.winner.performance || 0) * 100).toFixed(2)}%
                                                </td>
                                                <td className="p-4 text-gray-500">
                                                    {new Date(race.date).toLocaleTimeString()}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

            </main>
        </div>
    );
}
