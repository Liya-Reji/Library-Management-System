// Unified API Client for Express & Netlify Functions

const API = {
  // Use /api by default; works directly on Express and maps to Netlify Functions via netlify.toml redirects
  getBaseUrl() {
    return '/api';
  },

  getToken() {
    return localStorage.getItem('lms_token');
  },

  setToken(token) {
    if (token) {
      localStorage.setItem('lms_token', token);
    } else {
      localStorage.removeItem('lms_token');
    }
  },

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.getBaseUrl()}${endpoint}`;
    
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      const data = await response.json().catch(() => ({
        success: false,
        error: `Unexpected response format from server (${response.status})`
      }));

      if (!response.ok) {
        // If 401 Unauthorized, handle token expiration
        if (response.status === 401 && !url.includes('/auth/login') && !url.includes('/auth/register')) {
          localStorage.removeItem('lms_token');
          localStorage.removeItem('lms_user');
          if (window.location.pathname.includes('admin.html') || window.location.pathname.includes('student.html')) {
            window.location.href = 'login.html?expired=true';
          }
        }
        const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
        throw new Error(errorMsg);
      }

      return data;
    } catch (err) {
      console.error(`API Error on [${options.method || 'GET'}] ${url}:`, err);
      throw err;
    }
  },

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  },

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body)
    });
  },

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
};
