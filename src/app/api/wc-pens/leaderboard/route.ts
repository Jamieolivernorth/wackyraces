import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

function getCompetitionWeekId() {
    const now = new Date();
    const cutoffDay = 6; // Saturday
    const cutoffHour = 15; // 15:00 UTC
    
    const startOfPeriod = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), cutoffHour, 0, 0, 0));
    const day = now.getUTCDay();
    const hour = now.getUTCHours();
    
    if (day < cutoffDay || (day === cutoffDay && hour < cutoffHour)) {
        startOfPeriod.setUTCDate(startOfPeriod.getUTCDate() - (day + 1)); 
    } else {
        startOfPeriod.setUTCDate(startOfPeriod.getUTCDate() - (day - cutoffDay));
    }
    
    return `WEEK_${startOfPeriod.getUTCFullYear()}_${startOfPeriod.getUTCMonth() + 1}_${startOfPeriod.getUTCDate()}`;
}

function getNextCutoff() {
    const now = new Date();
    const cutoffDay = 6; // Saturday
    const cutoffHour = 15; // 15:00 UTC
    
    const nextCutoff = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), cutoffHour, 0, 0, 0));
    const day = now.getUTCDay();
    const hour = now.getUTCHours();
    
    if (day > cutoffDay || (day === cutoffDay && hour >= cutoffHour)) {
        nextCutoff.setUTCDate(nextCutoff.getUTCDate() + (7 - (day - cutoffDay)));
    } else {
        nextCutoff.setUTCDate(nextCutoff.getUTCDate() + (cutoffDay - day));
    }
    
    return nextCutoff;
}

function getPreviousWeekId() {
    const cutoff = getNextCutoff();
    const prevCutoff = new Date(cutoff.getTime() - 7 * 24 * 60 * 60 * 1000);
    return `WEEK_${prevCutoff.getUTCFullYear()}_${prevCutoff.getUTCMonth() + 1}_${prevCutoff.getUTCDate()}`;
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const wallet = searchParams.get('wallet');
        
        const period = getCompetitionWeekId();
        const prevPeriod = getPreviousWeekId();
        const nextCutoff = getNextCutoff();
        
        // Fetch top 100 current
        const leaderboard = await sql`
            SELECT user_id, score 
            FROM wc_pens_leaderboard 
            WHERE period = ${period} 
            ORDER BY score DESC 
            LIMIT 100
        `;

        let isInvited = false;
        if (wallet) {
            const check = await sql`
                SELECT id FROM wc_pens_leaderboard 
                WHERE user_id = ${wallet} AND period = ${prevPeriod} 
                ORDER BY score DESC LIMIT 100
            `;
            // Check if user's actual rank was in top 100
            // Simplified: if they are in the list of top 100 for that period.
            const top100Prev = await sql`
                SELECT user_id FROM wc_pens_leaderboard 
                WHERE period = ${prevPeriod} 
                ORDER BY score DESC LIMIT 100
            `;
            isInvited = top100Prev.some(r => r.user_id === wallet);
        }

        return NextResponse.json({
            success: true,
            period,
            nextCutoff: nextCutoff.toISOString(),
            leaderboard,
            isInvited,
            currentTime: new Date().toISOString()
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
