import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { wallet, amount, direction } = body;

        if (!wallet || !amount || amount <= 0 || !['TO_WC', 'TO_MAIN'].includes(direction)) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        let users = await sql`SELECT balance, wc_balance FROM users WHERE wallet_address = ${wallet}`;
        if (users.length === 0) {
            await sql`INSERT INTO users (wallet_address, balance, wc_balance) VALUES (${wallet}, 1000, 50) ON CONFLICT DO NOTHING`;
            users = await sql`SELECT balance, wc_balance FROM users WHERE wallet_address = ${wallet}`;
        }
        const user = users[0];

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (direction === 'TO_WC') {
            if (user.balance < amount) {
                return NextResponse.json({ error: 'Insufficient main balance' }, { status: 400 });
            }
            await sql`UPDATE users SET balance = balance - ${amount}, wc_balance = COALESCE(wc_balance, 0) + ${amount} WHERE wallet_address = ${wallet}`;
        } else {
            if ((user.wc_balance || 0) < amount) {
                return NextResponse.json({ error: 'Insufficient WC Points' }, { status: 400 });
            }
            await sql`UPDATE users SET wc_balance = wc_balance - ${amount}, balance = balance + ${amount} WHERE wallet_address = ${wallet}`;
        }

        const updatedUsers = await sql`SELECT balance, wc_balance FROM users WHERE wallet_address = ${wallet}`;
        
        return NextResponse.json({ success: true, balance: updatedUsers[0].balance, wcBalance: updatedUsers[0].wc_balance });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
