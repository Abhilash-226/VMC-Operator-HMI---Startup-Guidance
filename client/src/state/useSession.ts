import { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../api/client.js';

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
  checklist_items: ChecklistItem[];
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const pollIntervalRef = useRef<number | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const data = await api.getSession();
      setSession(data);
      setIsAuthenticated(true);
      setError(null);
    } catch (err: any) {
      if (err.message.includes('Unauthorized') || err.message.includes('401')) {
        setIsAuthenticated(false);
        setSession(null);
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (pin: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.login(pin);
      setSession(data.session);
      setIsAuthenticated(true);
      return true;
    } catch (err: any) {
      setError(err.message);
      setIsAuthenticated(false);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const confirmItem = useCallback(async (itemId: string) => {
    try {
      await api.confirmItem(itemId);
      await fetchSession();
    } catch (err: any) {
      setError(err.message);
    }
  }, [fetchSession]);

  const advanceStage = useCallback(async () => {
    setLoading(true);
    try {
      const result = await api.advanceSession();
      setSession(result.session);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const startOperation = useCallback(async () => {
    try {
      const result = await api.startOperation();
      setSession(result.session);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const stopOperation = useCallback(async () => {
    try {
      const result = await api.stopOperation();
      setSession(result.session);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    }
  }, []);

  const logout = useCallback(() => {
    document.cookie = 'sessionId=; Max-Age=0; path=/';
    setSession(null);
    setIsAuthenticated(false);
  }, []);

  // Poll for changes when authenticated
  useEffect(() => {
    fetchSession();

    // Check for sessionId cookie or state
    const interval = window.setInterval(() => {
      const hasSessionCookie = document.cookie.split(';').some(item => item.trim().startsWith('sessionId='));
      if (hasSessionCookie) {
        fetchSession();
      } else {
        setLoading(false);
      }
    }, 3000);

    pollIntervalRef.current = interval;

    return () => {
      if (pollIntervalRef.current !== null) {
        window.clearInterval(pollIntervalRef.current);
      }
    };
  }, [fetchSession]);

  return {
    session,
    loading,
    error,
    isAuthenticated,
    login,
    confirmItem,
    advanceStage,
    startOperation,
    stopOperation,
    logout,
    refresh: fetchSession,
    setError, // allow components to clear/set error
  };
}
