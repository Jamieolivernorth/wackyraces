import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;

        const races = await sql`
      SELECT id, host_wallet, mode, entry_fee, status, start_time 
      FROM private_races 
      WHERE id = ${id}
    `;

        if (races.length === 0) {
            return NextResponse.json({ error: 'Race not found' }, { status: 404 });
        }

        const participants = await sql`
      SELECT wallet_address, selected_token, joined_at
      FROM private_race_participants
      WHERE race_id = ${id}
      ORDER BY joined_at ASC
    `;

        return NextResponse.json({
            race: races[0],
            participants
        });
    } catch (error) {
        console.error('Failed to get private race:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await context.params;
        const { walletAddress, selectedToken } = await request.json();

        if (!walletAddress || !selectedToken) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Check race status
        const races = await sql`SELECT status, entry_fee FROM private_races WHERE id = ${id}`;
        if (races.length === 0) {
            return NextResponse.json({ error: 'Race not found' }, { status: 404 });
        }

        if (races[0].status !== 'LOBBY') {
            return NextResponse.json({ error: 'Race already started' }, { status: 400 });
        }

        const entryFee = races[0].entry_fee;

        // Check if user already joined
        const existing = await sql`SELECT selected_token FROM private_race_participants WHERE race_id = ${id} AND wallet_address = ${walletAddress}`;

        if (existing.length === 0) {
            // First time joining, deduct balance
            const users = await sql`SELECT balance FROM users WHERE wallet_address = ${walletAddress}`;
            if (users.length === 0 || users[0].balance < entryFee) {
                return NextResponse.json({ error: 'Insufficient funds' }, { status: 400 });
            }

            await sql`UPDATE users SET balance = balance - ${entryFee} WHERE wallet_address = ${walletAddress}`;
        }

        // Attempt to insert participant
        await sql`
      INSERT INTO private_race_participants (race_id, wallet_address, selected_token)
      VALUES (${id}, ${walletAddress}, ${selectedToken})
      ON CONFLICT (race_id, wallet_address) 
      DO UPDATE SET selected_token = EXCLUDED.selected_token
    `;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Failed to join private race:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
