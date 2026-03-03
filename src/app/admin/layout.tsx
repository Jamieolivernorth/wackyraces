'use client';

import { useState, useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const authed = sessionStorage.getItem('admin_authenticated');
        if (authed === 'true') {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        // Uses simple secret for backoffice operations
        if (password === 'wackyadmin2024') {
            sessionStorage.setItem('admin_authenticated', 'true');
            setIsAuthenticated(true);
            setError('');
        } else {
            setError('Invalid password');
        }
    };

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center font-sans text-white">
                <div className="w-full max-w-sm bg-[#111] border border-gray-800 rounded-2xl p-8 shadow-2xl">
                    <div className="flex justify-center mb-6">
                        <img src="/logo-white.png" alt="Wacky Races Logo" className="h-8 w-auto opacity-80" />
                    </div>
                    <form onSubmit={handleLogin} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                            <label className="text-sm font-bold text-gray-400">Admin Authorization</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="bg-black border border-gray-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-red-500 transition-colors"
                                placeholder="Enter password"
                                autoFocus
                            />
                        </div>
                        {error && <p className="text-red-500 text-xs font-bold font-mono">{error}</p>}
                        <button
                            type="submit"
                            className="w-full bg-red-600 hover:bg-red-500 text-white font-black italic rounded-xl py-3 mt-2 shadow-[0_0_15px_rgba(220,38,38,0.4)] transition-colors"
                        >
                            LOGIN
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
