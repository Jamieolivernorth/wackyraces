import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { wallet, amount } = body;

        if (!wallet || !amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const updateResult = await sql`UPDATE users SET balance = balance + ${amount} WHERE wallet_address = ${wallet}`;

        if (updateResult.count === 0) {
            // User doesn't exist yet, insert them
            await sql`INSERT INTO users (wallet_address, balance) VALUES (${wallet}, ${1000 + amount})`;
        }

        const users = await sql`SELECT balance FROM users WHERE wallet_address = ${wallet}`;
        const user = users[0] as { balance: number };

        return NextResponse.json({ success: true, newBalance: user.balance });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
