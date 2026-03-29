import { db } from '@vercel/postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    const client = await db.connect();
    try {
        console.log('Creating private_races table...');
        await client.sql`
            CREATE TABLE IF NOT EXISTS private_races (
                id UUID PRIMARY KEY,
                host_wallet VARCHAR(255) NOT NULL,
                mode VARCHAR(50) NOT NULL DEFAULT 'CRYPTO',
                entry_fee DECIMAL NOT NULL DEFAULT 10,
                status VARCHAR(50) NOT NULL DEFAULT 'LOBBY',
                start_time TIMESTAMP WITH TIME ZONE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        console.log('✅ private_races table created');

        console.log('Creating private_race_participants table...');
        await client.sql`
            CREATE TABLE IF NOT EXISTS private_race_participants (
                race_id UUID NOT NULL REFERENCES private_races(id) ON DELETE CASCADE,
                wallet_address VARCHAR(255) NOT NULL,
                selected_token VARCHAR(50) NOT NULL,
                joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (race_id, wallet_address)
            );
        `;
        console.log('✅ private_race_participants table created');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        client.release();
    }
}

main().catch(console.error);
