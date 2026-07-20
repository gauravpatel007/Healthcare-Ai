/* ============================================
   LifeOS — API Client
   Handles all HTTP requests to the FastAPI backend
   ============================================ */

const API = {
  BASE_URL: 'http://127.0.0.1:8000/api/v1',
  
  getToken() {
    return localStorage.getItem('lifeos_token');
  },
  
  setToken(token) {
    if (token) localStorage.setItem('lifeos_token', token);
    else localStorage.removeItem('lifeos_token');
  },

  getRefreshToken() {
    return localStorage.getItem('lifeos_refresh_token');
  },

  setRefreshToken(token) {
    if (token) localStorage.setItem('lifeos_refresh_token', token);
    else localStorage.removeItem('lifeos_refresh_token');
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  async request(endpoint, options = {}) {
    const url = `${this.BASE_URL}${endpoint}`;
    
    // Default headers
    const headers = {
      ...options.headers
    };

    // Auto-attach JSON content type if body is object (and not FormData)
    if (options.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

    // Attach JWT
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers
    };

    try {
      let response = await fetch(url, config);
      
      // Auto-refresh token logic on 401 Unauthorized
      if (response.status === 401 && this.getRefreshToken() && !options._retry) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          // Retry original request
          config._retry = true;
          config.headers['Authorization'] = `Bearer ${this.getToken()}`;
          response = await fetch(url, config);
        } else {
          App.logout();
          throw new Error("Session expired. Please log in again.");
        }
      }

      // Parse JSON
      let data = null;
      if (response.status !== 204) {
        try {
          data = await response.json();
        } catch (e) {
          console.warn("Could not parse JSON response");
        }
      }

      if (!response.ok) {
        throw new Error(data?.detail || response.statusText || 'API Request Failed');
      }

      return data;
    } catch (error) {
      console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error);
      throw error;
    }
  },

  async refreshToken() {
    try {
      const res = await fetch(`${this.BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.getRefreshToken() })
      });
      if (!res.ok) return false;
      
      const data = await res.json();
      this.setToken(data.access_token);
      return true;
    } catch (e) {
      return false;
    }
  },

  // Convenience methods
  get(endpoint) { return this.request(endpoint, { method: 'GET' }); },
  post(endpoint, body) { return this.request(endpoint, { method: 'POST', body }); },
  put(endpoint, body) { return this.request(endpoint, { method: 'PUT', body }); },
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); },
  
  // For file uploads
  upload(endpoint, formData) { 
    return this.request(endpoint, { 
      method: 'POST', 
      body: formData 
      // Do not set Content-Type header manually for FormData, browser does it automatically with boundary
    }); 
  }
};
