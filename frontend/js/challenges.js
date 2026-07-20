/* ============================================
   LifeOS — Health Challenges & Badges
   ============================================ */

const Challenges = {
  availableChallenges: [
    { id: 'steps10k', name: 'Walk 10,000 Steps', icon: '🚶', target: 10000, unit: 'steps', reward: '🏅 Step Master', category: 'Fitness' },
    { id: 'water8', name: 'Drink 8 Glasses Water', icon: '💧', target: 8, unit: 'glasses', reward: '💎 Hydration Hero', category: 'Hydration' },
    { id: 'sleep8', name: 'Sleep 8 Hours', icon: '😴', target: 8, unit: 'hours', reward: '🌙 Sleep Champion', category: 'Sleep' },
    { id: 'meditate', name: 'Meditate 10 Minutes', icon: '🧘', target: 10, unit: 'minutes', reward: '🧘 Zen Master', category: 'Mental' },
    { id: 'fruits5', name: 'Eat 5 Servings Fruits/Veg', icon: '🍎', target: 5, unit: 'servings', reward: '🥬 Nutrition Pro', category: 'Diet' },
    { id: 'nosugar', name: 'No Sugar Day', icon: '🚫', target: 1, unit: 'day', reward: '💪 Sugar Free', category: 'Diet' },
    { id: 'stretch', name: 'Stretch for 15 Minutes', icon: '🤸', target: 15, unit: 'minutes', reward: '🎯 Flexibility Star', category: 'Fitness' },
    { id: 'journal', name: 'Write in Journal', icon: '📝', target: 1, unit: 'entry', reward: '✍️ Reflective Mind', category: 'Mental' }
  ],

  badges: [
    { name: '7-Day Streak', icon: '🔥', desc: 'Complete any challenge for 7 days', locked: true },
    { name: '30-Day Streak', icon: '⭐', desc: 'Complete any challenge for 30 days', locked: true },
    { name: 'Water Champion', icon: '💎', desc: 'Drink 8 glasses for 7 days', locked: true },
    { name: 'Step Master', icon: '🏅', desc: 'Walk 10,000 steps in a day', locked: true },
    { name: 'Sleep Expert', icon: '🌙', desc: 'Sleep 8+ hours for 7 days', locked: true },
    { name: 'Health Hero', icon: '🦸', desc: 'Complete all challenges in a day', locked: true },
    { name: 'Early Bird', icon: '🐤', desc: 'Wake up before 6 AM 7 times', locked: false },
    { name: 'Zen Master', icon: '🧘', desc: 'Meditate for 7 consecutive days', locked: true },
    { name: 'Nutrition Pro', icon: '🥬', desc: 'Log meals for 14 days', locked: true },
    { name: 'First Steps', icon: '👶', desc: 'Complete your first challenge', locked: false }
  ],

  init() { this.render(); },

  async render() {
    const container = document.getElementById('page-challenges');
    let apiChallenges = [];
    let streak = 0;
    let earnedBadges = [];
    try {
      apiChallenges = await API.get('/challenges') || [];
      const streakRes = await API.get('/challenges/streak');
      streak = streakRes ? streakRes.streak : 0;
      earnedBadges = await API.get('/challenges/badges') || [];
    } catch(e) {
      console.error('Failed to fetch challenges', e);
      streak = 0;
    }
    
    // Update local badges state with backend data if available
    if (earnedBadges.length > 0) {
      this.badges = earnedBadges;
    }

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h2>🏆 Health Challenges</h2>
          <p class="section-subtitle">Complete challenges, earn badges, build streaks!</p>
        </div>
      </div>

      <!-- Streak & Stats -->
      <div class="dashboard-stats" style="grid-template-columns: repeat(3, 1fr); margin-bottom:var(--space-xl);">
        <div class="stat-card" style="text-align:center;">
          <div style="font-size:2.5rem; margin-bottom:8px;">🔥</div>
          <div class="stat-value">${streak}</div>
          <div class="stat-label">Day Streak</div>
        </div>
        <div class="stat-card" style="text-align:center;">
          <div style="font-size:2.5rem; margin-bottom:8px;">🏅</div>
          <div class="stat-value">${this.badges.filter(b => !b.locked).length}</div>
          <div class="stat-label">Badges Earned</div>
        </div>
        <div class="stat-card" style="text-align:center;">
          <div style="font-size:2.5rem; margin-bottom:8px;">✅</div>
          <div class="stat-value">${apiChallenges.filter(c => c.completed).length}</div>
          <div class="stat-label">Challenges Done Today</div>
        </div>
      </div>

      <!-- Today's Challenges -->
      <h3 style="margin-bottom:var(--space-md);">⚡ Today's Challenges</h3>
      <div class="grid-2 gap-md mb-xl">
        ${this.availableChallenges.map(c => {
          const apiC = apiChallenges.find(a => a.challenge_id === c.id);
          const progress = apiC ? apiC.progress : 0;
          const pct = Math.min(100, (progress / c.target) * 100);
          const completed = pct >= 100;
          return `
            <div class="challenge-card ${completed ? 'completed' : ''}">
              <div class="challenge-header">
                <div class="challenge-icon">${c.icon}</div>
                <div>
                  <div class="challenge-title">${c.name}</div>
                  <div class="challenge-desc">${c.category} • Reward: ${c.reward}</div>
                </div>
                ${completed ? '<span class="badge badge-success">✅ Done!</span>' : ''}
              </div>
              <div class="challenge-progress">
                <div class="progress-bar">
                  <div class="progress-fill ${completed ? 'green' : 'purple'}" style="width:${pct}%"></div>
                </div>
                <div class="challenge-stats">
                  <span>${progress}/${c.target} ${c.unit}</span>
                  <span>${Math.round(pct)}%</span>
                </div>
              </div>
              ${!completed ? `
                <div class="flex gap-sm mt-md">
                  <button class="btn btn-sm btn-primary" onclick="Challenges.addProgress('${c.id}', 1)">+1</button>
                  <button class="btn btn-sm btn-secondary" onclick="Challenges.addProgress('${c.id}', ${Math.ceil(c.target/2)})">+${Math.ceil(c.target/2)}</button>
                  <button class="btn btn-sm btn-success" onclick="Challenges.complete('${c.id}')">Complete</button>
                </div>
              ` : ''}
            </div>
          `;
        }).join('')}
      </div>

      <!-- Badges Collection -->
      <h3 style="margin-bottom:var(--space-md);">🏅 Badge Collection</h3>
      <div class="badges-grid">
        ${this.badges.map(b => `
          <div class="badge-card ${b.locked ? 'locked' : ''}">
            <div class="badge-icon">${b.icon}</div>
            <div class="badge-name">${b.name}</div>
            <div style="font-size:0.65rem; color:var(--text-muted); margin-top:4px;">${b.locked ? '🔒 Locked' : '✅ Earned'}</div>
          </div>
        `).join('')}
      </div>
    `;
  },

  async addProgress(id, amount) {
    try {
      const res = await API.post(`/challenges/${id}/progress`, { amount });
      if (res.completed && res.progress - amount < res.target) {
        Utils.showToast(`🎉 Challenge completed: ${res.name}! Earned ${res.reward}`, 'success');
      } else {
        Utils.showToast(`+${amount} added to ${res.name}`, 'info');
      }
      this.render();
    } catch(e) {
      Utils.showToast('Failed to add progress', 'error');
    }
  },

  async complete(id) {
    try {
      const res = await API.post(`/challenges/${id}/complete`);
      Utils.showToast(`🎉 ${res.name} completed! Earned ${res.reward}`, 'success');
      this.render();
    } catch(e) {
      Utils.showToast('Failed to complete challenge', 'error');
    }
  }
};
