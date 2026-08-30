import { Router } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth.js';
import { confirmChecklistItem } from '../services/sessionService.js';

export const checklistRouter = Router();

checklistRouter.post('/:itemId/confirm', requireAuth, async (req: AuthenticatedRequest, res) => {
  const { itemId } = req.params;

  try {
    const updatedItem = await confirmChecklistItem(itemId);
    if (!updatedItem) {
      return res.status(404).json({ error: 'Checklist item not found' });
    }
    return res.json({ success: true, item: updatedItem });
  } catch (err) {
    console.error('Error confirming item:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
