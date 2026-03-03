import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { matchId, contenderId, increment } = body;

        if (!matchId || !contenderId || typeof increment !== 'number') {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // Fetch current match contenders
        const matchesArray = await sql`
            SELECT contenders FROM live_matches 
            WHERE id = ${matchId} AND phase = 'RACING'
        `;

        if (matchesArray.length === 0) {
            return NextResponse.json({ error: 'Live match not found or not in racing phase' }, { status: 404 });
        }

        // Technically parsing JSON directly on the client can overwrite states
        // In PostgreSQL using JSONB we can do a jsonb_set, but for a simple array update,
        // pulling it to the server, mutating, and writing back is safer for this scope.
        let contenders: any = matchesArray[0].contenders;

        let found = false;
        // Mutate the specific contender
        contenders = contenders.map((c: any) => {
            if (c.id === contenderId) {
                found = true;
                return { ...c, currentMetric: Math.max(0, c.currentMetric + increment) };
            }
            return c;
        });

        if (!found) {
            return NextResponse.json({ error: 'Contender not found in match' }, { status: 404 });
        }

        // Update DB
        await sql`
            UPDATE live_matches 
            SET contenders = ${JSON.stringify(contenders)}, updated_at = CURRENT_TIMESTAMP
            WHERE id = ${matchId}
        `;

        return NextResponse.json({ success: true });

    } catch (e) {
        console.error("Failed to update ticks", e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
