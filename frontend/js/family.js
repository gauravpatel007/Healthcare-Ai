/* ============================================
   LifeOS — Family Management Module
   ============================================ */

const Family = {
  currentFamily: [],
  currentVaccinations: [],
  activeTab: 'members',

  async init() { 
    await this.fetchData();
    this.render(); 
  },

  async fetchData() {
    try {
      const [famRes, vaxRes] = await Promise.all([
        API.get('/family/members'),
        API.get('/family/vaccinations')
      ]);
      this.currentFamily = famRes;
      this.currentVaccinations = vaxRes;
    } catch (e) {
      console.error('Failed to fetch family data', e);
      this.currentFamily = [];
      this.currentVaccinations = [];
    }
  },

  render() {
    const family = this.currentFamily;
    const vaccinations = this.currentVaccinations;
    const container = document.getElementById('page-family');

    container.innerHTML = `
      <div class="section-header">
        <div>
          <h2>👨‍👩‍👧 Family Health Management</h2>
          <p class="section-subtitle">Monitor and manage your family's health</p>
        </div>
        <button class="btn btn-primary" onclick="Family.showAddForm()">+ Add Member</button>
      </div>

      <!-- Tabs -->
      <div class="tabs">
        <button class="tab ${this.activeTab === 'members' ? 'active' : ''}" onclick="Family.showTab('members')">👥 Members</button>
        <button class="tab ${this.activeTab === 'vaccinations' ? 'active' : ''}" onclick="Family.showTab('vaccinations')">💉 Vaccinations</button>
        <button class="tab ${this.activeTab === 'pregnancy' ? 'active' : ''}" onclick="Family.showTab('pregnancy')">🤰 Pregnancy Tracker</button>
      </div>

      <!-- Members Tab -->
      <div id="family-members" class="family-tab" style="${this.activeTab === 'members' ? 'display:block;' : 'display:none;'}">
        <div class="family-grid">
          ${family.length > 0 ? family.map(f => this.renderFamilyCard(f)).join('') : `
            <div class="empty-state" style="grid-column:1/-1;">
              <div class="empty-icon">👨‍👩‍👧</div>
              <h3>No Family Members</h3>
              <p>Add your family members to monitor their health and manage their records.</p>
              <button class="btn btn-primary mt-md" onclick="Family.showAddForm()">+ Add Member</button>
            </div>
          `}
        </div>
      </div>

      <!-- Vaccinations Tab -->
      <div id="family-vaccinations" class="family-tab" style="${this.activeTab === 'vaccinations' ? 'display:block;' : 'display:none;'}">
        <div class="flex justify-between items-center mb-lg">
          <h3>💉 Vaccination Tracker</h3>
          <button class="btn btn-primary btn-sm" onclick="Family.addVaccination()">+ Add Vaccination</button>
        </div>
        <div class="glass-card no-hover">
          ${vaccinations.length > 0 ? vaccinations.map(v => `
            <div class="list-item">
              <div class="item-icon" style="background:rgba(0,184,148,0.15); color:var(--success);">💉</div>
              <div class="item-content">
                <div class="item-title">${v.name}</div>
                <div class="item-subtitle">${v.person_name} • ${Utils.formatDate(v.date)}</div>
              </div>
              <span class="badge ${v.status === 'completed' ? 'badge-success' : 'badge-warning'}">
                ${v.status === 'completed' ? '✅ Done' : '⏳ Pending'}
              </span>
            </div>
          `).join('') : '<p class="text-center text-muted" style="padding:20px;">No vaccinations recorded</p>'}
        </div>

        <!-- Common Vaccination Schedule -->
        <h4 class="mt-xl mb-md">📋 Recommended Vaccination Schedule</h4>
        <div class="grid-2 gap-md">
          <div class="glass-card no-hover">
            <h4 style="margin-bottom:12px;">👶 Child Vaccines</h4>
            ${['BCG (Birth)', 'OPV (6 weeks)', 'DPT (6 weeks)', 'Hepatitis B (Birth)', 'MMR (9 months)', 'Varicella (15 months)'].map(v => `
              <div style="padding:6px 0; font-size:0.82rem; color:var(--text-secondary); border-bottom:1px solid rgba(255,255,255,0.03);">💉 ${v}</div>
            `).join('')}
          </div>
          <div class="glass-card no-hover">
            <h4 style="margin-bottom:12px;">👨‍🦳 Adult Vaccines</h4>
            ${['Flu Shot (Annual)', 'COVID-19 Booster', 'Tetanus (Every 10yr)', 'Hepatitis A&B', 'Pneumonia (65+)', 'Shingles (50+)'].map(v => `
              <div style="padding:6px 0; font-size:0.82rem; color:var(--text-secondary); border-bottom:1px solid rgba(255,255,255,0.03);">💉 ${v}</div>
            `).join('')}
          </div>
        </div>
      </div>

      <!-- Pregnancy Tab -->
      <div id="family-pregnancy" class="family-tab" style="${this.activeTab === 'pregnancy' ? 'display:block;' : 'display:none;'}">
        <div class="glass-card no-hover">
          <div style="text-align:center; padding:40px;">
            <div style="font-size:4rem; margin-bottom:16px;">🤰</div>
            <h3>Pregnancy Tracker</h3>
            <p style="color:var(--text-secondary); margin:12px 0;">Track weekly baby growth, appointments, and nutrition during pregnancy.</p>
            <button class="btn btn-primary mt-md" onclick="Family.startPregnancyTracker()">🤰 Start Tracking</button>
          </div>
        </div>

        <div id="pregnancy-content" style="display:none;">
          <div class="grid-3 gap-md mt-lg">
            ${this.getPregnancyWeeks().map(w => `
              <div class="glass-card" style="text-align:center;">
                <div style="font-size:1.5rem; margin-bottom:8px;">${w.emoji}</div>
                <h4>Week ${w.week}</h4>
                <p style="font-size:0.78rem; color:var(--text-secondary);">${w.description}</p>
                <p style="font-size:0.72rem; color:var(--text-muted); margin-top:4px;">Baby: ${w.size}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  },

  renderFamilyCard(member) {
    const avatarColors = {
      Father: 'linear-gradient(135deg, #6C5CE7, #4834d4)',
      Mother: 'linear-gradient(135deg, #e84393, #fd79a8)',
      Child: 'linear-gradient(135deg, #00D2D3, #00b5b6)',
      Grandparent: 'linear-gradient(135deg, #FDCB6E, #e17055)',
      Spouse: 'linear-gradient(135deg, #00B894, #00a085)',
      Sibling: 'linear-gradient(135deg, #74b9ff, #0984e3)'
    };

    return `
      <div class="family-card">
        <div class="family-avatar" style="background:${avatarColors[member.relation] || avatarColors.Child};">
          ${member.avatar || '👤'}
        </div>
        <div class="family-name">${member.name}</div>
        <div class="family-relation">${member.relation} • Age ${member.age}</div>
        <div class="flex justify-center gap-sm mb-md">
          <span class="badge badge-primary">${member.blood_type}</span>
        </div>
        ${(member.conditions || []).length > 0 ? `
          <div style="margin-bottom:12px;">
            <span style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">CONDITIONS:</span>
            <div style="margin-top:4px;">${member.conditions.map(c => `<span class="badge badge-warning" style="margin:2px;">${c}</span>`).join('')}</div>
          </div>
        ` : '<span class="badge badge-success">No Conditions</span>'}
        ${(member.medications || []).length > 0 ? `
          <div style="margin-top:12px;">
            <span style="font-size:0.7rem; color:var(--text-muted); font-weight:600;">MEDICATIONS:</span>
            <div style="margin-top:4px;">${member.medications.map(m => `<div style="font-size:0.78rem; color:var(--text-secondary); padding:2px 0;">💊 ${m}</div>`).join('')}</div>
          </div>
        ` : ''}
        <div class="flex justify-center gap-sm mt-md">
          <button class="btn btn-sm btn-secondary" onclick="Family.viewProfile('${member.id}')">View</button>
          <button class="btn btn-sm btn-danger" onclick="Family.deleteMember('${member.id}')">Remove</button>
        </div>
      </div>
    `;
  },

  showTab(tab) {
    this.activeTab = tab;
    document.querySelectorAll('.family-tab').forEach(t => t.style.display = 'none');
    document.querySelectorAll('#page-family .tab').forEach(t => t.classList.remove('active'));
    document.getElementById(`family-${tab}`).style.display = 'block';
    if(event) event.target.classList.add('active');
  },

  showAddForm() {
    Utils.showModal('👤 Add Family Member', `
      <div class="grid-2 gap-md">
        <div class="form-group">
          <label class="form-label">Name</label>
          <input type="text" class="form-input" id="fam-name" placeholder="Full name">
        </div>
        <div class="form-group">
          <label class="form-label">Relation</label>
          <select class="form-select" id="fam-relation">
            <option>Father</option><option>Mother</option><option>Spouse</option>
            <option>Child</option><option>Sibling</option><option>Grandparent</option>
          </select>
        </div>
      </div>
      <div class="grid-2 gap-md">
        <div class="form-group">
          <label class="form-label">Age</label>
          <input type="number" class="form-input" id="fam-age" placeholder="Age">
        </div>
        <div class="form-group">
          <label class="form-label">Blood Type</label>
          <select class="form-select" id="fam-blood">
            <option>A+</option><option>A-</option><option>B+</option><option>B-</option>
            <option>AB+</option><option>AB-</option><option>O+</option><option>O-</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Health Conditions (comma separated)</label>
        <input type="text" class="form-input" id="fam-conditions" placeholder="e.g., Diabetes, Hypertension">
      </div>
      <div class="form-group">
        <label class="form-label">Medications (comma separated)</label>
        <input type="text" class="form-input" id="fam-meds" placeholder="e.g., Metformin 500mg">
      </div>
    `, async () => {
      const avatars = { Father: '👨', Mother: '👩', Child: '👧', Spouse: '💑', Sibling: '👫', Grandparent: '👴' };
      const relation = document.getElementById('fam-relation').value;
      
      const member = {
        name: document.getElementById('fam-name').value,
        relation,
        age: parseInt(document.getElementById('fam-age').value) || 0,
        blood_type: document.getElementById('fam-blood').value,
        conditions: document.getElementById('fam-conditions').value.split(',').map(s => s.trim()).filter(s => s),
        medications: document.getElementById('fam-meds').value.split(',').map(s => s.trim()).filter(s => s),
        avatar: avatars[relation] || '👤'
      };
      
      if (!member.name) { Utils.showToast('Please enter a name', 'warning'); return; }
      
      try {
        await API.post('/family/members', member);
        Utils.showToast(`${member.name} added to family!`, 'success');
        await this.init();
      } catch (e) {
        Utils.showToast('Failed to add member', 'error');
      }
    });
  },

  async deleteMember(id) {
    if (confirm('Remove this family member?')) {
      try {
        await API.delete(`/family/members/${id}`);
        Utils.showToast('Family member removed', 'info');
        await this.init();
      } catch (e) {
        Utils.showToast('Failed to delete member', 'error');
      }
    }
  },

  viewProfile(id) {
    const member = this.currentFamily.find(f => f.id === id);
    if (!member) return;
    Utils.showModal(`${member.avatar} ${member.name}`, `
      <div style="text-align:center; margin-bottom:20px;">
        <div style="font-size:4rem;">${member.avatar}</div>
        <h3 style="margin-top:8px;">${member.name}</h3>
        <p style="color:var(--text-muted);">${member.relation} • Age ${member.age} • Blood: ${member.blood_type}</p>
      </div>
      <div class="grid-2 gap-md">
        <div class="glass-card">
          <h4 style="margin-bottom:8px;">🏥 Conditions</h4>
          ${member.conditions && member.conditions.length > 0 ? 
            member.conditions.map(c => `<div style="padding:4px 0; font-size:0.85rem;">• ${c}</div>`).join('') :
            '<p style="color:var(--text-muted); font-size:0.82rem;">No conditions</p>'}
        </div>
        <div class="glass-card">
          <h4 style="margin-bottom:8px;">💊 Medications</h4>
          ${member.medications && member.medications.length > 0 ?
            member.medications.map(m => `<div style="padding:4px 0; font-size:0.85rem;">• ${m}</div>`).join('') :
            '<p style="color:var(--text-muted); font-size:0.82rem;">No medications</p>'}
        </div>
      </div>
    `);
  },

  addVaccination() {
    Utils.showModal('💉 Add Vaccination', `
      <div class="form-group">
        <label class="form-label">Vaccine Name</label>
        <input type="text" class="form-input" id="vax-name" placeholder="e.g., COVID-19 Booster">
      </div>
      <div class="grid-2 gap-md">
        <div class="form-group">
          <label class="form-label">Date Given</label>
          <input type="date" class="form-input" id="vax-date" value="${new Date().toISOString().split('T')[0]}">
        </div>
        <div class="form-group">
          <label class="form-label">For</label>
          <select class="form-select" id="vax-person">
            <option>Self</option>
            ${this.currentFamily.map(f => `<option>${f.name}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Next Due Date (if applicable)</label>
        <input type="date" class="form-input" id="vax-next">
      </div>
    `, async () => {
      const vax = {
        name: document.getElementById('vax-name').value,
        date: document.getElementById('vax-date').value,
        person_name: document.getElementById('vax-person').value,
        status: 'completed'
      };
      
      try {
        await API.post('/family/vaccinations', vax);
        Utils.showToast('Vaccination recorded!', 'success');
        await this.init();
      } catch (e) {
        Utils.showToast('Failed to record vaccination', 'error');
      }
    });
  },

  startPregnancyTracker() {
    document.getElementById('pregnancy-content').style.display = 'block';
    event.target.style.display = 'none';
  },

  getPregnancyWeeks() {
    return [
      { week: 4, emoji: '🫘', description: 'Embryo forming', size: 'Poppy seed' },
      { week: 8, emoji: '🫐', description: 'Heart beating', size: 'Raspberry' },
      { week: 12, emoji: '🍋', description: 'First trimester end', size: 'Lime' },
      { week: 16, emoji: '🍐', description: 'Gender visible', size: 'Avocado' },
      { week: 20, emoji: '🍌', description: 'Halfway point!', size: 'Banana' },
      { week: 24, emoji: '🌽', description: 'Viability milestone', size: 'Corn' },
      { week: 28, emoji: '🥥', description: 'Third trimester', size: 'Coconut' },
      { week: 32, emoji: '🍍', description: 'Rapid growth', size: 'Pineapple' },
      { week: 36, emoji: '🍈', description: 'Almost ready!', size: 'Honeydew' },
      { week: 40, emoji: '🍉', description: 'Due date!', size: 'Watermelon' }
    ];
  }
};
