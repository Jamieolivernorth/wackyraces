'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Loader2 } from 'lucide-react';

export const SettingsManager = () => {
    const [rake, setRake] = useState('0.10');
    const [referral, setReferral] = useState('0.02');
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(data => {
                if (data.current_rake !== undefined) setRake(data.current_rake.toString());
                if (data.referral_fee !== undefined) setReferral(data.referral_fee.toString());
            })
            .catch(console.error)
            .finally(() => setFetching(false));
    }, []);

    const handleSave = async () => {
        const parsedRake = parseFloat(rake);
        const parsedRef = parseFloat(referral);

        if (isNaN(parsedRake) || isNaN(parsedRef) || parsedRake < 0 || parsedRef < 0 || parsedRake + parsedRef > 1) {
            alert("Invalid percentages. Must be decimals between 0 and 1, and their sum cannot exceed 1.0");
            return;
        }

        setLoading(true);
        try {
            await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ current_rake: parsedRake, referral_fee: parsedRef })
            });
            alert('Settings saved successfully!');
        } catch (e) {
            console.error(e);
            alert('Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    if (fetching) return <div className="p-6 text-gray-500 animate-pulse">Loading settings...</div>;

    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl relative overflow-hidden mt-6">
            <div className="flex items-center gap-3 mb-6 border-b border-gray-800 pb-4">
                <Settings className="w-6 h-6 text-gray-400" />
                <h3 className="text-xl font-bold text-gray-200">Platform Settings</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">House Rake (Decimal)</label>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={rake}
                            onChange={(e) => setRake(e.target.value)}
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-mono"
                        />
                        <span className="absolute right-4 top-3 text-gray-500">{(parseFloat(rake || '0') * 100).toFixed(1)}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Deducted from the total betting pool on every race.</p>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Referral Fee (Decimal)</label>
                    <div className="relative">
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="1"
                            value={referral}
                            onChange={(e) => setReferral(e.target.value)}
                            className="w-full bg-black border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500 font-mono"
                        />
                        <span className="absolute right-4 top-3 text-gray-500">{(parseFloat(referral || '0') * 100).toFixed(1)}%</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Paid to referrers out of the House Rake allocation.</p>
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
            >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Settings
            </button>
        </div>
    );
};
