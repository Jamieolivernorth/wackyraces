import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { wallet, amount } = body;

        if (!wallet || !amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Conversion Rate: $100 real money = 25,000 Wacky Coins -> multiplier is 250.
        const coinsToCredit = amount * 250;

        const updateResult = await sql`UPDATE users SET balance = balance + ${amount}, wc_balance = wc_balance + ${coinsToCredit} WHERE wallet_address = ${wallet}`;

        if (updateResult.count === 0) {
            // User doesn't exist yet, insert them
            await sql`INSERT INTO users (wallet_address, balance, wc_balance) VALUES (${wallet}, ${amount}, ${10000 + coinsToCredit})`;
        }

        const users = await sql`SELECT balance, wc_balance FROM users WHERE wallet_address = ${wallet}`;
        const user = users[0] as { balance: number, wc_balance: number };

        return NextResponse.json({ success: true, newBalance: user.balance, newWcBalance: user.wc_balance, depositedCash: amount, coinsCredited: coinsToCredit });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
