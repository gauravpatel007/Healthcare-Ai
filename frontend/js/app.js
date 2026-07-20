/* ============================================
   LifeOS — Main Application Controller
   ============================================ */

const App = {
  currentPage: 'dashboard',

  modules: {
    'dashboard': { title: 'Health Dashboard', init: () => Dashboard.init() },
    'records': { title: 'Medical Records', init: () => Records.init() },
    'medicine': { title: 'Medicine Management', init: () => Medicine.init() },
    'appointments': { title: 'Appointments', init: () => Appointments.init() },
    'emergency': { title: 'Emergency System', init: () => Emergency.init() },
    'family': { title: 'Family Health', init: () => Family.init() },
    'ai-chat': { title: 'AI Health Assistant', init: () => AIAssistant.init() },
    'ai-symptom': { title: 'Symptom Checker', init: () => AISymptom.init() },
    'ai-nutrition': { title: 'Nutrition Planner', init: () => AINutrition.init() },
    'ai-fitness': { title: 'Fitness Coach', init: () => AIFitness.init() },
    'ai-mental': { title: 'Mental Health', init: () => AIMental.init() },
    'analytics': { title: 'Smart Analytics', init: () => Analytics.init() },
    'trackers': { title: 'Smart Trackers', init: () => Trackers.init() },
    'challenges': { title: 'Health Challenges', init: () => Challenges.init() },
    'expense': { title: 'Expense Tracker', init: () => Expense.init() },
    'settings': { title: 'Settings', init: () => App.renderSettings() }
  },

  async init() {
    // Set up sidebar navigation
    this.setupNavigation();

    // Set up mobile menu
    this.setupMobileMenu();
    
    // Load Theme
    this.loadTheme();

    // Check Authentication
    const isAuthenticated = await this.checkAuth();
    if (isAuthenticated) {
      this.navigate('dashboard');
    }

    console.log('🏥 LifeOS initialized successfully!');
  },

  async checkAuth() {
    if (API.isAuthenticated()) {
      try {
        const res = await API.get('/auth/me');
        this.currentUser = res;
        await this.updateHeader();
        return true;
      } catch (e) {
        // Token expired or invalid — redirect to landing page
        this.logout();
      }
    } else {
      // No token — redirect to landing page for login
      window.location.href = 'index.html';
    }
    return false;
  },

  loadTheme() {
    const savedTheme = localStorage.getItem('lifeos_theme');
    if (savedTheme) {
      document.documentElement.setAttribute('data-theme', savedTheme);
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('lifeos_theme', 'dark');
    }
  },

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    
    localStorage.setItem('lifeos_theme', newTheme);
  },

  logout() {
    API.setToken(null);
    API.setRefreshToken(null);
    this.currentUser = null;
    this.currentProfile = null;
    window.location.href = 'index.html';
  },

  setupNavigation() {
    // Sidebar nav items
    document.querySelectorAll('.sidebar-nav-item[data-page]').forEach(item => {
      item.addEventListener('click', () => {
        this.navigate(item.dataset.page);
      });
    });

    // Also support old .nav-item[data-page] for backward compatibility
    document.querySelectorAll('.nav-item[data-page]').forEach(item => {
      item.addEventListener('click', () => {
        this.navigate(item.dataset.page);
      });
    });
  },

  setupMobileMenu() {
    const toggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (toggle && sidebar) {
      toggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        if (overlay) overlay.classList.toggle('active');
      });
    }

    if (overlay) {
      overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
      });
    }
  },

  navigate(page) {
    if (!this.modules[page]) return;

    this.currentPage = page;

    // Update sidebar nav items
    document.querySelectorAll('.sidebar-nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Also update old nav items (backward compat)
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    // Hide all pages
    document.querySelectorAll('.page-section').forEach(section => {
      section.classList.remove('active');
    });

    // Show target page
    const target = document.getElementById(`page-${page}`);
    if (target) {
      target.classList.add('active');
    }

    // Show/hide right panel (only visible on dashboard)
    const rightPanel = document.getElementById('right-panel');
    const appContainer = document.querySelector('.app-container');
    if (rightPanel && appContainer) {
      if (page === 'dashboard') {
        rightPanel.style.display = '';
        appContainer.style.gridTemplateColumns = 'var(--sidebar-width) 1fr var(--right-panel-width)';
      } else {
        rightPanel.style.display = 'none';
        appContainer.style.gridTemplateColumns = 'var(--sidebar-width) 1fr';
      }
    }

    // Update header title
    const pageTitle = document.querySelector('.page-title');
    if (pageTitle) {
      pageTitle.textContent = this.modules[page].title;
    }

    // Initialize module
    this.modules[page].init();

    // Close mobile sidebar
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  async updateHeader() {
    try {
      if (!this.currentUser) return;
      const res = await API.get('/users/profile');
      this.currentProfile = res;
      
      // Update sidebar user info
      const avatarEl = document.getElementById('sidebar-avatar');
      const nameEl = document.getElementById('sidebar-username');
      const emailEl = document.getElementById('sidebar-email');

      if (this.currentProfile.name) {
        if (avatarEl) avatarEl.textContent = this.currentProfile.name.charAt(0).toUpperCase();
        if (nameEl) nameEl.textContent = this.currentProfile.name;
      }
      if (this.currentUser.email) {
        if (emailEl) emailEl.textContent = this.currentUser.email;
      }

      // Also update old avatar if exists
      const oldAvatar = document.querySelector('.user-avatar');
      if (oldAvatar && this.currentProfile.name) {
        oldAvatar.textContent = this.currentProfile.name.charAt(0).toUpperCase();
      }
    } catch (e) {
      console.warn("Failed to load profile for header", e);
    }
  },

  renderSettings() {
    const profile = this.currentProfile || { allergies: [], conditions: [] };
    const container = document.getElementById('page-settings');

    container.innerHTML = `
      <div class="section-header" style="background: var(--bg-card); padding: 24px 32px; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 52px; height: 52px; background: rgba(37,99,235,0.08); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </div>
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0; font-family: 'Inter', sans-serif;">Settings</h2>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--success); box-shadow: 0 0 6px var(--success);"></span>
              Manage your profile and preferences
            </p>
          </div>
        </div>
      </div>

      <div class="grid-2 gap-xl">
        <!-- LEFT COLUMN: Profile & Medical -->
        <div style="display:flex; flex-direction:column; gap:24px;">
          
          <div class="glass-card hover-lift">
            <h3 style="margin-bottom:20px; font-size:1.25rem;">👤 Personal Information</h3>
            <div class="form-group" style="margin-bottom:16px;">
              <label class="form-label" style="margin-bottom:6px; display:block;">Full Name</label>
              <input type="text" class="form-input" id="set-name" value="${profile.name}">
            </div>
            <div class="grid-2 gap-md">
              <div class="form-group">
                <label class="form-label" style="margin-bottom:6px; display:block;">Age</label>
                <input type="number" class="form-input" id="set-age" value="${profile.age}">
              </div>
              <div class="form-group">
                <label class="form-label" style="margin-bottom:6px; display:block;">Gender</label>
                <select class="form-select" id="set-gender">
                  <option ${profile.gender === 'Male' ? 'selected' : ''}>Male</option>
                  <option ${profile.gender === 'Female' ? 'selected' : ''}>Female</option>
                  <option ${profile.gender === 'Other' ? 'selected' : ''}>Other</option>
                </select>
              </div>
            </div>
          </div>

          <div class="glass-card hover-lift">
            <h3 style="margin-bottom:20px; font-size:1.25rem;">🏥 Medical Profile</h3>
            <div class="grid-3 gap-md" style="margin-bottom:16px;">
              <div class="form-group">
                <label class="form-label" style="margin-bottom:6px; display:block;">Weight (kg)</label>
                <input type="number" class="form-input" id="set-weight" value="${profile.weight}">
              </div>
              <div class="form-group">
                <label class="form-label" style="margin-bottom:6px; display:block;">Height (cm)</label>
                <input type="number" class="form-input" id="set-height" value="${profile.height}">
              </div>
              <div class="form-group">
                <label class="form-label" style="margin-bottom:6px; display:block;">Blood Type</label>
                <select class="form-select" id="set-blood">
                  ${['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => `<option ${profile.blood_type === b ? 'selected' : ''}>${b}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-group" style="margin-bottom:16px;">
              <label class="form-label" style="margin-bottom:6px; display:block;">Allergies (comma separated)</label>
              <input type="text" class="form-input" id="set-allergies" value="${profile.allergies.join(', ')}">
            </div>
            <div class="form-group" style="margin-bottom:16px;">
              <label class="form-label" style="margin-bottom:6px; display:block;">Medical Conditions</label>
              <input type="text" class="form-input" id="set-conditions" value="${profile.conditions.join(', ')}">
            </div>
          </div>

          <!-- Emergency Contacts -->
          <div class="glass-card hover-lift">
            <h3 style="margin-bottom:20px; font-size:1.25rem;">🚨 Emergency Contacts (ICE)</h3>
            
            <div class="grid-2 gap-md" style="margin-bottom:12px;">
              <div class="form-group" style="margin-bottom:0;">
                <input type="text" class="form-input" id="ice1-name" placeholder="Name" value="${profile.ice1_name || ''}">
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <input type="text" class="form-input" id="ice1-rel" placeholder="Relationship" value="${profile.ice1_rel || ''}">
              </div>
            </div>
            <div class="form-group" style="margin-bottom:0;">
              <input type="tel" class="form-input" id="ice1-phone" placeholder="Phone Number" value="${profile.ice1_phone || ''}">
            </div>

            <div id="secondary-contact-container" style="max-height:${profile.ice2_name || profile.ice2_phone ? '500px' : '0'}; opacity:${profile.ice2_name || profile.ice2_phone ? '1' : '0'}; overflow:hidden; transition:all 0.4s cubic-bezier(0.4, 0, 0.2, 1); margin-top:${profile.ice2_name || profile.ice2_phone ? '20px' : '0'}; border-top:${profile.ice2_name || profile.ice2_phone ? '1px solid rgba(255,255,255,0.05)' : '0px solid transparent'}; padding-top:${profile.ice2_name || profile.ice2_phone ? '20px' : '0'};">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <h4 style="font-size:0.85rem; color:var(--text-muted); margin:0; text-transform:uppercase; letter-spacing:0.05em;">Secondary Contact</h4>
                <button class="btn btn-sm" style="background:transparent; border:none; color:var(--danger); font-size:0.8rem; padding:0;" onclick="
                  const sec = document.getElementById('secondary-contact-container');
                  sec.style.maxHeight = '0';
                  sec.style.opacity = '0';
                  sec.style.marginTop = '0';
                  sec.style.paddingTop = '0';
                  sec.style.borderTop = '0px solid transparent';
                  document.getElementById('add-contact-btn').style.display='block'; 
                  
                  setTimeout(() => {
                    document.getElementById('ice2-name').value=''; 
                    document.getElementById('ice2-rel').value=''; 
                    document.getElementById('ice2-phone').value=''; 
                  }, 400);
                  
                  const wrap = document.getElementById('save-btn-wrapper');
                  wrap.style.transform = 'scale(0.95)';
                  wrap.style.opacity = '0';
                  setTimeout(() => {
                    document.getElementById('bottom-save-zone').appendChild(wrap);
                    wrap.style.marginTop = '24px';
                    requestAnimationFrame(() => {
                      wrap.style.transform = 'scale(1)';
                      wrap.style.opacity = '1';
                    });
                  }, 250);
                ">✖ Remove</button>
              </div>
              <div class="grid-2 gap-md" style="margin-bottom:12px;">
                <div class="form-group" style="margin-bottom:0;">
                  <input type="text" class="form-input" id="ice2-name" placeholder="Name" value="${profile.ice2_name || ''}">
                </div>
                <div class="form-group" style="margin-bottom:0;">
                  <input type="text" class="form-input" id="ice2-rel" placeholder="Relationship" value="${profile.ice2_rel || ''}">
                </div>
              </div>
              <div class="form-group" style="margin-bottom:0;">
                <input type="tel" class="form-input" id="ice2-phone" placeholder="Phone Number" value="${profile.ice2_phone || ''}">
              </div>
            </div>
            
            <button id="add-contact-btn" class="btn btn-sm btn-outline w-full" style="margin-top:16px; border-radius:12px; display:${profile.ice2_name || profile.ice2_phone ? 'none' : 'block'};" onclick="
              const sec = document.getElementById('secondary-contact-container');
              sec.style.maxHeight = '500px';
              sec.style.opacity = '1';
              sec.style.marginTop = '20px';
              sec.style.paddingTop = '20px';
              sec.style.borderTop = '1px solid rgba(255,255,255,0.05)';
              this.style.display='none'; 
              
              const wrap = document.getElementById('save-btn-wrapper');
              wrap.style.transform = 'scale(0.95)';
              wrap.style.opacity = '0';
              setTimeout(() => {
                document.getElementById('right-col-save-zone').appendChild(wrap);
                wrap.style.marginTop = '0px';
                requestAnimationFrame(() => {
                  wrap.style.transform = 'scale(1)';
                  wrap.style.opacity = '1';
                });
              }, 250);
            ">+ Add another contact</button>
          </div>

        </div>

        <!-- RIGHT COLUMN: Preferences & Security -->
        <div style="display:flex; flex-direction:column; gap:24px;">
          
          <!-- Calculated Goals -->
          <div class="glass-card hover-lift">
            <h3 style="margin-bottom:16px; font-size:1.25rem;">🎯 Health Goals</h3>
            <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:16px;">Dynamically calculated from your profile metrics.</p>
            <div class="grid-2 gap-md">
              <div class="list-item" style="margin-bottom:0;">
                <div class="item-icon" style="background:rgba(255, 107, 107, 0.1); color:var(--accent);">🔥</div>
                <div class="item-content">
                  <div class="item-title">Calories (TDEE)</div>
                  <div class="item-subtitle">${Math.round(Utils.calculateBMR(profile.weight, profile.height, profile.age, profile.gender) * 1.55)} kcal</div>
                </div>
              </div>
              <div class="list-item" style="margin-bottom:0;">
                <div class="item-icon" style="background:rgba(0, 210, 211, 0.1); color:var(--info);">💧</div>
                <div class="item-content">
                  <div class="item-title">Water Goal</div>
                  <div class="item-subtitle">${Math.round(profile.weight * 0.033 * 10) / 10} L/day</div>
                </div>
              </div>
              <div class="list-item" style="margin-bottom:0;">
                <div class="item-icon" style="background:rgba(52, 211, 153, 0.1); color:var(--success);">💪</div>
                <div class="item-content">
                  <div class="item-title">Protein Goal</div>
                  <div class="item-subtitle">${Math.round(profile.weight * 1.2)} g/day</div>
                </div>
              </div>
              <div class="list-item" style="margin-bottom:0;">
                <div class="item-icon" style="background:rgba(108, 92, 231, 0.1); color:var(--primary-light);">⚖️</div>
                <div class="item-content">
                  <div class="item-title">Current BMI</div>
                  <div class="item-subtitle">${Utils.calculateBMI(profile.weight, profile.height)}</div>
                </div>
              </div>
            </div>
          </div>

          <!-- App Settings removed per user request -->

          <div class="glass-card hover-lift">
            <h3 style="margin-bottom:16px; font-size:1.25rem;">🔒 Security</h3>
            <div class="list-item">
              <div class="item-icon" style="background:rgba(37,99,235,0.10); color:var(--primary);">🔐</div>
              <div class="item-content">
                <div class="item-title">Face Login</div>
                <div class="item-subtitle">Biometric auth</div>
              </div>
              ${this.currentUser.face_login_enabled 
                ? '<button class="btn btn-sm" style="background:transparent; border:1px solid var(--danger); color:var(--danger);" onclick="App.disableFaceLogin()">Disable</button>'
                : '<button class="btn btn-sm btn-outline" onclick="App.showFaceLogin()">Setup</button>'
              }
            </div>
            <div class="list-item">
              <div class="item-icon" style="background:rgba(52,211,153,0.1); color:var(--success);">🔗</div>
              <div class="item-content">
                <div class="item-title">Secure Sharing</div>
                <div class="item-subtitle">Expiring links</div>
              </div>
              <span class="badge badge-success">Active</span>
            </div>
            <div class="list-item" style="margin-bottom:0;">
              <div class="item-icon" style="background:rgba(245,158,11,0.1); color:var(--warning);">⛓️</div>
              <div class="item-content">
                <div class="item-title">Blockchain</div>
                <div class="item-subtitle">Tamper-proof</div>
              </div>
              <span class="badge badge-warning">Pro</span>
            </div>
          </div>

          <div class="glass-card hover-lift" style="border:1px solid rgba(255,107,107,0.3);">
            <h3 style="margin-bottom:16px; font-size:1.25rem; color:var(--danger);">🗄️ Data Management</h3>
            <div class="flex gap-sm mb-md">
               <button class="btn btn-secondary w-full" onclick="App.exportData('pdf')">📄 Export PDF</button>
               <button class="btn btn-secondary w-full" onclick="App.exportData('excel')">📊 Export Excel</button>
            </div>
            <button class="btn w-full" style="background:transparent; border:1px solid var(--danger); color:var(--danger); font-weight:600;" onclick="App.resetData()">🗑 Reset All Data</button>
            <p style="font-size:0.75rem; color:var(--text-muted); margin-top:12px; text-align:center;">
              Warning: Export fetches data from your private cloud. Resetting deletes all local data immediately.
            </p>
          </div>

          <!-- Zone for Save Button when 2 contacts are visible -->
          <div id="right-col-save-zone">
            ${(profile.ice2_name || profile.ice2_phone) ? `
              <div id="save-btn-wrapper" style="width: 100%; margin-top: 0px; transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform: scale(1);">
                <button class="btn btn-primary w-full hover-lift" style="padding:16px; font-size:1.05rem; border-radius:12px; font-weight:700; box-shadow:0 8px 20px rgba(99,102,241,0.25);" onclick="App.saveProfile()">💾 Save All Profile Changes</button>
              </div>
            ` : ''}
          </div>

        </div>
      </div>

      <div id="bottom-save-zone">
        ${!(profile.ice2_name || profile.ice2_phone) ? `
          <div id="save-btn-wrapper" style="width: 100%; margin-top: 24px; transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275); transform: scale(1);">
            <button class="btn btn-primary w-full hover-lift" style="padding:16px; font-size:1.05rem; border-radius:12px; font-weight:700; box-shadow:0 8px 20px rgba(99,102,241,0.25);" onclick="App.saveProfile()">💾 Save All Profile Changes</button>
          </div>
        ` : ''}
      </div>
    `;
  },

  async saveProfile() {
    try {
      const profile = {
        name: document.getElementById('set-name').value,
        age: parseInt(document.getElementById('set-age').value) || 0,
        gender: document.getElementById('set-gender').value,
        weight: parseFloat(document.getElementById('set-weight').value) || 0,
        height: parseFloat(document.getElementById('set-height').value) || 0,
        blood_type: document.getElementById('set-blood').value,
        allergies: document.getElementById('set-allergies').value.split(',').map(s => s.trim()).filter(s => s),
        conditions: document.getElementById('set-conditions').value.split(',').map(s => s.trim()).filter(s => s),
        ice1_name: document.getElementById('ice1-name')?.value || '',
        ice1_rel: document.getElementById('ice1-rel')?.value || '',
        ice1_phone: document.getElementById('ice1-phone')?.value || '',
        ice2_name: document.getElementById('ice2-name')?.value || '',
        ice2_rel: document.getElementById('ice2-rel')?.value || '',
        ice2_phone: document.getElementById('ice2-phone')?.value || ''
      };
      
      await API.put('/users/profile', profile);
      this.updateHeader();
      Utils.showToast('Profile saved successfully!', 'success');
    } catch (e) {
      Utils.showToast('Failed to save profile', 'error');
    }
  },

  async setLanguage(lang) {
    try {
      await API.put('/users/profile', { language: lang });
      Utils.showToast('Language updated!', 'success');
      this.updateHeader();
    } catch (e) {
      Utils.showToast('Failed to set language', 'error');
    }
  },

  async showFaceLogin() {
    Utils.showModal('🔐 Face Login Setup', `
      <div style="text-align:center; padding:20px;">
        <p style="color:var(--text-secondary); margin-bottom:12px;">Position your face in the center.</p>
        <div id="setup-face-container" style="width: 100%; height: 250px; background: #000; border-radius: 12px; overflow: hidden; position: relative; display: flex; justify-content: center; align-items: center; margin-bottom: 20px;">
            <video id="setup-face-video" autoplay muted playsinline style="height: 100%;"></video>
            <div id="setup-face-loading" style="position: absolute; color: white; font-size: 14px;">Loading AI models...</div>
        </div>
        <button id="setup-face-btn" class="btn btn-primary w-full" disabled>Capture Face</button>
      </div>
    `);

    try {
      await faceapi.nets.ssdMobilenetv1.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
      const loadingEl = document.getElementById('setup-face-loading');
      if (loadingEl) loadingEl.style.display = 'none';

      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      const video = document.getElementById('setup-face-video');
      video.srcObject = stream;
      
      const btn = document.getElementById('setup-face-btn');
      btn.disabled = false;

      // Clean up when modal closes
      const oldClose = Utils.closeModal;
      Utils.closeModal = () => {
        if (stream) stream.getTracks().forEach(t => t.stop());
        Utils.closeModal = oldClose; // restore
        oldClose();
      };

      btn.onclick = async () => {
        btn.textContent = 'Processing...';
        btn.disabled = true;
        try {
          const detection = await faceapi.detectSingleFace(video).withFaceLandmarks().withFaceDescriptor();
          if (!detection) {
            throw new Error('No face detected. Please look straight at the camera.');
          }
          const descriptor = Array.from(detection.descriptor);
          
          await API.post('/auth/face-setup', { descriptor });
          this.currentUser.face_login_enabled = true;
          Utils.showToast('Face login setup complete!', 'success');
          Utils.closeModal();
          this.renderSettings();
        } catch (e) {
          Utils.showToast(e.message || 'Face capture failed.', 'error');
          btn.textContent = 'Capture Face';
          btn.disabled = false;
        }
      };
    } catch(e) {
      const loadingEl = document.getElementById('setup-face-loading');
      if (loadingEl) loadingEl.textContent = 'Camera access denied or model load failed.';
    }
  },

  async disableFaceLogin() {
    try {
      await API.post('/auth/face-disable');
      this.currentUser.face_login_enabled = false;
      Utils.showToast('Face login disabled.', 'success');
      this.renderSettings();
    } catch(e) {
      Utils.showToast('Failed to disable face login', 'error');
    }
  },

  async exportData(format) {
    try {
      Utils.showToast('Preparing export...', 'info');
      const data = await API.get('/users/export');
      const dateStr = new Date().toISOString().split('T')[0];

      if (format === 'excel') {
        const wb = XLSX.utils.book_new();
        // Add sheets for each key
        Object.keys(data).forEach(key => {
          if (key === 'message') return;
          const sheetData = Array.isArray(data[key]) ? data[key] : [data[key]];
          if (sheetData.length === 0) return;
          const ws = XLSX.utils.json_to_sheet(sheetData);
          XLSX.utils.book_append_sheet(wb, ws, key.charAt(0).toUpperCase() + key.slice(1));
        });
        XLSX.writeFile(wb, `LifeOS_Data_${dateStr}.xlsx`);
        Utils.showToast('Excel export downloaded successfully!', 'success');
      } else if (format === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        let yPos = 20;

        doc.setFontSize(20);
        doc.text('LifeOS Personal Health Report', 14, yPos);
        yPos += 10;

        Object.keys(data).forEach(key => {
          if (key === 'message') return;
          const sheetData = Array.isArray(data[key]) ? data[key] : [data[key]];
          if (sheetData.length === 0 || Object.keys(sheetData[0]).length === 0) return;

          // Check if adding this section will overflow page
          if (yPos > 250) { doc.addPage(); yPos = 20; }

          doc.setFontSize(14);
          doc.text(key.charAt(0).toUpperCase() + key.slice(1), 14, yPos);
          yPos += 5;

          const headers = Object.keys(sheetData[0]);
          const body = sheetData.map(row => headers.map(h => String(row[h] || '')));

          doc.autoTable({
            startY: yPos,
            head: [headers],
            body: body,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [44, 62, 80] }
          });
          
          yPos = doc.lastAutoTable.finalY + 15;
        });

        doc.save(`LifeOS_Report_${dateStr}.pdf`);
        Utils.showToast('PDF export downloaded successfully!', 'success');
      }
    } catch (e) {
      console.error(e);
      Utils.showToast(e.message || 'Failed to export data. Please try again.', 'error');
    }
  },

  resetData() {
    if (confirm('⚠️ This will delete ALL your data. Are you sure?')) {
      const keys = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('lifeos_')) keys.push(key);
      }
      keys.forEach(k => localStorage.removeItem(k));
      Utils.showToast('All data cleared. Refreshing...', 'warning');
      setTimeout(() => location.reload(), 1500);
    }
  }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await App.init();
});
