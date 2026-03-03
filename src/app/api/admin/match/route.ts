import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { mode, contenders } = body;

        // Verify valid payload
        if (!mode || !contenders || !Array.isArray(contenders) || contenders.length !== 6) {
            return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
        }

        // We will store active live matches in a `live_matches` table in Postgres
        // For now, check if the table exists, and override if there is an active match
        await sql`
            CREATE TABLE IF NOT EXISTS live_matches (
                id SERIAL PRIMARY KEY,
                mode VARCHAR(20) NOT NULL,
                contenders JSONB NOT NULL,
                phase VARCHAR(20) DEFAULT 'WAITING',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `;

        // Archive any previous matches
        await sql`UPDATE live_matches SET phase = 'ARCHIVED' WHERE phase != 'ARCHIVED'`;

        // Insert new match
        const result = await sql`
            INSERT INTO live_matches (mode, contenders, phase)
            VALUES (${mode}, ${JSON.stringify(contenders)}, 'BETTING')
            RETURNING id
        `;

        return NextResponse.json({ success: true, matchId: result[0].id });
    } catch (e) {
        console.error("Failed to start match", e);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
