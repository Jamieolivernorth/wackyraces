import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

interface PayoutPayload {
    winnerships: { wallet: string; amount: number }[];
    referrers: { wallet: string; amount: number }[];
    houseRake: number;
    poolVolume: number;
}

export async function POST(request: NextRequest) {
    try {
        const body: PayoutPayload = await request.json();
        const { winnerships, referrers, houseRake, poolVolume } = body;

        const transaction = db.transaction(() => {
            // 1. Pay winners
            const updateBalance = db.prepare('UPDATE users SET balance = balance + ? WHERE wallet_address = ?');
            for (const win of winnerships) {
                updateBalance.run(win.amount, win.wallet);
            }

            // 2. Pay referrers
            for (const ref of referrers) {
                updateBalance.run(ref.amount, ref.wallet);
            }

            // 3. Update Platform Stats (Volume & Rake)
            const updateStats = db.prepare('UPDATE platform_stats SET total_rake = total_rake + ?, total_volume = total_volume + ? WHERE id = 1');
            updateStats.run(houseRake, poolVolume);
        });

        transaction();

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Payout API Error:", err);
        return NextResponse.json({ error: 'Server error during payout processing' }, { status: 500 });
    }
}
