'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGameStore } from '../store/gameStore';
import { Loader2 } from 'lucide-react';

export const BankingPanel = () => {
    const { publicKey } = useWallet();
    const { userBalance, setUserBalance, phase } = useGameStore();
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState<'deposit' | 'withdraw' | null>(null);

    if (!publicKey) return null;

    const handleTransaction = async (type: 'deposit' | 'withdraw') => {
        const val = parseFloat(amount);
        if (isNaN(val) || val <= 0) return;

        if (type === 'withdraw' && val > userBalance) {
            alert('Insufficient ledger balance');
            return;
        }

        setLoading(type);
        const wallet = publicKey.toBase58();

        try {
            // Simulate wallet approval delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            const res = await fetch(`/api/user/${type}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ wallet, amount: val })
            });

            const data = await res.json();
            if (data.success) {
                setUserBalance(data.newBalance);
                setAmount('');
            } else {
                alert(data.error);
            }
        } catch (e) {
            console.error(e);
            alert('Transaction failed');
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 shadow-xl flex flex-col gap-3">
            <h3 className="text-gray-500 font-bold uppercase text-[10px] flex justify-between items-center">
                <span>🏦 House Ledger</span>
                <span className="text-blue-400 font-mono text-xs">{publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}</span>
            </h3>

            <div className="flex gap-2">
                <input
                    type="number"
                    min="0"
                    placeholder="USDC Amount"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    disabled={!!loading || phase !== 'BETTING'}
                    className="flex-1 bg-gray-800 border-none rounded px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
            </div>

            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => handleTransaction('deposit')}
                    disabled={!!loading || !amount || phase !== 'BETTING'}
                    className="bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-600/50 rounded py-2 text-xs font-bold transition-colors flex items-center justify-center disabled:opacity-50"
                >
                    {loading === 'deposit' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'DEPOSIT'}
                </button>
                <button
                    onClick={() => handleTransaction('withdraw')}
                    disabled={!!loading || !amount || parseFloat(amount) > userBalance || phase !== 'BETTING'}
                    className="bg-red-600/20 text-red-400 hover:bg-red-600/30 border border-red-600/50 rounded py-2 text-xs font-bold transition-colors flex items-center justify-center disabled:opacity-50"
                >
                    {loading === 'withdraw' ? <Loader2 className="w-3 h-3 animate-spin" /> : 'WITHDRAW'}
                </button>
            </div>
            <p className="text-[9px] text-gray-500 text-center italic">
                Simulated Devnet SPL Transfers for MVP
            </p>
        </div>
    );
};
