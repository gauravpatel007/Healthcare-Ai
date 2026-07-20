/* ============================================
   LifeOS — Expense Tracker Module
   ============================================ */

const Expense = {
  summaryData: null,

  async init() {
    await this.fetchData();
    this.render();
  },

  async fetchData() {
    try {
      this.summaryData = await API.get('/expenses/summary');
    } catch (e) {
      console.error('Failed to fetch expenses', e);
      this.summaryData = { total: 0, by_category: {}, expenses: [] };
    }
  },

  render() {
    const data = this.summaryData || { total: 0, by_category: {}, expenses: [] };
    const expenses = data.expenses || [];
    const totals = data.by_category || {};
    const grandTotal = data.total || 0;
    const container = document.getElementById('page-expense');

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h2>💰 Health Expense Tracker</h2>
          <p class="section-subtitle">Track medical expenses and insurance claims</p>
        </div>
        <button class="btn btn-primary" onclick="Expense.showAddForm()">+ Add Expense</button>
      </div>

      <!-- Summary Cards -->
      <div class="expense-summary">
        <div class="stat-card">
          <div class="stat-icon purple">💰</div>
          <div class="stat-value">${Utils.formatCurrency(grandTotal)}</div>
          <div class="stat-label">Total Expenses</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon coral">💊</div>
          <div class="stat-value">${Utils.formatCurrency(totals.Medicine || 0)}</div>
          <div class="stat-label">Medicine Costs</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon teal">🏥</div>
          <div class="stat-value">${Utils.formatCurrency((totals.Doctor || 0) + (totals.Tests || 0))}</div>
          <div class="stat-label">Doctor & Tests</div>
        </div>
      </div>

      <div class="grid-2 gap-xl">
        <!-- Chart -->
        <div class="glass-card no-hover">
          <h4 style="margin-bottom:16px;">📊 Expense Breakdown</h4>
          <div class="chart-container" style="height:280px;">
            <canvas id="expenseChart"></canvas>
          </div>
        </div>

        <!-- Category Breakdown -->
        <div class="glass-card no-hover">
          <h4 style="margin-bottom:16px;">📋 By Category</h4>
          ${Object.entries(totals).filter(([,v]) => v > 0).map(([cat, amount]) => {
            const pct = grandTotal > 0 ? Math.round((amount / grandTotal) * 100) : 0;
            const icons = { Medicine: '💊', Doctor: '👨‍⚕️', Tests: '🔬', Insurance: '📋', Other: '📦' };
            return `
              <div style="padding:10px 0; border-bottom:1px solid rgba(255,255,255,0.03);">
                <div class="flex justify-between items-center mb-sm">
                  <span style="font-size:0.88rem;">${icons[cat] || '📦'} ${cat}</span>
                  <span style="font-weight:700;">${Utils.formatCurrency(amount)}</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill purple" style="width:${pct}%"></div>
                </div>
                <div style="font-size:0.72rem; color:var(--text-muted); margin-top:4px;">${pct}% of total</div>
              </div>
            `;
          }).join('')}
          ${grandTotal === 0 ? '<p class="text-center text-muted" style="padding:20px;">No expenses recorded</p>' : ''}
        </div>
      </div>

      <!-- Expense List -->
      <h3 style="margin:var(--space-xl) 0 var(--space-md);">📋 Recent Expenses</h3>
      <div class="glass-card no-hover">
        ${expenses.length > 0 ? expenses.map(e => `
          <div class="list-item">
            <div class="item-icon" style="background:rgba(108,92,231,0.15); color:var(--primary-light);">
              ${{ Medicine: '💊', Doctor: '👨‍⚕️', Tests: '🔬', Insurance: '📋' }[e.category] || '📦'}
            </div>
            <div class="item-content">
              <div class="item-title">${e.description}</div>
              <div class="item-subtitle">${e.category} • ${Utils.formatDate(e.date)}</div>
            </div>
            <div style="text-align:right;">
              <div style="font-weight:700; color:var(--accent);">${Utils.formatCurrency(e.amount)}</div>
              <button class="btn btn-sm btn-secondary" style="margin-top:4px;" onclick="Expense.delete('${e.id}')">🗑</button>
            </div>
          </div>
        `).join('') : `
          <div class="empty-state">
            <div class="empty-icon">💰</div>
            <h3>No Expenses</h3>
            <p>Track your medical expenses here</p>
          </div>
        `}
      </div>
    `;

    this.initChart(totals);
  },

  initChart(totals) {
    const ctx = document.getElementById('expenseChart');
    if (!ctx) return;
    const filtered = Object.entries(totals).filter(([, v]) => v > 0);
    if (filtered.length === 0) return;

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: filtered.map(([k]) => k),
        datasets: [{
          data: filtered.map(([, v]) => v),
          backgroundColor: ['#6C5CE7', '#FF6B6B', '#00D2D3', '#FDCB6E', '#00B894'],
          borderWidth: 0,
          borderRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#a0a0b8', font: { family: 'Inter' }, padding: 15 } }
        },
        cutout: '60%'
      }
    });
  },

  showAddForm() {
    Utils.showModal('💰 Add Expense', `
      <div class="form-group">
        <label class="form-label">Description</label>
        <input type="text" class="form-input" id="exp-desc" placeholder="e.g., Monthly medicines">
      </div>
      <div class="grid-2 gap-md">
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-select" id="exp-category">
            <option>Medicine</option><option>Doctor</option><option>Tests</option>
            <option>Insurance</option><option>Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Amount (₹)</label>
          <input type="number" class="form-input" id="exp-amount" placeholder="0">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Date</label>
        <input type="date" class="form-input" id="exp-date" value="${new Date().toISOString().split('T')[0]}">
      </div>
    `, async () => {
      const expense = {
        description: document.getElementById('exp-desc').value,
        category: document.getElementById('exp-category').value,
        amount: parseFloat(document.getElementById('exp-amount').value) || 0,
        date: document.getElementById('exp-date').value
      };
      
      if (!expense.description || !expense.amount) { Utils.showToast('Fill in all fields', 'warning'); return; }
      
      try {
        await API.post('/expenses', expense);
        Utils.showToast('Expense added!', 'success');
        await this.init();
      } catch (e) {
        Utils.showToast('Failed to add expense', 'error');
      }
    });
  },

  async delete(id) {
    if (confirm('Delete this expense?')) {
      try {
        await API.delete(`/expenses/${id}`);
        Utils.showToast('Expense deleted', 'info');
        await this.init();
      } catch (e) {
        Utils.showToast('Failed to delete expense', 'error');
      }
    }
  }
};
