import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { startOperation, stopOperation } from '../services/sessionService.js';

export const operationRouter = Router();

operationRouter.post('/start', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await startOperation(req.sessionId!);
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.json({ success: true, session: result.session });
  } catch (err) {
    console.error('Error starting operation:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

operationRouter.post('/stop', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const result = await stopOperation(req.sessionId!);
    if (!result.success) {
      return res.status(result.status).json({ error: result.error });
    }
    return res.json({ success: true, session: result.session });
  } catch (err) {
    console.error('Error stopping operation:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
