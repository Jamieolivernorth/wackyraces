import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { wallet, amount } = body;

        if (!wallet || !amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const user = db.prepare('SELECT balance FROM users WHERE wallet_address = ?').get(wallet) as { balance: number } | undefined;

        if (!user || user.balance < amount) {
            return NextResponse.json({ error: 'Insufficient ledger balance' }, { status: 400 });
        }

        const update = db.prepare('UPDATE users SET balance = balance - ? WHERE wallet_address = ?');
        update.run(amount, wallet);

        return NextResponse.json({ success: true, newBalance: user.balance - amount });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
