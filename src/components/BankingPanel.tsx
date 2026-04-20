'use client';

import React, { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGameStore } from '../store/gameStore';
import { Loader2 } from 'lucide-react';
import { usePrivy } from '@privy-io/react-auth';

export const BankingPanel = () => {
    const { publicKey } = useWallet();
    const { getAccessToken } = usePrivy();
    const { userBalance, setUserBalance, wcBalance, setWcBalance, phase } = useGameStore();
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

            const token = await getAccessToken();

            const res = await fetch(`/api/user/${type}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ wallet, amount: val })
            });

            const data = await res.json();
            if (data.success) {
                setUserBalance(data.newBalance);
                if (data.newWcBalance !== undefined) setWcBalance(data.newWcBalance);
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
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-4 shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] flex flex-col gap-3">
            <h3 className="text-gray-500 font-bold uppercase text-[10px] flex justify-between items-center bg-white/5 px-2 py-1 rounded">
                <span>🏦 Cash (USDC)</span>
                <span className="text-green-400 font-mono text-xs">${userBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</span>
            </h3>

            <h3 className="text-gray-500 font-bold uppercase text-[10px] flex justify-between items-center bg-white/5 px-2 py-1 rounded mb-2">
                <span>🪙 Wacky Coins</span>
                <span className="text-yellow-400 font-mono text-xs">{wcBalance.toLocaleString()}</span>
            </h3>

            <div className="flex flex-col gap-1">
                <input
                    type="number"
                    min="0"
                    placeholder="USDC Amount (Cash)"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    disabled={!!loading || phase !== 'BETTING'}
                    className="w-full bg-gray-800 border-none rounded px-3 py-2 text-sm text-white outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
                {(parseFloat(amount) > 0) && (
                    <div className="text-[10px] text-green-400 font-bold ml-1 animate-pulse">
                        +{ (parseFloat(amount) * 250).toLocaleString() } Wacky Coins
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
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
            <div className="flex justify-between items-center text-[9px] text-gray-500">
                <span className="italic">Simulated Devnet SPL Transfers</span>
                <span className="font-bold text-yellow-500/80">Rate: $100 = 25,000 Coins</span>
            </div>
        </div>
    );
};
