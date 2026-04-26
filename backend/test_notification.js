import { run, query, get } from './database.js';

async function testNotifications() {
    const parentId = 'P1777014138093'; // Replace with actual parent ID if different
    const studentId = 'U1777013648285';
    
    console.log('Triggering Absence Alert...');
    
    // In a real scenario, this would be called from the attendance route
    const id = `NT_TEST_${Date.now()}`;
    const message = "Your child was marked ABSENT for Math class today.";
    
    // Get parent phone
    const parent = await get('SELECT phoneNumber FROM users WHERE id = ?', [parentId]);
    if (parent && parent.phoneNumber) {
        console.log(`[SIMULATED SMS] To: ${parent.phoneNumber} | Message: ${message}`);
    } else {
        console.log('Parent has no phone number. Updating to test...');
        await run("UPDATE users SET phoneNumber = '+1234567890' WHERE id = ?", [parentId]);
        console.log('[SIMULATED SMS] To: +1234567890 | Message: ${message}');
    }

    console.log('Notification triggered in DB logic.');
}

testNotifications();
