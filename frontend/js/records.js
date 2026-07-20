/* ============================================
   LifeOS — Medical Records Vault
   ============================================ */

const Records = {
  currentRecords: [],
  currentCategory: 'All',

  async init() {
    await this.fetchRecords();
    this.render();
  },

  async fetchRecords() {
    try {
      this.currentRecords = await API.get('/records');
    } catch (e) {
      console.error('Failed to fetch records', e);
      this.currentRecords = [];
    }
  },

  render() {
    const categories = ['All', 'Blood Test', 'Imaging', 'Prescription', 'Surgery', 'Vaccination', 'Other'];
    const container = document.getElementById('page-records');

    container.innerHTML = `
      <div class="section-header" style="background: var(--bg-card); padding: 24px 32px; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 52px; height: 52px; background: rgba(37,99,235,0.08); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
          </div>
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0; font-family: 'Inter', sans-serif;">Medical Records Vault</h2>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--success); box-shadow: 0 0 6px var(--success);"></span>
              ${this.currentRecords.length} records stored securely
            </p>
          </div>
        </div>
        <div class="flex gap-md">
          <button class="btn btn-secondary" onclick="Records.compareReports()" style="font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 600; padding: 10px 18px; display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            Compare Reports
          </button>
          <button class="btn btn-secondary" onclick="Records.showAIUpload()" style="font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 600; padding: 10px 18px; display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            AI Upload Report
          </button>
          <button class="btn btn-primary" onclick="Records.showAddForm()" style="font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 600; padding: 10px 18px; display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Record
          </button>
        </div>
      </div>

      <!-- Category Tabs -->
      <div class="tabs">
        ${categories.map(c => `
          <button class="tab ${c === this.currentCategory ? 'active' : ''}" onclick="Records.filterCategory('${c}')">${c}</button>
        `).join('')}
      </div>

      <!-- Search -->
      <div class="form-group" style="margin-bottom: var(--space-lg);">
        <input type="text" class="form-input" placeholder="🔍 Search records by title, doctor, hospital..." 
               oninput="Records.search(this.value)" id="records-search">
      </div>

      <!-- Records Grid -->
      <div class="records-grid" id="records-grid">
        ${this.currentRecords.length > 0 ? this.currentRecords.map(r => this.renderRecordCard(r)).join('') : `
          <div class="empty-state" style="grid-column: 1/-1;">
            <div class="empty-icon">📋</div>
            <h3>No Records Yet</h3>
            <p>Upload your medical reports, prescriptions, and scans to keep them organized and accessible.</p>
            <button class="btn btn-primary mt-md" onclick="Records.showAddForm()">+ Add Your First Record</button>
          </div>
        `}
      </div>
    `;

    // Apply initial filter if not 'All'
    if (this.currentCategory !== 'All') {
      this.applyFilter();
    }
  },

  renderRecordCard(record) {
    const categoryIcons = {
      'Blood Test': '🩸', 'Imaging': '🔬', 'Prescription': '💊',
      'Surgery': '🏥', 'Vaccination': '💉', 'Other': '📋'
    };

    return `
      <div class="glass-card record-card" data-category="${record.category}" data-id="${record.id}" style="display: flex; flex-direction: column; padding: 24px; transition: transform 0.2s, box-shadow 0.2s;">
        
        <!-- Header -->
        <div class="flex justify-between items-start mb-md">
          <div class="flex items-center gap-md">
            <div style="font-size: 1.8rem; background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15)); width: 54px; height: 54px; border-radius: 16px; display: flex; align-items: center; justify-content: center;">
              ${categoryIcons[record.category] || '📋'}
            </div>
            <div>
              <span class="badge badge-primary" style="margin-bottom: 6px; display: inline-block;">${record.category}</span>
              <div style="font-size:0.75rem; color:var(--text-muted); display:flex; align-items:center; gap:4px; font-weight:500;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                ${record.date ? Utils.formatDate(record.date) : 'No date recorded'}
              </div>
            </div>
          </div>
          <div class="flex gap-xs" style="align-items:center;">
            <button onclick="Records.edit('${record.id}')" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:1.1rem; padding:4px; opacity:0.6; transition:all 0.2s;" onmouseover="this.style.opacity='1'; this.style.color='var(--primary)';" onmouseout="this.style.opacity='0.6'; this.style.color='var(--text-muted)';" title="Edit Record">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
            </button>
            <button onclick="Records.delete('${record.id}')" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:1.1rem; padding:4px; opacity:0.6; transition:all 0.2s;" onmouseover="this.style.opacity='1'; this.style.color='var(--danger)';" onmouseout="this.style.opacity='0.6'; this.style.color='var(--text-muted)';" title="Delete Record">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div style="flex-grow: 1; margin-bottom: 20px; margin-top: 8px;">
          <h4 style="font-size:1.15rem; font-weight:700; margin-bottom: 12px; color:var(--text-primary); line-height:1.4;">${record.title}</h4>
          
          <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px; font-size:0.85rem; color:var(--text-secondary); margin-bottom: 16px;">
             <span style="display:flex; align-items:center; gap:4px; background:var(--bg-primary); padding:4px 8px; border-radius:6px;">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> 
               ${record.doctor || 'Unknown Doctor'}
             </span>
             <span style="display:flex; align-items:center; gap:4px; background:var(--bg-primary); padding:4px 8px; border-radius:6px;">
               <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> 
               ${record.hospital || 'Unknown Hospital'}
             </span>
          </div>

          <div style="background: rgba(99,102,241,0.04); padding: 14px 16px; border-radius: 10px; border-left: 4px solid var(--primary); font-size: 0.88rem; color: var(--text-primary); line-height: 1.6; font-style: italic;">
            "${record.findings ? record.findings.substring(0, 100) + (record.findings.length > 100 ? '...' : '') : 'No findings recorded for this document.'}"
          </div>
        </div>

        <!-- Footer Actions -->
        <div class="flex gap-sm" style="margin-top:auto; flex-wrap: wrap;">
          ${record.file_path ? `
            <a href="${API.BASE_URL.replace('/api/v1', '')}/uploads/${record.file_path}" target="_blank" class="btn btn-primary" style="flex: 1; text-decoration:none; display:flex; align-items:center; justify-content:center; gap:8px; padding: 10px; font-weight:600; font-size:0.9rem;">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
              View PDF
            </a>
          ` : ''}
          <button class="btn btn-secondary" onclick="Records.summarize('${record.id}')" style="flex: 1; display:flex; align-items:center; justify-content:center; gap:8px; padding: 10px; font-weight:600; font-size:0.9rem; background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1)); color: var(--primary); border: 1px solid rgba(99,102,241,0.2);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h2a2 2 0 0 1 2 2v2h1a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1v2a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-2H6a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1V9a2 2 0 0 1 2-2h2V5.73A2 2 0 0 1 12 2z"></path><line x1="9" y1="13" x2="9.01" y2="13"></line><line x1="15" y1="13" x2="15.01" y2="13"></line></svg>
            AI Summary
          </button>
        </div>
      </div>
    `;
  },

  showAddForm() {
    Utils.showModal('📄 Add Medical Record', `
      <div class="form-group">
        <label class="form-label">Report Title</label>
        <input type="text" class="form-input" id="record-title" placeholder="e.g., Complete Blood Count">
      </div>
      <div class="grid-2 gap-md">
        <div class="form-group">
          <label class="form-label">Category</label>
          <select class="form-select" id="record-category">
            <option value="Blood Test">Blood Test</option>
            <option value="Imaging">Imaging</option>
            <option value="Prescription">Prescription</option>
            <option value="Surgery">Surgery</option>
            <option value="Vaccination">Vaccination</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Date</label>
          <input type="date" class="form-input" id="record-date" value="${new Date().toISOString().split('T')[0]}">
        </div>
      </div>
      <div class="grid-2 gap-md">
        <div class="form-group">
          <label class="form-label">Doctor</label>
          <input type="text" class="form-input" id="record-doctor" placeholder="Dr. Name">
        </div>
        <div class="form-group">
          <label class="form-label">Hospital/Lab</label>
          <input type="text" class="form-input" id="record-hospital" placeholder="Hospital name">
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Key Findings</label>
        <textarea class="form-textarea" id="record-findings" placeholder="Enter key findings, test results..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Notes</label>
        <textarea class="form-textarea" id="record-notes" placeholder="Additional notes..."></textarea>
      </div>
      <div class="form-group">
        <label class="form-label">Upload File (Supported)</label>
        <input type="file" class="form-input" id="record-file" accept="image/*,.pdf">
        <p style="font-size:0.72rem; color:var(--text-muted); margin-top:4px;">File will be uploaded to the secure backend vault.</p>
      </div>
    `, async () => {
      const title = document.getElementById('record-title').value;
      if (!title) { Utils.showToast('Please enter a title', 'warning'); return; }

      const formData = new FormData();
      formData.append('title', title);
      formData.append('category', document.getElementById('record-category').value);
      formData.append('date', document.getElementById('record-date').value);
      formData.append('doctor', document.getElementById('record-doctor').value);
      formData.append('hospital', document.getElementById('record-hospital').value);
      formData.append('findings', document.getElementById('record-findings').value);
      formData.append('notes', document.getElementById('record-notes').value);

      const fileInput = document.getElementById('record-file');
      if (fileInput.files.length > 0) {
        formData.append('file', fileInput.files[0]);
      }

      try {
        await API.upload('/records', formData);
        Utils.showToast('Record added successfully!', 'success');
        await this.init();
      } catch (e) {
        Utils.showToast(e.message || 'Failed to add record', 'error');
      }
    });
  },

  filterCategory(category) {
    this.currentCategory = category;
    document.querySelectorAll('#page-records .tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    this.applyFilter();
  },

  applyFilter() {
    document.querySelectorAll('.record-card').forEach(card => {
      if (this.currentCategory === 'All' || card.dataset.category === this.currentCategory) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  },

  search(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('.record-card').forEach(card => {
      const text = card.textContent.toLowerCase();
      card.style.display = text.includes(q) ? '' : 'none';
    });
  },

  edit(id) {
    const record = this.currentRecords.find(r => r.id === id);
    if (!record) return;

    Utils.showModal('✏️ Edit Medical Record', `
      <div class="form-group">
        <label class="form-label">Report Title</label>
        <input type="text" class="form-input" id="edit-record-title" value="${record.title}">
      </div>
      <div class="form-group">
        <label class="form-label">Category</label>
        <select class="form-select" id="edit-record-category">
          <option value="Blood Test" ${record.category === 'Blood Test' ? 'selected' : ''}>Blood Test</option>
          <option value="Imaging" ${record.category === 'Imaging' ? 'selected' : ''}>Imaging</option>
          <option value="Prescription" ${record.category === 'Prescription' ? 'selected' : ''}>Prescription</option>
          <option value="Surgery" ${record.category === 'Surgery' ? 'selected' : ''}>Surgery</option>
          <option value="Vaccination" ${record.category === 'Vaccination' ? 'selected' : ''}>Vaccination</option>
          <option value="Other" ${record.category === 'Other' ? 'selected' : ''}>Other</option>
        </select>
      </div>
    `, async () => {
      const title = document.getElementById('edit-record-title').value;
      const category = document.getElementById('edit-record-category').value;
      
      if (!title) { Utils.showToast('Please enter a title', 'warning'); return; }
      
      try {
        await API.put(`/records/${id}`, { title, category });
        Utils.showToast('Record updated successfully!', 'success');
        await this.init();
      } catch (e) {
        Utils.showToast(e.message || 'Failed to update record', 'error');
      }
    });
  },

  async delete(id) {
    if (confirm('Delete this record?')) {
      try {
        await API.delete(`/records/${id}`);
        Utils.showToast('Record deleted', 'info');
        await this.init();
      } catch (e) {
        Utils.showToast(e.message || 'Failed to delete record', 'error');
      }
    }
  },

  async summarize(id) {
    const record = this.currentRecords.find(r => r.id === id);
    if (!record) return;

    Utils.showToast('Generating AI Summary...', 'info');

    try {
      const res = await API.post(`/records/${id}/ai-summary`);
      
      Utils.showModal('🤖 AI Report Summary', `
        <div style="background:rgba(108,92,231,0.1); border-radius:12px; padding:20px; border-left:3px solid var(--primary);">
          <p style="font-size:0.72rem; color:var(--secondary); font-weight:700; margin-bottom:8px;">🤖 AI-GENERATED SUMMARY</p>
          <div class="ai-markdown-content" style="font-size:0.9rem; color:var(--text-primary); line-height:1.7;">
            ${typeof marked !== 'undefined' ? marked.parse(res.summary) : res.summary.replace(/\n/g, '<br>')}
          </div>
        </div>
        <div style="margin-top:16px; padding:12px; background:rgba(253,203,110,0.1); border-radius:8px;">
          <p style="font-size:0.75rem; color:var(--warning);">⚠️ ${res.disclaimer}</p>
        </div>
      `);
    } catch (e) {
      Utils.showToast('Failed to generate summary', 'error');
    }
  },

  async compareReports() {
    const bloodTests = this.currentRecords.filter(r => r.category === 'Blood Test');
    if (bloodTests.length < 2) {
      Utils.showToast('Need at least 2 blood test records to compare', 'warning');
      return;
    }

    const r1 = bloodTests[0], r2 = bloodTests[1];
    Utils.showToast('Comparing records using AI...', 'info');

    try {
      const res = await API.post('/records/compare', {
        record_id_1: r1.id,
        record_id_2: r2.id
      });

      Utils.showModal('📊 AI Report Comparison', `
        <div class="grid-2 gap-md">
          <div class="glass-card" style="text-align:center;">
            <p style="font-size:0.72rem; color:var(--text-muted);">📅 ${Utils.formatDate(res.record_1.date)}</p>
            <h4 style="margin:8px 0;">${res.record_1.title}</h4>
            <p style="font-size:0.82rem; color:var(--text-secondary);">${res.record_1.findings || 'No data'}</p>
          </div>
          <div class="glass-card" style="text-align:center;">
            <p style="font-size:0.72rem; color:var(--text-muted);">📅 ${Utils.formatDate(res.record_2.date)}</p>
            <h4 style="margin:8px 0;">${res.record_2.title}</h4>
            <p style="font-size:0.82rem; color:var(--text-secondary);">${res.record_2.findings || 'No data'}</p>
          </div>
        </div>
        <div style="margin-top:16px; padding:16px; background:rgba(0,184,148,0.1); border-radius:12px; border-left:3px solid var(--success);">
          <p style="font-size:0.72rem; color:var(--success); font-weight:700; margin-bottom:8px;">🤖 AI COMPARISON</p>
          <div class="ai-markdown-content" style="font-size:0.85rem; color:var(--text-primary); line-height:1.6;">
            ${typeof marked !== 'undefined' ? marked.parse(res.comparison) : res.comparison.replace(/\n/g, '<br>')}
          </div>
        </div>
      `);
    } catch (e) {
      Utils.showToast('Failed to compare records', 'error');
    }
  },

  showAIUpload() {
    Utils.showModal('🤖 AI Report Parser', `
      <div style="text-align:center; padding: 10px 0;">
        <div style="font-size: 3rem; margin-bottom: 12px;">📄</div>
        <h3 style="margin-bottom: 8px;">Upload Your Lab Report</h3>
        <p style="color: var(--text-muted); font-size: 0.85rem; margin-bottom: 24px;">
          Upload a PDF of your blood test or lab report. Our AI will automatically extract
          key health metrics like Hemoglobin, Blood Sugar, Cholesterol, and more.
        </p>
        <div id="ai-upload-dropzone" style="border: 2px dashed var(--border-light); border-radius: 16px; padding: 40px 20px; cursor: pointer; transition: all 0.3s; background: var(--bg-primary);"
             onclick="document.getElementById('ai-report-file').click()"
             ondragover="event.preventDefault(); this.style.borderColor='var(--primary)'; this.style.background='rgba(99,102,241,0.05)';"
             ondragleave="this.style.borderColor='var(--border-light)'; this.style.background='var(--bg-primary)';"
             ondrop="event.preventDefault(); this.style.borderColor='var(--border-light)'; document.getElementById('ai-report-file').files = event.dataTransfer.files; Records.handleAIUpload();">
          <div style="font-size: 2rem; margin-bottom: 8px;">⬆️</div>
          <p style="font-weight: 600; margin-bottom: 4px;">Click to select or drag & drop</p>
          <p style="font-size: 0.75rem; color: var(--text-muted);">PDF files only · Max 10MB</p>
        </div>
        <input type="file" id="ai-report-file" accept=".pdf" style="display:none;" onchange="Records.handleAIUpload()">
        <div id="ai-upload-status" style="margin-top: 20px;"></div>
      </div>
    `);
  },

  async handleAIUpload() {
    const fileInput = document.getElementById('ai-report-file');
    const statusDiv = document.getElementById('ai-upload-status');
    if (!fileInput || !fileInput.files.length) return;

    const file = fileInput.files[0];
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      Utils.showToast('Please select a PDF file', 'warning');
      return;
    }

    // Show processing animation
    statusDiv.innerHTML = `
      <div style="padding: 20px; background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1)); border-radius: 16px; text-align: center;">
        <div class="spinner" style="margin: 0 auto 12px;"></div>
        <p style="font-weight: 600; margin-bottom: 4px;">🤖 AI is analyzing your report...</p>
        <p style="font-size: 0.78rem; color: var(--text-muted);">Extracting health metrics from <strong>${file.name}</strong></p>
      </div>
    `;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await API.upload('/records/upload-ai', formData);

      if (res.success) {
        const metricsCount = res.metrics_extracted || 0;
        const metrics = res.metrics || {};
        const metricRows = Object.entries(metrics).map(([key, val]) =>
          `<div style="display:flex; justify-content:space-between; padding:10px 0; border-bottom:1px solid var(--border-light);">
            <span style="font-weight:500;">${key}</span>
            <span style="font-weight:700; color: var(--primary);">${val}</span>
          </div>`
        ).join('');

        statusDiv.innerHTML = `
          <div style="padding: 20px; background: rgba(0,184,148,0.1); border-radius: 16px; border-left: 3px solid var(--success);">
            <p style="font-weight: 700; color: var(--success); margin-bottom: 8px;">✅ ${res.message}</p>
            ${metricsCount > 0 ? `
              <div style="margin-top: 12px; max-height: 300px; overflow-y: auto;">
                ${metricRows}
              </div>
              <p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 12px;">
                ${res.health_entries_created || 0} health entries saved to your dashboard.
              </p>
            ` : '<p style="font-size:0.85rem; color:var(--text-muted);">No metrics could be extracted. The report has been saved as a record.</p>'}
          </div>
        `;

        Utils.showToast(`${metricsCount} metrics extracted from your report!`, 'success');
        // Refresh records list in the background
        await this.fetchRecords();
        this.render();
      } else {
        statusDiv.innerHTML = `
          <div style="padding: 16px; background: rgba(231,76,60,0.1); border-radius: 12px; border-left: 3px solid var(--danger);">
            <p style="font-weight: 600; color: var(--danger);">❌ ${res.error || 'Something went wrong.'}</p>
          </div>
        `;
      }
    } catch (e) {
      statusDiv.innerHTML = `
        <div style="padding: 16px; background: rgba(231,76,60,0.1); border-radius: 12px; border-left: 3px solid var(--danger);">
          <p style="font-weight: 600; color: var(--danger);">❌ ${e.message || 'Upload failed. Please try again.'}</p>
        </div>
      `;
    }
  }
};
