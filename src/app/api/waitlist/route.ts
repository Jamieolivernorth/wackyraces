import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import crypto from 'crypto';
import { EmailService } from '@/lib/email';

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

        // 1. Return the tracking ref so the frontend can build the share URL
        const response = NextResponse.json({ success: true, trackingRef });

        // 2. Trigger Notification (Async fire-and-forget)
        try {
            const statsArr = await sql`SELECT notification_email, notification_frequency FROM platform_stats WHERE id = 1`;
            const stats = statsArr[0];
            
            if (stats && stats.notification_email && stats.notification_frequency === 'INSTANT') {
                EmailService.notifyNewSignup(stats.notification_email, {
                    email,
                    type: 'WAITLIST',
                    wallet: wallet || undefined
                }).catch(e => console.error("[NOTIF ERROR] Failed to send instant email:", e));
            }
        } catch (e) {
            console.error("[NOTIF ERROR] Failed to fetch settings for email:", e);
        }

        return response;

    } catch (e: any) {
        console.error("Waitlist API Error:", e);
        return NextResponse.json({ error: 'Internal server error while joining waitlist.' }, { status: 500 });
    }
}
