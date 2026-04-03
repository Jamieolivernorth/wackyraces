'use client';

import React, { useState } from 'react';
import { Mail, Copy, Check, Search, ExternalLink } from 'lucide-react';

interface User {
    wallet_address: string;
    email: string | null;
    balance: number;
    created_at: string;
}

interface UserListProps {
    users: User[];
}

export function UserList({ users }: UserListProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [copied, setCopied] = useState(false);

    const filteredUsers = users.filter(user => 
        user.wallet_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const copyAllEmails = () => {
        const emails = users
            .map(u => u.email)
            .filter((e): e is string => !!e)
            .join(', ');
        
        if (emails) {
            navigator.clipboard.writeText(emails);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <div className="mt-12 bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-gray-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h3 className="text-2xl font-black italic tracking-tighter text-white flex items-center gap-3">
                        <Mail className="w-6 h-6 text-blue-500" />
                        USER DIRECTORY
                    </h3>
                    <p className="text-gray-400 text-sm mt-1">Manage and export player data for marketing</p>
                </div>
                
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input 
                            type="text"
                            placeholder="Search by wallet or email..."
                            className="w-full bg-black border border-gray-800 rounded-xl py-2 pl-10 pr-4 text-sm focus:border-blue-500 outline-none transition-colors"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    
                    <button 
                        onClick={copyAllEmails}
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95 shrink-0"
                    >
                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {copied ? 'COPIED!' : 'COPY ALL EMAILS'}
                    </button>
                </div>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-black/50 text-gray-500 text-xs font-bold uppercase tracking-widest">
                            <th className="px-8 py-4">Wallet Address</th>
                            <th className="px-8 py-4">Email Address</th>
                            <th className="px-8 py-4 text-right">Balance</th>
                            <th className="px-8 py-4 text-right">Joined Date</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <tr key={user.wallet_address} className="hover:bg-gray-800/30 transition-colors group">
                                    <td className="px-8 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-sm text-gray-300">
                                                {user.wallet_address.slice(0, 6)}...{user.wallet_address.slice(-4)}
                                            </span>
                                            <a 
                                                href={`https://basescan.org/address/${user.wallet_address}`} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-500"
                                            >
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        </div>
                                    </td>
                                    <td className="px-8 py-4">
                                        {user.email ? (
                                            <span className="text-sm text-white font-medium">{user.email}</span>
                                        ) : (
                                            <span className="text-xs text-gray-600 italic">No email captured</span>
                                        )}
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <span className="text-sm font-bold text-green-400">
                                            ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                        </span>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <span className="text-xs text-gray-500">
                                            {new Date(user.created_at).toLocaleDateString()}
                                        </span>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="px-8 py-12 text-center text-gray-500 italic">
                                    No users found matching your search.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            
            <div className="p-4 bg-black/30 border-t border-gray-800 text-center">
                <p className="text-[10px] text-gray-600 uppercase tracking-[0.2em] font-bold">
                    Showing {filteredUsers.length} of {users.length} total players
                </p>
            </div>
        </div>
    );
}
