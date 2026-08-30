import { pool } from '../db/pool.js';

export interface ChecklistItem {
  id: string;
  session_id: string;
  stage: 'MACHINE_CHECKS' | 'TOOLS' | 'WORKPIECE';
  item_key: string;
  label: string;
  meta: any;
  confirmed: boolean;
  confirmed_at: string | null;
  sort_order: number;
}

export interface Session {
  id: string;
  machine_id: string;
  work_order: string;
  current_stage: 'MACHINE_CHECKS' | 'TOOLS' | 'WORKPIECE' | 'READY_REVIEW' | 'OPERATION';
  operation_status: 'READY' | 'RUNNING' | 'STOPPED';
  created_at: string;
  updated_at: string;
  checklist_items?: ChecklistItem[];
}

export async function getSessionWithItems(sessionId: string): Promise<Session | null> {
  const sessionResult = await pool.query('SELECT * FROM sessions WHERE id = $1', [sessionId]);
  if (sessionResult.rows.length === 0) {
    return null;
  }
  const session = sessionResult.rows[0] as Session;

  const itemsResult = await pool.query(
    'SELECT * FROM checklist_items WHERE session_id = $1 ORDER BY sort_order ASC',
    [sessionId]
  );
  session.checklist_items = itemsResult.rows as ChecklistItem[];
  return session;
}

export async function confirmChecklistItem(itemId: string): Promise<ChecklistItem | null> {
  const result = await pool.query(
    `UPDATE checklist_items
     SET confirmed = true, confirmed_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [itemId]
  );
  if (result.rows.length === 0) {
    return null;
  }
  return result.rows[0] as ChecklistItem;
}

export async function advanceSessionStage(sessionId: string): Promise<{ success: boolean; session?: Session; error?: string; status: number }> {
  const session = await getSessionWithItems(sessionId);
  if (!session) {
    return { success: false, error: 'Session not found', status: 404 };
  }

  const { current_stage } = session;

  if (current_stage === 'OPERATION') {
    return { success: false, error: 'Already at the final operation stage', status: 400 };
  }

  const stageOrder: Array<Session['current_stage']> = ['MACHINE_CHECKS', 'TOOLS', 'WORKPIECE', 'READY_REVIEW', 'OPERATION'];
  const currentIndex = stageOrder.indexOf(current_stage);
  const nextStage = stageOrder[currentIndex + 1];

  // Validate current stage checklist items
  if (current_stage === 'MACHINE_CHECKS' || current_stage === 'TOOLS' || current_stage === 'WORKPIECE') {
    const stageItems = (session.checklist_items || []).filter(item => item.stage === current_stage);
    const allConfirmed = stageItems.length > 0 && stageItems.every(item => item.confirmed);
    if (!allConfirmed) {
      return {
        success: false,
        error: `Cannot advance: not all items for stage '${current_stage}' are confirmed.`,
        status: 409
      };
    }
  } else if (current_stage === 'READY_REVIEW') {
    // For READY_REVIEW, verify ALL checklist items are confirmed
    const allItems = session.checklist_items || [];
    const allConfirmed = allItems.length > 0 && allItems.every(item => item.confirmed);
    if (!allConfirmed) {
      return {
        success: false,
        error: 'Cannot proceed to operation: some checks are missing.',
        status: 409
      };
    }
  }

  // Perform database update
  await pool.query(
    `UPDATE sessions
     SET current_stage = $1, updated_at = NOW()
     WHERE id = $2`,
    [nextStage, sessionId]
  );

  const updatedSession = await getSessionWithItems(sessionId);
  return { success: true, session: updatedSession!, status: 200 };
}

