/* ============================================
   LifeOS — Appointment Manager
   ============================================ */

const Appointments = {
  async init() { 
    await this.render(); 
  },

  async render() {
    const container = document.getElementById('page-appointments');
    container.innerHTML = '<div class="empty-state"><span class="spinner"></span> Loading Appointments...</div>';

    try {
      const [apts, suggestions] = await Promise.all([
        API.get('/appointments'),
        API.get('/appointments/suggestions')
      ]);

      const upcoming = apts.filter(a => a.status === 'upcoming' && new Date(a.date) >= new Date(new Date().setHours(0,0,0,0)));
      const past = apts.filter(a => a.status !== 'upcoming' || new Date(a.date) < new Date(new Date().setHours(0,0,0,0)));

      // Update sidebar badge
      const badge = document.getElementById('appointment-badge');
      if (badge) {
        if (upcoming.length > 0) {
          badge.textContent = upcoming.length;
          badge.style.display = 'inline-block';
        } else {
          badge.style.display = 'none';
        }
      }

      container.innerHTML = `
        <div class="section-header" style="background: var(--bg-card); padding: 24px 32px; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
          <div style="display: flex; align-items: center; gap: 16px;">
            <div style="width: 52px; height: 52px; background: rgba(37,99,235,0.08); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </div>
            <div>
              <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0; font-family: 'Inter', sans-serif;">Appointment Manager</h2>
              <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
                <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--success); box-shadow: 0 0 6px var(--success);"></span>
                ${upcoming.length} upcoming appointments
              </p>
            </div>
          </div>
          <div class="flex gap-md">
            <button class="btn btn-primary" onclick="Appointments.showAddForm()" style="font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 600; padding: 10px 18px; display: flex; align-items: center; gap: 8px;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
              New Appointment
            </button>
          </div>
        </div>

        <!-- Stats -->
        <div class="dashboard-stats" style="grid-template-columns: repeat(3, 1fr); margin-bottom: var(--space-xl);">
          <div class="stat-card">
            <div class="stat-icon teal">📅</div>
            <div class="stat-value">${upcoming.length}</div>
            <div class="stat-label">Upcoming</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon green">✅</div>
            <div class="stat-value">${past.length}</div>
            <div class="stat-label">Completed</div>
          </div>
          <div class="stat-card">
            <div class="stat-icon purple">🏥</div>
            <div class="stat-value">${[...new Set(apts.map(a => a.hospital))].length}</div>
            <div class="stat-label">Hospitals</div>
          </div>
        </div>

        <!-- Upcoming -->
        <h3 style="margin-bottom: var(--space-md);">📌 Upcoming Appointments</h3>
        <div class="appointment-list mb-xl">
          ${upcoming.length > 0 ? upcoming.map(a => this.renderAppointment(a)).join('') : `
            <div class="glass-card" style="text-align:center; padding:40px;">
              <p style="color:var(--text-muted);">No upcoming appointments. Schedule one now!</p>
            </div>
          `}
        </div>

        <!-- Past -->
        ${past.length > 0 ? `
          <h3 style="margin-bottom: var(--space-md);">📋 Past Appointments</h3>
          <div class="appointment-list">
            ${past.map(a => this.renderAppointment(a, true)).join('')}
          </div>
        ` : ''}

        <!-- AI Suggestions -->
        <div class="glass-card no-hover mt-xl" style="border-left:3px solid var(--secondary);">
          <h4 style="margin-bottom:12px;">🤖 AI Appointment Suggestions</h4>
          ${suggestions.map(s => `
            <div class="list-item">
              <div class="item-icon" style="background:rgba(0,210,211,0.15); color:var(--secondary);">🤖</div>
              <div class="item-content">
                <div class="item-title">${s.text}</div>
                <div class="item-subtitle">${s.specialist}</div>
              </div>
              <span class="badge badge-${s.urgency.toLowerCase() === 'high' ? 'danger' : s.urgency.toLowerCase() === 'medium' ? 'warning' : 'info'}">${s.urgency}</span>
            </div>
          `).join('')}
        </div>
      `;
    } catch (e) {
      container.innerHTML = `<div class="empty-state"><h3>Error</h3><p>${e.message}</p></div>`;
    }
  },

  renderAppointment(apt, isPast = false) {
    const d = new Date(apt.date);
    const daysUntil = Utils.getDaysUntil(apt.date);

    return `
      <div class="glass-card" style="display:flex; align-items:center; gap:20px; ${isPast ? 'opacity:0.6;' : ''}">
        <div style="text-align:center; min-width:60px;">
          <div style="font-family:var(--font-heading); font-size:1.8rem; font-weight:800; color:var(--primary-light); line-height:1;">${d.getDate()}</div>
          <div style="font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">${d.toLocaleDateString('en',{month:'short',year:'numeric'})}</div>
        </div>
        <div style="width:1px; height:50px; background:var(--border-color);"></div>
        <div style="flex:1;">
          <div style="font-weight:700; font-size:0.95rem;">${apt.doctor}</div>
          <div style="font-size:0.8rem; color:var(--text-secondary);">${apt.specialty}</div>
          <div style="font-size:0.78rem; color:var(--text-muted); margin-top:4px;">🏥 ${apt.hospital} • 🕐 ${Utils.formatTime(apt.time)}</div>
          ${apt.notes ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:4px;">📝 ${apt.notes}</div>` : ''}
        </div>
        <div style="text-align:right;">
          ${!isPast ? `
            <span class="badge ${daysUntil <= 3 ? 'badge-warning' : 'badge-primary'}">${daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : daysUntil + ' days'}</span>
          ` : `<span class="badge badge-success">Completed</span>`}
          <div style="margin-top:8px;">
            ${!isPast ? `<button class="btn btn-sm btn-secondary" onclick="Appointments.markCompleted('${apt.id}')" style="margin-right:8px;">✔ Mark Done</button>` : ''}
            <button class="btn btn-sm btn-danger" onclick="Appointments.delete('${apt.id}')">${isPast ? 'Delete' : 'Cancel'}</button>
          </div>
        </div>
      </div>
    `;
  },

  showAddForm() {
    Utils.showModal('📅 New Appointment', `
      <div class="form-group">
        <label class="form-label">Doctor Name</label>
        <input type="text" class="form-input" id="apt-doctor" placeholder="Dr. Name">
      </div>
      <div class="grid-2 gap-md">
        <div class="form-group">
          <label class="form-label">Specialty</label>
          <select class="form-select" id="apt-specialty">
            <option>General Physician</option><option>Cardiologist</option><option>Pulmonologist</option>
            <option>Dermatologist</option><option>Orthopedic</option><option>ENT</option>
            <option>Ophthalmologist</option><option>Dentist</option><option>Neurologist</option>
            <option>Gynecologist</option><option>Pediatrician</option><option>Psychiatrist</option>
            <option>Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Hospital/Clinic</label>
          <input type="text" class="form-input" id="apt-hospital" placeholder="Hospital name">
        </div>
      </div>
      <div class="grid-2 gap-md">
        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" class="form-input" id="apt-date" min="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label class="form-label">Time</label>
          <input type="time" class="form-input" id="apt-time" value="10:00">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" id="apt-notes" placeholder="Reason for visit, things to discuss..."></textarea>
      </div>
    `, async () => {
      const apt = {
        doctor: document.getElementById('apt-doctor').value,
        specialty: document.getElementById('apt-specialty').value,
        hospital: document.getElementById('apt-hospital').value,
        date: document.getElementById('apt-date').value,
        time: document.getElementById('apt-time').value,
        notes: document.getElementById('apt-notes').value,
        status: 'upcoming'
      };
      if (!apt.doctor || !apt.date) { Utils.showToast('Please fill in doctor and date', 'warning'); return; }
      
      try {
        await API.post('/appointments', apt);
        Utils.showToast('Appointment scheduled!', 'success');
        this.render();
      } catch (e) {
        Utils.showToast('Failed to schedule appointment', 'error');
      }
    });
  },

  async markCompleted(id) {
    try {
      await API.put(`/appointments/${id}`, { status: 'completed' });
      Utils.showToast('Appointment marked as completed', 'success');
      this.render();
    } catch (e) {
      Utils.showToast('Failed to update appointment', 'error');
    }
  },

  async delete(id) {
    if (confirm('Cancel this appointment?')) {
      try {
        await API.delete(`/appointments/${id}`);
        Utils.showToast('Appointment cancelled', 'info');
        this.render();
      } catch (e) {
        Utils.showToast('Failed to cancel appointment', 'error');
      }
    }
  }
};
