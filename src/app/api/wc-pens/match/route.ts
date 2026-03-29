import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

function getCompetitionWeekId() {
    const now = new Date();
    const cutoffDay = 6; // Saturday
    const cutoffHour = 15; // 15:00 UTC
    
    const startOfPeriod = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), cutoffHour, 0, 0, 0));
    const day = now.getUTCDay();
    const hour = now.getUTCHours();
    
    if (day < cutoffDay || (day === cutoffDay && hour < cutoffHour)) {
        startOfPeriod.setUTCDate(startOfPeriod.getUTCDate() - (day + 1)); 
    } else {
        startOfPeriod.setUTCDate(startOfPeriod.getUTCDate() - (day - cutoffDay));
    }
    
    return `WEEK_${startOfPeriod.getUTCFullYear()}_${startOfPeriod.getUTCMonth() + 1}_${startOfPeriod.getUTCDate()}`;
}

function calculatePoints(isGoal: boolean, isMultiplier: boolean, role: string) {
    if (role === 'SHOOTER') {
        return isGoal ? 100 * (isMultiplier ? 3 : 1) : 0;
    } else {
        return !isGoal ? 200 * (isMultiplier ? 10 : 1) : 0;
    }
}

async function updateLeaderboard(wallet: string, points: number) {
    if (wallet === 'COMPUTER' || points <= 0) return;
    const period = getCompetitionWeekId();
    
    const existing = await sql`SELECT id, score FROM wc_pens_leaderboard WHERE user_id = ${wallet} AND period = ${period}`;
    if (existing.length > 0) {
        await sql`UPDATE wc_pens_leaderboard SET score = score + ${points} WHERE id = ${existing[0].id}`;
    } else {
        await sql`INSERT INTO wc_pens_leaderboard (user_id, score, period) VALUES (${wallet}, ${points}, ${period})`;
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { matchId, wallet, zone, role, useMultiplier } = body;

        if (!matchId || !wallet || !zone || !role) {
            return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Get match state
        const matches = await sql`SELECT * FROM penalty_matches WHERE id = ${matchId}`;
        if (matches.length === 0) return NextResponse.json({ success: false, error: 'Match not found' }, { status: 404 });
        
        const match = matches[0];
        if (match.status !== 'IN_PROGRESS') return NextResponse.json({ success: false, error: 'Match finished' }, { status: 400 });

        // 2. Check multiplier availability
        let isMultiplierActive = false;
        if (useMultiplier) {
            const participant = await sql`
                SELECT multiplier_used FROM penalty_room_participants 
                WHERE room_id = ${match.room_id} AND wallet_address = ${wallet}
            `;
            if (participant.length > 0 && !participant[0].multiplier_used) {
                isMultiplierActive = true;
                await sql`
                    UPDATE penalty_room_participants 
                    SET multiplier_used = TRUE 
                    WHERE room_id = ${match.room_id} AND wallet_address = ${wallet}
                `;
            }
        }

        // 3. Record this turn
        const [playerTurn] = await sql`
            INSERT INTO penalty_turns (match_id, player_wallet, role, zone, is_multiplier) 
            VALUES (${matchId}, ${wallet}, ${role}, ${zone}, ${isMultiplierActive})
            RETURNING *
        `;

        // 4. Handle AI match
        if (match.is_ai) {
            const aiRole = role === 'SHOOTER' ? 'KEEPER' : 'SHOOTER';
            const aiZone = ['LT', 'LB', 'C', 'RT', 'RB'][Math.floor(Math.random() * 5)];
            
            const [aiTurn] = await sql`
                INSERT INTO penalty_turns (match_id, player_wallet, role, zone) 
                VALUES (${matchId}, 'COMPUTER', ${aiRole}, ${aiZone})
                RETURNING *
            `;

            const shooterZone = role === 'SHOOTER' ? zone : aiZone;
            const keeperZone = role === 'KEEPER' ? zone : aiZone;
            const isGoal = shooterZone !== keeperZone;

            const points = calculatePoints(isGoal, isMultiplierActive, role);

            await sql`UPDATE penalty_turns SET is_goal = ${isGoal}, points_earned = ${points} WHERE id = ${playerTurn.id}`;
            await sql`UPDATE penalty_turns SET is_goal = ${isGoal} WHERE id = ${aiTurn.id}`;

            const shooterWallet = role === 'SHOOTER' ? wallet : 'COMPUTER';
            if (isGoal) {
                const scoreField = shooterWallet === match.player1_wallet ? sql`p1_score` : sql`p2_score`;
                await sql`UPDATE penalty_matches SET ${scoreField} = ${scoreField} + 1 WHERE id = ${matchId}`;
            }

            const pointsField = wallet === match.player1_wallet ? sql`p1_points` : sql`p2_points`;
            await sql`UPDATE penalty_matches SET ${pointsField} = ${pointsField} + ${points} WHERE id = ${matchId}`;
            
            await updateLeaderboard(wallet, points);

            const roundsRes = await sql`SELECT COUNT(*) as count FROM penalty_turns WHERE match_id = ${matchId} AND role = 'SHOOTER' AND is_goal IS NOT NULL`;
            const rounds = parseInt(roundsRes[0].count);
            
            if (rounds >= 5) {
                const scores = await sql`SELECT p1_score, p2_score FROM penalty_matches WHERE id = ${matchId}`;
                const { p1_score, p2_score } = scores[0];
                if (p1_score !== p2_score) {
                    await sql`UPDATE penalty_matches SET status = 'FINISHED' WHERE id = ${matchId}`;
                    const winner = p1_score > p2_score ? match.player1_wallet : 'COMPUTER';
                    if (winner === wallet) {
                        await updateLeaderboard(wallet, 500);
                        await sql`UPDATE penalty_matches SET ${pointsField} = ${pointsField} + 500 WHERE id = ${matchId}`;
                    }
                }
            }

            return NextResponse.json({
                success: true,
                result: { isGoal, shooterZone, keeperZone, roundCompleted: true, pointsEarned: points }
            });
        }

        // 5. Logic for PvP
        const otherRole = role === 'SHOOTER' ? 'KEEPER' : 'SHOOTER';
        const otherPlayer = wallet === match.player1_wallet ? match.player2_wallet : match.player1_wallet;

        const otherTurns = await sql`
            SELECT * FROM penalty_turns 
            WHERE match_id = ${matchId} AND player_wallet = ${otherPlayer} AND role = ${otherRole} AND is_goal IS NULL
            ORDER BY created_at DESC LIMIT 1
        `;

        if (otherTurns.length > 0) {
            const otherTurn = otherTurns[0];
            const shooterZone = role === 'SHOOTER' ? zone : otherTurn.zone;
            const keeperZone = role === 'KEEPER' ? zone : otherTurn.zone;
            const isGoal = shooterZone !== keeperZone;

            const player1Wallet = match.player1_wallet;
            const player2Wallet = match.player2_wallet;
            const isP1 = wallet === player1Wallet;
            const p1Role = isP1 ? role : otherRole;
            const p2Role = isP1 ? otherRole : role;
            const p1Multiplier = isP1 ? isMultiplierActive : otherTurn.is_multiplier;
            const p2Multiplier = isP1 ? otherTurn.is_multiplier : isMultiplierActive;

            const p1Points = calculatePoints(isGoal, p1Multiplier, p1Role);
            const p2Points = calculatePoints(isGoal, p2Multiplier, p2Role);

            await sql`UPDATE penalty_turns SET is_goal = ${isGoal}, points_earned = ${isP1 ? p1Points : p2Points} WHERE id = ${playerTurn.id}`;
            await sql`UPDATE penalty_turns SET is_goal = ${isGoal}, points_earned = ${isP1 ? p2Points : p1Points} WHERE id = ${otherTurn.id}`;

            const shooterWallet = role === 'SHOOTER' ? wallet : otherPlayer;
            const scoreField = shooterWallet === player1Wallet ? sql`p1_score` : sql`p2_score`;
            if (isGoal) await sql`UPDATE penalty_matches SET ${scoreField} = ${scoreField} + 1 WHERE id = ${matchId}`;
            
            await sql`UPDATE penalty_matches SET p1_points = p1_points + ${p1Points}, p2_points = p2_points + ${p2Points} WHERE id = ${matchId}`;
            
            await updateLeaderboard(player1Wallet, p1Points);
            await updateLeaderboard(player2Wallet, p2Points);

            const roundsRes = await sql`SELECT COUNT(*) as count FROM penalty_turns WHERE match_id = ${matchId} AND is_goal IS NOT NULL AND role = 'SHOOTER'`;
            const rounds = parseInt(roundsRes[0].count);

            if (rounds >= 5) {
                const scores = await sql`SELECT p1_score, p2_score FROM penalty_matches WHERE id = ${matchId}`;
                const { p1_score, p2_score } = scores[0];
                if (p1_score !== p2_score) {
                    await sql`UPDATE penalty_matches SET status = 'FINISHED' WHERE id = ${matchId}`;
                    const winner = p1_score > p2_score ? player1Wallet : player2Wallet;
                    await updateLeaderboard(winner, 500);
                    const winnerField = winner === player1Wallet ? sql`p1_points` : sql`p2_points`;
                    await sql`UPDATE penalty_matches SET ${winnerField} = ${winnerField} + 500 WHERE id = ${matchId}`;
                }
            }

            return NextResponse.json({
                success: true,
                result: { isGoal, shooterZone, keeperZone, roundCompleted: true, pointsEarned: isP1 ? p1Points : p2Points }
            });
        }

        return NextResponse.json({ success: true, message: 'Awaiting opponent turn', roundCompleted: false });

    } catch (e: any) {
        console.error('Match error:', e);
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const matchId = searchParams.get('matchId');

    if (!matchId) return NextResponse.json({ success: false, error: 'Missing matchId' }, { status: 400 });

    try {
        const matches = await sql`SELECT * FROM penalty_matches WHERE id = ${matchId}`;
        const turns = await sql`SELECT * FROM penalty_turns WHERE match_id = ${matchId} ORDER BY created_at ASC`;

        return NextResponse.json({ success: true, match: matches[0], turns });
    } catch (e: any) {
        return NextResponse.json({ success: false, error: e.message }, { status: 500 });
    }
}
