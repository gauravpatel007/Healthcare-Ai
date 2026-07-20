import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';

const Analytics = () => {
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

  const [activeTab, setActiveTab] = useState('timeline');
  const [loading, setLoading] = useState(true);
  
  const [timelineData, setTimelineData] = useState([]);
  const [graphsData, setGraphsData] = useState({});
  const [riskData, setRiskData] = useState(null);
  const [predictionsData, setPredictionsData] = useState([]);

  const sugarChartRef = useRef(null);
  const bpChartRef = useRef(null);
  const weightChartRef = useRef(null);
  const cholChartRef = useRef(null);
  
  const chartInstances = useRef({ sugar: null, bp: null, weight: null, chol: null });

  const fetchData = async () => {
    try {
      const [timeline, graphs, risks, predictions] = await Promise.all([
        API.get('/analytics/timeline'),
        API.get('/analytics/graphs'),
        API.get('/analytics/risk-scores'),
        API.get('/analytics/predictions')
      ]);
      setTimelineData(timeline || []);
      setGraphsData(graphs || {});
      setRiskData(risks || null);
      setPredictionsData(predictions || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (activeTab === 'graphs' && !loading && window.Chart) {
      // Destroy old instances
      Object.values(chartInstances.current).forEach(c => c && c.destroy());

      const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          x: { grid: { display: false } },
          y: { grid: { color: 'rgba(0,0,0,0.05)' } }
        }
      };

      if (sugarChartRef.current) {
        chartInstances.current.sugar = new window.Chart(sugarChartRef.current, {
          type: 'line',
          data: {
            labels: graphsData?.blood_sugar?.labels || [],
            datasets: [{ label: 'Blood Sugar (mg/dL)', data: graphsData?.blood_sugar?.values || [], borderColor: '#FF6B6B', backgroundColor: '#FF6B6B20', fill: true, tension: 0.4 }]
          },
          options: commonOptions
        });
      }

      if (bpChartRef.current) {
        chartInstances.current.bp = new window.Chart(bpChartRef.current, {
          type: 'line',
          data: {
            labels: graphsData?.blood_pressure?.labels || [],
            datasets: [
              { label: 'Systolic', data: graphsData?.blood_pressure?.values || [], borderColor: '#FF6B6B', backgroundColor: 'rgba(255,107,107,0.1)', fill: true, tension: 0.4 },
              { label: 'Diastolic', data: graphsData?.blood_pressure?.secondary_values || [], borderColor: '#6C5CE7', backgroundColor: 'rgba(108,92,231,0.1)', fill: true, tension: 0.4 }
            ]
          },
          options: { ...commonOptions, plugins: { legend: { display: true } } }
        });
      }

      if (weightChartRef.current) {
        chartInstances.current.weight = new window.Chart(weightChartRef.current, {
          type: 'line',
          data: {
            labels: graphsData?.weight?.labels || [],
            datasets: [{ label: 'Weight (kg)', data: graphsData?.weight?.values || [], borderColor: '#00D2D3', backgroundColor: '#00D2D320', fill: true, tension: 0.4 }]
          },
          options: commonOptions
        });
      }

      if (cholChartRef.current) {
        chartInstances.current.chol = new window.Chart(cholChartRef.current, {
          type: 'line',
          data: {
            labels: graphsData?.cholesterol?.labels || [],
            datasets: [{ label: 'Cholesterol (mg/dL)', data: graphsData?.cholesterol?.values || [], borderColor: '#FDCB6E', backgroundColor: '#FDCB6E20', fill: true, tension: 0.4 }]
          },
          options: commonOptions
        });
      }
    }
  }, [activeTab, loading, graphsData]);

  if (loading) return <div className="empty-state"><span className="spinner"></span> Loading Analytics...</div>;

  const typeColors = {
    'Blood Test': 'var(--accent)', 'Imaging': 'var(--info)', 'Prescription': 'var(--primary)',
    'Medicine': 'var(--success)', 'Appointment': 'var(--warning)', 'Vaccination': 'var(--secondary)'
  };

  return (
    <div className="page-section active">
      <div className="section-header" style={{ background: 'var(--bg-card)', padding: '24px 32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', background: 'rgba(37,99,235,0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', fontFamily: "'Inter', sans-serif" }}>Smart Analytics</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }}></span>
              Visualize your health trends and predictions
            </p>
          </div>
        </div>
      </div>
      <div className="tabs mb-lg" style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['timeline', 'graphs', 'risk', 'predictions'].map(tab => (
          <button key={tab} className={`tab ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)} style={{ padding: '8px 16px', borderRadius: '12px', background: activeTab === tab ? 'var(--primary)' : 'var(--bg-secondary)', color: activeTab === tab ? 'white' : 'var(--text-primary)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            {tab === 'timeline' ? '📅 Health Timeline' : tab === 'graphs' ? '📈 Disease Progress' : tab === 'risk' ? '🎯 Health Risk Score' : '🔮 Predictions'}
          </button>
        ))}
      </div>

      {activeTab === 'timeline' && (
        <div id="analytics-timeline" className="analytics-tab">
          <h3 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.2rem', fontWeight: 700 }}>📅 Health Timeline</h3>
          <div className="timeline" style={{ position: 'relative', paddingLeft: '20px' }}>
            {timelineData.length === 0 ? (
              <p className="text-center text-muted" style={{ padding: '40px' }}>No health events to display. Add records and medicines to build your timeline.</p>
            ) : timelineData.map((e, i) => (
              <div key={i} className="timeline-item" style={{ position: 'relative', paddingBottom: '24px' }}>
                <div className="timeline-date" style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '8px' }}>{e.date}</div>
                <div className="timeline-content" style={{ padding: '16px', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', borderLeft: `4px solid ${typeColors[e.type] || 'var(--primary)'}` }}>
                  <div className="timeline-title" style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '4px' }}>{e.title}</div>
                  <div className="timeline-desc" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{e.description}</div>
                  <span className="badge badge-primary" style={{ marginTop: '12px', display: 'inline-block', background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>{e.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'graphs' && (
        <div id="analytics-graphs" className="analytics-tab">
          <h3 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.2rem', fontWeight: 700 }}>📈 Disease Progress Graphs</h3>
          <div className="grid-2 gap-xl" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div className="glass-card no-hover" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '1rem' }}>🩸 Blood Sugar Trend</h4>
              <div className="chart-container" style={{ position: 'relative', height: '200px' }}><canvas ref={sugarChartRef}></canvas></div>
            </div>
            <div className="glass-card no-hover" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '1rem' }}>🫀 Blood Pressure Trend</h4>
              <div className="chart-container" style={{ position: 'relative', height: '200px' }}><canvas ref={bpChartRef}></canvas></div>
            </div>
            <div className="glass-card no-hover" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '1rem' }}>⚖️ Weight Trend</h4>
              <div className="chart-container" style={{ position: 'relative', height: '200px' }}><canvas ref={weightChartRef}></canvas></div>
            </div>
            <div className="glass-card no-hover" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '1rem' }}>🧬 Cholesterol Trend</h4>
              <div className="chart-container" style={{ position: 'relative', height: '200px' }}><canvas ref={cholChartRef}></canvas></div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'risk' && riskData && (
        <div id="analytics-risk" className="analytics-tab">
          <h3 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.2rem', fontWeight: 700 }}>🎯 AI Health Risk Score</h3>
          <div className="glass-card no-hover mb-xl" style={{ textAlign: 'center', background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
            <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto' }}>
              <svg width="200" height="200">
                <circle cx="100" cy="100" r="90" fill="none" stroke="var(--bg-secondary)" strokeWidth="12" />
                <circle cx="100" cy="100" r="90" fill="none" stroke={riskData.overall_score > 70 ? 'var(--success)' : riskData.overall_score > 40 ? 'var(--warning)' : 'var(--danger)'} strokeWidth="12" strokeDasharray="565" strokeDashoffset={565 - (565 * riskData.overall_score) / 100} style={{ transition: 'stroke-dashoffset 1s ease-out' }} transform="rotate(-90 100 100)" />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '3rem', fontWeight: 800, color: riskData.overall_score > 70 ? 'var(--success)' : riskData.overall_score > 40 ? 'var(--warning)' : 'var(--danger)' }}>{riskData.overall_score}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Health Score</div>
              </div>
            </div>
            <p style={{ marginTop: '16px', color: 'var(--text-secondary)' }}>Your overall health risk score based on profile data</p>
          </div>

          <div className="grid-2 gap-md" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {riskData.risks.map((r, i) => {
              const level = r.score > 60 ? 'High' : r.score > 35 ? 'Medium' : 'Low';
              return (
                <div key={i} className="glass-card no-hover" style={{ background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                  <div className="flex justify-between items-center mb-md" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <div className="flex items-center gap-sm" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '1.5rem' }}>{r.icon}</span>
                      <h4 style={{ fontWeight: 600 }}>{r.name}</h4>
                    </div>
                    <span className={`badge badge-${level === 'Low' ? 'success' : level === 'Medium' ? 'warning' : 'danger'}`} style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, background: level === 'Low' ? 'rgba(34,197,94,0.1)' : level === 'Medium' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', color: level === 'Low' ? 'var(--success)' : level === 'Medium' ? 'var(--warning)' : 'var(--danger)' }}>{level} Risk</span>
                  </div>
                  <div className="risk-meter" style={{ height: '8px', background: 'var(--bg-secondary)', borderRadius: '10px', overflow: 'hidden', marginBottom: '12px' }}>
                    <div className="risk-fill" style={{ width: `${r.score}%`, background: level === 'Low' ? 'var(--success)' : level === 'Medium' ? 'var(--warning)' : 'var(--danger)', height: '100%' }}></div>
                  </div>
                  <div className="flex justify-between items-center" style={{ fontSize: '0.82rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Risk Score: {Math.round(r.score)}%</span>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Contributing factors:</p>
                    <div className="flex flex-wrap gap-sm mt-sm" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                      {r.factors.map(f => <span key={f} className="tag" style={{ background: 'var(--bg-primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{f}</span>)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === 'predictions' && (
        <div id="analytics-predictions" className="analytics-tab">
          <h3 style={{ marginBottom: 'var(--space-lg)', fontSize: '1.2rem', fontWeight: 700 }}>🔮 Health Predictions</h3>
          <div style={{ background: 'rgba(108,92,231,0.08)', borderRadius: '12px', padding: '16px', marginBottom: '20px' }}>
            <p style={{ fontSize: '0.82rem', color: 'var(--secondary)' }}>🤖 Predictions are based on your historical data trends and are estimates, not medical advice.</p>
          </div>
          <div className="grid-3 gap-md" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '16px' }}>
            {predictionsData.map((p, i) => (
              <div key={i} className="glass-card no-hover" style={{ textAlign: 'center', background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{p.icon}</div>
                <h4 style={{ fontWeight: 600 }}>{p.name}</h4>
                <div style={{ margin: '16px 0' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Current</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text-primary)' }}>{p.current}</div>
                </div>
                <div style={{ fontSize: '1.5rem', margin: '8px 0', color: 'var(--text-muted)' }}>
                  {p.trend.includes('Increasing') ? '↗' : p.trend.includes('Decreasing') ? '↘' : '→'}
                </div>
                <div style={{ margin: '16px 0' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Predicted (3 months)</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary-light)' }}>{p.predicted}</div>
                </div>
                <span className="badge badge-primary" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>{p.trend}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Analytics;
