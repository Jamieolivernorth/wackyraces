'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { TOP_TOKENS } from '@/lib/tokens';
import { useGameStore } from '@/store/gameStore';
import { PlayCircle, Share2, Users, Crown, Loader2 } from 'lucide-react';

export default function PrivateRaceLobby() {
    const { user, ready, authenticated, login } = usePrivy();
    const router = useRouter();
    const params = useParams();
    const raceId = params.id as string;

    const [race, setRace] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedToken, setSelectedToken] = useState<string | null>(null);
    const [isJoining, setIsJoining] = useState(false);
    const [isStarting, setIsStarting] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    const { startPrivateRace } = useGameStore();

    const fetchRace = async () => {
        try {
            const res = await fetch(`/api/race/private/${raceId}`);
            if (res.ok) {
                const data = await res.json();
                setRace(data.race);
                setParticipants(data.participants);
            } else if (res.status === 404) {
                router.push('/dashboard');
            }
        } catch (error) {
            console.error('Failed to fetch private race', error);
        } finally {
            setLoading(false);
        }
    };

    // Polling for updates
    useEffect(() => {
        if (!ready || !authenticated) return;
        fetchRace();
        const interval = setInterval(fetchRace, 2000); // poll every 2s
        return () => clearInterval(interval);
    }, [ready, authenticated, raceId]);

    // Format address helper
    const shortenAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;

    useEffect(() => {
        if (race?.status === 'COUNTDOWN' && race?.start_time) {
            const startMs = new Date(race.start_time).getTime();
            const interval = setInterval(() => {
                const now = Date.now();
                const diff = Math.max(0, Math.ceil((startMs - now) / 1000));
                setTimeLeft(diff);

                if (diff === 0) {
                    clearInterval(interval);
                    // Start Race Transition!
                    startPrivateRace(participants, race.entry_fee);
                    router.push('/game/1'); // Route to default game page which will now use our private contenders
                }
            }, 500);
            return () => clearInterval(interval);
        }
    }, [race?.status, race?.start_time, participants]);


    if (!ready) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    if (!authenticated) {
        return (
            <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4 relative overflow-hidden">
                <div className="absolute inset-0 z-0 bg-gradient-to-br from-blue-900/20 to-black pointer-events-none" />
                <div className="bg-[#111] border border-white/10 p-8 rounded-3xl max-w-md w-full text-center relative z-10 shadow-[0_0_50px_rgba(59,130,246,0.1)]">
                    <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Users className="w-8 h-8 text-blue-400" />
                    </div>
                    <h1 className="text-3xl text-white font-black italic mb-2 tracking-tight">PRIVATE LOBBY</h1>
                    <p className="text-gray-400 mb-8 text-sm">You have been invited to a private pari-mutuel race. Please connect an account to pick your runner.</p>
                    <button
                        onClick={() => login()}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 px-8 rounded-xl shadow-lg transition-transform hover:scale-[1.02] border border-blue-400 font-mono"
                    >
                        CONNECT TO JOIN
                    </button>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
            </div>
        );
    }

    const walletAddress = user?.wallet?.address;
    const isHost = walletAddress === race.host_wallet;
    const hasJoined = participants.some(p => p.wallet_address === walletAddress);
    const takenTokens = participants.map(p => p.selected_token);

    const handleJoin = async () => {
        if (!selectedToken || !walletAddress) return;
        setIsJoining(true);
        try {
            const res = await fetch(`/api/race/private/${raceId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ walletAddress, selectedToken })
            });
            if (res.ok) fetchRace();
        } catch (error) {
            console.error('Failed to join', error);
        } finally {
            setIsJoining(false);
        }
    };

    const handleStart = async () => {
        setIsStarting(true);
        try {
            const res = await fetch(`/api/race/private/${raceId}/start`, {
                method: 'POST'
            });
            if (res.ok) fetchRace();
        } catch (error) {
            console.error('Failed to start', error);
        } finally {
            setIsStarting(false);
        }
    };

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareText = `Join my Private Crypto Race! Entry is $${race.entry_fee}.`;

    if (race.status === 'RACING' || race.status === 'FINISHED') {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <h1 className="text-3xl text-white font-black italic">RACE IN PROGRESS</h1>
                <button onClick={() => router.push('/dashboard')} className="mt-6 text-blue-500 underline">Return to Dashboard</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-white font-sans flex flex-col selection:bg-blue-500/30 p-4 md:p-8 relative">
            {/* Background */}
            <div className="absolute inset-0 z-0 bg-[url('/hero-track.jpg')] bg-cover bg-center mix-blend-overlay opacity-20 pointer-events-none" />

            {/* Countdown Overlay */}
            {race.status === 'COUNTDOWN' && timeLeft !== null && (
                <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md">
                    <h2 className="text-4xl md:text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-pink-500 mb-8 z-10 text-center px-4">
                        RACE STARTING IN
                    </h2>
                    <div className="text-[12rem] font-black italic text-white drop-shadow-[0_0_50px_rgba(59,130,246,0.8)] neon-text-blue animate-pulse">
                        {timeLeft}
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto w-full relative z-10 flex flex-col gap-6">

                {/* Header Section */}
                <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-400 font-bold text-xs px-3 py-1 rounded-full border border-blue-500/30 uppercase tracking-wider mb-4">
                            Private Lobby
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-700 tracking-tighter">
                            ${race.entry_fee} SPRINT
                        </h1>
                        <p className="text-gray-400 mt-2 font-mono text-sm max-w-md">
                            Minimum 6 players required. Host initiates countdown.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 w-full md:w-auto">
                        <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
                            <Share2 className="w-4 h-4" /> Share Invite
                        </div>
                        <div className="flex gap-2">
                            <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-[#1DA1F2]/10 text-[#1DA1F2] border border-[#1DA1F2]/30 flex items-center justify-center hover:bg-[#1DA1F2]/20 transition-colors">X</a>
                            <a href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-[#25D366]/10 text-[#25D366] border border-[#25D366]/30 flex items-center justify-center hover:bg-[#25D366]/20 transition-colors">W</a>
                            <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-xl bg-[#0088cc]/10 text-[#0088cc] border border-[#0088cc]/30 flex items-center justify-center hover:bg-[#0088cc]/20 transition-colors">T</a>
                        </div>
                    </div>
                </div>

                {/* Main Content Areas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Players List */}
                    <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
                        <h2 className="text-xl font-bold flex items-center gap-2">
                            <Users className="w-5 h-5 text-blue-500" />
                            Racers ({participants.length}/6+)
                        </h2>

                        <div className="flex flex-col gap-3 mt-2">
                            {participants.map((p, i) => {
                                const tokenDef = TOP_TOKENS.find(t => t.id === p.selected_token);
                                return (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-[#0a0a0a] border border-gray-800">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: tokenDef?.color + '40', color: tokenDef?.color }}>
                                                {tokenDef?.symbol}
                                            </div>
                                            <div className="font-mono text-sm">
                                                {p.wallet_address === user?.wallet?.address ? <span className="text-blue-400 font-bold">You</span> : shortenAddress(p.wallet_address)}
                                            </div>
                                        </div>
                                        {p.wallet_address === race.host_wallet && (
                                            <Crown className="w-4 h-4 text-yellow-500" />
                                        )}
                                    </div>
                                );
                            })}
                            {participants.length === 0 && (
                                <div className="text-gray-600 italic text-sm py-4 text-center">No racers have joined yet.</div>
                            )}
                        </div>

                        {isHost && (
                            <button
                                onClick={handleStart}
                                disabled={participants.length < 6 || isStarting}
                                className="mt-auto w-full bg-green-600 hover:bg-green-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black italic text-lg py-4 rounded-xl shadow-lg border border-green-400 flex items-center justify-center gap-2"
                            >
                                {isStarting ? <Loader2 className="w-5 h-5 animate-spin" /> : <><PlayCircle className="w-5 h-5" /> START RACE</>}
                            </button>
                        )}
                        {isHost && participants.length < 6 && (
                            <p className="text-xs text-red-400 text-center font-bold">Waiting for at least 6 players.</p>
                        )}
                    </div>

                    {/* Token Selection */}
                    {!hasJoined && (
                        <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 flex flex-col gap-4">
                            <h2 className="text-xl font-bold flex items-center gap-2 text-white">
                                Select Your Token
                            </h2>
                            <p className="text-sm text-gray-400">Pick a unique crypto asset to represent you in the race.</p>

                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mt-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {TOP_TOKENS.map(t => {
                                    const isTaken = takenTokens.includes(t.id);
                                    return (
                                        <button
                                            key={t.id}
                                            disabled={isTaken}
                                            onClick={() => setSelectedToken(t.id)}
                                            className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center gap-1
                                                ${isTaken ? 'opacity-30 cursor-not-allowed border-gray-800 grayscale' : 'hover:border-blue-500'}
                                                ${selectedToken === t.id ? 'border-blue-500 bg-blue-500/20' : 'border-gray-800 bg-[#0a0a0a]'}
                                            `}
                                        >
                                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: t.color + '40', color: t.color }}>
                                                {t.symbol}
                                            </div>
                                            <span className="text-[10px] font-bold text-gray-300">{t.symbol}</span>
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={handleJoin}
                                disabled={!selectedToken || isJoining}
                                className="mt-auto w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black italic text-lg py-4 rounded-xl shadow-lg border border-blue-400 transition-all flex items-center justify-center gap-2"
                            >
                                {isJoining ? <Loader2 className="w-5 h-5 animate-spin" /> : 'CONFIRM & JOIN'}
                            </button>
                        </div>
                    )}

                    {hasJoined && (
                        <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-4 border-dashed">
                            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
                                <PlayCircle className="w-8 h-8 text-blue-500" />
                            </div>
                            <h3 className="text-xl font-bold text-white text-center">You are in the lobby!</h3>
                            <p className="text-gray-400 text-center text-sm">Waiting for the host to start the race countdown.</p>
                        </div>
                    )}

                </div>
            </div>

            <style jsx global>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 6px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: #0a0a0a;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #333;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #555;
                }
            `}</style>
        </div>
    );
}
