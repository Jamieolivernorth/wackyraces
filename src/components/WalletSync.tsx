'use client';

import { useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useGameStore } from '../store/gameStore';
import { useSearchParams } from 'next/navigation';
import { usePrivy } from '@privy-io/react-auth';

function SyncWorker() {
    const { publicKey, connected } = useWallet();
    const setBalance = useGameStore(state => state.setUserBalance);
    const setWcBalance = useGameStore(state => state.setWcBalance);
    const setWalletAddress = useGameStore(state => state.setWalletAddress);
    const fetchSettings = useGameStore(state => state.fetchSettings);
    const searchParams = useSearchParams();
    const ref = searchParams.get('ref');

    const { getAccessToken, user, ready, authenticated } = usePrivy();

    useEffect(() => {
        fetchSettings();
    }, [fetchSettings]);

    useEffect(() => {
        const syncUser = async () => {
            const externalWallet = connected && publicKey ? publicKey.toBase58() : null;
            const privyWallet = user?.wallet?.address;
            const walletAddress = externalWallet || privyWallet;

            if (ready && authenticated && walletAddress) {
                setWalletAddress(walletAddress); // Let store know

                let url = `/api/user?wallet=${walletAddress}`;
                if (ref) url += `&ref=${ref}`;

                try {
                    // Get Privy JWT to authorize account creation/sync
                    const token = await getAccessToken();

                    console.log(`[WalletSync] Syncing user. Wallet: ${walletAddress}, Token Present: ${!!token}`);

                    // Fetch or create user in SQLite DB
                    const res = await fetch(url, {
                        headers: token ? {
                            'Authorization': `Bearer ${token}`
                        } : {}
                    });

                    const data = await res.json();

                    // Note: Handle 403 identity errors gracefully in the UI if needed
                    if (res.ok && data) {
                        if (data.balance !== undefined) setBalance(data.balance);
                        if (data.wc_balance !== undefined) setWcBalance(data.wc_balance);
                    } else if (data.error) {
                        console.warn("Wallet Sync Error:", data.error);
                    }
                } catch (err) {
                    console.error("Error syncing wallet:", err);
                }
            } else if (ready) {
                console.log(`[WalletSync] Ready but skipping sync. Auth=${authenticated}, Wallet=${walletAddress}, PrivyWallet=${user?.wallet?.address}`);
                // Disconnected
                setWalletAddress(null);
                setBalance(0);
                setWcBalance(0);
            }
        };

        syncUser();
    }, [connected, publicKey, setBalance, setWcBalance, setWalletAddress, ref, getAccessToken, user, ready, authenticated]);

    return null;
}

import React, { Suspense } from 'react';
export const WalletSync = () => (
    <Suspense fallback={null}>
        <SyncWorker />
    </Suspense>
);
