/* ============================================
   LifeOS — Smart Analytics Module
   ============================================ */

const Analytics = {
  charts: {},
  timelineData: [],
  graphsData: {},
  riskData: null,
  predictionsData: [],

  async init() {
    await this.fetchData();
    this.render();
  },

  async fetchData() {
    try {
      const [t, g, r, p] = await Promise.all([
        API.get('/analytics/timeline'),
        API.get('/analytics/graphs'),
        API.get('/analytics/risk-scores'),
        API.get('/analytics/predictions')
      ]);
      this.timelineData = t || [];
      this.graphsData = g || {};
      this.riskData = r || null;
      this.predictionsData = p || [];
    } catch(e) {
      console.error('Failed to fetch analytics', e);
    }
  },

  render() {
    const container = document.getElementById('page-analytics');

    container.innerHTML = `
      <div class="section-header" style="background: var(--bg-card); padding: 24px 32px; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 52px; height: 52px; background: rgba(37,99,235,0.08); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          </div>
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0; font-family: 'Inter', sans-serif;">Smart Analytics</h2>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--success); box-shadow: 0 0 6px var(--success);"></span>
              Visualize your health trends and predictions
            </p>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs mb-lg">
        <button class="tab active" onclick="Analytics.showTab('timeline')">📅 Health Timeline</button>
        <button class="tab" onclick="Analytics.showTab('graphs')">📈 Disease Progress</button>
        <button class="tab" onclick="Analytics.showTab('risk')">🎯 Health Risk Score</button>
        <button class="tab" onclick="Analytics.showTab('predictions')">🔮 Predictions</button>
      </div>

      <!-- Timeline Tab -->
      <div id="analytics-timeline" class="analytics-tab">
        <h3 style="margin-bottom:var(--space-lg);">📅 Health Timeline</h3>
        <div class="timeline">
          ${this.generateTimeline()}
        </div>
      </div>

      <!-- Graphs Tab -->
      <div id="analytics-graphs" class="analytics-tab" style="display:none;">
        <h3 style="margin-bottom:var(--space-lg);">📈 Disease Progress Graphs</h3>
        <div class="grid-2 gap-xl">
          <div class="glass-card no-hover">
            <h4 style="margin-bottom:12px;">🩸 Blood Sugar Trend</h4>
            <div class="chart-container"><canvas id="sugarChart"></canvas></div>
          </div>
          <div class="glass-card no-hover">
            <h4 style="margin-bottom:12px;">🫀 Blood Pressure Trend</h4>
            <div class="chart-container"><canvas id="bpChart"></canvas></div>
          </div>
          <div class="glass-card no-hover">
            <h4 style="margin-bottom:12px;">⚖️ Weight Trend</h4>
            <div class="chart-container"><canvas id="weightChart"></canvas></div>
          </div>
          <div class="glass-card no-hover">
            <h4 style="margin-bottom:12px;">🧬 Cholesterol Trend</h4>
            <div class="chart-container"><canvas id="cholChart"></canvas></div>
          </div>
        </div>
      </div>

      <!-- Risk Score Tab -->
      <div id="analytics-risk" class="analytics-tab" style="display:none;">
        <h3 style="margin-bottom:var(--space-lg);">🎯 AI Health Risk Score</h3>
        ${this.renderRiskScores()}
      </div>

      <!-- Predictions Tab -->
      <div id="analytics-predictions" class="analytics-tab" style="display:none;">
        <h3 style="margin-bottom:var(--space-lg);">🔮 Health Predictions</h3>
        ${this.renderPredictions()}
      </div>
    `;
  },

  showTab(tab) {
    document.querySelectorAll('.analytics-tab').forEach(t => t.style.display = 'none');
    document.querySelectorAll('#page-analytics .tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`analytics-${tab}`).style.display = 'block';
    event.target.classList.add('active');

    if (tab === 'graphs') setTimeout(() => this.initGraphCharts(), 100);
  },

  generateTimeline() {
    const events = this.timelineData;

    if (events.length === 0) {
      return '<p class="text-center text-muted" style="padding:40px;">No health events to display. Add records and medicines to build your timeline.</p>';
    }

    const typeColors = {
      'Blood Test': 'var(--accent)', 'Imaging': 'var(--info)', 'Prescription': 'var(--primary)',
      'Medicine': 'var(--success)', 'Surgery': 'var(--warning)', 'Vaccination': 'var(--secondary)'
    };

    return events.slice(0, 15).map(e => `
      <div class="timeline-item">
        <div class="timeline-date">${Utils.formatDate(e.date)}</div>
        <div class="timeline-content" style="border-left:3px solid ${typeColors[e.type] || 'var(--primary)'};">
          <div class="timeline-title">${e.title}</div>
          <div class="timeline-desc">${e.description}</div>
          <span class="badge badge-primary" style="margin-top:6px;">${e.type}</span>
        </div>
      </div>
    `).join('');
  },

  initGraphCharts() {
    const healthData = this.graphsData || {};

    // Destroy existing charts
    Object.values(this.charts).forEach(c => c?.destroy());

    const chartConfig = (ctx, labels, data, label, color) => {
      return new Chart(ctx, {
        type: 'line',
        data: {
          labels,
          datasets: [{
            label,
            data,
            borderColor: color,
            backgroundColor: color + '20',
            fill: true,
            tension: 0.4,
            pointBackgroundColor: color,
            pointBorderColor: '#0a0a1a',
            pointBorderWidth: 2,
            pointRadius: 4
          }]
        },
        options: { ...Utils.chartDefaults }
      });
    };

    const sugarCtx = document.getElementById('sugarChart');
    if (sugarCtx && healthData.blood_sugar && healthData.blood_sugar.values.length) {
      this.charts.sugar = chartConfig(sugarCtx,
        healthData.blood_sugar.labels,
        healthData.blood_sugar.values,
        'Blood Sugar (mg/dL)', '#FF6B6B');
    }

    const bpCtx = document.getElementById('bpChart');
    if (bpCtx && healthData.blood_pressure && healthData.blood_pressure.values.length) {
      this.charts.bp = new Chart(bpCtx, {
        type: 'line',
        data: {
          labels: healthData.blood_pressure.labels,
          datasets: [
            { label: 'Systolic', data: healthData.blood_pressure.values, borderColor: '#FF6B6B', backgroundColor: 'rgba(255,107,107,0.1)', fill: true, tension: 0.4, pointRadius: 4 },
            { label: 'Diastolic', data: healthData.blood_pressure.secondary_values, borderColor: '#6C5CE7', backgroundColor: 'rgba(108,92,231,0.1)', fill: true, tension: 0.4, pointRadius: 4 }
          ]
        },
        options: { ...Utils.chartDefaults, plugins: { legend: { display: true, labels: { color: '#a0a0b8' } } } }
      });
    }

    const weightCtx = document.getElementById('weightChart');
    if (weightCtx && healthData.weight && healthData.weight.values.length) {
      this.charts.weight = chartConfig(weightCtx,
        healthData.weight.labels,
        healthData.weight.values,
        'Weight (kg)', '#00D2D3');
    }

    const cholCtx = document.getElementById('cholChart');
    if (cholCtx && healthData.cholesterol && healthData.cholesterol.values.length) {
      this.charts.chol = chartConfig(cholCtx,
        healthData.cholesterol.labels,
        healthData.cholesterol.values,
        'Cholesterol (mg/dL)', '#FDCB6E');
    }
  },

  renderRiskScores() {
    if (!this.riskData) return '';
    const risks = this.riskData.risks || [];
    const overallScore = this.riskData.overall_score || 0;

    return `
      <!-- Overall Score -->
      <div class="glass-card no-hover mb-xl" style="text-align:center;">
        <div style="position:relative; width:200px; height:200px; margin:0 auto;">
          ${Utils.createCircularProgress(overallScore, 100, 200, 12, Utils.getScoreColor(overallScore))}
          <div style="position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); text-align:center;">
            <div style="font-family:var(--font-heading); font-size:3rem; font-weight:800; color:${Utils.getScoreColor(overallScore)};">${overallScore}</div>
            <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.1em;">Health Score</div>
          </div>
        </div>
        <p style="margin-top:16px; color:var(--text-secondary);">Your overall health risk score based on profile data</p>
      </div>

      <!-- Individual Risks -->
      <div class="grid-2 gap-md">
        ${risks.map(r => {
          const level = r.score > 60 ? 'High' : r.score > 35 ? 'Medium' : 'Low';
          const levelClass = r.score > 60 ? 'high' : r.score > 35 ? 'medium' : 'low';
          return `
            <div class="glass-card no-hover">
              <div class="flex justify-between items-center mb-md">
                <div class="flex items-center gap-sm">
                  <span style="font-size:1.5rem;">${r.icon}</span>
                  <h4>${r.name}</h4>
                </div>
                <span class="badge badge-${level === 'Low' ? 'success' : level === 'Medium' ? 'warning' : 'danger'}">${level} Risk</span>
              </div>
              <div class="risk-meter ${levelClass}" style="margin-bottom:12px;">
                <div class="risk-fill" style="width:${r.score}%"></div>
              </div>
              <div class="flex justify-between items-center" style="font-size:0.82rem;">
                <span style="color:var(--text-muted);">Risk Score: ${Math.round(r.score)}%</span>
              </div>
              <div style="margin-top:12px;">
                <p style="font-size:0.72rem; color:var(--text-muted);">Contributing factors:</p>
                <div class="flex flex-wrap gap-sm mt-sm">${r.factors.map(f => `<span class="tag">${f}</span>`).join('')}</div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  },

  renderPredictions() {
    const predictions = this.predictionsData || [];

    if (predictions.length === 0) {
      return '<p class="text-center text-muted" style="padding:40px;">Not enough data for predictions. Add more health entries to see future trends.</p>';
    }

    return `
      <div style="background:rgba(108,92,231,0.08); border-radius:12px; padding:16px; margin-bottom:20px;">
        <p style="font-size:0.82rem; color:var(--secondary);">🤖 Predictions are based on your historical data trends and are estimates, not medical advice.</p>
      </div>
      <div class="grid-${Math.min(3, predictions.length)} gap-md">
        ${predictions.map(p => `
          <div class="glass-card no-hover" style="text-align:center;">
            <div style="font-size:2.5rem; margin-bottom:12px;">${p.icon}</div>
            <h4>${p.name}</h4>
            <div style="margin:16px 0;">
              <div style="font-size:0.75rem; color:var(--text-muted);">Current</div>
              <div style="font-size:1.3rem; font-weight:700; color:var(--text-primary);">${p.current}</div>
            </div>
            <div style="font-size:1.5rem; margin:8px 0;">→</div>
            <div style="margin:16px 0;">
              <div style="font-size:0.75rem; color:var(--text-muted);">Predicted (3 months)</div>
              <div style="font-size:1.3rem; font-weight:700; color:var(--primary-light);">${p.predicted}</div>
            </div>
            <span class="badge badge-primary">${p.trend}</span>
          </div>
        `).join('')}
      </div>
    `;
  }
};
