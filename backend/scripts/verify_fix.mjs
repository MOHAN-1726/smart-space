import http from 'http';

async function testEndpoint() {
    console.log('Testing GET /api/classes/C1777183392877_stnj1/my-attendance...');
    
    // Login
    const loginData = JSON.stringify({ email: 'student@test.com', password: 'Test@1234' });
    const cookie = await new Promise(resolve => {
        const req = http.request({ hostname: 'localhost', port: 5000, path: '/api/login', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': loginData.length } }, res => {
            resolve(res.headers['set-cookie'][0].split(';')[0]);
        });
        req.write(loginData); req.end();
    });

    const url = new URL('/api/classes/C1777183392877_stnj1/my-attendance?userId=U1777183392411_0r8q5', 'http://localhost:5000');
    
    return new Promise((resolve) => {
        const req = http.request({ hostname: url.hostname, port: url.port, path: url.pathname + url.search, method: 'GET', headers: { 'Cookie': cookie } }, (res) => {
            let b = ''; res.on('data', c => b += c);
            res.on('end', () => {
                console.log('Status:', res.statusCode);
                console.log('Body:', b);
                resolve(res.statusCode);
            });
        });
        req.end();
    });
}

testEndpoint();
