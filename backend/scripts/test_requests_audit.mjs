import http from 'http';

const BASE = 'http://localhost:5000';
const PASS = 'Test@1234';

async function request(method, path, body = null, cookie = '') {
    return new Promise((resolve) => {
        const data = body ? JSON.stringify(body) : '';
        const url = new URL(path, BASE);
        const req = http.request({
            hostname: url.hostname, port: url.port, path: url.pathname + url.search, method,
            headers: {
                'Content-Type': 'application/json',
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
                ...(cookie ? { Cookie: cookie } : {})
            }
        }, res => {
            let b = ''; res.on('data', c => b += c);
            res.on('end', () => resolve({ status: res.statusCode, body: b, cookies: (res.headers['set-cookie'] || []).join('; ') }));
        });
        req.on('error', (e) => resolve({ status: 500, error: e.message }));
        if (data) req.write(data);
        req.end();
    });
}

async function login(email) {
    const r = await request('POST', '/api/login', { email, password: PASS });
    const match = r.cookies.match(/accessToken=([^;]+)/);
    return { cookie: match ? `accessToken=${match[1]}` : '', user: JSON.parse(r.body).user };
}

async function runAudit() {
    console.log('--- REQUESTS AUDIT (LEAVE, OD, NO-DUE) ---');

    // 1. Student1 submits requests
    const student1 = await login('student@test.com');
    const classesR = await request('GET', `/api/users/${student1.user.id}/classes`, null, student1.cookie);
    const classId = JSON.parse(classesR.body)[0].id;

    console.log('1.1 Submitting Leave Request...');
    const leaveR = await request('POST', '/api/leave-requests', {
        studentId: student1.user.id,
        classId: classId,
        subject: 'Sick Leave',
        fromDate: '2026-05-01',
        toDate: '2026-05-02',
        type: 'LEAVE',
        reason: 'Flu'
    }, student1.cookie);
    const leaveId = JSON.parse(leaveR.body).id;

    console.log('1.2 Submitting OD Request...');
    const odR = await request('POST', '/api/leave-requests', {
        studentId: student1.user.id,
        classId: classId,
        subject: 'Sports Meet',
        fromDate: '2026-05-05',
        toDate: '2026-05-05',
        type: 'OD',
        reason: 'Inter-college Football'
    }, student1.cookie);
    const odId = JSON.parse(odR.body).id;

    console.log('1.3 Submitting No-Due Request...');
    const ndR = await request('POST', '/api/no-due-requests', {
        reason: 'Graduation'
    }, student1.cookie);
    const ndId = JSON.parse(ndR.body).id;

    // 2. Parent1 views requests
    const parent1 = await login('parent@test.com');
    console.log('2. Parent checking requests...');
    const parentReqsR = await request('GET', `/api/requests/parent/${parent1.user.id}`, null, parent1.cookie);
    const parentReqs = JSON.parse(parentReqsR.body);
    console.log('Parent found requests:', parentReqs.length);

    // 3. Teacher1 approves requests
    const teacher1 = await login('teacher@test.com');
    console.log('3.1 Teacher approving Leave...');
    await request('PUT', `/api/leave-requests/${leaveId}/status`, {
        status: 'APPROVED',
        staffRemarks: 'Get well soon.',
        staffId: teacher1.user.id
    }, teacher1.cookie);

    console.log('3.2 Teacher approving OD...');
    await request('PUT', `/api/leave-requests/${odId}/status`, {
        status: 'APPROVED',
        staffRemarks: 'Good luck!',
        staffId: teacher1.user.id
    }, teacher1.cookie);

    console.log('3.3 Teacher reviewing No-Due...');
    await request('PUT', `/api/no-due-requests/${ndId}/review`, {
        status: 'TEACHER_APPROVED',
        remarks: 'No library dues.'
    }, teacher1.cookie);

    // 4. Admin finalizes No-Due
    const admin = await login('admin@test.com');
    console.log('4. Admin finalizing No-Due...');
    await request('PUT', `/api/no-due-requests/${ndId}/finalize`, {
        remarks: 'All clear.'
    }, admin.cookie);

    // 5. Verification
    console.log('\n--- VERIFICATION ---');
    
    // Check Leave status
    const leaveVerify = await request('GET', `/api/requests/student/${student1.user.id}`, null, student1.cookie);
    const leaveStatus = JSON.parse(leaveVerify.body).find(r => r.id === leaveId).status;
    console.log('Leave Status:', leaveStatus);

    // Check No-Due status
    const ndVerify = await request('GET', `/api/users/${student1.user.id}/no-due-requests`, null, student1.cookie);
    const ndStatus = JSON.parse(ndVerify.body).find(r => r.id === ndId).status;
    console.log('No-Due Status:', ndStatus);

    // Check Notifications
    const studentNotifsR = await request('GET', '/api/notifications', null, student1.cookie);
    const studentNotifs = JSON.parse(studentNotifsR.body);
    console.log('Student Notifications:', studentNotifs.length);

    const parentNotifsR = await request('GET', '/api/notifications', null, parent1.cookie);
    const parentNotifs = JSON.parse(parentNotifsR.body);
    console.log('Parent Notifications:', parentNotifs.length);

    if (leaveStatus === 'APPROVED' && ndStatus === 'COMPLETED') {
        console.log('\n✅ REQUEST AUDIT PASSED!');
    } else {
        console.log('\n❌ REQUEST AUDIT FAILED!');
    }
}

runAudit();
