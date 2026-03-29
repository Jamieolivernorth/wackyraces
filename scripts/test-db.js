const postgres = require('postgres');

async function testConnection(url) {
    try {
        console.log(`Testing: ${url.replace(/:[^:@]+@/, ':***@')}`); // Hide password in logs
        const sql = postgres(url, { ssl: 'require', max: 1, idle_timeout: 1 });
        await sql`SELECT 1`;
        console.log('✅ Connection Success!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Connection Failed:', e.message);
        process.exit(1);
    }
}

const urls = [
    // Pooler with 6543 + percent encoded
    "postgresql://postgres.iuaxilqtowjwxdvfnlce:WackyRaces2026%21@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    // Pooler with 6543 + raw exclamation mark
    "postgresql://postgres.iuaxilqtowjwxdvfnlce:WackyRaces2026!@aws-1-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true",
    // Pooler with 5432 + raw
    "postgresql://postgres.iuaxilqtowjwxdvfnlce:WackyRaces2026!@aws-1-eu-central-1.pooler.supabase.com:5432/postgres",
    // Direct with 5432 + raw (if IPv6 resolves locally somehow now, or if Supabase reverted)
    "postgresql://postgres:WackyRaces2026!@db.iuaxilqtowjwxdvfnlce.supabase.co:5432/postgres"
];

async function run() {
    for (const url of urls) {
        try {
            const sql = postgres(url, { ssl: 'require', max: 1, connect_timeout: 5 });
            await sql`SELECT 1`;
            console.log(`\n✅ SUCCESS: ${url.replace(/:[^:@]+@/, ':***@')}`);
            console.log(`USE THIS EXACT URL: ${url}`);
            process.exit(0);
        } catch (e) {
            console.log(`❌ Failed: ${url.replace(/:[^:@]+@/, ':***@')} -> ${e.message}`);
        }
    }
    console.log('\n❌ ALL CONNECTION STRINGS FAILED!');
    process.exit(1);
}

run();
