import { initDatabase, query } from './server/database.js';

async function verifyStats() {
    await initDatabase();
    console.log('Verifying Assignment Stats...');

    // 1. Create an assignment due yesterday (Missing for S1)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const dateStr = yesterday.toISOString().split('T')[0];

    // Check if we need to insert it
    const existing = await query(`SELECT * FROM assignments WHERE title = 'Missing Test Assignment'`);
    if (existing.length === 0) {
        await query(`INSERT INTO assignments (id, classId, title, dueDate, createdAt, createdBy) VALUES (?, ?, ?, ?, ?, ?)`,
            ['A_MISSING_1', 'C1', 'Missing Test Assignment', dateStr, new Date().toISOString(), 'T1']
        );
        console.log('Created Missing Assignment');
    }

    // 2. Fetch Stats for S1
    // We can't call API directly from node easily without starting fetch, 
    // but we can simulate the query logic used in endpoint.

    // Logic from endpoint:
    const assignments = await query(`SELECT * FROM assignments WHERE classId = 'C1'`);
    const submissions = await query(`
        SELECT s.*, a.dueDate 
        FROM submissions s
        JOIN assignments a ON s.assignmentId = a.id
        WHERE a.classId = 'C1' AND s.studentId = 'S1'
    `);

    // Manually calculate expected
    let upcoming = 0;
    let missing = 0;
    let submitted = 0;
    let graded = 0;

    const now = new Date();
    const subMap = new Map();
    submissions.forEach(s => subMap.set(s.assignmentId, s));

    assignments.forEach(a => {
        const sub = subMap.get(a.id);
        const dueDate = a.dueDate ? new Date(a.dueDate) : null;

        if (sub && sub.status === 'Returned') graded++;
        else if (sub && sub.status === 'TurnedIn') submitted++;
        else {
            if (dueDate && dueDate < now) missing++;
            else upcoming++;
        }
    });

    console.log('Calculated Stats for S1 in C1:');
    console.log(`Total: ${assignments.length}`);
    console.log(`Upcoming: ${upcoming}`);
    console.log(`Missing: ${missing}`);
    console.log(`Submitted: ${submitted}`);
    console.log(`Graded: ${graded}`);

}

verifyStats().catch(console.error);
