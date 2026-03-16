import test from 'node:test';
import assert from 'node:assert';
import supertest from 'supertest';
import bcrypt from 'bcrypt';
import fs from 'fs';
import { initDatabase, run, query } from './database.js';

process.env.NODE_ENV = 'test';

const { default: app } = await import('./index.js');
const request = supertest(app);

async function resetDatabase() {
    console.log('[TEST] Starting resetDatabase...');
    await initDatabase();
    console.log('[TEST] initDatabase done');
    await run('PRAGMA foreign_keys = OFF');
    await run('DELETE FROM submissions');
    await run('DELETE FROM attachments');
    await run('DELETE FROM assignments');
    await run('DELETE FROM attendance_records');
    await run('DELETE FROM attendance_sessions');
    await run('DELETE FROM leave_documents');
    await run('DELETE FROM leave_requests');
    await run('DELETE FROM comments');
    await run('DELETE FROM announcements');
    await run('DELETE FROM class_memberships');
    await run('DELETE FROM school_events');
    await run('DELETE FROM performance_records');
    await run('DELETE FROM classes');
    await run('DELETE FROM refresh_tokens');
    await run('DELETE FROM audit_logs');
    await run('DELETE FROM notifications');
    await run('DELETE FROM users');
    await run('DELETE FROM organizations');
    await run('PRAGMA foreign_keys = ON');
    console.log('[TEST] resetDatabase done');
}

test('Join/Assignment/Delete flow', async () => {
    await resetDatabase();

    const adminPwd = await bcrypt.hash('pass123', 10);
    const studentPwd = await bcrypt.hash('pass123', 10);

    await run('INSERT INTO organizations (id, name, domain, isDeleted, createdAt) VALUES (?, ?, ?, 0, ?)', ['ORG1', 'Test Org', 'test.org', new Date().toISOString()]);

    await run('INSERT INTO users (id, name, email, role, passwordHash, organizationId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)', ['A1', 'Admin User', 'admin@test.com', 'ADMIN', adminPwd, 'ORG1', new Date().toISOString()]);
    await run('INSERT INTO users (id, name, email, role, passwordHash, organizationId, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?)', ['S1', 'Student User', 'student@test.com', 'STUDENT', studentPwd, 'ORG1', new Date().toISOString()]);

    const loginAdmin = await request.post('/api/login').send({ email: 'admin@test.com', password: 'pass123' });
    if (loginAdmin.status !== 200) {
        fs.writeFileSync('test_failure.log', `LOGIN ADMIN FAILED with status ${loginAdmin.status}: ${JSON.stringify(loginAdmin.body, null, 2)}`);
        assert.fail(`LOGIN ADMIN FAILED with status ${loginAdmin.status}: ${JSON.stringify(loginAdmin.body)}`);
    }
    const tokenAdmin = loginAdmin.body.accessToken;

    const createCls = await request.post('/api/classes')
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
            name: 'Test Class',
            section: 'A',
            subject: 'Testing',
            room: '101',
            description: 'test flow',
            ownerId: 'A1',
            theme: 'theme-blue'
        });
    assert.equal(createCls.status, 200, 'class creation should succeed');
    const enrollmentCode = createCls.body.enrollmentCode;
    const classId = createCls.body.id;

    const loginStudent = await request.post('/api/login').send({ email: 'student@test.com', password: 'pass123' });
    assert.equal(loginStudent.status, 200, 'student login should succeed');
    const tokenStudent = loginStudent.body.accessToken;

    const joinResp = await request.post('/api/classes/join')
        .set('Authorization', `Bearer ${tokenStudent}`)
        .send({ userId: 'S1', enrollmentCode });
    assert.equal(joinResp.status, 200, 'join class should succeed');

    const assignResp = await request.post(`/api/classes/${classId}/assignments`)
        .set('Authorization', `Bearer ${tokenAdmin}`)
        .send({
            title: 'Homework 1',
            instructions: 'Do this',
            topic: 'Intro',
            points: 10,
            date: new Date().toISOString(),
            createdBy: 'A1'
        });
    assert.equal(assignResp.status, 200, 'assignment creation should succeed');

    const assignmentId = assignResp.body.id;

    const delResp = await request.delete(`/api/assignments/${assignmentId}`)
        .set('Authorization', `Bearer ${tokenAdmin}`);
    assert.equal(delResp.status, 200, 'assignment deletion should succeed');

    const deletedAssignment = await query('SELECT * FROM assignments WHERE id = ?', [assignmentId]);
    assert.equal(deletedAssignment[0].isDeleted, 1, 'assignment should be soft deleted');
});
