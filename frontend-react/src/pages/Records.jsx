import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import editIcon from '../../../Icons/edit sign.png';

const Records = ({ voiceAction, onVoiceActionConsumed }) => {
  useEffect(() => {
    const appContainer = document.querySelector('.app-container');
    const rightPanel = document.querySelector('.right-panel');
    if (appContainer && rightPanel) {
      appContainer.style.gridTemplateColumns = 'var(--sidebar-width) 1fr';
      rightPanel.style.display = 'none';
    }
    return () => {
      if (appContainer && rightPanel) {
        appContainer.style.gridTemplateColumns = 'var(--sidebar-width) 1fr var(--right-panel-width)';
        rightPanel.style.display = 'flex';
      }
    };
  }, []);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  
  const [newRecord, setNewRecord] = useState({
    title: '',
    category: 'Blood Test',
    date: new Date().toISOString().split('T')[0],
    doctor: '',
    hospital: '',
    findings: '',
    family_member_id: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCompare, setShowCompare] = useState(false);
  const [showAIUpload, setShowAIUpload] = useState(false);
  const [aiUploadStatus, setAiUploadStatus] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryResult, setSummaryResult] = useState(null);

  // Listen for voice actions
  useEffect(() => {
    const handleVoice = async () => {
      if (voiceAction && voiceAction.target_feature === 'records') {
        if (voiceAction.action_name === 'open_add_modal') {
          setShowAddForm(true);
        } else if (voiceAction.action_name === 'compare_reports') {
          setCompareMode(true);
          alert('Compare mode enabled! Select 2 records to compare.');
        } else if (voiceAction.action_name === 'ai_summary' && voiceAction.data?.record_name) {
          const target = records.find(r => 
            r.title.toLowerCase().includes(voiceAction.data.record_name.toLowerCase())
          );
          if (target) {
            try {
              const res = await API.get(`/records/${target.id}/summary`);
              setSummaryResult(res);
              setShowSummary(true);
            } catch(e) {
              alert(`AI Summary for "${target.title}": Feature in progress.`);
            }
          } else {
            alert(`Could not find a record matching "${voiceAction.data.record_name}"`);
          }
        }
        if (onVoiceActionConsumed) onVoiceActionConsumed();
      }
    };
    handleVoice();
  }, [voiceAction, records]);

  const categories = ['All', 'Blood Test', 'Imaging', 'Prescription', 'Surgery', 'Vaccination', 'Other'];

  const categoryIcons = {
    'Blood Test': '🩸', 'Imaging': '🔬', 'Prescription': '💊',
    'Surgery': '🏥', 'Vaccination': '💉', 'Other': '📋'
  };

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const data = await API.request('/records');
        setRecords(data);
        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    };
    fetchRecords();
  }, []);

  const filteredRecords = records.filter(r => {
    if (category !== 'All' && r.category !== category) return false;
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !(r.doctor || '').toLowerCase().includes(searchQuery.toLowerCase()) && 
        !(r.hospital || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const toggleCompareSelection = (record) => {
    if (selectedForCompare.find(r => r.id === record.id)) {
      setSelectedForCompare(selectedForCompare.filter(r => r.id !== record.id));
    } else {
      if (selectedForCompare.length >= 2) {
        alert('You can only compare 2 reports at a time.');
        return;
      }
      setSelectedForCompare([...selectedForCompare, record]);
    }
  };

  const handleCompareReports = async () => {
    if (!compareMode) {
      setCompareMode(true);
      setSelectedForCompare([]);
      return;
    }

    if (selectedForCompare.length !== 2) {
      alert('Please select exactly 2 records to compare');
      return;
    }

    const [r1, r2] = selectedForCompare;
    setShowCompare(true);
    setCompareResult({ type: 'loading' });
    setCompareMode(false);
    setSelectedForCompare([]);

    try {
      const res = await API.request('/records/compare', {
        method: 'POST',
        body: { record_id_1: r1.id, record_id_2: r2.id }
      });
      setCompareResult({ type: 'success', data: res });
    } catch (e) {
      setCompareResult({ type: 'error', message: 'Failed to compare records' });
    }
  };

  const handleAISummary = async (record) => {
    setShowSummary(true);
    setSummaryResult({ type: 'loading', recordTitle: record.title });
    try {
      const res = await API.request(`/records/${record.id}/ai-summary`, { method: 'POST' });
      setSummaryResult({ type: 'success', data: res, recordTitle: record.title });
    } catch (e) {
      setSummaryResult({ type: 'error', message: 'Failed to generate summary', recordTitle: record.title });
    }
  };

  const deleteRecord = async (id) => {
    if (window.confirm('Delete this record?')) {
      try {
        await API.delete(`/records/${id}`);
        setRecords(records.filter(r => r.id !== id));
      } catch (e) {
        alert('Failed to delete record');
      }
    }
  };

  const openEditModal = (record) => {
    setEditRecord({ ...record });
    setShowEditForm(true);
  };

  const handleUpdateRecord = async () => {
    if (!editRecord.title || !editRecord.category || !editRecord.date) {
      alert('Title, Category, and Date are required');
      return;
    }
    try {
      const updated = await API.request(`/records/${editRecord.id}`, {
        method: 'PUT',
        body: editRecord
      });
      setRecords(records.map(r => r.id === updated.id ? updated : r));
      setShowEditForm(false);
      setEditRecord(null);
    } catch (e) {
      alert(`Failed to update. Date sent: ${editRecord.date}. Error: ${e.message}`);
    }
  };

  const handleSaveRecord = async () => {
    if (!newRecord.title || !newRecord.category || !newRecord.date) {
      alert('Title, Category, and Date are required');
      return;
    }
    const formData = new FormData();
    formData.append('title', newRecord.title);
    formData.append('category', newRecord.category);
    formData.append('date', newRecord.date);
    if (newRecord.doctor) formData.append('doctor', newRecord.doctor);
    if (newRecord.hospital) formData.append('hospital', newRecord.hospital);
    if (newRecord.findings) formData.append('findings', newRecord.findings);
    if (selectedFile) formData.append('file', selectedFile);

    try {
      const added = await API.request('/records', {
        method: 'POST',
        body: formData
      });
      setRecords([...records, added]);
      setShowAddForm(false);
      setNewRecord({ title: '', category: 'Blood Test', date: new Date().toISOString().split('T')[0], doctor: '', hospital: '', findings: '' });
      setSelectedFile(null);
    } catch (e) {
      alert('Failed to upload record');
    }
  };

  if (loading) return <div className="empty-state"><span className="spinner"></span> Loading Records...</div>;

  return (
    <div className="page-section active">
      <div className="section-header" style={{ background: 'var(--bg-card)', padding: '24px 32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', background: 'rgba(37,99,235,0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', fontFamily: "'Inter', sans-serif" }}>Medical Records Vault</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }}></span>
              {records.length} records stored securely
            </p>
          </div>
        </div>
        <div className="flex gap-md">
          {compareMode && (
             <button className="btn btn-secondary" onClick={() => { setCompareMode(false); setSelectedForCompare([]); }} style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 600, padding: '10px 18px' }}>
               Cancel
             </button>
          )}
          <button className={compareMode ? "btn btn-primary" : "btn btn-secondary"} onClick={handleCompareReports} style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 600, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
            {compareMode ? `Compare (${selectedForCompare.length}/2)` : 'Compare Reports'}
          </button>
          <button className="btn btn-secondary" onClick={() => setShowAIUpload(true)} style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 600, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
            AI Upload Report
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)} style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 600, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Record
          </button>
        </div>
      </div>
      <div className="tabs" style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
        {categories.map(c => (
          <button key={c} className={`tab ${category === c ? 'active' : ''}`} onClick={() => setCategory(c)} style={{ padding: '8px 16px', borderRadius: '12px', background: category === c ? 'var(--primary)' : 'var(--bg-secondary)', color: category === c ? 'white' : 'var(--text-primary)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>{c}</button>
        ))}
      </div>

      <div className="filters-row" style={{ display: 'flex', gap: '16px', marginBottom: 'var(--space-lg)', flexWrap: 'wrap' }}>
        <div className="form-group" style={{ flex: 1, minWidth: '250px' }}>
          <input type="text" className="form-input" placeholder="🔍 Search records by title, doctor, hospital..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
        </div>
      </div>

      <div className="records-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
        {filteredRecords.length > 0 ? filteredRecords.map(r => (
          <div key={r.id} className="glass-card record-card" style={{ display: 'flex', flexDirection: 'column', padding: '24px', transition: 'transform 0.2s, box-shadow 0.2s' }}>
            <div className="flex justify-between items-start mb-md" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div className="flex items-center gap-md" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ fontSize: '1.8rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15))', width: '54px', height: '54px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {categoryIcons[r.category] || '📋'}
                </div>
                <div>
                  <span className="badge badge-primary" style={{ marginBottom: '6px', display: 'inline-block', background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>{r.category}</span>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
                    {r.date}
                  </div>
                </div>
                {compareMode && (
                  <input type="checkbox" checked={!!selectedForCompare.find(s => s.id === r.id)} onChange={() => toggleCompareSelection(r)} style={{ width: '20px', height: '20px', cursor: 'pointer' }} />
                )}
              </div>
              <div className="flex gap-xs" style={{ alignItems: 'center', gap: '12px' }}>
                <button onClick={() => openEditModal(r)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '4px', opacity: 0.6 }} title="Edit Record">
                  <img src={editIcon} alt="Edit" style={{ width: '22px', height: '22px', filter: 'var(--icon-filter, none)' }} />
                </button>
                <button onClick={() => deleteRecord(r.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '4px', opacity: 0.6 }} title="Delete Record">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>

            <div style={{ flexGrow: 1, marginBottom: '20px', marginTop: '8px' }}>
              <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '12px', color: 'var(--text-primary)', lineHeight: 1.4 }}>{r.title}</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                 <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: '6px' }}>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg> 
                   {r.doctor}
                 </span>
                 <span style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: '6px' }}>
                   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg> 
                   {r.hospital}
                 </span>
              </div>
              <div style={{ background: 'rgba(99,102,241,0.04)', padding: '14px 16px', borderRadius: '10px', borderLeft: '4px solid var(--primary)', fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.6, fontStyle: 'italic' }}>
                "{r.findings}"
              </div>
            </div>

            <div className="flex gap-sm" style={{ marginTop: 'auto', flexWrap: 'wrap', display: 'flex', gap: '8px' }}>
              <button className="btn btn-secondary" onClick={() => handleAISummary(r)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px', fontWeight: 600, fontSize: '0.9rem', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))', color: 'var(--primary)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', cursor: 'pointer' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h2a2 2 0 0 1 2 2v2h1a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-1v2a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-2H6a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h1V9a2 2 0 0 1 2-2h2V5.73A2 2 0 0 1 12 2z"></path><line x1="9" y1="13" x2="9.01" y2="13"></line><line x1="15" y1="13" x2="15.01" y2="13"></line></svg>
                AI Summary
              </button>
            </div>
          </div>
        )) : (
          <div className="empty-state" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div className="empty-icon" style={{ fontSize: '3rem', marginBottom: '16px' }}>📋</div>
            <h3>No Records Yet</h3>
            <p style={{ color: 'var(--text-muted)' }}>Upload your medical reports, prescriptions, and scans to keep them organized and accessible.</p>
            <button className="btn btn-primary mt-md" onClick={() => setShowAddForm(true)} style={{ marginTop: '16px', background: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>+ Add Your First Record</button>
          </div>
        )}
      </div>

      {/* Add Record Modal */}
      {showAddForm && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="modal-content" style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '500px' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.5rem', marginBottom: '24px' }}>Add Medical Record</h3>
            <div className="form-group mb-md">
              <label>Title</label>
              <input type="text" className="form-input" value={newRecord.title} onChange={e => setNewRecord({...newRecord, title: e.target.value})} placeholder="e.g. Annual Blood Test" />
            </div>
            <div className="form-group mb-md" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label>Category</label>
                <select className="form-select" value={newRecord.category} onChange={e => setNewRecord({...newRecord, category: e.target.value})}>
                  {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label>Date</label>
                <input type="date" className="form-input" value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})} />
              </div>
            </div>
            <div className="form-group mb-md" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label>Doctor (Optional)</label>
                <input type="text" className="form-input" value={newRecord.doctor} onChange={e => setNewRecord({...newRecord, doctor: e.target.value})} placeholder="Dr. Smith" />
              </div>
              <div>
                <label>Hospital (Optional)</label>
                <input type="text" className="form-input" value={newRecord.hospital} onChange={e => setNewRecord({...newRecord, hospital: e.target.value})} placeholder="City Clinic" />
              </div>
            </div>
            <div className="form-group mb-lg">
              <label>Upload Document (PDF/Image)</label>
              <input type="file" className="form-input" onChange={e => setSelectedFile(e.target.files[0])} />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveRecord}>Save Record</button>
            </div>
          </div>
        </div>
      )}

      {showEditForm && editRecord && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setShowEditForm(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={editIcon} alt="Edit" style={{ width: '20px', height: '20px' }} /> Edit Medical Record
              </h3>
              <button className="modal-close" onClick={() => setShowEditForm(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Report Title</label>
                <input type="text" className="form-input" value={editRecord.title} onChange={e => setEditRecord({...editRecord, title: e.target.value})} placeholder="e.g., Complete Blood Count" />
              </div>
              <div className="form-group mt-sm">
                <label className="form-label">Profile / Family Member</label>
                <select className="form-select" value={editRecord.family_member_id || ''} onChange={e => setEditRecord({...editRecord, family_member_id: e.target.value})}>
                  <option value="">My Profile (Me)</option>
                  {familyMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid-2 gap-md mt-sm">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={editRecord.category} onChange={e => setEditRecord({...editRecord, category: e.target.value})}>
                    {categories.slice(1).map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={editRecord.date} onChange={e => setEditRecord({...editRecord, date: e.target.value})} />
                </div>
              </div>
              <div className="grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Doctor</label>
                  <input type="text" className="form-input" value={editRecord.doctor || ''} onChange={e => setEditRecord({...editRecord, doctor: e.target.value})} placeholder="Dr. Name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Hospital/Lab</label>
                  <input type="text" className="form-input" value={editRecord.hospital || ''} onChange={e => setEditRecord({...editRecord, hospital: e.target.value})} placeholder="Hospital name" />
                </div>
              </div>
              <div className="form-group mt-sm">
                <label className="form-label">Key Findings</label>
                <textarea className="form-textarea" value={editRecord.findings || ''} onChange={e => setEditRecord({...editRecord, findings: e.target.value})} placeholder="Enter key findings, test results..."></textarea>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateRecord}>Update Record</button>
            </div>
          </div>
        </div>
      )}

      {showAIUpload && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setShowAIUpload(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h3>🤖 AI Report Parser</h3>
              <button className="modal-close" onClick={() => setShowAIUpload(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '32px 20px 20px 20px' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📄</div>
              <h3 style={{ marginBottom: '12px', color: '#0f172a', fontWeight: '700', fontSize: '1.25rem' }}>Upload Your Lab Report</h3>
              <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '32px', maxWidth: '90%', margin: '0 auto 32px auto', lineHeight: '1.5' }}>
                Upload a PDF of your blood test or lab report. Our AI will automatically extract key health metrics like Hemoglobin, Blood Sugar, Cholesterol, and more.
              </p>
              <div style={{ border: '1px dashed #cbd5e1', borderRadius: '16px', padding: '40px 20px', cursor: 'pointer', transition: 'all 0.3s', background: '#F8FAFC', textAlign: 'center' }}
                   onClick={() => document.getElementById('ai-report-file').click()}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⬆️</div>
                <p style={{ fontWeight: '600', marginBottom: '8px', color: '#0f172a', fontSize: '1.1rem' }}>Click to select or drag & drop</p>
                <p style={{ fontSize: '0.85rem', color: '#475569' }}>PDF files only · Max 10MB</p>
              </div>
              <input type="file" id="ai-report-file" accept=".pdf" style={{ display: 'none' }} onChange={async (e) => {
                if(e.target.files.length) {
                   setAiUploadStatus({ type: 'loading', message: 'Analyzing report...' });
                   const formData = new FormData();
                   formData.append('file', e.target.files[0]);
                   try {
                     const res = await API.request('/records/upload-ai', {
                       method: 'POST',
                       body: formData
                     });
                     if (res.success) {
                       setAiUploadStatus({ type: 'success', data: res });
                       fetchData();
                     } else {
                       setAiUploadStatus({ type: 'error', message: res.error || 'Failed to analyze' });
                     }
                   } catch (err) {
                     setAiUploadStatus({ type: 'error', message: 'Failed to upload and analyze report.' });
                   }
                }
              }} />
              {aiUploadStatus && aiUploadStatus.type === 'loading' && (
                <div style={{ marginTop: '20px', padding: '20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))', borderRadius: '16px', textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
                  <p style={{ fontWeight: '600', marginBottom: '4px' }}>🤖 AI is analyzing your report...</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Extracting health metrics</p>
                </div>
              )}
              {aiUploadStatus && aiUploadStatus.type === 'error' && (
                <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(231,76,60,0.1)', borderRadius: '12px', borderLeft: '3px solid var(--danger)', textAlign: 'left' }}>
                  <p style={{ fontWeight: '600', color: 'var(--danger)', margin: 0 }}>❌ {aiUploadStatus.message}</p>
                </div>
              )}
              {aiUploadStatus && aiUploadStatus.type === 'success' && (
                <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(34,197,94,0.1)', borderRadius: '16px', textAlign: 'center' }}>
                  <p style={{ fontWeight: '700', color: 'var(--success)', marginBottom: '8px' }}>✅ {aiUploadStatus.data.message}</p>
                  {(aiUploadStatus.data.metrics_extracted || 0) > 0 ? (
                    <>
                      <div style={{ marginTop: '12px', maxHeight: '300px', overflowY: 'auto', textAlign: 'left' }}>
                        {Object.entries(aiUploadStatus.data.metrics || {}).map(([key, val], idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{key}</span>
                            <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{val}</span>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', marginTop: '16px', textAlign: 'center' }}>
                        {aiUploadStatus.data.health_entries_created || 0} health entries saved to your dashboard.
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>No metrics could be extracted. The report has been saved as a record.</p>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', paddingBottom: '8px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => setShowAIUpload(false)} style={{ padding: '10px 24px', borderRadius: '24px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#0f172a', fontWeight: '600', fontSize: '0.95rem' }}>Cancel</button>
              <button className="btn btn-primary" onClick={() => setShowAIUpload(false)} style={{ padding: '10px 32px', borderRadius: '24px', border: 'none', background: '#0ea5e9', color: '#ffffff', fontWeight: '600', fontSize: '0.95rem' }}>Save</button>
            </div>
          </div>
        </div>
      )}

      {showCompare && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setShowCompare(false) }}>
          <div className="modal" style={{ maxWidth: '700px', width: '100%' }}>
            <div className="modal-header">
              <h3>📊 AI Report Comparison</h3>
              <button className="modal-close" onClick={() => setShowCompare(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              {compareResult?.type === 'loading' && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 20px' }}>
                  <div className="spinner" style={{ margin: '0 auto 16px auto' }}></div>
                  <p style={{ fontWeight: 600 }}>Comparing recent blood tests...</p>
                  <p style={{ fontSize: '0.85rem' }}>Our AI is analyzing the changes.</p>
                </div>
              )}
              {compareResult?.type === 'error' && (
                <div style={{ textAlign: 'center', color: 'var(--danger)', padding: '40px 20px' }}>
                  <p style={{ fontWeight: 600 }}>❌ {compareResult.message}</p>
                </div>
              )}
              {compareResult?.type === 'success' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div className="glass-card" style={{ textAlign: 'center', padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📅 {new Date(compareResult.data.record_1.date).toLocaleDateString()}</p>
                      <h4 style={{ margin: '8px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>{compareResult.data.record_1.title}</h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{compareResult.data.record_1.findings || 'No data'}</p>
                    </div>
                    <div className="glass-card" style={{ textAlign: 'center', padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📅 {new Date(compareResult.data.record_2.date).toLocaleDateString()}</p>
                      <h4 style={{ margin: '8px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>{compareResult.data.record_2.title}</h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{compareResult.data.record_2.findings || 'No data'}</p>
                    </div>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(0,184,148,0.1)', borderRadius: '12px', borderLeft: '3px solid var(--success)' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: '700', marginBottom: '8px' }}>🤖 AI COMPARISON</p>
                    <div className="ai-markdown-content" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6 }}
                         dangerouslySetInnerHTML={{ __html: window.marked ? window.marked.parse(compareResult.data.comparison) : compareResult.data.comparison.replace(/\n/g, '<br>') }}>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCompare(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showSummary && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setShowSummary(false) }}>
          <div className="modal" style={{ maxWidth: '700px', width: '100%' }}>
            <div className="modal-header">
              <h3>✨ AI Summary: {summaryResult?.recordTitle}</h3>
              <button className="modal-close" onClick={() => setShowSummary(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
              {summaryResult?.type === 'loading' && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 20px' }}>
                  <div className="spinner" style={{ margin: '0 auto 16px auto' }}></div>
                  <p style={{ fontWeight: 600 }}>Analyzing {summaryResult.recordTitle}...</p>
                  <p style={{ fontSize: '0.85rem' }}>Our medical AI is extracting key insights.</p>
                </div>
              )}
              {summaryResult?.type === 'error' && (
                <div style={{ textAlign: 'center', color: 'var(--danger)', padding: '40px 20px' }}>
                  <p style={{ fontWeight: 600 }}>❌ {summaryResult.message}</p>
                </div>
              )}
              {summaryResult?.type === 'success' && (
                <div className="ai-markdown-content" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}
                     dangerouslySetInnerHTML={{ __html: window.marked ? window.marked.parse(summaryResult.data.summary) : summaryResult.data.summary.replace(/\n/g, '<br>') }}>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSummary(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Records;
