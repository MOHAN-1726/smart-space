import { api } from './service.ts'; // We can't import TS directly in node easily without build.
// Let's use fetch directly to simulate.

const BASE_URL = 'http://localhost:5000/api';

async function verifyFix() {
    console.log('1. Submitting a new Leave Request for S1...');
    // Create Request
    const createRes = await fetch(`${BASE_URL}/leave-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            studentId: 'S1',
            classId: 'C1',
            fromDate: '2023-11-01',
            toDate: '2023-11-02',
            type: 'LEAVE',
            reason: 'Sick Leave Test',
            status: 'PENDING' // server ignores this usually but just in case
        })
    });
    const createData = await createRes.json();
    console.log('Create Response:', createData);

    if (!createData.success) {
        console.error('Failed to create request');
        return;
    }

    console.log('2. Fetching Requests for S1 (Student View)...');
    // Fetch Requests using NEW endpoint
    const fetchRes = await fetch(`${BASE_URL}/requests/student/S1`);
    const requests = await fetchRes.json();

    console.log(`Fetched ${requests.length} requests.`);
    const found = requests.find(r => r.id === createData.id);

    if (found) {
        console.log('✅ SUCCESS: Created request was found in Student View!');
        console.log('Request Details:', found);
    } else {
        console.error('❌ FAILURE: Created request were NOT found in Student View.');
    }
}

verifyFix().catch(console.error);
