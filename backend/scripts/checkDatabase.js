import { initDatabase, query } from '../database.js';

async function checkDatabase() {
    await initDatabase();
    console.log('Connected to SQLite database');

    try {
        const orgs = await query('SELECT id, name, domain FROM organizations');
        console.log(`Organizations: ${orgs.length}`);
        orgs.forEach(org => console.log(`  - ${org.name} (${org.domain})`));

        const users = await query('SELECT email, role, name FROM users');
        console.log(`\nUsers: ${users.length}`);
        users.forEach(user => console.log(`  - ${user.email} (${user.role})`));

        console.log('\n✅ Database check complete!');
        process.exit(0);
    } catch (err) {
        console.error('Error checking database:', err);
        process.exit(1);
    }
}

checkDatabase();
