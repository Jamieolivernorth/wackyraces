import sql from '../src/lib/db';
async function run() {
    await sql`UPDATE users SET wc_balance = 50000, balance = 50000`;
    console.log("Given 50,000 WC points and MAIN balance to all users.");
    process.exit(0);
}
run().catch(console.error);
