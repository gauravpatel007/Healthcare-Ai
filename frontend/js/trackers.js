/* ============================================
   LifeOS — Smart Trackers Module
   (Water, Sleep, BMI/BMR, Wearable)
   ============================================ */

const Trackers = {
  currentWater: 0,
  waterHistory: [],
  sleepData: [],
  bmiData: null,
  activeTab: 'water',
  selectedQuality: 4,

  async init() {
    await this.fetchData();
    this.render();
  },

  async fetchData() {
    try {
      const [waterRes, waterHistRes, sleepRes, bmiRes] = await Promise.all([
        API.get('/trackers/water'),
        API.get('/trackers/water/history?days=7'),
        API.get('/trackers/sleep'),
        API.get('/trackers/bmi')
      ]);
      this.currentWater = waterRes.glasses || 0;
      this.waterHistory = waterHistRes || [];
      this.sleepData = sleepRes || [];
      this.bmiData = bmiRes || null;
    } catch (e) {
      console.error('Failed to fetch tracker data', e);
    }
  },

  render() {
    const profile = App.currentProfile || { weight: 70, height: 170 };
    const water = this.currentWater;
    const bmiData = this.bmiData || { bmi: 24, bmr: 1600, category: { label: 'Normal', color: '#00b894' }, tdee_by_activity: {} };
    const container = document.getElementById('page-trackers');

    container.innerHTML = `
      <div class="section-header" style="background: var(--bg-card); padding: 24px 32px; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 52px; height: 52px; background: rgba(37,99,235,0.08); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
          </div>
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0; font-family: 'Inter', sans-serif;">Smart Trackers</h2>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--success); box-shadow: 0 0 6px var(--success);"></span>
              Track your daily health metrics
            </p>
          </div>
        </div>
      </div>

      <div class="tabs mb-lg">
        <button class="tab ${this.activeTab === 'water' ? 'active' : ''}" onclick="Trackers.showTab('water')">💧 Water</button>
        <button class="tab ${this.activeTab === 'sleep' ? 'active' : ''}" onclick="Trackers.showTab('sleep')">😴 Sleep</button>
        <button class="tab ${this.activeTab === 'bmi' ? 'active' : ''}" onclick="Trackers.showTab('bmi')">⚖️ BMI/BMR</button>
        <button class="tab ${this.activeTab === 'wearable' ? 'active' : ''}" onclick="Trackers.showTab('wearable')">⌚ Wearable</button>
      </div>

      <!-- Water Tab -->
      <div id="tracker-water" class="tracker-tab" style="${this.activeTab === 'water' ? 'display:block;' : 'display:none;'}">
        <div class="grid-2 gap-xl">
          <div class="glass-card no-hover" style="text-align:center;">
            <h3 style="margin-bottom:20px;">💧 Daily Water Intake</h3>
            <div style="position:relative; width:180px; height:180px; margin:0 auto;">
              ${Utils.createCircularProgress(water, 8, 180, 10, water >= 8 ? 'var(--success)' : 'var(--info)')}
              <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center;">
                <div style="font-family:var(--font-heading); font-size:2.5rem; font-weight:800;">${water}</div>
                <div style="font-size:0.7rem; color:var(--text-muted);">of 8 glasses</div>
              </div>
            </div>
            <div class="water-glasses mt-lg">
              ${Array.from({length: 8}, (_, i) => `
                <div class="water-glass ${i < water ? 'filled' : ''}" 
                     onclick="Trackers.setWater(${i + 1})" title="Glass ${i + 1}">
                  <span style="position:relative;z-index:1;font-size:0.6rem;width:100%;text-align:center;padding-bottom:4px;">
                    ${i < water ? '💧' : ''}
                  </span>
                </div>
              `).join('')}
            </div>
            <p class="text-muted mt-md" style="font-size:0.82rem;">
              ${water >= 8 ? '🎉 Daily goal achieved!' : `Drink ${Math.max(0, 8 - water)} more glasses today`}
            </p>
            <p class="text-muted mt-sm" style="font-size:0.75rem;">
              Recommended: ${Math.round(profile.weight * 0.033 * 10) / 10}L based on your weight (${profile.weight}kg)
            </p>
          </div>
          <div class="glass-card no-hover">
            <h4 style="margin-bottom:16px;">📊 Weekly Water History</h4>
            <div class="chart-container" style="height:250px;">
              <canvas id="waterHistoryChart"></canvas>
            </div>
            <div style="margin-top:16px; padding:12px; background:rgba(116,185,255,0.08); border-radius:8px;">
              <p style="font-size:0.82rem; color:var(--info);">💡 Tip: Set regular reminders to drink water throughout the day. Carry a water bottle with you.</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Sleep Tab -->
      <div id="tracker-sleep" class="tracker-tab" style="${this.activeTab === 'sleep' ? 'display:block;' : 'display:none;'}">
        <div class="grid-2 gap-xl mb-xl">
          <div class="glass-card no-hover">
            <h3 style="margin-bottom:20px;">😴 Log Sleep</h3>
            <div class="grid-2 gap-md">
              <div class="form-group">
                <label class="form-label">Bed Time</label>
                <input type="time" class="form-input" id="sleep-bedtime" value="23:00">
              </div>
              <div class="form-group">
                <label class="form-label">Wake Time</label>
                <input type="time" class="form-input" id="sleep-waketime" value="07:00">
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Sleep Quality</label>
              <div class="flex gap-md justify-center" style="padding:12px;">
                ${['😫', '😔', '😐', '🙂', '😴'].map((e, i) => `
                  <button class="mood-btn ${i + 1 === this.selectedQuality ? 'selected' : ''}" onclick="Trackers.selectQuality(this, ${i+1})" data-quality="${i+1}">${e}</button>
                `).join('')}
              </div>
            </div>
            <button class="btn btn-primary w-full" onclick="Trackers.logSleep()">😴 Log Sleep</button>
          </div>
          <div class="glass-card no-hover">
            <h4 style="margin-bottom:16px;">📊 Sleep Trend</h4>
            <div class="chart-container" style="height:250px;">
              <canvas id="sleepChart"></canvas>
            </div>
          </div>
        </div>

        <!-- Sleep History -->
        <div class="glass-card no-hover">
          <h4 style="margin-bottom:16px;">📋 Recent Sleep Log</h4>
          ${this.sleepData.length > 0 ? this.sleepData.slice(0, 7).map(s => `
            <div class="list-item">
              <div class="item-icon" style="background:rgba(108,92,231,0.15); color:var(--primary-light);">😴</div>
              <div class="item-content">
                <div class="item-title">${s.hours || '?'} hours of sleep</div>
                <div class="item-subtitle">${Utils.formatDate(s.date)} • Quality: ${'⭐'.repeat(s.quality || 3)}</div>
              </div>
              <span class="badge ${(s.hours || 0) >= 7 ? 'badge-success' : 'badge-warning'}">${(s.hours || 0) >= 7 ? 'Good' : 'Low'}</span>
            </div>
          `).join('') : '<p class="text-center text-muted" style="padding:20px;">No sleep data logged yet</p>'}
        </div>
      </div>

      <!-- BMI/BMR Tab -->
      <div id="tracker-bmi" class="tracker-tab" style="${this.activeTab === 'bmi' ? 'display:block;' : 'display:none;'}">
        <div class="grid-2 gap-xl">
          <!-- BMI Calculator -->
          <div class="glass-card no-hover">
            <h3 style="margin-bottom:20px;">⚖️ Current BMI</h3>
            <div style="text-align:center; padding:30px; background:var(--bg-glass); border-radius:16px;" id="bmi-result">
              <div style="font-family:var(--font-heading); font-size:3rem; font-weight:800; color:${bmiData.category.color};">${bmiData.bmi}</div>
              <div style="font-size:0.85rem; color:${bmiData.category.color}; font-weight:600; margin-top:4px;">${bmiData.category.label}</div>
              <div style="width:100%; height:10px; background:linear-gradient(90deg, var(--info), var(--success), var(--warning), var(--accent)); border-radius:10px; margin-top:16px;">
                <div style="width:4px; height:20px; background:white; border-radius:4px; margin-left:${Math.min(95, (bmiData.bmi/40)*100)}%; transform:translateY(-5px);"></div>
              </div>
              <div class="flex justify-between mt-sm" style="font-size:0.65rem; color:var(--text-muted);">
                <span>Under 18.5</span><span>Normal 18.5-25</span><span>Over 25-30</span><span>Obese 30+</span>
              </div>
            </div>
            <p style="text-align:center; margin-top:16px; font-size:0.85rem; color:var(--text-secondary);">
              Based on Weight: ${bmiData.weight}kg, Height: ${bmiData.height}cm
            </p>
          </div>

          <!-- BMR Calculator -->
          <div class="glass-card no-hover">
            <h3 style="margin-bottom:20px;">🔥 BMR Calculator</h3>
            <div style="text-align:center; padding:30px; background:var(--bg-glass); border-radius:16px;">
              <div style="font-size:0.75rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.1em;">Basal Metabolic Rate</div>
              <div style="font-family:var(--font-heading); font-size:3rem; font-weight:800; color:var(--primary-light); margin:8px 0;">${Math.round(bmiData.bmr)}</div>
              <div style="font-size:0.85rem; color:var(--text-muted);">calories/day at rest</div>
            </div>
            <div style="margin-top:20px;">
              <h4 style="margin-bottom:12px;">Daily Calorie Needs by Activity:</h4>
              ${[
                { level: 'Sedentary', key: 'sedentary', desc: 'Little/no exercise' },
                { level: 'Light Active', key: 'light', desc: '1-3 days/week' },
                { level: 'Moderate', key: 'moderate', desc: '3-5 days/week' },
                { level: 'Very Active', key: 'very_active', desc: '6-7 days/week' },
                { level: 'Extra Active', key: 'extra_active', desc: 'Athlete level' }
              ].map(a => `
                <div class="flex justify-between items-center" style="padding:8px 0; border-bottom:1px solid rgba(255,255,255,0.03); font-size:0.85rem;">
                  <div>
                    <span style="font-weight:600;">${a.level}</span>
                    <span style="color:var(--text-muted); font-size:0.75rem;"> (${a.desc})</span>
                  </div>
                  <span style="font-weight:700; color:var(--primary-light);">${Math.round(bmiData.tdee_by_activity[a.key] || 0)} cal</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>

      <!-- Wearable Tab -->
      <div id="tracker-wearable" class="tracker-tab" style="${this.activeTab === 'wearable' ? 'display:block;' : 'display:none;'}">
        <div class="glass-card no-hover mb-xl" style="text-align:center; padding:40px;">
          <div style="font-size:4rem; margin-bottom:16px; animation: float 3s ease-in-out infinite;">⌚</div>
          <h3>Wearable Integration</h3>
          <p style="color:var(--text-secondary); margin:12px 0;">Connect your smart watch or fitness band to sync health data automatically.</p>
          <div class="grid-3 gap-md mt-xl" style="max-width:600px; margin:0 auto;">
            ${[
              { name: 'Apple Watch', icon: '⌚', synced: false },
              { name: 'Fitbit', icon: '📱', synced: false },
              { name: 'Galaxy Watch', icon: '⌚', synced: false }
            ].map(d => `
              <div class="glass-card" style="text-align:center; cursor:pointer;" onclick="Trackers.connectDevice('${d.name}')">
                <div style="font-size:2rem; margin-bottom:8px;">${d.icon}</div>
                <div style="font-size:0.85rem; font-weight:600;">${d.name}</div>
                <span class="badge ${d.synced ? 'badge-success' : 'badge-primary'} mt-sm">${d.synced ? 'Connected' : 'Connect'}</span>
              </div>
            `).join('')}
          </div>
          <p style="font-size:0.75rem; color:var(--text-muted); margin-top:20px;">
            Sync: ❤️ Heart Rate • 😴 Sleep • 👣 Steps • 🔥 Calories
          </p>
        </div>

        <!-- Simulated Wearable Data -->
        <div class="dashboard-stats" style="margin-bottom:0;">
          <div class="stat-card">
            <div class="stat-icon coral">❤️</div>
            <div class="stat-value">${Math.round(72 + Math.random() * 8)}</div>
            <div class="stat-label">Heart Rate (bpm)</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon purple">😴</div>
            <div class="stat-value">${(6.5 + Math.random() * 2).toFixed(1)}</div>
            <div class="stat-label">Sleep (hours)</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">👣</div>
            <div class="stat-value">${Math.round(3000 + Math.random() * 7000).toLocaleString()}</div>
            <div class="stat-label">Steps</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon teal">🔥</div>
            <div class="stat-value">${Math.round(200 + Math.random() * 300)}</div>
            <div class="stat-label">Calories Burned</div>
          </div>
        </div>
      </div>
    `;

    if (this.activeTab === 'water') setTimeout(() => this.initWaterChart(), 100);
    if (this.activeTab === 'sleep') setTimeout(() => this.initSleepChart(), 100);
  },

  showTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.tracker-tab').forEach(t => t.style.display = 'none');
    document.querySelectorAll('#page-trackers .tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`tracker-${tab}`).style.display = 'block';
    if(event) event.target.classList.add('active');
    
    if (tab === 'water') setTimeout(() => this.initWaterChart(), 100);
    if (tab === 'sleep') setTimeout(() => this.initSleepChart(), 100);
  },

  async setWater(count) {
    const newVal = this.currentWater === count ? count - 1 : count;
    try {
      await API.put('/trackers/water', { glasses: newVal });
      this.currentWater = newVal;
      if (newVal >= 8) Utils.showToast('🎉 Water goal achieved!', 'success');
      this.render();
    } catch (e) {
      Utils.showToast('Failed to log water', 'error');
    }
  },

  selectQuality(btn, q) {
    document.querySelectorAll('#tracker-sleep .mood-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    this.selectedQuality = q;
  },

  async logSleep() {
    const bedtime = document.getElementById('sleep-bedtime').value;
    const waketime = document.getElementById('sleep-waketime').value;
    const [bh, bm] = bedtime.split(':').map(Number);
    const [wh, wm] = waketime.split(':').map(Number);
    let hours = wh - bh + (wm - bm) / 60;
    if (hours < 0) hours += 24;

    try {
      await API.post('/trackers/sleep', { 
        hours: Math.round(hours * 10) / 10, 
        quality: this.selectedQuality, 
        bedtime, 
        wake_time: waketime 
      });
      Utils.showToast(`Sleep logged: ${hours.toFixed(1)} hours`, 'success');
      await this.init(); // Refresh data
    } catch (e) {
      Utils.showToast('Failed to log sleep', 'error');
    }
  },

  initWaterChart() {
    const ctx = document.getElementById('waterHistoryChart');
    if (!ctx) return;
    
    const days = this.waterHistory.map(w => new Date(w.date).toLocaleDateString('en', { weekday: 'short' }));
    const data = this.waterHistory.map(w => w.glasses);

    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: days,
        datasets: [{ label: 'Glasses', data, backgroundColor: 'rgba(116, 185, 255, 0.5)', borderColor: '#74b9ff', borderWidth: 1, borderRadius: 6 }]
      },
      options: { ...Utils.chartDefaults, plugins: { legend: { display: false } }, scales: { ...Utils.chartDefaults.scales, y: { ...Utils.chartDefaults.scales.y, beginAtZero: true, max: 10 } } }
    });
  },

  initSleepChart() {
    const ctx = document.getElementById('sleepChart');
    if (!ctx) return;
    
    // API returns newest first, so we reverse it for the chart
    const sleepData = [...this.sleepData].slice(0, 7).reverse();
    if (sleepData.length === 0) return;
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: sleepData.map(s => Utils.formatDate(s.date).split(',')[0]),
        datasets: [{ label: 'Hours', data: sleepData.map(s => s.hours), backgroundColor: 'rgba(108, 92, 231, 0.5)', borderColor: '#6C5CE7', borderWidth: 1, borderRadius: 6 }]
      },
      options: { ...Utils.chartDefaults, plugins: { legend: { display: false } }, scales: { ...Utils.chartDefaults.scales, y: { ...Utils.chartDefaults.scales.y, beginAtZero: true, max: 12 } } }
    });
  },

  connectDevice(name) {
    Utils.showToast(`⌚ Searching for ${name}... (Simulated)`, 'info');
    setTimeout(() => Utils.showToast(`✅ ${name} connected successfully!`, 'success'), 2000);
  }
};
