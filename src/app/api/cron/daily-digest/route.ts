import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { EmailService } from '@/lib/email';

export const dynamic = 'force-dynamic';

/**
 * Cron job to send a daily digest of new sign-ups.
 * Should be triggered once every 24 hours.
 */
export async function GET(req: NextRequest) {
    // Optional: Add simple secret check if triggered from external cron service
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Fetch settings
        const statsArr = await sql`SELECT notification_email, notification_frequency FROM platform_stats WHERE id = 1`;
        const stats = statsArr[0];

        if (!stats || !stats.notification_email || stats.notification_frequency !== 'DAILY') {
            return NextResponse.json({ message: 'Daily digest not enabled or no recipient set.' });
        }

        const recipient = stats.notification_email;

        // 2. Fetch new sign-ups from the last 24 hours
        // We look at both waitlist_users and users tables
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        const waitlistNew = await sql`
            SELECT email, 'WAITLIST' as type, created_at 
            FROM waitlist_users 
            WHERE created_at >= ${twentyFourHoursAgo}
        `;

        const usersNew = await sql`
            SELECT email, 'USER' as type, created_at 
            FROM users 
            WHERE created_at >= ${twentyFourHoursAgo}
        `;

        const allNew = [...waitlistNew, ...usersNew].sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        if (allNew.length === 0) {
            return NextResponse.json({ message: 'No new sign-ups in the last 24 hours. Digest skipped.' });
        }

        // 3. Send Email
        const result = await EmailService.sendDailyDigest(recipient, allNew);

        if (result.success) {
            return NextResponse.json({ success: true, count: allNew.length });
        } else {
            return NextResponse.json({ error: result.error }, { status: 500 });
        }

    } catch (err) {
        console.error("[CRON ERROR] Daily Digest failed:", err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
