import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { PrivyClient } from '@privy-io/server-auth';

// Initialize Privy client for server-side validation
const privy = new PrivyClient(
    process.env.NEXT_PUBLIC_PRIVY_APP_ID || '',
    process.env.PRIVY_APP_SECRET || ''
);

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
            console.log(`[AUTH DEBUG] Attempting to create new user for wallet: ${wallet}`);
            // Sybil Resistance: Require Auth Token to create a NEW user
            const authHeader = request.headers.get('authorization');
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                console.log(`[AUTH DEBUG] Missing or invalid authorization header`);
                return NextResponse.json({ error: 'Authentication required to register' }, { status: 401 });
            }

            const token = authHeader.split(' ')[1];
            let verifiedClaims;
            try {
                verifiedClaims = await privy.verifyAuthToken(token);
            } catch (error) {
                console.log(`[AUTH DEBUG] Invalid or expired auth token`);
                return NextResponse.json({ error: 'Invalid or expired authentication token' }, { status: 403 });
            }

            const privyUserId = verifiedClaims.userId;
            console.log(`[AUTH DEBUG] Verified token for Privy ID: ${privyUserId}`);

            // Sybil Resistance: Check if this Privy ID already has an account under a different wallet
            const existingPrivyUsers = await sql`SELECT wallet_address FROM users WHERE privy_id = ${privyUserId}`;
            if (existingPrivyUsers.length > 0) {
                console.log(`[AUTH DEBUG] Privy ID already linked to wallet: ${existingPrivyUsers[0].wallet_address}`);
                return NextResponse.json({ error: 'This Privy account is already linked to another wallet' }, { status: 403 });
            }

            // Fetch full user data from Privy to check for social/email links
            console.log(`[AUTH DEBUG] Fetching full Privy user data...`);
            const privyUser = await privy.getUser(privyUserId);
            console.log(`[AUTH DEBUG] Privy user data loaded: Email=${privyUser.email?.address || 'none'}, Google=${!!privyUser.google}, Twitter=${!!privyUser.twitter}`);

            // Allow if there is an email, google, twitter, or discord account linked
            const hasVerifiedIdentity = !!(
                privyUser.email ||
                privyUser.twitter ||
                privyUser.discord ||
                privyUser.google
            );

            if (!hasVerifiedIdentity) {
                console.log(`[AUTH DEBUG] Identity verification failed. No linked external accounts.`);
                return NextResponse.json({
                    error: 'Identity verification required. Please link an Email, Twitter, Discord, or Google account in your profile.'
                }, { status: 403 });
            }

            console.log(`[AUTH DEBUG] Inserting new user into DB...`);

            let referredBy = null;
            if (ref && ref !== wallet) {
                // Check if referrer exists
                const refUsers = await sql`SELECT wallet_address FROM users WHERE wallet_address = ${ref}`;
                if (refUsers.length > 0) {
                    referredBy = ref;
                }
            }

            const userEmail = privyUser.email?.address || null;
            await sql`INSERT INTO users (wallet_address, privy_id, email, referred_by) VALUES (${wallet}, ${privyUserId}, ${userEmail}, ${referredBy})`;

            if (referredBy) {
                // Viral Waitlist Loop: Reward the referrer with 100 free USDC for bringing a new user
                await sql`UPDATE users SET balance = balance + 100 WHERE wallet_address = ${referredBy}`;
            }

            users = await sql`SELECT * FROM users WHERE wallet_address = ${wallet}`;
            user = users[0];
        } else if (user && !user.email) {
            // Optional: Sync email for existing users if missing
            const authHeader = request.headers.get('authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                const token = authHeader.split(' ')[1];
                try {
                    const verifiedClaims = await privy.verifyAuthToken(token);
                    const privyUser = await privy.getUser(verifiedClaims.userId);
                    if (privyUser.email?.address) {
                        await sql`UPDATE users SET email = ${privyUser.email.address} WHERE wallet_address = ${wallet}`;
                        user.email = privyUser.email.address;
                    }
                } catch (e) {
                    console.error("[AUTH ERROR] Email sync failed:", e);
                }
            }
        }

        return NextResponse.json({ ...user });
    } catch (err) {
        console.error(`[AUTH ERROR] Database error:`, err);
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}
