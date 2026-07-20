import React, { useState, useEffect } from 'react';
import API from '../utils/api';

const Appointments = ({ voiceAction, onVoiceActionConsumed }) => {
  const [appointments, setAppointments] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [prepModal, setPrepModal] = useState({ isOpen: false, aptId: null });
  const [viewPrepModal, setViewPrepModal] = useState({ isOpen: false, text: '', aptId: null });
  const [prepSymptoms, setPrepSymptoms] = useState('');
  const [isPrepping, setIsPrepping] = useState(false);

  // Listen for voice actions
  useEffect(() => {
    if (voiceAction && voiceAction.target_feature === 'appointments') {
      if (voiceAction.action_name === 'open_add_modal') {
        setShowForm(true);
      } else if (voiceAction.action_name === 'fill_form' && voiceAction.data) {
        setShowForm(true);
        setNewApt(prev => ({
          ...prev,
          ...(voiceAction.data.doctor && { doctor: voiceAction.data.doctor }),
          ...(voiceAction.data.specialty && { specialty: voiceAction.data.specialty }),
          ...(voiceAction.data.hospital && { hospital: voiceAction.data.hospital }),
          ...(voiceAction.data.date && { date: voiceAction.data.date }),
          ...(voiceAction.data.time && { time: voiceAction.data.time }),
          ...(voiceAction.data.notes && { notes: voiceAction.data.notes }),
        }));
      }
      if (onVoiceActionConsumed) onVoiceActionConsumed();
    }
  }, [voiceAction]);
  
  const [newApt, setNewApt] = useState({
    doctor: '',
    specialty: 'General Physician',
    hospital: '',
    date: '',
    time: '10:00',
    notes: ''
  });

  const fetchData = async () => {
    try {
      const [apts, suggs] = await Promise.all([
        API.get('/appointments'),
        API.get('/appointments/suggestions')
      ]);
      setAppointments(apts || []);
      setSuggestions(suggs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Stretch layout to fill empty right panel space
    const appContainer = document.querySelector('.app-container');
    const rightPanel = document.querySelector('.right-panel');
    if (appContainer && rightPanel) {
      appContainer.style.gridTemplateColumns = 'var(--sidebar-width) 1fr';
      rightPanel.style.display = 'none';
    }
    
    return () => {
      // Restore layout on unmount
      if (appContainer && rightPanel) {
        appContainer.style.gridTemplateColumns = 'var(--sidebar-width) 1fr var(--right-panel-width)';
        rightPanel.style.display = 'flex'; // or whatever the default is
      }
    };
  }, []);

  const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    // Append T00:00:00 to force local timezone parsing instead of UTC parsing
    return new Date(dateStr.includes('T') ? dateStr : `${dateStr}T00:00:00`);
  };

  const today = new Date(new Date().setHours(0,0,0,0));
  const upcoming = appointments.filter(a => a.status === 'upcoming' && parseLocalDate(a.date) >= today);
  const past = appointments.filter(a => a.status !== 'upcoming' || parseLocalDate(a.date) < today);

  const getDaysUntil = (dateStr) => {
    const aptDate = parseLocalDate(dateStr);
    const timeDiff = aptDate.getTime() - today.getTime();
    return Math.ceil(timeDiff / (1000 * 3600 * 24));
  };

  const handleAdd = async () => {
    if (!newApt.doctor || !newApt.date) {
      alert('Please fill in doctor and date');
      return;
    }
    try {
      const added = await API.post('/appointments', { ...newApt, status: 'upcoming' });
      setAppointments([...appointments, added]);
      setShowForm(false);
      setNewApt({ doctor: '', specialty: 'General Physician', hospital: '', date: '', time: '10:00', notes: '' });
    } catch (e) {
      console.error("Failed to add appointment:", e);
      alert('Failed to add appointment: ' + (e.message || 'Unknown error'));
    }
  };

  const markCompleted = async (id) => {
    try {
      await API.put(`/appointments/${id}`, { status: 'completed' });
      setAppointments(appointments.map(a => a.id === id ? { ...a, status: 'completed' } : a));
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const deleteApt = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        await API.delete(`/appointments/${id}`);
        setAppointments(appointments.filter(a => a.id !== id));
      } catch (e) {
        alert('Failed to delete');
      }
    }
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {text.split('\n').map((line, i) => {
          if (!line.trim()) return null;
          let formattedLine = line.replace(/^\*\s/, '•  ');
          formattedLine = formattedLine.replace(/^- /, '•  ');
          
          const boldParts = formattedLine.split(/(\*\*.*?\*\*)/g);
          
          return (
            <div key={i} style={{ lineHeight: '1.6', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
              {boldParts.map((part, j) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <strong key={j} style={{ color: 'var(--text-primary)' }}>{part.slice(2, -2)}</strong>;
                }
                return part;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  const handleGeneratePrep = async () => {
    if (!prepModal.aptId) return;
    setIsPrepping(true);
    try {
      const updatedApt = await API.post(`/appointments/${prepModal.aptId}/prep`, { symptoms: prepSymptoms });
      setAppointments(appointments.map(a => a.id === updatedApt.id ? updatedApt : a));
      setPrepModal({ isOpen: false, aptId: null });
      setPrepSymptoms('');
    } catch (e) {
      console.error(e);
      alert('Failed to generate prep questions: ' + (e.message || 'Unknown error'));
    } finally {
      setIsPrepping(false);
    }
  };

  if (loading) return <div className="empty-state"><span className="spinner"></span> Loading Appointments...</div>;

  return (
    <div className="page-section active">
      <div className="section-header" style={{ background: 'var(--bg-card)', padding: '24px 32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', background: 'rgba(37,99,235,0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', fontFamily: "'Inter', sans-serif" }}>Appointment Manager</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }}></span>
              {upcoming.length} upcoming appointments
            </p>
          </div>
        </div>
        <div className="flex gap-md">
          <button className="btn btn-primary" onClick={() => setShowForm(true)} style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 600, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            New Appointment
          </button>
        </div>
      </div>

      <div className="dashboard-stats" style={{ gridTemplateColumns: 'repeat(3, 1fr)', marginBottom: 'var(--space-xl)', display: 'grid', gap: '16px' }}>
        <div className="stat-card">
          <div className="stat-icon teal" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📅</div>
          <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{upcoming.length}</div>
          <div className="stat-label" style={{ color: 'var(--text-muted)' }}>Upcoming</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>✅</div>
          <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{past.length}</div>
          <div className="stat-label" style={{ color: 'var(--text-muted)' }}>Completed</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🏥</div>
          <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{[...new Set(appointments.map(a => a.hospital))].length}</div>
          <div className="stat-label" style={{ color: 'var(--text-muted)' }}>Hospitals</div>
        </div>
      </div>

      <h3 style={{ marginBottom: 'var(--space-md)' }}>📌 Upcoming Appointments</h3>
      <div className="appointment-list mb-xl" style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
        {upcoming.length > 0 ? upcoming.map(a => {
          const d = parseLocalDate(a.date);
          const daysUntil = getDaysUntil(a.date);
          return (
            <div key={a.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              <div style={{ textAlign: 'center', minWidth: '60px' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-light)', lineHeight: 1 }}>{d.getDate()}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{d.toLocaleDateString('en', { month: 'short', year: 'numeric' })}</div>
              </div>
              <div style={{ width: '1px', height: '50px', background: 'var(--border-color)' }}></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Dr. {a.doctor}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{a.specialty}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>🏥 {a.hospital} • 🕐 {a.time}</div>
                {a.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>📝 {a.notes}</div>}
              </div>
              <div style={{ textAlign: 'right', minWidth: '140px' }}>
                <span className={`badge ${daysUntil <= 3 ? 'badge-warning' : 'badge-primary'}`} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: daysUntil <= 3 ? 'rgba(245,158,11,0.1)' : 'rgba(37,99,235,0.1)', color: daysUntil <= 3 ? 'var(--warning)' : 'var(--primary)', marginBottom: '8px', display: 'inline-block' }}>
                  {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `${daysUntil} days`}
                </span>
                
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {a.ai_prep_notes ? (
                    <button className="btn btn-sm btn-secondary" onClick={() => setViewPrepModal({ isOpen: true, text: a.ai_prep_notes, aptId: a.id })} style={{ width: '100%', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--secondary)', background: 'rgba(0,210,211,0.05)', color: 'var(--secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', display: 'flex', justifyContent: 'center', gap: '4px', alignItems: 'center' }}>
                      <span role="img" aria-label="bot">🤖</span> View AI Prep
                    </button>
                  ) : (
                    <button className="btn btn-sm btn-secondary" onClick={() => setPrepModal({ isOpen: true, aptId: a.id })} style={{ width: '100%', padding: '6px 12px', borderRadius: '6px', border: '1px solid var(--secondary)', background: 'transparent', color: 'var(--secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem', display: 'flex', justifyContent: 'center', gap: '4px', alignItems: 'center' }}>
                      <span role="img" aria-label="sparkles">✨</span> AI Prep
                    </button>
                  )}
                  
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => markCompleted(a.id)} style={{ flex: 1, padding: '6px 0', borderRadius: '6px', border: 'none', background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>✔ Done</button>
                    <button className="btn btn-sm btn-danger" onClick={() => deleteApt(a.id)} style={{ flex: 1, padding: '6px 0', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', cursor: 'pointer', fontWeight: 600, fontSize: '0.75rem' }}>Cancel</button>
                  </div>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="glass-card" style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <p style={{ color: 'var(--text-muted)' }}>No upcoming appointments. Schedule one now!</p>
          </div>
        )}
      </div>

      {past.length > 0 && (
        <>
          <h3 style={{ marginBottom: 'var(--space-md)' }}>📋 Past Appointments</h3>
          <div className="appointment-list mb-xl" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {past.map(a => {
              const d = parseLocalDate(a.date);
              return (
                <div key={a.id} className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', opacity: 0.6 }}>
                  <div style={{ textAlign: 'center', minWidth: '60px' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-light)', lineHeight: 1 }}>{d.getDate()}</div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>{d.toLocaleDateString('en', { month: 'short', year: 'numeric' })}</div>
                  </div>
                  <div style={{ width: '1px', height: '50px', background: 'var(--border-color)' }}></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Dr. {a.doctor}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{a.specialty}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>🏥 {a.hospital} • 🕐 {a.time}</div>
                    {a.notes && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>📝 {a.notes}</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-success" style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(34,197,94,0.1)', color: 'var(--success)' }}>Completed</span>
                    <div style={{ marginTop: '8px' }}>
                      <button className="btn btn-sm btn-danger" onClick={() => deleteApt(a.id)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: 'rgba(239,68,68,0.1)', color: 'var(--danger)', cursor: 'pointer', fontWeight: 600 }}>Delete</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="glass-card no-hover mt-xl" style={{ borderLeft: '3px solid var(--secondary)', background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', borderTop: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <h4 style={{ marginBottom: '12px' }}>🤖 AI Appointment Suggestions</h4>
        {suggestions.map((s, i) => (
          <div key={i} className="list-item" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0' }}>
            <div className="item-icon" style={{ background: 'rgba(0,210,211,0.15)', color: 'var(--secondary)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🤖</div>
            <div className="item-content" style={{ flex: 1 }}>
              <div className="item-title" style={{ fontWeight: 600, fontSize: '0.95rem' }}>{s.text}</div>
              <div className="item-subtitle" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{s.specialist}</div>
            </div>
            <span className={`badge badge-${s.urgency.toLowerCase() === 'high' ? 'danger' : s.urgency.toLowerCase() === 'medium' ? 'warning' : 'info'}`} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: s.urgency === 'High' ? 'rgba(239,68,68,0.1)' : s.urgency === 'Medium' ? 'rgba(245,158,11,0.1)' : 'rgba(14,165,233,0.1)', color: s.urgency === 'High' ? 'var(--danger)' : s.urgency === 'Medium' ? 'var(--warning)' : 'var(--info)' }}>{s.urgency}</span>
          </div>
        ))}
      </div>

      {showForm && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setShowForm(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h3>📅 New Appointment</h3>
              <button className="modal-close" onClick={() => setShowForm(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Doctor Name</label>
                <input type="text" className="form-input" value={newApt.doctor} onChange={(e) => setNewApt({...newApt, doctor: e.target.value})} placeholder="Dr. Name" />
              </div>
              <div className="grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Specialty</label>
                  <select className="form-select" value={newApt.specialty} onChange={(e) => setNewApt({...newApt, specialty: e.target.value})}>
                    <option>General Physician</option><option>Cardiologist</option><option>Pulmonologist</option>
                    <option>Dermatologist</option><option>Orthopedic</option><option>ENT</option>
                    <option>Ophthalmologist</option><option>Dentist</option><option>Neurologist</option>
                    <option>Gynecologist</option><option>Pediatrician</option><option>Psychiatrist</option>
                    <option>Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Hospital/Clinic</label>
                  <input type="text" className="form-input" value={newApt.hospital} onChange={(e) => setNewApt({...newApt, hospital: e.target.value})} placeholder="Hospital name" />
                </div>
              </div>
              <div className="grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={newApt.date} onChange={(e) => setNewApt({...newApt, date: e.target.value})} min={new Date().toISOString().split('T')[0]} />
                </div>
                <div className="form-group">
                  <label className="form-label">Time</label>
                  <input type="time" className="form-input" value={newApt.time} onChange={(e) => setNewApt({...newApt, time: e.target.value})} />
                </div>
              </div>
              <div className="form-group mt-sm">
                <label className="form-label">Notes</label>
                <textarea className="form-textarea" value={newApt.notes} onChange={(e) => setNewApt({...newApt, notes: e.target.value})} placeholder="Reason for visit, things to discuss..."></textarea>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAdd}>Save</button>
            </div>
          </div>
        </div>
      )}

      {prepModal.isOpen && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget && !isPrepping) setPrepModal({ isOpen: false, aptId: null }) }}>
          <div className="modal" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h3>✨ AI Appointment Prep</h3>
              <button className="modal-close" onClick={() => !isPrepping && setPrepModal({ isOpen: false, aptId: null })}>✕</button>
            </div>
            
            <div className="modal-body">
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.5 }}>
                The AI will securely analyze your recent vitals (blood pressure, heart rate, etc.) and the appointment details to draft relevant questions for your doctor.
              </p>
              <div className="form-group">
                <label className="form-label">Current Symptoms (Optional)</label>
                <textarea 
                  className="form-textarea" 
                  value={prepSymptoms} 
                  onChange={(e) => setPrepSymptoms(e.target.value)} 
                  placeholder="e.g., I've been having headaches every morning..."
                  style={{ minHeight: '80px' }}
                  disabled={isPrepping}
                ></textarea>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setPrepModal({ isOpen: false, aptId: null })} disabled={isPrepping}>Cancel</button>
              <button className="btn btn-primary" onClick={handleGeneratePrep} disabled={isPrepping} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {isPrepping ? (
                  <><span className="spinner" style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white' }}></span> Generating...</>
                ) : (
                  <>Generate Questions</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {viewPrepModal.isOpen && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setViewPrepModal({ isOpen: false, text: '', aptId: null }) }}>
          <div className="modal" style={{ maxWidth: '600px', width: '100%' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '16px', marginBottom: '16px' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--secondary)' }}>
                <span role="img" aria-label="bot" style={{ fontSize: '1.4rem' }}>🤖</span> AI Prepared Questions
              </h3>
              <button className="modal-close" onClick={() => setViewPrepModal({ isOpen: false, text: '', aptId: null })}>✕</button>
            </div>
            
            <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '10px' }}>
              {renderMarkdown(viewPrepModal.text)}
            </div>
            
            <div className="modal-footer" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid var(--border-color)', display: 'flex', gap: '12px' }}>
              <button className="btn btn-secondary" onClick={() => {
                const id = viewPrepModal.aptId;
                setViewPrepModal({ isOpen: false, text: '', aptId: null });
                setPrepModal({ isOpen: true, aptId: id });
              }} style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.59-10.09l5.67-5.67"/></svg>
                Regenerate
              </button>
              <button className="btn btn-primary" onClick={() => setViewPrepModal({ isOpen: false, text: '', aptId: null })} style={{ flex: 1 }}>Got it!</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
