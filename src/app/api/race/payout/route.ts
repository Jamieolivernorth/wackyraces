import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

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

        // 1. Pay winners
        for (const win of winnerships) {
            await sql`UPDATE users SET balance = balance + ${win.amount} WHERE wallet_address = ${win.wallet}`;
        }

        // 2. Pay referrers
        for (const ref of referrers) {
            await sql`UPDATE users SET balance = balance + ${ref.amount} WHERE wallet_address = ${ref.wallet}`;
        }

        // 3. Update Platform Stats (Volume & Rake)
        await sql`UPDATE platform_stats SET total_rake = total_rake + ${houseRake}, total_volume = total_volume + ${poolVolume} WHERE id = 1`;

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Payout API Error:", err);
        return NextResponse.json({ error: 'Server error during payout processing' }, { status: 500 });
    }
}
