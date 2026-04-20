import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { PrivyClient } from '@privy-io/server-auth';

const privy = new PrivyClient(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
    process.env.PRIVY_APP_SECRET || ''
);

export async function POST(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        const token = authHeader.split(' ')[1];
        let verifiedClaims;
        try {
            verifiedClaims = await privy.verifyAuthToken(token);
        } catch (error) {
            return NextResponse.json({ error: 'Invalid or expired authentication token' }, { status: 403 });
        }

        const body = await request.json();
        const { username, avatar_url, wallet_address } = body;

        if (!username || !wallet_address) {
            return NextResponse.json({ error: 'Username and wallet address are required' }, { status: 400 });
        }

        // Verify the user owns this wallet
        const users = await sql`SELECT privy_id FROM users WHERE wallet_address = ${wallet_address}`;
        if (users.length === 0 || users[0].privy_id !== verifiedClaims.userId) {
            return NextResponse.json({ error: 'Unauthorized profile update' }, { status: 403 });
        }

        // Check if username is already taken by someone else
        const existingUsername = await sql`SELECT wallet_address FROM users WHERE username = ${username} AND wallet_address != ${wallet_address}`;
        if (existingUsername.length > 0) {
            return NextResponse.json({ error: 'Username is already taken' }, { status: 409 });
        }

        // Update profile
        await sql`UPDATE users SET username = ${username}, avatar_url = ${avatar_url} WHERE wallet_address = ${wallet_address}`;

        return NextResponse.json({ success: true, username, avatar_url });
    } catch (err) {
        console.error(`[PROFILE ERROR] `, err);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
