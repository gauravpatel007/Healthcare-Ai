import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import editIcon from '../../../Icons/edit sign.png';

const Medicine = ({ voiceAction, onVoiceActionConsumed }) => {
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
  const [medicines, setMedicines] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editMedicine, setEditMedicine] = useState(null);
  const [newMedicine, setNewMedicine] = useState({
    name: '', dosage: '', type: 'tablet', frequency: 'once_daily', purpose: '', times: ['08:00'], total_pills: 30, remaining: 30, start_date: new Date().toISOString().split('T')[0]
  });

  // Listen for voice actions
  useEffect(() => {
    if (voiceAction && voiceAction.target_feature === 'medicine') {
      if (voiceAction.action_name === 'open_add_modal') {
        setShowAddForm(true);
      } else if (voiceAction.action_name === 'fill_form' && voiceAction.data) {
        setShowAddForm(true);
        setNewMedicine(prev => ({
          ...prev,
          ...(voiceAction.data.name && { name: voiceAction.data.name }),
          ...(voiceAction.data.dosage && { dosage: voiceAction.data.dosage }),
          ...(voiceAction.data.type && { type: voiceAction.data.type }),
          ...(voiceAction.data.frequency && { frequency: voiceAction.data.frequency }),
          ...(voiceAction.data.purpose && { purpose: voiceAction.data.purpose }),
        }));
      }
      if (onVoiceActionConsumed) onVoiceActionConsumed();
    }
  }, [voiceAction]);

  const typeEmoji = { tablet: '💊', capsule: '🔵', syrup: '🧴', injection: '💉', drops: '💧', cream: '🧴' };

  const fetchData = async () => {
    try {
      const [meds, preds] = await Promise.all([
        API.get('/medicines'),
        API.get('/medicines/refill-predictions')
      ]);
      setMedicines(meds || []);
      setPredictions(preds || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deleteMedicine = async (id) => {
    if (window.confirm('Remove this medicine?')) {
      try {
        await API.delete(`/medicines/${id}`);
        setMedicines(medicines.filter(m => m.id !== id));
      } catch (e) {
        alert('Failed to delete medicine');
      }
    }
  };

  const openEditModal = (med) => {
    setEditMedicine({ ...med });
    setShowEditForm(true);
  };

  const handleUpdateMedicine = async () => {
    if (!editMedicine.name || !editMedicine.dosage) {
      alert('Name and dosage are required');
      return;
    }
    try {
      const updated = await API.request(`/medicines/${editMedicine.id}`, {
        method: 'PUT',
        body: editMedicine
      });
      setMedicines(medicines.map(m => m.id === updated.id ? updated : m));
      setShowEditForm(false);
      setEditMedicine(null);
    } catch (e) {
      alert('Failed to update medicine');
    }
  };

  const checkInteractions = async () => {
    try {
      const res = await API.get('/medicines/interactions');
      if (res.has_interactions) {
        alert(`⚠️ Interactions Found:\n\n${res.warnings.map(w => w.description).join('\n')}`);
      } else {
        alert("✅ No Interactions Found\n\nYour current medications appear safe to take together.");
      }
    } catch (e) {
      alert('Failed to check interactions');
    }
  };

  const handleSaveMedicine = async () => {
    if (!newMedicine.name || !newMedicine.dosage) {
      alert('Name and dosage are required');
      return;
    }
    try {
      const added = await API.post('/medicines', newMedicine);
      setMedicines([added, ...medicines]);
      setShowAddForm(false);
      setNewMedicine({ name: '', dosage: '', type: 'tablet', frequency: 'once_daily', purpose: '', times: ['08:00'], total_pills: 30, remaining: 30, start_date: new Date().toISOString().split('T')[0] });
    } catch (e) {
      alert('Failed to save medicine');
    }
  };

  if (loading) return <div className="empty-state"><span className="spinner"></span> Loading Medicines...</div>;

  return (
    <div className="page-section active">
      <div className="section-header" style={{ background: 'var(--bg-card)', padding: '24px 32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', background: 'rgba(37,99,235,0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.5 20.5l-6-6a4.5 4.5 0 0 1 6.5-6.5l6 6a4.5 4.5 0 0 1-6.5 6.5z"></path><line x1="8.5" y1="8.5" x2="15.5" y2="15.5"></line></svg>
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', fontFamily: "'Inter', sans-serif" }}>Medicine Management</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }}></span>
              {medicines.length} active medications
            </p>
          </div>
        </div>
        <div className="flex gap-md">
          <button className="btn btn-secondary" onClick={checkInteractions} style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 600, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
            Check Interactions
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddForm(true)} style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 600, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            Add Medicine
          </button>
        </div>
      </div>
      <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 'var(--space-xl)', display: 'grid', gap: '16px' }}>
        <div className="stat-card">
          <div className="stat-icon purple" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>💊</div>
          <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{medicines.length}</div>
          <div className="stat-label" style={{ color: 'var(--text-muted)' }}>Active Medications</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>✅</div>
          <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{medicines.filter(m => m.remaining > 5).length}</div>
          <div className="stat-label" style={{ color: 'var(--text-muted)' }}>Well Stocked</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon coral" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⚠️</div>
          <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{medicines.filter(m => m.remaining <= 5).length}</div>
          <div className="stat-label" style={{ color: 'var(--text-muted)' }}>Need Refill Soon</div>
        </div>
      </div>

      <div className="medicine-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {medicines.length > 0 ? medicines.map(m => {
          const pct = m.remaining && m.total_pills ? (m.remaining / m.total_pills) * 100 : 100;
          return (
            <div key={m.id} className="medicine-card">
              <div className="med-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div>
                  <div className="med-name" style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: '4px' }}>{typeEmoji[m.type] || '💊'} {m.name}</div>
                  <div className="med-dosage" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{m.dosage} • {m.type}</div>
                </div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <button className="btn btn-icon btn-secondary" onClick={() => openEditModal(m)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '4px', opacity: 0.6 }} title="Edit Medicine">
                    <img src={editIcon} alt="Edit" style={{ width: '22px', height: '22px', filter: 'var(--icon-filter, none)' }} />
                  </button>
                  <button className="btn btn-icon btn-secondary" onClick={() => deleteMedicine(m.id)} style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.1rem', padding: '4px', opacity: 0.6 }} title="Delete Medicine">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </div>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>{m.purpose}</p>
              <div className="flex justify-between items-center mb-sm" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>📋 {m.frequency.replace('_', ' ')}</span>
                <span className={`badge ${pct > 40 ? 'badge-success' : pct > 20 ? 'badge-warning' : 'badge-danger'}`} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: pct > 40 ? 'rgba(34,197,94,0.1)' : pct > 20 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', color: pct > 40 ? 'var(--success)' : pct > 20 ? 'var(--warning)' : 'var(--danger)' }}>
                  {m.remaining} pills left
                </span>
              </div>
              <div className="med-schedule" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {(m.times || []).map(t => <span key={t} className="med-time" style={{ background: 'var(--bg-secondary)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>🕐 {t}</span>)}
              </div>
              {m.start_date && <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '12px' }}>Started: {m.start_date}</p>}
            </div>
          );
        }) : (
          <div className="empty-state" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div className="empty-icon" style={{ fontSize: '3rem', marginBottom: '16px' }}>💊</div>
            <h3>No Medicines Added</h3>
            <p style={{ color: 'var(--text-muted)' }}>Track your medications, set reminders, and never miss a dose.</p>
            <button className="btn btn-primary mt-md" onClick={() => setShowAddForm(true)} style={{ marginTop: '16px', background: 'var(--primary)', color: 'white', padding: '10px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer' }}>+ Add Medicine</button>
          </div>
        )}
      </div>

      {predictions.length > 0 && (
        <>
          <div className="section-header mt-xl" style={{ marginTop: '32px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>📦 Refill Predictions</h2>
          </div>
          <div className="glass-card no-hover" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            {predictions.map((p, i) => (
              <div key={i} className="list-item" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0', borderBottom: i < predictions.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                <div className="item-icon" style={{ background: 'rgba(108,92,231,0.15)', color: 'var(--primary-light)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>💊</div>
                <div className="item-content" style={{ flex: 1 }}>
                  <div className="item-title" style={{ fontWeight: 600, fontSize: '0.95rem' }}>{p.medicine_name}</div>
                  <div className="item-subtitle" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{p.remaining}/{p.total_pills} pills remaining</div>
                  <div className="progress-bar mt-sm" style={{ maxWidth: '300px', height: '6px', background: 'var(--bg-secondary)', borderRadius: '10px', overflow: 'hidden', marginTop: '8px' }}>
                    <div className={`progress-fill ${p.percentage > 40 ? 'green' : p.percentage > 20 ? 'gold' : 'coral'}`} style={{ width: `${p.percentage}%`, background: p.percentage > 40 ? 'var(--success)' : p.percentage > 20 ? 'var(--warning)' : 'var(--danger)', height: '100%' }}></div>
                  </div>
                </div>
                <span className={`badge ${p.days_left > 10 ? 'badge-success' : p.days_left > 5 ? 'badge-warning' : 'badge-danger'}`} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: p.days_left > 10 ? 'rgba(34,197,94,0.1)' : p.days_left > 5 ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', color: p.days_left > 10 ? 'var(--success)' : p.days_left > 5 ? 'var(--warning)' : 'var(--danger)' }}>
                  ~{p.days_left} days left
                </span>
              </div>
            ))}
          </div>
        </>
      )}

      {showAddForm && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setShowAddForm(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h3>💊 Add Medicine</h3>
              <button className="modal-close" onClick={() => setShowAddForm(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Medicine Name</label>
                  <input type="text" className="form-input" value={newMedicine.name} onChange={e => setNewMedicine({...newMedicine, name: e.target.value})} placeholder="e.g., Paracetamol" />
                </div>
                <div className="form-group">
                  <label className="form-label">Dosage</label>
                  <input type="text" className="form-input" value={newMedicine.dosage} onChange={e => setNewMedicine({...newMedicine, dosage: e.target.value})} placeholder="e.g., 500mg" />
                </div>
              </div>
              <div className="grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={newMedicine.type} onChange={e => setNewMedicine({...newMedicine, type: e.target.value})}>
                    <option value="tablet">Tablet</option><option value="capsule">Capsule</option><option value="syrup">Syrup</option>
                    <option value="injection">Injection</option><option value="drops">Drops</option><option value="cream">Cream</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Frequency</label>
                  <select className="form-select" value={newMedicine.frequency} onChange={e => setNewMedicine({...newMedicine, frequency: e.target.value})}>
                    <option value="once_daily">Once daily</option><option value="twice_daily">Twice daily</option>
                    <option value="thrice_daily">Thrice daily</option><option value="once_weekly">Once weekly</option>
                    <option value="as_needed">As needed</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Time(s)</label>
                <input type="time" className="form-input" value={newMedicine.times[0]} onChange={e => setNewMedicine({...newMedicine, times: [e.target.value]})} />
              </div>
              <div className="form-group">
                <label className="form-label">Purpose</label>
                <input type="text" className="form-input" value={newMedicine.purpose} onChange={e => setNewMedicine({...newMedicine, purpose: e.target.value})} placeholder="What is this medicine for?" />
              </div>
              <div className="grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Total Pills</label>
                  <input type="number" className="form-input" value={newMedicine.total_pills} onChange={e => setNewMedicine({...newMedicine, total_pills: parseInt(e.target.value), remaining: parseInt(e.target.value)})} placeholder="30" />
                </div>
                <div className="form-group">
                  <label className="form-label">Remaining</label>
                  <input type="number" className="form-input" value={newMedicine.remaining} onChange={e => setNewMedicine({...newMedicine, remaining: parseInt(e.target.value)})} placeholder="30" />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveMedicine}>Save Medicine</button>
            </div>
          </div>
        </div>
      )}

      {showEditForm && editMedicine && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setShowEditForm(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={editIcon} alt="Edit" style={{ width: '20px', height: '20px' }} /> Edit Medicine
              </h3>
              <button className="modal-close" onClick={() => setShowEditForm(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Medicine Name</label>
                  <input type="text" className="form-input" value={editMedicine.name} onChange={e => setEditMedicine({...editMedicine, name: e.target.value})} placeholder="e.g., Paracetamol" />
                </div>
                <div className="form-group">
                  <label className="form-label">Dosage</label>
                  <input type="text" className="form-input" value={editMedicine.dosage} onChange={e => setEditMedicine({...editMedicine, dosage: e.target.value})} placeholder="e.g., 500mg" />
                </div>
              </div>
              <div className="grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Type</label>
                  <select className="form-select" value={editMedicine.type} onChange={e => setEditMedicine({...editMedicine, type: e.target.value})}>
                    <option value="tablet">Tablet</option><option value="capsule">Capsule</option><option value="syrup">Syrup</option>
                    <option value="injection">Injection</option><option value="drops">Drops</option><option value="cream">Cream</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Frequency</label>
                  <select className="form-select" value={editMedicine.frequency} onChange={e => setEditMedicine({...editMedicine, frequency: e.target.value})}>
                    <option value="once_daily">Once daily</option><option value="twice_daily">Twice daily</option>
                    <option value="thrice_daily">Thrice daily</option><option value="once_weekly">Once weekly</option>
                    <option value="as_needed">As needed</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Time(s)</label>
                <input type="time" className="form-input" value={(editMedicine.times && editMedicine.times.length) ? editMedicine.times[0] : '08:00'} onChange={e => setEditMedicine({...editMedicine, times: [e.target.value]})} />
              </div>
              <div className="form-group">
                <label className="form-label">Purpose</label>
                <input type="text" className="form-input" value={editMedicine.purpose || ''} onChange={e => setEditMedicine({...editMedicine, purpose: e.target.value})} placeholder="What is this medicine for?" />
              </div>
              <div className="grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Total Pills</label>
                  <input type="number" className="form-input" value={editMedicine.total_pills || 0} onChange={e => setEditMedicine({...editMedicine, total_pills: parseInt(e.target.value)})} placeholder="30" />
                </div>
                <div className="form-group">
                  <label className="form-label">Remaining</label>
                  <input type="number" className="form-input" value={editMedicine.remaining || 0} onChange={e => setEditMedicine({...editMedicine, remaining: parseInt(e.target.value)})} placeholder="30" />
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateMedicine}>Update Medicine</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Medicine;
