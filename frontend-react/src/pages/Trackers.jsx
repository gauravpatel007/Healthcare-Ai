import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';

const Trackers = () => {
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
  const [activeTab, setActiveTab] = useState('water');
  const [loading, setLoading] = useState(true);
  
  const [water, setWater] = useState(0);
  const [waterHistory, setWaterHistory] = useState([]);
  const [sleepData, setSleepData] = useState([]);
  const [bmiData, setBmiData] = useState(null);

  const [selectedQuality, setSelectedQuality] = useState(4);
  const [bedtime, setBedtime] = useState('23:00');
  const [waketime, setWaketime] = useState('07:00');

  const [connectedDevices, setConnectedDevices] = useState({ 'Apple Watch': false, 'Fitbit': false, 'Galaxy Watch': false });
  const [syncedWearableData, setSyncedWearableData] = useState(null);
  const [syncingWearable, setSyncingWearable] = useState(false);

  const waterChartRef = useRef(null);
  const sleepChartRef = useRef(null);
  const chartInstances = useRef({ water: null, sleep: null });
  const profile = { weight: bmiData?.weight || 70, height: bmiData?.height || 170 };

  useEffect(() => {
    // Auto-calculate sleep quality based on duration
    const bed = new Date(`2000-01-01T${bedtime}`);
    let wake = new Date(`2000-01-01T${waketime}`);
    if (wake < bed) wake.setDate(wake.getDate() + 1);
    const diffHours = (wake - bed) / (1000 * 60 * 60);
    
    if (diffHours >= 7 && diffHours <= 9) setSelectedQuality(5);
    else if (diffHours >= 6) setSelectedQuality(4);
    else if (diffHours >= 5) setSelectedQuality(3);
    else if (diffHours >= 4) setSelectedQuality(2);
    else setSelectedQuality(1);
  }, [bedtime, waketime]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      window.history.replaceState({}, document.title, window.location.pathname);
      
      const exchangeCode = async () => {
        try {
          const res = await API.post('/trackers/fitbit/callback', { code });
          if (res.success) {
            alert('✅ Successfully linked real Fitbit account!');
            setConnectedDevices(prev => ({ ...prev, 'Fitbit': true }));
          } else {
            alert(`Fitbit Connection Failed: ${res.message}`);
          }
        } catch (e) {
          console.error("Fitbit token exchange error:", e);
          alert('Failed to connect Fitbit account.');
        }
      };
      exchangeCode();
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const now = new Date();
        const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
        
        const [waterRes, waterHistRes, sleepRes, bmiRes, wearableRes] = await Promise.all([
          API.get(`/trackers/water?target_date=${today}`),
          API.get(`/trackers/water/history?target_date=${today}`),
          API.get('/trackers/sleep'),
          API.get('/trackers/bmi'),
          API.get('/trackers/wearable/status')
        ]);
        
        if (isMounted) {
          setWater(waterRes?.glasses || 0);
          setWaterHistory(waterHistRes || []);
          setSleepData(sleepRes || []);
          setBmiData(bmiRes || null);
          
          const devices = wearableRes?.connected_devices || [];
          setConnectedDevices({
            'Apple Watch': devices.includes('Apple Watch'),
            'Fitbit': devices.includes('Fitbit'),
            'Galaxy Watch': devices.includes('Galaxy Watch')
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    if (loading || !window.Chart) return;

    if (activeTab === 'water' && waterChartRef.current) {
      if (chartInstances.current.water) chartInstances.current.water.destroy();
      const days = waterHistory.map(w => new Date(w.date).toLocaleDateString('en', { weekday: 'short' }));
      const data = waterHistory.map(w => w.glasses);
      chartInstances.current.water = new window.Chart(waterChartRef.current, {
        type: 'bar',
        data: { labels: days, datasets: [{ label: 'Glasses', data, backgroundColor: 'rgba(116, 185, 255, 0.5)', borderColor: '#74b9ff', borderWidth: 1, borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, max: 10, grid: { color: 'rgba(0,0,0,0.05)' } } } }
      });
    }

    if (activeTab === 'sleep' && sleepChartRef.current) {
      if (chartInstances.current.sleep) chartInstances.current.sleep.destroy();
      const sleepChartData = [...sleepData].slice(0, 7).reverse();
      chartInstances.current.sleep = new window.Chart(sleepChartRef.current, {
        type: 'bar',
        data: { labels: sleepChartData.map(s => new Date(s.date).toLocaleDateString('en', { weekday: 'short' })), datasets: [{ label: 'Hours', data: sleepChartData.map(s => s.hours), backgroundColor: 'rgba(108, 92, 231, 0.5)', borderColor: '#6C5CE7', borderWidth: 1, borderRadius: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } }, scales: { x: { grid: { display: false } }, y: { beginAtZero: true, max: 12, grid: { color: 'rgba(0,0,0,0.05)' } } } }
      });
    }
  }, [activeTab, loading, waterHistory, sleepData]);

  const handleWaterClick = (i) => {
    setWater(prevWater => {
      const newVal = prevWater === i ? i - 1 : i;
      
      const now = new Date();
      const today = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
      
      // We perform the async logic in an IIFE to ensure we use the accurate prevWater
      (async () => {
        // Update local history so the chart immediately reflects the change
        setWaterHistory(prev => {
          const updated = [...prev];
          const todayIndex = updated.findIndex(w => w.date === today || w.date.startsWith(today));
          if (todayIndex >= 0) {
            updated[todayIndex] = { ...updated[todayIndex], glasses: newVal };
          } else {
            updated.push({ date: today, glasses: newVal });
          }
          return updated;
        });

        try {
          await API.put('/trackers/water', { glasses: newVal, date: today });
          // Re-fetch history to ensure chart stays in sync with the database
          const freshHistory = await API.get(`/trackers/water/history?target_date=${today}`);
          setWaterHistory(freshHistory || []);
          if (newVal >= 8 && prevWater < 8) alert('🎉 Water goal achieved!');
        } catch (e) {
          console.error("Water log error:", e);
          // Revert optimistic update on failure
          setWater(prevWater);
          try {
            const freshHistory = await API.get(`/trackers/water/history?target_date=${today}`);
            setWaterHistory(freshHistory || []);
          } catch (_) { /* ignore re-fetch error */ }
        }
      })();

      return newVal;
    });
  };

  const handleLogSleep = async () => {
    if (!bedtime || !waketime) {
      alert("Please select both bedtime and wake time.");
      return;
    }

    const [bh, bm] = bedtime.split(':').map(Number);
    const [wh, wm] = waketime.split(':').map(Number);
    let hours = wh - bh + (wm - bm) / 60;
    if (hours <= 0) hours += 24;
    
    const formatTime = (t) => t.length === 5 ? `${t}:00` : t;

    const sleepEntry = { 
      hours: Math.max(0.1, Math.round(hours * 10) / 10), 
      quality: selectedQuality,
      bedtime: formatTime(bedtime),
      wake_time: formatTime(waketime)
    };

    try {
      const added = await API.post('/trackers/sleep', sleepEntry);
      setSleepData(prev => [added, ...prev]);
      alert(`Sleep logged: ${sleepEntry.hours.toFixed(1)} hours`);
    } catch (e) {
      console.error("Sleep log error:", e);
      const msg = e.response?.data?.detail || e.message;
      alert(`Failed to log sleep: ${msg}`);
    }
  };

  const handleConnectDevice = async (name) => {
    if (!connectedDevices[name]) {
      if (name === 'Fitbit') {
        const clientId = prompt("To connect your REAL Fitbit, please enter your Fitbit Client ID:\n(You must also add FITBIT_CLIENT_ID and FITBIT_CLIENT_SECRET to the backend .env file first).\n\nLeave blank and click OK to just run the local simulation fallback.");
        if (clientId && clientId.trim() !== "") {
           const redirectUri = "http://localhost:5173/app/trackers";
           window.location.href = `https://www.fitbit.com/oauth2/authorize?response_type=code&client_id=${clientId.trim()}&redirect_uri=${redirectUri}&scope=activity%20heartrate%20sleep%20profile`;
           return;
        }
      }

      alert(`⌚ Connecting to ${name} (Simulation fallback)...`);
      try {
        const res = await API.post('/trackers/wearable/connect', { device_name: name });
        if (res.success) {
          setConnectedDevices(prev => ({ ...prev, [name]: true }));
          alert(`✅ Successfully connected to ${name}!`);
        }
      } catch (e) {
        console.error("Wearable connect error:", e);
        alert(`Failed to connect ${name}.`);
      }
    }
  };

  const handleSyncWearable = async () => {
    setSyncingWearable(true);
    try {
      const res = await API.get('/trackers/wearable/sync');
      setSyncedWearableData(res);
      alert('🔄 Data successfully synced from wearables!');
    } catch (e) {
      console.error("Wearable sync error:", e);
      alert('Failed to sync wearable data.');
    } finally {
      setSyncingWearable(false);
    }
  };

  if (loading) return <div className="empty-state"><span className="spinner"></span> Loading Trackers...</div>;

  return (
    <div className="page-section active">
      <div className="section-header" style={{ background: 'var(--bg-card)', padding: '24px 32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', background: 'rgba(37,99,235,0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', fontFamily: "'Inter', sans-serif" }}>Smart Trackers</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }}></span>
              Track your daily health metrics
            </p>
          </div>
        </div>
      </div>
      <div className="tabs mb-lg" style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {[{ id: 'water', icon: '💧', label: 'Water' }, { id: 'sleep', icon: '😴', label: 'Sleep' }, { id: 'bmi', icon: '⚖️', label: 'BMI/BMR' }, { id: 'wearable', icon: '⌚', label: 'Wearable' }].map(t => (
          <button key={t.id} className={`tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)} style={{ padding: '8px 16px', borderRadius: '12px', background: activeTab === t.id ? 'var(--primary)' : 'var(--bg-secondary)', color: activeTab === t.id ? 'white' : 'var(--text-primary)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'water' && (
        <div id="tracker-water" className="tracker-tab">
          <div className="grid-2 gap-xl" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="glass-card no-hover" style={{ textAlign: 'center', background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '20px', fontWeight: 700 }}>💧 Daily Water Intake</h3>
              <div style={{ position: 'relative', width: '180px', height: '180px', margin: '0 auto' }}>
                <svg width="180" height="180">
                  <circle cx="90" cy="90" r="80" fill="none" stroke="var(--bg-secondary)" strokeWidth="12" />
                  <circle cx="90" cy="90" r="80" fill="none" stroke={water >= 8 ? 'var(--success)' : 'var(--info)'} strokeWidth="12" strokeDasharray="502" strokeDashoffset={502 - (502 * (Math.min(water, 8) / 8))} style={{ transition: 'stroke-dashoffset 0.5s ease' }} transform="rotate(-90 90 90)" />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.5rem', fontWeight: 800 }}>{water}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>of 8 glasses</div>
                </div>
              </div>
              <div className="water-glasses mt-lg" style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', flexWrap: 'wrap' }}>
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className={`water-glass ${i < water ? 'filled' : ''}`} onClick={() => handleWaterClick(i + 1)} title={`Glass ${i + 1}`} style={{ width: '24px', height: '36px', borderRadius: '4px 4px 12px 12px', border: '2px solid var(--info)', background: i < water ? 'var(--info)' : 'transparent', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.3s' }}>
                    <span style={{ fontSize: '0.6rem', paddingBottom: '4px' }}>{i < water ? '💧' : ''}</span>
                  </div>
                ))}
              </div>
              <p className="text-muted mt-md" style={{ fontSize: '0.82rem', marginTop: '16px' }}>{water >= 8 ? '🎉 Daily goal achieved!' : `Drink ${Math.max(0, 8 - water)} more glasses today`}</p>
              <p className="text-muted mt-sm" style={{ fontSize: '0.75rem', marginTop: '8px' }}>Recommended: {Math.round(profile.weight * 0.033 * 10) / 10}L based on your weight ({profile.weight}kg)</p>
            </div>
            <div className="glass-card no-hover" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ marginBottom: '16px', fontWeight: 600 }}>📊 Weekly Water History</h4>
              <div className="chart-container" style={{ height: '250px', position: 'relative' }}><canvas ref={waterChartRef}></canvas></div>
              <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(116,185,255,0.08)', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.82rem', color: 'var(--info)' }}>💡 Tip: Set regular reminders to drink water throughout the day. Carry a water bottle with you.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'sleep' && (
        <div id="tracker-sleep" className="tracker-tab">
          <div className="grid-2 gap-xl mb-xl" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
            <div className="glass-card no-hover" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '20px', fontWeight: 700 }}>😴 Log Sleep</h3>
              <div className="grid-2 gap-md" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Bed Time</label>
                  <input type="time" className="form-input" value={bedtime} onChange={(e) => setBedtime(e.target.value)} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
                </div>
                <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Wake Time</label>
                  <input type="time" className="form-input" value={waketime} onChange={(e) => setWaketime(e.target.value)} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
                </div>
              </div>
              <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600 }}>Sleep Quality</label>
                <div className="flex gap-md justify-center" style={{ display: 'flex', justifyContent: 'center', gap: '12px', padding: '12px' }}>
                  {['😫', '😔', '😐', '🙂', '😴'].map((e, i) => (
                    <button key={i} className={`mood-btn ${i + 1 === selectedQuality ? 'selected' : ''}`} onClick={() => setSelectedQuality(i + 1)} style={{ fontSize: '1.5rem', background: i + 1 === selectedQuality ? 'rgba(99,102,241,0.2)' : 'transparent', border: i + 1 === selectedQuality ? '2px solid var(--primary)' : '2px solid transparent', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', transition: 'all 0.2s' }}>{e}</button>
                  ))}
                </div>
              </div>
              <button className="btn btn-primary w-full" onClick={handleLogSleep} style={{ width: '100%', padding: '12px', background: 'var(--primary)', color: 'white', borderRadius: '10px', border: 'none', fontWeight: 600, cursor: 'pointer' }}>😴 Log Sleep</button>
            </div>
            <div className="glass-card no-hover" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ marginBottom: '16px', fontWeight: 600 }}>📊 Sleep Trend</h4>
              <div className="chart-container" style={{ height: '250px', position: 'relative' }}><canvas ref={sleepChartRef}></canvas></div>
            </div>
          </div>
          <div className="glass-card no-hover" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ marginBottom: '16px', fontWeight: 600 }}>📋 Recent Sleep Log</h4>
            {sleepData.length > 0 ? sleepData.slice(0, 7).map((s, i) => (
              <div key={i} className="list-item" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px', borderBottom: '1px solid var(--border-color)' }}>
                <div className="item-icon" style={{ background: 'rgba(108,92,231,0.15)', color: 'var(--primary-light)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>😴</div>
                <div className="item-content" style={{ flex: 1 }}>
                  <div className="item-title" style={{ fontWeight: 600 }}>{s.hours} hours of sleep</div>
                  <div className="item-subtitle" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(s.date).toLocaleDateString()} • Quality: {'⭐'.repeat(s.quality)}</div>
                </div>
                <span className={`badge ${s.hours >= 7 ? 'badge-success' : 'badge-warning'}`} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: s.hours >= 7 ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)', color: s.hours >= 7 ? 'var(--success)' : 'var(--warning)' }}>{s.hours >= 7 ? 'Good' : 'Low'}</span>
              </div>
            )) : <p className="text-center text-muted" style={{ padding: '20px' }}>No sleep data logged yet</p>}
          </div>
        </div>
      )}

      {activeTab === 'bmi' && bmiData && (
        <div id="tracker-bmi" className="tracker-tab">
          <div className="grid-2 gap-xl" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="glass-card no-hover" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '20px', fontWeight: 700 }}>⚖️ Current BMI</h3>
              <div style={{ textAlign: 'center', padding: '30px', background: 'var(--bg-secondary)', borderRadius: '16px' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', fontWeight: 800, color: bmiData.category.color }}>{bmiData.bmi}</div>
                <div style={{ fontSize: '0.85rem', color: bmiData.category.color, fontWeight: 600, marginTop: '4px' }}>{bmiData.category.label}</div>
                <div style={{ width: '100%', height: '10px', background: 'linear-gradient(90deg, var(--info), var(--success), var(--warning), var(--accent))', borderRadius: '10px', marginTop: '16px', position: 'relative' }}>
                  <div style={{ position: 'absolute', top: '-5px', width: '4px', height: '20px', background: 'white', borderRadius: '4px', left: `${Math.min(95, (bmiData.bmi / 40) * 100)}%` }}></div>
                </div>
                <div className="flex justify-between mt-sm" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  <span>Under 18.5</span><span>Normal 18.5-25</span><span>Over 25-30</span><span>Obese 30+</span>
                </div>
              </div>
              <p style={{ textAlign: 'center', marginTop: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Based on Weight: {bmiData.weight}kg, Height: {bmiData.height}cm</p>
            </div>
            <div className="glass-card no-hover" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '20px', fontWeight: 700 }}>🔥 BMR Calculator</h3>
              <div style={{ textAlign: 'center', padding: '30px', background: 'var(--bg-secondary)', borderRadius: '16px' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Basal Metabolic Rate</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', fontWeight: 800, color: 'var(--primary-light)', margin: '8px 0' }}>{Math.round(bmiData.bmr)}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>calories/day at rest</div>
              </div>
              <div style={{ marginTop: '20px' }}>
                <h4 style={{ marginBottom: '12px', fontWeight: 600 }}>Daily Calorie Needs by Activity:</h4>
                {[
                  { level: 'Sedentary', key: 'sedentary', desc: 'Little/no exercise' },
                  { level: 'Light Active', key: 'light', desc: '1-3 days/week' },
                  { level: 'Moderate', key: 'moderate', desc: '3-5 days/week' },
                  { level: 'Very Active', key: 'very_active', desc: '6-7 days/week' },
                  { level: 'Extra Active', key: 'extra_active', desc: 'Athlete level' }
                ].map(a => (
                  <div key={a.key} className="flex justify-between items-center" style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.03)', fontSize: '0.85rem' }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{a.level}</span>
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}> ({a.desc})</span>
                    </div>
                    <span style={{ fontWeight: 700, color: 'var(--primary-light)' }}>{Math.round(bmiData.tdee_by_activity[a.key])} cal</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'wearable' && (
        <div id="tracker-wearable" className="tracker-tab">
          <div className="glass-card no-hover mb-xl" style={{ textAlign: 'center', padding: '40px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>⌚</div>
            <h3 style={{ fontWeight: 700 }}>Wearable Integration</h3>
            <p style={{ color: 'var(--text-secondary)', margin: '12px 0' }}>Connect your smart watch or fitness band to sync health data automatically.</p>
            <div className="grid-3 gap-md mt-xl" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', maxWidth: '600px', margin: '24px auto 0' }}>
              {[
                { name: 'Apple Watch', icon: '⌚' },
                { name: 'Fitbit', icon: '📱' },
                { name: 'Galaxy Watch', icon: '⌚' }
              ].map(d => (
                <div key={d.name} className="glass-card" style={{ textAlign: 'center', cursor: 'pointer', background: 'var(--bg-secondary)', padding: '20px', borderRadius: '12px' }} onClick={() => handleConnectDevice(d.name)}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>{d.icon}</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>{d.name}</div>
                  <span className={`badge ${connectedDevices[d.name] ? 'badge-success' : 'badge-primary'} mt-sm`} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: connectedDevices[d.name] ? 'rgba(34,197,94,0.1)' : 'rgba(37,99,235,0.1)', color: connectedDevices[d.name] ? 'var(--success)' : 'var(--primary)' }}>{connectedDevices[d.name] ? 'Connected' : 'Connect'}</span>
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px' }}>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>Sync: ❤️ Heart Rate • 😴 Sleep • 👣 Steps • 🔥 Calories</p>
              {Object.values(connectedDevices).some(v => v) && (
                <button onClick={handleSyncWearable} disabled={syncingWearable} className="g-btn" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '0.85rem' }}>
                  {syncingWearable ? 'Syncing...' : '🔄 Sync Now'}
                </button>
              )}
            </div>
          </div>

          <div className="dashboard-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
            <div className="stat-card">
              <div className="stat-icon coral" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>❤️</div>
              <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{syncedWearableData ? syncedWearableData.heart_rate : '--'}</div>
              <div className="stat-label" style={{ color: 'var(--text-muted)' }}>Heart Rate (bpm)</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon purple" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>😴</div>
              <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{syncedWearableData ? syncedWearableData.sleep_hours : '--'}</div>
              <div className="stat-label" style={{ color: 'var(--text-muted)' }}>Sleep (hours)</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon green" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>👣</div>
              <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{syncedWearableData ? syncedWearableData.steps.toLocaleString() : '--'}</div>
              <div className="stat-label" style={{ color: 'var(--text-muted)' }}>Steps</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon teal" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔥</div>
              <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{syncedWearableData ? syncedWearableData.calories_burned : '--'}</div>
              <div className="stat-label" style={{ color: 'var(--text-muted)' }}>Calories Burned</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Trackers;
