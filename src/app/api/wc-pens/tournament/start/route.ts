import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { roomId, wallet } = await req.json();

        if (!roomId || !wallet) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // Only the host (first participant) can start the selection timer? 
        // Or just anyone once ready? Let's say any participant can trigger it once everyone is in.
        const room = (await sql`SELECT * FROM penalty_rooms WHERE id = ${roomId}`)[0];
        if (!room) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });
        if (room.status !== 'LOBBY') return NextResponse.json({ success: false, error: 'Tournament already started' }, { status: 400 });

        const deadline = new Date(Date.now() + 10000); // 10 seconds from now
        await sql`UPDATE penalty_rooms SET status = 'SELECTING', selection_deadline = ${deadline} WHERE id = ${roomId}`;

        return NextResponse.json({ success: true, selectionDeadline: deadline.toISOString() });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
