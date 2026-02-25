import postgres from 'postgres';

// Connect to PostgreSQL using the environment variable
const sql = postgres(process.env.POSTGRES_URL as string, {
  ssl: 'require', // Required for Supabase/Neon
});

async function initDb() {
  try {
    // Create Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        wallet_address TEXT PRIMARY KEY,
        balance FLOAT DEFAULT 1000,
        referred_by TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create Platform Stats table
    await sql`
      CREATE TABLE IF NOT EXISTS platform_stats (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        total_rake FLOAT DEFAULT 0,
        total_volume FLOAT DEFAULT 0,
        current_rake FLOAT DEFAULT 0.10,
        referral_fee FLOAT DEFAULT 0.02
      )
    `;

    // Safely add columns to existing table if they don't exist
    try {
      await sql`ALTER TABLE platform_stats ADD COLUMN current_rake FLOAT DEFAULT 0.10`;
    } catch (e) { /* Column likely exists */ }
    try {
      await sql`ALTER TABLE platform_stats ADD COLUMN referral_fee FLOAT DEFAULT 0.02`;
    } catch (e) { /* Column likely exists */ }

    // Ensure row 1 exists in stats
    const checkStats = await sql`SELECT id FROM platform_stats WHERE id = 1`;
    if (checkStats.length === 0) {
      await sql`INSERT INTO platform_stats (id, total_rake, total_volume, current_rake, referral_fee) VALUES (1, 0, 0, 0.10, 0.02)`;
    }

    console.log("PostgreSQL schema initialized successfully.");
  } catch (error) {
    console.error("Error initializing PostgreSQL schema:", error);
  }
}

// Fire and forget initialization
initDb();

export default sql;
