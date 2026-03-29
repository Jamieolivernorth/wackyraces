import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { wallet, pointsChange, isGoal } = body;

        if (!wallet) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

        if (pointsChange !== 0) {
            await sql`UPDATE users SET wc_balance = COALESCE(wc_balance, 0) + ${pointsChange} WHERE wallet_address = ${wallet}`;
        }

        const users = await sql`SELECT wc_balance FROM users WHERE wallet_address = ${wallet}`;
        
        return NextResponse.json({ success: true, wcBalance: users[0]?.wc_balance || 0 });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
