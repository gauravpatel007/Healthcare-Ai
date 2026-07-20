/* ============================================
   LifeOS — Medicine Management Module
   ============================================ */

const Medicine = {
  async init() { 
    await this.render(); 
  },

  async render() {
    const container = document.getElementById('page-medicine');
    container.innerHTML = '<div class="empty-state"><span class="spinner"></span> Loading Medicines...</div>';

    try {
      const [meds, predictions] = await Promise.all([
        API.get('/medicines'),
        API.get('/medicines/refill-predictions')
      ]);

      container.innerHTML = `
        <div class="section-header" style="background: var(--bg-card); padding: 24px 32px; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 52px; height: 52px; background: rgba(37,99,235,0.08); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 20.5l-6-6a4.5 4.5 0 0 1 6.5-6.5l6 6a4.5 4.5 0 0 1-6.5 6.5z"></path><line x1="8.5" y1="8.5" x2="15.5" y2="15.5"></line></svg>
            </div>
            <div>
              <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0; font-family: 'Inter', sans-serif;">Medicine Management</h2>
              <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--success); box-shadow: 0 0 6px var(--success);"></span>
                ${meds.length} active medications
              </p>
            </div>
          </div>
          <div class="flex gap-md">
            <button class="btn btn-secondary" onclick="Medicine.checkInteractions()" style="font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 600; padding: 10px 18px; display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              Check Interactions
            </button>
            <button class="btn btn-primary" onclick="Medicine.showAddForm()" style="font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 600; padding: 10px 18px; display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              Add Medicine
            </button>
          </div>
        </div>

        <!-- Medicine Stats -->
        <div class="dashboard-stats" style="grid-template-columns: repeat(3, 1fr); margin-bottom: var(--space-xl);">
          <div class="stat-card">
            <div class="stat-icon purple">💊</div>
            <div class="stat-value">${meds.length}</div>
            <div class="stat-label">Active Medications</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">✅</div>
            <div class="stat-value">${meds.filter(m => m.remaining > 5).length}</div>
            <div class="stat-label">Well Stocked</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon coral">⚠️</div>
            <div class="stat-value">${meds.filter(m => m.remaining <= 5).length}</div>
            <div class="stat-label">Need Refill Soon</div>
          </div>
        </div>

        <!-- Medicine Cards -->
        <div class="medicine-grid">
          ${meds.length > 0 ? meds.map(m => this.renderMedicineCard(m)).join('') : `
            <div class="empty-state" style="grid-column:1/-1;">
              <div class="empty-icon">💊</div>
              <h3>No Medicines Added</h3>
              <p>Track your medications, set reminders, and never miss a dose.</p>
              <button class="btn btn-primary mt-md" onclick="Medicine.showAddForm()">+ Add Medicine</button>
            </div>
          `}
        </div>

        <!-- Refill Predictions -->
        ${predictions.length > 0 ? `
          <div class="section-header mt-xl">
            <h2>📦 Refill Predictions</h2>
          </div>
          <div class="glass-card no-hover">
            ${predictions.map(p => `
                <div class="list-item">
                  <div class="item-icon" style="background:rgba(108,92,231,0.15); color:var(--primary-light);">💊</div>
                  <div class="item-content">
                    <div class="item-title">${p.medicine_name}</div>
                    <div class="item-subtitle">${p.remaining}/${p.total_pills} pills remaining</div>
                    <div class="progress-bar mt-sm" style="max-width:300px;">
                      <div class="progress-fill ${p.percentage > 40 ? 'green' : p.percentage > 20 ? 'gold' : 'coral'}" style="width:${p.percentage}%"></div>
                    </div>
                  </div>
                  <span class="badge ${p.days_left > 10 ? 'badge-success' : p.days_left > 5 ? 'badge-warning' : 'badge-danger'}">
                    ~${p.days_left} days left
                  </span>
                </div>
            `).join('')}
          </div>
        ` : ''}
      `;
    } catch (e) {
      container.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${e.message}</p></div>`;
    }
  },

  renderMedicineCard(med) {
    const pct = med.remaining && med.total_pills ? (med.remaining / med.total_pills) * 100 : 100;
    const typeEmoji = { tablet: '💊', capsule: '🔵', syrup: '🧴', injection: '💉', drops: '💧', cream: '🧴' };

    return `
      <div class="medicine-card">
        <div class="med-header">
          <div>
            <div class="med-name">${typeEmoji[med.type] || '💊'} ${med.name}</div>
            <div class="med-dosage">${med.dosage} • ${med.type}</div>
          </div>
          <button class="btn btn-icon btn-secondary" onclick="Medicine.delete('${med.id}')">🗑</button>
        </div>
        <p style="font-size:0.8rem; color:var(--text-secondary); margin-bottom:12px;">${med.purpose}</p>
        <div class="flex justify-between items-center mb-sm">
          <span style="font-size:0.78rem; color:var(--text-muted);">📋 ${med.frequency.replace('_', ' ')}</span>
          <span class="badge ${pct > 40 ? 'badge-success' : pct > 20 ? 'badge-warning' : 'badge-danger'}">
            ${med.remaining || '?'} pills left
          </span>
        </div>
        <div class="med-schedule">
          ${(med.times || []).map(t => `<span class="med-time">🕐 ${Utils.formatTime(t)}</span>`).join('')}
        </div>
        ${med.start_date ? `<p style="font-size:0.72rem; color:var(--text-muted); margin-top:8px;">Started: ${Utils.formatDate(med.start_date)}</p>` : ''}
      </div>
    `;
  },

  showAddForm() {
    Utils.showModal('💊 Add Medicine', `
      <div class="grid-2 gap-md">
        <div class="form-group">
          <label class="form-label">Medicine Name</label>
          <input type="text" class="form-input" id="med-name" placeholder="e.g., Paracetamol">
        </div>
        <div class="form-group">
          <label class="form-label">Dosage</label>
          <input type="text" class="form-input" id="med-dosage" placeholder="e.g., 500mg">
        </div>
      </div>
      <div class="grid-2 gap-md">
        <div class="form-group">
          <label class="form-label">Type</label>
          <select class="form-select" id="med-type">
            <option value="tablet">Tablet</option><option value="capsule">Capsule</option><option value="syrup">Syrup</option>
            <option value="injection">Injection</option><option value="drops">Drops</option><option value="cream">Cream</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Frequency</label>
          <select class="form-select" id="med-frequency">
            <option value="once_daily">Once daily</option><option value="twice_daily">Twice daily</option>
            <option value="thrice_daily">Thrice daily</option><option value="once_weekly">Once weekly</option>
            <option value="as_needed">As needed</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Time(s)</label>
        <input type="time" class="form-input" id="med-time" value="08:00">
      </div>
      <div class="form-group">
        <label class="form-label">Purpose</label>
        <input type="text" class="form-input" id="med-purpose" placeholder="What is this medicine for?">
      </div>
      <div class="grid-2 gap-md">
        <div class="form-group">
          <label class="form-label">Total Pills</label>
          <input type="number" class="form-input" id="med-total" placeholder="30">
        </div>
        <div class="form-group">
          <label class="form-label">Remaining</label>
          <input type="number" class="form-input" id="med-remaining" placeholder="30">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Start Date</label>
        <input type="date" class="form-input" id="med-start" value="${new Date().toISOString().split('T')[0]}">
      </div>
    `, async () => {
      const med = {
        name: document.getElementById('med-name').value,
        dosage: document.getElementById('med-dosage').value,
        type: document.getElementById('med-type').value,
        frequency: document.getElementById('med-frequency').value,
        times: [document.getElementById('med-time').value],
        purpose: document.getElementById('med-purpose').value,
        total_pills: parseInt(document.getElementById('med-total').value) || 30,
        remaining: parseInt(document.getElementById('med-remaining').value) || 30,
        start_date: document.getElementById('med-start').value || null
      };
      
      if (!med.name) { Utils.showToast('Please enter medicine name', 'warning'); return; }
      
      try {
        await API.post('/medicines', med);
        Utils.showToast(`${med.name} added successfully!`, 'success');
        this.render();
      } catch (e) {
        Utils.showToast(e.message || 'Failed to add medicine', 'error');
      }
    });
  },

  async delete(id) {
    if (confirm('Remove this medicine?')) {
      try {
        await API.delete(`/medicines/${id}`);
        Utils.showToast('Medicine removed', 'info');
        this.render();
      } catch(e) {
        Utils.showToast(e.message, 'error');
      }
    }
  },

  async checkInteractions() {
    try {
      const res = await API.get('/medicines/interactions');
      const warnings = res.warnings || [];

      if (!res.has_interactions) {
        Utils.showModal('✅ Interaction Check', `
          <div style="text-align:center; padding:20px;">
            <div style="font-size:4rem; margin-bottom:16px;">✅</div>
            <h3 style="color:var(--success);">No Interactions Found</h3>
            <p style="color:var(--text-secondary); margin-top:8px;">Your current medications appear safe to take together.</p>
          </div>
        `);
      } else {
        Utils.showModal('⚠️ Interaction Warnings', `
          ${warnings.map(w => `
            <div style="background:rgba(255,107,107,0.1); border-radius:12px; padding:16px; margin-bottom:12px; border-left:3px solid var(--accent);">
              <h4 style="color:var(--accent); margin-bottom:4px;">⚠️ ${w.pair}</h4>
              <p style="font-size:0.85rem; color:var(--text-secondary);">${w.description}</p>
            </div>
          `).join('')}
          <p style="font-size:0.75rem; color:var(--text-muted); margin-top:12px;">⚕️ Always consult your healthcare provider for medical advice.</p>
        `);
      }
    } catch (e) {
      Utils.showToast('Failed to check interactions', 'error');
    }
  }
};
