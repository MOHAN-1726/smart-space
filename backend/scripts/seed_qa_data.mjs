/**
 * Smart Space - Full QA Test Data Seeder
 * Creates: Admin, Staff (Teacher), Student, Parent + class + assignments + attendance
 * Run: node scripts/seed_qa_data.mjs
 */
import 'dotenv/config';
import Database from 'better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const db = new Database(path.join(__dirname, '..', 'classroom.sqlite'));
db.pragma('foreign_keys = ON');

const now = () => new Date().toISOString();
const id = (prefix) => `${prefix}${Date.now()}_${Math.random().toString(36).slice(2,6)}`;

const PASS = 'Test@1234';
const TEST_MARKER = '__QA_TEST__';

async function hash(p) { return bcrypt.hash(p, 10); }

async function seed() {
  console.log('\n=== Smart Space QA Seeder ===\n');

  // ── Get or create Org ──────────────────────────────────────────────────
  let org = db.prepare('SELECT * FROM organizations WHERE isDeleted=0 LIMIT 1').get();
  if (!org) {
    const orgId = id('ORG');
    db.prepare(`INSERT INTO organizations (id, name, domain, isDeleted, createdAt) VALUES (?,?,?,0,?)`)
      .run(orgId, 'Smart Space Academy', 'smartspace.test', now());
    org = db.prepare('SELECT * FROM organizations WHERE id=?').get(orgId);
    console.log('✅ Created org:', org.name);
  } else {
    console.log('ℹ️  Using existing org:', org.name);
  }

  // ── Helper: upsert user ──────────────────────────────────────────────
  async function upsertUser(email, name, role) {
    let u = db.prepare('SELECT * FROM users WHERE email=?').get(email);
    if (u) { console.log(`ℹ️  User exists: ${email} (${role})`); return u; }
    const userId = id('U');
    const passwordHash = await hash(PASS);
    db.prepare(`INSERT INTO users (id, name, email, role, passwordHash, organizationId, createdAt, isActive, isDeleted)
                VALUES (?,?,?,?,?,?,?,1,0)`)
      .run(userId, name, email, role, passwordHash, org.id, now());
    console.log(`✅ Created ${role}: ${email}`);
    return db.prepare('SELECT * FROM users WHERE id=?').get(userId);
  }

  // ── Create the 4 roles ────────────────────────────────────────────────
  const admin   = await upsertUser('qa.admin@smartspace.test',   `Admin ${TEST_MARKER}`,   'ADMIN');
  const staff   = await upsertUser('qa.teacher@smartspace.test', `Teacher ${TEST_MARKER}`, 'STAFF');
  const student = await upsertUser('qa.student@smartspace.test', `Student ${TEST_MARKER}`, 'STUDENT');
  const parent  = await upsertUser('qa.parent@smartspace.test',  `Parent ${TEST_MARKER}`,  'PARENT');

  // ── Link Parent → Student ────────────────────────────────────────────
  const existingRel = db.prepare('SELECT * FROM parent_student_relationships WHERE parentId=? AND studentId=?')
                        .get(parent.id, student.id);
  if (!existingRel) {
    db.prepare(`INSERT INTO parent_student_relationships (id, parentId, studentId, relation, organizationId, createdAt)
                VALUES (?,?,?,?,?,?)`)
      .run(id('R'), parent.id, student.id, 'father', org.id, now());
    console.log('✅ Linked parent → student');
  }

  // ── Create Class ─────────────────────────────────────────────────────
  let cls = db.prepare(`SELECT * FROM classes WHERE name LIKE '%${TEST_MARKER}%' AND isDeleted=0 LIMIT 1`).get();
  if (!cls) {
    const classId = id('C');
    const code = Math.random().toString(36).slice(2,8).toUpperCase();
    db.prepare(`INSERT INTO classes (id, name, section, subject, room, ownerId, organizationId, enrollmentCode, theme, isDeleted, createdAt)
                VALUES (?,?,?,?,?,?,?,?,?,0,?)`)
      .run(classId, `Mathematics ${TEST_MARKER}`, 'A', 'Mathematics', 'R101', staff.id, org.id, code, 'theme-blue', now());
    cls = db.prepare('SELECT * FROM classes WHERE id=?').get(classId);
    console.log('✅ Created class:', cls.name, '| Code:', code);
  } else {
    console.log('ℹ️  Using existing class:', cls.name);
  }

  // ── Memberships ──────────────────────────────────────────────────────
  for (const [userId, role] of [[admin.id,'STAFF'],[staff.id,'STAFF'],[student.id,'STUDENT']]) {
    const exists = db.prepare('SELECT * FROM class_memberships WHERE userId=? AND classId=?').get(userId, cls.id);
    if (!exists) {
      db.prepare('INSERT INTO class_memberships (id, userId, classId, role) VALUES (?,?,?,?)')
        .run(id('M'), userId, cls.id, role);
      console.log(`✅ Added ${role} membership for`, userId === admin.id ? 'admin' : userId === staff.id ? 'teacher' : 'student');
    }
  }

  // ── Create Assignment ────────────────────────────────────────────────
  let asgn = db.prepare(`SELECT * FROM assignments WHERE classId=? AND isDeleted=0 LIMIT 1`).get(cls.id);
  if (!asgn) {
    const asgnId = id('A');
    const due = new Date(Date.now() + 2 * 86400000).toISOString();
    db.prepare(`INSERT INTO assignments (id, classId, title, instructions, points, dueDate, createdBy, organizationId, type, isDeleted, createdAt)
                VALUES (?,?,?,?,?,?,?,?,?,0,?)`)
      .run(asgnId, cls.id, `QA Test Assignment ${TEST_MARKER}`, 'Solve problems 1-10 on page 45.', 100, due, staff.id, org.id, 'ASSIGNMENT', now());
    asgn = db.prepare('SELECT * FROM assignments WHERE id=?').get(asgnId);
    // Create submission for student
    db.prepare(`INSERT INTO submissions (id, assignmentId, studentId, organizationId, status, isDeleted)
                VALUES (?,?,?,?,?,0)`)
      .run(id('S'), asgnId, student.id, org.id, 'Assigned');
    console.log('✅ Created assignment + student submission');
  }

  // ── Create Attendance Session + Records ─────────────────────────────
  const sessDesc = `Daily Attendance ${new Date().toISOString().split('T')[0]}`;
  let session = db.prepare('SELECT * FROM attendance_sessions WHERE classId=? AND description=? AND isDeleted=0').get(cls.id, sessDesc);
  if (!session) {
    const sessId = id('SESS');
    db.prepare(`INSERT INTO attendance_sessions (id, classId, organizationId, startTime, description, status, isDeleted, createdAt)
                VALUES (?,?,?,?,?,?,0,?)`)
      .run(sessId, cls.id, org.id, now(), sessDesc, 'CLOSED', now());
    session = db.prepare('SELECT * FROM attendance_sessions WHERE id=?').get(sessId);

    db.prepare(`INSERT INTO attendance_records (id, sessionId, studentId, organizationId, status, joinedAt, isDeleted, createdAt)
                VALUES (?,?,?,?,?,?,0,?)`)
      .run(id('REC'), sessId, student.id, org.id, 'PRESENT', now(), now());
    console.log('✅ Created attendance session (CLOSED) + PRESENT record for student');
  } else {
    console.log('ℹ️  Attendance session already exists for today');
  }

  // ── Create Leave Request ─────────────────────────────────────────────
  const lrExists = db.prepare('SELECT * FROM leave_requests WHERE studentId=? AND classId=? AND isDeleted=0 LIMIT 1').get(student.id, cls.id);
  if (!lrExists) {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    db.prepare(`INSERT INTO leave_requests (id, studentId, classId, organizationId, subject, fromDate, toDate, type, reason, status, isDeleted, createdAt)
                VALUES (?,?,?,?,?,?,?,?,?,?,0,?)`)
      .run(id('LR'), student.id, cls.id, org.id, 'Medical Leave', tomorrow, tomorrow, 'LEAVE', 'Fever and cold', 'PENDING', now());
    console.log('✅ Created PENDING leave request for student');
  }

  // ── Create Announcement ──────────────────────────────────────────────
  const annExists = db.prepare(`SELECT * FROM announcements WHERE classId=? AND content LIKE '%${TEST_MARKER}%' AND isDeleted=0 LIMIT 1`).get(cls.id);
  if (!annExists) {
    db.prepare(`INSERT INTO announcements (id, classId, authorId, organizationId, content, isDeleted, createdAt)
                VALUES (?,?,?,?,?,0,?)`)
      .run(id('AN'), cls.id, staff.id, org.id, `Welcome to Mathematics class! ${TEST_MARKER} Check the classwork tab for your first assignment.`, now());
    console.log('✅ Created announcement');
  }

  // ── Create School Event ──────────────────────────────────────────────
  const evExists = db.prepare(`SELECT * FROM school_events WHERE organizationId=? AND title LIKE '%${TEST_MARKER}%' LIMIT 1`).get(org.id);
  if (!evExists) {
    const evDate = new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0];
    db.prepare(`INSERT INTO school_events (id, title, category, date, description, organizationId, createdAt)
                VALUES (?,?,?,?,?,?,?)`)
      .run(id('EV'), `Unit Test ${TEST_MARKER}`, 'Exam', evDate, 'Chapter 1-3 exam', org.id, now());
    console.log('✅ Created upcoming exam event');
  }

  console.log('\n=== Seed Complete ===');
  console.log('\n📋 QA Login Credentials (all password: Test@1234)');
  console.log('  ADMIN   : qa.admin@smartspace.test');
  console.log('  TEACHER : qa.teacher@smartspace.test');
  console.log('  STUDENT : qa.student@smartspace.test');
  console.log('  PARENT  : qa.parent@smartspace.test');
  console.log('\n🔗 Frontend: http://localhost:5173');
  console.log('🔗 Backend:  http://localhost:5000\n');
}

seed().catch(e => { console.error('❌ Seeder failed:', e); process.exit(1); });
