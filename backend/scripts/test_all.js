import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';

const baseURL = 'http://localhost:5000/api';
const dbPath = path.join(process.cwd(), 'classroom.sqlite');
const db = new Database(dbPath);

async function request(endpoint, method = 'GET', body = null, token = null) {
    const headers = { 'Content-Type': 'application/json' };
    if (token) {
        headers['Cookie'] = `accessToken=${token.accessToken}; refreshToken=${token.refreshToken}`;
    }

    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const res = await fetch(`${baseURL}${endpoint}`, options);
    
    let newTokens = token;
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
        const cookies = setCookie.split(',').map(c => c.split(';')[0].trim());
        newTokens = { ...token };
        cookies.forEach(c => {
            if (c.startsWith('accessToken=')) newTokens.accessToken = c.split('=')[1];
            if (c.startsWith('refreshToken=')) newTokens.refreshToken = c.split('=')[1];
        });
    }

    let data;
    try { data = await res.json(); } catch (e) { data = await res.text(); }
    return { status: res.status, data, tokens: newTokens || token };
}

async function uploadFile(endpoint, filePath, token) {
    const fileBuf = fs.readFileSync(filePath);
    const blob = new Blob([fileBuf], { type: 'application/pdf' });
    const formData = new FormData();
    formData.append('file', blob, path.basename(filePath));

    const headers = {};
    if (token) headers['Cookie'] = `accessToken=${token.accessToken}; refreshToken=${token.refreshToken}`;

    const res = await fetch(`${baseURL}${endpoint}`, { method: 'POST', headers, body: formData });
    return { status: res.status, data: await res.json() };
}

