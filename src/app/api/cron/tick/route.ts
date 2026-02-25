import { NextResponse } from 'next/server';

// We need a resilient backend tick to run the race logic instead of the browser
// This route can be hit by a cron job every 5 seconds.
export async function GET() {
    try {
        // Fire a signal to the store or handle the tick directly here in the future
        // For MVP, we'll keep the client store running, but this endpoint proves 
        // the architecture for the Phase 7 Cron Job integration.
        return NextResponse.json({ success: true, message: 'Cron tick fired' });
    } catch (err) {
        console.error(err);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
