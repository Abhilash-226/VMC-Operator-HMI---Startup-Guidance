import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { getSessionWithItems, advanceSessionStage } from '../services/sessionService.js';

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

sessionRouter.post('/advance', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await advanceSessionStage(req.sessionId!);
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.json({ success: true, session: result.session });
  } catch (err) {
    console.error('Error advancing session:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

