import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';

const DashboardOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [healthData, setHealthData] = useState({});
  const [fitnessStats, setFitnessStats] = useState({});
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [nutritionPlan, setNutritionPlan] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const [myMeds, setMyMeds] = useState([]);

  // States for interactive components
  const [activeParam, setActiveParam] = useState('weight'); // 'weight', 'bp', 'pulse'
  const [paramTimeframe, setParamTimeframe] = useState('year'); // 'year', 'month'
  const [aptTimeframe, setAptTimeframe] = useState('today'); // 'today', 'week'

  // Parameter logging state
  const [showParamModal, setShowParamModal] = useState(false);
  const [newParam, setNewParam] = useState({ category: 'weight', value: '', secondary_value: '' });
  const [savingParam, setSavingParam] = useState(false);

  const handleSaveParam = async () => {
    if (!newParam.value) return;
    setSavingParam(true);
    try {
      const payload = {
        category: newParam.category,
        value: parseFloat(newParam.value),
        label: new Date().toLocaleDateString('en-US', { month: 'short' })
      };
      if (newParam.category === 'blood_pressure') {
        payload.secondary_value = parseFloat(newParam.secondary_value) || 80;
      }
      
      await API.post('/trackers/health-entry', payload);
      
      // Refresh health data for chart
      const hData = await API.get('/trackers/health-data');
      setHealthData(hData || {});
      
      setShowParamModal(false);
      setNewParam({ category: 'weight', value: '', secondary_value: '' });
    } catch (error) {
      console.error('Failed to save parameter:', error);
      alert('Failed to save parameter');
    } finally {
      setSavingParam(false);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [d, hData, fStats, nPlan, records, meds] = await Promise.all([
          API.get('/dashboard/summary').catch(() => null),
          API.get('/trackers/health-data').catch(() => ({})),
          API.get('/ai/fitness/stats').catch(() => ({})),
          API.get('/ai/nutrition/plan').catch(() => null),
          API.get('/records').catch(() => []),
          API.get('/medicines').catch(() => [])
        ]);
        setDashboardSummary(d);
        setHealthData(hData || {});
        setFitnessStats(fStats || { steps: 0, calories_burned: 0, step_goal: 10000 });
        setNutritionPlan(nPlan || { tdee: 2200, protein_goal_grams: 84, carbs_goal_grams: 200, fat_goal_grams: 60 });
        setRecentRecords(records ? records.slice(0, 2) : []);
        setMyMeds(meds ? meds.filter(m => m.is_active).slice(0, 3) : []);
        setLoading(false);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  useEffect(() => {
    if (loading || !window.Chart) return;
    
    let labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    let datasets = [];

    if (activeParam === 'weight') {
      let weightData = [74, 73.8, 73.5, 73.2, 72.8, 72.5];
      let fatData = [20, 19.8, 19.5, 19.2, 18.8, 18.5];
      if (healthData.weight && healthData.weight.length > 0) {
        const limit = paramTimeframe === 'month' ? -4 : -6;
        const recent = healthData.weight.slice(limit);
        labels = recent.map(r => new Date(r.recorded_at || r.date).toLocaleDateString('en-US', { month: 'short' }));
        weightData = recent.map(r => r.value);
        fatData = weightData.map(w => w * 0.25); // Mock fat% dynamically for now
      }
      datasets = [
        { label: 'Weight', data: weightData, borderColor: '#6366f1', backgroundColor: 'rgba(99, 102, 241, 0.04)', borderWidth: 2.5, tension: 0.4, pointRadius: 4, fill: true },
        { label: '% Fat', data: fatData, borderColor: '#34d399', backgroundColor: 'rgba(52, 211, 153, 0.04)', borderWidth: 2.5, tension: 0.4, pointRadius: 4, fill: true }
      ];
    } else if (activeParam === 'bp') {
      let sysData = [120, 118, 122, 119, 121, 120];
      let diaData = [80, 79, 82, 80, 81, 79];
      if (healthData.blood_pressure && healthData.blood_pressure.length > 0) {
        const limit = paramTimeframe === 'month' ? -4 : -6;
        const recent = healthData.blood_pressure.slice(limit);
        labels = recent.map(r => new Date(r.recorded_at || r.date).toLocaleDateString('en-US', { month: 'short' }));
        sysData = recent.map(r => r.systolic || r.value);
        diaData = recent.map(r => r.diastolic || r.secondary_value || 80);
      }
      datasets = [
        { label: 'Systolic', data: sysData, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.04)', borderWidth: 2.5, tension: 0.4, pointRadius: 4, fill: true },
        { label: 'Diastolic', data: diaData, borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.04)', borderWidth: 2.5, tension: 0.4, pointRadius: 4, fill: true }
      ];
    } else if (activeParam === 'pulse') {
      let pulseData = [72, 74, 71, 73, 75, 70];
      if (healthData.heart_rate && healthData.heart_rate.length > 0) {
        const limit = paramTimeframe === 'month' ? -4 : -6;
        const recent = healthData.heart_rate.slice(limit);
        labels = recent.map(r => new Date(r.recorded_at || r.date).toLocaleDateString('en-US', { month: 'short' }));
        pulseData = recent.map(r => r.value);
      }
      datasets = [
        { label: 'Heart Rate', data: pulseData, borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.04)', borderWidth: 2.5, tension: 0.4, pointRadius: 4, fill: true }
      ];
    }

    setTimeout(() => {
      const ctx = document.getElementById('params-chart');
      if (ctx && window.myChartInstance) {
        window.myChartInstance.destroy();
      }
      if (ctx) {
        window.myChartInstance = new window.Chart(ctx, {
          type: 'line',
          data: { labels, datasets },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, pointStyle: 'circle' } } },
            scales: { x: { grid: { display: false } }, y: { grid: { color: 'rgba(0,0,0,0.05)' } } }
          }
        });
      }
    }, 100);
  }, [loading, healthData, activeParam, paramTimeframe]);

  const getGreetingTime = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Morning';
    if (hour < 17) return 'Afternoon';
    return 'Evening';
  };

  const getGreetingIcon = () => {
    const hour = new Date().getHours();
    if (hour > 5 && hour < 18) return '☀️';
    return '🌙';
  };

  if (loading) {
    return <div className="empty-state"><span className="spinner"></span> Loading...</div>;
  }

  return (
    <div className="page-section active" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="section-header" style={{ background: 'var(--bg-card)', padding: '24px 32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', background: 'rgba(37,99,235,0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', fontFamily: "'Inter', sans-serif" }}>Dashboard</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }}></span>
              Your personalized health overview
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card hover-lift g-hero-greeting" style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '8px', color: 'var(--text-primary)' }}>
            Good {getGreetingTime()}, <span>{dashboardSummary?.user_name || 'User'}</span>
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem' }}>Here is your health overview for today.</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Health Score</span>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--success)', textShadow: '0 2px 10px rgba(16, 185, 129, 0.2)' }}>{dashboardSummary?.health_score || 85}</span>
              <span style={{ fontSize: '1rem', color: 'var(--text-muted)', fontWeight: 600 }}>/100</span>
            </div>
          </div>
          <div style={{ position: 'relative', width: '70px', height: '70px' }}>
            {/* SVG Circle Progress logic ported to React */}
            <svg width="70" height="70">
              <circle cx="35" cy="35" r="32" fill="none" stroke="var(--bg-secondary)" strokeWidth="6" />
              <circle cx="35" cy="35" r="32" fill="none" stroke="var(--success)" strokeWidth="6" strokeDasharray="201" strokeDashoffset={201 - (201 * 85) / 100} style={{ transition: 'stroke-dashoffset 1s ease-out' }} transform="rotate(-90 35 35)" />
            </svg>
            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '1.8rem' }}>{getGreetingIcon()}</div>
          </div>
        </div>
      </div>

      <div className="grid-3 gap-md">
        <div className="glass-action-btn hover-glow" onClick={() => navigate('/app/trackers')} style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', cursor: 'pointer', border: '1px solid var(--border-color)', transition: 'all 0.3s' }}>
          <div className="icon" style={{ fontSize: '1.8rem', background: 'rgba(14, 165, 233, 0.1)', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px' }}>💧</div>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Log Water</span>
        </div>
        <div className="glass-action-btn hover-glow" onClick={() => navigate('/app/ai-fitness')} style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', cursor: 'pointer', border: '1px solid var(--border-color)', transition: 'all 0.3s' }}>
          <div className="icon" style={{ fontSize: '1.8rem', background: 'rgba(249, 115, 22, 0.1)', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px' }}>🏋️</div>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Start Workout</span>
        </div>
        <div className="glass-action-btn hover-glow" onClick={() => navigate('/app/medicine')} style={{ background: 'var(--bg-card)', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', cursor: 'pointer', border: '1px solid var(--border-color)', transition: 'all 0.3s' }}>
          <div className="icon" style={{ fontSize: '1.8rem', background: 'rgba(239, 68, 68, 0.1)', width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '14px' }}>💊</div>
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Take Meds</span>
        </div>
      </div>

      <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Activity Rings */}
        <div className="g-card hover-lift" style={{ paddingBottom: '32px' }}>
          <div className="g-card-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Activity Rings</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Your daily movement</p>
            </div>
            <button className="g-icon-btn" onClick={() => navigate('/app/ai-fitness')} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>→</button>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-around', textAlign: 'center', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '12px' }}>
                <svg width="80" height="80">
                  <circle cx="40" cy="40" r="36" fill="none" stroke="var(--bg-secondary)" strokeWidth="8" />
                  <circle cx="40" cy="40" r="36" fill="none" stroke="var(--success)" strokeWidth="8" strokeDasharray="226" strokeDashoffset={226 - (226 * (Math.min(fitnessStats?.steps || 0, fitnessStats?.step_goal || 10000) / (fitnessStats?.step_goal || 10000)))} style={{ transition: 'stroke-dashoffset 1s ease' }} transform="rotate(-90 40 40)" />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '1.4rem' }}>👣</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{fitnessStats?.steps?.toLocaleString() || 0}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', marginTop: '2px' }}>STEPS</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '12px' }}>
                <svg width="80" height="80">
                  <circle cx="40" cy="40" r="36" fill="none" stroke="var(--bg-secondary)" strokeWidth="8" />
                  <circle cx="40" cy="40" r="36" fill="none" stroke="var(--accent)" strokeWidth="8" strokeDasharray="226" strokeDashoffset={226 - (226 * (Math.min(fitnessStats?.calories_burned || 0, 2000) / 2000))} style={{ transition: 'stroke-dashoffset 1s ease' }} transform="rotate(-90 40 40)" />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '1.4rem' }}>🔥</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{fitnessStats?.calories_burned || 0}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', marginTop: '2px' }}>KCAL</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ position: 'relative', width: '80px', height: '80px', marginBottom: '12px' }}>
                <svg width="80" height="80">
                  <circle cx="40" cy="40" r="36" fill="none" stroke="var(--bg-secondary)" strokeWidth="8" />
                  <circle cx="40" cy="40" r="36" fill="none" stroke="var(--info)" strokeWidth="8" strokeDasharray="226" strokeDashoffset={226 - (226 * (1.2 / 2.3))} style={{ transition: 'stroke-dashoffset 1s ease' }} transform="rotate(-90 40 40)" />
                </svg>
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '1.4rem' }}>💧</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{((dashboardSummary?.water_intake || 0) * 0.2).toFixed(1)}L</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em', marginTop: '2px' }}>WATER</div>
            </div>
          </div>
        </div>

        {/* Nutrition Tracker */}
        <div className="g-card hover-lift" style={{ paddingBottom: '24px' }}>
          <div className="g-card-header" style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Nutrition Tracker</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Daily macros and goals</p>
            </div>
            <button className="g-icon-btn" onClick={() => navigate('/app/ai-nutrition')} style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}>🥗</button>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#ef4444' }}>🥩</span> Protein</span>
                <span><span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{nutritionPlan?.protein_goal_grams || 84}g</span></span>
              </div>
              <div style={{ height: '10px', background: 'var(--bg-body)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `100%`, background: 'linear-gradient(90deg, #ef4444, #f87171)', borderRadius: '10px' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#f59e0b' }}>🍞</span> Carbs</span>
                <span><span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{nutritionPlan?.carbs_goal_grams || 200}g</span></span>
              </div>
              <div style={{ height: '10px', background: 'var(--bg-body)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg, #f59e0b, #fbbf24)', borderRadius: '10px' }}></div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontWeight: 600, fontSize: '0.9rem' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#8b5cf6' }}>🥑</span> Fats</span>
                <span><span style={{ color: 'var(--text-primary)', fontWeight: 800 }}>{nutritionPlan?.fat_goal_grams || 60}g</span></span>
              </div>
              <div style={{ height: '10px', background: 'var(--bg-body)', borderRadius: '10px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '100%', background: 'linear-gradient(90deg, #8b5cf6, #a78bfa)', borderRadius: '10px' }}></div>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--success)' }}>🔥 Calories</span>
            <span style={{ fontWeight: 800, color: 'var(--text-primary)' }}><span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Target: </span>{nutritionPlan?.tdee || 2200}</span>
          </div>
        </div>
      </div>

      {/* My Parameters Card */}
      <div className="g-card hover-lift">
        <div className="g-card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>My parameters</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Track key health metrics over time</p>
          </div>
          <button className="g-icon-btn" onClick={() => setShowParamModal(true)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>+</button>
        </div>
        <div className="g-tabs-row" style={{ display: 'flex', gap: '8px', marginBottom: '16px', alignItems: 'center' }}>
          <button className={`g-tab ${activeParam === 'weight' ? 'active' : ''}`} onClick={() => setActiveParam('weight')} style={{ padding: '8px 16px', borderRadius: '20px', background: activeParam === 'weight' ? 'var(--primary)' : 'transparent', color: activeParam === 'weight' ? 'white' : 'var(--text-primary)', border: activeParam === 'weight' ? 'none' : '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer' }}>Weight · % Fat</button>
          <button className={`g-tab ${activeParam === 'bp' ? 'active' : ''}`} onClick={() => setActiveParam('bp')} style={{ padding: '8px 16px', borderRadius: '20px', background: activeParam === 'bp' ? 'var(--primary)' : 'transparent', color: activeParam === 'bp' ? 'white' : 'var(--text-primary)', border: activeParam === 'bp' ? 'none' : '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer' }}>Blood Pressure</button>
          <button className={`g-tab ${activeParam === 'pulse' ? 'active' : ''}`} onClick={() => setActiveParam('pulse')} style={{ padding: '8px 16px', borderRadius: '20px', background: activeParam === 'pulse' ? 'var(--primary)' : 'transparent', color: activeParam === 'pulse' ? 'white' : 'var(--text-primary)', border: activeParam === 'pulse' ? 'none' : '1px solid var(--border-color)', fontWeight: 600, cursor: 'pointer' }}>Pulse</button>
          <div style={{ flex: 1 }}></div>
          <select className="g-select" value={paramTimeframe} onChange={(e) => setParamTimeframe(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', outline: 'none' }}>
            <option value="year">This year</option>
            <option value="month">This month</option>
          </select>
          <button className="g-icon-btn-sm" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>⋯</button>
        </div>
        <div className="g-chart-area" style={{ height: '300px', position: 'relative' }}>
          <canvas id="params-chart"></canvas>
        </div>
      </div>

      {/* My Appointments Card */}
      <div className="g-card hover-lift">
        <div className="g-card-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>My appointments</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Scheduled visits and consultations</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select className="g-select" value={aptTimeframe} onChange={(e) => setAptTimeframe(e.target.value)} style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border-color)', background: 'transparent', outline: 'none' }}>
              <option value="today">Today</option>
              <option value="week">This week</option>
            </select>
            <button className="g-icon-btn" onClick={() => navigate('/app/appointments')} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>+</button>
          </div>
        </div>
        <div id="dashboard-appointments-list">
          {(() => {
            let apts = dashboardSummary?.upcoming || [];
            if (aptTimeframe === 'today') {
              const todayStr = new Date().toISOString().split('T')[0];
              apts = apts.filter(a => a.date === todayStr);
            }
            if (apts.length > 0) {
              return apts.slice(0, 3).map((apt, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '16px', marginBottom: '12px', background: 'var(--bg-body)' }}>
                  <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem' }}>
                    {new Date(`1970-01-01T${apt.time}`).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ fontWeight: 600, fontSize: '1.05rem', color: 'var(--text-primary)', marginBottom: '4px' }}>Dr. {apt.doctor}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{apt.specialty} • {apt.hospital}</p>
                  </div>
                </div>
              ));
            } else {
              return <p style={{ color: 'var(--text-muted)', padding: '16px 0' }}>No appointments scheduled for {aptTimeframe}.</p>;
            }
          })()}
        </div>
        <button className="g-btn-dark" onClick={() => navigate('/app/appointments')} style={{ width: '100%', padding: '12px', borderRadius: '12px', background: '#0f172a', color: 'white', border: 'none', fontWeight: 600, cursor: 'pointer', marginTop: '12px' }}>+ New Appointment</button>
      </div>

      {showParamModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.3s ease' }} onClick={(e) => { if (e.target === e.currentTarget) setShowParamModal(false); }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: '24px', padding: '32px', width: '90%', maxWidth: '400px', border: '1px solid var(--border-color)', boxShadow: '0 25px 60px rgba(0,0,0,0.3)', animation: 'modalIn 0.3s ease forwards' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0 }}>Log Health Metric</h3>
              <button onClick={() => setShowParamModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.3rem', cursor: 'pointer', color: 'var(--text-muted)' }}>&times;</button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Parameter</label>
                <select value={newParam.category} onChange={(e) => setNewParam({...newParam, category: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
                  <option value="weight">Weight (kg)</option>
                  <option value="blood_pressure">Blood Pressure</option>
                  <option value="heart_rate">Heart Rate (bpm)</option>
                  <option value="cholesterol">Cholesterol (mg/dL)</option>
                  <option value="blood_sugar">Blood Sugar (mg/dL)</option>
                </select>
              </div>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>
                  {newParam.category === 'blood_pressure' ? 'Systolic (mmHg)' : 'Value'}
                </label>
                <input type="number" value={newParam.value} onChange={(e) => setNewParam({...newParam, value: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} placeholder="e.g. 78" />
              </div>

              {newParam.category === 'blood_pressure' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '6px' }}>Diastolic (mmHg)</label>
                  <input type="number" value={newParam.secondary_value} onChange={(e) => setNewParam({...newParam, secondary_value: e.target.value})} style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} placeholder="e.g. 80" />
                </div>
              )}
            </div>

            <button onClick={handleSaveParam} disabled={savingParam || !newParam.value} style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--primary)', color: 'white', border: 'none', fontWeight: 700, fontSize: '1rem', cursor: (savingParam || !newParam.value) ? 'not-allowed' : 'pointer', opacity: (savingParam || !newParam.value) ? 0.7 : 1 }}>
              {savingParam ? 'Saving...' : 'Save Parameter'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardOverview;
