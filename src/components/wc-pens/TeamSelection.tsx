'use client';

import { TEAMS_DATA } from '@/lib/wcTeams';
import { Check, Lock } from 'lucide-react';
import { useState } from 'react';

interface TeamSelectionProps {
    onSelect: (teamId: string, teamName: string) => void;
    takenTeams?: string[];
    isLoading?: boolean;
}

export function TeamSelection({ onSelect, takenTeams = [], isLoading = false }: TeamSelectionProps) {
    const [selectedId, setSelectedId] = useState<string | null>(null);

    const handleConfirm = () => {
        if (!selectedId) return;
        const team = TEAMS_DATA.find(t => t.id === selectedId);
        if (team) onSelect(team.id, team.name);
    };

    return (
        <div className="flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center">
                <h2 className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-600 mb-2 uppercase">PICK YOUR NATION</h2>
                <p className="text-gray-500 text-sm font-bold tracking-widest uppercase">Represent your country in the Arena</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-8 gap-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {TEAMS_DATA.map((team) => {
                    const isTaken = takenTeams.includes(team.id);
                    const isSelected = selectedId === team.id;

                    return (
                        <button
                            key={team.id}
                            onClick={() => !isTaken && setSelectedId(team.id)}
                            disabled={isTaken}
                            className={`
                                relative p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 group
                                ${isTaken 
                                    ? 'bg-gray-900/50 border-gray-800 opacity-50 cursor-not-allowed' 
                                    : isSelected
                                        ? 'bg-blue-500/10 border-blue-500 shadow-lg shadow-blue-500/20'
                                        : 'bg-[#111] border-gray-800 hover:border-gray-600 hover:bg-white/5'}
                            `}
                        >
                            {isSelected && (
                                <div className="absolute -top-2 -right-2 bg-blue-500 rounded-full p-1 shadow-lg z-10">
                                    <Check className="w-3 h-3 text-white" />
                                </div>
                            )}
                            {isTaken && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl z-10">
                                    <Lock className="w-5 h-5 text-gray-400" />
                                </div>
                            )}
                            
                            <div className="text-3xl filter saturate-150 group-hover:scale-110 transition-transform mb-1 uppercase font-black italic opacity-20 pointer-events-none select-none">
                                {team.id.slice(0, 3)}
                            </div>
                            <span className="text-[10px] font-bold uppercase tracking-tight text-center line-clamp-1">
                                {team.name}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col items-center gap-4 border-t border-white/5 pt-8">
                <button
                    onClick={handleConfirm}
                    disabled={!selectedId || isLoading}
                    className="px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 rounded-xl font-black italic transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 text-white uppercase tracking-widest text-lg"
                >
                    {isLoading ? 'PREPARING ARENA...' : 'CONFIRM SELECTION'}
                </button>
                <p className="text-gray-500 text-[10px] font-bold uppercase tracking-widest">
                    Once selected, you will be matched with an opponent
                </p>
            </div>
            
            <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                    width: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #333;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #444;
                }
            `}</style>
        </div>
    );
}
