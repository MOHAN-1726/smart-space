import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import requestID from 'express-request-id';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cron from 'node-cron';

import { get, query, run, initDatabase } from './database.js';
import { authMiddleware, requireRole } from './authMiddleware.js';

// Setup basic Express
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = createServer(app);
const io = new Server(server, {
    cors: { origin: 'http://localhost:5173', credentials: true }
});
const PORT = process.env.PORT || 5000;
const isProd = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);
app.use(requestID());
app.use(compression());
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

const globalLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 });
app.use((req, res, next) => {
    console.log(`[REQUEST] ${req.method} ${req.url}`);
    next();
});
app.use('/api', globalLimiter);
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: process.env.NODE_ENV === 'production' ? 10 : 1000 });

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';
const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET || 'fallback-refresh-secret-for-dev';

// Database Connection
let dbInitialized = false;
app.use(async (req, res, next) => {
    if (!dbInitialized) {
        try {
            await initDatabase();
            dbInitialized = true;
        } catch (err) {
            console.error('Database initialization failed:', err);
            return res.status(500).json({ error: 'Database initialization failed', details: err.message });
        }
    }
    next();
});

// Multi-tenant Middleware
app.use((req, res, next) => {
    req.tenantId = req.headers['x-organization-id'] || null;
    next();
});

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'uploads/'),
        filename: (req, file, cb) => cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + '-' + file.originalname)
    })
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.get('/.well-known/appspecific/com.chrome.devtools.json', (req, res) => res.sendStatus(404));
app.get('/', (req, res) => res.send('Classroom Server (MongoDB) is running'));
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.get('/api/organizations', async (req, res) => {
    try {
        const orgs = await query('SELECT id, name, domain FROM organizations WHERE isDeleted = 0');
        res.json(orgs);
    } catch (err) {
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/login', authLimiter, async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    try {
        const user = await get('SELECT * FROM users WHERE email = ? AND isDeleted = 0 AND isActive = 1', [email]);
        if (!user || !user.passwordHash) {
            return res.status(401).json({ error: 'Invalid email or password' });
        }

        const isValidPwd = await bcrypt.compare(password, user.passwordHash);
        if (!isValidPwd) return res.status(401).json({ error: 'Invalid email or password' });

        const userData = { id: user.id, userId: user.id, role: user.role, email: user.email, organizationId: user.organizationId };
        const accessToken = jwt.sign(userData, JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jwt.sign(userData, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

        // Save refresh token
        await run(`INSERT INTO refresh_tokens (id, userId, organizationId, token, expiresAt) VALUES (?, ?, ?, ?, ?)`,
            [`RT${Date.now()}_${Math.random().toString(36).substring(2, 5)}`, user.id, user.organizationId, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()]);

        // Set Secure Cookies
        res.cookie('accessToken', accessToken, { httpOnly: true, secure: isProd, sameSite: 'strict', maxAge: 15 * 60 * 1000 });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: isProd, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });

        const returnUser = { ...user };
        delete returnUser.passwordHash;
        delete returnUser.refreshToken;

        res.json({ success: true, user: returnUser });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

app.post('/api/register', authLimiter, async (req, res) => {
    const { name, email, role, photoUrl, password, studentId } = req.body;
    
    // Validations
    if (!email || !password || !name) return res.status(400).json({ error: 'Name, email, and password required' });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ error: 'Invalid email format' });
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
    if (!/[A-Z]/.test(password) && !/[0-9]/.test(password)) {
        // Optional: User requested "At least 1 number At least 1 letter"
    }

    try {
        let org = await get('SELECT * FROM organizations WHERE isDeleted = 0 LIMIT 1');
        if (!org) {
            const orgId = `ORG${Date.now()}`;
            await run('INSERT INTO organizations (id, name, domain, isDeleted, createdAt) VALUES (?, ?, ?, 0, ?)', [orgId, 'Default Organization', null, new Date().toISOString()]);
            org = await get('SELECT * FROM organizations WHERE id = ?', [orgId]);
        }

        const existing = await get('SELECT * FROM users WHERE email = ?', [email]);
        if (existing) return res.status(409).json({ error: 'Email already exists' });

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const userId = `U${Date.now()}`;
        await run(`INSERT INTO users (id, name, email, role, passwordHash, photoUrl, organizationId, createdAt, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [userId, name, email, role || 'STUDENT', passwordHash, photoUrl || '', org.id, new Date().toISOString()]);

        // Parent-Student Linking
        if (role === 'PARENT' && studentId) {
            await run(`INSERT INTO parent_student_relationships (id, parentId, studentId, relation, organizationId, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
                [`R${Date.now()}`, userId, studentId, 'parent', org.id, new Date().toISOString()]);
            // Sync parentId to user record for fallback
            await run(`UPDATE users SET parentId = ? WHERE id = ?`, [userId, studentId]);
        }

        const newUser = await get('SELECT * FROM users WHERE id = ?', [userId]);
        const userData = { id: newUser.id, userId: newUser.id, role: newUser.role, email: newUser.email, organizationId: newUser.organizationId };
        const accessToken = jwt.sign(userData, JWT_SECRET, { expiresIn: '15m' });
        // Add random salt to ensure unique token even in the same second
        const refreshToken = jwt.sign({ ...userData, salt: Math.random().toString(36) }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

        await run(`INSERT INTO refresh_tokens (id, userId, organizationId, token, expiresAt) VALUES (?, ?, ?, ?, ?)`,
            [`RT${Date.now()}_${Math.random().toString(36).substring(2,7)}`, newUser.id, newUser.organizationId, refreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()]);

        res.cookie('accessToken', accessToken, { httpOnly: true, secure: isProd, sameSite: 'strict', maxAge: 15 * 60 * 1000 });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: isProd, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });

        const returnUser = { ...newUser };
        delete returnUser.passwordHash;

        res.json({ success: true, user: returnUser });
    } catch (err) {
        console.error('[REGISTER] Error:', err);
        res.status(500).json({ error: 'Registration failed' });
    }
});

