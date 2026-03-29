'use client';

import { usePrivy } from '@privy-io/react-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function PrivyLoginButton() {
    const { login, ready, authenticated } = usePrivy();
    const router = useRouter();

    useEffect(() => {
        if (ready && authenticated) {
            // Add a small delay so WalletSync can hit the /api/user endpoint first before we jump
            setTimeout(() => {
                router.push('/dashboard');
            }, 1000);
        }
    }, [ready, authenticated, router]);

    return (
        <button
            onClick={login}
            disabled={!ready || authenticated}
            className={`bg-blue-600 hover:bg-blue-500 text-white font-black italic text-xl px-12 py-4 rounded-full transition-all hover:scale-105 shadow-[0_0_20px_rgba(37,99,235,0.5)] border-2 border-blue-400 ${!ready ? 'opacity-50 cursor-not-allowed' : ''
                }`}
        >
            Play Free Now
        </button>
    );
}
