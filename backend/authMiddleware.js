import 'dotenv/config';
import jwt from 'jsonwebtoken';
import { get } from './database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-dev';

export const authMiddleware = async (req, res, next) => {
    try {
        // Read from cookie first, then fall back to header
        const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        // Security Upgrade: Verify user exists and is active in the database
        const user = await get('SELECT id, name, email, role, organizationId, photoUrl FROM users WHERE id = ? AND isDeleted = 0 AND isActive = 1', [decoded.userId || decoded.id]);

        if (!user) {
            return res.status(401).json({ error: 'Session invalid or user inactive' });
        }

        req.user = { ...decoded, ...user, userId: user.id };
        next();
    } catch (err) {
        console.error('[AUTH] Token verification failed:', err.message);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const requireRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            return res.status(401).json({ error: 'Not authenticated or missing role' });
        }

        const allowedRoles = Array.isArray(roles) ? roles : [roles];
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Insufficient privileges' });
        }
        next();
    };
};
