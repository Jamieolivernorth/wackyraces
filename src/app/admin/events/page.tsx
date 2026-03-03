import React from 'react';
import { Database, PlusCircle, Activity } from 'lucide-react';
import Link from 'next/link';
import { LiveMatchManager } from '@/components/admin/LiveMatchManager';

export default async function AdminEvents() {

    return (
        <div className="min-h-screen bg-black text-white font-sans selection:bg-blue-500/30">
            <header className="border-b border-gray-800 bg-gray-900/50">
                <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Database className="w-8 h-8 text-blue-500" />
                        <h1 className="text-3xl font-black italic tracking-tighter">
                            WACKY RACES <span className="text-blue-500 text-sm font-bold uppercase tracking-widest ml-2">Backoffice</span>
                        </h1>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/admin" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
                            Dashboard
                        </Link>
                        <span className="text-gray-800">|</span>
                        <Link href="/admin/events" className="text-sm font-bold text-white transition-colors relative after:absolute after:bottom-[-26px] after:left-0 after:w-full after:h-0.5 after:bg-blue-500">
                            Custom Events
                        </Link>
                        <span className="text-gray-800">|</span>
                        <Link href="/" className="text-sm font-bold text-gray-400 hover:text-white transition-colors">
                            Platform &rarr;
                        </Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="flex justify-between items-end mb-8 border-b border-gray-800 pb-4">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-wider flex items-center gap-2">
                            <Activity className="w-6 h-6 text-green-500" />
                            Live Matches & Events
                        </h2>
                        <p className="text-gray-400 text-sm mt-1">
                            Configure custom Football matches or generic manual-entry sporting events.
                        </p>
                    </div>
                    <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 font-bold rounded flex items-center gap-2 transition-colors">
                        <PlusCircle className="w-4 h-4" />
                        Create Match Event
                    </button>
                </div>

                <LiveMatchManager />
            </main>
        </div>
    );
}
