import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

const TEAMS = [
    "ARGENTINA", "BRAZIL", "FRANCE", "GERMANY", "SPAIN", 
    "ITALY", "ENGLAND", "PORTUGAL", "NETHERLANDS", "BELGIUM",
    "URUGUAY", "CROATIA", "MOROCCO", "JAPAN", "SENEGAL",
    "MEXICO", "USA", "CANADA", "SOUTH KOREA", "SWITZERLAND"
];

export async function POST(req: NextRequest) {
    try {
        const { roomId } = await req.json();

        if (!roomId) return NextResponse.json({ success: false, error: 'Missing roomId' }, { status: 400 });

        const room = (await sql`SELECT * FROM penalty_rooms WHERE id = ${roomId}`)[0];
        if (!room) return NextResponse.json({ success: false, error: 'Room not found' }, { status: 404 });

        // Generate Draw
        const participants = await sql`SELECT wallet_address, team_id, team_name FROM penalty_room_participants WHERE room_id = ${roomId}`;
        
        // Assign random teams to those who haven't picked
        const takenTeams = participants.filter(p => p.team_id).map(p => p.team_id);
        const availableTeams = TEAMS.filter(t => !takenTeams.includes(t));

        for (const p of participants) {
            if (!p.team_id) {
                const randomTeam = availableTeams.pop() || "UNKNOWN";
                await sql`UPDATE penalty_room_participants SET team_id = ${randomTeam}, team_name = ${randomTeam} WHERE room_id = ${roomId} AND wallet_address = ${p.wallet_address}`;
            }
        }

        // Shuffle participants for the draw
        const shuffled = participants.sort(() => Math.random() - 0.5);
        
        // Create initial brackets (matches of 2)
        for (let i = 0; i < shuffled.length; i += 2) {
            const p1 = shuffled[i].wallet_address;
            const p2 = shuffled[i+1]?.wallet_address || 'COMPUTER';
            
            await sql`
                INSERT INTO penalty_tournament_brackets (room_id, round, p1_wallet, p2_wallet)
                VALUES (${roomId}, 1, ${p1}, ${p2})
            `;
        }

        await sql`UPDATE penalty_rooms SET status = 'DRAWN' WHERE id = ${roomId}`;

        return NextResponse.json({ success: true });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
