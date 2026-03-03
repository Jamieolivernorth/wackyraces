import { NextResponse } from 'next/server';
import sql from '@/lib/db';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
    try {
        const { hostWallet, mode = 'CRYPTO', entryFee = 10 } = await request.json();

        if (!hostWallet) {
            return NextResponse.json({ error: 'Host wallet is required' }, { status: 400 });
        }

        const raceId = randomUUID();

        await sql`
      INSERT INTO private_races (id, host_wallet, mode, entry_fee, status)
      VALUES (${raceId}, ${hostWallet}, ${mode}, ${entryFee}, 'LOBBY')
    `;

        // The host itself does not automatically join as a participant, 
        // we'll instruct the frontend to immediately call the join endpoint.

        return NextResponse.json({ success: true, raceId });
    } catch (error: any) {
        console.error('Failed to create private race:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
