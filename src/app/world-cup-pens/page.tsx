'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Wallet, Trophy, Target, Shield, Timer, Flame, Award, ShieldAlert, Camera, RefreshCw, ChevronLeft, Goal } from 'lucide-react';
import { PenaltyPvPGame, PenaltyZone } from '@/components/wc-pens/PenaltyPvPGame';
import { TeamSelection } from '@/components/wc-pens/TeamSelection';

export default function WorldCupPensGame() {
    const { user, ready, authenticated } = usePrivy();
    const router = useRouter();

    const [isClient, setIsClient] = useState(false);
    const [balance, setBalance] = useState(0);
    const [gameState, setGameState] = useState<'SELECTION' | 'TEAM_SELECTION' | 'LOBBY' | 'SELECTING' | 'DRAW' | 'PLAYING' | 'FINISHED'>('SELECTION');
    
    // Lobby/Match State
    const [selectedTier, setSelectedTier] = useState<number | null>(null);
    const [roomId, setRoomId] = useState<number | null>(null);
    const [matchId, setMatchId] = useState<number | null>(null);
    const [participants, setParticipants] = useState<string[]>([]);
    const [matchScore, setMatchScore] = useState({ p1: 0, p2: 0 });
    
    // Interaction State
    const [isPlayerShooting, setIsPlayerShooting] = useState(true);
    const [lastTurnResult, setLastTurnResult] = useState<{
        shooterZone: PenaltyZone;
        keeperZone: PenaltyZone;
        isGoal: boolean;
        pointsEarned?: number;
    } | undefined>(undefined);

    // Tournament State
    const [isTournamentMode, setIsTournamentMode] = useState(false);
    const [tournamentRound, setTournamentRound] = useState(1); // 1-5
    const [opponentTeam, setOpponentTeam] = useState("COMPUTER");

    // Points & Leaderboard State
    const [winnerPhoto, setWinnerPhoto] = useState<string | null>(null);
    const [showCamera, setShowCamera] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState<{ type: 'CREATE' | 'JOIN', tier?: number, inviteCode?: string } | null>(null);
    const [selectedEntryTier, setSelectedEntryTier] = useState(10);
    const [emailInput, setEmailInput] = useState('');
    const [inviteInput, setInviteInput] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [multiplierUsed, setMultiplierUsed] = useState(false);
    const [isMultiplierActive, setIsMultiplierActive] = useState(false);
    const [totalMatchPoints, setTotalMatchPoints] = useState(0);
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [cutoffTime, setCutoffTime] = useState<string | null>(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [isInvited, setIsInvited] = useState(false);
    
    // Tournament Specifics
    const [roomType, setRoomType] = useState<'PVP' | 'TOURNAMENT'>('PVP');
    const [roomInviteCode, setRoomInviteCode] = useState<string | null>(null);
    const [selectionDeadline, setSelectionDeadline] = useState<string | null>(null);
    const [brackets, setBrackets] = useState<any[]>([]);
    const [countdown, setCountdown] = useState<number>(0);

    const TOURNAMENT_ROUNDS = [
        "ROUND OF 32",
        "ROUND OF 16",
        "QUARTER-FINAL",
        "SEMI-FINAL",
        "WORLD CUP FINAL"
    ];

    const TEAM_NAMES = [
        "ARGENTINA", "BRAZIL", "FRANCE", "GERMANY", "SPAIN", 
        "ITALY", "ENGLAND", "PORTUGAL", "NETHERLANDS", "BELGIUM",
        "URUGUAY", "CROATIA", "MOROCCO", "JAPAN", "SENEGAL",
        "MEXICO", "USA", "CANADA", "SOUTH KOREA", "SWITZERLAND"
    ];

    const [loadingData, setLoadingData] = useState(true);
    const [loadingAction, setLoadingAction] = useState(false);

    const [playerTeam, setPlayerTeam] = useState<{id: string, name: string} | null>(null);

    useEffect(() => { setIsClient(true); }, []);

    useEffect(() => {
        if (ready && !authenticated) router.push('/');
        else if (ready && authenticated && user?.wallet?.address) {
            loadUserData();
        }
    }, [ready, authenticated, user]);

    const loadUserData = async () => {
        setLoadingData(true);
        try {
            const wallet = user?.wallet?.address;
            const res = await fetch(`/api/user?wallet=${wallet}`);
            const data = await res.json();
            setBalance(data.balance || 0);
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingData(false);
        }
    };

    const fetchLeaderboard = async () => {
        try {
            const wallet = user?.wallet?.address;
            const res = await fetch(`/api/wc-pens/leaderboard?wallet=${wallet || ''}`);
            const data = await res.json();
            if (data.success) {
                setLeaderboard(data.leaderboard);
                setCutoffTime(data.nextCutoff);
                setIsInvited(data.isInvited);
            }
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, [user, authenticated]);

    // Selection countdown for tournaments
    useEffect(() => {
        if (gameState !== 'SELECTING' || !selectionDeadline || roomType !== 'TOURNAMENT') return;
        
        const timer = setInterval(() => {
            const now = Date.now();
            const deadline = new Date(selectionDeadline).getTime();
            const diff = Math.max(0, Math.floor((deadline - now) / 1000));
            
            if (diff === 0) {
                clearInterval(timer);
                fetch('/api/wc-pens/tournament/draw', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roomId })
                });
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState, selectionDeadline, roomType, roomId]);

    const handleTierSelect = (tier: number, isPrivate: boolean = false) => {
        setSelectedTier(tier);
        setIsTournamentMode(false);
        setGameState('TEAM_SELECTION');
    };

    const handleTeamSelect = async (teamId: string, teamName: string) => {
        setPlayerTeam({ id: teamId, name: teamName });
        handleJoinLobby(selectedTier!, false, teamId, teamName);
    };

    const handleStartTournament = async (tier: number) => {
        setIsTournamentMode(true);
        setTournamentRound(1);
        setSelectedTier(tier);
        setGameState('TEAM_SELECTION');
    };

    const handleJoinLobby = async (tier: number, isPrivate: boolean = false, teamId?: string, teamName?: string) => {
        if (!user?.wallet?.address || !teamId) return;
        setLoadingAction(true);
        try {
            const res = await fetch('/api/wc-pens/lobby', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet: user.wallet.address, tier, isPrivate, teamId, teamName })
            });
            const data = await res.json();
            if (data.success) {
                setRoomId(data.roomId);
                setSelectedTier(tier);
                setGameState('LOBBY');
                setRoomInviteCode(data.inviteCode);
                startLobbyPolling(data.roomId);
            } else {
                alert(data.error);
                setGameState('SELECTION');
            }
        } finally {
            setLoadingAction(false);
        }
    };

    const startLobbyPolling = (id: number) => {
        const interval = setInterval(async () => {
            const res = await fetch(`/api/wc-pens/lobby?roomId=${id}`);
            const data = await res.json();
            if (data.success) {
                setParticipants(data.participants.map((p: any) => p.wallet_address));
                setRoomType(data.room.type);
                setRoomInviteCode(data.room.invite_code);
                setSelectionDeadline(data.room.selection_deadline);
                setBrackets(data.brackets || []);
                
                if (data.room.status === 'SELECTING') {
                    setGameState('SELECTING');
                } else if (data.room.status === 'DRAWN' || data.room.status === 'DRAW') {
                    setGameState('DRAW');
                } else if (data.room.status === 'PLAYING') {
                    clearInterval(interval);
                    startMatch(id, data.matchId);
                }
            }
        }, 3000);
    };

    const startMatch = async (id: number, mId?: number) => {
        setRoomId(id);
        if (mId) setMatchId(mId);
        setGameState('PLAYING');
        setIsPlayerShooting(true); 
        setMatchScore({ p1: 0, p2: 0 }); 
        setMultiplierUsed(false);
        setIsMultiplierActive(false);
        setTotalMatchPoints(0);
    };

    const handleStartGameManually = async () => {
        if (!roomId) return;
        try {
            const res = await fetch(`/api/wc-pens/lobby?roomId=${roomId}&action=START`, { method: 'POST' });
            const data = await res.json();
            if (data.success) {
                startMatch(roomId, data.matchId);
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleStartSelection = async () => {
        if (!roomId || !user?.wallet?.address) return;
        try {
            const res = await fetch('/api/wc-pens/tournament/start', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ roomId, wallet: user.wallet.address })
            });
            const data = await res.json();
            if (data.success) {
                setSelectionDeadline(data.selectionDeadline);
                setGameState('SELECTING');
            }
        } catch (e) {
            console.error(e);
        }
    };

    const handleConfirmSelection = async (teamId: string, teamName: string) => {
        setPlayerTeam({ id: teamId, name: teamName });
        // Update selection in DB
        try {
            await fetch('/api/wc-pens/lobby', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet: user?.wallet?.address, tier: selectedTier, inviteCode: roomInviteCode, teamId, teamName })
            });
        } catch (e) { console.error(e); }
    };

    const startCamera = async () => {
        setShowCamera(true);
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
            if (videoRef.current) videoRef.current.srcObject = stream;
        } catch (err) {
            console.error("Camera error:", err);
            alert("Could not access camera");
        }
    };

    const takePhoto = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0);
                const photoData = canvasRef.current.toDataURL('image/png');
                setWinnerPhoto(photoData);
                setShowCamera(false);
                // Stop camera stream
                const stream = videoRef.current.srcObject as MediaStream;
                stream.getTracks().forEach(track => track.stop());
            }
        }
    };

    const handleTurn = async (zone: PenaltyZone) => {
        if (!user?.wallet?.address || !matchId) return;
        
        const role = isPlayerShooting ? 'SHOOTER' : 'KEEPER';
        try {
            const res = await fetch('/api/wc-pens/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    matchId, 
                    wallet: user.wallet.address, 
                    zone, 
                    role,
                    useMultiplier: isMultiplierActive 
                })
            });
            const data = await res.json();
            
            if (data.success && data.result?.roundCompleted) {
                if (isMultiplierActive) {
                    setMultiplierUsed(true);
                    setIsMultiplierActive(false);
                }
                
                if (data.result.pointsEarned) {
                    setTotalMatchPoints(prev => prev + data.result.pointsEarned);
                }

                setLastTurnResult(data.result);
                
                if (data.result.isGoal) {
                    setMatchScore(prev => {
                        const newScore = { ...prev };
                        if (isPlayerShooting) newScore.p1 += 1;
                        else newScore.p2 += 1;
                        return newScore;
                    });
                }

                setTimeout(async () => {
                    setLastTurnResult(undefined);
                    
                    const matchRes = await fetch(`/api/wc-pens/match?matchId=${matchId}`);
                    const matchData = await matchRes.json();
                    
                    if (matchData.match.status === 'FINISHED' || matchData.match.status === 'FINAL_RESULT') {
                        const p1Win = matchData.match.p1_score > matchData.match.p2_score;
                        
                        if (isTournamentMode) {
                            if (p1Win) {
                                if (tournamentRound < 5) {
                                    alert(`VICTORY! Progressing to ${TOURNAMENT_ROUNDS[tournamentRound]}`);
                                    setTournamentRound(prev => prev + 1);
                                    setOpponentTeam(TEAM_NAMES[Math.floor(Math.random() * TEAM_NAMES.length)]);
                                    handleJoinLobby(selectedTier!, false, playerTeam?.id, playerTeam?.name);
                                } else {
                                    alert("CHAMPION! You have won the World Cup!");
                                    setGameState('SELECTION');
                                    setIsTournamentMode(false);
                                }
                            } else {
                                alert("DEFEAT! Eliminating from tournament...");
                                setGameState('SELECTION');
                                setIsTournamentMode(false);
                            }
                        } else {
                            setGameState('FINISHED');
                        }
                    } else {
                        setIsPlayerShooting(!isPlayerShooting);
                    }
                }, 2000);
            }
        } catch (e) {
            console.error('Turn error:', e);
        }
    };

    const handleJoinTournament = async (inviteCode: string, email: string) => {
        if (!user?.wallet?.address) return;
        setLoadingAction(true);
        try {
            const res = await fetch('/api/wc-pens/lobby', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet: user.wallet.address, inviteCode, email })
            });
            const data = await res.json();
            if (data.success) {
                setRoomId(data.roomId);
                setGameState('LOBBY');
                startLobbyPolling(data.roomId);
            } else {
                alert(data.error);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingAction(false);
        }
    };

    const handleCreateTournament = async (tier: number, maxPlayers: number, email: string) => {
        if (!user?.wallet?.address) return;
        setLoadingAction(true);
        try {
            const res = await fetch('/api/wc-pens/lobby', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet: user.wallet.address, tier, type: 'TOURNAMENT', maxPlayers, email })
            });
            const data = await res.json();
            if (data.success) {
                setRoomId(data.roomId);
                setGameState('LOBBY');
                startLobbyPolling(data.roomId);
            } else {
                alert(data.error);
            }
        } finally {
            setLoadingAction(false);
        }
    };

    const renderSelection = () => (
        <div className="flex flex-col gap-12 mt-12 px-4">
            <div className="text-center">
                <h2 className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-600 mb-4 uppercase">SELECT YOUR PATH</h2>
                <div className="flex justify-center gap-4">
                    <div className="px-6 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-xs font-bold tracking-widest uppercase tracking-tight">Casual PvP</div>
                    <div className="px-6 py-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full text-yellow-400 text-xs font-bold tracking-widest uppercase tracking-tight animate-pulse">World Cup Tournament</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[10, 50, 100].map((tier) => (
                    <div key={tier} className="bg-[#111] border border-gray-800 rounded-3xl p-8 flex flex-col items-center gap-6 hover:border-blue-500/50 transition-all hover:scale-105 group relative overflow-hidden">
                        <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                        <Trophy className={`w-16 h-16 ${tier === 100 ? 'text-yellow-400' : tier === 50 ? 'text-blue-400' : 'text-green-400'}`} />
                        <h3 className="text-3xl font-black italic">${tier} ENTRY</h3>
                        
                        <div className="flex flex-col w-full gap-3 mt-auto">
                            <button 
                                onClick={() => setShowEmailModal({ type: 'CREATE', tier })}
                                disabled={loadingAction || balance < tier}
                                className="w-full py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 rounded-xl font-black italic transition-all shadow-lg shadow-yellow-500/20 disabled:opacity-50 relative z-10 text-black uppercase tracking-wider text-sm"
                            >
                                FRIEND TOURNAMENT
                            </button>
                            <button 
                                onClick={() => handleStartTournament(tier)}
                                disabled={loadingAction || balance < tier}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-black italic transition-all disabled:opacity-50 relative z-10 text-white uppercase text-xs tracking-widest"
                            >
                                WORLD CUP (SOLO)
                            </button>
                            <button 
                                onClick={() => handleTierSelect(tier)}
                                disabled={loadingAction || balance < tier}
                                className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl font-bold transition-all disabled:opacity-50 relative z-10 text-white text-xs"
                            >
                                PVP ARENA
                            </button>
                        </div>

                        <button 
                            onClick={() => setShowEmailModal({ type: 'JOIN' })}
                            className="text-[10px] text-gray-500 hover:text-white underline relative z-10 uppercase font-black"
                        >
                            Join invite only
                        </button>
                    </div>
                ))}
            </div>

            {isInvited && (
                <div className="mx-auto max-w-2xl w-full p-6 bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/30 rounded-3xl flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                    <div className="flex items-center gap-3">
                        <Trophy className="w-10 h-10 text-yellow-400 animate-bounce" />
                        <h3 className="text-2xl font-black italic text-yellow-400 uppercase tracking-tight">CHAMPIONS INVITATION</h3>
                    </div>
                    <p className="text-sm text-center text-gray-300 font-bold uppercase tracking-wider">Congratulations! You ranked in the top 100 last week. You are invited to the exclusive Saturday Champions Tournament!</p>
                    <button 
                        onClick={() => handleStartTournament(500)} // High stakes for champions
                        className="px-12 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black italic rounded-2xl shadow-2xl shadow-yellow-500/40 transition-all scale-110 hover:scale-115 uppercase tracking-widest"
                    >
                        ENTER CHAMPIONS TOURNAMENT
                    </button>
                </div>
            )}

            <button 
                onClick={() => setShowLeaderboard(true)}
                className="mx-auto px-8 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-400 font-bold hover:bg-emerald-500/20 transition-all flex items-center gap-2"
            >
                <Trophy className="w-5 h-5" /> VIEW GLOBAL LEADERBOARD
            </button>
        </div>
    );

    const renderLeaderboard = () => (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl">
            <div className="bg-[#111] border border-gray-800 rounded-3xl w-full max-w-2xl max-h-[80vh] flex flex-col relative overflow-hidden">
                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-blue-500/10 to-emerald-500/10">
                    <div>
                        <h2 className="text-3xl font-black italic uppercase italic tracking-tight">Weekly Rankings</h2>
                        <div className="flex items-center gap-2 text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                            <span className="text-yellow-500 animate-pulse">● LIVE</span>
                            <span>Cutoff: {cutoffTime ? new Date(cutoffTime).toLocaleString() : 'Loading...'}</span>
                        </div>
                    </div>
                    <button onClick={() => setShowLeaderboard(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><ChevronLeft className="w-6 h-6" /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {leaderboard.map((entry, idx) => (
                        <div key={idx} className={`flex items-center justify-between p-4 rounded-2xl border ${idx < 3 ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10'}`}>
                            <div className="flex items-center gap-4">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black italic ${idx === 0 ? 'bg-yellow-500 text-black' : idx === 1 ? 'bg-gray-300 text-black' : idx === 2 ? 'bg-amber-600 text-black' : 'bg-white/10 text-white'}`}>
                                    {idx + 1}
                                </div>
                                <div className="font-mono text-sm">{entry.user_id.slice(0, 8)}...{entry.user_id.slice(-6)}</div>
                            </div>
                            <div className="text-xl font-black italic text-emerald-400">{entry.score.toLocaleString()} PTS</div>
                        </div>
                    ))}
                    {leaderboard.length === 0 && <div className="text-center py-12 text-gray-500 font-bold uppercase tracking-widest">No rankings yet this week...</div>}
                </div>

                <div className="p-6 bg-yellow-500/10 border-t border-yellow-500/20 text-center">
                    <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest leading-relaxed">Top 100 players at cutoff receive an exclusive invitation to the Saturday Champions Tournament!</p>
                </div>
            </div>
        </div>
    );

    const renderWinnerPhoto = () => (
        <div className="inline-flex flex-col items-center gap-6 mt-8 p-6 bg-gradient-to-b from-yellow-500/10 to-transparent border border-yellow-500/20 rounded-3xl animate-in fade-in zoom-in duration-500 shadow-2xl">
            <h3 className="text-2xl font-black italic text-yellow-500 uppercase tracking-tight">VICTORY SHOT!</h3>
            
            {winnerPhoto ? (
                <div className="relative group">
                    <img src={winnerPhoto} className="w-64 h-64 object-cover rounded-2xl border-4 border-yellow-500 shadow-2xl shadow-yellow-500/20" alt="Victory" />
                    <button 
                        onClick={() => setWinnerPhoto(null)}
                        className="absolute -top-3 -right-3 p-2 bg-red-600 rounded-full shadow-lg hover:bg-red-500 transition-colors"
                    >
                        <RefreshCw className="w-4 h-4 text-white" />
                    </button>
                </div>
            ) : showCamera ? (
                <div className="relative w-64 h-64 bg-black rounded-2xl overflow-hidden border-4 border-yellow-500 shadow-2xl">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                    <button 
                        onClick={takePhoto}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full border-4 border-yellow-500 flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                    >
                        <div className="w-8 h-8 rounded-full border-2 border-gray-200" />
                    </button>
                    <canvas ref={canvasRef} className="hidden" />
                </div>
            ) : (
                <button 
                    onClick={startCamera}
                    className="flex flex-col items-center gap-4 group"
                >
                    <div className="w-20 h-20 bg-yellow-500 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/20 group-hover:scale-110 transition-transform">
                        <Camera className="w-10 h-10 text-black" />
                    </div>
                    <span className="text-[10px] font-black italic text-yellow-500 uppercase tracking-widest animate-pulse">Touch to capture moment</span>
                </button>
            )}
        </div>
    );

    const renderLobby = () => (
        <div className="bg-[#111] border border-gray-800 rounded-3xl p-8 md:p-12 flex flex-col items-center gap-8 mt-12 relative overflow-hidden text-center">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 animate-pulse" />
            
            {roomType === 'TOURNAMENT' && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-2xl w-full max-w-sm mb-4">
                    <p className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest mb-1">Invite Friends</p>
                    <div className="flex items-center justify-center gap-4">
                        <span className="text-3xl font-black italic text-white tracking-tighter">{roomInviteCode}</span>
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/world-cup-pens?invite=${roomInviteCode}`);
                                alert("Link copied!");
                            }}
                            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                        >
                            <ShieldAlert className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            <div className="w-20 h-20 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            
            <div>
                <h3 className="text-2xl md:text-3xl font-black italic mb-2 uppercase italic tracking-tight">
                    {roomType === 'TOURNAMENT' ? 'FRIENDS TOURNAMENT LOBBY' : 'WAITING FOR ARENA'}
                </h3>
                <p className="text-gray-400 text-sm max-w-xs mx-auto mb-4">
                    {participants.length} Players connected. {(participants.length < 2) ? 'Invite friends to start the draw!' : 'Ready to start selection?'}
                </p>
            </div>

            <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
                {participants.map((p, i) => (
                    <div key={i} className="px-3 py-1 bg-white/5 rounded-full border border-white/10 text-[10px] font-mono">
                        {p.slice(0, 8)}...
                    </div>
                ))}
            </div>

            <div className="flex flex-col w-full max-w-xs gap-3">
                <button 
                    onClick={roomType === 'TOURNAMENT' ? handleStartSelection : handleStartGameManually}
                    className="w-full py-4 bg-green-600 hover:bg-green-500 rounded-2xl font-black italic transition-all shadow-lg shadow-green-500/20 uppercase tracking-widest"
                >
                    {roomType === 'TOURNAMENT' ? 'START TOURNAMENT' : 'START GAME NOW'}
                </button>

                <button 
                    onClick={() => {
                        setGameState('SELECTION');
                        setRoomId(null);
                    }}
                    className="text-gray-500 hover:text-white text-xs underline font-bold uppercase tracking-widest"
                >
                    Leave Lobby
                </button>
            </div>
        </div>
    );

    const renderSelecting = () => {
        const secondsLeft = selectionDeadline ? Math.max(0, Math.floor((new Date(selectionDeadline).getTime() - Date.now()) / 1000)) : 10;
        
        return (
            <div className="flex flex-col gap-8 mt-12">
                <div className="bg-red-500/20 border-2 border-red-500/40 p-6 rounded-3xl text-center animate-pulse">
                    <h2 className="text-2xl font-black italic text-red-400 uppercase tracking-tighter mb-1">TEAM SELECTION CLOSING</h2>
                    <p className="text-5xl font-black italic text-white">{secondsLeft}s</p>
                </div>

                <div className="bg-[#111] p-6 rounded-3xl border border-gray-800">
                    <TeamSelection 
                        onSelect={handleConfirmSelection}
                        isLoading={false}
                    />
                </div>
            </div>
        );
    };

    const renderEmailModal = () => {
        if (!showEmailModal) return null;
        const isJoin = showEmailModal.type === 'JOIN';
        
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
                <div className="bg-[#111] border border-gray-800 rounded-3xl p-8 w-full max-w-md shadow-2xl relative overflow-hidden">
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500" />
                    <button 
                        onClick={() => setShowEmailModal(null)}
                        className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white transition-colors"
                    >
                        <RefreshCw className="w-5 h-5 rotate-45" />
                    </button>

                    <h3 className="text-2xl font-black italic text-white mb-6 uppercase tracking-tight">
                        {isJoin ? 'JOIN TOURNAMENT' : 'START TOURNAMENT'}
                    </h3>

                    <div className="flex flex-col gap-6">
                        {!isJoin && (
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3 ml-1 text-center">Set Entry Fee</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {[0, 10, 50, 100].map((t) => (
                                        <button 
                                            key={t}
                                            onClick={() => setSelectedEntryTier(t)}
                                            className={`py-2 rounded-xl font-black italic text-sm transition-all border-2 ${selectedEntryTier === t ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500' : 'border-white/10 text-gray-500 hover:border-white/20'}`}
                                        >
                                            {t === 0 ? 'FREE' : `$${t}`}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isJoin && (
                            <div>
                                <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Invite Code</label>
                                <input 
                                    type="text"
                                    placeholder="ENTER CODE"
                                    value={inviteInput}
                                    onChange={(e) => setInviteInput(e.target.value.toUpperCase())}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-black italic focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-700"
                                />
                            </div>
                        )}
                        
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1.5 ml-1">Your Email</label>
                            <input 
                                type="email"
                                placeholder="EMAIL@EXAMPLE.COM"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-black italic focus:border-blue-500/50 outline-none transition-all placeholder:text-gray-700"
                            />
                        </div>

                        <button 
                            onClick={() => {
                                if (isJoin) {
                                    handleJoinTournament(inviteInput, emailInput);
                                } else {
                                    handleCreateTournament(selectedEntryTier, 8, emailInput);
                                }
                                setShowEmailModal(null);
                            }}
                            disabled={!emailInput || (isJoin && !inviteInput) || loadingAction || (!isJoin && selectedEntryTier > balance)}
                            className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-black italic transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 uppercase tracking-widest mt-2"
                        >
                            {loadingAction ? 'PROCESSING...' : (isJoin ? 'JOIN NOW' : 'CREATE TOURNAMENT')}
                        </button>
                        {!isJoin && selectedEntryTier > balance && (
                            <p className="text-[10px] text-red-500 font-bold uppercase text-center">Insufficient Balance</p>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    const renderDraw = () => (
        <div className="flex flex-col gap-12 mt-12 px-4">
            <div className="text-center">
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-bounce" />
                <h2 className="text-4xl font-black italic uppercase italic tracking-tight text-white mb-2">OFFICIAL DRAW</h2>
                <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">The tournament bracket has been finalized</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
                {brackets.map((b, i) => (
                    <div key={i} className="bg-[#111] border border-gray-800 p-6 rounded-3xl flex items-center justify-between relative group hover:border-blue-500/50 transition-all">
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-blue-600 rounded-full text-[10px] font-black italic text-white uppercase tracking-widest">Match {i + 1}</div>
                        <div className="flex flex-col items-center gap-2 flex-1">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center font-black italic border border-white/10 uppercase text-xs">{b.p1_wallet.slice(0, 4)}</div>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{b.p1_wallet.slice(0, 10)}...</span>
                        </div>
                        <div className="text-2xl font-black italic text-gray-700 px-6 uppercase italic">VS</div>
                        <div className="flex flex-col items-center gap-2 flex-1">
                            <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center font-black italic border border-white/10 uppercase text-xs">{b.p2_wallet.slice(0, 4)}</div>
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{b.p2_wallet.slice(0, 10)}...</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="text-center mt-8">
                <div className="inline-block p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                    <p className="text-blue-400 font-bold uppercase tracking-widest text-xs animate-pulse italic">Starting first matches in 5 seconds...</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-black text-white selection:bg-blue-500/30 font-sans flex flex-col relative overflow-hidden">
            <div className="absolute inset-0 z-0 opacity-10 bg-[url('/hero-track.jpg')] bg-cover bg-center mix-blend-screen pointer-events-none" />
            <div className="absolute inset-0 z-0 bg-gradient-to-b from-blue-900/10 to-black pointer-events-none" />

            <header className="relative z-10 p-4 border-b border-white/10 flex justify-between items-center bg-black/50 backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <button onClick={() => router.push('/dashboard')} className="p-2 border border-gray-800 rounded-full hover:bg-white/10"><ChevronLeft className="w-5 h-5"/></button>
                    <h1 className="text-xl md:text-2xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-600 uppercase">PENALTY ARENA</h1>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex flex-col items-end">
                        <div className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">Your Balance</div>
                        <div className="text-lg font-black italic text-green-400">${balance.toLocaleString()}</div>
                    </div>
                </div>
            </header>

            <main className="relative z-10 max-w-6xl mx-auto w-full p-4 flex flex-col gap-8 mt-4">
                {showEmailModal && renderEmailModal()}
                {showLeaderboard && renderLeaderboard()}
                {gameState === 'SELECTION' && renderSelection()}
                {gameState === 'TEAM_SELECTION' && (
                    <div className="mt-8">
                        <button 
                            onClick={() => setGameState('SELECTION')}
                            className="flex items-center gap-2 text-gray-500 hover:text-white mb-8 transition-colors"
                        >
                            <ChevronLeft className="w-4 h-4" /> <span className="text-xs font-bold uppercase tracking-widest">Back to path selection</span>
                        </button>
                        <TeamSelection 
                            onSelect={handleTeamSelect} 
                            isLoading={loadingAction}
                        />
                    </div>
                )}
                {gameState === 'LOBBY' && renderLobby()}
                {gameState === 'SELECTING' && renderSelecting()}
                {gameState === 'DRAW' && renderDraw()}
                {gameState === 'PLAYING' && (
                    <div className="flex flex-col gap-6">
                        <div className="flex flex-col md:flex-row justify-between items-center bg-[#111] p-6 rounded-3xl border border-gray-800 gap-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-yellow-500/10 rounded-2xl border border-yellow-500/20">
                                    <Trophy className="w-8 h-8 text-yellow-500" />
                                </div>
                                <div className="flex flex-col">
                                    <h2 className="text-gray-400 text-[10px] font-bold tracking-widest uppercase mb-0.5">
                                        {isTournamentMode ? TOURNAMENT_ROUNDS[tournamentRound - 1] : 'ARENA POOL'}
                                    </h2>
                                    <h3 className="text-2xl font-black italic text-yellow-400 tracking-tight uppercase">
                                        {isTournamentMode ? `vs ${opponentTeam}` : `$${(selectedTier || 0) * (participants.length > 1 ? participants.length : 2)} POOL`}
                                    </h3>
                                </div>
                            </div>
                            
                            <div className="flex gap-12 items-end">
                                <div className="text-center">
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{playerTeam?.name || 'YOU'}</div>
                                    <div className="text-4xl font-black italic text-blue-400">{matchScore.p1}</div>
                                </div>
                                <div className="text-4xl font-black italic text-gray-600 mb-1">:</div>
                                <div className="text-center">
                                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{isTournamentMode ? 'CPU' : 'OPP'}</div>
                                    <div className="text-4xl font-black italic text-red-500">{matchScore.p2}</div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="text-xs font-bold text-gray-500 font-mono text-emerald-400 uppercase tracking-wider">Session Points</div>
                                <div className="text-3xl font-black italic text-white uppercase">{totalMatchPoints.toLocaleString()} PTS</div>
                            </div>
                        </div>

                        <div className="relative group">
                            <PenaltyPvPGame 
                                isPlayerShooting={isPlayerShooting}
                                opponentName={isTournamentMode ? opponentTeam : (participants.length > 1 ? (participants.find(p => p !== user?.wallet?.address)?.slice(0, 8) || "Opponent") : "COMPUTER")}
                                onTurn={handleTurn}
                                lastShot={lastTurnResult}
                            />
                            
                            {!multiplierUsed && !lastTurnResult && (
                                <div className="absolute left-1/2 -translate-x-1/2 bottom-8 z-20">
                                    <button 
                                        onClick={() => setIsMultiplierActive(!isMultiplierActive)}
                                        className={`px-8 py-3 rounded-2xl font-black italic transition-all shadow-xl flex items-center gap-3 border-2 ${isMultiplierActive ? 'bg-yellow-500 text-black border-white animate-pulse scale-110' : 'bg-black/80 text-white border-yellow-500/50 hover:border-yellow-500'}`}
                                    >
                                        <Trophy className={`w-5 h-5 ${isMultiplierActive ? 'text-black' : 'text-yellow-500'}`} />
                                        {isMultiplierActive ? 'X3 / X10 ACTIVE!' : 'USE 1X MULTIPLIER'}
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-[#111] border border-gray-800 rounded-2xl p-6">
                                <div className="flex items-center gap-4 text-blue-400 mb-2">
                                    <Goal className="w-6 h-6" /> <h3 className="font-bold text-lg uppercase tracking-tight italic">Arena Scoring</h3>
                                </div>
                                <ul className="list-disc pl-5 text-gray-400 text-sm space-y-2 mt-2 font-medium">
                                    <li>Goal: 100 PTS <span className="text-yellow-500 font-bold">(X3 with Multiplier)</span></li>
                                    <li>Save: 200 PTS <span className="text-yellow-500 font-bold">(X10 with Multiplier)</span></li>
                                    <li>Win Match: 500 PTS Bonus</li>
                                    <li>Cutoff: Saturday 15:00 UTC (Top 100 progress)</li>
                                </ul>
                            </div>
                            <div className="bg-[#111] border border-gray-800 rounded-2xl p-6 flex flex-col justify-center items-center gap-4">
                                <div className="text-center">
                                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-2">Strategy Tip</p>
                                    <p className="text-sm text-gray-300 font-medium italic">"Saves are worth double goals—using your multiplier on a predicted save can net you 2,000 points in a single turn!"</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {gameState === 'FINISHED' && (
                    <div className="bg-[#111] border border-gray-800 rounded-3xl p-8 md:p-12 flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-8 duration-700 max-w-2xl mx-auto mt-12 mb-8 mx-4">
                        {matchScore.p1 > matchScore.p2 ? (
                            <div className="flex flex-col items-center">
                                <div className="p-6 bg-yellow-400/20 rounded-full mb-6 border-2 border-yellow-400/30 animate-bounce">
                                    <Award className="w-16 h-16 text-yellow-400" />
                                </div>
                                <h2 className="text-4xl md:text-6xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mb-2 uppercase">CHAMPION!</h2>
                                <p className="text-sm md:text-xl text-gray-400 font-bold uppercase tracking-widest mb-8">Victory is yours</p>
                                {renderWinnerPhoto()}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center text-center">
                                <div className="p-6 bg-gray-500/20 rounded-full mb-6 border-2 border-gray-500/30">
                                    <Trophy className="w-16 h-16 text-gray-400" />
                                </div>
                                <h2 className="text-3xl md:text-4xl font-black italic text-gray-400 mb-2 uppercase italic tracking-tight">KEEP TRAINING</h2>
                                <p className="text-sm md:text-lg text-gray-500 font-bold uppercase tracking-widest mb-8">Defeat is just a lesson</p>
                            </div>
                        )}
                        
                        <div className="flex flex-col w-full gap-4 mt-8">
                            <button 
                                onClick={() => setGameState('SELECTION')}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-2xl font-black italic transition-all shadow-lg shadow-blue-500/20 uppercase tracking-widest text-sm"
                            >
                                Enter New Arena
                            </button>
                            <button 
                                onClick={() => router.push('/dashboard')}
                                className="text-gray-500 hover:text-white text-xs underline font-bold uppercase tracking-widest"
                            >
                                Back to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
