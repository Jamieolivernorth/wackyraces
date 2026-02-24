import Database from 'better-sqlite3';
import path from 'path';

// Connect to a local SQLite file in the root of the project
const dbPath = path.resolve(process.cwd(), 'wacky_races.db');
const db = new Database(dbPath, { verbose: console.log });

// Initialize schema
db.pragma('journal_mode = WAL'); // Better performance

// Create Users table
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    wallet_address TEXT PRIMARY KEY,
    balance REAL DEFAULT 1000, -- Give users 1000 free testnet USDC to start
    referred_by TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Create Platform Stats table
db.exec(`
  CREATE TABLE IF NOT EXISTS platform_stats (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    total_rake REAL DEFAULT 0,
    total_volume REAL DEFAULT 0,
    current_rake REAL DEFAULT 0.10,
    referral_fee REAL DEFAULT 0.02
  )
`);

// Safely add columns to existing table if they don't exist
try {
  db.exec(`ALTER TABLE platform_stats ADD COLUMN current_rake REAL DEFAULT 0.10`);
} catch (e) { /* Column likely exists */ }
try {
  db.exec(`ALTER TABLE platform_stats ADD COLUMN referral_fee REAL DEFAULT 0.02`);
} catch (e) { /* Column likely exists */ }

// Ensure row 1 exists in stats
const checkStats = db.prepare('SELECT id FROM platform_stats WHERE id = 1').get();
if (!checkStats) {
  db.exec('INSERT INTO platform_stats (id, total_rake, total_volume, current_rake, referral_fee) VALUES (1, 0, 0, 0.10, 0.02)');
}

export default db;
