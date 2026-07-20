import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import API from '../utils/api';
import DashboardOverview from './DashboardOverview';
import AIChat from './AIChat';
import AIFitness from './AIFitness';
import Appointments from './Appointments';
import Records from './Records';
import Medicine from './Medicine';
import Analytics from './Analytics';
import AISymptom from './AISymptom';
import AINutrition from './AINutrition';
import AIMental from './AIMental';
import Trackers from './Trackers';
import Settings from './Settings';
import Emergency from './Emergency';
import VoiceLogger from '../components/VoiceLogger';
import ThemeToggle from '../components/ThemeToggle';



const Sidebar = () => {

  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState({ name: 'Loading...', email: '' });
  const savedAccounts = API.getSavedAccounts();

  useEffect(() => {
    API.get('/auth/me').then(res => {
      if (res) setCurrentUser({ 
        name: res.name || res.email.split('@')[0], 
        email: res.email,
        avatar_url: res.avatar_url
      });
      API.saveCurrentAccount();
    }).catch(() => {
      // Ignore
    });
  }, []);

  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  const handleLogout = (e, email = null) => {
    if (e) e.stopPropagation();
    API.logout(email);
  };
  
  const handleAccountSwitch = (email, e) => {
    e.stopPropagation();
    API.switchAccount(email);
  };
  
  const handleAddAccount = (e) => {
    e.stopPropagation();
    window.location.href = '/?login=true';
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/app', icon: '📊', colorBg: 'rgba(37, 99, 235, 0.15)' },
    { id: 'appointments', label: 'Appointments', path: '/app/appointments', icon: '📅', colorBg: 'rgba(34, 197, 94, 0.15)' },
    { id: 'records', label: 'Records', path: '/app/records', icon: '📁', colorBg: 'rgba(245, 158, 11, 0.15)' },
    { id: 'medicine', label: 'Medicines', path: '/app/medicine', icon: '💊', colorBg: 'rgba(239, 68, 68, 0.15)' },
    { id: 'analytics', label: 'Statistics', path: '/app/analytics', icon: '📈', colorBg: 'rgba(139, 92, 246, 0.15)' },
  ];

  const toolItems = [
    { id: 'ai-chat', label: 'AI Chat', path: '/app/ai-chat', icon: '🤖', colorBg: 'rgba(6, 182, 212, 0.15)' },
    { id: 'ai-symptom', label: 'Symptom Checker', path: '/app/ai-symptom', icon: '🩺', colorBg: 'rgba(37, 99, 235, 0.15)' },
    { id: 'ai-nutrition', label: 'Nutrition', path: '/app/ai-nutrition', icon: '🥗', colorBg: 'rgba(34, 197, 94, 0.15)' },
    { id: 'ai-fitness', label: 'Fitness', path: '/app/ai-fitness', icon: '🏋️', colorBg: 'rgba(245, 158, 11, 0.15)' },
    { id: 'ai-mental', label: 'Mental Health', path: '/app/ai-mental', icon: '🧠', colorBg: 'rgba(139, 92, 246, 0.15)' },
    { id: 'trackers', label: 'Trackers', path: '/app/trackers', icon: '🎯', colorBg: 'rgba(59, 130, 246, 0.15)' },
    { id: 'emergency', label: 'Emergency', path: '/app/emergency', icon: '🚨', colorBg: 'rgba(239, 68, 68, 0.15)' },
    { id: 'settings', label: 'Settings', path: '/app/settings', icon: '⚙️', colorBg: 'rgba(100, 116, 139, 0.15)' },
  ];

  const renderNavItems = (items) => (
    items.map(item => {
      const isActive = location.pathname === item.path || (item.path === '/app' && location.pathname === '/app/');
      return (
        <div key={item.id} className={`sidebar-nav-item ${isActive ? 'active' : ''}`} onClick={() => navigate(item.path)}>
          <span style={{ display: 'flex', alignItems: 'center' }}>
            <span className="nav-icon" style={{
              background: isActive ? 'rgba(255,255,255,0.2)' : item.colorBg,
              color: isActive ? '#ffffff' : 'var(--text-secondary)',
              display: 'inline-flex', width: '32px', height: '32px', alignItems: 'center', justifyContent: 'center', borderRadius: '10px', marginRight: '12px', boxShadow: '0 2px 5px rgba(0,0,0,0.02)'
            }}>
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{item.icon}</span>
            </span>
            {item.label}
          </span>
        </div>
      );
    })
  );

  return (
    <aside className="sidebar">
      <div className="sidebar-logo" onClick={() => navigate('/app')}>
        <div className="logo-icon">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1", fontSize: '20px' }}>favorite</span>
        </div>
        <h2>LifeOS</h2>
      </div>

      <div className="sidebar-section-label">General</div>
      {renderNavItems(navItems)}

      <div className="sidebar-section-label mt-4">Tools</div>
      {renderNavItems(toolItems)}

      {/* Removed standalone Log out item, moved into dropdown */}

      <div className="sidebar-user" ref={dropdownRef} onClick={() => setDropdownOpen(!dropdownOpen)} style={{ position: 'relative', marginTop: 'auto' }}>
        <div className="user-avatar" style={{ overflow: 'hidden' }}>
          {currentUser.avatar_url ? (
            <img src={`http://localhost:8000${currentUser.avatar_url}`} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            currentUser.name?.charAt(0).toUpperCase() || 'U'
          )}
        </div>
        <div className="user-info">
          <div className="user-name">{currentUser.name}</div>
          <div className="user-email">{currentUser.email}</div>
        </div>
        <span className="user-chevron" style={{ transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>▾</span>
        
        {/* Account Switcher Dropdown */}
        {dropdownOpen && (
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
            position: 'absolute', bottom: 'calc(100% + 12px)', left: '-12px', right: '-12px',
            background: 'var(--bg-card)', borderRadius: '16px',
            border: '1px solid var(--border-color)',
            boxShadow: '0 -10px 40px rgba(0,0,0,0.15)',
            overflow: 'hidden', zIndex: 100, animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Switch Account
            </div>
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {savedAccounts.map(acc => (
                <div key={acc.email} 
                  onClick={(e) => acc.email !== currentUser.email ? handleAccountSwitch(acc.email, e) : null}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px',
                    cursor: acc.email === currentUser.email ? 'default' : 'pointer',
                    background: acc.email === currentUser.email ? 'var(--bg-secondary)' : 'transparent',
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 600 }}>
                      {acc.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{acc.name}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{acc.email}</div>
                    </div>
                  </div>
                  {acc.email === currentUser.email && <span style={{ color: 'var(--success)', fontSize: '1rem' }}>✓</span>}
                </div>
              ))}
            </div>
            <div onClick={handleAddAccount} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary)', borderBottom: '1px solid var(--border-color)' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(37,99,235,0.05)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>+</span> Add another account
            </div>
            <div onClick={(e) => handleLogout(e, currentUser.email)} style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, color: 'var(--danger)' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.05)'} onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              Log out
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

const Placeholder = ({ title }) => (
  <div className="page-section active">
    <div className="section-header">
      <h2>{title}</h2>
    </div>
    <div className="bg-white rounded-[20px] p-8 shadow-sm">
      <p>This module is being migrated to React.</p>
    </div>
  </div>
);

const allFeatures = [
  { id: 'dashboard', label: 'Dashboard', path: '/app' },
  { id: 'appointments', label: 'Appointments', path: '/app/appointments' },
  { id: 'records', label: 'Records', path: '/app/records' },
  { id: 'medicine', label: 'Medicines', path: '/app/medicine' },
  { id: 'analytics', label: 'Statistics', path: '/app/analytics' },
  { id: 'ai-chat', label: 'AI Chat', path: '/app/ai-chat' },
  { id: 'ai-symptom', label: 'Symptom Checker', path: '/app/ai-symptom' },
  { id: 'ai-nutrition', label: 'Nutrition', path: '/app/ai-nutrition' },
  { id: 'ai-fitness', label: 'Fitness', path: '/app/ai-fitness' },
  { id: 'ai-mental', label: 'Mental Health', path: '/app/ai-mental' },
  { id: 'trackers', label: 'Trackers', path: '/app/trackers' },
  { id: 'emergency', label: 'Emergency', path: '/app/emergency' },
  { id: 'settings', label: 'Settings', path: '/app/settings' },
];

const AppDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname === '/app' || location.pathname === '/app/';

  const [healthData, setHealthData] = useState({});
  const [recentRecords, setRecentRecords] = useState([]);
  const [myMeds, setMyMeds] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [waterIntake, setWaterIntake] = useState(0);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [voiceAction, setVoiceAction] = useState(null);
  
  const [isSharing, setIsSharing] = useState(false);
  const [sharedLink, setSharedLink] = useState('');

  // Feature ID → route path mapping
  const featureRoutes = {
    'dashboard': '/app',
    'appointments': '/app/appointments',
    'records': '/app/records',
    'medicine': '/app/medicine',
    'analytics': '/app/analytics',
    'ai-chat': '/app/ai-chat',
    'ai-symptom': '/app/ai-symptom',
    'ai-nutrition': '/app/ai-nutrition',
    'ai-fitness': '/app/ai-fitness',
    'ai-mental': '/app/ai-mental',
    'trackers': '/app/trackers',
    'settings': '/app/settings',
    'emergency': '/app/emergency',
  };

  const handleVoiceAction = (action) => {
    // Handle logout directly
    if (action.target_feature === 'auth' && action.action_name === 'logout') {
      if (confirm('Are you sure you want to log out?')) {
        API.logout();
        navigate('/login');
      }
      return;
    }

    const route = featureRoutes[action.target_feature];
    if (!route) {
      alert(`Unknown feature: ${action.target_feature}`);
      return;
    }
    // Clear any previous action, then set the new one
    setVoiceAction(null);
    // Navigate first
    navigate(route);
    // Set the action after a small delay so the target page has time to mount
    setTimeout(() => {
      setVoiceAction(action);
    }, 300);
  };

  useEffect(() => {
    if (isDashboard && API.isAuthenticated()) {
      const fetchRightPanelData = async () => {
        try {
          const [hData, records, meds, apts, waterRes, profile, contacts] = await Promise.all([
            API.get('/trackers/health-data').catch(() => ({})),
            API.get('/records').catch(() => []),
            API.get('/medicines').catch(() => []),
            API.get('/appointments').catch(() => []),
            API.get('/trackers/water').catch(() => ({glasses: 0})),
            API.get('/users/profile').catch(() => null),
            API.get('/emergency/contacts').catch(() => [])
          ]);
          
          if (profile) {
            localStorage.setItem('offline_medical_id', JSON.stringify({ profile, contacts: contacts || [] }));
          }

          setHealthData(hData || {});
          setRecentRecords(records ? records.slice(0, 2) : []);
          setMyMeds(meds ? meds.filter(m => m.is_active).slice(0, 3) : []);
          setAppointments(apts || []);
          setWaterIntake(waterRes?.glasses || 0);
        } catch (error) {
          console.error('Failed to load right panel data', error);
        }
      };
      fetchRightPanelData();
    }
  }, [isDashboard]);

  useEffect(() => {
    if (!API.isAuthenticated()) {
      navigate('/');
    }
  }, [navigate]);

  const handleShareSummary = async () => {
    setIsSharing(true);
    try {
      const res = await API.post('/share/generate');
      setSharedLink(`${window.location.origin}/shared/${res.token}`);
    } catch (e) {
      alert('Failed to generate sharing link.');
    } finally {
      setIsSharing(false);
    }
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const renderCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startDayIndex = firstDay === 0 ? 6 : firstDay - 1;
    const daysInPrevMonth = new Date(year, month, 0).getDate();
    const days = [];

    const actualToday = new Date();
    const isCurrentMonth = actualToday.getFullYear() === year && actualToday.getMonth() === month;
    const actualTodayDate = actualToday.getDate();

    for (let i = startDayIndex - 1; i >= 0; i--) {
      days.push(<div key={`prev-${i}`} className="cal-day other">{daysInPrevMonth - i}</div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      const hasApt = appointments.some(a => a.date && a.date.startsWith(dateStr));
      const isActualToday = isCurrentMonth && i === actualTodayDate;
      
      let classes = "cal-day";
      if (isActualToday) classes += " today";
      if (hasApt) {
        classes += " has-event";
        const isPast = (year < actualToday.getFullYear()) ||
                       (year === actualToday.getFullYear() && month < actualToday.getMonth()) ||
                       (year === actualToday.getFullYear() && month === actualToday.getMonth() && i < actualTodayDate);
        if (isPast) classes += " past-event";
      }

      days.push(<div key={`cur-${i}`} className={classes}>{i}</div>);
    }

    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push(<div key={`next-${i}`} className="cal-day other">{i}</div>);
    }

    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const filteredFeatures = searchQuery 
    ? allFeatures.filter(f => f.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content" style={{ padding: '30px', overflowY: 'auto' }}>
        <div className="content-area">
          <Routes>
            <Route path="/" element={<DashboardOverview />} />
            <Route path="/appointments" element={<Appointments voiceAction={voiceAction} onVoiceActionConsumed={() => setVoiceAction(null)} />} />
            <Route path="/records" element={<Records voiceAction={voiceAction} onVoiceActionConsumed={() => setVoiceAction(null)} />} />
            <Route path="/medicine" element={<Medicine voiceAction={voiceAction} onVoiceActionConsumed={() => setVoiceAction(null)} />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/ai-chat" element={<AIChat voiceAction={voiceAction} onVoiceActionConsumed={() => setVoiceAction(null)} />} />
            <Route path="/ai-symptom" element={<AISymptom voiceAction={voiceAction} onVoiceActionConsumed={() => setVoiceAction(null)} />} />
            <Route path="/ai-nutrition" element={<AINutrition voiceAction={voiceAction} onVoiceActionConsumed={() => setVoiceAction(null)} />} />
            <Route path="/ai-fitness" element={<AIFitness voiceAction={voiceAction} onVoiceActionConsumed={() => setVoiceAction(null)} />} />
            <Route path="/ai-mental" element={<AIMental voiceAction={voiceAction} onVoiceActionConsumed={() => setVoiceAction(null)} />} />
            <Route path="/trackers" element={<Trackers />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/emergency" element={<Emergency voiceAction={voiceAction} onVoiceActionConsumed={() => setVoiceAction(null)} />} />
          </Routes>
        </div>
      </main>
      <aside className="right-panel">
        {location.pathname === '/app' || location.pathname === '/app/' ? (
          <>
            {/* Search Bar and Voice Logger */}
            <div style={{ position: 'relative', zIndex: 50, display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px 18px', borderRadius: '16px', background: 'rgba(255, 255, 255, 0.04)', boxShadow: '0 8px 32px rgba(37, 99, 235, 0.1), inset 0 1px 2px rgba(255, 255, 255, 0.1)', border: '1px solid rgba(255, 255, 255, 0.1)', backdropFilter: 'blur(24px)', flex: 1 }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '12px', opacity: 0.8 }}>
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input 
                  type="text" 
                  className="no-focus-ring"
                  placeholder="Search features..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-primary)', width: '100%', outline: 'none', fontSize: '1.05rem', fontWeight: 500, letterSpacing: '0.2px' }} 
                />
              </div>

              
              {/* Search Results Dropdown */}
              {searchQuery && (
                <div style={{ 
                  position: 'absolute', top: '100%', left: 0, right: 0, marginTop: '8px', 
                  background: 'var(--panel-bg)', borderRadius: '16px', padding: '8px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)', border: '1px solid var(--border-light)',
                  maxHeight: '300px', overflowY: 'auto'
                }}>
                  {filteredFeatures.length > 0 ? (
                    filteredFeatures.map(f => (
                      <div 
                        key={f.id} 
                        onClick={() => {
                          setSearchQuery('');
                          navigate(f.path);
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', padding: '10px 14px',
                          borderRadius: '10px', cursor: 'pointer', transition: 'background 0.2s',
                          gap: '12px'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-body)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                      >
                        <span style={{ fontSize: '1.2rem' }}>{f.icon}</span>
                        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>{f.label}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ padding: '12px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      No features found
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Share Health Summary Button */}
            <div style={{ marginTop: '16px' }}>
              {!sharedLink ? (
                <button 
                  onClick={handleShareSummary} 
                  disabled={isSharing}
                  style={{ width: '100%', padding: '12px', borderRadius: '12px', background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
                >
                  <span style={{ fontSize: '1.2rem' }}>{isSharing ? '⌛' : '🔗'}</span> 
                  {isSharing ? 'Generating...' : 'Share Doctor Summary'}
                </button>
              ) : (
                <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid rgba(34, 197, 94, 0.2)', padding: '12px', borderRadius: '12px' }}>
                  <p style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>Link generated successfully!</p>
                  <input type="text" readOnly value={sharedLink} style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #bbf7d0', fontSize: '0.85rem', marginBottom: '8px', background: 'white' }} onClick={e => e.target.select()} />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => navigator.clipboard.writeText(sharedLink)} style={{ flex: 1, padding: '8px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>Copy</button>
                    <button onClick={() => window.open(sharedLink, '_blank')} style={{ flex: 1, padding: '8px', background: '#e2e8f0', color: '#0f172a', border: 'none', borderRadius: '8px', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>Preview</button>
                  </div>
                </div>
              )}
            </div>

            {/* Calendar */}
            <div className="g-card hover-lift">
              <h2 style={{ marginBottom: '12px', fontSize: '1.15rem', fontWeight: 700 }}>Calendar</h2>
              <div className="cal-widget">
                <div className="cal-header-row">
                  <div>
                    <div className="cal-small-label">{currentDate.getFullYear()}</div>
                    <div className="cal-big-date">{monthNames[currentDate.getMonth()]}</div>
                  </div>
                  <div className="cal-nav">
                    <button className="cal-arrow" onClick={prevMonth}>‹</button>
                    <button className="cal-arrow" onClick={nextMonth}>›</button>
                  </div>
                </div>
                <div className="cal-day-names">
                  <div>Mon</div><div>Tue</div><div>Wed</div><div>Thu</div><div>Fri</div><div>Sat</div><div>Sun</div>
                </div>
                <div className="cal-days-grid">
                  {renderCalendarDays()}
                </div>
              </div>
            </div>

            {/* Quick Vitals */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div className="glass-card hover-lift" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: 'var(--danger)' }}>❤️</div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Heart Rate</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{healthData?.heart_rate?.[healthData.heart_rate.length - 1]?.value || 0} <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>bpm</span></div>
                </div>
              </div>
              <div className="glass-card hover-lift" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: 'var(--primary)' }}>💧</div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Hydration</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{(waterIntake * 0.2).toFixed(1)}L</div>
                </div>
              </div>
              <div className="glass-card hover-lift" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: 'var(--primary)' }}>🩸</div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Blood Pressure</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                    {(() => {
                      const bp = healthData?.blood_pressure?.[healthData.blood_pressure.length - 1];
                      if (!bp) return "120/80";
                      return bp.diastolic ? `${bp.systolic}/${bp.diastolic}` : bp.value;
                    })()}
                  </div>
                </div>
              </div>
              <div className="glass-card hover-lift" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', color: 'var(--accent)' }}>😴</div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Sleep</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>{healthData?.sleep?.[healthData.sleep.length - 1]?.value || 0}h</div>
                </div>
              </div>
            </div>

            {/* Recent Medical Records */}
            <div className="g-card hover-lift">
              <div className="g-card-header" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>Recent Records</h2>
                <button className="g-icon-btn" onClick={() => navigate('/app/records')} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>→</button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {recentRecords.length > 0 ? recentRecords.map(r => (
                  <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'var(--bg-body)', borderRadius: '12px', cursor: 'pointer' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>📄</div>
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{r.date}</div>
                    </div>
                  </div>
                )) : <p style={{ color: 'var(--text-muted)' }}>No records uploaded.</p>}
              </div>
            </div>

            {/* My Treatment */}
            <div className="g-card hover-lift">
              <div className="g-card-header" style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '1.15rem', fontWeight: 700 }}>My treatment</h2>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Current medications</p>
                </div>
                <button className="g-icon-btn" onClick={() => navigate('/app/medicine')} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>→</button>
              </div>
              {myMeds.length > 0 ? myMeds.map((m, i) => (
                <div key={m.id} className={`g-treat-item g-item-color-${i % 4}`}>
                  <div className="g-pill-icon">💊</div>
                  <div>
                    <h4 style={{ fontWeight: 600 }}>{m.name}</h4>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{m.frequency.replace('_', ' ')}</p>
                  </div>
                </div>
              )) : <p style={{ color: 'var(--text-muted)' }}>No active medications.</p>}
              <button className="g-btn-outline" onClick={() => navigate('/app/medicine')} style={{ width: '100%', marginTop: '12px', padding: '10px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'transparent', cursor: 'pointer', fontWeight: 600 }}>+ New Medication</button>
            </div>
          </>
        ) : null}
      </aside>
      {/* Global "Hey LifeOS" Voice Assistant — always present */}
      <VoiceLogger onLogSuccess={(msg) => alert(msg)} onAction={handleVoiceAction} />
      <ThemeToggle />
    </div>
  );
};

export default AppDashboard;
