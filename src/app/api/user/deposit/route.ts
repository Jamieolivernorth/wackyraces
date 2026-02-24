import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { wallet, amount } = body;

        if (!wallet || !amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const update = db.prepare('UPDATE users SET balance = balance + ? WHERE wallet_address = ?');
        const info = update.run(amount, wallet);

        if (info.changes === 0) {
            // User doesn't exist yet, insert them
            const insert = db.prepare('INSERT INTO users (wallet_address, balance) VALUES (?, ?)');
            insert.run(wallet, 1000 + amount); // 1000 initial + deposit
        }

        const user = db.prepare('SELECT balance FROM users WHERE wallet_address = ?').get(wallet) as { balance: number };

        return NextResponse.json({ success: true, newBalance: user.balance });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
