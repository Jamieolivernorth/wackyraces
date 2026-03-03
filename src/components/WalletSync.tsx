'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGameStore } from '../store/gameStore';
import { useSearchParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

function SyncWorker() {
    const { publicKey, connected } = useWallet();
    const setBalance = useGameStore(state => state.setUserBalance);
    const setWalletAddress = useGameStore(state => state.setWalletAddress);
    const fetchSettings = useGameStore(state => state.fetchSettings);
    const searchParams = useSearchParams();
    const ref = searchParams.get('ref');

    const { getAccessToken } = usePrivy();

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    useEffect(() => {
        const syncUser = async () => {
            if (connected && publicKey) {
                const walletAddress = publicKey.toBase58();
                setWalletAddress(walletAddress); // Let store know

                let url = `/api/user?wallet=${walletAddress}`;
                if (ref) url += `&ref=${ref}`;

                try {
                    // Get Privy JWT to authorize account creation/sync
                    const token = await getAccessToken();

                    // Fetch or create user in SQLite DB
                    const res = await fetch(url, {
                        headers: token ? {
                            'Authorization': `Bearer ${token}`
                        } : {}
                    });

                    const data = await res.json();

                    // Note: Handle 403 identity errors gracefully in the UI if needed
                    if (res.ok && data && data.balance !== undefined) {
                        setBalance(data.balance);
                    } else if (data.error) {
                        console.warn("Wallet Sync Error:", data.error);
                    }
                } catch (err) {
                    console.error("Error syncing wallet:", err);
                }
            } else {
                // Disconnected, revert to 0 or mock 10000
                setWalletAddress(null);
                setBalance(0);
            }
        };

        syncUser();
    }, [connected, publicKey, setBalance, setWalletAddress, ref, getAccessToken]);

    return null;
}

import React, { Suspense } from 'react';
export const WalletSync = () => (
    <Suspense fallback={null}>
        <SyncWorker />
    </Suspense>
);
