import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const wallet = searchParams.get('wallet');
    const ref = searchParams.get('ref');

    if (!wallet) {
        return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    try {
        let users = await sql`SELECT * FROM users WHERE wallet_address = ${wallet}`;
        let user = users[0];

        if (!user) {
            // Create the user
            let referredBy = null;
            if (ref && ref !== wallet) {
                // Check if referrer exists
                const refUsers = await sql`SELECT wallet_address FROM users WHERE wallet_address = ${ref}`;
                if (refUsers.length > 0) {
                    referredBy = ref;
                }
            }

            await sql`INSERT INTO users (wallet_address, referred_by) VALUES (${wallet}, ${referredBy})`;

            if (referredBy) {
                // Viral Waitlist Loop: Reward the referrer with 100 free USDC for bringing a new user
                await sql`UPDATE users SET balance = balance + 100 WHERE wallet_address = ${referredBy}`;
            }

            users = await sql`SELECT * FROM users WHERE wallet_address = ${wallet}`;
            user = users[0];
        }

        return NextResponse.json(user);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
