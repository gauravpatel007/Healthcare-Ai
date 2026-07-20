/* ============================================
   LifeOS — Health Dashboard Module
   Matching gemini1.html layout exactly
   ============================================ */

const Dashboard = {
  chart: null,
  currentParam: 'weight',
  currentRange: 'year',
  calendarDate: null,
  appointments: [],

  async init() {
    await this.render();
  },

  getGreetingTime() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  },

  getGreetingIcon() {
    const hour = new Date().getHours();
    if (hour > 5 && hour < 18) return '☀️';
    return '🌙';
  },

  getLatestStat(category, fallback) {
    if (this.healthData && this.healthData[category] && this.healthData[category].length > 0) {
      const arr = this.healthData[category];
      // Get the last logged value
      const val = arr[arr.length - 1].value;
      return typeof val === 'number' ? val : fallback;
    }
    return fallback;
  },

  getCalendarHTML(appointments = []) {
    if (!this.calendarDate) this.calendarDate = new Date();
    const year = this.calendarDate.getFullYear();
    const month = this.calendarDate.getMonth();
    const now = new Date();
    const today = now.getDate();
    const isCurrentMonth = now.getFullYear() === year && now.getMonth() === month;
    const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    const dayNames = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

    const firstDay = new Date(year, month, 1).getDay();
    const startDay = firstDay === 0 ? 6 : firstDay - 1;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();

    const eventDates = new Set(appointments.map(a => a.date)); // e.g. "2026-07-15"

    let cells = '';
    for (let i = startDay - 1; i >= 0; i--) {
      cells += `<div class="cal-day other">${daysInPrev - i}</div>`;
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const isToday = (isCurrentMonth && d === today) ? ' today' : '';
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const hasEvent = eventDates.has(dateStr) ? ' has-event' : '';
      cells += `<div class="cal-day${isToday}${hasEvent}">${d}</div>`;
    }
    const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;
    for (let d = 1; d <= totalCells - startDay - daysInMonth; d++) {
      cells += `<div class="cal-day other">${d}</div>`;
    }

    return `
      <div class="cal-widget" id="dashboard-cal-widget">
        <div class="cal-header-row">
          <div>
            <div class="cal-small-label">${year}</div>
            <div class="cal-big-date">${monthNames[month]}</div>
          </div>
          <div class="cal-nav">
            <button class="cal-arrow" onclick="Dashboard.changeCalendarMonth(-1)">‹</button>
            <button class="cal-arrow" onclick="Dashboard.changeCalendarMonth(1)">›</button>
          </div>
        </div>
        <div class="cal-day-names">
          ${dayNames.map(d => `<div>${d}</div>`).join('')}
        </div>
        <div class="cal-days-grid">
          ${cells}
        </div>
      </div>
    `;
  },

  async render() {
    const container = document.getElementById('page-dashboard');
    const rightPanel = document.getElementById('right-panel');
    container.innerHTML = '<div class="empty-state"><span class="spinner"></span> Loading...</div>';

    try {
      const [d, healthData, fitnessStats] = await Promise.all([
        API.get('/dashboard/summary'),
        API.get('/trackers/health-data'),
        API.get('/ai/fitness/stats').catch(() => ({}))
      ]);
      this.appointments = d.upcoming || [];
      this.healthData = healthData || {};
      this.fitnessStats = fitnessStats || { steps: 0, calories_burned: 0, step_goal: 10000 };

      // Appointment color rotation (Blue/Cyan aesthetic)
      const apptColors = ['#eff6ff', '#e0f2fe', '#dbeafe', '#f0f9ff'];

      // Treatment color rotation
      const treatColors = ['#dbeafe', '#e0f2fe', '#eff6ff'];

      const treatmentItems = d.reminders.length > 0
        ? d.reminders.map((r, i) => `
            <div class="g-treat-item g-item-color-${i % 3}">
              <div class="g-pill-icon">💊</div>
              <div>
                <h4>${r.name}</h4>
                <p style="font-size:0.8rem; color:var(--text-muted);">${r.frequency}</p>
              </div>
            </div>
          `).join('')
        : '<p style="color:var(--text-muted); padding:16px 0;">No active medications.</p>';

      // ====== MAIN CONTENT (middle column) ======
      container.innerHTML = `
        <div class="section-header" style="background: var(--bg-card); padding: 24px 32px; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 52px; height: 52px; background: rgba(37,99,235,0.08); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </div>
            <div>
              <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0; font-family: 'Inter', sans-serif;">Dashboard</h2>
              <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--success); box-shadow: 0 0 6px var(--success);"></span>
                Your personalized health overview
              </p>
            </div>
          </div>
        </div>
        <!-- NEW: Personalized Hero Greeting with Health Score -->
        <div class="glass-card hover-lift g-hero-greeting" style="padding: 24px; margin-bottom: 24px; display: flex; align-items: center; justify-content: space-between;">
          <div>
            <div style="font-size: 0.85rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</div>
            <h1 style="font-size: 2.2rem; font-weight: 800; margin-bottom: 8px; color: var(--text-primary);">Good ${this.getGreetingTime()}, <span>${App.currentProfile?.name || 'User'}</span></h1>
            <p style="color: var(--text-secondary); font-size: 1rem;">Here is your health overview for today.</p>
          </div>
          <div style="display: flex; align-items: center; gap: 20px;">
            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
              <span style="font-size: 0.8rem; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px;">Health Score</span>
              <div style="display: flex; align-items: baseline; gap: 4px;">
                <span style="font-size: 2.5rem; font-weight: 900; color: var(--success); text-shadow: 0 2px 10px rgba(16, 185, 129, 0.2);">85</span>
                <span style="font-size: 1rem; color: var(--text-muted); font-weight: 600;">/100</span>
              </div>
            </div>
            <div style="position:relative; width: 70px; height: 70px;">
               ${Utils.createCircularProgress(85, 100, 70, 6, 'var(--success)')}
               <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:1.8rem;">${this.getGreetingIcon()}</div>
            </div>
          </div>
        </div>



        <!-- NEW: Glassmorphic Quick Actions -->
        <div class="grid-3 gap-md" style="margin-bottom: 24px;">
          <div class="glass-action-btn hover-glow" onclick="App.navigate('trackers')" style="background: var(--bg-card); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); cursor: pointer; border: 1px solid var(--border-color); transition: all 0.3s;">
            <div class="icon" style="font-size: 1.8rem; background: rgba(14, 165, 233, 0.1); width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 14px;">💧</div>
            <span style="font-weight: 600; font-size: 0.9rem;">Log Water</span>
          </div>
          <div class="glass-action-btn hover-glow" onclick="App.navigate('ai-fitness')" style="background: var(--bg-card); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); cursor: pointer; border: 1px solid var(--border-color); transition: all 0.3s;">
            <div class="icon" style="font-size: 1.8rem; background: rgba(249, 115, 22, 0.1); width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 14px;">🏋️</div>
            <span style="font-weight: 600; font-size: 0.9rem;">Start Workout</span>
          </div>
          <div class="glass-action-btn hover-glow" onclick="App.navigate('medicine')" style="background: var(--bg-card); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 8px; box-shadow: 0 4px 15px rgba(0,0,0,0.03); cursor: pointer; border: 1px solid var(--border-color); transition: all 0.3s;">
            <div class="icon" style="font-size: 1.8rem; background: rgba(239, 68, 68, 0.1); width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 14px;">💊</div>
            <span style="font-weight: 600; font-size: 0.9rem;">Take Meds</span>
          </div>
        </div>

        <!-- NEW: Today's Activity & Nutrition -->
        <div class="grid-2 gap-xl" style="margin-bottom: 24px;">
          
          <!-- Activity Rings -->
          <div class="g-card hover-lift" style="padding-bottom: 32px;">
            <div class="g-card-header" style="margin-bottom: 24px;">
              <div>
                <h2 style="font-size: 1.25rem;">Activity Rings</h2>
                <p style="color:var(--text-muted); font-size:0.88rem;">Your daily movement</p>
              </div>
              <button class="g-icon-btn" onclick="App.navigate('ai-fitness')">→</button>
            </div>
            <div style="display: flex; justify-content: space-around; text-align: center; flex-wrap: wrap; gap: 16px;">
              <div style="display:flex; flex-direction:column; align-items:center;">
                <div style="position:relative; width:80px; height:80px; margin-bottom:12px;">
                  ${Utils.createCircularProgress(Math.max(0, this.fitnessStats.steps || 0), this.fitnessStats.step_goal || 10000, 80, 8, 'var(--success)')}
                  <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:1.4rem;">👣</div>
                </div>
                <div style="font-weight:800; font-size:1.1rem;">${Math.max(0, this.fitnessStats.steps || 0).toLocaleString()}</div>
                <div style="font-size:0.7rem; color:var(--text-muted); font-weight:700; letter-spacing:0.05em; margin-top:2px;">STEPS</div>
              </div>
              <div style="display:flex; flex-direction:column; align-items:center;">
                <div style="position:relative; width:80px; height:80px; margin-bottom:12px;">
                  ${Utils.createCircularProgress(Math.max(0, this.fitnessStats.calories_burned || 0), 2500, 80, 8, 'var(--accent)')}
                  <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:1.4rem;">🔥</div>
                </div>
                <div style="font-weight:800; font-size:1.1rem;">${Math.max(0, this.fitnessStats.calories_burned || 0).toLocaleString()}</div>
                <div style="font-size:0.7rem; color:var(--text-muted); font-weight:700; letter-spacing:0.05em; margin-top:2px;">KCAL</div>
              </div>
              <div style="display:flex; flex-direction:column; align-items:center;">
                <div style="position:relative; width:80px; height:80px; margin-bottom:12px;">
                  ${Utils.createCircularProgress(Math.max(0, this.getLatestStat('water', 1.2)), 2.3, 80, 8, 'var(--info)')}
                  <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); font-size:1.4rem;">💧</div>
                </div>
                <div style="font-weight:800; font-size:1.1rem;">${Math.max(0, this.getLatestStat('water', 1.2))}L</div>
                <div style="font-size:0.7rem; color:var(--text-muted); font-weight:700; letter-spacing:0.05em; margin-top:2px;">WATER</div>
              </div>
            </div>
          </div>

          <!-- Nutrition Tracker -->
          <div class="g-card hover-lift" style="padding-bottom: 24px;">
            <div class="g-card-header" style="margin-bottom: 24px;">
              <div>
                <h2 style="font-size: 1.25rem;">Nutrition Tracker</h2>
                <p style="color:var(--text-muted); font-size:0.88rem;">Daily macros and goals</p>
              </div>
              <button class="g-icon-btn" onclick="App.navigate('ai-nutrition')">🥗</button>
            </div>
            
            <div style="display: flex; flex-direction: column; gap: 16px;">
              <!-- Protein Goal -->
              <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-weight: 600; font-size: 0.9rem;">
                  <span style="display:flex; align-items:center; gap:6px;"><span style="color:#ef4444;">🥩</span> Protein</span>
                  <span><span style="color:var(--text-primary); font-weight:800;">54g</span> <span style="color:var(--text-muted);">/ 84g</span></span>
                </div>
                <div style="height: 10px; background: var(--bg-body); border-radius: 10px; overflow: hidden;">
                  <div style="height: 100%; width: ${(54/84)*100}%; background: linear-gradient(90deg, #ef4444, #f87171); border-radius: 10px;"></div>
                </div>
              </div>

              <!-- Carbs -->
              <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-weight: 600; font-size: 0.9rem;">
                  <span style="display:flex; align-items:center; gap:6px;"><span style="color:#f59e0b;">🍞</span> Carbs</span>
                  <span><span style="color:var(--text-primary); font-weight:800;">120g</span> <span style="color:var(--text-muted);">/ 200g</span></span>
                </div>
                <div style="height: 10px; background: var(--bg-body); border-radius: 10px; overflow: hidden;">
                  <div style="height: 100%; width: 60%; background: linear-gradient(90deg, #f59e0b, #fbbf24); border-radius: 10px;"></div>
                </div>
              </div>

              <!-- Fats -->
              <div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 6px; font-weight: 600; font-size: 0.9rem;">
                  <span style="display:flex; align-items:center; gap:6px;"><span style="color:#8b5cf6;">🥑</span> Fats</span>
                  <span><span style="color:var(--text-primary); font-weight:800;">45g</span> <span style="color:var(--text-muted);">/ 60g</span></span>
                </div>
                <div style="height: 10px; background: var(--bg-body); border-radius: 10px; overflow: hidden;">
                  <div style="height: 100%; width: 75%; background: linear-gradient(90deg, #8b5cf6, #a78bfa); border-radius: 10px;"></div>
                </div>
              </div>
            </div>
            <div style="margin-top: 16px; padding: 12px; background: rgba(16, 185, 129, 0.1); border-radius: 12px; display: flex; align-items: center; justify-content: space-between;">
              <span style="font-size: 0.85rem; font-weight: 600; color: var(--success);">🔥 Calories</span>
              <span style="font-weight: 800; color: var(--text-primary);">1,450 <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">/ 2,200</span></span>
            </div>
          </div>
        </div>

        <!-- My Parameters Card -->
        <div class="g-card hover-lift">
          <div class="g-card-header">
            <div>
              <h2>My parameters</h2>
              <p style="color:var(--text-muted); font-size:0.88rem;">Track key health metrics over time</p>
            </div>
            <button class="g-icon-btn">+</button>
          </div>
          <div class="g-tabs-row" id="param-tabs">
            <button class="g-tab ${this.currentParam === 'weight' ? 'active' : ''}" data-param="weight">Weight · % Fat</button>
            <button class="g-tab ${this.currentParam === 'bp' ? 'active' : ''}" data-param="bp">Blood Pressure</button>
            <button class="g-tab ${this.currentParam === 'pulse' ? 'active' : ''}" data-param="pulse">Pulse</button>
            <div style="flex:1;"></div>
            <select class="g-select" id="time-filter">
              <option value="year" ${this.currentRange === 'year' ? 'selected' : ''}>This year</option>
              <option value="month" ${this.currentRange === 'month' ? 'selected' : ''}>This month</option>
            </select>
            <button class="g-icon-btn-sm">⋯</button>
          </div>
          <div class="g-chart-area">
            <canvas id="params-chart"></canvas>
          </div>
        </div>

        <!-- My Appointments Card -->
        <div class="g-card hover-lift">
          <div class="g-card-header">
            <div>
              <h2>My appointments</h2>
              <p style="color:var(--text-muted); font-size:0.88rem;">Scheduled visits and consultations</p>
            </div>
            <div style="display:flex; gap:8px; align-items:center;">
              <select class="g-select" id="appt-filter" onchange="Dashboard.filterAppointments(this.value)">
                <option value="today">Today</option>
                <option value="week">This week</option>
              </select>
              <button class="g-icon-btn" onclick="App.navigate('appointments')">+</button>
            </div>
          </div>
          <div id="dashboard-appointments-list"></div>
          <button class="g-btn-dark" onclick="App.navigate('appointments')">+ New Appointment</button>
        </div>
      `;

      // ====== RIGHT PANEL (third column) ======
      if (rightPanel) {
        rightPanel.innerHTML = `
          <!-- NEW: Premium Feature Search -->
          <div style="position: relative; margin-bottom: 24px; z-index: 50;">
            <div style="display: flex; align-items: center; padding: 14px 18px; border-radius: 16px; background: rgba(255, 255, 255, 0.04); box-shadow: 0 8px 32px rgba(37, 99, 235, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.1); border: 1px solid rgba(255, 255, 255, 0.1); backdrop-filter: blur(24px); transition: all 0.3s;" onmouseover="this.style.boxShadow='0 12px 40px rgba(37, 99, 235, 0.15), inset 0 1px 2px rgba(255, 255, 255, 0.1)'; this.style.background='rgba(255, 255, 255, 0.06)';" onmouseout="this.style.boxShadow='0 8px 32px rgba(37, 99, 235, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.1)'; this.style.background='rgba(255, 255, 255, 0.04)';">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 12px; opacity: 0.8;">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input type="text" id="dashboard-feature-search" placeholder="Search features..." style="background: transparent; border: none; color: var(--text-primary); width: 100%; outline: none; font-size: 1.05rem; font-weight: 500; letter-spacing: 0.2px;">

            </div>
            <div id="dashboard-search-results" style="display: none; position: absolute; top: calc(100% + 12px); left: 0; right: 0; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 16px; box-shadow: 0 12px 32px rgba(0,0,0,0.2); overflow: hidden; backdrop-filter: blur(20px);">
              <!-- Results go here -->
            </div>
          </div>

          <!-- Calendar -->
          <div class="g-card calendar-card hover-lift" style="margin-bottom: 24px;">
            <h2 style="margin-bottom:12px; font-size: 1.15rem;">Calendar</h2>
            ${this.getCalendarHTML(d.upcoming)}
          </div>

          <!-- NEW: Quick Vitals (Moved from Center) -->
          <div style="display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px;">
            <div class="glass-card hover-lift" style="padding: 16px; display: flex; align-items: center; gap: 16px;">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(239, 68, 68, 0.1); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; color: var(--danger);">❤️</div>
              <div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Heart Rate</div>
                <div style="font-size: 1.3rem; font-weight: 800; color: var(--text-primary);">72 <span style="font-size: 0.8rem; font-weight: 600; color: var(--text-muted);">bpm</span></div>
              </div>
            </div>
            <div class="glass-card hover-lift" style="padding: 16px; display: flex; align-items: center; gap: 16px;">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(59, 130, 246, 0.1); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; color: var(--primary);">🩸</div>
              <div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Blood Pressure</div>
                <div style="font-size: 1.3rem; font-weight: 800; color: var(--text-primary);">120/80</div>
              </div>
            </div>
            <div class="glass-card hover-lift" style="padding: 16px; display: flex; align-items: center; gap: 16px;">
              <div style="width: 44px; height: 44px; border-radius: 12px; background: rgba(139, 92, 246, 0.1); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; color: var(--accent);">😴</div>
              <div>
                <div style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 600;">Sleep</div>
                <div style="font-size: 1.3rem; font-weight: 800; color: var(--text-primary);">7h 15m</div>
              </div>
            </div>
          </div>
          
          <!-- NEW: Recent Medical Records -->
          <div class="g-card hover-lift">
            <div class="g-card-header" style="margin-bottom: 12px;">
              <div>
                <h2 style="font-size: 1.15rem;">Recent Records</h2>
              </div>
              <button class="g-icon-btn" onclick="App.navigate('records')">→</button>
            </div>
            <div style="display: flex; flex-direction: column; gap: 12px;">
              <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-body); border-radius: 12px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(59, 130, 246, 0.1)'" onmouseout="this.style.background='var(--bg-body)'">
                <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(59, 130, 246, 0.15); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">📄</div>
                <div>
                  <div style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">Annual Blood Test</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Uploaded 2 days ago</div>
                </div>
              </div>
              <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--bg-body); border-radius: 12px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='rgba(139, 92, 246, 0.1)'" onmouseout="this.style.background='var(--bg-body)'">
                <div style="width: 36px; height: 36px; border-radius: 8px; background: rgba(139, 92, 246, 0.15); color: var(--accent); display: flex; align-items: center; justify-content: center; font-size: 1.1rem;">🩻</div>
                <div>
                  <div style="font-size: 0.9rem; font-weight: 600; color: var(--text-primary);">Chest X-Ray</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">Uploaded last week</div>
                </div>
              </div>
            </div>
          </div>

          <!-- My Treatment -->
          <div class="g-card hover-lift">
            <div class="g-card-header" style="margin-bottom: 12px;">
              <div>
                <h2 style="font-size: 1.15rem;">My treatment</h2>
                <p style="color:var(--text-muted); font-size:0.82rem;">Current medications</p>
              </div>
            </div>
            ${treatmentItems}
            <button class="g-btn-outline" style="width: 100%; margin-top: 12px;" onclick="App.navigate('medicine')">+ New Medication</button>
          </div>
        `;
      }

      // Attach event listeners for tabs
      document.querySelectorAll('#param-tabs .g-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
          document.querySelectorAll('#param-tabs .g-tab').forEach(b => b.classList.remove('active'));
          e.target.classList.add('active');
          this.currentParam = e.target.dataset.param;
          this.renderChart();
        });
      });

      // Attach event listener for time filter
      const timeSelect = document.getElementById('time-filter');
      if (timeSelect) {
        timeSelect.addEventListener('change', (e) => {
          this.currentRange = e.target.value;
          this.renderChart();
        });
      }

      // Render chart
      this.renderChart();

      // Render appointments default to today
      this.filterAppointments('today');

      // Feature Search Logic
      const searchInput = document.getElementById('dashboard-feature-search');
      const searchResults = document.getElementById('dashboard-search-results');
      if (searchInput && searchResults) {
        const features = [
          { name: 'Dashboard', id: 'dashboard', icon: '📊' },
          { name: 'Appointments', id: 'appointments', icon: '📅' },
          { name: 'Records', id: 'records', icon: '📋' },
          { name: 'Medicines', id: 'medicine', icon: '💊' },
          { name: 'Statistics', id: 'stats', icon: '📈' },
          { name: 'AI Chat', id: 'ai-chat', icon: '💬' },
          { name: 'Symptom Checker', id: 'symptom-checker', icon: '🔍' },
          { name: 'Nutrition', id: 'nutrition', icon: '🥗' },
          { name: 'Fitness', id: 'ai-fitness', icon: '🏋️' },
          { name: 'Mental Health', id: 'mental-health', icon: '🧠' },
          { name: 'Trackers', id: 'trackers', icon: '❤️' },
          { name: 'Settings', id: 'settings', icon: '⚙️' },
          { name: 'Emergency', id: 'emergency', icon: '🆘' }
        ];

        searchInput.addEventListener('input', (e) => {
          const query = e.target.value.toLowerCase().trim();
          if (!query) {
            searchResults.style.display = 'none';
            return;
          }
          
          const matches = features.filter(f => f.name.toLowerCase().includes(query)).slice(0, 5);
          
          if (matches.length > 0) {
            searchResults.innerHTML = matches.map(m => `
              <div onclick="App.navigate('${m.id}')" style="padding: 14px 20px; display: flex; align-items: center; gap: 14px; cursor: pointer; border-bottom: 1px solid rgba(255,255,255,0.03); transition: all 0.2s;" onmouseover="this.style.background='rgba(59, 130, 246, 0.08)'" onmouseout="this.style.background='transparent'">
                <div style="width: 32px; height: 32px; border-radius: 8px; background: rgba(255,255,255,0.05); display: flex; align-items: center; justify-content: center; font-size: 1.1rem; border: 1px solid rgba(255,255,255,0.05);">${m.icon}</div>
                <span style="font-weight: 600; color: var(--text-primary); font-size: 0.95rem;">${m.name}</span>
                <span style="margin-left: auto; color: var(--text-muted); font-size: 1.1rem;">→</span>
              </div>
            `).join('');
            // Remove border-bottom from last element
            if (searchResults.lastElementChild) {
              searchResults.lastElementChild.style.borderBottom = 'none';
            }
            searchResults.style.display = 'block';
          } else {
            searchResults.innerHTML = '<div style="padding: 24px 16px; color: var(--text-muted); font-size: 0.95rem; text-align: center; font-weight: 500;">No features found</div>';
            searchResults.style.display = 'block';
          }
        });
        
        // Hide results when clicking outside
        document.addEventListener('click', (e) => {
          if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
            searchResults.style.display = 'none';
          }
        });
      }

    } catch (e) {
      container.innerHTML = `<div class="empty-state"><h3>Error</h3><p>Could not load dashboard: ${e.message}</p></div>`;
    }
  },

  changeCalendarMonth(offset) {
    if (!this.calendarDate) this.calendarDate = new Date();
    this.calendarDate.setMonth(this.calendarDate.getMonth() + offset);
    const widget = document.getElementById('dashboard-cal-widget');
    if (widget) {
      widget.outerHTML = this.getCalendarHTML(this.appointments);
    }
  },

  filterAppointments(filterValue) {
    const list = document.getElementById('dashboard-appointments-list');
    if (!list) return;

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;

    // Calculate Monday-Sunday of current week
    const day = now.getDay();
    const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.getFullYear(), now.getMonth(), diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    
    const monStr = `${monday.getFullYear()}-${String(monday.getMonth()+1).padStart(2,'0')}-${String(monday.getDate()).padStart(2,'0')}`;
    const sunStr = `${sunday.getFullYear()}-${String(sunday.getMonth()+1).padStart(2,'0')}-${String(sunday.getDate()).padStart(2,'0')}`;

    const filtered = this.appointments.filter(a => {
      if (filterValue === 'today') {
        return a.date === todayStr;
      } else if (filterValue === 'week') {
        return a.date >= monStr && a.date <= sunStr;
      }
      return true;
    });

    if (filtered.length === 0) {
      list.innerHTML = `<p style="color:var(--text-muted); padding:16px 0;">No appointments scheduled for ${filterValue === 'today' ? 'today' : 'this week'}.</p>`;
      return;
    }

    list.innerHTML = filtered.map((a, i) => `
      <div class="g-appt-item g-item-color-${i % 4}">
        <div class="g-appt-avatar">👨‍⚕️</div>
        <div class="g-appt-info">
          <h4>${a.specialty || 'Doctor'}</h4>
          <p class="g-appt-time">${a.date === todayStr ? 'Today' : a.date} at ${a.time || '—'}</p>
          <p class="g-appt-doc">Dr. ${a.doctor}</p>
        </div>
        <button class="g-appt-dots" onclick="App.navigate('appointments')">⋮</button>
      </div>
    `).join('');
  },

  renderChart() {
    const ctx = document.getElementById('params-chart');
    if (!ctx) return;
    if (this.chart) this.chart.destroy();

    const healthData = this.healthData || {};
    let datasets = [];
    let labels = [];

    const filterData = (dataArr) => {
      if (!dataArr || dataArr.length === 0) return [];
      // If "This month" is selected, just return the last 2-3 points or slice differently
      if (this.currentRange === 'month') {
        return dataArr.slice(-3);
      }
      return dataArr;
    };

    if (this.currentParam === 'weight') {
      const data = filterData(healthData.weight);
      labels = data.map(e => e.label || new Date(e.date).toLocaleString('default', { month: 'short' }));
      const weightData = data.map(e => e.value);
      
      if (labels.length === 0) {
        labels = ['Apr','May','Jun','Jul','Aug','Sep'];
        weightData.push(...[64.5, 65.2, 65.8, 65.5, 66.0, 67.5]);
      }
      const fatData = weightData.map(w => (w * 0.27).toFixed(1));

      datasets = [
        {
          label: 'Weight', data: weightData,
          borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.04)',
          borderWidth: 2.5, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, fill: true
        },
        {
          label: '% Fat', data: fatData,
          borderColor: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.04)',
          borderWidth: 2.5, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, fill: true
        }
      ];
    } else if (this.currentParam === 'bp') {
      const data = filterData(healthData.bloodPressure);
      labels = data.map(e => e.label || 'Unknown');
      
      if (labels.length === 0) {
        labels = ['Apr','May','Jun','Jul','Aug','Sep'];
        datasets = [
          { label: 'Systolic', data: [120, 118, 122, 119, 125, 121], borderColor: '#f43f5e', backgroundColor: 'rgba(244, 63, 94, 0.04)', borderWidth: 2.5, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, fill: true },
          { label: 'Diastolic', data: [80, 78, 82, 79, 85, 81], borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.04)', borderWidth: 2.5, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, fill: true }
        ];
      } else {
        datasets = [
          { label: 'Systolic', data: data.map(e => e.systolic), borderColor: '#f43f5e', backgroundColor: 'rgba(244, 63, 94, 0.04)', borderWidth: 2.5, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, fill: true },
          { label: 'Diastolic', data: data.map(e => e.diastolic), borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.04)', borderWidth: 2.5, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, fill: true }
        ];
      }
    } else if (this.currentParam === 'pulse') {
      const data = filterData(healthData.heartRate);
      labels = data.map(e => e.label || 'Unknown');
      
      if (labels.length === 0) {
        labels = ['Apr','May','Jun','Jul','Aug','Sep'];
        datasets = [
          { label: 'Pulse (bpm)', data: [72, 74, 71, 75, 73, 76], borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.04)', borderWidth: 2.5, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, fill: true }
        ];
      } else {
        datasets = [
          { label: 'Pulse (bpm)', data: data.map(e => e.value), borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.04)', borderWidth: 2.5, tension: 0.4, pointRadius: 0, pointHoverRadius: 5, fill: true }
        ];
      }
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: {
            position: 'bottom',
            labels: { usePointStyle: true, pointStyle: 'circle', padding: 20, font: { family: 'Inter', size: 12 }, color: '#888' }
          },
          tooltip: { backgroundColor: '#111', cornerRadius: 8, padding: 10 }
        },
        scales: {
          x: { grid: { display: false }, ticks: { font: { family: 'Inter', size: 11 }, color: '#aaa' }, border: { display: false } },
          y: { grid: { color: 'rgba(0,0,0,0.03)' }, ticks: { font: { family: 'Inter', size: 11 }, color: '#aaa' }, border: { display: false } },
        }
      }
    });
  },

  async logMood(emoji) {
    try {
      await API.post('/ai/mental/mood', { mood: emoji, note: 'Logged from dashboard' });
      Utils.showToast('Mood logged successfully!', 'success');
    } catch (e) {
      Utils.showToast('Failed to log mood', 'error');
    }
  }
};
