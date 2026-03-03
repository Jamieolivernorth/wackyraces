'use client';

import React, { useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { Contender, ContenderId, GameMode } from '@/types/game';
import { Save, PlusCircle, Trash2, Users, Settings2, PlayCircle } from 'lucide-react';

// Default Player Setup template
const DEFAULT_PLAYER: Omit<Contender, 'id'> = {
    name: 'Player Name',
    symbol: 'PLY',
    color: '#3B82F6',
    startMetric: 0,
    currentMetric: 0,
    targetMetric: 35, // e.g. touches
    performance: 0,
    position: 0,
    // Note: To map specifically for the mock event simulator, we pass ‘role’ via a custom type
    recentEvents: []
};

type AdminPlayer = Omit<Contender, 'id'> & { id: string, role: 'DEF' | 'MID' | 'STR' };

export const LiveMatchManager = () => {
    const { phase, mode, setGameMode, contenders, updateLiveTouches, setMatchDayConfig, setMatchDayActive } = useGameStore();

    // Editor state
    const [editorMode, setEditorMode] = useState<GameMode>('FOOTBALL');
    const [provider, setProvider] = useState<'Mock Engine' | 'Opta' | 'StatsPerform'>('Mock Engine');
    const [apiKey, setApiKey] = useState('');
    const [matchId, setMatchId] = useState('');

    const [players, setPlayers] = useState<AdminPlayer[]>([
        { ...DEFAULT_PLAYER, id: 'saliba', name: 'W. Saliba', symbol: 'SAL', color: '#EF0107', role: 'DEF' },
        { ...DEFAULT_PLAYER, id: 'odegaard', name: 'M. Ødegaard', symbol: 'ODE', color: '#EF0107', role: 'MID' },
        { ...DEFAULT_PLAYER, id: 'saka', name: 'B. Saka', symbol: 'SAK', color: '#EF0107', role: 'STR' },
        { ...DEFAULT_PLAYER, id: 'dias', name: 'R. Dias', symbol: 'DIA', color: '#6CABDD', role: 'DEF' },
        { ...DEFAULT_PLAYER, id: 'kdb', name: 'K. De Bruyne', symbol: 'KDB', color: '#6CABDD', role: 'MID' },
        { ...DEFAULT_PLAYER, id: 'haaland', name: 'E. Haaland', symbol: 'HAA', color: '#6CABDD', role: 'STR' },
    ]);

    const handlePlayerUpdate = (index: number, key: keyof AdminPlayer, value: string | number) => {
        const newPlayers = [...players];
        newPlayers[index] = { ...newPlayers[index], [key]: value };
        setPlayers(newPlayers);
    };

    const handleStartMatch = async () => {
        try {
            // Update global config regardless of the server mock
            const playerRecord: Record<string, Omit<Contender, 'id'>> = {};
            players.forEach(p => {
                // we strip out 'id' but retain all other metrics so resetRace handles it perfectly
                const { id, ...rest } = p;
                playerRecord[id] = rest;
            });

            setMatchDayConfig({
                provider,
                apiKey,
                matchId,
                players: playerRecord
            });

            const res = await fetch('/api/admin/match', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: editorMode, contenders: players, provider, matchId, apiKey })
            });

            if (res.ok) {
                const data = await res.json();
                console.log("Match instantiated with ID:", data.matchId);
                // The Global Set forces the entire frontend into the pre-configured mode
                setMatchDayActive(true);
            } else {
                alert("Failed to start match sequence.");
            }
        } catch (e) {
            console.error("Match instantiation error", e);
            // Fallback for purely local testing without DB endpoints
            setMatchDayActive(true);
        }
    };

    const isLiveMatch = mode === 'FOOTBALL' && phase !== 'BETTING' && phase !== 'FINISHED';

    const updateLiveTouchesServer = async (contenderId: ContenderId, newVal: number) => {
        const oldVal = contenders[contenderId].currentMetric;
        const diff = newVal - oldVal;

        // Optimistically update
        updateLiveTouches(contenderId, newVal);

        // Background sync to db (assuming a default DEV match ID)
        try {
            await fetch('/api/admin/match/ticks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ matchId: 1, contenderId, increment: diff }) // Hardcoded match 1 for now
            });
        } catch (e) {
            console.error("Failed server touch update", e);
        }
    };

    if (isLiveMatch) {
        return (
            <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 shadow-xl w-full max-w-4xl mx-auto">
                <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
                    <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                        <span className="relative flex h-3 w-3 mr-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        Match In Progress - Live Tracker
                    </h3>
                    <div className="text-red-400 font-mono text-sm uppercase">Phase: {phase}</div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.values(contenders).map(c => (
                        <div key={c.id} className="bg-black/50 p-4 border border-gray-800 rounded-xl flex flex-col gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs" style={{ backgroundColor: c.color, color: 'white' }}>
                                    {c.symbol}
                                </div>
                                <span className="font-bold text-lg">{c.name}</span>
                            </div>

                            <div className="flex items-center justify-between bg-gray-900 rounded-lg p-3">
                                <span className="text-gray-400 uppercase text-xs font-bold tracking-widest">Touches</span>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => updateLiveTouchesServer(c.id, Math.max(0, c.currentMetric - 1))}
                                        className="w-8 h-8 rounded bg-gray-800 hover:bg-gray-700 font-bold text-xl flex items-center justify-center transition-colors"
                                    >-</button>
                                    <span className="text-2xl font-black font-mono w-8 text-center text-blue-400">
                                        {c.currentMetric}
                                    </span>
                                    <button
                                        onClick={() => updateLiveTouchesServer(c.id, c.currentMetric + 1)}
                                        className="w-8 h-8 rounded bg-blue-600 hover:bg-blue-500 font-bold text-xl flex items-center justify-center transition-colors"
                                    >+</button>
                                </div>
                            </div>
                            <div className="text-right text-xs text-gray-500 font-mono">
                                Target: {c.targetMetric}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-8 p-4 bg-red-900/20 border border-red-500/20 text-red-300 rounded-lg text-sm flex gap-3">
                    <span className="font-bold">CAUTION:</span>
                    Changes made here directly alter the race outcome probability curve in real-time. Ensure official match data sources are used.
                </div>
            </div>
        )
    }

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl w-full max-w-5xl mx-auto mt-8">
            <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2 text-white">
                    <Settings2 className="w-5 h-5 text-blue-500" />
                    Match Configuration
                </h3>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-400 uppercase tracking-widest mb-2">Game Event Template</label>
                        <select
                            value={editorMode}
                            onChange={(e) => setEditorMode(e.target.value as GameMode)}
                            className="bg-black border border-gray-800 rounded px-4 py-3 text-white focus:outline-none focus:border-blue-500 w-full transition-colors cursor-pointer"
                        >
                            <option value="FOOTBALL">Football (Touches to Target)</option>
                            <option value="CRYPTO" disabled>Crypto Markets (Random Automated)</option>
                        </select>
                    </div>

                    <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-bold text-blue-400 uppercase tracking-widest mb-1">Live Data Provider</label>
                            <select
                                value={provider}
                                onChange={(e) => setProvider(e.target.value as any)}
                                className="bg-black border border-gray-800 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500 w-full"
                            >
                                <option value="Mock Engine">Mock Engine (Internal Simulator)</option>
                                <option value="Opta">Opta Sports (Beta API)</option>
                                <option value="StatsPerform">StatsPerform API</option>
                            </select>
                        </div>
                        {provider !== 'Mock Engine' && (
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Match ID (e.g. 1928374)"
                                    value={matchId}
                                    onChange={(e) => setMatchId(e.target.value)}
                                    className="bg-black border border-gray-800 rounded px-3 py-2 text-sm w-1/3 focus:border-blue-500 placeholder-gray-600"
                                />
                                <input
                                    type="password"
                                    placeholder="API Key/Token"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    className="bg-black border border-gray-800 rounded px-3 py-2 text-sm w-2/3 focus:border-blue-500 placeholder-gray-600"
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-black/30 rounded-xl border border-gray-800 p-6">
                    <h4 className="font-bold text-lg mb-4 flex items-center gap-2 border-b border-gray-800 pb-2">
                        <Users className="w-4 h-4 text-purple-400" />
                        Participating Contenders ({players.length}/6)
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {players.map((p, i) => (
                            <div key={p.id} className="bg-gray-900 p-4 rounded-lg border border-gray-700 flex flex-col gap-3 relative group">

                                {/* Top Row */}
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        className="bg-black border border-gray-800 rounded px-3 py-2 text-sm w-full focus:border-blue-500"
                                        value={p.name}
                                        onChange={(e) => handlePlayerUpdate(i, 'name', e.target.value)}
                                        placeholder="Full Name (e.g. Lionel Messi)"
                                    />
                                    <input
                                        type="text"
                                        className="bg-black border border-gray-800 font-mono rounded px-3 py-2 text-sm w-20 text-center uppercase focus:border-blue-500"
                                        value={p.symbol}
                                        maxLength={3}
                                        onChange={(e) => handlePlayerUpdate(i, 'symbol', e.target.value.toUpperCase())}
                                        placeholder="SYM"
                                    />
                                    <select
                                        value={p.role}
                                        onChange={(e) => handlePlayerUpdate(i, 'role', e.target.value)}
                                        className="bg-gray-800 border border-gray-700 rounded px-2 py-2 text-xs font-bold text-white w-20 shrink-0 focus:border-blue-500 cursor-pointer"
                                    >
                                        <option value="DEF">DEF</option>
                                        <option value="MID">MID</option>
                                        <option value="STR">STR</option>
                                    </select>
                                    <input
                                        type="color"
                                        value={p.color}
                                        onChange={(e) => handlePlayerUpdate(i, 'color', e.target.value)}
                                        className="h-9 w-12 rounded cursor-pointer bg-black border border-gray-800 p-1 shrink-0"
                                    />
                                </div>

                                {/* Bottom Row */}
                                <div className="flex justify-between items-center bg-black/40 p-2 rounded border border-gray-800">
                                    <span className="text-xs text-gray-400 font-bold ml-2">TARGET LIKELIHOOD METRIC:</span>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="number"
                                            className="bg-black border border-gray-700 font-mono font-bold text-blue-400 rounded px-3 py-1 w-20 text-right focus:border-blue-500"
                                            value={p.targetMetric}
                                            onChange={(e) => handlePlayerUpdate(i, 'targetMetric', parseInt(e.target.value) || 0)}
                                        />
                                        <span className="text-xs text-gray-500 font-mono mr-2">TOUCHES</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex justify-between items-center pt-6 border-t border-gray-800">
                    <p className="text-gray-500 text-sm italic">Overrides current global phase mode.</p>
                    <button
                        onClick={handleStartMatch}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-lg font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-105 flex items-center gap-2"
                    >
                        <PlayCircle className="w-5 h-5" />
                        Initialize Event Broadcast
                    </button>
                </div>
            </div>
        </div>
    );
};
