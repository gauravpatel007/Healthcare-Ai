const BASE_URL = 'http://127.0.0.1:8000/api/v1';

const API = {
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

  logout(emailToRemove = null) {
    if (emailToRemove) {
      let accounts = this.getSavedAccounts();
      accounts = accounts.filter(a => a.email !== emailToRemove);
      localStorage.setItem('lifeos_accounts', JSON.stringify(accounts));
      
      // If we just removed the active account, switch to another if available
      if (accounts.length > 0) {
        this.setToken(accounts[0].token);
        this.setRefreshToken(accounts[0].refreshToken);
        window.location.href = '/app';
        return;
      }
    } else {
      localStorage.removeItem('lifeos_accounts'); // Clear all on full logout
    }

    this.setToken(null);
    this.setRefreshToken(null);
    window.location.href = '/';
  },

  getSavedAccounts() {
    try {
      const acc = localStorage.getItem('lifeos_accounts');
      return acc ? JSON.parse(acc) : [];
    } catch(e) { return []; }
  },

  async saveCurrentAccount() {
    try {
      // First, get the profile using the current token
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${this.getToken()}` }
      });
      if (!res.ok) return;
      const profile = await res.json();
      
      const accountsStr = localStorage.getItem('lifeos_accounts');
      let accounts = [];
      if (accountsStr) accounts = JSON.parse(accountsStr);
      
      const newAccount = {
        email: profile.email,
        name: profile.name || profile.email.split('@')[0],
        token: this.getToken(),
        refreshToken: this.getRefreshToken()
      };
      
      const existingIdx = accounts.findIndex(a => a.email === newAccount.email);
      if (existingIdx >= 0) {
        accounts[existingIdx] = newAccount;
      } else {
        accounts.push(newAccount);
      }
      
      localStorage.setItem('lifeos_accounts', JSON.stringify(accounts));
    } catch(e) {
      console.error("Failed to save account", e);
    }
  },

  switchAccount(email) {
    const accounts = this.getSavedAccounts();
    const target = accounts.find(a => a.email === email);
    if (target) {
      this.setToken(target.token);
      this.setRefreshToken(target.refreshToken);
      window.location.href = '/app';
    }
  },

  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    
    const headers = {
      ...options.headers
    };

    if (options.body && !(options.body instanceof FormData) && !(options.body instanceof URLSearchParams) && typeof options.body !== 'string') {
      headers['Content-Type'] = 'application/json';
      options.body = JSON.stringify(options.body);
    }

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
      
      if (response.status === 401 && this.getRefreshToken() && !options._retry) {
        const refreshed = await this.refreshToken();
        if (refreshed) {
          config._retry = true;
          config.headers['Authorization'] = `Bearer ${this.getToken()}`;
          response = await fetch(url, config);
        } else {
          // Only remove the expired account, not all accounts
          const expiredToken = this.getToken();
          const accounts = this.getSavedAccounts();
          const expiredAcc = accounts.find(a => a.token === expiredToken);
          if (expiredAcc) {
            this.logout(expiredAcc.email);
          } else {
            this.logout();
          }
          throw new Error("Session expired. Please log in again.");
        }
      }

      let data = null;
      if (response.status !== 204) {
        try {
          data = await response.json();
        } catch (e) {
          console.warn("Could not parse JSON response");
        }
      }

      if (!response.ok) {
        let errorMsg = response.statusText || 'API Request Failed';
        if (data) {
          if (data.detail) {
            errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
          } else if (data.error && data.error.message) {
            errorMsg = data.error.message;
            if (data.error.details) {
              errorMsg += ' - ' + JSON.stringify(data.error.details);
            }
          }
        }
        throw new Error(errorMsg);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${options.method || 'GET'} ${endpoint}]:`, error);
      throw error;
    }
  },

  async refreshToken() {
    try {
      const res = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.getRefreshToken() })
      });

      if (res.ok) {
        const data = await res.json();
        this.setToken(data.access_token);
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { method: 'GET', ...options });
  },

  post(endpoint, body, options = {}) {
    return this.request(endpoint, { method: 'POST', body, ...options });
  },

  put(endpoint, body, options = {}) {
    return this.request(endpoint, { method: 'PUT', body, ...options });
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { method: 'DELETE', ...options });
  }
};

export default API;
