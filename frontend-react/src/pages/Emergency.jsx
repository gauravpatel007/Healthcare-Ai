import React, { useState, useEffect } from 'react';
import API from '../utils/api';

const Emergency = ({ voiceAction, onVoiceActionConsumed }) => {
  useEffect(() => {
    // Hide right panel globally for this page
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

  const [loading, setLoading] = useState(true);
  const [sosLoading, setSosLoading] = useState(false);
  const [profile, setProfile] = useState(null);
  const [contacts, setContacts] = useState([]);

  // Listen for voice actions (handled after triggerSOS is defined)
  const voiceActionHandled = React.useRef(false);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const [fetchedContacts, qrData] = await Promise.all([
        API.get('/emergency/contacts'),
        API.get('/emergency/qr-data')
      ]);
      setContacts(fetchedContacts || []);
      setProfile(qrData || {});
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const triggerSOS = async () => {
    if (confirm('🚨 EMERGENCY SOS 🚨\n\nAre you sure you want to trigger an SOS alert? This will immediately notify your emergency contacts and local authorities.')) {
      try {
        setSosLoading(true);
        const getPosition = () => {
          return new Promise((resolve) => {
            if (!navigator.geolocation) {
              resolve(null);
              return;
            }
            navigator.geolocation.getCurrentPosition(
              (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
              (err) => resolve(null),
              { timeout: 6000, enableHighAccuracy: true }
            );
          });
        };

        const locationData = await getPosition();
        const payload = locationData ? locationData : {};

        const res = await API.post('/emergency/sos', payload);
        alert('SOS ALERT SENT.\n\nActions triggered:\n' + res.actions.map(a => `✅ ${a}`).join('\n') + '\n\n📞 Emergency: 112');
      } catch (e) {
        alert('Failed to send SOS');
      } finally {
        setSosLoading(false);
      }
    }
  };

  const toggleDonor = async () => {
    try {
      const res = await API.post('/emergency/toggle-donor');
      alert(res.message);
      fetchData(); // refresh profile state
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [modalData, setModalData] = useState({ id: null, name: '', phone: '', relation: '', email: '', carrier: '' });

  const openAddModal = () => {
    setModalMode('add');
    setModalData({ id: null, name: '', phone: '', relation: '', email: '', carrier: '' });
    setModalOpen(true);
  };

  // Voice action handler
  useEffect(() => {
    if (voiceAction && voiceAction.target_feature === 'emergency') {
      if (voiceAction.action_name === 'trigger_sos') {
        triggerSOS();
      } else if (voiceAction.action_name === 'open_add_modal') {
        openAddModal();
      }
      if (onVoiceActionConsumed) onVoiceActionConsumed();
    }
  }, [voiceAction]);

  const openEditModal = (c) => {
    setModalMode('edit');
    setModalData({ id: c.id, name: c.name, phone: c.phone, relation: c.relation, email: c.email || '', carrier: c.carrier || '' });
    setModalOpen(true);
  };

  const saveContact = async () => {
    if (!modalData.name || !modalData.phone || !modalData.relation) {
      alert("Please fill in all fields.");
      return;
    }
    
    try {
      if (modalMode === 'add') {
        await API.post('/emergency/contacts', { name: modalData.name, phone: modalData.phone, relation: modalData.relation, email: modalData.email || null, carrier: modalData.carrier || null });
      } else {
        await API.put(`/emergency/contacts/${modalData.id}`, { name: modalData.name, phone: modalData.phone, relation: modalData.relation, email: modalData.email || null, carrier: modalData.carrier || null });
      }
      setModalOpen(false);
      fetchData();
    } catch (e) {
      alert(`Failed to ${modalMode} contact`);
    }
  };

  const deleteContact = async (id) => {
    if (confirm('Delete this contact?')) {
      try {
        await API.delete(`/emergency/contacts/${id}`);
        fetchData();
      } catch (e) {
        alert('Failed to delete contact');
      }
    }
  };

  const getNearbyHospitals = () => [
    { name: 'Apollo Hospital', distance: '2.3 km', type: 'Multi-specialty', phone: '1066', icon: '🏥' },
    { name: 'City Blood Bank', distance: '1.5 km', type: 'Blood Bank', phone: '104', icon: '🩸' },
    { name: 'LifeCare Pharmacy', distance: '0.8 km', type: 'Pharmacy', phone: '1800-123', icon: '💊' },
    { name: 'Ambulance Service', distance: 'On Call', type: 'Emergency', phone: '108', icon: '🚑' }
  ];

  const healthIDText = profile ? `EMERGENCY MEDICAL ID\nName: ${profile.name || 'Unknown'}\nBlood Type: ${profile.blood_type || 'Unknown'}\nAge: ${profile.age || '?'} | Gender: ${profile.gender || 'Unknown'}\nAllergies: ${profile.allergies?.join(', ') || 'None'}\nConditions: ${profile.conditions?.join(', ') || 'None'}\nEmergency Contact: ${contacts && contacts.length > 0 ? `${contacts[0].name} - ${contacts[0].phone}` : 'None'}` : '';
  const qrUrl = `https://quickchart.io/qr?size=300&margin=0&text=${encodeURIComponent(healthIDText)}`;

  const downloadQR = async () => {
    try {
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'LifeOS_Emergency_QR.png';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      alert("Failed to download QR code.");
    }
  };

  const [sharingLoading, setSharingLoading] = useState(false);
  const copyID = async () => {
    try {
      setSharingLoading(true);
      const res = await API.post('/share/generate');
      const url = `${window.location.origin}/shared/${res.token}`;
      await navigator.clipboard.writeText(url);
      alert("Secure Digital ID link copied!");
    } catch (e) {
      alert("Failed to generate secure Digital ID link.");
    } finally {
      setSharingLoading(false);
    }
  };

  if (loading && !profile) return <div className="empty-state"><span className="spinner"></span> Loading Emergency System...</div>;
  if (!profile) return <div className="empty-state">Failed to load Emergency Data</div>;

  return (
    <div className="page-section active">
      {/* Header */}
      <div className="section-header" style={{ background: 'var(--bg-card)', padding: '24px 32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', background: 'rgba(239,68,68,0.1)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--danger)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', fontFamily: "'Inter', sans-serif" }}>Emergency System</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--danger)', boxShadow: '0 0 6px var(--danger)' }}></span>
              Quick access to emergency features and health card
            </p>
          </div>
        </div>
      </div>

      {/* SOS Button */}
      <div className="glass-card" style={{ background: 'var(--bg-card)', border: '1px solid rgba(239, 68, 68, 0.2)', boxShadow: '0 10px 40px rgba(239, 68, 68, 0.08)', textAlign: 'center', marginBottom: 'var(--space-2xl)', padding: '40px 24px', borderRadius: '24px', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'linear-gradient(90deg, #ef4444, #f97316)' }}></div>
        <button className="btn btn-sos hover-lift" onClick={triggerSOS} disabled={sosLoading} style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '4px',
          width: '140px', height: '140px', borderRadius: '50%', 
          background: 'linear-gradient(145deg, #ef4444, #dc2626)', 
          boxShadow: '0 12px 30px rgba(239, 68, 68, 0.4), inset 0 2px 4px rgba(255,255,255,0.4)', 
          border: '6px solid var(--bg-card)', outline: '2px solid rgba(239,68,68,0.2)',
          color: 'white', fontWeight: 800, fontSize: '1.4rem', letterSpacing: '1px', transition: 'all 0.3s', zIndex: 2, cursor: sosLoading ? 'wait' : 'pointer',
          opacity: sosLoading ? 0.8 : 1
        }}>
          {sosLoading ? (
            <>
              <span className="spinner" style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: 'white', marginBottom: '8px' }}></span>
              LOCATING...
            </>
          ) : (
            <>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              SOS
            </>
          )}
        </button>
        <div style={{ marginTop: '24px', zIndex: 2 }}>
          <h3 style={{ fontSize: '1.3rem', color: 'var(--text-primary)', marginBottom: '8px', fontWeight: 700 }}>Emergency Assistance</h3>
          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.5 }}>
            Press the SOS button to instantly alert your emergency contacts and share your live location. 
          </p>
          <div style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.1)', padding: '8px 16px', borderRadius: '50px', color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 600 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            Also call your local emergency number (e.g., 911)
          </div>
        </div>
      </div>

      <div className="grid-2 gap-xl" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
        {/* Emergency Info (Left) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Emergency Contacts */}
          <div>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
              <span style={{ fontSize: '1.2rem' }}>📞</span> Emergency Contacts
            </h3>
            <div className="glass-card no-hover" style={{ padding: '24px' }}>
              {contacts.map(c => (
                <div key={c.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '16px', padding: '16px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>{c.name}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ background: 'var(--bg-body)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.75rem' }}>{c.relation}</span> 
                        <span>{c.phone}</span>
                        {c.carrier && <span style={{ background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg> {c.carrier} SMS</span>}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button className="btn btn-sm btn-secondary" onClick={() => openEditModal(c)} style={{ width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }} title="Edit Contact">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button className="btn btn-sm" onClick={() => deleteContact(c.id)} style={{ width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', border: 'none' }} title="Delete Contact">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                    <a href={`tel:${c.phone}`} className="btn btn-sm btn-success" style={{ marginLeft: '8px', padding: '8px 16px', borderRadius: '50px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)', textDecoration: 'none' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                      Call
                    </a>
                  </div>
                </div>
              ))}
              <button className="btn btn-secondary btn-sm w-full mt-md" onClick={openAddModal} style={{ padding: '12px', fontWeight: 600 }}>+ Add New Contact</button>
            </div>
          </div>

          {/* Nearby Hospitals */}
          <div>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🏥</span> Nearby Hospitals
            </h3>
            <div className="glass-card no-hover" style={{ padding: '24px' }}>
              {getNearbyHospitals().map((h, i) => (
                <div key={i} className="list-item" style={{ padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-light)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div className="item-icon" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--secondary)', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', fontSize: '1.2rem' }}>{h.icon}</div>
                    <div className="item-content">
                      <div className="item-title" style={{ fontWeight: 600 }}>{h.name}</div>
                      <div className="item-subtitle" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{h.distance} • {h.type}</div>
                    </div>
                  </div>
                  <a href={`tel:${h.phone}`} className="btn btn-sm" style={{ background: 'rgba(6, 182, 212, 0.1)', color: 'var(--secondary)', textDecoration: 'none' }}>📞 {h.phone}</a>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Health Card & Hospitals (Right) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Premium Health Card */}
          <div>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
              <span style={{ fontSize: '1.2rem' }}>🪪</span> Digital Health ID
            </h3>
            
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '20px', padding: '24px', position: 'relative', overflow: 'hidden', boxShadow: '0 10px 40px rgba(0,0,0,0.15)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
              {/* Decorative Glows */}
              <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '150px', height: '150px', background: 'rgba(239, 68, 68, 0.2)', filter: 'blur(40px)', borderRadius: '50%' }}></div>
              <div style={{ position: 'absolute', bottom: '-50px', left: '-50px', width: '120px', height: '120px', background: 'rgba(59, 130, 246, 0.2)', filter: 'blur(40px)', borderRadius: '50%' }}></div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', position: 'relative', zIndex: 2 }}>
                <div>
                  <h3 style={{ color: 'white', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 4px 0', letterSpacing: '0.5px' }}>LifeOS Health ID</h3>
                  <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', margin: 0, fontWeight: 600, letterSpacing: '1px' }}>EMERGENCY MEDICAL INFO</p>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '12px', padding: '8px' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><line x1="12" y1="8" x2="12" y2="16"></line><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '24px', position: 'relative', zIndex: 2, alignItems: 'center' }}>
                {/* QR Code */}
                <div style={{ background: 'white', padding: '8px', borderRadius: '12px', width: '116px', height: '116px', flexShrink: 0, boxShadow: '0 4px 12px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img 
                    src={qrUrl} 
                    alt="Health ID QR" 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                  />
                </div>

                {/* Details */}
                <div style={{ flexGrow: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Patient Name</div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: 'white' }}>{profile.name}</div>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Blood Type</div>
                    <div style={{ color: '#ef4444', fontWeight: 800, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      💧 {profile.blood_type}
                    </div>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Age</div>
                    <div style={{ fontWeight: 500, fontSize: '0.95rem', color: 'white' }}>{profile.age} yrs</div>
                  </div>
                  <div>
                    <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, marginBottom: '2px' }}>Gender</div>
                    <div style={{ fontWeight: 500, fontSize: '0.95rem', color: 'white' }}>{profile.gender}</div>
                  </div>
                </div>
              </div>

              {/* Conditions & Allergies Area */}
              <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.1)', position: 'relative', zIndex: 2 }}>
                {(profile.allergies || []).length > 0 && (
                  <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, width: '85px', paddingTop: '4px' }}>Allergies:</span>
                    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {profile.allergies.map(a => <span key={a} style={{ background: 'rgba(239,68,68,0.2)', color: '#fca5a5', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid rgba(239,68,68,0.3)', fontWeight: 500 }}>{a}</span>)}
                    </div>
                  </div>
                )}
                {(profile.conditions || []).length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, width: '85px', paddingTop: '4px' }}>Conditions:</span>
                    <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {profile.conditions.map(c => <span key={c} style={{ background: 'rgba(245,158,11,0.2)', color: '#fcd34d', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', border: '1px solid rgba(245,158,11,0.3)', fontWeight: 500 }}>{c}</span>)}
                    </div>
                  </div>
                )}
                {!(profile.allergies || []).length && !(profile.conditions || []).length && (
                  <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontStyle: 'italic' }}>No known allergies or chronic conditions.</div>
                )}
              </div>
            </div>

            <div className="flex gap-sm mt-md">
              <button className="btn btn-primary" onClick={downloadQR} style={{ flex: 1, justifyContent: 'center', padding: '12px', fontWeight: 600, boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download ID Card
              </button>
              <button className="btn btn-secondary" onClick={copyID} style={{ flex: 1, justifyContent: 'center', padding: '12px', fontWeight: 600, opacity: sharingLoading ? 0.7 : 1, cursor: sharingLoading ? 'wait' : 'pointer' }} disabled={sharingLoading}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '8px' }}><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
                {sharingLoading ? 'Generating Link...' : 'Share Digital ID'}
              </button>
            </div>
          </div>

          {/* Organ Donor */}
          <div>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.2rem' }}>
              <span style={{ fontSize: '1.2rem' }}>💚</span> Organ Donor Status
            </h3>
            <div className="glass-card hover-lift" style={{ borderLeft: '4px solid var(--success)', padding: '24px' }}>
              <div className="flex items-center gap-md">
                <div style={{ fontSize: '2.5rem' }}>💚</div>
                <div style={{ flexGrow: 1 }}>
                  <h4 style={{ fontSize: '1.1rem', marginBottom: '4px', color: profile.organ_donor ? 'var(--success)' : 'inherit' }}>
                    {profile.organ_donor ? 'Organ donor registered.' : 'Organ Donor Registration'}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                    {profile.organ_donor ? 'Thank you for your generosity!' : 'Consider becoming an organ donor to save lives.'}
                  </p>
                </div>
                <button className={`btn ${profile.organ_donor ? 'btn-success' : 'btn-outline'}`} 
                        onClick={toggleDonor} style={{ padding: '10px 20px' }}>
                  {profile.organ_donor ? '✅ Registered' : 'Register Now'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#ffffff', width: '90%', maxWidth: '500px', padding: '32px', borderRadius: '24px', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#111827', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '1.4rem' }}>📞</span>
                {modalMode === 'add' ? 'Add Emergency Contact' : 'Edit Emergency Contact'}
              </h3>
              <button onClick={() => setModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', cursor: 'pointer' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Name</label>
              <input type="text" value={modalData.name} onChange={e => setModalData({...modalData, name: e.target.value})} placeholder="Contact name" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#334155', fontSize: '0.95rem', outline: 'none' }} />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Phone</label>
              <input type="tel" value={modalData.phone} onChange={e => setModalData({...modalData, phone: e.target.value})} placeholder="+91-XXXXXXXXXX" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#334155', fontSize: '0.95rem', outline: 'none' }} />
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Email (Optional)</label>
              <input type="email" value={modalData.email} onChange={e => setModalData({...modalData, email: e.target.value})} placeholder="contact@example.com" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#334155', fontSize: '0.95rem', outline: 'none' }} />
            </div>


            <div style={{ marginBottom: '32px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>Relation</label>
              <input type="text" value={modalData.relation} onChange={e => setModalData({...modalData, relation: e.target.value})} placeholder="e.g., Father, Doctor" style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0', background: '#f8fafc', color: '#334155', fontSize: '0.95rem', outline: 'none' }} />
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setModalOpen(false)} style={{ padding: '10px 24px', borderRadius: '50px', fontWeight: 600, background: '#ffffff', border: '1px solid #e2e8f0', color: '#334155', cursor: 'pointer' }}>Cancel</button>
              <button onClick={saveContact} style={{ padding: '10px 32px', borderRadius: '50px', fontWeight: 600, background: '#0ea5e9', border: 'none', color: '#ffffff', cursor: 'pointer', boxShadow: '0 4px 12px rgba(14, 165, 233, 0.3)' }}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Emergency;

