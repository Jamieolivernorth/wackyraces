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
        wc_balance FLOAT DEFAULT 0,
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

    // Create Race History for Leaderboard tracking
    await sql`
      CREATE TABLE IF NOT EXISTS race_history (
        id SERIAL PRIMARY KEY,
        wallet_address TEXT NOT NULL,
        race_id TEXT NOT NULL,
        mode TEXT,
        result TEXT,
        amount_won FLOAT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Fallback columns for users (optional, currently using race_history for all agg but good for cache)
    try { await sql`ALTER TABLE users ADD COLUMN races_played INTEGER DEFAULT 0`; } catch (e) { }
    try { await sql`ALTER TABLE users ADD COLUMN races_won INTEGER DEFAULT 0`; } catch (e) { }
    try { await sql`ALTER TABLE users ADD COLUMN wc_balance FLOAT DEFAULT 0`; } catch (e) { }

    // Create World Cup Pens Tables
    await sql`
      CREATE TABLE IF NOT EXISTS wc_pens_teams (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        team_id TEXT NOT NULL,
        striker_level INTEGER DEFAULT 1,
        unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, team_id)
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS wc_pens_leaderboard (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        score INTEGER NOT NULL,
        period TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Penalty PvP Tables
    await sql`
      CREATE TABLE IF NOT EXISTS penalty_rooms (
        id SERIAL PRIMARY KEY,
        entry_fee INTEGER NOT NULL,
        is_private BOOLEAN DEFAULT FALSE,
        status TEXT DEFAULT 'OPEN',
        participant_count INTEGER DEFAULT 0,
        current_pool FLOAT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS penalty_room_participants (
        room_id INTEGER REFERENCES penalty_rooms(id),
        wallet_address TEXT NOT NULL,
        team_id TEXT,
        team_name TEXT,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (room_id, wallet_address)
      )
    `;

    try {
      await sql`ALTER TABLE penalty_room_participants ADD COLUMN team_id TEXT`;
    } catch (e) { /* Column likely exists */ }
    try { await sql`ALTER TABLE penalty_room_participants ADD COLUMN team_name TEXT`; } catch (e) { }
    try { await sql`ALTER TABLE penalty_room_participants ADD COLUMN multiplier_used BOOLEAN DEFAULT FALSE`; } catch (e) { }
    try { await sql`ALTER TABLE penalty_room_participants ADD COLUMN email TEXT`; } catch (e) { }
    try { await sql`ALTER TABLE penalty_room_participants ADD COLUMN selection_confirmed BOOLEAN DEFAULT FALSE`; } catch (e) { }

    await sql`
      CREATE TABLE IF NOT EXISTS penalty_matches (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES penalty_rooms(id),
        player1_wallet TEXT NOT NULL,
        player2_wallet TEXT NOT NULL,
        p1_team_id TEXT,
        p2_team_id TEXT,
        p1_score INTEGER DEFAULT 0,
        p2_score INTEGER DEFAULT 0,
        is_ai BOOLEAN DEFAULT FALSE,
        status TEXT DEFAULT 'IN_PROGRESS',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try {
      await sql`ALTER TABLE penalty_matches ADD COLUMN p1_team_id TEXT`;
    } catch (e) { }
    try { await sql`ALTER TABLE penalty_matches ADD COLUMN p2_team_id TEXT`; } catch (e) { }
    try { await sql`ALTER TABLE penalty_matches ADD COLUMN p1_points INTEGER DEFAULT 0`; } catch (e) { }
    try { await sql`ALTER TABLE penalty_matches ADD COLUMN p2_points INTEGER DEFAULT 0`; } catch (e) { }

    await sql`
      CREATE TABLE IF NOT EXISTS penalty_turns (
        id SERIAL PRIMARY KEY,
        match_id INTEGER REFERENCES penalty_matches(id),
        player_wallet TEXT NOT NULL,
        role TEXT NOT NULL, -- 'SHOOTER' or 'KEEPER'
        zone TEXT NOT NULL,
        is_goal BOOLEAN,
        is_multiplier BOOLEAN DEFAULT FALSE,
        points_earned INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    try { await sql`ALTER TABLE penalty_rooms ADD COLUMN type TEXT DEFAULT 'PVP'`; } catch (e) { }
    try { await sql`ALTER TABLE penalty_rooms ADD COLUMN max_players INTEGER DEFAULT 2`; } catch (e) { }
    try { await sql`ALTER TABLE penalty_rooms ADD COLUMN invite_code TEXT`; } catch (e) { }
    try { await sql`ALTER TABLE penalty_rooms ADD COLUMN status TEXT DEFAULT 'LOBBY'`; } catch (e) { }
    try { await sql`ALTER TABLE penalty_rooms ADD COLUMN selection_deadline TIMESTAMP`; } catch (e) { }
    try { await sql`ALTER TABLE penalty_turns ADD COLUMN points_earned INTEGER DEFAULT 0`; } catch (e) { }

    await sql`
      CREATE TABLE IF NOT EXISTS wc_pens_leaderboard (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL,
        score INTEGER DEFAULT 0,
        period TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    try { await sql`CREATE INDEX IF NOT EXISTS idx_leaderboard_period_score ON wc_pens_leaderboard (period, score DESC)`; } catch (e) { }

    await sql`
      CREATE TABLE IF NOT EXISTS penalty_tournament_brackets (
        id SERIAL PRIMARY KEY,
        room_id INTEGER REFERENCES penalty_rooms(id),
        round INTEGER NOT NULL, -- 1=Round of 32/16/etc, 2=Next, etc.
        p1_wallet TEXT,
        p2_wallet TEXT,
        winner_wallet TEXT,
        match_id INTEGER REFERENCES penalty_matches(id),
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
