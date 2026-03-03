import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        const [race] = await sql`
      SELECT status, host_wallet FROM private_races WHERE id = ${id}
    `;

        if (!race) {
            return NextResponse.json({ error: 'Race not found' }, { status: 404 });
        }

        if (race.status !== 'LOBBY') {
            return NextResponse.json({ error: 'Race has already started or finished' }, { status: 400 });
        }

        const participants = await sql`
      SELECT count(*) as count FROM private_race_participants WHERE race_id = ${id}
    `;
        const count = parseInt(participants[0].count, 10);

        // Minimum requirement of 6 players
        if (count < 6) {
            return NextResponse.json({ error: `Not enough players. Minimum 6 required, currently ${count}.` }, { status: 400 });
        }

        // Start countdown (set start time 30 seconds from now)
        const startTime = new Date(Date.now() + 30000);

        await sql`
      UPDATE private_races 
      SET status = 'COUNTDOWN', start_time = ${startTime}
      WHERE id = ${id}
    `;

        return NextResponse.json({ success: true, startTime });
    } catch (error) {
        console.error('Failed to start private race:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