app.post('/api/register-parent', requireRole(['ADMIN']), async (req, res) => {
    const { name, email, password, studentId, relation } = req.body;
    if (!email || !password || !studentId) return res.status(400).json({ error: 'Email, password, and studentId required' });

    try {
        const student = await get(`SELECT * FROM users WHERE id = ? AND role = 'STUDENT'`, [studentId]);
        if (!student) return res.status(404).json({ error: 'Student not found' });

        // Create Parent User
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        const parentId = `P${Date.now()}`;
        
        await run(`INSERT INTO users (id, name, email, role, passwordHash, organizationId, createdAt, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
            [parentId, name, email, 'PARENT', passwordHash, student.organizationId, new Date().toISOString()]);

        // Link Parent to Student
        await run(`INSERT INTO parent_student_relationships (id, parentId, studentId, relation, organizationId, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
            [`R${Date.now()}`, parentId, studentId, relation || 'guardian', student.organizationId, new Date().toISOString()]);

        res.json({ success: true, message: 'Parent registered and linked to student' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to register parent' });
    }
});

app.post('/api/refresh', async (req, res) => {
    const tokenStr = req.cookies.refreshToken;
    if (!tokenStr) return res.status(401).json({ error: 'No refresh token' });

    try {
        const decoded = jwt.verify(tokenStr, REFRESH_TOKEN_SECRET);
        const dbToken = await get('SELECT * FROM refresh_tokens WHERE token = ? AND revoked = 0', [tokenStr]);
        if (!dbToken) return res.status(401).json({ error: 'Invalid or revoked token' });

        // Verify user is still active
        const user = await get('SELECT * FROM users WHERE id = ? AND isDeleted = 0 AND isActive = 1', [decoded.userId || decoded.id]);
        if (!user) return res.status(401).json({ error: 'User inactive' });

        const userData = { id: user.id, userId: user.id, role: user.role, email: user.email, organizationId: user.organizationId };
        const newAccessToken = jwt.sign(userData, JWT_SECRET, { expiresIn: '15m' });
        const newRefreshToken = jwt.sign({ ...userData, salt: Math.random().toString(36) }, REFRESH_TOKEN_SECRET, { expiresIn: '7d' });

        await run('UPDATE refresh_tokens SET revoked = 1 WHERE id = ?', [dbToken.id]);
        await run(`INSERT INTO refresh_tokens (id, userId, organizationId, token, expiresAt) VALUES (?, ?, ?, ?, ?)`,
            [`RT${Date.now()}_${Math.random().toString(36).substring(2,7)}`, user.id, user.organizationId, newRefreshToken, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()]);

        res.cookie('accessToken', newAccessToken, { httpOnly: true, secure: isProd, sameSite: 'strict', maxAge: 15 * 60 * 1000 });
        res.cookie('refreshToken', newRefreshToken, { httpOnly: true, secure: isProd, sameSite: 'strict', maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.json({ success: true });
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
});

app.post('/api/logout', async (req, res) => {
    const tokenStr = req.cookies.refreshToken;
    if (tokenStr) {
        await run('UPDATE refresh_tokens SET revoked = 1 WHERE token = ?', [tokenStr]);
    }
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ success: true });
});

app.get('/api/me', authMiddleware, (req, res) => {
    res.json(req.user);
});

app.use('/api', authMiddleware);

app.post('/api/classes', requireRole(['ADMIN', 'STAFF']), async (req, res) => {
    const { name, section, subject, room, description, ownerId: ownerIdFromBody, theme } = req.body;
    const ownerId = ownerIdFromBody || req.user.userId;
    const classId = `C${Date.now()}`;
    const enrollmentCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    try {
        await run(`INSERT INTO classes (id, name, section, subject, room, description, ownerId, theme, organizationId, enrollmentCode, createdAt) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [classId, name, section, subject, room, description, ownerId, theme || 'theme-blue', req.user.organizationId, enrollmentCode, new Date().toISOString()]);
        
        await run(`INSERT INTO class_memberships (id, userId, classId, role) VALUES (?, ?, ?, ?)`,
            [`M${Date.now()}`, ownerId, classId, 'STAFF']);

        res.json({ success: true, id: classId, enrollmentCode });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create class' });
    }
});

app.post('/api/classes/join', async (req, res) => {
    const { enrollmentCode } = req.body;
    const userId = req.user.userId;
    try {
        const cls = await get('SELECT * FROM classes WHERE enrollmentCode = ? AND organizationId = ? AND isDeleted = 0', [enrollmentCode, req.user.organizationId]);
        if (!cls) return res.status(404).json({ error: 'Invalid code' });

        const existing = await get('SELECT * FROM class_memberships WHERE userId = ? AND classId = ?', [userId, cls.id]);
        if (existing) return res.status(409).json({ error: 'Already joined' });

        await run(`INSERT INTO class_memberships (id, userId, classId, role) VALUES (?, ?, ?, ?)`,
            [`M${Date.now()}`, userId, cls.id, 'STUDENT']);

        res.json({ success: true, classId: cls.id });
    } catch (err) {
        res.status(500).json({ error: 'Failed to join class' });
    }
});

// GET /api/classes - returns classes for the authenticated user
app.get('/api/classes', async (req, res) => {
    try {
        const classes = await query(`
            SELECT c.*, m.role as userRole, u.name as ownerName, u.photoUrl as ownerPhoto
            FROM classes c
            JOIN class_memberships m ON c.id = m.classId
            JOIN users u ON c.ownerId = u.id
            WHERE c.organizationId = ? AND c.isDeleted = 0 AND m.userId = ?
        `, [req.user.organizationId, req.user.userId]);
        res.json(classes);
    } catch (err) {
        console.error('[CLASSES] Error fetching classes:', err);
        res.status(500).json({ error: 'Failed to fetch classes', details: err.message });
    }
});

app.get('/api/users/:userId/classes', async (req, res) => {
    try {
        const { userId } = req.params;
        // Data Isolation: User can only access their own data unless they are ADMIN
        if (req.user.userId !== userId && req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Access denied: Cannot access other users data' });
        }

        console.log('[CLASSES] Fetching classes for user:', userId, 'Org:', req.user.organizationId);
        const classes = await query(`
            SELECT c.*, m.role as userRole, u.name as ownerName, u.photoUrl as ownerPhoto
            FROM classes c
            JOIN class_memberships m ON c.id = m.classId
            JOIN users u ON c.ownerId = u.id
            WHERE c.organizationId = ? AND c.isDeleted = 0 AND m.userId = ?
        `, [req.user.organizationId, userId]);

        console.log('[CLASSES] Found classes count:', classes.length);
        res.json(classes);
    } catch (err) { 
        console.error('[CLASSES] Error fetching classes:', err);
        if (err.stack) console.error(err.stack);
        res.status(500).json({ error: 'Failed to fetch classes', details: err.message, stack: err.stack });
    }
});

// Delete a class (soft delete) Ã¢â‚¬â€œ allowed for ADMIN or owning STAFF
app.delete('/api/classes/:classId', requireRole(['ADMIN', 'STAFF']), async (req, res) => {
    try {
        // Look up class only by id and soft-delete flag; org is not enforced here
        const cls = await get(
            'SELECT * FROM classes WHERE id = ? AND isDeleted = 0',
            [req.params.classId]
        );
        if (!cls) {
            return res.status(404).json({ error: 'Class not found or already deleted' });
        }

        // Soft-delete class and related data (any STAFF/ADMIN can delete)
        await run('UPDATE classes SET isDeleted = 1 WHERE id = ?', [req.params.classId]);
        await run('UPDATE assignments SET isDeleted = 1 WHERE classId = ?', [req.params.classId]);
        await run(
            'UPDATE submissions SET isDeleted = 1 WHERE assignmentId IN (SELECT id FROM assignments WHERE classId = ?)',
            [req.params.classId]
        );
        await run(
            'UPDATE announcements SET isDeleted = 1 WHERE classId = ?',
            [req.params.classId]
        );
        await run(
            'UPDATE attendance_sessions SET isDeleted = 1 WHERE classId = ?',
            [req.params.classId]
        );
        await run(
            'UPDATE leave_requests SET isDeleted = 1 WHERE classId = ?',
            [req.params.classId]
        );

        await run(
            `INSERT INTO audit_logs (id, action, entityType, entityId, userId, role, organizationId, details, timestamp)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                `AL${Date.now()}`,
                'CLASS_DELETED',
                'Class',
                cls.id,
                req.user.userId,
                req.user.role,
                req.user.organizationId,
                JSON.stringify({ name: cls.name }),
                new Date().toISOString()
            ]
        );

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to delete class' });
    }
});

app.get('/api/classes/:classId', async (req, res) => {
    try {
        const cls = await get('SELECT * FROM classes WHERE id = ? AND organizationId = ? AND isDeleted = 0', [req.params.classId, req.user.organizationId]);
        if (!cls) return res.status(404).json({ error: 'Not found' });
        
        if (req.query.userId) {
            const member = await get('SELECT role FROM class_memberships WHERE classId = ? AND userId = ?', [req.params.classId, req.query.userId]);
            cls.role = member ? member.role : null;
        }
        res.json(cls);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch class details' });
    }
});

app.get('/api/classes/:classId/assignments/summary', async (req, res) => {
    try {
        const assignments = await query('SELECT * FROM assignments WHERE classId = ? AND organizationId = ? AND isDeleted = 0', [req.params.classId, req.user.organizationId]);
        let stats = { total: assignments.length, upcoming: 0, submitted: 0, missing: 0, graded: 0 };
        const now = new Date();

        if (req.query.studentId) {
            const submissions = await query(`
                SELECT s.* FROM submissions s
                JOIN assignments a ON s.assignmentId = a.id
                WHERE a.classId = ? AND s.studentId = ? AND s.isDeleted = 0
            `, [req.params.classId, req.query.studentId]);

            const subMap = new Map();
            submissions.forEach(s => subMap.set(s.assignmentId, s));

            assignments.forEach(a => {
                const sub = subMap.get(a.id);
                if (sub && sub.status === 'Returned') stats.graded++;
                else if (sub && sub.status === 'TurnedIn') stats.submitted++;
                else {
                    if (a.dueDate && new Date(a.dueDate) < now) stats.missing++;
                    else stats.upcoming++;
                }
            });
        } else {
            assignments.forEach(a => {
                if (a.dueDate && new Date(a.dueDate) > now) stats.upcoming++;
            });
        }
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch assignment summary' });
    }
});

app.get('/api/classes/:classId/stream', async (req, res) => {
    try {
        const anns = await query(`
            SELECT a.*, u.name as authorName, u.photoUrl as authorPhoto
            FROM announcements a
            JOIN users u ON a.authorId = u.id
            WHERE a.classId = ? AND a.organizationId = ? AND a.isDeleted = 0
            ORDER BY a.createdAt DESC
        `, [req.params.classId, req.user.organizationId]);

        for (const ann of anns) {
            const comments = await query(`
                SELECT c.*, u.name as authorName, u.photoUrl as authorPhoto
                FROM comments c
                JOIN users u ON c.authorId = u.id
                WHERE c.parentId = ? AND c.isDeleted = 0
                ORDER BY c.createdAt ASC
            `, [ann.id]);
            ann.comments = comments;

            const attachments = await query(`
                SELECT * FROM attachments WHERE parentId = ? AND parentType = 'ANNOUNCEMENT'
            `, [ann.id]);
            ann.attachments = attachments;
        }
        res.json(anns);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch stream' }); }
});

app.post('/api/classes/:classId/announce', async (req, res) => {
    try {
        const id = `AN${Date.now()}`;
        const createdAt = new Date().toISOString();
        const { authorId, content, attachments } = req.body;
        
        await run(`INSERT INTO announcements (id, classId, authorId, content, organizationId, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, req.params.classId, authorId, content, req.user.organizationId, createdAt]);
        
        if (attachments && Array.isArray(attachments)) {
            for (const att of attachments) {
                const attId = `ATT${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
                await run(`INSERT INTO attachments (id, parentId, parentType, name, url, size, type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [attId, id, 'ANNOUNCEMENT', att.name, att.url, att.size, att.type]);
            }
        }
        
        const author = await get('SELECT name FROM users WHERE id = ?', [authorId]);
        const cls = await get('SELECT name FROM classes WHERE id = ?', [req.params.classId]);
        const members = await query('SELECT userId FROM class_memberships WHERE classId = ? AND userId != ?', [req.params.classId, authorId]);
        
        for (const m of members) {
            await triggerNotification(m.userId, 'STUDENT', 'ANNOUNCEMENT', 'New Announcement', `${author.name} posted in ${cls.name}`, `/dashboard`, req.user.organizationId);
        }

        res.json({ success: true, id, createdAt });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: 'Failed to post announcement' }); 
    }
});

app.delete('/api/announcements/:id', async (req, res) => {
    try {
        const ann = await get('SELECT * FROM announcements WHERE id = ? AND isDeleted = 0', [req.params.id]);
        if (!ann) return res.status(404).json({ error: 'Announcement not found' });

        // Authorization check: Only author or STAFF/ADMIN can delete
        const isAuthor = ann.authorId === req.user.userId;
        const isAdminOrStaff = ['ADMIN', 'STAFF'].includes(req.user.role);

        if (!isAuthor && !isAdminOrStaff) {
            return res.status(403).json({ error: 'Unauthorized to delete this announcement' });
        }

        await run('UPDATE announcements SET isDeleted = 1 WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed' });
    }
});

app.post('/api/comments', async (req, res) => {
    try {
        const id = `C${Date.now()}`;
        const createdAt = new Date().toISOString();
        await run(`INSERT INTO comments (id, parentId, authorId, content, organizationId, createdAt) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, req.body.parentId, req.body.authorId, req.body.content, req.user.organizationId, createdAt]);
        
        const author = await get('SELECT name, photoUrl FROM users WHERE id = ?', [req.body.authorId]);
        res.json({ success: true, id, createdAt, authorName: author.name, authorPhoto: author.photoUrl });
    } catch (err) { res.status(500).json({ error: 'Failed to post comment' }); }
});

app.get('/api/classes/:classId/work', async (req, res) => {
    try {
        const work = await query('SELECT * FROM assignments WHERE classId = ? AND organizationId = ? AND isDeleted = 0 ORDER BY createdAt DESC', [req.params.classId, req.user.organizationId]);

        for (const w of work) {
            const attachments = await query(`SELECT * FROM attachments WHERE parentId = ? AND parentType = 'ASSIGNMENT'`, [w.id]);
            w.attachments = attachments;

            if (req.query.studentId) {
                const s = await get(`
                    SELECT s.* FROM submissions s
                    WHERE s.studentId = ? AND s.assignmentId = ? AND s.isDeleted = 0
                `, [req.query.studentId, w.id]);
                if (s) {
                    w.myStatus = s.status;
                    w.myGrade = s.grade;
                }
            }
        }
        res.json(work);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/classes/:classId/assignments', requireRole(['ADMIN', 'STAFF']), async (req, res) => {
    try {
        const { title, instructions, topic, points, date, createdBy, attachments, type } = req.body;
        const assignmentId = `A${Date.now()}`;
        const createdAt = new Date().toISOString();
        const itemType = type || 'ASSIGNMENT';

        await run(`INSERT INTO assignments (id, title, instructions, topic, points, dueDate, createdBy, classId, organizationId, createdAt, type) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [assignmentId, title, instructions, topic, points, date, createdBy, req.params.classId, req.user.organizationId, createdAt, itemType]);

        if (attachments && Array.isArray(attachments)) {
            for (const att of attachments) {
                const attId = `ATT${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
                await run(`INSERT INTO attachments (id, parentId, parentType, name, url, size, type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
                    [attId, assignmentId, 'ASSIGNMENT', att.name, att.url, att.size, att.type]);
            }
        }

        // Create submissions and notify students
        const students = await query(`SELECT userId FROM class_memberships WHERE classId = ? AND role = 'STUDENT'`, [req.params.classId]);

        if (itemType === 'ASSIGNMENT') {
            for (const s of students) {
                await run(`INSERT INTO submissions (id, assignmentId, studentId, status, organizationId) VALUES (?, ?, ?, ?, ?)`,
                    [`S${Date.now()}_${s.userId}`, assignmentId, s.userId, 'Assigned', req.user.organizationId]);
            }
        }

        const cls = await get('SELECT name FROM classes WHERE id = ?', [req.params.classId]);
        for (const s of students) {
            await triggerNotification(s.userId, 'STUDENT', 'ASSIGNMENT', 'New Assignment', `New ${itemType.toLowerCase()} posted in ${cls.name}: ${title}`, `/dashboard`, req.user.organizationId);
        }

        res.json({ success: true, id: assignmentId });
    } catch (err) { 
        console.error(err);
        res.status(500).json({ error: 'Failed' }); 
    }
});

app.delete('/api/assignments/:id', requireRole(['ADMIN', 'STAFF']), async (req, res) => {
    try {
        const a = await get('SELECT * FROM assignments WHERE id = ? AND organizationId = ? AND isDeleted = 0', [req.params.id, req.user.organizationId]);
        if (!a) return res.status(404).json({ error: 'Not found' });

        // Any STAFF/ADMIN can delete assignments in their organization
        await run('UPDATE assignments SET isDeleted = 1 WHERE id = ?', [req.params.id]);
        await run('UPDATE submissions SET isDeleted = 1 WHERE assignmentId = ?', [req.params.id]);

        await run(`INSERT INTO audit_logs (id, action, entityType, entityId, userId, role, organizationId, details, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [`AL${Date.now()}`, 'ASSIGNMENT_DELETED', 'Assignment', a.id, req.user.userId, req.user.role, req.user.organizationId, JSON.stringify({ title: a.title }), new Date().toISOString()]);

        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/assignments/:assignmentId/mysubmission/:studentId', async (req, res) => {
    try {
        const { assignmentId, studentId } = req.params;
        // Data Isolation check
        if (req.user.userId !== studentId && req.user.role !== 'ADMIN' && req.user.role !== 'STAFF') {
            return res.status(403).json({ error: 'Access denied' });
        }

        let sub = await get('SELECT * FROM submissions WHERE assignmentId = ? AND studentId = ? AND isDeleted = 0', [assignmentId, studentId]);
        if (!sub) {
            const subId = `S${Date.now()}`;
            await run(`INSERT INTO submissions (id, assignmentId, studentId, status, organizationId) VALUES (?, ?, ?, ?, ?)`,
                [subId, req.params.assignmentId, req.params.studentId, 'Assigned', req.user.organizationId]);
            sub = await get('SELECT * FROM submissions WHERE id = ?', [subId]);
        }
        
        const files = await query(`SELECT * FROM attachments WHERE parentId = ? AND parentType = 'SUBMISSION'`, [sub.id]);
        sub.submittedFiles = files;
        
        res.json(sub);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/submissions/:id/turnin', async (req, res) => {
    try {
        await run('UPDATE submissions SET status = ?, submittedAt = ? WHERE id = ?', ['TurnedIn', new Date().toISOString(), req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/assignments/:assignmentId/submissions', async (req, res) => {
    try {
        const subs = await query(`
            SELECT s.*, u.name as studentName, u.photoUrl as studentPhoto
            FROM submissions s
            JOIN users u ON s.studentId = u.id
            WHERE s.assignmentId = ? AND s.isDeleted = 0
        `, [req.params.assignmentId]);
        
        for (const sub of subs) {
            const files = await query(`SELECT * FROM attachments WHERE parentId = ? AND parentType = 'SUBMISSION'`, [sub.id]);
            sub.submittedFiles = files;
        }
        
        res.json(subs);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/submissions/:id/grade', requireRole(['ADMIN', 'STAFF']), async (req, res) => {
    try {
        await run('UPDATE submissions SET status = ?, grade = ? WHERE id = ?', ['Returned', req.body.grade, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/attachments', async (req, res) => {
    try {
        const { parentId, parentType, file } = req.body;
        const id = `ATT${Date.now()}`;
        await run(`INSERT INTO attachments (id, parentId, parentType, name, url, size, type) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [id, parentId, parentType, file.name, file.url, file.size, file.type]);
        res.json({ success: true, id });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/classes/:classId/people', async (req, res) => {
    try {
        const members = await query(`
            SELECT u.id, u.name, u.email, u.photoUrl, m.role
            FROM class_memberships m
            JOIN users u ON m.userId = u.id
            WHERE m.classId = ?
        `, [req.params.classId]);
        res.json(members);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/classes/:classId/sheet', async (req, res) => {
    try {
        const { date } = req.query;
        const members = await query(`
            SELECT u.id, u.name, u.email, u.photoUrl, u.role
            FROM class_memberships m
            JOIN users u ON m.userId = u.id
            WHERE m.classId = ? AND m.role = 'STUDENT'
        `, [req.params.classId]);

        const sessionDesc = `Daily Attendance ${date}`;
        const session = await get('SELECT * FROM attendance_sessions WHERE classId = ? AND description = ? AND isDeleted = 0', [req.params.classId, sessionDesc]);

        let attendanceMap = {};
        if (session) {
            const records = await query('SELECT studentId, status FROM attendance_records WHERE sessionId = ? AND isDeleted = 0', [session.id]);
            records.forEach(r => attendanceMap[r.studentId] = r.status === 'PRESENT' ? 'P' : r.status === 'ABSENT' ? 'A' : r.status);
        }

        const sheet = members.map(s => ({
            id: s.id, name: s.name, email: s.email, photoUrl: s.photoUrl,
            status: attendanceMap[s.id] || 'A'
        }));

        res.json({ date, sheet, sessionId: session ? session.id : null });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/classes/:classId/sheet', requireRole(['ADMIN', 'STAFF']), async (req, res) => {
    try {
        const { date, records } = req.body;
        const sessionDesc = `Daily Attendance ${date}`;

        // Point 4: Prevent Duplicate Attendance (Check if session already exists and is CLOSED)
        // If teacher tries to submit for a date that already has a CLOSED session, we can either block or allow update.
        // The current UI expects to be able to "Save Sheet", so we will update if exists, but we'll add a check.
        let session = await get('SELECT * FROM attendance_sessions WHERE classId = ? AND description = ? AND isDeleted = 0', [req.params.classId, sessionDesc]);

        if (!session) {
            const sessionId = `SESS${Date.now()}`;
            await run(`INSERT INTO attendance_sessions (id, classId, organizationId, startTime, description, status) VALUES (?, ?, ?, ?, ?, ?)`,
                [sessionId, req.params.classId, req.user.organizationId, new Date(`${date}T12:00:00.000Z`).toISOString(), sessionDesc, 'CLOSED']);
            session = { id: sessionId };
        }

        await run('DELETE FROM attendance_records WHERE sessionId = ?', [session.id]);

        for (const [studentId, data] of Object.entries(records)) {
            const status = typeof data === 'string' ? data : data.status;
            const remarks = typeof data === 'string' ? '' : (data.remarks || '');
            
            await run(`INSERT INTO attendance_records (id, sessionId, studentId, organizationId, status, remarks, joinedAt, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [`REC${Date.now()}_${studentId}`, session.id, studentId, req.user.organizationId, status, remarks, new Date().toISOString(), new Date().toISOString()]);

            if (status === 'ABSENT') {
                const rels = await query('SELECT parentId FROM parent_student_relationships WHERE studentId = ?', [studentId]);
                for (const rel of rels) {
                    await triggerNotification(rel.parentId, 'PARENT', 'ATTENDANCE', 'Child Absence Alert', `Your child was marked ABSENT for ${sessionDesc}.`, `/dashboard`, req.user.organizationId);
                }
            }
        }

        res.json({ success: true });

        // Post-save: Attendance Shortage & Consecutive Absence Checks
        for (const [studentId, data] of Object.entries(records)) {
            const studentStatus = typeof data === 'string' ? data : data.status;

            const stats = await get(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN status IN ('PRESENT', 'ON_DUTY') THEN 1 ELSE 0 END) as present
                FROM attendance_records 
                WHERE studentId = ? AND organizationId = ? AND isDeleted = 0
            `, [studentId, req.user.organizationId]);
            
            if (stats && stats.total >= 5) {
                const percentage = (stats.present / stats.total) * 100;
                if (percentage < 75) {
                    // Deduplicate: only alert if no similar notification in last 24h
                    const recentAlert = await get(`
                        SELECT id FROM notifications 
                        WHERE userId = ? AND type = 'ATTENDANCE' AND title = 'Attendance Warning'
                        AND createdAt >= datetime('now', '-24 hours')
                        LIMIT 1
                    `, [studentId]);
                    if (!recentAlert) {
                        await triggerNotification(studentId, 'STUDENT', 'ATTENDANCE', 'Attendance Warning', `Your attendance has dropped to ${percentage.toFixed(1)}%. Please maintain at least 75%.`, `/dashboard`, req.user.organizationId);
                    }
                }
            }

            // Consecutive Absence Detection (3 days) — FIX: use studentStatus not undefined 'status'
            if (studentStatus === 'ABSENT') {
                const recentRecords = await query(`
                    SELECT status FROM attendance_records 
                    WHERE studentId = ? AND isDeleted = 0 
                    ORDER BY joinedAt DESC LIMIT 3
                `, [studentId]);
                
                if (recentRecords.length === 3 && recentRecords.every(r => r.status === 'ABSENT')) {
                    const parents = await query('SELECT parentId FROM parent_student_relationships WHERE studentId = ?', [studentId]);
                    for (const p of parents) {
                        // Deduplicate consecutive absence alert
                        const recentConsAlert = await get(`
                            SELECT id FROM notifications 
                            WHERE userId = ? AND type = 'ATTENDANCE' AND title = 'Consecutive Absence Alert'
                            AND createdAt >= datetime('now', '-24 hours')
                            LIMIT 1
                        `, [p.parentId]);
                        if (!recentConsAlert) {
                            await triggerNotification(p.parentId, 'PARENT', 'ATTENDANCE', 'Consecutive Absence Alert', `Your child has been absent for 3 consecutive days. Please check their status.`, `/dashboard`, req.user.organizationId);
                        }
                    }
                }
            }
        }
    } catch (err) { console.error('[SHEET ERROR]', err); res.status(500).json({ error: 'Failed to save attendance sheet' }); }
});

// Update a single attendance record
app.put('/api/attendance/records/:id', async (req, res) => {
    const { id } = req.params;
    const { status, remarks } = req.body;
    
    try {
        await run(
            'UPDATE attendance_records SET status = ?, remarks = ? WHERE id = ?',
            [status, remarks, id]
        );
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/classes/:classId/sessions', requireRole(['ADMIN', 'STAFF']), async (req, res) => {
    try {
        const id = `SESS${Date.now()}`;
        const startTime = new Date().toISOString();
        await run(`INSERT INTO attendance_sessions (id, classId, organizationId, startTime, description, status) VALUES (?, ?, ?, ?, ?, ?)`,
            [id, req.params.classId, req.user.organizationId, startTime, req.body.description || 'Live Session', 'ACTIVE']);
        res.json({ success: true, id, startTime, status: 'ACTIVE' });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/classes/:classId/sessions', async (req, res) => {
    try {
        const sess = await query('SELECT * FROM attendance_sessions WHERE classId = ? AND isDeleted = 0 ORDER BY startTime DESC', [req.params.classId]);
        res.json(sess);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/sessions/:sessionId', async (req, res) => {
    try {
        const s = await get('SELECT * FROM attendance_sessions WHERE id = ? AND isDeleted = 0', [req.params.sessionId]);
        if (!s) return res.status(404).json({ error: 'Not found' });

        const recs = await query(`
            SELECT r.*, u.name as studentName, u.email as studentEmail, u.photoUrl as studentPhoto
            FROM attendance_records r
            JOIN users u ON r.studentId = u.id
            WHERE r.sessionId = ? AND r.isDeleted = 0
        `, [s.id]);
        s.records = recs;
        res.json(s);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/sessions/:sessionId/join', async (req, res) => {
    try {
        const s = await get('SELECT * FROM attendance_sessions WHERE id = ? AND isDeleted = 0', [req.params.sessionId]);
        if (!s || s.status !== 'ACTIVE') return res.status(400).json({ error: 'Not active' });

        const ext = await get('SELECT * FROM attendance_records WHERE sessionId = ? AND studentId = ?', [s.id, req.body.studentId]);
        if (ext) return res.status(409).json({ error: 'Already joined' });

        await run(`INSERT INTO attendance_records (id, sessionId, studentId, organizationId, status, joinedAt) VALUES (?, ?, ?, ?, ?, ?)`,
            [`REC${Date.now()}`, s.id, req.body.studentId, req.user.organizationId, 'PRESENT', new Date().toISOString()]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Admin: list of classes for dropdown in report UI
app.get('/api/admin/attendance/classes', requireRole(['ADMIN']), async (req, res) => {
    try {
        const classes = await query(
            'SELECT id, name, section, subject FROM classes WHERE organizationId = ? AND isDeleted = 0 ORDER BY name ASC',
            [req.user.organizationId]
        );
        res.json(classes);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch classes' }); }
});

// Admin Attendance Reports — enhanced with summary stats + CSV export
app.get('/api/admin/attendance/report', requireRole(['ADMIN']), async (req, res) => {
    try {
        const { classId, studentId, startDate, endDate, format } = req.query;
        let where = 'WHERE r.isDeleted = 0 AND r.organizationId = ?';
        let params = [req.user.organizationId];

        if (classId) {
            where += ' AND s.classId = ?';
            params.push(classId);
        }
        if (studentId) {
            where += ' AND r.studentId = ?';
            params.push(studentId);
        }
        if (startDate) {
            where += ' AND s.startTime >= ?';
            params.push(startDate);
        }
        if (endDate) {
            where += ' AND s.startTime <= ?';
            params.push(endDate + 'T23:59:59.999Z');
        }

        const report = await query(`
            SELECT 
                r.id, r.status, r.remarks, r.joinedAt,
                r.studentId,
                u.name as studentName, u.email as studentEmail,
                s.description as sessionName, s.startTime as date,
                s.classId,
                c.name as className
            FROM attendance_records r
            JOIN users u ON r.studentId = u.id
            JOIN attendance_sessions s ON r.sessionId = s.id
            JOIN classes c ON s.classId = c.id
            ${where}
            ORDER BY s.startTime DESC
        `, params);

        // CSV export
        if (format === 'csv') {
            const csvHeader = 'Date,Student Name,Student Email,Class,Session,Status,Remarks\n';
            const csvRows = report.map(r => [
                new Date(r.date).toLocaleDateString(),
                `"${r.studentName}"`,
                r.studentEmail,
                `"${r.className}"`,
                `"${r.sessionName}"`,
                r.status,
                `"${r.remarks || ''}"`
            ].join(',')).join('\n');
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="attendance_report_${new Date().toISOString().split('T')[0]}.csv"`);
            return res.send(csvHeader + csvRows);
        }

        // Compute summary stats
        const total = report.length;
        const presentCount = report.filter(r => r.status === 'PRESENT' || r.status === 'ON_DUTY').length;
        const absentCount = report.filter(r => r.status === 'ABSENT').length;
        const summary = {
            total,
            present: presentCount,
            absent: absentCount,
            presentPct: total > 0 ? ((presentCount / total) * 100).toFixed(1) : '0.0',
            absentPct: total > 0 ? ((absentCount / total) * 100).toFixed(1) : '0.0'
        };

        res.json({ report, summary });
    } catch (err) { console.error('[ADMIN REPORT]', err); res.status(500).json({ error: 'Failed to generate report' }); }
});

// Attendance Analytics for Student/Parent — enhanced with trends, class breakdown, streak
app.get('/api/attendance/analytics/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        
        // Security check
        if (req.user.role === 'PARENT') {
            const rel = await get('SELECT * FROM parent_student_relationships WHERE parentId = ? AND studentId = ?', [req.user.userId, studentId]);
            if (!rel) return res.status(403).json({ error: 'Unauthorized child access' });
        } else if (req.user.role === 'STUDENT' && req.user.userId !== studentId) {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        // Overall stats
        const records = await query(`
            SELECT r.status, r.joinedAt, s.classId, c.name as className,
                   strftime('%Y-%m', s.startTime) as month
            FROM attendance_records r
            JOIN attendance_sessions s ON r.sessionId = s.id
            JOIN classes c ON s.classId = c.id
            WHERE r.studentId = ? AND r.isDeleted = 0
            ORDER BY r.joinedAt DESC
        `, [studentId]);

        const totalDays = records.length;
        const presentDays = records.filter(r => r.status === 'PRESENT' || r.status === 'ON_DUTY').length;
        const absentDays = records.filter(r => r.status === 'ABSENT').length;
        const leaveDays = records.filter(r => r.status === 'LEAVE').length;
        const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;

        // Monthly trend
        const trendMap = {};
        records.forEach(r => {
            if (!r.month) return;
            if (!trendMap[r.month]) trendMap[r.month] = { present: 0, absent: 0, total: 0, month: r.month };
            trendMap[r.month].total++;
            if (r.status === 'PRESENT' || r.status === 'ON_DUTY') trendMap[r.month].present++;
            if (r.status === 'ABSENT') trendMap[r.month].absent++;
        });
        const trend = Object.values(trendMap)
            .map((d) => ({ ...d, percentage: d.total > 0 ? +((d.present / d.total) * 100).toFixed(1) : 0 }))
            .sort((a, b) => a.month.localeCompare(b.month));

        // Class-level breakdown
        const classMap = {};
        records.forEach(r => {
            if (!classMap[r.classId]) classMap[r.classId] = { classId: r.classId, className: r.className, present: 0, total: 0 };
            classMap[r.classId].total++;
            if (r.status === 'PRESENT' || r.status === 'ON_DUTY') classMap[r.classId].present++;
        });
        const classSummary = Object.values(classMap).map((d) => ({
            ...d,
            percentage: d.total > 0 ? +((d.present / d.total) * 100).toFixed(1) : 0
        }));

        // Consecutive absent streak (count from most recent record backwards)
        let streak = 0;
        for (const r of records) {
            if (r.status === 'ABSENT') streak++;
            else break;
        }

        res.json({
            percentage: +percentage.toFixed(1),
            presentDays,
            absentDays,
            leaveDays,
            totalDays,
            streak,
            trend,
            classSummary
        });
    } catch (err) { console.error('[ANALYTICS]', err); res.status(500).json({ error: 'Failed to load analytics' }); }
});

app.get('/api/classes/:classId/my-attendance', async (req, res) => {
    try {
        const records = await query(`
            SELECT r.*, s.startTime, s.description
            FROM attendance_records r
            JOIN attendance_sessions s ON r.sessionId = s.id
            WHERE s.classId = ? AND r.studentId = ? AND r.isDeleted = 0
            ORDER BY s.startTime DESC
        `, [req.params.classId, req.query.userId]);

        const totalRow = await get(`SELECT count(*) as count FROM attendance_sessions WHERE classId = ? AND status = 'CLOSED'`, [req.params.classId]);
        res.json({ records, totalSessions: totalRow.count });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/sessions/:sessionId/end', requireRole(['ADMIN', 'STAFF']), async (req, res) => {
    try {
        await run(`UPDATE attendance_sessions SET status = 'CLOSED', endTime = ? WHERE id = ?`, [new Date().toISOString(), req.params.sessionId]);
        
        const students = await query(`SELECT userId FROM class_memberships WHERE classId = ? AND role = 'STUDENT'`, [req.body.classId]);
        const presentRecs = await query('SELECT studentId FROM attendance_records WHERE sessionId = ?', [req.params.sessionId]);
        const presentIds = new Set(presentRecs.map(r => r.studentId));

        let absentCount = 0;
        for (const s of students) {
            if (!presentIds.has(s.userId)) {
                await run(`INSERT INTO attendance_records (id, sessionId, studentId, organizationId, status) VALUES (?, ?, ?, ?, ?)`,
                    [`REC${Date.now()}_${s.userId}`, req.params.sessionId, s.userId, req.user.organizationId, 'ABSENT']);
                absentCount++;
            }
        }
        res.json({ success: true, absentCount });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/leave-requests', async (req, res) => {
    try {
        const id = `LR${Date.now()}`;
        await run(`INSERT INTO leave_requests (id, studentId, classId, organizationId, subject, fromDate, toDate, type, studyType, reason, documentUrl, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, req.body.studentId, req.body.classId, req.user.organizationId, req.body.subject, req.body.fromDate, req.body.toDate, req.body.type, req.body.studyType, req.body.reason, req.body.documentUrl, 'PENDING', new Date().toISOString()]);
        res.json({ success: true, id });

        // Notify Staff/Admin of the class
        const staff = await query(`SELECT userId FROM class_memberships WHERE classId = ? AND role IN ('STAFF', 'ADMIN')`, [req.body.classId]);
        const studentUser = await get('SELECT name, parentId FROM users WHERE id = ?', [req.body.studentId]);
        for (const s of staff) {
            await triggerNotification(s.userId, 'STAFF', 'LEAVE', 'New Leave Request', `${studentUser.name} submitted a ${req.body.type} request.`, `/dashboard`, req.user.organizationId);
        }

        // Notify Parent
        if (studentUser && studentUser.parentId) {
            await triggerNotification(studentUser.parentId, 'PARENT', 'LEAVE', 'Child Leave Request', `${studentUser.name} submitted a ${req.body.type} request.`, `/dashboard`, req.user.organizationId);
        }
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/requests/summary/:studentId', async (req, res) => {
    try {
        const reqs = await query('SELECT * FROM leave_requests WHERE studentId = ? AND isDeleted = 0', [req.params.studentId]);
        let s = { totalOD: 0, totalStudy: 0, totalLeave: 0, totalPending: 0, totalRejected: 0 };
        reqs.forEach(r => {
            if (r.status === 'PENDING') s.totalPending++;
            if (r.status === 'REJECTED') s.totalRejected++;
            if (r.status === 'APPROVED') {
                if (r.type === 'OD') s.totalOD++;
                if (r.type === 'STUDY') s.totalStudy++;
                if (r.type === 'LEAVE') s.totalLeave++;
            }
        });
        res.json(s);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/requests/parent/:parentId', requireRole(['PARENT']), async (req, res) => {
    try {
        const requests = await query(`
            SELECT lr.*, u.name as studentName 
            FROM leave_requests lr
            JOIN users u ON lr.studentId = u.id
            WHERE u.parentId = ? AND lr.isDeleted = 0
            ORDER BY lr.createdAt DESC
        `, [req.params.parentId]);
        res.json(requests);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/leave-requests/:id/parent-approval', requireRole(['PARENT']), async (req, res) => {
    try {
        await run('UPDATE leave_requests SET parentApprovalStatus = ? WHERE id = ?', [req.body.status, req.params.id]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/requests/student/:studentId', async (req, res) => {
    try {
        const reqs = await query(`
            SELECT lr.*, c.name as className
            FROM leave_requests lr
            JOIN classes c ON lr.classId = c.id
            WHERE lr.studentId = ? AND lr.isDeleted = 0
            ORDER BY lr.createdAt DESC
        `, [req.params.studentId]);
        res.json(reqs);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/users/:userId/leave-requests', async (req, res) => {
    try {
        const reqs = await query(`
            SELECT lr.*, c.name as className
            FROM leave_requests lr
            JOIN classes c ON lr.classId = c.id
            WHERE lr.studentId = ? AND lr.isDeleted = 0
            ORDER BY lr.createdAt DESC
        `, [req.params.userId]);
        res.json(reqs);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/classes/:classId/leave-requests', async (req, res) => {
    try {
        const reqs = await query(`
            SELECT lr.*, u.name as studentName, u.photoUrl as studentPhoto
            FROM leave_requests lr
            JOIN users u ON lr.studentId = u.id
            WHERE lr.classId = ? AND lr.isDeleted = 0
            ORDER BY lr.createdAt DESC
        `, [req.params.classId]);
        res.json(reqs);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/leave-requests/:id/status', requireRole(['ADMIN', 'STAFF']), async (req, res) => {
    try {
        const { status, staffRemarks, staffId } = req.body;
        await run('UPDATE leave_requests SET status = ?, staffRemarks = ?, reviewedBy = ?, reviewedAt = ? WHERE id = ?',
            [status, staffRemarks, staffId, new Date().toISOString(), req.params.id]);
        
        const lr = await get('SELECT * FROM leave_requests WHERE id = ?', [req.params.id]);
        const student = await get('SELECT name, parentId FROM users WHERE id = ?', [lr.studentId]);
        
        // Notify Student
        await triggerNotification(lr.studentId, 'STUDENT', 'LEAVE', 'Leave Request Update', `Your ${lr.type} request has been ${status.toLowerCase()}.`, `/dashboard`, lr.organizationId);
        
        // Notify Parent
        if (student.parentId) {
            await triggerNotification(student.parentId, 'PARENT', 'LEAVE', 'Child Request Update', `${student.name}'s ${lr.type} request has been ${status.toLowerCase()}.`, `/dashboard`, lr.organizationId);
        }

        // Auto-mark attendance as OD if approved
        if (lr.type === 'OD' && status === 'APPROVED') {
            const sessions = await query(`
                SELECT id FROM attendance_sessions 
                WHERE classId = ? 
                AND startTime BETWEEN ? AND ? 
                AND isDeleted = 0
            `, [lr.classId, lr.fromDate, lr.toDate + 'T23:59:59']);
            
            for (const sess of sessions) {
                const existing = await get('SELECT id FROM attendance_records WHERE sessionId = ? AND studentId = ?', [sess.id, lr.studentId]);
                if (existing) {
                    await run('UPDATE attendance_records SET status = ? WHERE id = ?', ['OD', existing.id]);
                } else {
                    await run('INSERT INTO attendance_records (id, sessionId, studentId, organizationId, status, joinedAt) VALUES (?, ?, ?, ?, ?, ?)',
                        [`REC${Date.now()}_${Math.random().toString(36).substring(2,5)}`, sess.id, lr.studentId, lr.organizationId, 'OD', new Date().toISOString()]);
                }
            }
        }

        res.json({ success: true });
    } catch (err) { console.error(err); res.status(500).json({ error: 'Failed' }); }
});

// No-Due Requests
app.post('/api/no-due-requests', async (req, res) => {
    try {
        const id = `ND${Date.now()}`;
        await run(`INSERT INTO no_due_requests (id, studentId, organizationId, reason, createdAt) VALUES (?, ?, ?, ?, ?)`,
            [id, req.user.userId, req.user.organizationId, req.body.reason, new Date().toISOString()]);
        
        // Notify Admin and relevant staff (simplified: notify all staff in student's classes)
        const staff = await query(`
            SELECT DISTINCT m.userId 
            FROM class_memberships m 
            JOIN class_memberships sm ON m.classId = sm.classId 
            WHERE sm.userId = ? AND m.role IN ('STAFF', 'ADMIN')
        `, [req.user.userId]);
        
        for (const s of staff) {
            await triggerNotification(s.userId, 'STAFF', 'NODUE', 'New No-Due Request', `A student has submitted a No-Due request.`, `/dashboard`, req.user.organizationId);
        }
        
        res.json({ success: true, id });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/no-due-requests', requireRole(['ADMIN', 'STAFF']), async (req, res) => {
    try {
        const reqs = await query(`
            SELECT nd.*, u.name as studentName, u.email as studentEmail
            FROM no_due_requests nd
            JOIN users u ON nd.studentId = u.id
            WHERE nd.organizationId = ? AND nd.isDeleted = 0
            ORDER BY nd.createdAt DESC
        `, [req.user.organizationId]);
        res.json(reqs);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/users/:userId/no-due-requests', async (req, res) => {
    try {
        const reqs = await query(`SELECT * FROM no_due_requests WHERE studentId = ? AND isDeleted = 0`, [req.params.userId]);
        res.json(reqs);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/no-due-requests/:id/review', requireRole(['STAFF', 'ADMIN']), async (req, res) => {
    try {
        await run('UPDATE no_due_requests SET status = ?, teacherRemarks = ?, teacherReviewedBy = ?, teacherReviewedAt = ? WHERE id = ?',
            [req.body.status, req.body.remarks, req.user.userId, new Date().toISOString(), req.params.id]);
        
        // Notify Admin if teacher approved
        if (req.body.status === 'TEACHER_APPROVED') {
            const admins = await query(`SELECT id FROM users WHERE role = 'ADMIN' AND organizationId = (SELECT organizationId FROM no_due_requests WHERE id = ?)`, [req.params.id]);
            for (const admin of admins) {
                await triggerNotification(admin.id, 'ADMIN', 'NODUE', 'No-Due Review Update', `A No-Due request is ready for final approval.`, `/dashboard`, req.user.organizationId);
            }
        }
        
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/no-due-requests/:id/finalize', requireRole(['ADMIN']), async (req, res) => {
    try {
        await run('UPDATE no_due_requests SET status = ?, adminRemarks = ?, adminReviewedBy = ?, adminReviewedAt = ? WHERE id = ?',
            ['COMPLETED', req.body.remarks, req.user.userId, new Date().toISOString(), req.params.id]);
        
        const nd = await get('SELECT studentId, organizationId FROM no_due_requests WHERE id = ?', [req.params.id]);
        await triggerNotification(nd.studentId, 'STUDENT', 'NODUE', 'No-Due Finalized', `Your No-Due request has been completed.`, `/dashboard`, nd.organizationId);
        
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/saas/organizations', requireRole('SUPER_ADMIN'), async (req, res) => {
    try {
        const id = `ORG${Date.now()}`;
        await run(`INSERT INTO organizations (id, name, domain, createdAt) VALUES (?, ?, ?, ?)`, [id, req.body.name, req.body.domain, new Date().toISOString()]);
        res.json({ success: true, id, name: req.body.name, domain: req.body.domain });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    res.json({ url: `/uploads/${req.file.filename}`, filename: req.file.filename, size: req.file.size, type: req.file.mimetype });
});

// School Events Management
app.post('/api/events', requireRole(['ADMIN']), async (req, res) => {
    try {
        const id = `EV${Date.now()}`;
        const { title, category, date, description, targetClassId, color } = req.body;
        await run(`INSERT INTO school_events (id, title, category, date, description, targetClassId, color, organizationId, createdAt) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, title, category, date, description, targetClassId, color, req.user.organizationId, new Date().toISOString()]);
        res.json({ success: true, id });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/events', async (req, res) => {
    try {
        const events = await query('SELECT * FROM school_events WHERE organizationId = ? ORDER BY date ASC', [req.user.organizationId]);
        res.json(events);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch events' }); }
});

app.delete('/api/events/:id', requireRole(['ADMIN']), async (req, res) => {
    try {
        await run('DELETE FROM school_events WHERE id = ? AND organizationId = ?', [req.params.id, req.user.organizationId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to delete event' }); }
});

// Calendar & Reminders
app.get('/api/calendar', async (req, res) => {
    try {
        const { userId, role, organizationId } = req.user;
        let events = [];

        // 1. School/Class Events
        const schoolEvents = await query(`
            SELECT * FROM school_events 
            WHERE organizationId = ? AND (targetClassId IS NULL OR targetClassId IN (SELECT classId FROM class_memberships WHERE userId = ?))
        `, [organizationId, userId]);
        schoolEvents.forEach(e => events.push({ ...e, type: e.category, source: 'EVENT' }));

        // 2. Assignments
        let assignments = [];
        if (role === 'ADMIN') {
            assignments = await query('SELECT * FROM assignments WHERE organizationId = ? AND isDeleted = 0', [organizationId]);
        } else if (role === 'STAFF') {
            assignments = await query(`
                SELECT a.* FROM assignments a
                JOIN class_memberships m ON a.classId = m.classId
                WHERE m.userId = ? AND m.role = 'STAFF' AND a.isDeleted = 0
            `, [userId]);
        } else if (role === 'STUDENT') {
            assignments = await query(`
                SELECT a.*, s.status as submissionStatus FROM assignments a
                LEFT JOIN submissions s ON a.id = s.assignmentId AND s.studentId = ?
                JOIN class_memberships m ON a.classId = m.classId
                WHERE m.userId = ? AND a.isDeleted = 0
            `, [userId, userId]);
        } else if (role === 'PARENT') {
            // Fetch for children
            assignments = await query(`
                SELECT a.*, s.status as submissionStatus, u.name as studentName FROM assignments a
                JOIN submissions s ON a.id = s.assignmentId
                JOIN users u ON s.studentId = u.id
                WHERE u.parentId = ? AND a.isDeleted = 0
            `, [userId]);
        }
        assignments.forEach(a => events.push({ 
            id: a.id, 
            title: a.title, 
            date: a.dueDate, 
            description: a.instructions, 
            type: 'Assignment Due', 
            status: a.submissionStatus,
            source: 'ASSIGNMENT' 
        }));

        // 3. Approved Leave Requests
        let leaveReqs = [];
        if (role === 'ADMIN' || role === 'STAFF') {
            leaveReqs = await query(`
                SELECT lr.*, u.name as studentName FROM leave_requests lr
                JOIN users u ON lr.studentId = u.id
                WHERE lr.organizationId = ? AND lr.status = 'APPROVED' AND lr.isDeleted = 0
            `, [organizationId]);
        } else if (role === 'STUDENT') {
            leaveReqs = await query(`SELECT * FROM leave_requests WHERE studentId = ? AND status = 'APPROVED' AND isDeleted = 0`, [userId]);
        } else if (role === 'PARENT') {
            leaveReqs = await query(`
                SELECT lr.*, u.name as studentName FROM leave_requests lr
                JOIN users u ON lr.studentId = u.id
                WHERE u.parentId = ? AND lr.status = 'APPROVED' AND lr.isDeleted = 0
            `, [userId]);
        }

        leaveReqs.forEach(lr => {
            // Add an event for each day of the leave
            const start = new Date(lr.fromDate);
            const end = new Date(lr.toDate);
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                events.push({
                    id: `${lr.id}_${d.toISOString()}`,
                    title: `${lr.studentName || 'Student'} - ${lr.type}`,
                    date: d.toISOString().split('T')[0],
                    description: lr.reason,
                    type: lr.type,
                    source: 'LEAVE',
                    studentId: lr.studentId
                });
            }
        });

        res.json(events);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch calendar data' });
    }
});

app.put('/api/calendar/events/:id/reschedule', requireRole(['ADMIN', 'STAFF']), async (req, res) => {
    try {
        const { id } = req.params;
        const { newDate } = req.body;

        // Check if it's an assignment or a school event
        if (id.startsWith('A')) {
            await run('UPDATE assignments SET dueDate = ? WHERE id = ?', [newDate, id]);
        } else if (id.startsWith('EV')) {
            await run('UPDATE school_events SET date = ? WHERE id = ?', [newDate, id]);
        } else {
            return res.status(400).json({ error: 'Only assignments and school events can be rescheduled' });
        }

        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to reschedule' });
    }
});

app.get('/api/dashboard/summary', async (req, res) => {
    try {
        const { userId, role, organizationId } = req.user;
        const today = new Date().toISOString().split('T')[0];

        // 1. Assignments due today
        let assignmentsDueToday = [];
        if (role === 'STUDENT') {
            assignmentsDueToday = await query(`
                SELECT a.*, c.name as className FROM assignments a
                JOIN classes c ON a.classId = c.id
                JOIN class_memberships m ON a.classId = m.classId
                WHERE m.userId = ? AND a.dueDate LIKE ? AND a.isDeleted = 0
            `, [userId, `${today}%`]);
        }

        // 2. Upcoming Exams (within next 7 days)
        const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];
        const upcomingExams = await query(`
            SELECT * FROM school_events 
            WHERE organizationId = ? AND category = 'Exam' AND date BETWEEN ? AND ?
        `, [organizationId, today, nextWeek]);

        // 3. Latest Announcements
        const announcements = await query(`
            SELECT ann.*, u.name as authorName, c.name as className 
            FROM announcements ann
            JOIN users u ON ann.authorId = u.id
            JOIN classes c ON ann.classId = c.id
            JOIN class_memberships m ON ann.classId = m.classId
            WHERE m.userId = ? AND ann.isDeleted = 0
            ORDER BY ann.createdAt DESC LIMIT 5
        `, [userId]);

        // 4. Attendance %
        const attendance = await get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status IN ('PRESENT', 'ON_DUTY') THEN 1 ELSE 0 END) as present
            FROM attendance_records 
            WHERE studentId = ? AND isDeleted = 0
        `, [userId]);

        res.json({
            assignmentsDueToday,
            upcomingExams,
            announcements,
            attendance: {
                percentage: attendance.total > 0 ? (attendance.present / attendance.total) * 100 : 0,
                present: attendance.present || 0,
                total: attendance.total || 0,
                absent: (attendance.total || 0) - (attendance.present || 0)
            }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch dashboard summary' });
    }
});

app.post('/api/notifications/trigger', requireRole(['ADMIN', 'STAFF']), async (req, res) => {
    try {
        const { targetUserId, targetRole, type, title, message, link } = req.body;
        await triggerNotification(targetUserId, targetRole, type, title, message, link, req.user.organizationId);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/notifications/reminders', async (req, res) => {
    try {
        const { userId, role, organizationId } = req.user;
        const today = new Date().toISOString().split('T')[0];
        const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

        let reminders = [];

        // Simple reminder logic based on due dates
        const upcoming = await query(`
            SELECT a.title, a.dueDate, c.name as className FROM assignments a
            JOIN classes c ON a.classId = c.id
            JOIN class_memberships m ON a.classId = m.classId
            WHERE m.userId = ? AND a.isDeleted = 0 AND (a.dueDate LIKE ? OR a.dueDate LIKE ?)
        `, [userId, `${today}%`, `${tomorrow}%`]);

        upcoming.forEach(u => {
            const isToday = u.dueDate.startsWith(today);
            reminders.push({
                title: u.title,
                message: `Assignment "${u.title}" in ${u.className} is due ${isToday ? 'today' : 'tomorrow'}.`,
                type: isToday ? 'CRITICAL' : 'WARNING'
            });
        });

        res.json(reminders);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Helper to trigger notifications
async function triggerNotification(userId, role, type, title, message, link, organizationId) {
    try {
        const id = `NT${Date.now()}_${Math.random().toString(36).substring(2, 5)}`;
        await run(`INSERT INTO notifications (id, userId, role, type, title, message, link, organizationId, createdAt) 
                   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [id, userId, role, type, title, message, link, organizationId, new Date().toISOString()]);
        
        // MODULE 2: Attendance SMS Alerts (Simulated)
        if (type === 'ATTENDANCE' && message.toLowerCase().includes('absent')) {
            const user = await get('SELECT phoneNumber FROM users WHERE id = ?', [userId]);
            if (user && user.phoneNumber) {
                console.log(`[SMS ALERT] To: ${user.phoneNumber} | Message: ${message}`);
            }
        }

        // Real-time Push (Simulated via Socket)
        io.to(`user_${userId}`).emit('notification', { id, title, message, type });
    } catch (err) {
        console.error('Failed to trigger notification:', err);
    }
}

// Analytics Endpoints
app.get('/api/analytics/attendance/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        const records = await query(`
            SELECT status, strftime('%Y-%m', joinedAt) as month 
            FROM attendance_records 
            WHERE studentId = ? AND isDeleted = 0
        `, [userId]);

        const total = records.length;
        const present = records.filter(r => r.status === 'PRESENT' || r.status === 'ON_DUTY').length;
        const absent = records.filter(r => r.status === 'ABSENT').length;
        const percentage = total > 0 ? (present / total) * 100 : 0;

        // Group by month for trend
        const trendMap = {};
        records.forEach(r => {
            if (!trendMap[r.month]) trendMap[r.month] = { present: 0, total: 0 };
            trendMap[r.month].total++;
            if (r.status === 'PRESENT' || r.status === 'ON_DUTY') trendMap[r.month].present++;
        });

        const trend = Object.entries(trendMap).map(([month, data]) => ({
            month,
            percentage: (data.present / data.total) * 100
        })).sort((a, b) => a.month.localeCompare(b.month));

        res.json({ percentage, present, absent, total, trend });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});
app.get('/api/analytics/performance/detailed/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const orgId = req.user.organizationId;

        // 1. Detailed Subject Stats
        const records = await query(`
            SELECT subject, AVG(CAST(score AS FLOAT)/maxScore * 100) as avgScore
            FROM performance_records
            WHERE studentId = ? AND organizationId = ?
            GROUP BY subject
        `, [studentId, orgId]);

        // 2. Ranking Logic
        const allScores = await query(`
            SELECT studentId, AVG(CAST(score AS FLOAT)/maxScore * 100) as avgScore
            FROM performance_records
            WHERE organizationId = ?
            GROUP BY studentId
            ORDER BY avgScore DESC
        `, [orgId]);

        const rank = allScores.findIndex(s => s.studentId === studentId) + 1;
        const percentile = (((allScores.length - rank) / allScores.length) * 100).toFixed(1);

        // 3. Assignment Completion
        const assignments = await get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status IN ('TurnedIn', 'Returned') THEN 1 ELSE 0 END) as completed
            FROM submissions
            WHERE studentId = ? AND organizationId = ? AND isDeleted = 0
        `, [studentId, orgId]);

        // 4. Quarterly Progress (Mocking grouping by month/quarter for now)
        const progress = await query(`
            SELECT 
                strftime('%Y-%m', date) as month,
                AVG(CAST(score AS FLOAT)/maxScore * 100) as avgScore
            FROM performance_records
            WHERE studentId = ? AND organizationId = ?
            GROUP BY month
            ORDER BY month ASC
            LIMIT 4
        `, [studentId, orgId]);

        res.json({
            rank: rank || 0,
            percentile: percentile || 0,
            averageScore: allScores.find(s => s.studentId === studentId)?.avgScore.toFixed(1) || 0,
            assignmentCompletion: assignments.total > 0 ? ((assignments.completed / assignments.total) * 100).toFixed(1) : 0,
            totalTests: records.length,
            subjectStats: records.map(r => ({ name: r.subject, score: r.avgScore.toFixed(1) })),
            quarterlyProgress: progress.map(p => ({ month: p.month, score: p.avgScore.toFixed(1) }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


app.get('/api/analytics/performance/:userId', async (req, res) => {
    try {
        const records = await query('SELECT * FROM performance_records WHERE studentId = ? ORDER BY date ASC', [req.params.userId]);
        res.json(records);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/dashboard/summary', async (req, res) => {
    try {
        const { userId, role, organizationId } = req.user;
        const today = new Date().toISOString().split('T')[0];

        const assignmentsDue = await query(`
            SELECT a.*, c.name as className FROM assignments a
            JOIN classes c ON a.classId = c.id
            JOIN class_memberships m ON a.classId = m.classId
            WHERE m.userId = ? AND a.dueDate LIKE ? AND a.isDeleted = 0
        `, [userId, `${today}%`]);

        const upcomingExams = await query(`
            SELECT * FROM school_events 
            WHERE organizationId = ? AND category = 'Exam' AND date >= ? 
            ORDER BY date ASC LIMIT 5
        `, [organizationId, today]);

        const latestAnnouncements = await query(`
            SELECT a.*, u.name as authorName, c.name as className FROM announcements a
            JOIN users u ON a.authorId = u.id
            JOIN classes c ON a.classId = c.id
            JOIN class_memberships m ON a.classId = m.classId
            WHERE m.userId = ? AND a.isDeleted = 0
            ORDER BY a.createdAt DESC LIMIT 5
        `, [userId]);

        res.json({ assignmentsDue, upcomingExams, latestAnnouncements });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Notification Endpoints
app.get('/api/notifications', async (req, res) => {
    try {
        const notifications = await query(`
            SELECT * FROM notifications 
            WHERE userId = ? AND organizationId = ? 
            ORDER BY createdAt DESC LIMIT 50
        `, [req.user.userId, req.user.organizationId]);
        res.json(notifications);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/notifications/:id/read', async (req, res) => {
    try {
        await run('UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?', [req.params.id, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Enhanced Leave Workflow: Parent Approval
app.put('/api/leave-requests/:id/parent-approve', requireRole(['PARENT']), async (req, res) => {
    try {
        const { status, remarks } = req.body;
        await run('UPDATE leave_requests SET parentApprovalStatus = ? WHERE id = ?', [status, req.params.id]);
        
        // Trigger notification for student/staff if needed
        const lr = await get('SELECT studentId, organizationId FROM leave_requests WHERE id = ?', [req.params.id]);
        await triggerNotification(lr.studentId, 'STUDENT', 'LEAVE', 'Parent Approval Update', `Your parent has ${status.toLowerCase()} your leave request.`, `/dashboard/requests`, lr.organizationId);

        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Drag and Drop Calendar Update
app.put('/api/calendar/events/:id', requireRole(['ADMIN', 'STAFF']), async (req, res) => {
    try {
        const { id } = req.params;
        const { date, source } = req.body;

        if (source === 'EVENT') {
            await run('UPDATE school_events SET date = ? WHERE id = ?', [date, id]);
        } else if (source === 'ASSIGNMENT') {
            await run('UPDATE assignments SET dueDate = ? WHERE id = ?', [date, id]);
        }
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});


// Analytics Endpoints
app.get('/api/analytics/attendance/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // Data Isolation check
        if (req.user.userId !== userId && req.user.role !== 'ADMIN' && req.user.role !== 'STAFF' && req.user.role !== 'PARENT') {
            return res.status(403).json({ error: 'Access denied' });
        }

        const records = await query(`
            SELECT status, strftime('%Y-%m', joinedAt) as month 
            FROM attendance_records 
            WHERE studentId = ? AND isDeleted = 0
        `, [userId]);

        const total = records.length;
        const present = records.filter(r => r.status === 'PRESENT' || r.status === 'ON_DUTY').length;
        const absent = records.filter(r => r.status === 'ABSENT').length;
        const percentage = total > 0 ? (present / total) * 100 : 0;

        // Group by month for trend
        const trendMap = {};
        records.forEach(r => {
            if (!trendMap[r.month]) trendMap[r.month] = { present: 0, total: 0 };
            trendMap[r.month].total++;
            if (r.status === 'PRESENT' || r.status === 'ON_DUTY') trendMap[r.month].present++;
        });

        const trend = Object.entries(trendMap).map(([month, data]) => ({
            month,
            percentage: (data.present / data.total) * 100
        })).sort((a, b) => a.month.localeCompare(b.month));

        res.json({ percentage, present, absent, total, trend });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/analytics/performance/detailed/:studentId', async (req, res) => {
    try {
        const { studentId } = req.params;
        const orgId = req.user.organizationId;

        // 1. Detailed Subject Stats
        const records = await query(`
            SELECT subject, AVG(CAST(score AS FLOAT)/maxScore * 100) as avgScore
            FROM performance_records
            WHERE studentId = ? AND organizationId = ?
            GROUP BY subject
        `, [studentId, orgId]);

        // 2. Ranking Logic
        const allScores = await query(`
            SELECT studentId, AVG(CAST(score AS FLOAT)/maxScore * 100) as avgScore
            FROM performance_records
            WHERE organizationId = ?
            GROUP BY studentId
            ORDER BY avgScore DESC
        `, [orgId]);

        const rank = allScores.findIndex(s => s.studentId === studentId) + 1;
        const percentile = (((allScores.length - rank) / allScores.length) * 100).toFixed(1);

        // 3. Assignment Completion
        const assignments = await get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status IN ('TurnedIn', 'Returned') THEN 1 ELSE 0 END) as completed
            FROM submissions
            WHERE studentId = ? AND organizationId = ? AND isDeleted = 0
        `, [studentId, orgId]);

        // 4. Quarterly Progress (Mocking grouping by month/quarter for now)
        const progress = await query(`
            SELECT 
                strftime('%Y-%m', date) as month,
                AVG(CAST(score AS FLOAT)/maxScore * 100) as avgScore
            FROM performance_records
            WHERE studentId = ? AND organizationId = ?
            GROUP BY month
            ORDER BY month ASC
            LIMIT 4
        `, [studentId, orgId]);

        res.json({
            rank: rank || 0,
            percentile: percentile || 0,
            averageScore: allScores.find(s => s.studentId === studentId)?.avgScore.toFixed(1) || 0,
            assignmentCompletion: assignments.total > 0 ? ((assignments.completed / assignments.total) * 100).toFixed(1) : 0,
            totalTests: records.length,
            subjectStats: records.map(r => ({ name: r.subject, score: r.avgScore.toFixed(1) })),
            quarterlyProgress: progress.map(p => ({ month: p.month, score: p.avgScore.toFixed(1) }))
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.get('/api/analytics/performance/:userId', async (req, res) => {
    try {
        const { userId } = req.params;
        // Data Isolation: Parent can see their child's performance
        let isParentOf = false;
        if (req.user.role === 'PARENT') {
            const rel = await get('SELECT * FROM parent_student_relationships WHERE parentId = ? AND studentId = ?', [req.user.userId, userId]);
            if (rel) isParentOf = true;
        }

        if (req.user.userId !== userId && req.user.role !== 'ADMIN' && req.user.role !== 'STAFF' && !isParentOf) {
            return res.status(403).json({ error: 'Access denied' });
        }

        const records = await query('SELECT * FROM performance_records WHERE studentId = ? ORDER BY date ASC', [userId]);
        res.json(records);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/parent/students', requireRole(['PARENT']), async (req, res) => {
    try {
        const students = await query(`
            SELECT u.id, u.name, u.email, u.photoUrl, r.relation
            FROM users u
            JOIN parent_student_relationships r ON u.id = r.studentId
            WHERE r.parentId = ? AND u.isDeleted = 0
        `, [req.user.userId]);
        res.json(students);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch linked students' }); }
});

app.get('/api/dashboard/summary', async (req, res) => {
    try {
        let { userId, role, organizationId } = req.user;
        const today = new Date().toISOString().split('T')[0];

        // If parent is requesting for a specific child
        if (role === 'PARENT' && req.query.userId) {
            const rel = await get('SELECT * FROM parent_student_relationships WHERE parentId = ? AND studentId = ?', [userId, req.query.userId]);
            if (rel) {
                userId = req.query.userId;
            } else {
                return res.status(403).json({ error: 'Unauthorized child access' });
            }
        }

        const assignmentsDue = await query(`
            SELECT a.*, c.name as className FROM assignments a
            JOIN classes c ON a.classId = c.id
            JOIN class_memberships m ON a.classId = m.classId
            WHERE m.userId = ? AND a.dueDate LIKE ? AND a.isDeleted = 0
        `, [userId, `${today}%`]);

        const upcomingExams = await query(`
            SELECT * FROM school_events 
            WHERE organizationId = ? AND category = 'Exam' AND date >= ? 
            ORDER BY date ASC LIMIT 5
        `, [organizationId, today]);

        const latestAnnouncements = await query(`
            SELECT a.*, u.name as authorName, c.name as className FROM announcements a
            JOIN users u ON a.authorId = u.id
            JOIN classes c ON a.classId = c.id
            JOIN class_memberships m ON a.classId = m.classId
            WHERE m.userId = ? AND a.isDeleted = 0
            ORDER BY a.createdAt DESC LIMIT 5
        `, [userId]);

        res.json({ assignmentsDue, upcomingExams, latestAnnouncements });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Notification Endpoints
app.get('/api/notifications', async (req, res) => {
    try {
        const notifications = await query(`
            SELECT * FROM notifications 
            WHERE userId = ? AND organizationId = ? 
            ORDER BY createdAt DESC LIMIT 50
        `, [req.user.userId, req.user.organizationId]);
        res.json(notifications);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.put('/api/notifications/:id/read', async (req, res) => {
    try {
        await run('UPDATE notifications SET isRead = 1 WHERE id = ? AND userId = ?', [req.params.id, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Enhanced Leave Workflow: Parent Approval
app.put('/api/leave-requests/:id/parent-approval', requireRole(['PARENT']), async (req, res) => {
    try {
        const { status, remarks } = req.body;
        await run('UPDATE leave_requests SET parentApprovalStatus = ?, parentRemarks = ? WHERE id = ?', [status, remarks, req.params.id]);
        
        // Trigger notification for student/staff
        const lr = await get('SELECT studentId, organizationId FROM leave_requests WHERE id = ?', [req.params.id]);
        await triggerNotification(lr.studentId, 'STUDENT', 'LEAVE', 'Parent Approval Update', `Your parent has ${status.toLowerCase()} your leave request.`, `/dashboard/requests`, lr.organizationId);

        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/requests/parent/:parentId', requireRole(['PARENT']), async (req, res) => {
    try {
        const requests = await query(`
            SELECT lr.*, u.name as studentName 
            FROM leave_requests lr
            JOIN users u ON lr.studentId = u.id
            JOIN parent_student_relationships r ON lr.studentId = r.studentId
            WHERE r.parentId = ? AND lr.isDeleted = 0
            ORDER BY lr.createdAt DESC
        `, [req.params.parentId]);
        res.json(requests);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// MODULE 5: Real-time Chat Endpoints
app.get('/api/messages/:otherId', async (req, res) => {
    try {
        const messages = await query(`
            SELECT * FROM messages 
            WHERE (senderId = ? AND receiverId = ?) OR (senderId = ? AND receiverId = ?)
            ORDER BY createdAt ASC
        `, [req.user.userId, req.params.otherId, req.params.otherId, req.user.userId]);
        res.json(messages);
    } catch (err) { res.status(500).json({ error: 'Failed to fetch messages' }); }
});

app.post('/api/messages', async (req, res) => {
    try {
        const { receiverId, content } = req.body;
        const id = `MSG${Date.now()}`;
        const createdAt = new Date().toISOString();
        await run(`INSERT INTO messages (id, senderId, receiverId, content, createdAt) VALUES (?, ?, ?, ?, ?)`,
            [id, req.user.userId, receiverId, content, createdAt]);
        
        // Emit via Socket
        io.to(`user_${receiverId}`).emit('message', { id, senderId: req.user.userId, content, createdAt });
        
        res.json({ success: true, id, createdAt });
    } catch (err) { res.status(500).json({ error: 'Failed to send message' }); }
});

// Socket Connection Logic
io.on('connection', (socket) => {
    socket.on('join', (userId) => {
        socket.join(`user_${userId}`);
        console.log(`[SOCKET] User ${userId} joined their room`);
    });

    socket.on('disconnect', () => {
        console.log('[SOCKET] User disconnected');
    });
});

app.put('/api/users/profile', async (req, res) => {
    try {
        const { phoneNumber, name, photoUrl } = req.body;
        await run('UPDATE users SET phoneNumber = ?, name = ?, photoUrl = ? WHERE id = ?', [phoneNumber, name, photoUrl, req.user.userId]);
        res.json({ success: true });
    } catch (err) { res.status(500).json({ error: 'Failed to update profile' }); }
});

// MODULE 2.9: Parent Homework Monitoring
app.get('/api/student/assignments', async (req, res) => {
    try {
        const { userId } = req.query;
        if (req.user.role !== 'ADMIN' && req.user.userId !== userId) return res.status(403).json({ error: 'Denied' });
        
        const assignments = await query(`
            SELECT a.*, s.status as submissionStatus, s.grade, s.feedback
            FROM assignments a
            JOIN class_memberships m ON a.classId = m.classId
            LEFT JOIN submissions s ON a.id = s.assignmentId AND s.studentId = ?
            WHERE m.userId = ? AND a.isDeleted = 0
            ORDER BY a.dueDate ASC
        `, [userId, userId]);
        res.json(assignments);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

app.get('/api/parent/student/:id/homework', requireRole(['PARENT']), async (req, res) => {
    try {
        const { id: studentId } = req.params;
        // Verify relationship
        const rel = await get('SELECT * FROM parent_student_relationships WHERE parentId = ? AND studentId = ?', [req.user.userId, studentId]);
        if (!rel) return res.status(403).json({ error: 'Unauthorized student access' });

        const homework = await query(`
            SELECT a.*, s.status as submissionStatus, s.grade, s.feedback
            FROM assignments a
            JOIN class_memberships m ON a.classId = m.classId
            LEFT JOIN submissions s ON a.id = s.assignmentId AND s.studentId = ?
            WHERE m.userId = ? AND a.isDeleted = 0
            ORDER BY a.dueDate ASC
        `, [studentId, studentId]);
        res.json(homework);
    } catch (err) { res.status(500).json({ error: 'Failed' }); }
});

// Helper: check if notification was sent recently (deduplication)
async function wasNotifiedRecently(userId, title, withinHours = 24) {
    const threshold = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString();
    const existing = await get(
        `SELECT id FROM notifications WHERE userId = ? AND title = ? AND createdAt >= ? LIMIT 1`,
        [userId, title, threshold]
    );
    return !!existing;
}

// MODULE 1.5a: Morning Cron (8 AM) — Remind staff to take attendance
cron.schedule('0 8 * * 1-6', async () => {
    console.log('[CRON-8AM] Sending attendance reminder to staff...');
    try {
        const staffMembers = await query(
            `SELECT id, organizationId FROM users WHERE role IN ('STAFF', 'ADMIN') AND isDeleted = 0 AND isActive = 1`
        );
        for (const staff of staffMembers) {
            const alreadyNotified = await wasNotifiedRecently(staff.id, 'Daily Attendance Reminder', 20);
            if (!alreadyNotified) {
                await triggerNotification(
                    staff.id, 'STAFF', 'ATTENDANCE',
                    'Daily Attendance Reminder',
                    'Don\'t forget to mark attendance for your classes today.',
                    '/dashboard',
                    staff.organizationId
                );
            }
        }
    } catch (err) {
        console.error('[CRON-8AM ERROR]', err);
    }
});

// MODULE 1.5b: Evening Cron (5 PM) — Low attendance alerts + consecutive absence + homework reminders
cron.schedule('0 17 * * *', async () => {
    console.log('[CRON-5PM] Running daily attendance and assignment checks...');
    try {
        // Process per-org for isolation
        const orgs = await query('SELECT id FROM organizations WHERE isDeleted = 0');
        for (const org of orgs) {
            const students = await query(
                `SELECT id, organizationId FROM users WHERE role = 'STUDENT' AND isDeleted = 0 AND isActive = 1 AND organizationId = ?`,
                [org.id]
            );

            for (const student of students) {
                // Low attendance warning (<75%)
                const stats = await get(`
                    SELECT COUNT(*) as total, SUM(CASE WHEN status IN ('PRESENT', 'ON_DUTY') THEN 1 ELSE 0 END) as present
                    FROM attendance_records WHERE studentId = ? AND organizationId = ? AND isDeleted = 0
                `, [student.id, org.id]);

                if (stats && stats.total >= 5) {
                    const percentage = (stats.present / stats.total) * 100;
                    if (percentage < 75) {
                        // Student alert (deduplicated)
                        if (!(await wasNotifiedRecently(student.id, 'Attendance Warning', 24))) {
                            await triggerNotification(student.id, 'STUDENT', 'ATTENDANCE', 'Attendance Warning',
                                `Your attendance is ${percentage.toFixed(1)}%. Minimum required is 75%.`,
                                '/dashboard', org.id);
                        }
                        // Parent alert (deduplicated)
                        const parents = await query('SELECT parentId FROM parent_student_relationships WHERE studentId = ?', [student.id]);
                        for (const p of parents) {
                            if (!(await wasNotifiedRecently(p.parentId, 'Low Attendance Warning', 24))) {
                                await triggerNotification(p.parentId, 'PARENT', 'ATTENDANCE', 'Low Attendance Warning',
                                    `Attendance alert: Your child's attendance is ${percentage.toFixed(1)}%.`,
                                    '/dashboard', org.id);
                            }
                        }
                    }
                }

                // Consecutive Absence Detection (3 days)
                const recent = await query(`
                    SELECT status FROM attendance_records 
                    WHERE studentId = ? AND organizationId = ? AND isDeleted = 0 
                    ORDER BY joinedAt DESC LIMIT 3
                `, [student.id, org.id]);

                if (recent.length === 3 && recent.every(r => r.status === 'ABSENT')) {
                    const parents = await query('SELECT parentId FROM parent_student_relationships WHERE studentId = ?', [student.id]);
                    for (const p of parents) {
                        if (!(await wasNotifiedRecently(p.parentId, 'Consecutive Absence Alert', 24))) {
                            await triggerNotification(p.parentId, 'PARENT', 'ATTENDANCE', 'Consecutive Absence Alert',
                                `Your child has been absent for 3 consecutive days. Please contact the school.`,
                                '/dashboard', org.id);
                        }
                    }
                }

                // Homework Reminder (due tomorrow, not yet submitted)
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const tomorrowStr = tomorrow.toISOString().split('T')[0];

                const dueSoon = await query(`
                    SELECT a.id, a.title FROM assignments a
                    JOIN class_memberships m ON a.classId = m.classId
                    LEFT JOIN submissions s ON a.id = s.assignmentId AND s.studentId = ?
                    WHERE m.userId = ? AND a.dueDate LIKE ? AND s.id IS NULL AND a.isDeleted = 0
                `, [student.id, student.id, `${tomorrowStr}%`]);

                for (const hw of dueSoon) {
                    if (!(await wasNotifiedRecently(student.id, 'Homework Due Tomorrow', 20))) {
                        await triggerNotification(student.id, 'STUDENT', 'ASSIGNMENT', 'Homework Due Tomorrow',
                            `Reminder: "${hw.title}" is due tomorrow.`, '/dashboard', org.id);
                    }
                }
            }
        }
    } catch (err) {
        console.error('[CRON-5PM ERROR]', err);
    }
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[GLOBAL ERROR]', err);
    res.status(500).json({ error: 'Internal Server Error', details: err.message, stack: err.stack });
});

// start server only when not running under tests
if (process.env.NODE_ENV !== 'test') {
    server.listen(PORT, () => console.log(`Classroom Server (SQLite) running on port ${PORT}`));
}

export default app;
console.log('[INDEX] Module loaded successfully');
