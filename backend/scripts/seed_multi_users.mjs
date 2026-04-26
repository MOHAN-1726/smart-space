/**
 * Smart Space — Multi-User Test Data Seeder
 * 
 * Creates a realistic multi-classroom environment:
 *
 *   Admin:    admin@test.com
 *   Teachers: teacher@test.com  → owns Class A (Mathematics)
 *             teacher2@test.com → owns Class B (Science)
 *             teacher3@test.com → owns Class C (English)
 *   Students: student@test.com  → Class A + Class B
 *             student2@test.com → Class A + Class C
 *             student3@test.com → Class B + Class C
 *             student4@test.com → Class A
 *             student5@test.com → Class B
 *   Parents:  parent@test.com   → linked to student@test.com
 *             parent2@test.com  → linked to student2@test.com
 *             parent3@test.com  → linked to student3@test.com + student4@test.com
 *
 * All passwords: Test@1234
 *
 * Run: node scripts/seed_multi_users.mjs
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
const uid = (prefix) => `${prefix}${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
const PASS = 'Test@1234';

async function hash(p) { return bcrypt.hash(p, 10); }

// ── Helpers ──────────────────────────────────────────────────────────────────

function getOrCreateOrg(name, domain) {
  let org = db.prepare('SELECT * FROM organizations WHERE domain = ? AND isDeleted = 0').get(domain);
  if (org) return org;
  const id = uid('ORG');
  db.prepare('INSERT INTO organizations (id, name, domain, isDeleted, createdAt) VALUES (?,?,?,0,?)')
    .run(id, name, domain, now());
  return db.prepare('SELECT * FROM organizations WHERE id = ?').get(id);
}

async function upsertUser(email, name, role, orgId) {
  let u = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (u) {
    console.log(`  ℹ️  exists: ${email} (${u.role})`);
    return u;
  }
  const id = uid('U');
  const passwordHash = await hash(PASS);
  db.prepare(`INSERT INTO users (id, name, email, role, passwordHash, organizationId, createdAt, isActive, isDeleted)
              VALUES (?,?,?,?,?,?,?,1,0)`)
    .run(id, name, email, role, passwordHash, orgId, now());
  console.log(`  ✅ created: ${email} → ${role}`);
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id);
}

function linkParentStudent(parent, student, relation, orgId) {
  const exists = db.prepare('SELECT id FROM parent_student_relationships WHERE parentId = ? AND studentId = ?')
    .get(parent.id, student.id);
  if (!exists) {
    db.prepare(`INSERT INTO parent_student_relationships (id, parentId, studentId, relation, organizationId, createdAt)
                VALUES (?,?,?,?,?,?)`)
      .run(uid('R'), parent.id, student.id, relation, orgId, now());
  }
  // Also update the student's parentId field in users table for simplified lookups
  db.prepare('UPDATE users SET parentId = ? WHERE id = ?').run(parent.id, student.id);
  console.log(`  🔗 linked: ${parent.email} → ${student.email} (${relation})`);
}

function createClass(name, section, subject, room, owner, orgId, code) {
  let cls = db.prepare('SELECT * FROM classes WHERE name = ? AND section = ? AND organizationId = ? AND isDeleted = 0')
    .get(name, section, orgId);
  if (cls) {
    console.log(`  ℹ️  class exists: ${name} ${section}`);
    return cls;
  }
  const id = uid('C');
  db.prepare(`INSERT INTO classes (id, name, section, subject, room, ownerId, organizationId, enrollmentCode, theme, isDeleted, createdAt)
              VALUES (?,?,?,?,?,?,?,?,?,0,?)`)
    .run(id, name, section, subject, room, owner.id, orgId, code, 'theme-blue', now());
  console.log(`  ✅ created class: ${name} ${section} | Code: ${code}`);
  return db.prepare('SELECT * FROM classes WHERE id = ?').get(id);
}

function addMembership(userId, classId, role) {
  const exists = db.prepare('SELECT id FROM class_memberships WHERE userId = ? AND classId = ?').get(userId, classId);
  if (exists) return;
  db.prepare('INSERT INTO class_memberships (id, userId, classId, role) VALUES (?,?,?,?)')
    .run(uid('M'), userId, classId, role);
}

function createAssignment(classId, title, instructions, points, dueDays, createdBy, orgId) {
  const exists = db.prepare('SELECT id FROM assignments WHERE classId = ? AND title = ? AND isDeleted = 0').get(classId, title);
  if (exists) return;
  const due = new Date(Date.now() + dueDays * 86400000).toISOString();
  const id = uid('A');
  db.prepare(`INSERT INTO assignments (id, classId, title, instructions, points, dueDate, createdBy, organizationId, type, isDeleted, createdAt)
              VALUES (?,?,?,?,?,?,?,?,?,0,?)`)
    .run(id, classId, title, instructions, points, due, createdBy, orgId, 'ASSIGNMENT', now());
  console.log(`  📝 assignment: "${title}" in class ${classId.slice(0,8)}...`);
  return id;
}

function createSubmission(assignmentId, studentId, orgId, status) {
  if (!assignmentId) return;
  const exists = db.prepare('SELECT id FROM submissions WHERE assignmentId = ? AND studentId = ? AND isDeleted = 0').get(assignmentId, studentId);
  if (exists) return;
  db.prepare('INSERT INTO submissions (id, assignmentId, studentId, organizationId, status, isDeleted) VALUES (?,?,?,?,?,0)')
    .run(uid('SUB'), assignmentId, studentId, orgId, status);
}

function createAttendanceSession(classId, orgId, desc, status) {
  const exists = db.prepare('SELECT id FROM attendance_sessions WHERE classId = ? AND description = ? AND isDeleted = 0').get(classId, desc);
  if (exists) return db.prepare('SELECT id FROM attendance_sessions WHERE classId = ? AND description = ? AND isDeleted = 0').get(classId, desc).id;
  const id = uid('SESS');
  db.prepare(`INSERT INTO attendance_sessions (id, classId, organizationId, startTime, description, status, isDeleted, createdAt)
              VALUES (?,?,?,?,?,?,0,?)`)
    .run(id, classId, orgId, now(), desc, status, now());
  return id;
}

function createAttendanceRecord(sessionId, studentId, orgId, status) {
  const exists = db.prepare('SELECT id FROM attendance_records WHERE sessionId = ? AND studentId = ? AND isDeleted = 0').get(sessionId, studentId);
  if (exists) return;
  db.prepare(`INSERT INTO attendance_records (id, sessionId, studentId, organizationId, status, joinedAt, isDeleted, createdAt)
              VALUES (?,?,?,?,?,?,0,?)`)
    .run(uid('REC'), sessionId, studentId, orgId, status, now(), now());
}

function createAnnouncement(classId, authorId, orgId, content) {
  const exists = db.prepare('SELECT id FROM announcements WHERE classId = ? AND content = ? AND isDeleted = 0').get(classId, content);
  if (exists) return;
  db.prepare('INSERT INTO announcements (id, classId, authorId, organizationId, content, isDeleted, createdAt) VALUES (?,?,?,?,?,0,?)')
    .run(uid('AN'), classId, authorId, orgId, content, now());
}

function createEvent(title, category, daysFromNow, desc, orgId) {
  const exists = db.prepare('SELECT id FROM school_events WHERE title = ? AND organizationId = ?').get(title, orgId);
  if (exists) return;
  const date = new Date(Date.now() + daysFromNow * 86400000).toISOString().split('T')[0];
  db.prepare('INSERT INTO school_events (id, title, category, date, description, organizationId, createdAt) VALUES (?,?,?,?,?,?,?)')
    .run(uid('EV'), title, category, date, desc, orgId, now());
}

function createLeaveRequest(studentId, classId, orgId, subject, reason, daysFromNow, type) {
  const exists = db.prepare('SELECT id FROM leave_requests WHERE studentId = ? AND subject = ? AND isDeleted = 0').get(studentId, subject);
  if (exists) return;
  const d = new Date(Date.now() + daysFromNow * 86400000).toISOString().split('T')[0];
  db.prepare(`INSERT INTO leave_requests (id, studentId, classId, organizationId, subject, fromDate, toDate, type, reason, status, isDeleted, createdAt)
              VALUES (?,?,?,?,?,?,?,?,?,?,0,?)`)
    .run(uid('LR'), studentId, classId, orgId, subject, d, d, type, reason, 'PENDING', now());
  console.log(`  📋 leave request: "${subject}" for ${studentId.slice(0,8)}...`);
}

// ── Main Seed ───────────────────────────────────────────────────────────────

async function seed() {
  console.log('\n╔══════════════════════════════════════════════╗');
  console.log('║   Smart Space — Multi-User Test Data Seeder  ║');
  console.log('╚══════════════════════════════════════════════╝\n');

  // ── Organization ──
  console.log('── Organization ──');
  const org = getOrCreateOrg('Test Academy', 'test.com');
  console.log(`  Org: ${org.name} (${org.id})\n`);

  // ── Users ──
  console.log('── Users ──');
  const admin    = await upsertUser('admin@test.com',    'Admin User',      'ADMIN',   org.id);
  const teacher1 = await upsertUser('teacher@test.com',  'Alice Thompson',  'STAFF',   org.id);
  const teacher2 = await upsertUser('teacher2@test.com', 'Bob Martinez',    'STAFF',   org.id);
  const teacher3 = await upsertUser('teacher3@test.com', 'Clara Johnson',   'STAFF',   org.id);
  const student1 = await upsertUser('student@test.com',  'David Wilson',    'STUDENT', org.id);
  const student2 = await upsertUser('student2@test.com', 'Emma Davis',      'STUDENT', org.id);
  const student3 = await upsertUser('student3@test.com', 'Frank Brown',     'STUDENT', org.id);
  const student4 = await upsertUser('student4@test.com', 'Grace Lee',       'STUDENT', org.id);
  const student5 = await upsertUser('student5@test.com', 'Henry Clark',     'STUDENT', org.id);
  const parent1  = await upsertUser('parent@test.com',   'Margaret Wilson', 'PARENT',  org.id);
  const parent2  = await upsertUser('parent2@test.com',  'Robert Davis',    'PARENT',  org.id);
  const parent3  = await upsertUser('parent3@test.com',  'Susan Brown',     'PARENT',  org.id);

  // ── Parent ↔ Student Links ──
  console.log('\n── Parent ↔ Student Links ──');
  linkParentStudent(parent1, student1, 'mother', org.id);
  linkParentStudent(parent2, student2, 'father', org.id);
  linkParentStudent(parent3, student3, 'mother', org.id);
  linkParentStudent(parent3, student4, 'mother', org.id);

  // ── Classes ──
  console.log('\n── Classes ──');
  const classA = createClass('Mathematics',    'A', 'Mathematics', 'R101', teacher1, org.id, 'MATHA1');
  const classB = createClass('Science',        'B', 'Science',     'R202', teacher2, org.id, 'SCIB01');
  const classC = createClass('English',        'C', 'English',     'R303', teacher3, org.id, 'ENGC01');

  // ── Memberships ──
  console.log('\n── Memberships ──');
  // Admin gets STAFF membership in all classes
  addMembership(admin.id, classA.id, 'STAFF');
  addMembership(admin.id, classB.id, 'STAFF');
  addMembership(admin.id, classC.id, 'STAFF');
  // Teachers own their classes (already via ownerId), add membership too
  addMembership(teacher1.id, classA.id, 'STAFF');
  addMembership(teacher2.id, classB.id, 'STAFF');
  addMembership(teacher3.id, classC.id, 'STAFF');
  // Students
  addMembership(student1.id, classA.id, 'STUDENT');  // David  → A, B
  addMembership(student1.id, classB.id, 'STUDENT');
  addMembership(student2.id, classA.id, 'STUDENT');  // Emma   → A, C
  addMembership(student2.id, classC.id, 'STUDENT');
  addMembership(student3.id, classB.id, 'STUDENT');  // Frank  → B, C
  addMembership(student3.id, classC.id, 'STUDENT');
  addMembership(student4.id, classA.id, 'STUDENT');  // Grace  → A
  addMembership(student5.id, classB.id, 'STUDENT');  // Henry  → B
  console.log('  ✅ all memberships set');

  // ── Assignments ──
  console.log('\n── Assignments ──');
  const a1 = createAssignment(classA.id, 'Algebra Homework Ch.3',    'Solve exercises 1–20 on page 67.',     100, 3,  teacher1.id, org.id);
  const a2 = createAssignment(classA.id, 'Trigonometry Quiz Prep',    'Practice sin/cos/tan identities.',     50,  5,  teacher1.id, org.id);
  const a3 = createAssignment(classB.id, 'Chemistry Lab Report',      'Write up the titration experiment.',   100, 4,  teacher2.id, org.id);
  const a4 = createAssignment(classB.id, 'Physics Problem Set',       'Problems on Newton\'s Laws Ch.2.',     75,  2,  teacher2.id, org.id);
  const a5 = createAssignment(classC.id, 'Essay: Climate Change',     'Write 500-word argumentative essay.',  100, 7,  teacher3.id, org.id);
  const a6 = createAssignment(classC.id, 'Grammar Worksheet',         'Complete the tenses worksheet.',       40,  1,  teacher3.id, org.id);

  // ── Submissions ──
  console.log('\n── Submissions ──');
  // Class A students
  createSubmission(a1, student1.id, org.id, 'Submitted');
  createSubmission(a1, student2.id, org.id, 'Assigned');
  createSubmission(a1, student4.id, org.id, 'Assigned');
  createSubmission(a2, student1.id, org.id, 'Assigned');
  createSubmission(a2, student2.id, org.id, 'Assigned');
  createSubmission(a2, student4.id, org.id, 'Assigned');
  // Class B students
  createSubmission(a3, student1.id, org.id, 'Submitted');
  createSubmission(a3, student3.id, org.id, 'Assigned');
  createSubmission(a3, student5.id, org.id, 'Assigned');
  createSubmission(a4, student1.id, org.id, 'Assigned');
  createSubmission(a4, student3.id, org.id, 'Submitted');
  createSubmission(a4, student5.id, org.id, 'Assigned');
  // Class C students
  createSubmission(a5, student2.id, org.id, 'Assigned');
  createSubmission(a5, student3.id, org.id, 'Assigned');
  createSubmission(a6, student2.id, org.id, 'Submitted');
  createSubmission(a6, student3.id, org.id, 'Assigned');
  console.log('  ✅ all submissions created');

  // ── Attendance (Multiple days with varied statuses) ──
  console.log('\n── Attendance Sessions ──');
  const dates = ['2026-04-22', '2026-04-23', '2026-04-24', '2026-04-25', '2026-04-26'];
  const statuses = {
    // studentId → array of statuses per day
    [student1.id]: ['PRESENT', 'PRESENT', 'ABSENT',  'PRESENT', 'PRESENT'],
    [student2.id]: ['PRESENT', 'ABSENT',  'ABSENT',  'ABSENT',  'PRESENT'],
    [student3.id]: ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'ON_DUTY'],
    [student4.id]: ['ABSENT',  'PRESENT', 'PRESENT', 'ABSENT',  'ABSENT'],
    [student5.id]: ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT'],
  };

  // Class A sessions (students 1,2,4)
  for (let i = 0; i < dates.length; i++) {
    const sessId = createAttendanceSession(classA.id, org.id, `Math Lecture ${dates[i]}`, 'CLOSED');
    createAttendanceRecord(sessId, student1.id, org.id, statuses[student1.id][i]);
    createAttendanceRecord(sessId, student2.id, org.id, statuses[student2.id][i]);
    createAttendanceRecord(sessId, student4.id, org.id, statuses[student4.id][i]);
  }
  // Class B sessions (students 1,3,5)
  for (let i = 0; i < dates.length; i++) {
    const sessId = createAttendanceSession(classB.id, org.id, `Science Lab ${dates[i]}`, 'CLOSED');
    createAttendanceRecord(sessId, student1.id, org.id, statuses[student1.id][i]);
    createAttendanceRecord(sessId, student3.id, org.id, statuses[student3.id][i]);
    createAttendanceRecord(sessId, student5.id, org.id, statuses[student5.id][i]);
  }
  // Class C sessions (students 2,3)
  for (let i = 0; i < dates.length; i++) {
    const sessId = createAttendanceSession(classC.id, org.id, `English Class ${dates[i]}`, 'CLOSED');
    createAttendanceRecord(sessId, student2.id, org.id, statuses[student2.id][i]);
    createAttendanceRecord(sessId, student3.id, org.id, statuses[student3.id][i]);
  }
  console.log('  ✅ 15 sessions × multiple records created');

  // ── Announcements ──
  console.log('\n── Announcements ──');
  createAnnouncement(classA.id, teacher1.id, org.id, 'Welcome to Mathematics! Please bring your textbooks from next class.');
  createAnnouncement(classA.id, teacher1.id, org.id, 'Mid-term exam on May 5th. Chapters 1–4 will be covered.');
  createAnnouncement(classB.id, teacher2.id, org.id, 'Science lab will be in Room 205 this week due to renovations.');
  createAnnouncement(classC.id, teacher3.id, org.id, 'Book club meeting this Friday. Bring "To Kill a Mockingbird".');
  console.log('  ✅ announcements posted');

  // ── Leave Requests ──
  console.log('\n── Leave Requests ──');
  createLeaveRequest(student1.id, classA.id, org.id, 'Medical Leave',       'Doctor appointment',    2, 'LEAVE');
  createLeaveRequest(student2.id, classC.id, org.id, 'Family Emergency',    'Family function',       1, 'LEAVE');
  createLeaveRequest(student4.id, classA.id, org.id, 'Sports Competition',  'Inter-school cricket',  3, 'ON_DUTY');

  // ── School Events ──
  console.log('\n── School Events ──');
  createEvent('Mid-Term Mathematics',   'Exam',       10, 'Chapters 1–4',                   org.id);
  createEvent('Science Fair',           'Event',      15, 'Project submission deadline',     org.id);
  createEvent('Annual Day Rehearsal',   'Activity',    7, 'Rehearsal in auditorium at 3 PM', org.id);
  createEvent('Parent-Teacher Meeting', 'Meeting',    12, 'All parents welcome',             org.id);
  console.log('  ✅ events created');

  // ── Summary ──
  console.log('\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    SEED COMPLETE                             ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  All passwords: Test@1234                                    ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  ADMIN     admin@test.com          All classes (observer)    ║');
  console.log('║  TEACHER1  teacher@test.com         Class A: Mathematics     ║');
  console.log('║  TEACHER2  teacher2@test.com        Class B: Science         ║');
  console.log('║  TEACHER3  teacher3@test.com        Class C: English         ║');
  console.log('║  STUDENT1  student@test.com         Class A + B              ║');
  console.log('║  STUDENT2  student2@test.com        Class A + C              ║');
  console.log('║  STUDENT3  student3@test.com        Class B + C              ║');
  console.log('║  STUDENT4  student4@test.com        Class A                  ║');
  console.log('║  STUDENT5  student5@test.com        Class B                  ║');
  console.log('║  PARENT1   parent@test.com          → Student1 (David)       ║');
  console.log('║  PARENT2   parent2@test.com         → Student2 (Emma)        ║');
  console.log('║  PARENT3   parent3@test.com         → Student3 + Student4    ║');
  console.log('╠══════════════════════════════════════════════════════════════╣');
  console.log('║  3 classes × 5 days attendance, 6 assignments, 4 events     ║');
  console.log('║  3 leave requests, 4 announcements, 16 submissions          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');
}

seed().catch(e => { console.error('❌ Seeder failed:', e); process.exit(1); });
