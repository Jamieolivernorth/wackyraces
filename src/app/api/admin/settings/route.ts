import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
    try {
        const stats = db.prepare('SELECT current_rake, referral_fee FROM platform_stats WHERE id = 1').get() as { current_rake: number, referral_fee: number };
        return NextResponse.json(stats);
    } catch (err) {
        console.error("Settings GET Error:", err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { current_rake, referral_fee } = body;

        if (typeof current_rake !== 'number' || typeof referral_fee !== 'number') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const update = db.prepare('UPDATE platform_stats SET current_rake = ?, referral_fee = ? WHERE id = 1');
        update.run(current_rake, referral_fee);

        return NextResponse.json({ success: true, current_rake, referral_fee });
    } catch (err) {
        console.error("Settings POST Error:", err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
