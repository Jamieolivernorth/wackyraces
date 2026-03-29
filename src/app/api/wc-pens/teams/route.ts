import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';
import { TEAMS_DATA } from '@/lib/wcTeams';

const STRIKER_UPGRADE_COST = 500;

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const wallet = searchParams.get('wallet');

    if (!wallet) return NextResponse.json({ error: 'Wallet required' }, { status: 400 });

    try {
        const teams = await sql`SELECT * FROM wc_pens_teams WHERE user_id = ${wallet} ORDER BY team_id ASC`;
        return NextResponse.json({ teams });
    } catch (err) {
        return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { wallet, action, teamId } = body;

        if (!wallet || !action) return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });

        let users = await sql`SELECT wc_balance FROM users WHERE wallet_address = ${wallet}`;
        let user = users[0];
        
        // Auto-fund for testing
        if (!user) {
            await sql`INSERT INTO users (wallet_address, balance, wc_balance) VALUES (${wallet}, 50000, 50000) ON CONFLICT DO NOTHING`;
        } else if ((user.wc_balance || 0) < 50000) {
            await sql`UPDATE users SET wc_balance = 50000 WHERE wallet_address = ${wallet}`;
        }
        
        users = await sql`SELECT wc_balance FROM users WHERE wallet_address = ${wallet}`;
        user = users[0];

        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        let currentWcBalance = user.wc_balance || 0;

        if (action === 'BUY_TEAM') {
            const teamData = TEAMS_DATA.find(t => t.id === teamId);
            if (!teamData) return NextResponse.json({ error: 'Team not found' }, { status: 404 });
            const cost = teamData.cost;
            if (currentWcBalance < cost) return NextResponse.json({ error: 'Insufficient WC Points' }, { status: 400 });

            // Ensure not already owned
            const existing = await sql`SELECT * FROM wc_pens_teams WHERE user_id = ${wallet} AND team_id = ${teamId}`;
            if (existing.length > 0) return NextResponse.json({ error: 'Team already owned' }, { status: 400 });

            await sql`UPDATE users SET wc_balance = wc_balance - ${cost} WHERE wallet_address = ${wallet}`;
            await sql`INSERT INTO wc_pens_teams (user_id, team_id, striker_level) VALUES (${wallet}, ${teamId}, 1)`;
            currentWcBalance -= cost;
        } else if (action === 'UPGRADE_STRIKER') {
            if (currentWcBalance < STRIKER_UPGRADE_COST) return NextResponse.json({ error: 'Insufficient WC Points' }, { status: 400 });

            const teams = await sql`SELECT * FROM wc_pens_teams WHERE user_id = ${wallet} AND team_id = ${teamId}`;
            if (teams.length === 0) return NextResponse.json({ error: 'Team not owned' }, { status: 400 });

            await sql`UPDATE users SET wc_balance = wc_balance - ${STRIKER_UPGRADE_COST} WHERE wallet_address = ${wallet}`;
            await sql`UPDATE wc_pens_teams SET striker_level = striker_level + 1 WHERE user_id = ${wallet} AND team_id = ${teamId}`;
            currentWcBalance -= STRIKER_UPGRADE_COST;
        } else {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const newTeams = await sql`SELECT * FROM wc_pens_teams WHERE user_id = ${wallet} ORDER BY team_id ASC`;
        return NextResponse.json({ success: true, wcBalance: currentWcBalance, teams: newTeams });

    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
