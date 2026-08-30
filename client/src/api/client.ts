const API_BASE = import.meta.env.VITE_API_URL || '';

async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`; 
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Automatically send cookies
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
};
