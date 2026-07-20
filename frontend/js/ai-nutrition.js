/* ============================================
   LifeOS — AI Nutrition Planner
   ============================================ */

const AINutrition = {
  planData: null,

  async init() {
    await this.fetchData();
    this.render();
  },

  async fetchData() {
    try {
      const [planRes, fitnessRes] = await Promise.all([
        API.get('/ai/nutrition/plan').catch(() => null),
        API.get('/ai/fitness/stats').catch(() => ({ calories_burned: 0 }))
      ]);
      this.planData = planRes;
      this.fitnessStats = fitnessRes || { calories_burned: 0 };
    } catch(e) {
      console.error('Failed to fetch nutrition data', e);
      this.fitnessStats = { calories_burned: 0 };
    }
  },

  mealDB: {
    vegetarian: {
      breakfast: [
        { name: 'Oatmeal with fruits & nuts', calories: 350, protein: 12 },
        { name: 'Vegetable poha with peanuts', calories: 300, protein: 8 },
        { name: 'Multigrain toast with avocado', calories: 280, protein: 10 },
        { name: 'Idli sambar with chutney', calories: 320, protein: 9 },
        { name: 'Besan chilla with curd', calories: 290, protein: 14 },
        { name: 'Muesli with yogurt & berries', calories: 340, protein: 11 }
      ],
      lunch: [
        { name: 'Dal, rice, sabzi, salad', calories: 550, protein: 18 },
        { name: 'Rajma chawal with raita', calories: 520, protein: 20 },
        { name: 'Paneer tikka wrap with salad', calories: 480, protein: 22 },
        { name: 'Chole with jeera rice', calories: 500, protein: 16 },
        { name: 'Mixed veg pulao with raita', calories: 460, protein: 14 },
        { name: 'Palak paneer with roti', calories: 490, protein: 24 }
      ],
      dinner: [
        { name: 'Vegetable soup with whole wheat bread', calories: 350, protein: 10 },
        { name: 'Moong dal khichdi with ghee', calories: 380, protein: 15 },
        { name: 'Grilled paneer salad', calories: 320, protein: 20 },
        { name: 'Roti with mixed sabzi & dal', calories: 400, protein: 16 },
        { name: 'Vegetable stir-fry with quinoa', calories: 370, protein: 14 },
        { name: 'Stuffed paratha with curd', calories: 420, protein: 12 }
      ],
      snacks: [
        { name: 'Mixed nuts (30g)', calories: 180, protein: 6 },
        { name: 'Greek yogurt with honey', calories: 150, protein: 12 },
        { name: 'Fruit smoothie', calories: 200, protein: 5 },
        { name: 'Roasted chana', calories: 140, protein: 8 },
        { name: 'Sprouts chat', calories: 160, protein: 10 }
      ]
    }
  },

  render() {
    const profile = App.currentProfile || {};
    let bmi = Utils.calculateBMI(profile.weight, profile.height);
    let bmr = Utils.calculateBMR(profile.weight, profile.height, profile.age, profile.gender);
    
    // Dynamic TDEE: Sedentary BMR + Actual Calories Burned from Fitness
    let activeCalories = this.fitnessStats ? this.fitnessStats.calories_burned : 0;
    let tdee = Math.round(bmr * 1.2) + activeCalories; 
    
    let waterIntake = Math.round(profile.weight * 0.033 * 10) / 10;
    let proteinGoal = Math.round(profile.weight * 0.8);
    let bmiLabel = Utils.getBMICategory(bmi).label;

    if (this.planData) {
      // We only use planData for meals and recommendations, 
      // leaving the dynamically calculated tdee, waterIntake, proteinGoal, and bmi intact.
    }

    const container = document.getElementById('page-ai-nutrition');
    container.innerHTML = `
      <div class="section-header" style="background: var(--bg-card); padding: 24px 32px; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 52px; height: 52px; background: rgba(37,99,235,0.08); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>
          </div>
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0; font-family: 'Inter', sans-serif;">AI Nutrition Planner</h2>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--success); box-shadow: 0 0 6px var(--success);"></span>
              Personalized meal plans based on your profile
            </p>
          </div>
        </div>
        <div class="flex gap-md">
          <button class="btn btn-primary" onclick="AINutrition.regenerate()" style="font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 600; padding: 10px 18px; display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.27l-3.26 1.5"></path></svg>
            Regenerate Plan
          </button>
        </div>
      </div>

      <!-- Nutrition Stats -->
      <div class="dashboard-stats" style="margin-bottom:var(--space-xl);">
        <div class="stat-card">
          <div class="stat-icon coral">🔥</div>
          <div class="stat-value">${tdee}</div>
          <div class="stat-label">Daily Calories (TDEE)</div>
          <div class="stat-glow" style="background:var(--accent)"></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon blue">💧</div>
          <div class="stat-value">${waterIntake}L</div>
          <div class="stat-label">Water Goal</div>
          <div class="stat-glow" style="background:var(--info)"></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon green">💪</div>
          <div class="stat-value">${proteinGoal}g</div>
          <div class="stat-label">Protein Goal</div>
          <div class="stat-glow" style="background:var(--success)"></div>
        </div>
        <div class="stat-card">
          <div class="stat-icon purple">⚖️</div>
          <div class="stat-value">${bmi}</div>
          <div class="stat-label">Current BMI</div>
          <div class="stat-change ${bmi < 25 ? 'positive' : 'negative'}">${bmiLabel}</div>
          <div class="stat-glow" style="background:var(--primary)"></div>
        </div>
      </div>

      <!-- Profile Summary -->
      <div class="glass-card no-hover mb-xl" style="border-left:3px solid var(--secondary);">
        <h4 style="margin-bottom:12px;">📋 Your Profile</h4>
        <div class="grid-4 gap-md" style="font-size:0.85rem;">
          <div><span style="color:var(--text-muted);">Age:</span> <strong>${profile.age}</strong></div>
          <div><span style="color:var(--text-muted);">Weight:</span> <strong>${profile.weight} kg</strong></div>
          <div><span style="color:var(--text-muted);">Height:</span> <strong>${profile.height} cm</strong></div>
          <div><span style="color:var(--text-muted);">BMR:</span> <strong>${bmr} cal</strong></div>
        </div>
        ${profile.allergies.length > 0 ? `
          <div style="margin-top:12px;">
            <span style="font-size:0.72rem; color:var(--accent); font-weight:700;">⚠️ Allergies:</span>
            ${profile.allergies.map(a => `<span class="badge badge-danger" style="margin:2px;">${a}</span>`).join('')}
          </div>
        ` : ''}
      </div>

      <!-- Meal Plan -->
      <h3 style="margin-bottom:var(--space-md);">🍽️ Today's Meal Plan</h3>
      <div class="grid-2 gap-md mb-xl" id="meal-plan">
        ${this.generateMealPlan(tdee)}
      </div>

      <!-- Macro Breakdown -->
      <div class="grid-2 gap-xl">
        <div class="glass-card no-hover">
          <h4 style="margin-bottom:16px;">📊 Macro Breakdown</h4>
          <div class="chart-container" style="height:250px;">
            <canvas id="nutritionChart"></canvas>
          </div>
        </div>
        <div class="glass-card no-hover">
          <h4 style="margin-bottom:16px;">💡 AI Recommendations</h4>
          ${this.getRecommendations(profile, bmi)}
        </div>
      </div>
    `;

    this.initChart(tdee, proteinGoal);
  },

  generateMealPlan(tdee) {
    if (this.planData && this.planData.meals) {
      return this.planData.meals.map(m => `
        <div class="meal-card">
          <div class="meal-header">
            <span class="meal-emoji">${m.icon}</span>
            <div>
              <div class="meal-title">${m.meal_type.charAt(0).toUpperCase() + m.meal_type.slice(1)}</div>
              <div class="meal-time">🕐 ${m.time}</div>
            </div>
          </div>
          <ul class="meal-items">
            <li>
              <span>${m.name}</span>
              <span class="meal-calories">${m.calories} cal</span>
            </li>
            <li>
              <span>Protein</span>
              <span class="meal-calories">${m.protein}g</span>
            </li>
          </ul>
        </div>
      `).join('');
    }

    const meals = this.mealDB.vegetarian;
    const day = new Date().getDate() + (this.offset || 0);

    const breakfast = meals.breakfast[day % meals.breakfast.length];
    const lunch = meals.lunch[day % meals.lunch.length];
    const dinner = meals.dinner[day % meals.dinner.length];
    const snack = meals.snacks[day % meals.snacks.length];

    const mealCards = [
      { emoji: '🌅', title: 'Breakfast', time: '8:00 AM', meal: breakfast },
      { emoji: '☀️', title: 'Lunch', time: '1:00 PM', meal: lunch },
      { emoji: '🍎', title: 'Snack', time: '4:30 PM', meal: snack },
      { emoji: '🌙', title: 'Dinner', time: '8:00 PM', meal: dinner }
    ];

    return mealCards.map(m => `
      <div class="meal-card">
        <div class="meal-header">
          <span class="meal-emoji">${m.emoji}</span>
          <div>
            <div class="meal-title">${m.title}</div>
            <div class="meal-time">🕐 ${m.time}</div>
          </div>
        </div>
        <ul class="meal-items">
          <li>
            <span>${m.meal.name}</span>
            <span class="meal-calories">${m.meal.calories} cal</span>
          </li>
          <li>
            <span>Protein</span>
            <span class="meal-calories">${m.meal.protein}g</span>
          </li>
        </ul>
      </div>
    `).join('');
  },

  getRecommendations(profile, bmi) {
    if (this.planData && this.planData.recommendations) {
      return this.planData.recommendations.map(t => `
        <div style="padding:8px 0; font-size:0.85rem; color:var(--text-secondary); border-bottom:1px solid rgba(255,255,255,0.03);">
          <span style="margin-right:8px;">${t.icon}</span>${t.text}
        </div>
      `).join('');
    }

    const tips = [];

    if (bmi > 25) {
      tips.push({ icon: '⚖️', text: 'Your BMI indicates overweight. Aim for a caloric deficit of 300-500 cal/day.' });
      tips.push({ icon: '🥗', text: 'Increase vegetable and fiber intake to feel full with fewer calories.' });
    } else if (bmi < 18.5) {
      tips.push({ icon: '⚖️', text: 'Your BMI is below normal. Increase caloric intake by 300-500 cal/day.' });
      tips.push({ icon: '💪', text: 'Focus on protein-rich foods to build healthy weight.' });
    } else {
      tips.push({ icon: '✅', text: 'Your BMI is in the healthy range. Maintain your current diet!' });
    }

    tips.push({ icon: '💧', text: `Drink at least ${Math.round(profile.weight * 0.033 * 10) / 10}L of water daily.` });
    tips.push({ icon: '🍎', text: 'Eat 5 servings of fruits and vegetables daily.' });
    tips.push({ icon: '⏰', text: 'Maintain consistent meal timings for better metabolism.' });
    tips.push({ icon: '🧂', text: 'Limit sodium to <2,300mg/day for heart health.' });

    if (profile.conditions && profile.conditions.includes('Mild Asthma')) {
      tips.push({ icon: '🫁', text: 'Include anti-inflammatory foods like turmeric, ginger, and omega-3 fatty acids.' });
    }

    return tips.map(t => `
      <div style="padding:8px 0; font-size:0.85rem; color:var(--text-secondary); border-bottom:1px solid rgba(255,255,255,0.03);">
        <span style="margin-right:8px;">${t.icon}</span>${t.text}
      </div>
    `).join('');
  },

  initChart(tdee, proteinGoal) {
    const ctx = document.getElementById('nutritionChart');
    if (!ctx) return;

    const carbsCal = Math.round(tdee * 0.5);
    const proteinCal = proteinGoal * 4;
    const fatCal = tdee - carbsCal - proteinCal;

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Carbs', 'Protein', 'Fats'],
        datasets: [{
          data: [carbsCal, proteinCal, fatCal],
          backgroundColor: ['#6C5CE7', '#00D2D3', '#FF6B6B'],
          borderWidth: 0,
          borderRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { color: '#a0a0b8', font: { family: 'Inter', size: 12 }, padding: 20 }
          }
        },
        cutout: '65%'
      }
    });
  },

  async regenerate() {
    try {
      this.planData = await API.post('/ai/nutrition/regenerate');
      Utils.showToast('🔄 Meal plan regenerated!', 'success');
    } catch(e) {
      this.offset = (this.offset || 0) + 1;
      Utils.showToast('🔄 Meal plan regenerated! (Offline)', 'success');
    }
    this.render();
  }
};
