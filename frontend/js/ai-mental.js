/* ============================================
   LifeOS — AI Mental Health Assistant
   ============================================ */

const AIMental = {
  meditations: [
    { name: 'Deep Breathing', duration: '5 min', icon: '🌬️', desc: 'Inhale 4s, hold 7s, exhale 8s' },
    { name: 'Body Scan', duration: '10 min', icon: '🧘', desc: 'Progressive muscle relaxation' },
    { name: 'Mindful Walking', duration: '15 min', icon: '🚶', desc: 'Focus on each step and breath' },
    { name: 'Gratitude Meditation', duration: '5 min', icon: '🙏', desc: 'Reflect on 3 things you\'re grateful for' },
    { name: 'Loving Kindness', duration: '10 min', icon: '💗', desc: 'Send love to yourself and others' },
    { name: 'Sleep Meditation', duration: '15 min', icon: '🌙', desc: 'Guided relaxation for sleep' }
  ],

  data: { moods: [], analysis: null, stress: null, meditations: [] },

  async init() {
    await this.fetchData();
    this.render();
  },

  async fetchData() {
    try {
      this.data.moods = await API.get('/ai/mental/mood/history');
      this.data.analysis = await API.get('/ai/mental/mood/analysis');
      this.data.stress = await API.get('/ai/mental/stress');
      this.data.meditations = await API.get('/ai/mental/meditations');
    } catch(e) {
      console.error(e);
    }
  },

  render() {
    const recentMoods = [...this.data.moods].reverse(); // Chart wants oldest first
    const container = document.getElementById('page-ai-mental');

    container.innerHTML = `
      <div class="section-header" style="background: var(--bg-card); padding: 24px 32px; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 52px; height: 52px; background: rgba(37,99,235,0.08); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
          </div>
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0; font-family: 'Inter', sans-serif;">AI Mental Health Assistant</h2>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--success); box-shadow: 0 0 6px var(--success);"></span>
              Track your mood, manage stress, and find peace
            </p>
          </div>
        </div>
      </div>

      <!-- Mood Tracker -->
      <div class="glass-card no-hover mb-xl">
        <h3 style="margin-bottom:16px;">😊 How are you feeling right now?</h3>
        <div class="mood-selector">
          ${[
            { emoji: '😄', label: 'Great' },
            { emoji: '🙂', label: 'Good' },
            { emoji: '😐', label: 'Okay' },
            { emoji: '😔', label: 'Low' },
            { emoji: '😢', label: 'Sad' },
            { emoji: '😡', label: 'Angry' },
            { emoji: '😰', label: 'Anxious' }
          ].map(m => `
            <div style="text-align:center;">
              <button class="mood-btn" onclick="AIMental.logMood('${m.emoji}')">${m.emoji}</button>
              <div style="font-size:0.68rem; color:var(--text-muted); margin-top:4px;">${m.label}</div>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="grid-2 gap-xl mb-xl">
        <!-- Mood History -->
        <div class="glass-card no-hover">
          <h4 style="margin-bottom:16px;">📅 Mood History (Last 7 days)</h4>
          ${recentMoods.length > 0 ? `
            <div style="display:flex; justify-content:space-between; align-items:flex-end; height:120px; padding:10px 0;">
              ${recentMoods.map(m => {
                const moodValues = { '😄': 5, '🙂': 4, '😐': 3, '😔': 2, '😢': 1, '😡': 1, '😰': 2 };
                const height = (moodValues[m.mood] || 3) * 20;
                const d = new Date(m.date);
                return `
                  <div style="text-align:center; flex:1;">
                    <div style="font-size:1.2rem;">${m.mood}</div>
                    <div style="width:30px; height:${height}px; background:linear-gradient(to top, var(--primary), var(--primary-light)); border-radius:6px 6px 0 0; margin:4px auto;"></div>
                    <div style="font-size:0.6rem; color:var(--text-muted);">${d.toLocaleDateString('en',{weekday:'short'})}</div>
                  </div>
                `;
              }).join('')}
            </div>
          ` : '<p style="color:var(--text-muted); text-align:center; padding:20px;">No mood data yet. Start tracking!</p>'}
          
          <!-- Mood Analysis -->
          <div style="margin-top:16px; padding:12px; background:rgba(108,92,231,0.08); border-radius:8px;">
            <p style="font-size:0.72rem; color:var(--secondary); font-weight:700;">🤖 AI MOOD ANALYSIS</p>
            <p style="font-size:0.82rem; color:var(--text-secondary); margin-top:4px;">
              ${this.data.analysis ? this.data.analysis.analysis : this.analyzeMood(recentMoods)}
            </p>
          </div>
        </div>

        <!-- Stress Level -->
        <div class="glass-card no-hover">
          <h4 style="margin-bottom:16px;">😰 Stress Level Assessment</h4>
          <div style="text-align:center; padding:20px;">
            ${(() => {
              const stressLevel = this.data.stress ? this.data.stress.stress_level : this.calculateStress(recentMoods);
              const advice = this.data.stress ? this.data.stress.advice : (stressLevel > 70 ? '⚠️ High stress detected. Consider relaxation techniques.' : stressLevel > 40 ? '😐 Moderate stress. Take breaks regularly.' : '✅ Low stress. Keep it up!');
              return `
                <div style="position:relative; width:160px; height:160px; margin:0 auto;">
                  ${Utils.createCircularProgress(stressLevel, 100, 160, 10, stressLevel > 70 ? 'var(--accent)' : stressLevel > 40 ? 'var(--warning)' : 'var(--success)')}
                  <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center;">
                    <div style="font-family:var(--font-heading); font-size:2rem; font-weight:800; color:${stressLevel > 70 ? 'var(--accent)' : stressLevel > 40 ? 'var(--warning)' : 'var(--success)'};">${stressLevel}</div>
                    <div style="font-size:0.65rem; color:var(--text-muted); text-transform:uppercase;">Stress</div>
                  </div>
                </div>
                <p style="margin-top:12px; font-size:0.85rem; color:var(--text-secondary);">
                  ${advice}
                </p>
              `;
            })()}
          </div>
        </div>
      </div>

      <!-- Journal -->
      <div class="glass-card no-hover mb-xl">
        <h3 style="margin-bottom:16px;">📝 Mood Journal</h3>
        <textarea class="form-textarea" id="journal-entry" rows="4" 
                  placeholder="Write about your day, feelings, or thoughts... The AI will analyze your journal for insights."></textarea>
        <div class="flex justify-between items-center mt-md">
          <span style="font-size:0.75rem; color:var(--text-muted);">🤖 AI will analyze your journal entry</span>
          <button class="btn btn-primary btn-sm" onclick="AIMental.saveJournal()">📝 Save & Analyze</button>
        </div>
        <div id="journal-analysis" class="mt-md"></div>
      </div>

      <!-- Meditation Suggestions -->
      <h3 style="margin-bottom:var(--space-md);">🧘 Meditation & Relaxation</h3>
      <div class="grid-3 gap-md mb-xl">
        ${(this.data.meditations.length ? this.data.meditations : this.meditations).map(m => `
          <div class="glass-card" style="text-align:center; cursor:pointer;" onclick="AIMental.startMeditation('${m.name}')">
            <div style="font-size:2.5rem; margin-bottom:8px;">${m.icon}</div>
            <h4>${m.name}</h4>
            <p style="font-size:0.78rem; color:var(--text-muted); margin:8px 0;">${m.desc || m.description}</p>
            <span class="badge badge-primary">⏱ ${m.duration}</span>
          </div>
        `).join('')}
      </div>

      <!-- Depression Screening -->
      <div class="glass-card no-hover" style="border-left:3px solid var(--warning);">
        <h4 style="margin-bottom:12px;">🔍 Quick Mental Health Check</h4>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:16px;">
          Answer these questions honestly. This is not a diagnosis but a self-awareness tool.
        </p>
        <div id="mental-screening">
          ${this.getScreeningQuestions().map((q, i) => `
            <div style="padding:12px 0; border-bottom:1px solid rgba(255,255,255,0.03);">
              <p style="font-size:0.88rem; margin-bottom:8px;">${i+1}. ${q}</p>
              <div class="flex gap-sm">
                ${['Never', 'Sometimes', 'Often', 'Always'].map((a, j) => `
                  <label class="form-check">
                    <input type="radio" name="q${i}" value="${j}" onchange="AIMental.updateScreening()">
                    ${a}
                  </label>
                `).join('')}
              </div>
            </div>
          `).join('')}
          <button class="btn btn-primary mt-md" onclick="AIMental.evaluateScreening()">📊 Evaluate</button>
        </div>
        <div id="screening-result"></div>
      </div>
    `;
  },

  async logMood(emoji) {
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    if (event) event.target.closest('.mood-btn')?.classList.add('selected');
    
    try {
      await API.post('/ai/mental/mood', { mood: emoji, note: '' });
      Utils.showToast(`Mood recorded: ${emoji}`, 'success');
      await this.fetchData();
    } catch(e) {
      Utils.showToast('Failed to log mood', 'error');
    }
    this.render();
  },

  analyzeMood(moods) {
    if (moods.length === 0) return 'Start tracking your mood daily to get personalized insights!';
    const moodScores = { '😄': 5, '🙂': 4, '😐': 3, '😔': 2, '😢': 1, '😡': 1, '😰': 2 };
    const avg = moods.reduce((sum, m) => sum + (moodScores[m.mood] || 3), 0) / moods.length;
    
    if (avg >= 4) return 'Your mood has been consistently positive! Keep maintaining your healthy habits and social connections. 🌟';
    if (avg >= 3) return 'Your mood has been average this week. Try incorporating more activities you enjoy, exercise, and social interaction. 💪';
    if (avg >= 2) return 'Your mood seems low lately. Consider talking to someone you trust, getting more sunlight and exercise. Professional support can help. 💙';
    return 'You\'ve been feeling down consistently. Please consider reaching out to a mental health professional. You\'re not alone. ❤️ Helpline: 9152987821 (iCall)';
  },

  calculateStress(moods) {
    if (moods.length === 0) return 30;
    const moodScores = { '😄': 10, '🙂': 25, '😐': 40, '😔': 65, '😢': 80, '😡': 85, '😰': 90 };
    return Math.round(moods.reduce((sum, m) => sum + (moodScores[m.mood] || 40), 0) / moods.length);
  },

  async saveJournal() {
    const text = document.getElementById('journal-entry').value.trim();
    if (!text) { Utils.showToast('Please write something first', 'warning'); return; }

    try {
      const res = await API.post('/ai/mental/journal', { content: text });
      let color = 'var(--info)';
      if (res.sentiment === 'Positive') color = 'var(--success)';
      else if (res.sentiment === 'Needs Attention') color = 'var(--warning)';

      document.getElementById('journal-analysis').innerHTML = `
        <div style="background:rgba(108,92,231,0.08); border-radius:12px; padding:16px; border-left:3px solid ${color};">
          <p style="font-size:0.72rem; color:var(--secondary); font-weight:700; margin-bottom:8px;">🤖 AI JOURNAL ANALYSIS</p>
          <p style="font-size:0.85rem; color:var(--text-primary);">
            <strong>Sentiment:</strong> <span style="color:${color};">${res.sentiment}</span><br>
            <strong>Insight:</strong> ${res.ai_analysis || 'Journal saved successfully.'}
          </p>
        </div>
      `;
      Utils.showToast('Journal saved and analyzed!', 'success');
      document.getElementById('journal-entry').value = '';
      await this.fetchData();
      this.render(); // update history
    } catch(e) {
      Utils.showToast('Failed to log journal entry', 'error');
    }
  },

  startMeditation(name) {
    Utils.showModal(`🧘 ${name}`, `
      <div style="text-align:center; padding:30px;">
        <div style="font-size:4rem; margin-bottom:16px; animation: float 3s ease-in-out infinite;">🧘</div>
        <h3>${name}</h3>
        <p style="color:var(--text-secondary); margin:12px 0;">Find a comfortable position, close your eyes, and focus on your breath.</p>
        <div style="font-family:var(--font-heading); font-size:3rem; font-weight:800; color:var(--primary-light); margin:20px 0;" id="meditation-timer">00:00</div>
        <div class="flex justify-center gap-sm">
          <button class="btn btn-primary" onclick="AIMental.toggleTimer()">▶ Start</button>
          <button class="btn btn-secondary" onclick="Utils.closeModal()">Stop</button>
        </div>
      </div>
    `);
  },

  timerInterval: null,
  timerSeconds: 0,

  toggleTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      return;
    }
    this.timerSeconds = 0;
    this.timerInterval = setInterval(() => {
      this.timerSeconds++;
      const min = Math.floor(this.timerSeconds / 60).toString().padStart(2, '0');
      const sec = (this.timerSeconds % 60).toString().padStart(2, '0');
      const el = document.getElementById('meditation-timer');
      if (el) el.textContent = `${min}:${sec}`;
      else { clearInterval(this.timerInterval); this.timerInterval = null; }
    }, 1000);
  },

  getScreeningQuestions() {
    return [
      'Do you feel down, depressed, or hopeless?',
      'Do you have trouble falling or staying asleep?',
      'Do you feel tired or have little energy?',
      'Do you have poor appetite or overeating?',
      'Do you have trouble concentrating?',
      'Do you feel anxious or worried?'
    ];
  },

  updateScreening() {},

  async evaluateScreening() {
    let total = 0;
    const answers = [];
    const qs = this.getScreeningQuestions().length;
    for (let i = 0; i < qs; i++) {
      const checked = document.querySelector(`input[name="q${i}"]:checked`);
      const val = checked ? parseInt(checked.value) : 0;
      total += val;
      answers.push(val);
    }

    try {
      const res = await API.post('/ai/mental/screening', { answers });
      const pct = res.percentage;
      const color = pct <= 25 ? 'var(--success)' : pct <= 50 ? 'var(--warning)' : 'var(--accent)';
      document.getElementById('screening-result').innerHTML = `
        <div style="background:rgba(108,92,231,0.08); border-radius:12px; padding:20px; margin-top:16px;">
          <div class="flex items-center gap-md mb-md">
            <div style="font-size:2rem;">${pct <= 25 ? '✅' : pct <= 50 ? '⚠️' : '🔴'}</div>
            <div>
              <h4 style="color:${color};">${res.result}</h4>
              <p style="font-size:0.82rem; color:var(--text-secondary);">Score: ${res.score}/${res.max_score}</p>
            </div>
          </div>
          <p style="font-size:0.88rem; color:var(--text-primary);">${res.advice}</p>
        </div>
      `;
    } catch(e) {
      Utils.showToast('Screening analysis failed', 'error');
    }
  }
};
