import postgres from 'postgres';

// Only connect if we have a URL, otherwise mock it for build time
const isBuild = process.env.npm_lifecycle_event === 'build';
const sql = isBuild || !process.env.POSTGRES_URL
  ? (() => {
    const mock = async () => [];
    mock.unsafe = async () => [];
    return mock;
  })() as unknown as ReturnType<typeof postgres>
  : postgres(process.env.POSTGRES_URL as string, {
    ssl: 'require', // Required for Supabase/Neon
  });

async function initDb() {
  if (isBuild || !process.env.POSTGRES_URL) return;
  try {
    // Create Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        wallet_address TEXT PRIMARY KEY,
        privy_id TEXT UNIQUE,
        balance FLOAT DEFAULT 1000,
        referred_by TEXT DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Try adding the column if table already exists in dev
    try {
      await sql`ALTER TABLE users ADD COLUMN privy_id TEXT UNIQUE`;
    } catch (e) { /* Column likely exists */ }

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

    // Create Private Races table
    await sql`
      CREATE TABLE IF NOT EXISTS private_races (
        id TEXT PRIMARY KEY,
        host_wallet TEXT NOT NULL,
        mode TEXT DEFAULT 'CRYPTO',
        entry_fee INTEGER DEFAULT 10,
        status TEXT DEFAULT 'LOBBY',
        start_time TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create Private Race Participants table
    await sql`
      CREATE TABLE IF NOT EXISTS private_race_participants (
        race_id TEXT NOT NULL,
        wallet_address TEXT NOT NULL,
        selected_token TEXT NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (race_id, wallet_address)
      )
    `;

    // Create Waitlist Lead Capture table
    await sql`
      CREATE TABLE IF NOT EXISTS waitlist_users (
        id SERIAL PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        twitter_handle TEXT,
        instagram_handle TEXT,
        wallet_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log("PostgreSQL schema initialized successfully.");
  } catch (error) {
    console.error("Error initializing PostgreSQL schema:", error);
  }
}

// Fire and forget initialization
initDb();

export default sql;