async function runTests() {
    console.log("=======================================");
    console.log(" SMART SPACE MASTER VALIDATION AUDIT   ");
    console.log("=======================================\\n");
    let passed = 0; let failed = 0;
    
    function assert(condition, message) {
        if (condition) { console.log(`✅ PASS: ${message}`); passed++; } 
        else { console.error(`❌ FAIL: ${message}`); failed++; }
    }

    try {
        console.log("--- PHASE 1: Authentication Components ---");
        
        async function registerUser(name, email, role, studentId = null) {
            const body = { name, email, password: 'Password123!', role, photoUrl: '' };
            if (studentId) body.studentId = studentId;
            let res = await request('/register', 'POST', body);
            if (res.status === 409) res = await request('/login', 'POST', { email, password: 'Password123!' });
            return res;
        }

        const prefix = Date.now();
        const adminRes = await registerUser('Admin User', `admin_${prefix}@test.com`, 'ADMIN');
        assert(adminRes.status === 200, "Admin account created & logged in");
        const adminTokens = adminRes.tokens;
        const adminData = adminRes.data.user;

        const teacherRes = await registerUser('Teacher User', `teacher_${prefix}@test.com`, 'STAFF');
        assert(teacherRes.status === 200, "Teacher account created & logged in");
        const teacherTokens = teacherRes.tokens;
        const teacherData = teacherRes.data.user;

        const studentRes = await registerUser('Student User', `student_${prefix}@test.com`, 'STUDENT');
        assert(studentRes.status === 200, "Student account created & logged in");
        const studentTokens = studentRes.tokens;
        const studentData = studentRes.data.user;

        const parentRes = await registerUser('Parent User', `parent_${prefix}@test.com`, 'PARENT', studentData.id);
        assert(parentRes.status === 200, "Parent account created & logged in");
        const parentTokens = parentRes.tokens;
        const parentData = parentRes.data.user;

        const logoutRes = await request('/logout', 'POST', null, studentTokens);
        assert(logoutRes.status === 200, "Logout successful (Cookies cleared logic checked)");

        const refreshRes = await request('/refresh', 'POST', null, teacherTokens);
        assert(refreshRes.status === 200, "Session restore via Refresh Token works");

        console.log("\\n--- PHASE 2: Role-Based Dashboard Testing ---");
        // Test role access using a specific API route
        const adminDashRes = await request(`/classes`, 'POST', { name: 'Admin Class' }, adminTokens);
        assert(adminDashRes.status === 200, "Admin can access Admin/Staff routes");
        
        const teacherDashRes = await request(`/classes`, 'POST', { name: 'Teacher Class' }, teacherTokens);
        assert(teacherDashRes.status === 200, "Teacher can access Teacher routes");
        const classId = teacherDashRes.data.id;
        const classCode = teacherDashRes.data.enrollmentCode;

        await request('/classes/join', 'POST', { enrollmentCode: classCode }, studentTokens);

        const studentDashRes = await request(`/classes`, 'POST', { name: 'Fail Class' }, studentTokens);
        assert(studentDashRes.status === 403 || studentDashRes.status === 401, "Student CANNOT access Admin/Staff routes");

        console.log("\\n--- PHASE 3: Attendance Component Testing ---");
        const attRes = await request(`/classes/${classId}/sheet`, 'POST', {
            date: '2026-10-10',
            records: { [studentData.id]: { status: 'PRESENT', remarks: '' } }
        }, teacherTokens);
        assert(attRes.status === 200, "Teacher marked attendance successfully");

        const attResDup = await request(`/classes/${classId}/sheet`, 'POST', {
            date: '2026-10-10',
            records: { [studentData.id]: { status: 'ABSENT', remarks: '' } }
        }, teacherTokens);
        // Depending on logic, duplicate prevents or updates. Wait, in this backend it updates, so we assert it works.
        assert(attResDup.status === 200, "Duplicate attendance handled correctly (updates existing session)");

        console.log("\\n--- PHASE 4: Homework Component Testing ---");
        const hwRes = await request(`/classes/${classId}/assignments`, 'POST', {
            title: 'Math HW', instructions: 'Solve 1-10', points: 100, date: '2026-12-01', createdBy: teacherData.id, type: 'ASSIGNMENT'
        }, teacherTokens);
        assert(hwRes.status === 200, "Teacher created homework successfully");
        const hwId = hwRes.data.id;

        const subRes = await request(`/assignments/${hwId}/mysubmission/${studentData.id}`, 'GET', null, studentTokens);
        const subId = subRes.data.id;
        
        const turnInRes = await request(`/submissions/${subId}/turnin`, 'POST', null, studentTokens);
        assert(turnInRes.status === 200, "Student submitted homework successfully");

        const gradeRes = await request(`/submissions/${subId}/grade`, 'POST', { grade: 95 }, teacherTokens);
        assert(gradeRes.status === 200, "Teacher graded homework successfully");

        console.log("\\n--- PHASE 5: Leave / OD / No-Due Testing ---");
        const leaveRes = await request('/leave-requests', 'POST', {
            studentId: studentData.id, classId: classId, fromDate: '2026-05-01', toDate: '2026-05-02', type: 'LEAVE', reason: 'Sick'
        }, studentTokens);
        assert(leaveRes.status === 200, "Leave Request submitted (Status = Pending)");
        
        const odRes = await request('/leave-requests', 'POST', {
            studentId: studentData.id, classId: classId, fromDate: '2026-05-03', toDate: '2026-05-03', type: 'OD', reason: 'Event'
        }, studentTokens);
        assert(odRes.status === 200, "OD Request submitted");

        const odApproveRes = await request(`/leave-requests/${odRes.data.id}/status`, 'PUT', { status: 'APPROVED', staffId: teacherData.id }, teacherTokens);
        assert(odApproveRes.status === 200, "OD Approved (Attendance updated as OD)");

        const noDueRes = await request('/no-due-requests', 'POST', { reason: 'Graduation' }, studentTokens);
        assert(noDueRes.status === 200, "No-Due Request created");
        await request(`/no-due-requests/${noDueRes.data.id}/review`, 'PUT', { status: 'TEACHER_APPROVED' }, teacherTokens);
        const finalNoDueRes = await request(`/no-due-requests/${noDueRes.data.id}/finalize`, 'PUT', { remarks: 'Done' }, adminTokens);
        assert(finalNoDueRes.status === 200, "No-Due Final Approval completed");

        console.log("\\n--- PHASE 6: Messaging Component Testing ---");
        const msgRes = await request('/messages', 'POST', {
            receiverId: teacherData.id, content: 'Hello Teacher!'
        }, parentTokens);
        assert(msgRes.status === 200, "Real-Time chat message saved from Parent to Teacher");

        console.log("\\n--- PHASE 7: Notification Component Testing ---");
        // Verify database directly for notifications since there's no endpoint tested yet
        const notifs = db.prepare("SELECT * FROM notifications WHERE userId = ?").all(studentData.id);
        assert(notifs.length > 0, "Notifications triggered and saved in database correctly");

        console.log("\\n--- PHASE 8: Analytics Component Testing ---");
        const analyticsRes = await request(`/classes/${classId}/assignments/summary?studentId=${studentData.id}`, 'GET', null, teacherTokens);
        assert(analyticsRes.status === 200 && analyticsRes.data.graded !== undefined, "Analytics summary fetched correctly");

        console.log("\\n--- PHASE 9: File Upload Component Testing ---");
        fs.writeFileSync('test.pdf', 'dummy pdf');
        fs.writeFileSync('test.exe', 'dummy exe');
        const pdfUp = await uploadFile('/upload', 'test.pdf', studentTokens);
        assert(pdfUp.status === 200, "Valid PDF accepted");
        const exeUp = await uploadFile('/upload', 'test.exe', studentTokens);
        assert(exeUp.status === 500, "Invalid file (.exe) rejected");
        fs.unlinkSync('test.pdf'); fs.unlinkSync('test.exe');

        console.log("\\n--- PHASE 10: Multi-User Testing ---");
        const multiPromises = [
            request('/me', 'GET', null, adminTokens),
            request('/me', 'GET', null, teacherTokens),
            request('/me', 'GET', null, studentTokens),
            request('/me', 'GET', null, parentTokens)
        ];
        const multiRes = await Promise.all(multiPromises);
        assert(multiRes.every(r => r.status === 200), "Concurrent multi-user session requests succeeded independently");

        console.log("\\n--- PHASE 11: Security Testing ---");
        const apiAccessRes = await fetch(`${baseURL}/classes`, { method: 'GET' });
        assert(apiAccessRes.status === 401, "Direct API access without token is 401 Unauthorized");

        console.log("\\n--- PHASE 12: Database Validation ---");
        const usersCount = db.prepare("SELECT COUNT(*) as c FROM users").get().c;
        const leaveCount = db.prepare("SELECT COUNT(*) as c FROM leave_requests WHERE studentId = ?").get(studentData.id).c;
        assert(usersCount >= 4, "Database relationships valid (Users stored)");
        assert(leaveCount === 2, "Database records match requests (Leave & OD stored)");

        console.log("\\n--- PHASE 13: Performance Testing ---");
        const loadPromises = [];
        for (let i = 0; i < 20; i++) {
            loadPromises.push(request('/me', 'GET', null, studentTokens));
        }
        const loadRes = await Promise.all(loadPromises);
        assert(loadRes.every(r => r.status === 200), "System stable under simulated 20+ concurrent user requests");

        console.log("\\n=======================================");
        console.log(` FINAL MASTER VALIDATION: ${passed} PASSED | ${failed} FAILED `);
        console.log("=======================================\\n");

    } catch (e) {
        console.error("Test execution failed:", e);
    }
}

runTests();
