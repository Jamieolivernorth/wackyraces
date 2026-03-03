'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import React from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID || "cm05p4b9e030o12n6c7m2a4j1"}
            config={{
                loginMethods: ['email', 'wallet', 'google', 'twitter', 'discord'],
                appearance: {
                    theme: 'dark',
                    accentColor: '#3b82f6',
                    logo: 'https://wackyraces.fun/apple-touch-icon.png', // Or your preferred logo URL
                    showWalletLoginFirst: true,
                },
            }}
        >
            {children}
        </PrivyProvider>
    );
}
