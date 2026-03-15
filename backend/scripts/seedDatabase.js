import { initDatabase } from '../database.js';

async function seedDatabase() {
    await initDatabase();
    console.log('SQLite database initialized and seeded');
    process.exit(0);
}

seedDatabase();
