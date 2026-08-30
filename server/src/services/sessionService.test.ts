import { vi, describe, it, expect, beforeEach } from 'vitest';
import { pool } from '../db/pool.js';
import {
  advanceSessionStage,
  startOperation,
  stopOperation,
  Session,
  ChecklistItem
} from './sessionService.js';

vi.mock('../db/pool.js', () => {
  const queryMock = vi.fn();
  const mockClient = {
    query: vi.fn(),
    release: vi.fn()
  };
  return {
    pool: {
      query: queryMock,
      connect: vi.fn(() => Promise.resolve(mockClient))
    }
  };
});

describe('sessionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('advanceSessionStage', () => {
    it('should block advancement if some checklist items are unconfirmed', async () => {
      const mockSession: Session = {
        id: 'session-id',
        machine_id: 'VMC-03',
        work_order: 'WO-123',
        current_stage: 'MACHINE_CHECKS',
        operation_status: 'READY',
        created_at: '',
        updated_at: ''
      };

      const mockItems: ChecklistItem[] = [
        { id: '1', session_id: 'session-id', stage: 'MACHINE_CHECKS', item_key: 'chk1', label: 'L1', meta: {}, confirmed: true, confirmed_at: '', sort_order: 1 },
        { id: '2', session_id: 'session-id', stage: 'MACHINE_CHECKS', item_key: 'chk2', label: 'L2', meta: {}, confirmed: false, confirmed_at: null, sort_order: 2 }
      ];

      const queryMock = pool.query as any;
      queryMock
        .mockResolvedValueOnce({ rows: [mockSession] }) // getSessionWithItems: session
        .mockResolvedValueOnce({ rows: mockItems });   // getSessionWithItems: items

      const result = await advanceSessionStage('session-id');
      expect(result.success).toBe(false);
      expect(result.status).toBe(409);
      expect(result.error).toContain('not all items for stage \'MACHINE_CHECKS\' are confirmed');
    });

    it('should advance to the next stage if all items are confirmed', async () => {
      const mockSession: Session = {
        id: 'session-id',
        machine_id: 'VMC-03',
        work_order: 'WO-123',
        current_stage: 'MACHINE_CHECKS',
        operation_status: 'READY',
        created_at: '',
        updated_at: ''
      };

      const mockItems: ChecklistItem[] = [
        { id: '1', session_id: 'session-id', stage: 'MACHINE_CHECKS', item_key: 'chk1', label: 'L1', meta: {}, confirmed: true, confirmed_at: '', sort_order: 1 },
        { id: '2', session_id: 'session-id', stage: 'MACHINE_CHECKS', item_key: 'chk2', label: 'L2', meta: {}, confirmed: true, confirmed_at: '', sort_order: 2 }
      ];

      const queryMock = pool.query as any;
      queryMock
        // For first getSessionWithItems
        .mockResolvedValueOnce({ rows: [mockSession] })
        .mockResolvedValueOnce({ rows: mockItems })
        // For UPDATE query
        .mockResolvedValueOnce({ rows: [] })
        // For final getSessionWithItems
        .mockResolvedValueOnce({ rows: [{ ...mockSession, current_stage: 'TOOLS' }] })
        .mockResolvedValueOnce({ rows: mockItems });

      const result = await advanceSessionStage('session-id');
      expect(result.success).toBe(true);
      expect(result.status).toBe(200);
      expect(result.session?.current_stage).toBe('TOOLS');
      expect(queryMock).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE sessions'),
        ['TOOLS', 'session-id']
      );
    });
  });

  describe('operation state guards', () => {
    it('should start operation from READY state when in OPERATION stage', async () => {
      const mockSession: Session = {
        id: 'session-id',
        machine_id: 'VMC-03',
        work_order: 'WO-123',
        current_stage: 'OPERATION',
        operation_status: 'READY',
        created_at: '',
        updated_at: ''
      };

      const queryMock = pool.query as any;
      const connectMock = pool.connect as any;
      const clientMock = await connectMock();

      queryMock
        // For getSessionWithItems inside startOperation
        .mockResolvedValueOnce({ rows: [mockSession] })
        .mockResolvedValueOnce({ rows: [] })
        // For getSessionWithItems after transaction
        .mockResolvedValueOnce({ rows: [{ ...mockSession, operation_status: 'RUNNING' }] })
        .mockResolvedValueOnce({ rows: [] });

      clientMock.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // UPDATE
        .mockResolvedValueOnce({ rows: [] }) // INSERT INTO log
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const result = await startOperation('session-id');
      expect(result.success).toBe(true);
      expect(result.session?.operation_status).toBe('RUNNING');
      expect(clientMock.query.mock.calls.some((call: any) => call[0].includes('UPDATE sessions') && call[0].includes('RUNNING'))).toBe(true);
      expect(clientMock.query.mock.calls.some((call: any) => call[0].includes('INSERT INTO operation_log'))).toBe(true);
    });

    it('should block start operation if already RUNNING', async () => {
      const mockSession: Session = {
        id: 'session-id',
        machine_id: 'VMC-03',
        work_order: 'WO-123',
        current_stage: 'OPERATION',
        operation_status: 'RUNNING',
        created_at: '',
        updated_at: ''
      };

      const queryMock = pool.query as any;
      queryMock
        .mockResolvedValueOnce({ rows: [mockSession] })
        .mockResolvedValueOnce({ rows: [] });

      const result = await startOperation('session-id');
      expect(result.success).toBe(false);
      expect(result.status).toBe(400);
      expect(result.error).toContain('already running');
    });

    it('should stop operation and update state to STOPPED', async () => {
      const mockSession: Session = {
        id: 'session-id',
        machine_id: 'VMC-03',
        work_order: 'WO-123',
        current_stage: 'OPERATION',
        operation_status: 'RUNNING',
        created_at: '',
        updated_at: ''
      };

      const queryMock = pool.query as any;
      const connectMock = pool.connect as any;
      const clientMock = await connectMock();

      queryMock
        .mockResolvedValueOnce({ rows: [mockSession] })
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ ...mockSession, operation_status: 'STOPPED' }] })
        .mockResolvedValueOnce({ rows: [] });

      clientMock.query
        .mockResolvedValueOnce({ rows: [] }) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // UPDATE
        .mockResolvedValueOnce({ rows: [] }) // INSERT
        .mockResolvedValueOnce({ rows: [] }); // COMMIT

      const result = await stopOperation('session-id');
      expect(result.success).toBe(true);
      expect(result.session?.operation_status).toBe('STOPPED');
      expect(clientMock.query.mock.calls.some((call: any) => call[0].includes('UPDATE sessions') && call[0].includes('STOPPED'))).toBe(true);
      expect(clientMock.query.mock.calls.some((call: any) => call[0].includes('INSERT INTO operation_log'))).toBe(true);
    });
  });
});
