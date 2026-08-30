const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  
  // Attach token from localStorage if present to bypass third-party cookie restrictions
  const token = localStorage.getItem('sessionId');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let errorMsg = 'An error occurred';
    try {
      const errorJson = await response.json();
      errorMsg = errorJson.error || errorMsg;
    } catch {
      // ignore
    }
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  login(pin: string) {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ pin }),
    });
  },
  getSession() {
    return request('/api/session');
  },
  confirmItem(itemId: string) {
    return request(`/api/checklist/${itemId}/confirm`, {
      method: 'POST',
    });
  },
  advanceSession() {
    return request('/api/session/advance', {
      method: 'POST',
    });
  },
  startOperation() {
    return request('/api/operation/start', {
      method: 'POST',
    });
  },
  stopOperation() {
    return request('/api/operation/stop', {
      method: 'POST',
    });
  },
  resetSession() {
    return request('/api/session/reset', {
      method: 'POST',
    });
  },
};

