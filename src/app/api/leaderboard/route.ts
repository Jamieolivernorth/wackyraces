import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const timeframe = searchParams.get('timeframe') || 'all-time'; // 'weekly', 'monthly', 'all-time'

    let intervalQuery = '';
    if (timeframe === 'weekly') {
        intervalQuery = "AND created_at >= NOW() - INTERVAL '7 days'";
    } else if (timeframe === 'monthly') {
        intervalQuery = "AND created_at >= NOW() - INTERVAL '30 days'";
    }

    try {
        // We use unsafe here to inject the interval conditionally. 
        // In a strictly typed ORM we'd use builders, but with postgres.js unsafe is fine for simple static string conditions 
        // as long as we don't pass user input directly into it.
        const query = `
            SELECT 
                wallet_address,
                COUNT(id) as total_races,
                SUM(CASE WHEN result = 'WIN' THEN 1 ELSE 0 END) as total_wins,
                SUM(amount_won) as total_profit
            FROM race_history
            WHERE 1=1 ${intervalQuery}
            GROUP BY wallet_address
            ORDER BY total_wins DESC, total_profit DESC
            LIMIT 100
        `;

        const stats = await sql.unsafe(query);

        return NextResponse.json({ stats, timeframe });
    } catch (err) {
        console.error("Leaderboard API Error:", err);
        return NextResponse.json({ error: 'Server error fetching leaderboard' }, { status: 500 });
    }
}
