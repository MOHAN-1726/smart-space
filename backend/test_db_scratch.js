import { initDatabase, run, get, query } from './database.js';

async function test() {
    try {
        console.log('Initializing database...');
        await initDatabase();
        
        console.log('Cleaning up...');
        await run('DELETE FROM submissions');
        await run('DELETE FROM assignments');
        await run('DELETE FROM class_memberships');
        await run('DELETE FROM classes');
        await run('DELETE FROM users');
        await run('DELETE FROM organizations');
        
        console.log('Inserting org...');
        await run('INSERT INTO organizations (id, name) VALUES (?, ?)', ['ORG1', 'Test Org']);
        
        console.log('Inserting user...');
        await run('INSERT INTO users (id, name, email, role, organizationId) VALUES (?, ?, ?, ?, ?)', ['U1', 'Test User', 'test@test.com', 'STUDENT', 'ORG1']);
        
        console.log('Getting user...');
        const user = await get('SELECT * FROM users WHERE id = ?', ['U1']);
        console.log('User found:', user);
        
        console.log('Querying all users...');
        const users = await query('SELECT * FROM users');
        console.log('All users:', users);
        
        console.log('Test passed!');
        process.exit(0);
    } catch (err) {
        console.error('Test failed:', err);
        process.exit(1);
    }
}

test();
