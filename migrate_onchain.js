const { sql } = require('@vercel/postgres');
require('dotenv').config({ path: '.env.local' });

async function migrate() {
    try {
        await sql`ALTER TABLE platform_stats ADD COLUMN IF NOT EXISTS onchain_enabled BOOLEAN DEFAULT false`;
        console.log("Migration successful");
        process.exit(0);
    } catch (err) {
        console.error("Migration error:", err);
        process.exit(1);
    }
}
migrate();
