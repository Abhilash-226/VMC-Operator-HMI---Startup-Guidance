import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  sessionId?: string;
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  let sessionId: string | undefined;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    sessionId = authHeader.substring(7);
  }

  if (!sessionId && req.headers.cookie) {
    const cookies = req.headers.cookie.split(';').reduce((acc, c) => {
      const [name, val] = c.trim().split('=');
      if (name && val) {
        acc[name.trim()] = val.trim();
      }
      return acc;
    }, {} as Record<string, string>);
    sessionId = cookies['sessionId'];
  }

  if (!sessionId) {
    return res.status(401).json({ error: 'Unauthorized: No session token provided' });
  }

  req.sessionId = sessionId;
  next();
}
