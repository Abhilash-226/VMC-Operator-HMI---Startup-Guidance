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
