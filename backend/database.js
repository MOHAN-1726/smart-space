import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const debugPath = path.resolve(__dirname, 'debug.log');
const isTest = process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'test ';

const dbPath = isTest ? ':memory:' : (process.env.DATABASE_PATH ? path.resolve(__dirname, process.env.DATABASE_PATH) : path.join(__dirname, 'classroom.sqlite'));

console.log(`[DATABASE] Using ${isTest ? 'IN-MEMORY' : dbPath}`);
const db = new Database(dbPath);
db.pragma('foreign_keys = ON');

// Promisified helper for backward compatibility
export const query = async (sql, params = []) => {
  try {
    return db.prepare(sql).all(...params);
  } catch (err) {
    console.error("DATABASE QUERY ERROR:", err.message, "SQL:", sql, "PARAMS:", params);
    throw err;
  }
};

export const get = async (sql, params = []) => {
  try {
    return db.prepare(sql).get(...params);
  } catch (err) {
    console.error("DATABASE GET ERROR:", err.message, "SQL:", sql, "PARAMS:", params);
    throw err;
  }
};

export const run = async (sql, params = []) => {
  try {
    const result = db.prepare(sql).run(...params);
    return { id: result.lastInsertRowid, lastID: result.lastInsertRowid, changes: result.changes };
  } catch (err) {
    console.error("DATABASE RUN ERROR:", err.message, "SQL:", sql, "PARAMS:", params);
    throw err;
  }
};

export default db;

