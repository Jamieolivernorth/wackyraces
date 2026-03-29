'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import React from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cmm3uloru019k0cl5bytvm2xl"}
            config={{
                loginMethods: ['email', 'google', 'twitter', 'discord'],
                appearance: {
                    theme: 'dark',
                    accentColor: '#3b82f6',
                    showWalletLoginFirst: false,
                },
                embeddedWallets: {
                    solana: {
                        createOnLogin: 'users-without-wallets',
                    }
                }
            }}
        >
            {children}
        </PrivyProvider>
    );
}
