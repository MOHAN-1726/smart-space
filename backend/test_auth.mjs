

const log = (msg, pass) => console.log(`${pass ? '✅' : '❌'} ${msg}`);

async function test() {
    let regData, token, loginData;

    try {
        // 1. Register User
        const regRes = await fetch('http://localhost:5001/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Test User', email: 'test@class.com', role: 'STAFF', password: 'password123' })
        });
        regData = await regRes.json();
        // If already exists due to multiple runs
        if (regRes.status === 409) {
            const fallbackRes = await fetch('http://localhost:5001/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: 'test@class.com', password: 'password123' })
            });
            regData = await fallbackRes.json();
            token = regData.accessToken;
            log('Register User (Existed, logged in)', true);
        } else {
            token = regData.accessToken;
            log('Register User', regRes.status === 200 && !!token);
        }

        // 2. Login success
        const loginRes = await fetch('http://localhost:5001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@class.com', password: 'password123' })
        });
        loginData = await loginRes.json();
        log('Login success', loginRes.status === 200 && !!loginData.accessToken && !!loginData.refreshToken);

        // 3. Login wrong password
        const failRes = await fetch('http://localhost:5001/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'test@class.com', password: 'wrong' })
        });
        log('Login wrong password', failRes.status === 401);

        // 4. Unauthorized access to protected route (No token)
        const noAuth = await fetch('http://localhost:5001/api/classes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Class 1' })
        });
        log('Unauthorized access (no token)', noAuth.status === 401);

        // 5. Expired / Invalid token access
        const badToken = await fetch('http://localhost:5001/api/classes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer bad_token' },
            body: JSON.stringify({ name: 'Class 1' })
        });
        log('Unauthorized access (invalid token)', badToken.status === 401);

        // Create class to get a classId
        const clsRes = await fetch('http://localhost:5001/api/classes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ name: 'Class 1', ownerId: loginData.id, theme: 'theme-blue' })
        });
        const { id: classId } = await clsRes.json();

        // Create Assignment
        const assgnRes = await fetch(`http://localhost:5001/api/classes/${classId}/assignments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ title: 'A1', createdBy: loginData.id })
        });
        const { id: assignmentId } = await assgnRes.json();

        // 6. Staff deleting other staff's assignment -> 403
        let token2;
        const staff2Res = await fetch('http://localhost:5001/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Staff 2', email: `staff2${Date.now()}@class.com`, role: 'STAFF', password: 'password123' })
        });
        const staff2Data = await staff2Res.json();
        token2 = staff2Data.token;

        const delFail = await fetch(`http://localhost:5001/api/assignments/${assignmentId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${staff2Data.accessToken}` }
        });
        log('Staff deleting other staff task -> ' + delFail.status, delFail.status === 403);

        // 7. Test Refresh Endpoint
        const refreshReq = await fetch('http://localhost:5001/api/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: loginData.refreshToken })
        });
        const refreshData = await refreshReq.json();
        log('Refresh works', refreshReq.status === 200 && !!refreshData.accessToken);

        // 8. Test Logout Endpoint
        const logoutRes = await fetch('http://localhost:5001/api/logout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: refreshData.refreshToken || loginData.refreshToken })
        });
        log('Logout successful', logoutRes.status === 200);

        // 9. Test Refresh logic after logout
        const refreshFail = await fetch('http://localhost:5001/api/refresh', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken: refreshData.refreshToken || loginData.refreshToken })
        });
        log('Refresh revoked', refreshFail.status === 401);

    } catch (e) {
        console.error('Test script failed:', e);
    }

    console.log('Tests Done');
}

test();