// Initialize Database
export async function initDatabase() {
  // Organizations
  await run(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      domain TEXT UNIQUE,
      isDeleted BOOLEAN DEFAULT 0,
      createdAt TEXT
    )`);

  // Users
  await run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT,
      role TEXT NOT NULL,
      organizationId TEXT,
      photoUrl TEXT,
      isDeleted BOOLEAN DEFAULT 0,
      isActive BOOLEAN DEFAULT 1,
      refreshToken TEXT,
      createdAt TEXT,
      FOREIGN KEY(organizationId) REFERENCES organizations(id)
    )`);

  // Parent-Student Relationships
  await run(`
    CREATE TABLE IF NOT EXISTS parent_student_relationships (
      id TEXT PRIMARY KEY,
      parentId TEXT NOT NULL,
      studentId TEXT NOT NULL,
      relation TEXT, -- father, mother, guardian
      organizationId TEXT,
      createdAt TEXT,
      FOREIGN KEY(parentId) REFERENCES users(id),
      FOREIGN KEY(studentId) REFERENCES users(id),
      FOREIGN KEY(organizationId) REFERENCES organizations(id)
    )`);

  // Real-time Messages
  await run(`
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      senderId TEXT NOT NULL,
      receiverId TEXT NOT NULL,
      content TEXT NOT NULL,
      isRead BOOLEAN DEFAULT 0,
      createdAt TEXT,
      FOREIGN KEY(senderId) REFERENCES users(id),
      FOREIGN KEY(receiverId) REFERENCES users(id)
    )`);

  // Classes
  await run(`
    CREATE TABLE IF NOT EXISTS classes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      section TEXT,
      subject TEXT,
      room TEXT,
      description TEXT,
      ownerId TEXT NOT NULL,
      organizationId TEXT,
      enrollmentCode TEXT UNIQUE,
      theme TEXT,
      isDeleted BOOLEAN DEFAULT 0,
      createdAt TEXT,
      FOREIGN KEY(ownerId) REFERENCES users(id),
      FOREIGN KEY(organizationId) REFERENCES organizations(id)
    )`);

  // Class Memberships
  await run(`
    CREATE TABLE IF NOT EXISTS class_memberships (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      classId TEXT NOT NULL,
      role TEXT NOT NULL,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(classId) REFERENCES classes(id)
    )`);

  // Assignments
  await run(`
    CREATE TABLE IF NOT EXISTS assignments (
      id TEXT PRIMARY KEY,
      classId TEXT NOT NULL,
      title TEXT NOT NULL,
      instructions TEXT,
      topic TEXT,
      points INTEGER,
      dueDate TEXT,
      createdBy TEXT,
      organizationId TEXT,
      type TEXT DEFAULT 'ASSIGNMENT',
      isDeleted BOOLEAN DEFAULT 0,
      createdAt TEXT,
      FOREIGN KEY(classId) REFERENCES classes(id),
      FOREIGN KEY(organizationId) REFERENCES organizations(id)
    )`);

  // Migration: Add type column if it doesn't exist
  try {
    const tableInfo = await query("PRAGMA table_info(assignments)");
    if (!tableInfo.find(col => col.name === 'type')) {
      await run("ALTER TABLE assignments ADD COLUMN type TEXT DEFAULT 'ASSIGNMENT'");
    }
  } catch (err) {
    console.error("Migration failed:", err);
  }

  // Attachments
  await run(`
    CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY,
        parentId TEXT NOT NULL,
        parentType TEXT NOT NULL,
        name TEXT,
        url TEXT,
        size INTEGER,
        type TEXT 
    )`);

  // Submissions
  await run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id TEXT PRIMARY KEY,
      assignmentId TEXT NOT NULL,
      studentId TEXT NOT NULL,
      organizationId TEXT,
      status TEXT NOT NULL,
      grade INTEGER,
      feedback TEXT,
      submittedAt TEXT,
      isDeleted BOOLEAN DEFAULT 0,
      FOREIGN KEY(assignmentId) REFERENCES assignments(id),
      FOREIGN KEY(studentId) REFERENCES users(id),
      FOREIGN KEY(organizationId) REFERENCES organizations(id)
    )`);

  // Refresh Tokens
  await run(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      organizationId TEXT,
      token TEXT UNIQUE,
      expiresAt TEXT,
      revoked BOOLEAN DEFAULT 0,
      createdAt TEXT,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(organizationId) REFERENCES organizations(id)
    )`);

  // Audit Logs
  await run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT,
      entityType TEXT,
      entityId TEXT,
      userId TEXT,
      role TEXT,
      organizationId TEXT,
      ipAddress TEXT,
      details TEXT,
      timestamp TEXT,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(organizationId) REFERENCES organizations(id)
    )`);

  // Announcements
  await run(`
    CREATE TABLE IF NOT EXISTS announcements (
      id TEXT PRIMARY KEY,
      classId TEXT NOT NULL,
      authorId TEXT NOT NULL,
      organizationId TEXT,
      content TEXT,
      isDeleted BOOLEAN DEFAULT 0,
      createdAt TEXT,
      FOREIGN KEY(classId) REFERENCES classes(id),
      FOREIGN KEY(authorId) REFERENCES users(id),
      FOREIGN KEY(organizationId) REFERENCES organizations(id)
    )`);

  // Comments
  await run(`
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      parentId TEXT NOT NULL,
      authorId TEXT NOT NULL,
      organizationId TEXT,
      content TEXT,
      isDeleted BOOLEAN DEFAULT 0,
      createdAt TEXT,
      FOREIGN KEY(authorId) REFERENCES users(id),
      FOREIGN KEY(organizationId) REFERENCES organizations(id)
    )`);

  // Attendance Sessions
  await run(`
    CREATE TABLE IF NOT EXISTS attendance_sessions (
      id TEXT PRIMARY KEY,
      classId TEXT NOT NULL,
      organizationId TEXT,
      startTime TEXT NOT NULL,
      endTime TEXT,
      description TEXT,
      status TEXT,
      isDeleted BOOLEAN DEFAULT 0,
      createdAt TEXT,
      FOREIGN KEY(classId) REFERENCES classes(id),
      FOREIGN KEY(organizationId) REFERENCES organizations(id)
    )`);

  // Attendance Records
  await run(`
    CREATE TABLE IF NOT EXISTS attendance_records (
      id TEXT PRIMARY KEY,
      sessionId TEXT NOT NULL,
      studentId TEXT NOT NULL,
      organizationId TEXT,
      status TEXT,
      joinedAt TEXT,
      isDeleted BOOLEAN DEFAULT 0,
      createdAt TEXT,
      FOREIGN KEY(sessionId) REFERENCES attendance_sessions(id),
      FOREIGN KEY(studentId) REFERENCES users(id),
      FOREIGN KEY(organizationId) REFERENCES organizations(id)
    )`);

  // Leave Requests
  await run(`
    CREATE TABLE IF NOT EXISTS leave_requests (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      classId TEXT NOT NULL,
      organizationId TEXT,
      subject TEXT,
      fromDate TEXT NOT NULL,
      toDate TEXT NOT NULL,
      type TEXT NOT NULL,
      studyType TEXT,
      reason TEXT,
      documentUrl TEXT,
      status TEXT NOT NULL,
      staffRemarks TEXT,
      reviewedBy TEXT,
      reviewedAt TEXT,
      isDeleted BOOLEAN DEFAULT 0,
      createdAt TEXT,
      FOREIGN KEY(studentId) REFERENCES users(id),
      FOREIGN KEY(classId) REFERENCES classes(id),
      FOREIGN KEY(reviewedBy) REFERENCES users(id),
      FOREIGN KEY(organizationId) REFERENCES organizations(id)
    )`);

  // Migration: Add parentId, isActive, and refreshToken to users
  try {
    const tableInfo = await query("PRAGMA table_info(users)");
    if (!tableInfo.find(col => col.name === 'parentId')) {
      await run("ALTER TABLE users ADD COLUMN parentId TEXT REFERENCES users(id)");
    }
    if (!tableInfo.find(col => col.name === 'isActive')) {
      await run("ALTER TABLE users ADD COLUMN isActive BOOLEAN DEFAULT 1");
    }
    if (!tableInfo.find(col => col.name === 'refreshToken')) {
      await run("ALTER TABLE users ADD COLUMN refreshToken TEXT");
    }
    if (!tableInfo.find(col => col.name === 'phoneNumber')) {
      await run("ALTER TABLE users ADD COLUMN phoneNumber TEXT");
    }
  } catch (err) {
    console.error("Migration (users security upgrade) failed:", err);
  }

  // Migration: Add parent approval fields to leave_requests
  try {
    const tableInfo = await query("PRAGMA table_info(leave_requests)");
    if (!tableInfo.find(col => col.name === 'parentApprovalStatus')) {
      await run("ALTER TABLE leave_requests ADD COLUMN parentApprovalStatus TEXT DEFAULT 'PENDING'");
    }
    if (!tableInfo.find(col => col.name === 'parentRemarks')) {
      await run("ALTER TABLE leave_requests ADD COLUMN parentRemarks TEXT");
    }
  } catch (err) {
    console.error("Migration (leave_requests parent approval) failed:", err);
  }

  // Migration: Add remarks to attendance_records
  try {
    const tableInfo = await query("PRAGMA table_info(attendance_records)");
    if (!tableInfo.find(col => col.name === 'remarks')) {
      await run("ALTER TABLE attendance_records ADD COLUMN remarks TEXT");
    }
  } catch (err) {
    console.error("Migration (attendance_records.remarks) failed:", err);
  }

  // School Events
  await run(`
    CREATE TABLE IF NOT EXISTS school_events (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      targetClassId TEXT,
      organizationId TEXT,
      createdAt TEXT,
      FOREIGN KEY(targetClassId) REFERENCES classes(id),
      FOREIGN KEY(organizationId) REFERENCES organizations(id)
    )`);

  // Notifications
  await run(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      role TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT,
      isRead BOOLEAN DEFAULT 0,
      link TEXT,
      organizationId TEXT,
      createdAt TEXT,
      FOREIGN KEY(userId) REFERENCES users(id),
      FOREIGN KEY(organizationId) REFERENCES organizations(id)
    )`);

  // Performance Records
  await run(`
    CREATE TABLE IF NOT EXISTS performance_records (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      subject TEXT NOT NULL,
      score REAL,
      maxScore REAL,
      type TEXT NOT NULL, -- ASSIGNMENT or TEST
      date TEXT,
      organizationId TEXT,
      createdAt TEXT,
      FOREIGN KEY(studentId) REFERENCES users(id),
      FOREIGN KEY(organizationId) REFERENCES organizations(id)
    )`);

  // Leave Documents
  await run(`
    CREATE TABLE IF NOT EXISTS leave_documents (
      id TEXT PRIMARY KEY,
      leaveRequestId TEXT NOT NULL,
      name TEXT,
      url TEXT,
      organizationId TEXT,
      createdAt TEXT,
      FOREIGN KEY(leaveRequestId) REFERENCES leave_requests(id),
      FOREIGN KEY(organizationId) REFERENCES organizations(id)
    )`);

  // No-Due Requests
  await run(`
    CREATE TABLE IF NOT EXISTS no_due_requests (
      id TEXT PRIMARY KEY,
      studentId TEXT NOT NULL,
      organizationId TEXT,
      reason TEXT,
      status TEXT DEFAULT 'PENDING', -- PENDING, TEACHER_APPROVED, COMPLETED, REJECTED
      teacherReviewedBy TEXT,
      teacherReviewedAt TEXT,
      teacherRemarks TEXT,
      adminReviewedBy TEXT,
      adminReviewedAt TEXT,
      adminRemarks TEXT,
      isDeleted BOOLEAN DEFAULT 0,
      createdAt TEXT,
      FOREIGN KEY(studentId) REFERENCES users(id),
      FOREIGN KEY(teacherReviewedBy) REFERENCES users(id),
      FOREIGN KEY(adminReviewedBy) REFERENCES users(id),
      FOREIGN KEY(organizationId) REFERENCES organizations(id)
    )`);
  try {
    const tableInfo = await query("PRAGMA table_info(leave_requests)");
    if (!tableInfo.find(col => col.name === 'parentApprovalStatus')) {
      await run("ALTER TABLE leave_requests ADD COLUMN parentApprovalStatus TEXT DEFAULT 'PENDING'");
    }
  } catch (err) {
    console.error("Migration (leave_requests.parentApprovalStatus) failed:", err);
  }

  // Migration: Add color to school_events
  try {
    const tableInfo = await query("PRAGMA table_info(school_events)");
    if (!tableInfo.find(col => col.name === 'color')) {
      await run("ALTER TABLE school_events ADD COLUMN color TEXT");
    }
  } catch (err) {
    console.error("Migration (school_events.color) failed:", err);
  }

  // Performance Indices for Attendance
  await run('CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records (studentId, status)');
  await run('CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON attendance_records (sessionId)');
  await run('CREATE INDEX IF NOT EXISTS idx_attendance_sessions_class_date ON attendance_sessions (classId, startTime)');
  await run('CREATE INDEX IF NOT EXISTS idx_attendance_records_org_date ON attendance_records (organizationId, createdAt)');
  await run('CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (userId, isRead, createdAt)');

  // Migration: Add unique constraint index for duplicate session prevention
  await run('CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_sessions_unique_class_desc ON attendance_sessions (classId, description) WHERE isDeleted = 0');

  // No default data seeded automatically in this environment
}
