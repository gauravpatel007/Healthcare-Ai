import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'react-hot-toast';
import API from '../utils/api';
import {
  Settings as SettingsIcon, User, Shield, Image as ImageIcon, Trash2, ShieldAlert,
  Bell, ScanFace, FileText, Download, Share2, Plus, X, Phone, Save, Activity, HeartPulse
} from 'lucide-react';

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
      toast.success('Secure link generated and copied to clipboard! It will expire in 24 hours.');
    } catch (e) {
      toast.error('Failed to generate secure link.');
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
          if (c2) {
            setIce2Id(c2.id);
            setShowSecondaryContact(true);
          }

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
        toast.error('No face detected. Please look straight at the camera and try again.');
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
      toast.error('Failed to save face data. Please try again.');
    }
  };

  const handleFaceDisable = async () => {
    if (!confirm('Disable face login? You will need to set it up again to use it.')) return;
    try {
      await API.post('/auth/face-disable');
      setFaceLoginEnabled(false);
      toast.success('Face login disabled successfully.');
    } catch (e) {
      console.error(e);
      toast.error('Failed to disable face login.');
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
        toast.success('Profile picture updated successfully!');
        window.location.reload(); // Force reload to update sidebar
      }
    } catch (error) {
      console.error('Avatar upload failed', error);
      toast.error('Failed to upload avatar');
    }
  };

  const handleAvatarRemove = async () => {
    if (!confirm('Remove profile picture?')) return;
    try {
      await API.put('/users/profile', { avatar_url: '' });
      setProfile(prev => ({ ...prev, avatar_url: null }));
      toast.success('Profile picture removed successfully!');
      window.location.reload(); // Force reload to update sidebar
    } catch (error) {
      console.error('Avatar remove failed', error);
      toast.error('Failed to remove avatar');
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

      toast.success('Profile changes saved successfully!');
    } catch (e) {
      toast.error('Failed to save profile');
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
      toast.error('Failed to generate PDF');
    } finally {
      btn.innerText = originalText;
    }
  };

  if (loading || !profile) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 relative">
      {showZoom && profile.avatar_url && (
        <div className="fixed inset-0 bg-black/85 z-[9999] flex items-center justify-center cursor-zoom-out backdrop-blur-sm transition-opacity" onClick={() => setShowZoom(false)}>
          <img src={`http://localhost:8000${profile.avatar_url}`} alt="Avatar Zoom" className="max-w-[90vw] max-h-[90vh] rounded-3xl object-contain shadow-2xl" />
          <div className="absolute top-6 right-8 text-white text-4xl font-light hover:text-gray-300 transition-colors">&times;</div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 lg:p-10 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-6 relative z-10 w-full">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
            <SettingsIcon size={32} />
          </div>
          <div>
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">Settings</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span>
              Manage your profile and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 w-fit">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'profile' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          <User size={18} /> Profile
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all ${activeTab === 'security' ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
        >
          <Shield size={18} /> Security
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="flex flex-col gap-8">

            {/* Personal Information */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <User className="text-blue-500" /> Personal Information
              </h3>

              <div className="flex items-center gap-6 mb-8 p-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                <div
                  className="relative w-24 h-24 rounded-full overflow-hidden bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-3xl font-bold cursor-pointer border-4 border-white dark:border-gray-800 shadow-md"
                  onClick={() => profile.avatar_url && setShowZoom(true)}
                >
                  {profile.avatar_url ? (
                    <img src={`http://localhost:8000${profile.avatar_url}`} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    profile.name?.charAt(0).toUpperCase() || 'U'
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="font-bold text-gray-900 dark:text-white text-lg">Profile Picture</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Click picture to zoom, or upload new</div>
                  <div className="flex gap-3 mt-2">
                    <label className="inline-flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-200 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                      <ImageIcon size={16} /> Upload
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                    {profile.avatar_url && (
                      <button
                        onClick={handleAvatarRemove}
                        className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                      >
                        <Trash2 size={16} /> Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Full Name</label>
                <input type="text" name="name" value={profile.name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
              </div>
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Age</label>
                  <input type="number" name="age" value={profile.age} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Gender</label>
                  <select name="gender" value={profile.gender} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow">
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Medical Profile */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <Activity className="text-rose-500" /> Medical Profile
              </h3>
              <div className="grid grid-cols-3 gap-4 mb-5">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Weight (kg)</label>
                  <input type="number" name="weight" value={profile.weight} onChange={handleChange} className="w-full px-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Height (cm)</label>
                  <input type="number" name="height" value={profile.height} onChange={handleChange} className="w-full px-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Blood Type</label>
                  <select name="blood_type" value={profile.blood_type} onChange={handleChange} className="w-full px-3 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow">
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(b => <option key={b}>{b}</option>)}
                  </select>
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Allergies (comma separated)</label>
                <input type="text" name="allergies" value={profile.allergies} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Medical Conditions</label>
                <input type="text" name="conditions" value={profile.conditions} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
              </div>
            </div>

          </div>

          <div className="flex flex-col gap-8 h-full">

            {/* Emergency Contacts */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <HeartPulse className="text-red-500" /> Emergency Contacts (ICE)
              </h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <input type="text" name="ice1_name" placeholder="Name" value={profile.ice1_name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                </div>
                <div>
                  <input type="text" name="ice1_rel" placeholder="Relationship" value={profile.ice1_rel} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                </div>
              </div>
              <div className="mb-4">
                <input type="tel" name="ice1_phone" placeholder="Phone Number" value={profile.ice1_phone} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
              </div>

              {showSecondaryContact && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Secondary Contact</h4>
                    <button onClick={() => { setShowSecondaryContact(false); setProfile(p => ({ ...p, ice2_name: '', ice2_rel: '', ice2_phone: '' })); }} className="text-red-500 hover:text-red-600 text-sm font-semibold flex items-center gap-1 transition-colors">
                      <X size={14} /> Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <input type="text" name="ice2_name" placeholder="Name" value={profile.ice2_name} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                    </div>
                    <div>
                      <input type="text" name="ice2_rel" placeholder="Relationship" value={profile.ice2_rel} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                    </div>
                  </div>
                  <div>
                    <input type="tel" name="ice2_phone" placeholder="Phone Number" value={profile.ice2_phone} onChange={handleChange} className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow" />
                  </div>
                </div>
              )}

              {!showSecondaryContact && (
                <button onClick={() => setShowSecondaryContact(true)} className="mt-4 w-full py-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 font-semibold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <Plus size={18} /> Add another contact
                </button>
              )}
            </div>

            {/* Data Management & Save */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <FileText className="text-indigo-500" /> Data Management
              </h3>
              <div className="flex gap-4 mb-4">
                <button onClick={handleExportPDF} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600">
                  <Download size={18} /> Export PDF
                </button>
                <button onClick={handleExportExcel} className="flex-1 flex items-center justify-center gap-2 py-3 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors border border-gray-200 dark:border-gray-600">
                  <Download size={18} /> Export Excel
                </button>
              </div>
              <button onClick={() => confirm('Are you sure you want to reset all data?')} className="w-full py-3 rounded-xl font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors border border-red-100 dark:border-red-900/50 mb-6">
                Reset All Data
              </button>

              <button onClick={handleSave} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-blue-700 shadow-md shadow-blue-500/25 transition-all active:scale-[0.98]">
                <Save size={20} /> Save All Changes
              </button>
            </div>

          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="flex flex-col gap-8">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <ShieldAlert className="text-emerald-500" /> Security Settings
            </h3>

            {/* Face Login Row */}
            <div className="flex items-center justify-between py-5 border-b border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${faceLoginEnabled ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                  <ScanFace size={24} />
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">Face Login</div>
                  <div className={`text-sm ${faceLoginEnabled ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    {faceLoginEnabled ? '✅ Enabled — your face is enrolled' : 'Biometric auth · Not configured'}
                  </div>
                </div>
              </div>
              {faceLoginEnabled ? (
                <div className="flex gap-2">
                  <button onClick={handleOpenFaceSetup} className="px-4 py-2 rounded-xl text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 transition-colors">Re-scan</button>
                  <button onClick={handleFaceDisable} className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors">Disable</button>
                </div>
              ) : (
                <button onClick={handleOpenFaceSetup} className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors">Setup</button>
              )}
            </div>

            {/* 2FA Row */}
            <div className="flex items-center justify-between py-5 border-b border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${twoFactorEnabled ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                  <Shield size={24} />
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">Two-Factor Authentication</div>
                  <div className={`text-sm ${twoFactorEnabled ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    {twoFactorEnabled ? '✅ Enabled — Authenticator App' : 'Additional security layer · Not configured'}
                  </div>
                </div>
              </div>
              {twoFactorEnabled ? (
                <button onClick={async () => {
                  if (confirm('Are you sure you want to disable 2FA?')) {
                    try {
                      await API.post('/auth/2fa/disable');
                      setTwoFactorEnabled(false);
                      toast.success('2FA Disabled.');
                    } catch (e) { toast.error('Failed to disable 2FA'); }
                  }
                }} className="px-4 py-2 rounded-xl text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 transition-colors">Disable</button>
              ) : (
                <button onClick={async () => {
                  try {
                    const res = await API.get('/auth/2fa/setup');
                    setTwoFactorSecret(res.data.secret);
                    setTwoFactorUri(res.data.uri);
                    setTwoFactorSetupOpen(true);
                  } catch (e) { toast.error('Failed to setup 2FA'); }
                }} className="px-5 py-2 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors">Setup</button>
              )}
            </div>

            {/* Login Alerts Row */}
            <div className="flex items-center justify-between py-5 border-b border-gray-100 dark:border-gray-700/50">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${loginAlertsEnabled ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                  <Bell size={24} />
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">Login Email Alerts</div>
                  <div className={`text-sm ${loginAlertsEnabled ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                    {loginAlertsEnabled ? '✅ Enabled — Receiving alerts for new logins' : 'Alerts are paused'}
                  </div>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" checked={loginAlertsEnabled} onChange={async () => {
                  try {
                    const res = await API.put('/users/security/alerts-toggle');
                    setLoginAlertsEnabled(res.data.login_alerts_enabled);
                  } catch (e) { toast.error('Failed'); }
                }} />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Login History */}
            <div className="py-5">
              <h4 className="font-bold text-gray-900 dark:text-white mb-4">Recent Logins</h4>
              {loginHistory.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent logins found.</p>
              ) : (
                <div className="flex flex-col gap-3">
                  {loginHistory.slice(0, 2).map(h => (
                    <div key={h.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{h.ip_address}</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate" title={h.user_agent}>{h.user_agent}</span>
                      </div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">{new Date(h.created_at).toLocaleString()}</span>
                    </div>
                  ))}
                  {loginHistory.length > 2 && (
                    <button onClick={() => setShowAllLoginsModal(true)} className="text-sm font-bold text-blue-600 hover:text-blue-700 mt-2 self-start transition-colors">
                      Show more login history...
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Blockchain */}
            <div className="flex items-center justify-between py-5 opacity-60">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-amber-50 text-amber-500 dark:bg-amber-900/20 dark:text-amber-400">
                  <Share2 size={24} />
                </div>
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">Blockchain Sync</div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">Tamper-proof medical records</div>
                </div>
              </div>
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 text-xs font-bold rounded-lg uppercase tracking-wider">Coming Soon</span>
            </div>
          </div>
        </div>
      )}

      {/* Login History Modal Overlay */}
      {showAllLoginsModal && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) setShowAllLoginsModal(false); }}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">🕒 Recent Logins</h3>
              <button onClick={() => setShowAllLoginsModal(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X size={24} />
              </button>
            </div>
            <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
              {loginHistory.map(h => (
                <div key={h.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-700/50">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{h.ip_address}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate" title={h.user_agent}>{h.user_agent}</span>
                  </div>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">{new Date(h.created_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        , document.body)}

      {/* 2FA Setup Modal */}
      {twoFactorSetupOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) setTwoFactorSetupOpen(false); }}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">📱 Setup 2FA</h3>
              <button onClick={() => setTwoFactorSetupOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X size={24} />
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Scan this QR code with an Authenticator app (like Google Authenticator or Authy), then enter the 6-digit code below.
            </p>
            <div className="flex justify-center mb-6">
              <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 inline-block">
                {twoFactorUri && <QRCodeSVG value={twoFactorUri} size={180} />}
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-4 text-center break-all">
              Manual key: <strong className="text-gray-600 dark:text-gray-300">{twoFactorSecret}</strong>
            </p>
            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                await API.post('/auth/2fa/verify-setup', { code: twoFactorCode });
                setTwoFactorEnabled(true);
                setTwoFactorSetupOpen(false);
                toast.success('2FA Enabled successfully!');
              } catch (err) {
                toast.error('Invalid code. Please try again.');
              }
            }}>
              <input type="text" value={twoFactorCode} onChange={(e) => setTwoFactorCode(e.target.value)} placeholder="6-digit code" maxLength={6} required className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-shadow mb-4 text-center tracking-[0.25em] text-lg font-bold" />
              <button type="submit" className="w-full py-4 rounded-xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-colors">Verify & Enable</button>
            </form>
          </div>
        </div>
        , document.body)}

      {/* Face Setup Modal */}
      {faceSetupOpen && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) handleCloseFaceSetup(); }}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 w-full max-w-lg shadow-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${faceCaptureStatus === 'success' ? 'bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400'}`}>
                  <ScanFace size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {faceCaptureStatus === 'success' ? 'Face Enrolled!' : 'Set Up Face Login'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Biometric authentication</p>
                </div>
              </div>
              <button onClick={handleCloseFaceSetup} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
                <X size={24} />
              </button>
            </div>

            {faceCaptureStatus !== 'success' && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Position your face in the center of the frame with good lighting, then click <strong>"Capture & Enroll"</strong>.
              </p>
            )}

            <div className={`w-full h-72 bg-gray-900 rounded-2xl overflow-hidden relative flex justify-center items-center mb-6 border-4 ${faceCaptureStatus === 'success' ? 'border-green-500' : faceCaptureStatus === 'error' ? 'border-red-500' : 'border-blue-500/30'}`}>
              <video ref={videoRef} autoPlay muted playsInline className="h-full scale-x-[-1]" />

              {faceCaptureStatus === 'scanning' && (
                <div className="absolute inset-0 bg-blue-500/10 flex items-center justify-center">
                  <span className="bg-black/60 text-white px-4 py-2 rounded-xl font-bold animate-pulse">🔍 Detecting face…</span>
                </div>
              )}
              {faceCaptureStatus === 'success' && (
                <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
                  <span className="bg-black/60 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg">✅ Face Saved Successfully!</span>
                </div>
              )}
              {(faceLoading || faceCaptureStatus === 'loading') && (
                <div className="absolute inset-0 bg-gray-900/90 flex flex-col items-center justify-center text-white text-sm gap-3 font-medium">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  Loading AI models & camera…
                </div>
              )}
            </div>

            {faceCaptureStatus !== 'success' && (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCaptureFace}
                  disabled={faceLoading || faceCaptureStatus === 'scanning' || faceCaptureStatus === 'loading'}
                  className={`flex-1 py-4 rounded-xl font-bold text-white shadow-sm transition-colors ${faceLoading || faceCaptureStatus === 'scanning' ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {faceCaptureStatus === 'scanning' ? 'Scanning…' : '📸 Capture & Enroll Face'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseFaceSetup}
                  className="px-6 py-4 rounded-xl font-bold text-gray-600 dark:text-gray-300 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {faceCaptureStatus === 'success' && (
              <p className="text-center text-sm font-bold text-green-600 dark:text-green-400">
                You can now use Face Login on the sign-in screen! ✨
              </p>
            )}
          </div>
        </div>
        , document.body)}

    </div>
  );
};

export default Settings;
