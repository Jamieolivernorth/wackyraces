import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, twitter, instagram, wallet } = body;

        if (!email || typeof email !== 'string' || !email.includes('@')) {
            return NextResponse.json({ error: 'Valid email address is required.' }, { status: 400 });
        }

        // Check if email already exists
        const existing = await sql`SELECT id FROM waitlist_users WHERE email = ${email}`;

        if (existing.length > 0) {
            return NextResponse.json({ error: 'This email is already on the waitlist.' }, { status: 409 });
        }

        // If no wallet provided, generate a pseudorandom generic ref code for tracking
        const trackingRef = wallet || `WR-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        await sql`
            INSERT INTO waitlist_users (email, twitter_handle, instagram_handle, wallet_address)
            VALUES (${email}, ${twitter || null}, ${instagram || null}, ${trackingRef})
        `;

        // Return the tracking ref so the frontend can build the share URL
        return NextResponse.json({ success: true, trackingRef });

    } catch (e: any) {
        console.error("Waitlist API Error:", e);
        return NextResponse.json({ error: 'Internal server error while joining waitlist.' }, { status: 500 });
    }
}
