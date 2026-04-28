import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.resolve(__dirname, 'classroom.sqlite');
const db = new Database(dbPath);

const lastStudent = db.prepare("SELECT id FROM users WHERE role = 'STUDENT' ORDER BY id DESC LIMIT 1").get();
const lastTeacher = db.prepare("SELECT id FROM users WHERE role = 'STAFF' ORDER BY id DESC LIMIT 1").get();

console.log('Last Student:', lastStudent?.id);
console.log('Last Teacher:', lastTeacher?.id);

if (lastStudent) {
    const studentMemberships = db.prepare('SELECT * FROM class_memberships WHERE userId = ?').all(lastStudent.id);
    console.log('Student Memberships:');
    console.table(studentMemberships);
}

if (lastTeacher) {
    const teacherMemberships = db.prepare('SELECT * FROM class_memberships WHERE userId = ?').all(lastTeacher.id);
    console.log('Teacher Memberships:');
    console.table(teacherMemberships);
}

const allMemberships = db.prepare('SELECT * FROM class_memberships ORDER BY id DESC LIMIT 20').all();
console.log('All Memberships (Latest 20):');
console.table(allMemberships);
