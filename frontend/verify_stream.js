
const API_URL = 'http://localhost:5000/api';

async function run() {
    try {
        console.log('1. Logging in...');
        const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'teacher@hogwarts.edu' })
        });
        const user = await loginRes.json();
        console.log('User:', user.name);

        console.log('2. Fetching Classes...');
        const classesRes = await fetch(`${API_URL}/users/${user.id}/classes`);
        const classes = await classesRes.json();
        const cls = classes[0];
        console.log('Class:', cls.name);

        console.log('3. Fetching Stream...');
        const streamRes = await fetch(`${API_URL}/classes/${cls.id}/stream`);
        const stream = await streamRes.json();
        console.log('Announcements count:', stream.length);

        console.log('4. Posting Announcement...');
        const announceRes = await fetch(`${API_URL}/classes/${cls.id}/announce`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ authorId: user.id, content: 'Test Announcement ' + Date.now() })
        });
        const announcement = await announceRes.json();
        console.log('Announcement ID:', announcement.id);

        console.log('5. Posting Comment...');
        const commentRes = await fetch(`${API_URL}/comments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ parentId: announcement.id, authorId: user.id, content: 'Test Comment' })
        });
        const comment = await commentRes.json();
        console.log('Comment ID:', comment.id);

        console.log('6. Verifying Comment in Stream...');
        const streamRes2 = await fetch(`${API_URL}/classes/${cls.id}/stream`);
        const stream2 = await streamRes2.json();
        const foundAnn = stream2.find(a => a.id === announcement.id);
        const foundComm = foundAnn.comments.find(c => c.id === comment.id);

        if (foundComm) {
            console.log('SUCCESS: Comment found in stream!');
        } else {
            console.error('FAILURE: Comment NOT found in stream!');
            console.log('Comments found:', foundAnn.comments);
        }

    } catch (err) {
        console.error('Error:', err);
    }
}

run();
