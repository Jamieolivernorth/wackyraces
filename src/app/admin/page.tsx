import React from 'react';
import db from '@/lib/db';
import { Database, Users, TrendingUp, HandCoins } from 'lucide-react';
import Link from 'next/link';

// Server-side database fetching
function getAdminStats() {
    try {
        const stats = db.prepare('SELECT * FROM platform_stats WHERE id = 1').get() as { total_rake: number, total_volume: number };
        const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
        const referredUsers = db.prepare('SELECT COUNT(*) as count FROM users WHERE referred_by IS NOT NULL').get() as { count: number };

        return {
            rake: stats?.total_rake || 0,
            volume: stats?.total_volume || 0,
            users: usersCount?.count || 0,
            referred: referredUsers?.count || 0
        };
    } catch (e) {
        console.error("Admin DB Error", e);
        return { rake: 0, volume: 0, users: 0, referred: 0 };
    }
}

export default function AdminDashboard() {
    const stats = getAdminStats();

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
            <header className="border-b border-gray-800 bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Database className="w-8 h-8 text-blue-500" />
                        <h1 className="text-3xl font-black italic tracking-tighter">
                            WACKY RACES <span className="text-blue-500 text-sm font-bold uppercase tracking-widest ml-2">Backoffice</span>
                        </h1>
                    </div>
                    <Link href="/" className="text-sm text-gray-400 hover:text-white transition-colors">
                        &larr; Back to Platform
                    </Link>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">

                <h2 className="text-xl font-bold mb-8 text-gray-300">Platform Metrics Snapshot</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                    {/* Stat Card */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/50 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <TrendingUp className="w-24 h-24 text-blue-500" />
                        </div>
                        <p className="text-gray-400 text-sm font-medium mb-1 relative z-10">Total Betting Volume</p>
                        <p className="text-4xl font-black text-white relative z-10">
                            ${stats.volume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-blue-400 mt-2 font-mono">LIFETIME</p>
                    </div>

                    {/* Stat Card */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-green-500/50 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <HandCoins className="w-24 h-24 text-green-500" />
                        </div>
                        <p className="text-gray-400 text-sm font-medium mb-1 relative z-10">House Rake (10% - Refs)</p>
                        <p className="text-4xl font-black text-green-400 relative z-10">
                            ${stats.rake.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                        <p className="text-xs text-green-500 max-w-[200px] mt-2 font-mono leading-tight">
                            Net accrued protocol fees.
                        </p>
                    </div>

                    {/* Stat Card */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-purple-500/50 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users className="w-24 h-24 text-purple-500" />
                        </div>
                        <p className="text-gray-400 text-sm font-medium mb-1 relative z-10">Total Registered Users</p>
                        <p className="text-4xl font-black text-white relative z-10">
                            {stats.users.toLocaleString()}
                        </p>
                        <p className="text-xs text-purple-400 mt-2 font-mono">WALLETS</p>
                    </div>

                    {/* Stat Card */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-orange-500/50 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <Users className="w-24 h-24 text-orange-500" />
                        </div>
                        <p className="text-gray-400 text-sm font-medium mb-1 relative z-10">Referred Users</p>
                        <p className="text-4xl font-black text-white relative z-10">
                            {stats.referred.toLocaleString()}
                        </p>
                        <p className="text-xs text-orange-400 mt-2 font-mono">VIA X POSTER</p>
                    </div>

                </div>
            </main>
        </div>
    );
}
