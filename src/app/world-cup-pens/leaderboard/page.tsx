'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, Trophy } from 'lucide-react';

interface LeaderboardEntry {
    user_id: string;
    max_score: number;
}

export default function LeaderboardPage() {
    const { ready, authenticated, user } = usePrivy();
    const router = useRouter();

    const [isClient, setIsClient] = useState(false);
    const [period, setPeriod] = useState('DAILY');
    const [scores, setScores] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { setIsClient(true); }, []);

    useEffect(() => {
        if (ready && !authenticated) router.push('/');
        else if (ready && authenticated) {
            fetchScores();
        }
    }, [ready, authenticated, period]);

    const fetchScores = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/wc-pens/leaderboard?period=${period}`);
            const data = await res.json();
            if (data.leaderboard) setScores(data.leaderboard);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    if (!isClient || !ready || !authenticated) return null;

    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-sans flex flex-col relative">
            <header className="p-4 border-b border-gray-900 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/world-cup-pens')} className="p-2 border border-gray-800 rounded-full hover:bg-white/10"><ChevronLeft className="w-5 h-5"/></button>
                    <h1 className="text-xl font-black italic flex items-center gap-2 text-yellow-500"><Trophy className="w-5 h-5"/> HALL OF FAME</h1>
                </div>
            </header>

            <main className="flex-1 max-w-4xl mx-auto w-full p-4 lg:p-8">
                
                <div className="flex gap-2 p-1 bg-[#111] rounded-lg border border-gray-800 mb-8 max-w-md mx-auto">
                    {['DAILY', 'WEEKLY', 'MONTHLY'].map(p => (
                        <button 
                            key={p}
                            className={`flex-1 py-2 text-sm font-bold rounded-md transition-colors ${period === p ? 'bg-yellow-600 text-black' : 'text-gray-400 hover:text-white'}`}
                            onClick={() => setPeriod(p)}
                        >
                            {p}
                        </button>
                    ))}
                </div>

                <div className="bg-[#111] border border-gray-800 rounded-2xl overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">Loading Leaderboard...</div>
                    ) : scores.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 font-mono text-sm">No scores recorded for this period.</div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-black/50 border-b border-gray-800 text-xs uppercase tracking-wider text-gray-500 font-bold">
                                    <th className="p-4 w-16 text-center">RANK</th>
                                    <th className="p-4">OPERATOR</th>
                                    <th className="p-4 text-right">BEST ROUND SCORE</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800/50">
                                {scores.map((s, i) => (
                                    <tr key={i} className={`hover:bg-white/5 transition-colors font-mono ${s.user_id === user?.wallet?.address ? 'bg-blue-900/20' : ''}`}>
                                        <td className="p-4 text-center font-black">
                                            {i === 0 ? <span className="text-yellow-500">🥇</span> : i === 1 ? <span className="text-gray-400">🥈</span> : i === 2 ? <span className="text-amber-600">🥉</span> : <span className="text-gray-600">#{i + 1}</span>}
                                        </td>
                                        <td className="p-4 text-gray-300">
                                            {s.user_id.slice(0, 6)}...{s.user_id.slice(-4)} {s.user_id === user?.wallet?.address ? '(YOU)' : ''}
                                        </td>
                                        <td className="p-4 text-right text-green-400 font-bold">
                                            {s.max_score.toLocaleString()} PTS
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

            </main>
        </div>
    );
}
