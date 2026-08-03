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
      const profile = await this.get('/auth/me');
      if (!profile) return;
      
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
      return profile;
    } catch(e) {
      console.error("Failed to save account", e);
      return null;
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
      
      if (response.status === 401 && !options._retry) {
        if (!url.includes('/auth/login') && !url.includes('/auth/register')) {
          let refreshed = false;
          if (this.getRefreshToken()) {
            refreshed = await this.refreshToken();
          }
          
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
        const json = await res.json();
        if (json.data && json.data.access_token) {
          this.setToken(json.data.access_token);
          if (json.data.refresh_token) {
            this.setRefreshToken(json.data.refresh_token);
          }
          return true;
        }
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
  },

  // Admin Methods
  getShareData(token) {
    return this.get(`/share/${token}`);
  },

  // User Articles
  getUserArticles() {
    return this.get('/articles');
  },

  // User Notifications
  getUserNotifications() {
    return this.get('/notifications');
  },

  // User Feedback
  submitFeedback(data) {
    return this.post('/feedback', data);
  },

  getAdminStats() {
    return this.get('/admin/stats');
  },
  
  getAdminUsers() {
    return this.get('/admin/users');
  },
  
  getAdminUserDetail(userId) {
    return this.get(`/admin/users/${userId}`);
  },

  getAdminTriageLogs() {
    return this.get('/admin/health/triage-logs');
  },

  toggleUserStatus(userId) {
    return this.put(`/admin/users/${userId}/status`, {});
  },

  addAdminUser(userData) {
    return this.post('/admin/users', userData);
  },

  deleteAdminUser(userId) {
    return this.delete(`/admin/users/${userId}`);
  },

  updateAdminUserProfile(userId, data) {
    return this.put(`/admin/users/${userId}/profile`, data);
  },

  suspendUser(userId) {
    return this.put(`/admin/users/${userId}/suspend`, {});
  },

  banUser(userId) {
    return this.put(`/admin/users/${userId}/ban`, {});
  },

  activateUser(userId) {
    return this.put(`/admin/users/${userId}/activate`, {});
  },

  softDeleteUser(userId) {
    return this.put(`/admin/users/${userId}/soft-delete`, {});
  },

  restoreUser(userId) {
    return this.put(`/admin/users/${userId}/restore`, {});
  },

  resetUserPassword(userId) {
    return this.post(`/admin/users/${userId}/reset-password`, {});
  },

  verifyUserEmail(userId) {
    return this.put(`/admin/users/${userId}/verify-email`, {});
  },

  verifyUserPhone(userId) {
    return this.put(`/admin/users/${userId}/verify-phone`, {});
  },

  changeUserRole(userId, role) {
    return this.put(`/admin/users/${userId}/role`, { role });
  },

  loginAsUser(userId) {
    return this.post(`/admin/users/${userId}/login-as`, {});
  },

  exportUserData(userId) {
    return this.get(`/admin/users/${userId}/export`);
  },

  downloadUserMedicalHistory(userId) {
    return this.get(`/admin/users/${userId}/medical-history`);
  },

  // Admin Medical Records
  getAdminMedicalRecords() {
    return this.get('/admin/medical-records');
  },
  
  updateMedicalRecordStatus(recordId, status) {
    return this.put(`/admin/medical-records/${recordId}/status`, { status });
  },

  softDeleteMedicalRecord(recordId) {
    return this.put(`/admin/medical-records/${recordId}/soft-delete`, {});
  },

  restoreMedicalRecord(recordId) {
    return this.put(`/admin/medical-records/${recordId}/restore`, {});
  },

  hardDeleteMedicalRecord(recordId) {
    return this.delete(`/admin/medical-records/${recordId}`);
  },

  replaceMedicalRecordFile(recordId, formData) {
    return this.request(`/admin/medical-records/${recordId}/file`, {
      method: 'PUT',
      body: formData,
      headers: {
        'Authorization': `Bearer ${this.getToken()}`
        // Do not set Content-Type, let the browser set it for FormData
      }
    });
  },

  // Admin Smart Trackers
  getAdminTrackerStats() {
    return this.get('/admin/trackers/stats');
  },

  getAdminTrackerLogs(trackerType, limit = 50) {
    return this.get(`/admin/trackers/logs/${trackerType}?limit=${limit}`);
  },

  deleteAdminTrackerLog(trackerType, logId) {
    return this.delete(`/admin/trackers/logs/${trackerType}/${logId}`);
  },

  // Admin AI Chat Management
  getAdminChatAnalytics() {
    return this.get('/admin/chats/analytics');
  },

  getAdminChats(module = 'all', search = '', limit = 100) {
    return this.get(`/admin/chats?module=${module}&search=${search}&limit=${limit}`);
  },

  flagAdminChat(chatId, isFlagged = true) {
    return this.put(`/admin/chats/${chatId}/flag`, { is_flagged: isFlagged });
  },

  deleteAdminChat(chatId) {
    return this.delete(`/admin/chats/${chatId}`);
  },

  // Admin AI Prompt Management
  getAdminPrompts() {
    return this.get('/admin/prompts');
  },

  updateAdminPrompt(promptId, content) {
    return this.put(`/admin/prompts/${promptId}`, { content });
  },

  getAdminPromptVersions(promptId) {
    return this.get(`/admin/prompts/${promptId}/versions`);
  },

  rollbackAdminPrompt(promptId, versionId) {
    return this.post(`/admin/prompts/${promptId}/rollback`, { version_id: versionId });
  },

  testAdminPrompt(module, message, context = '') {
    return this.post(`/admin/prompts/${module}/test`, { message, context });
  },

  // Admin Fitness Management
  getAdminExercises() {
    return this.get('/admin/fitness/exercises');
  },

  createAdminExercise(data) {
    return this.post('/admin/fitness/exercises', data);
  },

  updateAdminExercise(id, data) {
    return this.put(`/admin/fitness/exercises/${id}`, data);
  },

  deleteAdminExercise(id) {
    return this.delete(`/admin/fitness/exercises/${id}`);
  },

  getAdminWorkoutPlans() {
    return this.get('/admin/fitness/workout-plans');
  },

  createAdminWorkoutPlan(data) {
    return this.post('/admin/fitness/workout-plans', data);
  },

  updateAdminWorkoutPlan(id, data) {
    return this.put(`/admin/fitness/workout-plans/${id}`, data);
  },

  deleteAdminWorkoutPlan(id) {
    return this.delete(`/admin/fitness/workout-plans/${id}`);
  },

  // Admin Medicine Management
  getAdminMedicines() {
    return this.get('/admin/medicines');
  },

  createAdminMedicine(data) {
    return this.post('/admin/medicines', data);
  },

  updateAdminMedicine(id, data) {
    return this.put(`/admin/medicines/${id}`, data);
  },

  deleteAdminMedicine(id) {
    return this.delete(`/admin/medicines/${id}`);
  },

  // Admin Disease Database
  getAdminDiseases() {
    return this.get('/admin/diseases');
  },
  createAdminDisease(data) {
    return this.post('/admin/diseases', data);
  },
  updateAdminDisease(id, data) {
    return this.put(`/admin/diseases/${id}`, data);
  },
  deleteAdminDisease(id) {
    return this.delete(`/admin/diseases/${id}`);
  },

  // Admin Symptoms
  getAdminSymptoms() {
    return this.get('/admin/symptoms');
  },
  createAdminSymptom(data) {
    return this.post('/admin/symptoms', data);
  },
  updateAdminSymptom(id, data) {
    return this.put(`/admin/symptoms/${id}`, data);
  },
  deleteAdminSymptom(id) {
    return this.delete(`/admin/symptoms/${id}`);
  },

  getAdminSymptomHistory() {
    return this.get('/admin/symptoms/history');
  },

  // Admin Articles
  getAdminArticles() {
    return this.get('/admin/articles');
  },
  createAdminArticle(data) {
    return this.post('/admin/articles', data);
  },
  updateAdminArticle(id, data) {
    return this.put(`/admin/articles/${id}`, data);
  },
  deleteAdminArticle(id) {
    return this.delete(`/admin/articles/${id}`);
  },

  // Admin Notifications
  getAdminNotifications() {
    return this.get('/admin/notifications');
  },
  createAdminNotification(data) {
    return this.post('/admin/notifications', data);
  },
  deleteAdminNotification(id) {
    return this.delete(`/admin/notifications/${id}`);
  },

  // Admin Diet Management — Recipes
  getAdminRecipes() {
    return this.get('/admin/diet/recipes');
  },
  createAdminRecipe(data) {
    return this.post('/admin/diet/recipes', data);
  },
  updateAdminRecipe(id, data) {
    return this.put(`/admin/diet/recipes/${id}`, data);
  },
  deleteAdminRecipe(id) {
    return this.delete(`/admin/diet/recipes/${id}`);
  },

  // Admin Diet Management — Meal Plans
  getAdminMealPlans() {
    return this.get('/admin/diet/meal-plans');
  },
  createAdminMealPlan(data) {
    return this.post('/admin/diet/meal-plans', data);
  },
  updateAdminMealPlan(id, data) {
    return this.put(`/admin/diet/meal-plans/${id}`, data);
  },
  deleteAdminMealPlan(id) {
    return this.delete(`/admin/diet/meal-plans/${id}`);
  },
  assignMealPlan(id, userIds) {
    return this.post(`/admin/diet/meal-plans/${id}/assign`, { user_ids: userIds });
  },

  // Admin Feedback
  getAdminFeedback() {
    return this.get('/admin/feedback');
  },
  updateAdminFeedback(id, data) {
    return this.put(`/admin/feedback/${id}`, data);
  },
  deleteAdminFeedback(id) {
    return this.delete(`/admin/feedback/${id}`);
  },

  submitFeedback(feedbackData) {
    return this.post('/feedback', feedbackData);
  },

  getUserFeedback() {
    return this.get('/feedback');
  },

  getUserArticles() {
    return this.get('/articles');
  },

  getUserNotifications() {
    return this.get('/notifications');
  },

  // Admin Settings
  getAdminSettings() {
    return this.get('/admin/settings');
  },
  updateAdminSettings(data) {
    return this.put('/admin/settings', data);
  },

  // Admin File Manager
  getAdminFiles(category = '') {
    const url = category ? `/admin/files?category=${encodeURIComponent(category)}` : '/admin/files';
    return this.get(url);
  },
  uploadAdminFile(data) {
    return this.post('/admin/files', data);
  },
  updateAdminFile(id, data) {
    return this.put(`/admin/files/${id}`, data);
  },
  deleteAdminFile(id) {
    return this.delete(`/admin/files/${id}`);
  }
};

export default API;
