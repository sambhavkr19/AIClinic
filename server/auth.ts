import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from './db.js';
import { UserRole } from '../src/types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'clinicpilot_secure_jwt_secret_key_2026';

export interface AuthenticatedUser {
  id: string;
  clinic_id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  specialization?: string;
  registration_number?: string;
  qualification?: string;
  is_active: number;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      clinic_id: user.clinic_id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      clinic_id: string;
      email: string;
      role: UserRole;
    };

    const user = db.prepare('SELECT * FROM users WHERE id = ? AND clinic_id = ? AND is_active = 1').get(
      decoded.id,
      decoded.clinic_id
    ) as AuthenticatedUser | undefined;

    if (!user) {
      res.status(401).json({ error: 'User session invalid or user deactivated.' });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Access denied. Role '${req.user.role}' is not authorized to access this resource. Requires one of: [${allowedRoles.join(', ')}].`
      });
      return;
    }

    next();
  };
}
