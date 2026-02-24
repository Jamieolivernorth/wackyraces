'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGameStore } from '../store/gameStore';
import { useSearchParams } from 'next/navigation';

function SyncWorker() {
    const { publicKey, connected } = useWallet();
    const setBalance = useGameStore(state => state.setUserBalance);
    const setWalletAddress = useGameStore(state => state.setWalletAddress);
    const searchParams = useSearchParams();
    const ref = searchParams.get('ref');

    useEffect(() => {
        if (connected && publicKey) {
            const walletAddress = publicKey.toBase58();
            setWalletAddress(walletAddress); // Let store know

            let url = `/api/user?wallet=${walletAddress}`;
            if (ref) url += `&ref=${ref}`;

            // Fetch or create user in SQLite DB
            fetch(url)
                .then(res => res.json())
                .then(data => {
                    if (data && data.balance !== undefined) {
                        setBalance(data.balance);
                    }
                })
                .catch(err => console.error("Error syncing wallet:", err));
        } else {
            // Disconnected, revert to 0 or mock 10000
            setWalletAddress(null);
            setBalance(0);
        }
    }, [connected, publicKey, setBalance, setWalletAddress, ref]);

    return null;
}

import React, { Suspense } from 'react';
export const WalletSync = () => (
    <Suspense fallback={null}>
        <SyncWorker />
    </Suspense>
);
