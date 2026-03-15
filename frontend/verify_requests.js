import { initDatabase, query } from './server/database.js';

async function verify() {
    await initDatabase();
    console.log('Verifying Leave Requests...');
    const requests = await query('SELECT * FROM leave_requests');
    console.log('Total Requests:', requests.length);
    console.log(JSON.stringify(requests, null, 2));

    const s1Requests = await query(`
            SELECT lr.*, c.name as className 
            FROM leave_requests lr
            JOIN classes c ON lr.classId = c.id
            WHERE lr.studentId = 'S1'
    `);
    console.log('S1 Requests (Joined):', s1Requests.length);
}

verify().catch(console.error);
