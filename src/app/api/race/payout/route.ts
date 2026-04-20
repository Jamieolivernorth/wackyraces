import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

interface PayoutPayload {
    winnerships: { wallet: string; amount: number; currency?: 'CASH'|'COINS' }[];
    referrers: { wallet: string; amount: number; currency?: 'CASH'|'COINS' }[];
    houseRake: number;
    poolVolume: number;
    participantResult?: {
        wallet: string;
        isWinner: boolean;
        amountWon: number;
        raceId: string;
        mode: string;
    }
}

export async function POST(request: NextRequest) {
    try {
        const body: PayoutPayload = await request.json();
        const { winnerships, referrers, houseRake, poolVolume, participantResult } = body;

        // 1. Pay winners
        for (const win of winnerships) {
            const isCash = (!win.currency || win.currency === 'CASH');
            if (isCash) {
                await sql`UPDATE users SET balance = balance + ${win.amount} WHERE wallet_address = ${win.wallet}`;
            } else {
                await sql`UPDATE users SET wc_balance = wc_balance + ${win.amount} WHERE wallet_address = ${win.wallet}`;
            }
        }

        // 2. Pay referrers (Referral commission is typically paid in cash but we'll respect currency passed)
        for (const ref of referrers) {
            const isCash = (!ref.currency || ref.currency === 'CASH');
            if (isCash) {
                await sql`UPDATE users SET balance = balance + ${ref.amount} WHERE wallet_address = ${ref.wallet}`;
            } else {
                await sql`UPDATE users SET wc_balance = wc_balance + ${ref.amount} WHERE wallet_address = ${ref.wallet}`;
            }
        }

        // 3. Update Platform Stats (Volume & Rake). We will only track Real Cash volume.
        const totalCashRake = houseRake; // In a full build, limit this to cash rake
        await sql`UPDATE platform_stats SET total_rake = total_rake + ${totalCashRake}, total_volume = total_volume + ${poolVolume} WHERE id = 1`;

        // 4. Record Participant Result for Leaderboards
        if (participantResult) {
            await sql`
                INSERT INTO race_history (wallet_address, race_id, mode, result, amount_won)
                VALUES (${participantResult.wallet}, ${participantResult.raceId}, ${participantResult.mode}, ${participantResult.isWinner ? 'WIN' : 'LOSS'}, ${participantResult.amountWon})
            `;

            // Increment the races_played and races_won
            if (participantResult.isWinner) {
                await sql`UPDATE users SET races_played = races_played + 1, races_won = races_won + 1 WHERE wallet_address = ${participantResult.wallet}`;
            } else {
                await sql`UPDATE users SET races_played = races_played + 1 WHERE wallet_address = ${participantResult.wallet}`;
            }
        }

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("Payout API Error:", err);
        return NextResponse.json({ error: 'Server error during payout processing' }, { status: 500 });
    }
}
