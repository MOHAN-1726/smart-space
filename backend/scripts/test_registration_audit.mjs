import http from 'http';

const BASE = 'http://localhost:5000';

async function request(method, path, body = null) {
    return new Promise((resolve) => {
        const data = body ? JSON.stringify(body) : '';
        const url = new URL(path, BASE);
        const req = http.request({
            hostname: url.hostname, port: url.port, path: url.pathname, method,
            headers: {
                'Content-Type': 'application/json',
                ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}),
            }
        }, res => {
            let b = ''; res.on('data', c => b += c);
            res.on('end', () => resolve({ status: res.statusCode, body: b, headers: res.headers }));
        });
        req.on('error', (e) => resolve({ status: 500, error: e.message }));
        if (data) req.write(data);
        req.end();
    });
}

async function runAudit() {
    console.log('--- REGISTRATION QA AUDIT ---');

    // 1. Password validation
    console.log('1. Testing short password...');
    const r1 = await request('POST', '/api/register', { name: 'Test', email: 'test@audit.com', password: '123', role: 'STUDENT' });
    console.log('Status:', r1.status, 'Body:', r1.body);

    // 2. Email validation
    console.log('\n2. Testing invalid email...');
    const r2 = await request('POST', '/api/register', { name: 'Test', email: 'invalid-email', password: 'password123', role: 'STUDENT' });
    console.log('Status:', r2.status, 'Body:', r2.body);

    // 3. Successful Student Registration
    const studentEmail = `student_${Date.now()}@audit.com`;
    console.log(`\n3. Registering Student: ${studentEmail}...`);
    const r3 = await request('POST', '/api/register', { name: 'Audit Student', email: studentEmail, password: 'password123', role: 'STUDENT' });
    const studentData = JSON.parse(r3.body);
    console.log('Status:', r3.status, 'Role:', studentData.user?.role);
    const studentId = studentData.user?.id;

    // 4. Parent Registration with Linking
    if (studentId) {
        const parentEmail = `parent_${Date.now()}@audit.com`;
        console.log(`\n4. Registering Parent linking to ${studentId}...`);
        const r4 = await request('POST', '/api/register', { 
            name: 'Audit Parent', 
            email: parentEmail, 
            password: 'password123', 
            role: 'PARENT',
            studentId: studentId
        });
        const parentData = JSON.parse(r4.body);
        console.log('Status:', r4.status, 'Role:', parentData.user?.role);
    }

    // 5. Duplicate Email
    console.log('\n5. Testing duplicate email...');
    const r5 = await request('POST', '/api/register', { name: 'Duplicate', email: studentEmail, password: 'password123', role: 'STUDENT' });
    console.log('Status:', r5.status, 'Body:', r5.body);
}

runAudit();
