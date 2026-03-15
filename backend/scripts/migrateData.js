import { initDatabase } from '../database.js';

async function migrate() {
    await initDatabase();
    console.log('Local SQLite database is ready. Migration script is a no-op for local mode.');
    process.exit(0);
}

migrate();
