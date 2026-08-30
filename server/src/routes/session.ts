import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { getSessionWithItems } from '../services/sessionService.js';

export const sessionRouter = Router();

sessionRouter.get('/', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const session = await getSessionWithItems(req.sessionId!);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    return res.json(session);
  } catch (err) {
    console.error('Error fetching session:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
