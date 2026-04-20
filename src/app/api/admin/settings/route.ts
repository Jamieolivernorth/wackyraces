import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
    try {
        const statsArray = await sql`SELECT current_rake, referral_fee, onchain_enabled, notification_email, notification_frequency FROM platform_stats WHERE id = 1`;
        const stats = statsArray[0] as { 
            current_rake: number, 
            referral_fee: number, 
            onchain_enabled: boolean,
            notification_email: string | null,
            notification_frequency: string
        };
        return NextResponse.json({ ...stats });
    } catch (err) {
        console.error("Settings GET Error:", err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { current_rake, referral_fee, onchain_enabled, notification_email, notification_frequency } = body;

        if (typeof current_rake !== 'number' || typeof referral_fee !== 'number') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        const onchain = onchain_enabled === true;

        await sql`
            UPDATE platform_stats 
            SET current_rake = ${current_rake}, 
                referral_fee = ${referral_fee}, 
                onchain_enabled = ${onchain},
                notification_email = ${notification_email || null},
                notification_frequency = ${notification_frequency || 'OFF'}
            WHERE id = 1
        `;

        return NextResponse.json({ 
            success: true, 
            current_rake, 
            referral_fee, 
            onchain_enabled: onchain,
            notification_email,
            notification_frequency
        });
    } catch (err) {
        console.error("Settings POST Error Detailed:", err);
        return NextResponse.json({ error: 'Server error', details: err instanceof Error ? err.message : String(err) }, { status: 500 });
    }
}
