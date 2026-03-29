'use client'; // Error components must be Client Components

import { useEffect } from 'react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        // Log the error to an error reporting service
        console.error("GLOBAL APP ERROR:", error);
    }, [error]);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            <div className="bg-red-900/40 border-2 border-red-500 p-8 rounded-xl max-w-2xl w-full">
                <h2 className="text-2xl font-black text-red-500 mb-4">CRITICAL SYSTEM FAILURE</h2>
                <p className="mb-4 text-gray-300">The application encountered an unexpected runtime error.</p>

                <div className="bg-black/80 p-4 rounded text-left font-mono text-sm overflow-auto mb-6 text-red-400 border border-red-500/30">
                    <p className="font-bold text-white mb-2">{error.message || 'Unknown Error'}</p>
                    <pre className="whitespace-pre-wrap">{error.stack}</pre>
                </div>

                <button
                    className="bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-6 rounded transition-colors w-full"
                    onClick={() => {
                        // Attempt to recover by trying to re-render the segment
                        reset();
                    }}
                >
                    REBOOT TERMINAL
                </button>
            </div>
        </div>
    );
}
