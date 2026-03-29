import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function POST(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');
        const roomIdParam = searchParams.get('roomId');

        if (action === 'START' && roomIdParam) {
            const participants = await sql`SELECT wallet_address, team_id FROM penalty_room_participants WHERE room_id = ${roomIdParam}`;
            
            let p1 = participants[0]?.wallet_address;
            let p1_team = participants[0]?.team_id;
            let p2 = participants[1]?.wallet_address || 'COMPUTER';
            let p2_team = participants[1]?.team_id || (participants[0]?.team_id === 'england' ? 'brazil' : 'england');
            let isAi = participants.length < 2;

            const [match] = await sql`
                INSERT INTO penalty_matches (room_id, player1_wallet, player2_wallet, p1_team_id, p2_team_id, is_ai)
                VALUES (${roomIdParam}, ${p1}, ${p2}, ${p1_team}, ${p2_team}, ${isAi})
                RETURNING id
            `;

            await sql`UPDATE penalty_rooms SET status = 'PLAYING' WHERE id = ${roomIdParam}`;
            return NextResponse.json({ success: true, matchId: match.id });
        }

        const body = await req.json();
        const { wallet, tier, type, maxPlayers, teamId, teamName, email, inviteCode } = body;

        if (!wallet) {
            return NextResponse.json({ success: false, error: 'Missing wallet' }, { status: 400 });
        }

        let entryFee = tier !== undefined ? parseInt(tier) : 0;
        let roomId: number;
        let finalInviteCode = inviteCode;

        // 1. If joining via invite, get the fee from the room
        if (inviteCode) {
            const rooms = await sql`SELECT id, entry_fee, max_players, participant_count FROM penalty_rooms WHERE invite_code = ${inviteCode} AND status = 'LOBBY'`;
            if (rooms.length === 0) return NextResponse.json({ success: false, error: 'Tournament not found or already started' }, { status: 404 });
            
            roomId = rooms[0].id;
            entryFee = rooms[0].entry_fee;

            if (rooms[0].participant_count >= rooms[0].max_players) {
                return NextResponse.json({ success: false, error: 'Tournament is full' }, { status: 400 });
            }
        }

        // 2. Check user balance if fee > 0
        if (entryFee > 0) {
            const users = await sql`SELECT balance FROM users WHERE wallet_address = ${wallet}`;
            if (users.length === 0 || users[0].balance < entryFee) {
                return NextResponse.json({ success: false, error: 'Insufficient balance' }, { status: 403 });
            }
        }

        if (type === 'TOURNAMENT' && !inviteCode) {
            // Create a new private tournament
            finalInviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            const [newRoom] = await sql`
                INSERT INTO penalty_rooms (entry_fee, type, max_players, invite_code, status, participant_count) 
                VALUES (${entryFee}, 'TOURNAMENT', ${maxPlayers || 8}, ${finalInviteCode}, 'LOBBY', 1)
                RETURNING id
            `;
            roomId = newRoom.id;
            await sql`
                INSERT INTO penalty_room_participants (room_id, wallet_address, team_id, team_name, email) 
                VALUES (${roomId}, ${wallet}, ${teamId || null}, ${teamName || null}, ${email || null})
            `;
        } else if (inviteCode) {
            // Already found roomId above
            await sql`
                INSERT INTO penalty_room_participants (room_id, wallet_address, team_id, team_name, email) 
                VALUES (${roomId}, ${wallet}, ${teamId || null}, ${teamName || null}, ${email || null})
                ON CONFLICT (room_id, wallet_address) DO UPDATE SET team_id = ${teamId || null}, team_name = ${teamName || null}, email = ${email || null}
            `;
            await sql`UPDATE penalty_rooms SET participant_count = (SELECT COUNT(*) FROM penalty_room_participants WHERE room_id = ${roomId}) WHERE id = ${roomId}`;
        } else {
            // Standard PvP Matchmaking
            const rooms = await sql`
                SELECT id FROM penalty_rooms 
                WHERE entry_fee = ${entryFee} AND type = 'PVP' AND status = 'OPEN' 
                LIMIT 1
            `;
            
            if (rooms.length > 0) {
                roomId = rooms[0].id;
                await sql`
                    INSERT INTO penalty_room_participants (room_id, wallet_address, team_id, team_name) 
                    VALUES (${roomId}, ${wallet}, ${teamId}, ${teamName})
                    ON CONFLICT (room_id, wallet_address) DO UPDATE SET team_id = ${teamId}, team_name = ${teamName}
                `;
                await sql`UPDATE penalty_rooms SET participant_count = (SELECT COUNT(*) FROM penalty_room_participants WHERE room_id = ${roomId}), status = 'PLAYING' WHERE id = ${roomId}`;
            } else {
                const [newRoom] = await sql`
                    INSERT INTO penalty_rooms (entry_fee, type, status, participant_count) 
                    VALUES (${entryFee}, 'PVP', 'OPEN', 1)
                    RETURNING id
                `;
                roomId = newRoom.id;
                await sql`INSERT INTO penalty_room_participants (room_id, wallet_address, team_id, team_name) VALUES (${roomId}, ${wallet}, ${teamId}, ${teamName})`;
            }
        }

        // 3. Deduct balance if fee > 0
        if (entryFee > 0) {
            await sql`UPDATE users SET balance = balance - ${entryFee} WHERE wallet_address = ${wallet}`;
        }

        return NextResponse.json({
            success: true,
            roomId,
            inviteCode: finalInviteCode
        });

    } catch (e: any) {
        console.error('Lobby error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
        return NextResponse.json({ success: false, error: 'Missing roomId' }, { status: 400 });
    }

    try {
        const rooms = await sql`SELECT * FROM penalty_rooms WHERE id = ${roomId}`;
        const participants = await sql`SELECT wallet_address, team_id, team_name, email, selection_confirmed FROM penalty_room_participants WHERE room_id = ${roomId}`;
        const matches = await sql`SELECT id FROM penalty_matches WHERE room_id = ${roomId} ORDER BY created_at DESC LIMIT 1`;
        const brackets = await sql`SELECT * FROM penalty_tournament_brackets WHERE room_id = ${roomId} ORDER BY round ASC, id ASC`;

        return NextResponse.json({
            success: true,
            room: rooms[0],
            participants,
            takenTeams: participants.filter(p => p.team_id).map(p => p.team_id),
            matchId: matches[0]?.id,
            brackets
        });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
