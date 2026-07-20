/* ============================================
   LifeOS — AI Fitness Coach
   ============================================ */

const AIFitness = {
  currentCategory: 'cardio',
  exercises: {
    cardio: [
      { name: 'Brisk Walking', duration: '30 min', calories: 150, icon: '🚶', difficulty: 'Easy' },
      { name: 'Jogging', duration: '20 min', calories: 200, icon: '🏃', difficulty: 'Medium' },
      { name: 'Jump Rope', duration: '15 min', calories: 200, icon: '🤸', difficulty: 'Hard' },
      { name: 'Cycling', duration: '30 min', calories: 250, icon: '🚴', difficulty: 'Medium' },
      { name: 'Dancing', duration: '30 min', calories: 200, icon: '💃', difficulty: 'Easy' },
      { name: 'Swimming', duration: '30 min', calories: 300, icon: '🏊', difficulty: 'Medium' }
    ],
    strength: [
      { name: 'Push-ups', reps: '3 × 15', calories: 50, icon: '💪', difficulty: 'Medium' },
      { name: 'Squats', reps: '3 × 20', calories: 60, icon: '🦵', difficulty: 'Easy' },
      { name: 'Plank', reps: '3 × 60 sec', calories: 30, icon: '🧘', difficulty: 'Medium' },
      { name: 'Lunges', reps: '3 × 12 each', calories: 50, icon: '🏋️', difficulty: 'Medium' },
      { name: 'Burpees', reps: '3 × 10', calories: 80, icon: '⚡', difficulty: 'Hard' },
      { name: 'Mountain Climbers', reps: '3 × 20', calories: 60, icon: '🧗', difficulty: 'Medium' }
    ],
    yoga: [
      { name: 'Sun Salutation', duration: '15 min', calories: 80, icon: '🧘', difficulty: 'Easy' },
      { name: 'Warrior Pose Flow', duration: '10 min', calories: 50, icon: '🧘‍♂️', difficulty: 'Medium' },
      { name: 'Balance & Stretch', duration: '20 min', calories: 70, icon: '🤸‍♀️', difficulty: 'Easy' },
      { name: 'Power Yoga', duration: '30 min', calories: 150, icon: '🔥', difficulty: 'Hard' },
      { name: 'Meditation & Breathing', duration: '15 min', calories: 20, icon: '🧘‍♀️', difficulty: 'Easy' },
      { name: 'Flexibility Flow', duration: '20 min', calories: 60, icon: '🌊', difficulty: 'Easy' }
    ]
  },

  stats: null,

  async init() { 
    await this.fetchData();
    this.render(); 
  },

  async fetchData() {
    try {
      this.stats = await API.get('/ai/fitness/stats');
    } catch(e) {
      console.error(e);
      this.stats = {
        steps: 0,
        calories_burned: 0,
        active_minutes: 0,
        distance_km: 0,
        step_goal: 10000,
        step_percentage: 0
      };
    }
  },

  render() {
    const s = this.stats || { steps: 0, calories_burned: 0, active_minutes: 0, distance_km: 0, step_goal: 10000, step_percentage: 0 };
    const dailySteps = s.steps;
    const stepGoal = s.step_goal;
    const caloriesBurned = s.calories_burned;

    const container = document.getElementById('page-ai-fitness');
    container.innerHTML = `
      <div class="section-header" style="background: var(--bg-card); padding: 24px 32px; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 52px; height: 52px; background: rgba(37,99,235,0.08); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          </div>
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0; font-family: 'Inter', sans-serif;">AI Fitness Coach</h2>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--success); box-shadow: 0 0 6px var(--success);"></span>
              Personalized workout plans and activity tracking
            </p>
          </div>
        </div>
      </div>

      <!-- Daily Activity Stats -->
      <div class="dashboard-stats" style="margin-bottom:var(--space-xl);">
        <div class="stat-card">
          <div class="stat-icon green">👣</div>
          <div class="stat-value">${dailySteps.toLocaleString()}</div>
          <div class="stat-label">Steps Today</div>
          <div class="progress-bar mt-sm">
            <div class="progress-fill green" style="width:${Math.min(100, (dailySteps/stepGoal)*100)}%"></div>
          </div>
          <div class="stat-change ${dailySteps >= stepGoal ? 'positive' : 'negative'}">${Math.round((dailySteps/stepGoal)*100)}% of goal</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon teal">📏</div>
          <div class="stat-value">${s.distance_km}</div>
          <div class="stat-label">Distance (km)</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon coral">🔥</div>
          <div class="stat-value">${caloriesBurned}</div>
          <div class="stat-label">Calories Burned</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">⏱️</div>
          <div class="stat-value">${s.active_minutes}</div>
          <div class="stat-label">Active Minutes</div>
        </div>
      </div>

      <!-- Step Counter -->
      <div class="glass-card no-hover mb-xl">
        <div class="flex justify-between items-center mb-md">
          <h3>👣 Daily Step Counter</h3>
          <span style="font-size:0.82rem; color:var(--text-muted);">Goal: ${stepGoal.toLocaleString()} steps</span>
        </div>
        <div style="text-align:center; padding:20px;">
          <div style="position:relative; width:200px; height:200px; margin:0 auto;">
            ${Utils.createCircularProgress(Math.min(dailySteps, stepGoal), stepGoal, 200, 10, dailySteps >= stepGoal ? 'var(--success)' : 'var(--primary)')}
            <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center;">
              <div style="font-family:var(--font-heading); font-size:2.2rem; font-weight:800;">${dailySteps.toLocaleString()}</div>
              <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.1em;">Steps</div>
            </div>
          </div>
        </div>
        <div class="flex justify-center gap-sm mt-md" style="flex-wrap: wrap; align-items:center;">
          <!-- Custom Minus Input Pill -->
          <div style="background:var(--danger); border-radius: 50px; padding: 2px 14px; color: white; display: inline-flex; align-items:center; height: 32px; box-shadow: 0 4px 12px rgba(255, 107, 107, 0.3); ${dailySteps <= 0 ? 'opacity:0.4;' : ''}">
            <span style="font-weight:700;">-</span>
            <input type="number" id="custom-minus-val" placeholder="0" style="background:transparent; border:none; color:white; width:45px; outline:none; font-weight:600; font-size:0.85rem; text-align:center;" ${dailySteps <= 0 ? 'disabled' : ''} onkeypress="if(event.key==='Enter') AIFitness.submitCustomMinus()">
          </div>
          <style>#custom-minus-val::placeholder { color: rgba(255,255,255,0.6); } #custom-minus-val::-webkit-inner-spin-button, #custom-minus-val::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }</style>
          <div style="width: 8px;"></div> <!-- Spacer -->
          <button class="btn btn-primary btn-sm" onclick="AIFitness.addSteps(1000)">+ 1,000</button>
          <button class="btn btn-secondary btn-sm" onclick="AIFitness.addSteps(2500)">+ 2,500</button>
          <button class="btn btn-secondary btn-sm" onclick="AIFitness.addSteps(5000)">+ 5,000</button>
        </div>
      </div>

      <!-- Workout Plans -->
      <div class="tabs mb-lg">
        <button class="tab ${this.currentCategory === 'cardio' ? 'active' : ''}" onclick="AIFitness.showCategory('cardio')">🏃 Cardio</button>
        <button class="tab ${this.currentCategory === 'strength' ? 'active' : ''}" onclick="AIFitness.showCategory('strength')">💪 Strength</button>
        <button class="tab ${this.currentCategory === 'yoga' ? 'active' : ''}" onclick="AIFitness.showCategory('yoga')">🧘 Yoga</button>
      </div>

      <div class="grid-3 gap-md" id="workout-grid">
        ${this.renderExercises(this.currentCategory)}
      </div>

      <!-- Weekly Plan -->
      <h3 style="margin:var(--space-xl) 0 var(--space-md);">📅 Weekly Workout Plan</h3>
      <div class="glass-card no-hover">
        ${this.getWeeklyPlan().map(d => `
          <div class="list-item">
            <div class="item-icon" style="background:rgba(${d.rest ? '255,107,107' : '108,92,231'},0.15); color:${d.rest ? 'var(--accent)' : 'var(--primary-light)'};">
              ${d.icon}
            </div>
            <div class="item-content">
              <div class="item-title">${d.day}</div>
              <div class="item-subtitle">${d.workout}</div>
            </div>
            <span class="badge ${d.rest ? 'badge-danger' : 'badge-primary'}">${d.duration}</span>
          </div>
        `).join('')}
      </div>
    `;
  },

  renderExercises(category) {
    return this.exercises[category].map(e => `
      <div class="glass-card" style="text-align:center;">
        <div style="font-size:2.5rem; margin-bottom:12px;">${e.icon}</div>
        <h4>${e.name}</h4>
        <p style="font-size:0.82rem; color:var(--text-muted); margin:8px 0;">${e.duration || e.reps}</p>
        <div class="flex justify-center gap-sm">
          <span class="badge badge-teal">🔥 ${e.calories} cal</span>
          <span class="badge ${e.difficulty === 'Easy' ? 'badge-success' : e.difficulty === 'Hard' ? 'badge-danger' : 'badge-warning'}">${e.difficulty}</span>
        </div>
        <button class="btn btn-sm btn-primary mt-md" onclick="AIFitness.logExercise('${e.name}', ${e.calories})">
          ✅ Log Workout
        </button>
      </div>
    `).join('');
  },

  showCategory(category) {
    this.currentCategory = category;
    document.querySelectorAll('#page-ai-fitness .tab').forEach(t => t.classList.remove('active'));
    if (event && event.target) {
      // Find the actual button element in case the click was on an inner element
      const btn = event.target.closest('button');
      if (btn) btn.classList.add('active');
    }
    document.getElementById('workout-grid').innerHTML = this.renderExercises(category);
  },

  getWeeklyPlan() {
    return [
      { day: 'Monday', workout: 'Cardio + Light Yoga', duration: '45 min', icon: '🏃', rest: false },
      { day: 'Tuesday', workout: 'Upper Body Strength', duration: '40 min', icon: '💪', rest: false },
      { day: 'Wednesday', workout: 'Yoga & Flexibility', duration: '30 min', icon: '🧘', rest: false },
      { day: 'Thursday', workout: 'Lower Body Strength', duration: '40 min', icon: '🦵', rest: false },
      { day: 'Friday', workout: 'HIIT Cardio', duration: '30 min', icon: '⚡', rest: false },
      { day: 'Saturday', workout: 'Full Body + Stretching', duration: '45 min', icon: '🏋️', rest: false },
      { day: 'Sunday', workout: 'Rest & Recovery', duration: 'Rest', icon: '😴', rest: true }
    ];
  },

  async addSteps(count) {
    if (count < 0) {
      const currentSteps = this.stats?.steps || 0;
      if (currentSteps <= 0) {
        Utils.showToast('Steps are already at zero!', 'info');
        return;
      }
      if (currentSteps + count < 0) {
        count = -currentSteps; // Clamp subtraction so it never goes below 0
      }
    }

    try {
      await API.post(`/ai/fitness/steps?steps=${count}`);
      if (count > 0) {
        Utils.showToast(`+${count.toLocaleString()} steps added!`, 'success');
      } else {
        Utils.showToast(`${Math.abs(count).toLocaleString()} steps removed!`, 'info');
      }
      await this.fetchData();
    } catch(e) {
      Utils.showToast('Failed to update steps', 'error');
    }
    this.render();
  },

  promptMinusSteps() {
    const input = prompt('How many steps would you like to remove?');
    if (!input) return;
    const count = parseInt(input.replace(/,/g, ''), 10);
    if (isNaN(count) || count <= 0) {
      Utils.showToast('Please enter a valid positive number', 'error');
      return;
    }
    this.addSteps(-count);
  },

  submitCustomMinus() {
    const input = document.getElementById('custom-minus-val');
    if (!input || !input.value) return;
    const count = parseInt(input.value, 10);
    if (isNaN(count) || count <= 0) {
      Utils.showToast('Please enter a valid positive number', 'error');
      return;
    }
    input.value = '';
    this.addSteps(-count);
  },

  async logExercise(name, calories) {
    try {
      // Assuming 30 minutes for default duration if not specified
      await API.post(`/ai/fitness/log?exercise_name=${encodeURIComponent(name)}&duration_minutes=30&calories=${calories}`);
      Utils.showToast(`✅ ${name} logged! Burned ${calories} calories`, 'success');
      await this.fetchData();
    } catch(e) {
      Utils.showToast('Failed to add workout', 'error');
    }
    this.render();
  }
};
