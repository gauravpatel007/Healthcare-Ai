import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import API from '../utils/api';

const Settings = () => {
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

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    name: '', age: 0, gender: '', weight: 0, height: 0, blood_type: '',
    allergies: '', conditions: '',
    ice1_name: '', ice1_rel: '', ice1_phone: '',
    ice2_name: '', ice2_rel: '', ice2_phone: ''
  });
  const [showSecondaryContact, setShowSecondaryContact] = useState(false);
  
  const [ice1Id, setIce1Id] = useState(null);
  const [ice2Id, setIce2Id] = useState(null);

  // Face login state
  const [faceLoginEnabled, setFaceLoginEnabled] = useState(false);
  const [faceSetupOpen, setFaceSetupOpen] = useState(false);
  const [faceModelsLoaded, setFaceModelsLoaded] = useState(false);
  const [faceLoading, setFaceLoading] = useState(false);
  const [faceCaptureStatus, setFaceCaptureStatus] = useState(''); // '' | 'loading' | 'scanning' | 'success' | 'error'
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  
  const [sharingLink, setSharingLink] = useState('');
  const [sharingLoading, setSharingLoading] = useState(false);
  const [showZoom, setShowZoom] = useState(false);

  // Tabs: 'profile' | 'security'
  const [activeTab, setActiveTab] = useState('profile');

  // Security state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorUri, setTwoFactorUri] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorSetupOpen, setTwoFactorSetupOpen] = useState(false);
  const [loginAlertsEnabled, setLoginAlertsEnabled] = useState(true);
  const [loginHistory, setLoginHistory] = useState([]);
  const [showAllLoginsModal, setShowAllLoginsModal] = useState(false);

  const handleGenerateLink = async () => {
    try {
      setSharingLoading(true);
      const res = await API.post('/share/generate');
      const url = `${window.location.origin}/shared/${res.token}`;
      setSharingLink(url);
      navigator.clipboard.writeText(url);
      alert('Secure link generated and copied to clipboard! It will expire in 24 hours.');
    } catch (e) {
      alert('Failed to generate secure link.');
    } finally {
      setSharingLoading(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const [data, authMe, contacts, history] = await Promise.all([
          API.get('/users/profile'),
          API.get('/auth/me').catch(() => null),
          API.get('/emergency/contacts').catch(() => []),
          API.get('/users/security/login-history').catch(() => null)
        ]);
        if (data) {
          const c1 = contacts && contacts.length > 0 ? contacts[0] : null;
          const c2 = contacts && contacts.length > 1 ? contacts[1] : null;
          
          if (c1) setIce1Id(c1.id);
          if (c2) setIce2Id(c2.id);

          setProfile(prev => ({
            ...prev,
            ...data,
            allergies: Array.isArray(data.allergies) ? data.allergies.join(', ') : data.allergies,
            conditions: Array.isArray(data.conditions) ? data.conditions.join(', ') : data.conditions,
            ice1_name: c1 ? c1.name : '', ice1_rel: c1 ? c1.relation : '', ice1_phone: c1 ? c1.phone : '',
            ice2_name: c2 ? c2.name : '', ice2_rel: c2 ? c2.relation : '', ice2_phone: c2 ? c2.phone : ''
          }));
        }
        if (authMe) {
          setFaceLoginEnabled(!!authMe.face_login_enabled);
          setTwoFactorEnabled(!!authMe.two_factor_enabled);
          setLoginAlertsEnabled(!!authMe.login_alerts_enabled);
        }
        if (history && history.data) {
          setLoginHistory(history.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      // Cleanup camera on unmount
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  // ─── Face Login Functions ────────────────────────
  const loadFaceModels = async () => {
    if (faceModelsLoaded) return true;
    const faceapi = window.faceapi;
    if (!faceapi) {
      setFaceCaptureStatus('error');
      return false;
    }
    try {
      await faceapi.nets.ssdMobilenetv1.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
      await faceapi.nets.faceLandmark68Net.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
      await faceapi.nets.faceRecognitionNet.loadFromUri('https://justadudewhohacks.github.io/face-api.js/models');
      setFaceModelsLoaded(true);
      return true;
    } catch (e) {
      console.error('Failed to load face models', e);
      setFaceCaptureStatus('error');
      return false;
    }
  };

  const startFaceVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      return true;
    } catch (e) {
      console.error('Camera access denied', e);
      setFaceCaptureStatus('error');
      return false;
    }
  };

  const stopFaceVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  const handleOpenFaceSetup = async () => {
    setFaceSetupOpen(true);
    setFaceCaptureStatus('loading');
    setFaceLoading(true);
    const [modelsOk, camOk] = await Promise.all([loadFaceModels(), startFaceVideo()]);
    setFaceLoading(false);
    if (modelsOk && camOk) {
      setFaceCaptureStatus('');
    }
  };

  const handleCloseFaceSetup = () => {
    stopFaceVideo();
    setFaceSetupOpen(false);
    setFaceCaptureStatus('');
  };

  const handleCaptureFace = async () => {
    const faceapi = window.faceapi;
    if (!faceapi || !faceModelsLoaded || !videoRef.current) {
      setFaceCaptureStatus('error');
      return;
    }
    setFaceCaptureStatus('scanning');
    try {
      const detection = await faceapi
        .detectSingleFace(videoRef.current)
        .withFaceLandmarks()
        .withFaceDescriptor();
      if (!detection) {
        setFaceCaptureStatus('error');
        alert('No face detected. Please look straight at the camera and try again.');
        return;
      }
      const descriptor = Array.from(detection.descriptor);
      await API.post('/auth/face-setup', { descriptor });
      setFaceCaptureStatus('success');
      setFaceLoginEnabled(true);
      setTimeout(() => {
        handleCloseFaceSetup();
      }, 1500);
    } catch (e) {
      console.error('Face capture failed', e);
      setFaceCaptureStatus('error');
      alert('Failed to save face data. Please try again.');
    }
  };

  const handleFaceDisable = async () => {
    if (!confirm('Disable face login? You will need to set it up again to use it.')) return;
    try {
      await API.post('/auth/face-disable');
      setFaceLoginEnabled(false);
      alert('Face login disabled successfully.');
    } catch (e) {
      console.error(e);
      alert('Failed to disable face login.');
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await API.post('/users/avatar', formData);
      if (res && res.avatar_url) {
        setProfile(prev => ({ ...prev, avatar_url: res.avatar_url }));
        alert('✅ Profile picture updated successfully!');
        window.location.reload(); // Force reload to update sidebar
      }
    } catch (error) {
      console.error('Avatar upload failed', error);
      alert('Failed to upload avatar');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const calculateBMI = (weight, height) => {
    if (!weight || !height) return 0;
    const h = height / 100;
    return (weight / (h * h)).toFixed(1);
  };

  const calculateBMR = (weight, height, age, gender) => {
    if (!weight || !height || !age) return 0;
    if (gender === 'Male') {
      return Math.round(88.362 + (13.397 * weight) + (4.799 * height) - (5.677 * age));
    }
    return Math.round(447.593 + (9.247 * weight) + (3.098 * height) - (4.330 * age));
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: profile.name,
        age: parseInt(profile.age) || 0,
        gender: profile.gender,
        blood_type: profile.blood_type,
        height: parseFloat(profile.height) || 0,
        weight: parseFloat(profile.weight) || 0,
        allergies: profile.allergies ? profile.allergies.split(',').map(s => s.trim()) : [],
        conditions: profile.conditions ? profile.conditions.split(',').map(s => s.trim()) : []
      };
      
      const saveContact = async (id, name, phone, rel) => {
        if (!name) {
          if (id) {
            await API.delete(`/emergency/contacts/${id}`);
          }
          return;
        }
        const contactPayload = { name, phone: phone || '', relation: rel || '' };
        if (id) {
          await API.put(`/emergency/contacts/${id}`, contactPayload);
        } else {
          await API.post('/emergency/contacts', contactPayload);
        }
      };

      await Promise.all([
        API.put('/users/profile', payload),
        saveContact(ice1Id, profile.ice1_name, profile.ice1_phone, profile.ice1_rel),
        saveContact(ice2Id, profile.ice2_name, profile.ice2_phone, profile.ice2_rel)
      ]);
      
      // Refresh to get any new IDs assigned by DB
      const contacts = await API.get('/emergency/contacts').catch(() => []);
      setIce1Id(contacts && contacts.length > 0 ? contacts[0].id : null);
      setIce2Id(contacts && contacts.length > 1 ? contacts[1].id : null);
      
      alert('💾 Profile changes saved successfully!');
    } catch (e) {
      alert('Failed to save profile');
    }
  };

  const handleExportExcel = () => {
    const headers = ['Field', 'Value'];
    const rows = [
      ['Name', profile.name],
      ['Age', profile.age],
      ['Gender', profile.gender],
      ['Weight (kg)', profile.weight],
      ['Height (cm)', profile.height],
      ['Blood Type', profile.blood_type],
      ['Allergies', profile.allergies],
      ['Medical Conditions', profile.conditions],
      ['Primary ICE Name', profile.ice1_name],
      ['Primary ICE Rel', profile.ice1_rel],
      ['Primary ICE Phone', profile.ice1_phone],
      ['Secondary ICE Name', profile.ice2_name],
      ['Secondary ICE Rel', profile.ice2_rel],
      ['Secondary ICE Phone', profile.ice2_phone],
    ];

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.map(item => `"${(item || '').toString().replace(/"/g, '""')}"`).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Healthcare_Profile.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadScript = (src) => new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });

  const handleExportPDF = async (e) => {
    const btn = e.target;
    const originalText = btn.innerText;
    try {
      btn.innerText = '⏳ Generating...';
      
      if (!window.jspdf) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js');
      }

      const { jsPDF } = window.jspdf;
      const doc = new jsPDF();

      doc.setFontSize(22);
      doc.text('Healthcare AI - Profile Data', 14, 20);
      
      doc.setFontSize(11);
      doc.setTextColor(100);
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);

      const rows = [
        ['Name', profile.name || ''],
        ['Age', profile.age?.toString() || ''],
        ['Gender', profile.gender || ''],
        ['Weight (kg)', profile.weight?.toString() || ''],
        ['Height (cm)', profile.height?.toString() || ''],
        ['Blood Type', profile.blood_type || ''],
        ['Allergies', profile.allergies || ''],
        ['Medical Conditions', profile.conditions || ''],
        ['Primary Emergency Contact', `${profile.ice1_name || 'N/A'} (${profile.ice1_rel || 'N/A'})`],
        ['Primary Emergency Phone', profile.ice1_phone || 'N/A']
      ];
      
      if (profile.ice2_name || profile.ice2_phone) {
        rows.push(['Secondary Emergency Contact', `${profile.ice2_name || 'N/A'} (${profile.ice2_rel || 'N/A'})`]);
        rows.push(['Secondary Emergency Phone', profile.ice2_phone || 'N/A']);
      }

      doc.autoTable({
        startY: 35,
        head: [['Attribute', 'Details']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 11, cellPadding: 5 }
      });

      doc.save('Healthcare_Profile.pdf');
    } catch (err) {
      console.error(err);
      alert('Failed to generate PDF');
    } finally {
      btn.innerText = originalText;
    }
  };

  if (loading || !profile) return <div className="empty-state"><span className="spinner"></span> Loading Settings...</div>;

  return (
    <div className="page-section active">
      {showZoom && profile.avatar_url && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out', backdropFilter: 'blur(5px)' }} onClick={() => setShowZoom(false)}>
          <img src={`http://localhost:8000${profile.avatar_url}`} alt="Avatar Zoom" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '24px', objectFit: 'contain', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
          <div style={{ position: 'absolute', top: '24px', right: '32px', color: 'white', fontSize: '2.5rem', fontWeight: '300' }}>&times;</div>
        </div>
      )}

      <div className="section-header" style={{ background: 'var(--bg-card)', padding: '24px 32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', background: 'rgba(37,99,235,0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', fontFamily: "'Inter', sans-serif" }}>Settings</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }}></span>
              Manage your profile and preferences
            </p>
          </div>
        </div>
      </div>

      <div className="grid-2 gap-md" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-card hover-lift" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', transition: 'transform 0.2s' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.25rem', fontWeight: 700 }}>👤 Personal Information</h3>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '28px', padding: '16px', background: 'var(--bg-secondary)', borderRadius: '16px' }}>
              <div style={{ position: 'relative', width: '84px', height: '84px', borderRadius: '50%', overflow: 'hidden', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', fontWeight: 600, cursor: profile.avatar_url ? 'zoom-in' : 'default', border: '3px solid var(--bg-card)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} onClick={() => profile.avatar_url && setShowZoom(true)}>
                {profile.avatar_url ? (
                  <img src={`http://localhost:8000${profile.avatar_url}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  profile.name?.charAt(0).toUpperCase() || 'U'
                )}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ fontWeight: 600, fontSize: '1.05rem' }}>Profile Picture</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Click picture to zoom, or upload new</div>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--bg-input)', padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', border: '1px solid var(--border-color)', width: 'fit-content', fontWeight: 600, marginTop: '4px', transition: 'all 0.2s ease-in-out' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                  Upload Image
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarUpload} />
                </label>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>Full Name</label>
              <input type="text" className="form-input" name="name" value={profile.name} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
            </div>
            <div className="grid-2 gap-md" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>Age</label>
                <input type="number" className="form-input" name="age" value={profile.age} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>Gender</label>
                <select className="form-select" name="gender" value={profile.gender} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
                  <option>Male</option><option>Female</option><option>Other</option>
                </select>
              </div>
            </div>
          </div>

          <div className="glass-card hover-lift" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', transition: 'transform 0.2s' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.25rem', fontWeight: 700 }}>🏥 Medical Profile</h3>
            <div className="grid-3 gap-md" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>Weight (kg)</label>
                <input type="number" className="form-input" name="weight" value={profile.weight} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>Height (cm)</label>
                <input type="number" className="form-input" name="height" value={profile.height} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
              </div>
              <div className="form-group">
                <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>Blood Type</label>
                <select className="form-select" name="blood_type" value={profile.blood_type} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
                  {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b}>{b}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>Allergies (comma separated)</label>
              <input type="text" className="form-input" name="allergies" value={profile.allergies} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
            </div>
            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label" style={{ marginBottom: '6px', display: 'block', fontSize: '0.85rem', fontWeight: 600 }}>Medical Conditions</label>
              <input type="text" className="form-input" name="conditions" value={profile.conditions} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
            </div>
          </div>

          <div className="glass-card hover-lift" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', transition: 'transform 0.2s', marginTop: showSecondaryContact ? 'auto' : '0' }}>
            <h3 style={{ marginBottom: '20px', fontSize: '1.25rem', fontWeight: 700 }}>🚨 Emergency Contacts (ICE)</h3>
            <div className="grid-2 gap-md" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input type="text" className="form-input" name="ice1_name" placeholder="Name" value={profile.ice1_name} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <input type="text" className="form-input" name="ice1_rel" placeholder="Relationship" value={profile.ice1_rel} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
              </div>
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <input type="tel" className="form-input" name="ice1_phone" placeholder="Phone Number" value={profile.ice1_phone} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
            </div>

            {showSecondaryContact && (
              <div id="secondary-contact-container" style={{
                marginTop: '20px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                paddingTop: '20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secondary Contact</h4>
                  <button className="btn btn-sm" onClick={() => {
                    setShowSecondaryContact(false);
                    setProfile(p => ({ ...p, ice2_name: '', ice2_rel: '', ice2_phone: '' }));
                  }} style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: '0.8rem', padding: 0, cursor: 'pointer' }}>✖ Remove</button>
                </div>
              <div className="grid-2 gap-md" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '12px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input type="text" className="form-input" name="ice2_name" placeholder="Name" value={profile.ice2_name} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
                </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input type="text" className="form-input" name="ice2_rel" placeholder="Relationship" value={profile.ice2_rel} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
                </div>
              </div>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <input type="tel" className="form-input" name="ice2_phone" placeholder="Phone Number" value={profile.ice2_phone} onChange={handleChange} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
                </div>
              </div>
            )}
            
            {!showSecondaryContact && (
              <button className="btn btn-sm btn-outline w-full" onClick={() => setShowSecondaryContact(true)} style={{ marginTop: '16px', borderRadius: '12px', width: '100%', padding: '10px', background: 'transparent', border: '1px solid var(--border-color)', color: 'var(--text-primary)', cursor: 'pointer' }}>+ Add another contact</button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', height: '100%' }}>
          
          <div className="glass-card hover-lift" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '1.2rem', fontWeight: 700 }}>🎯 Health Goals</h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>Dynamically calculated from your profile metrics.</p>
            <div className="grid-2 gap-md" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="list-item" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                <div className="item-icon" style={{ background: 'rgba(255, 107, 107, 0.1)', color: 'var(--accent)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🔥</div>
                <div className="item-content">
                  <div className="item-title" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Calories (TDEE)</div>
                  <div className="item-subtitle" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{Math.round(calculateBMR(profile.weight, profile.height, profile.age, profile.gender) * 1.55)} kcal</div>
                </div>
              </div>
              <div className="list-item" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                <div className="item-icon" style={{ background: 'rgba(0, 210, 211, 0.1)', color: 'var(--info)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>💧</div>
                <div className="item-content">
                  <div className="item-title" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Water Goal</div>
                  <div className="item-subtitle" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{Math.round(profile.weight * 0.033 * 10) / 10} L/day</div>
                </div>
              </div>
              <div className="list-item" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                <div className="item-icon" style={{ background: 'rgba(52, 211, 153, 0.1)', color: 'var(--success)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>💪</div>
                <div className="item-content">
                  <div className="item-title" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Protein Goal</div>
                  <div className="item-subtitle" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{Math.round(profile.weight * 1.2)} g/day</div>
                </div>
              </div>
              <div className="list-item" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                <div className="item-icon" style={{ background: 'rgba(108, 92, 231, 0.1)', color: 'var(--primary-light)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>⚖️</div>
                <div className="item-content">
                  <div className="item-title" style={{ fontWeight: 600, fontSize: '0.9rem' }}>Current BMI</div>
                  <div className="item-subtitle" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{calculateBMI(profile.weight, profile.height)}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card hover-lift" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '1.2rem', fontWeight: 700 }}>🔒 Security</h3>

            {/* Face Login Row */}
            <div className="list-item" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div className="item-icon" style={{ background: faceLoginEnabled ? 'rgba(34,197,94,0.10)' : 'rgba(37,99,235,0.10)', color: faceLoginEnabled ? 'var(--success)' : 'var(--primary)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 7a2 2 0 0 1 2-2h1"/><path d="M16 5h1a2 2 0 0 1 2 2v1"/><path d="M19 16v1a2 2 0 0 1-2 2h-1"/><path d="M8 19H7a2 2 0 0 1-2-2v-1"/><circle cx="12" cy="11" r="3"/><path d="M12 14v2"/></svg>
              </div>
              <div className="item-content" style={{ flex: 1 }}>
                <div className="item-title" style={{ fontWeight: 600 }}>Face Login</div>
                <div className="item-subtitle" style={{ fontSize: '0.8rem', color: faceLoginEnabled ? 'var(--success)' : 'var(--text-muted)' }}>
                  {faceLoginEnabled ? '✅ Enabled — your face is enrolled' : 'Biometric auth · Not configured'}
                </div>
              </div>
              {faceLoginEnabled ? (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleOpenFaceSetup} style={{ padding: '6px 12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Re-scan</button>
                  <button onClick={handleFaceDisable} style={{ padding: '6px 12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Disable</button>
                </div>
              ) : (
                <button onClick={handleOpenFaceSetup} style={{ padding: '6px 14px', borderRadius: '8px', background: 'linear-gradient(135deg, #2563eb, #06b6d4)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>Setup</button>
              )}
            </div>

            {/* 2FA Row */}
            <div className="list-item" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div className="item-icon" style={{ background: twoFactorEnabled ? 'rgba(34,197,94,0.10)' : 'rgba(37,99,235,0.10)', color: twoFactorEnabled ? 'var(--success)' : 'var(--primary)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              </div>
              <div className="item-content" style={{ flex: 1 }}>
                <div className="item-title" style={{ fontWeight: 600 }}>Two-Factor Authentication</div>
                <div className="item-subtitle" style={{ fontSize: '0.8rem', color: twoFactorEnabled ? 'var(--success)' : 'var(--text-muted)' }}>
                  {twoFactorEnabled ? '✅ Enabled — Authenticator App' : 'Additional security layer · Not configured'}
                </div>
              </div>
              {twoFactorEnabled ? (
                <button onClick={async () => {
                  if (confirm('Are you sure you want to disable 2FA?')) {
                    try {
                      await API.post('/auth/2fa/disable');
                      setTwoFactorEnabled(false);
                      alert('2FA Disabled.');
                    } catch (e) { alert('Failed to disable 2FA'); }
                  }
                }} style={{ padding: '6px 12px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>Disable</button>
              ) : (
                <button onClick={async () => {
                  try {
                    const res = await API.get('/auth/2fa/setup');
                    setTwoFactorSecret(res.data.secret);
                    setTwoFactorUri(res.data.uri);
                    setTwoFactorSetupOpen(true);
                  } catch (e) { alert('Failed to setup 2FA'); }
                }} style={{ padding: '6px 14px', borderRadius: '8px', background: 'linear-gradient(135deg, #2563eb, #06b6d4)', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', boxShadow: '0 2px 8px rgba(37,99,235,0.25)' }}>Setup</button>
              )}
            </div>

            {/* Login Alerts Row */}
            <div className="list-item" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '8px 0', borderBottom: '1px solid var(--border-color)' }}>
              <div className="item-icon" style={{ background: loginAlertsEnabled ? 'rgba(34,197,94,0.10)' : 'rgba(100,116,139,0.10)', color: loginAlertsEnabled ? 'var(--success)' : 'var(--text-muted)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
              </div>
              <div className="item-content" style={{ flex: 1 }}>
                <div className="item-title" style={{ fontWeight: 600 }}>Login Email Alerts</div>
                <div className="item-subtitle" style={{ fontSize: '0.8rem', color: loginAlertsEnabled ? 'var(--success)' : 'var(--text-muted)' }}>
                  {loginAlertsEnabled ? '✅ Enabled — Receiving alerts for new logins' : 'Alerts are paused'}
                </div>
              </div>
              <label style={{ position: 'relative', display: 'inline-block', width: '44px', height: '24px' }}>
                <input type="checkbox" checked={loginAlertsEnabled} onChange={async () => {
                  try {
                    const res = await API.put('/users/security/alerts-toggle');
                    setLoginAlertsEnabled(res.data.login_alerts_enabled);
                  } catch (e) { alert('Failed'); }
                }} style={{ opacity: 0, width: 0, height: 0 }} />
                <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: loginAlertsEnabled ? 'var(--primary)' : '#cbd5e1', transition: '.4s', borderRadius: '20px' }}>
                  <span style={{ position: 'absolute', height: '14px', width: '14px', left: loginAlertsEnabled ? '25px' : '5px', bottom: '5px', backgroundColor: 'white', transition: '.4s', borderRadius: '50%' }}></span>
                </span>
              </label>
            </div>

            {/* Login History */}
            <div style={{ marginTop: '12px' }}>
              <div style={{ marginBottom: '8px' }}>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-primary)', margin: 0 }}>Recent Logins</h4>
              </div>
              {loginHistory.length === 0 ? (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>No recent logins found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {loginHistory.slice(0, 1).map(h => (
                    <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '8px 12px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{h.ip_address}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: '180px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{h.user_agent}</span>
                      </div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{new Date(h.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                  {loginHistory.length > 1 && (
                    <button onClick={() => setShowAllLoginsModal(true)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: '4px 0', textAlign: 'left', marginTop: '4px' }}>
                      Show more
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Login History Modal Overlay via Portal */}
            {showAllLoginsModal && createPortal(
              <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'fadeIn 0.3s ease'
              }} onClick={(e) => { if (e.target === e.currentTarget) setShowAllLoginsModal(false); }}>
                <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '32px', width: '90%', maxWidth: '440px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', animation: 'modalIn 0.3s ease forwards' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>🕒 Recent Logins</h3>
                    <button type="button" onClick={() => setShowAllLoginsModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
                    {loginHistory.slice(0, 5).map(h => (
                      <div key={h.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '12px', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{h.ip_address}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={h.user_agent}>{h.user_agent}</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{new Date(h.created_at).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            , document.body)}

            {/* 2FA Setup Modal Overlay via Portal */}
            {twoFactorSetupOpen && createPortal(
              <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'fadeIn 0.3s ease'
              }} onClick={(e) => { if (e.target === e.currentTarget) setTwoFactorSetupOpen(false); }}>
                <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '36px', width: '90%', maxWidth: '400px', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', animation: 'modalIn 0.3s ease forwards' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>📱 Setup 2FA</h3>
                    <button type="button" onClick={() => setTwoFactorSetupOpen(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
                    Scan this QR code with an Authenticator app (like Google Authenticator or Authy), then enter the 6-digit code below.
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px', background: 'white', padding: '16px', borderRadius: '16px' }}>
                    {twoFactorUri && <QRCodeSVG value={twoFactorUri} size={180} />}
                  </div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '12px', textAlign: 'center', wordBreak: 'break-all' }}>
                    Manual key: <strong>{twoFactorSecret}</strong>
                  </p>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await API.post('/auth/2fa/verify-setup', { code: twoFactorCode });
                      setTwoFactorEnabled(true);
                      setTwoFactorSetupOpen(false);
                      alert('2FA Enabled successfully!');
                    } catch (err) {
                      alert('Invalid code. Please try again.');
                    }
                  }}>
                    <input type="text" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} placeholder="6-digit code" maxLength={6} required style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', marginBottom: '16px', textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }} />
                    <button type="submit" style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'linear-gradient(135deg, #2563eb, #06b6d4)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>Verify & Enable</button>
                  </form>
                </div>
              </div>
            , document.body)}

            {/* Face Setup Modal Overlay via Portal */}
            {faceSetupOpen && createPortal(
              <div style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                background: 'rgba(0,0,0,0.6)',
                backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                animation: 'fadeIn 0.3s ease'
              }}
                onClick={(e) => { if (e.target === e.currentTarget) handleCloseFaceSetup(); }}
              >
                <div style={{
                  background: 'var(--bg-card)',
                  borderRadius: '24px',
                  padding: '36px',
                  width: '90%',
                  maxWidth: '480px',
                  boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
                  animation: 'modalIn 0.3s ease forwards',
                  border: '1px solid var(--border-color)'
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', background: faceCaptureStatus === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(37,99,235,0.10)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={faceCaptureStatus === 'success' ? 'var(--success)' : 'var(--primary)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 7a2 2 0 0 1 2-2h1"/><path d="M16 5h1a2 2 0 0 1 2 2v1"/><path d="M19 16v1a2 2 0 0 1-2 2h-1"/><path d="M8 19H7a2 2 0 0 1-2-2v-1"/><circle cx="12" cy="11" r="3"/><path d="M12 14v2"/></svg>
                      </div>
                      <div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                          {faceCaptureStatus === 'success' ? '✅ Face Enrolled!' : '📸 Set Up Face Login'}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Biometric authentication</p>
                      </div>
                    </div>
                    <button type="button" onClick={handleCloseFaceSetup} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 8px', lineHeight: 1 }}
                      onMouseOver={(e) => e.currentTarget.style.color = 'var(--text-primary)'}
                      onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-muted)'}
                    >&times;</button>
                  </div>

                  {faceCaptureStatus !== 'success' && (
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: 1.6, marginTop: '8px' }}>
                      Position your face in the center of the frame with good lighting, then click <strong>"Capture & Enroll"</strong>.
                    </p>
                  )}

                  {/* Camera Preview */}
                  <div style={{
                    width: '100%',
                    height: '300px',
                    background: '#0f172a',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    position: 'relative',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: '20px',
                    border: faceCaptureStatus === 'success' ? '2.5px solid var(--success)' : faceCaptureStatus === 'error' ? '2.5px solid var(--danger)' : '2.5px solid rgba(37,99,235,0.3)',
                    transition: 'border-color 0.3s',
                    boxShadow: 'inset 0 4px 20px rgba(0,0,0,0.3)'
                  }}>
                    <video ref={videoRef} autoPlay muted playsInline style={{ height: '100%', transform: 'scaleX(-1)' }} />
                    
                    {/* Scanning overlay */}
                    {faceCaptureStatus === 'scanning' && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(37,99,235,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '1rem', fontWeight: 600
                      }}>
                        <span style={{ animation: 'pulse 1.5s infinite', background: 'rgba(0,0,0,0.4)', padding: '10px 20px', borderRadius: '12px' }}>🔍 Detecting face…</span>
                      </div>
                    )}
                    {/* Success overlay */}
                    {faceCaptureStatus === 'success' && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(34,197,94,0.25)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '1.2rem', fontWeight: 700
                      }}>
                        <span style={{ background: 'rgba(0,0,0,0.5)', padding: '12px 24px', borderRadius: '14px' }}>✅ Face Saved Successfully!</span>
                      </div>
                    )}
                    {/* Loading overlay */}
                    {(faceLoading || faceCaptureStatus === 'loading') && (
                      <div style={{
                        position: 'absolute', inset: 0,
                        background: 'rgba(15,23,42,0.9)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: '0.9rem', gap: '12px'
                      }}>
                        <span className="spinner" style={{ width: '32px', height: '32px' }}></span>
                        Loading AI models & camera…
                      </div>
                    )}
                    {/* Corner scan guides */}
                    {!faceLoading && faceCaptureStatus !== 'success' && (
                      <>
                        <div style={{ position: 'absolute', top: '20px', left: '20px', width: '40px', height: '40px', borderTop: '3px solid rgba(37,99,235,0.8)', borderLeft: '3px solid rgba(37,99,235,0.8)', borderRadius: '6px 0 0 0' }} />
                        <div style={{ position: 'absolute', top: '20px', right: '20px', width: '40px', height: '40px', borderTop: '3px solid rgba(37,99,235,0.8)', borderRight: '3px solid rgba(37,99,235,0.8)', borderRadius: '0 6px 0 0' }} />
                        <div style={{ position: 'absolute', bottom: '20px', left: '20px', width: '40px', height: '40px', borderBottom: '3px solid rgba(37,99,235,0.8)', borderLeft: '3px solid rgba(37,99,235,0.8)', borderRadius: '0 0 0 6px' }} />
                        <div style={{ position: 'absolute', bottom: '20px', right: '20px', width: '40px', height: '40px', borderBottom: '3px solid rgba(37,99,235,0.8)', borderRight: '3px solid rgba(37,99,235,0.8)', borderRadius: '0 0 6px 0' }} />
                      </>
                    )}
                  </div>

                  {/* Action Buttons */}
                  {faceCaptureStatus !== 'success' && (
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button
                        type="button"
                        onClick={handleCaptureFace}
                        disabled={faceLoading || faceCaptureStatus === 'scanning' || faceCaptureStatus === 'loading'}
                        style={{
                          flex: 1,
                          padding: '14px',
                          borderRadius: '12px',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          border: 'none',
                          cursor: (faceLoading || faceCaptureStatus === 'scanning') ? 'not-allowed' : 'pointer',
                          background: (faceLoading || faceCaptureStatus === 'scanning') ? '#94a3b8' : 'linear-gradient(135deg, #2563eb, #06b6d4)',
                          color: '#fff',
                          boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
                          transition: 'all 0.2s'
                        }}
                      >
                        {faceCaptureStatus === 'scanning' ? '🔍 Scanning…' : '📸 Capture & Enroll Face'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseFaceSetup}
                        style={{
                          padding: '14px 24px',
                          borderRadius: '12px',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                          background: 'transparent',
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  {faceCaptureStatus === 'success' && (
                    <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--success)', fontWeight: 600, margin: '0' }}>
                      You can now use Face Login on the sign-in screen! ✨
                    </p>
                  )}
                </div>
              </div>
            , document.body)}

            <div 
              className="list-item" 
              style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 0', opacity: 0.7 }}
            >
              <div className="item-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>⛓️</div>
              <div className="item-content" style={{ flex: 1 }}>
                <div className="item-title" style={{ fontWeight: 600 }}>Blockchain Sync</div>
                <div className="item-subtitle" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Tamper-proof medical records
                </div>
              </div>
              <span className="badge" style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: 'rgba(100,116,139,0.1)', color: 'var(--text-muted)' }}>
                COMING SOON
              </span>
            </div>
          </div>

          <div className="glass-card hover-lift" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,107,107,0.3)', transition: 'transform 0.2s', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ marginBottom: '12px', fontSize: '1.2rem', color: 'var(--danger)', fontWeight: 700 }}>🗄️ Data Management</h3>
            <div className="flex gap-sm mb-md" style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
               <button className="btn btn-secondary w-full" onClick={handleExportPDF} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>📄 Export PDF</button>
               <button className="btn btn-secondary w-full" onClick={handleExportExcel} style={{ flex: 1, padding: '10px', borderRadius: '10px', border: 'none', background: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontWeight: 600 }}>📊 Export Excel</button>
            </div>
            <button className="btn w-full" style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)', cursor: 'pointer', fontWeight: 600 }} onClick={() => confirm('Are you sure you want to reset all data?')}>🗑 Reset All Data</button>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '12px', textAlign: 'center' }}>
              Warning: Export fetches data from your private cloud. Resetting deletes all local data immediately.
            </p>
          </div>

          {/* Save Button */}
          <div id="right-col-save-zone">
            <div id="save-btn-wrapper" style={{ width: '100%' }}>
              <button className="btn w-full hover-lift" style={{ width: '100%', padding: '16px', fontSize: '1.05rem', borderRadius: '12px', fontWeight: 700, background: 'linear-gradient(135deg, #0ea5e9, #0284c7)', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 8px 24px rgba(14, 165, 233, 0.35)' }} onClick={handleSave}>
                💾 Save All Profile Changes
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Settings;
