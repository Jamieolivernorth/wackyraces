import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db'; // Ensure alias or relative path works. We will use relative path.

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const wallet = searchParams.get('wallet');
    const ref = searchParams.get('ref');

    if (!wallet) {
        return NextResponse.json({ error: 'Wallet address required' }, { status: 400 });
    }

    try {
        const stmt = db.prepare('SELECT * FROM users WHERE wallet_address = ?');
        let user: any = stmt.get(wallet);

        if (!user) {
            // Create the user
            let referredBy = null;
            if (ref && ref !== wallet) {
                // Check if referrer exists
                const refUser = db.prepare('SELECT wallet_address FROM users WHERE wallet_address = ?').get(ref);
                if (refUser) {
                    referredBy = ref;
                }
            }

            const insert = db.prepare('INSERT INTO users (wallet_address, referred_by) VALUES (?, ?)');
            insert.run(wallet, referredBy);

            user = db.prepare('SELECT * FROM users WHERE wallet_address = ?').get(wallet);
        }

        return NextResponse.json(user);
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
