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

export async function startOperation(sessionId: string): Promise<{ success: boolean; session?: Session; error?: string; status: number }> {
  const session = await getSessionWithItems(sessionId);
  if (!session) {
    return { success: false, error: 'Session not found', status: 404 };
  }

  if (session.current_stage !== 'OPERATION') {
    return { success: false, error: 'Cannot start operation: machine is not in the OPERATION stage yet', status: 400 };
  }

  if (session.operation_status === 'RUNNING') {
    return { success: false, error: 'Operation is already running', status: 400 };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Update status to RUNNING
    await client.query(
      `UPDATE sessions
       SET operation_status = 'RUNNING', updated_at = NOW()
       WHERE id = $1`,
      [sessionId]
    );

    // Insert into log
    await client.query(
      `INSERT INTO operation_log (session_id, event, at)
       VALUES ($1, 'START', NOW())`,
      [sessionId]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error starting operation:', err);
    return { success: false, error: 'Internal server error during start', status: 500 };
  } finally {
    client.release();
  }

  const updatedSession = await getSessionWithItems(sessionId);
  return { success: true, session: updatedSession!, status: 200 };
}

export async function stopOperation(sessionId: string): Promise<{ success: boolean; session?: Session; error?: string; status: number }> {
  const session = await getSessionWithItems(sessionId);
  if (!session) {
    return { success: false, error: 'Session not found', status: 404 };
  }

  if (session.current_stage !== 'OPERATION') {
    return { success: false, error: 'Cannot stop operation: machine is not in the OPERATION stage', status: 400 };
  }

  if (session.operation_status !== 'RUNNING') {
    return { success: false, error: 'Operation is not currently running', status: 400 };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Update status to STOPPED
    await client.query(
      `UPDATE sessions
       SET operation_status = 'STOPPED', updated_at = NOW()
       WHERE id = $1`,
      [sessionId]
    );

    // Insert into log
    await client.query(
      `INSERT INTO operation_log (session_id, event, at)
       VALUES ($1, 'STOP', NOW())`,
      [sessionId]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error stopping operation:', err);
    return { success: false, error: 'Internal server error during stop', status: 500 };
  } finally {
    client.release();
  }

  const updatedSession = await getSessionWithItems(sessionId);
  return { success: true, session: updatedSession!, status: 200 };
}

export async function resetSession(sessionId: string): Promise<{ success: boolean; session?: Session; error?: string; status: number }> {
  const session = await getSessionWithItems(sessionId);
  if (!session) {
    return { success: false, error: 'Session not found', status: 404 };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Reset stage to MACHINE_CHECKS and status to READY
    await client.query(
      `UPDATE sessions
       SET current_stage = 'MACHINE_CHECKS', operation_status = 'READY', updated_at = NOW()
       WHERE id = $1`,
      [sessionId]
    );

    // 2. Unconfirm all checklist items
    await client.query(
      `UPDATE checklist_items
       SET confirmed = false, confirmed_at = NULL
       WHERE session_id = $1`,
      [sessionId]
    );

    // 3. Clear logs
    await client.query(
      `DELETE FROM operation_log
       WHERE session_id = $1`,
      [sessionId]
    );

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error resetting session:', err);
    return { success: false, error: 'Internal server error during reset', status: 500 };
  } finally {
    client.release();
  }

  const updatedSession = await getSessionWithItems(sessionId);
  return { success: true, session: updatedSession!, status: 200 };
}



