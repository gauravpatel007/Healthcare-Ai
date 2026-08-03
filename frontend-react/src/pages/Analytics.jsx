import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';
import { 
  BarChart3, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Target, 
  Sparkles, 
  Activity, 
  Stethoscope, 
  Pill,
  Droplet,
  HeartPulse,
  Scale,
  Info,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight
} from 'lucide-react';

const SectionHeader = ({ title, subtitle }) => (
  <div className="flex items-center justify-between mb-2">
    <div>
      <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">{title}</h3>
      {subtitle && <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>}
    </div>
  </div>
);

const Analytics = () => {
  useEffect(() => {
    // Override layout to hide right panel for more graph room
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

      const isDark = document.documentElement.classList.contains('dark');
      const textColor = isDark ? '#94a3b8' : '#64748b'; // slate-400 : slate-500
      const gridColor = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

      const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { 
          legend: { display: false },
          tooltip: {
            backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
            titleColor: isDark ? '#fff' : '#0f172a',
            bodyColor: isDark ? '#cbd5e1' : '#334155',
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            borderWidth: 1,
            titleFont: { family: "'Inter', sans-serif", weight: '600' },
            bodyFont: { family: "'Inter', sans-serif" },
            padding: 12,
            cornerRadius: 8,
          }
        },
        scales: {
          x: { grid: { display: false }, ticks: { color: textColor, font: { family: "'Inter', sans-serif" } } },
          y: { grid: { color: gridColor, borderDash: [5, 5] }, ticks: { color: textColor, font: { family: "'Inter', sans-serif" } } }
        }
      };

      if (sugarChartRef.current) {
        chartInstances.current.sugar = new window.Chart(sugarChartRef.current, {
          type: 'line',
          data: {
            labels: graphsData?.blood_sugar?.labels || [],
            datasets: [{ label: 'Blood Sugar (mg/dL)', data: graphsData?.blood_sugar?.values || [], borderColor: '#f43f5e', backgroundColor: isDark ? 'rgba(244,63,94,0.1)' : 'rgba(244,63,94,0.05)', fill: true, tension: 0.4 }]
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
              { label: 'Systolic', data: graphsData?.blood_pressure?.values || [], borderColor: '#f43f5e', backgroundColor: 'transparent', fill: false, tension: 0.4, borderDash: [5, 5] },
              { label: 'Diastolic', data: graphsData?.blood_pressure?.secondary_values || [], borderColor: '#6366f1', backgroundColor: isDark ? 'rgba(99,102,241,0.1)' : 'rgba(99,102,241,0.05)', fill: true, tension: 0.4 }
            ]
          },
          options: { ...commonOptions, plugins: { ...commonOptions.plugins, legend: { display: true, labels: { color: textColor, font: { family: "'Inter', sans-serif" } } } } }
        });
      }

      if (weightChartRef.current) {
        chartInstances.current.weight = new window.Chart(weightChartRef.current, {
          type: 'line',
          data: {
            labels: graphsData?.weight?.labels || [],
            datasets: [{ label: 'Weight (kg)', data: graphsData?.weight?.values || [], borderColor: '#06b6d4', backgroundColor: isDark ? 'rgba(6,182,212,0.1)' : 'rgba(6,182,212,0.05)', fill: true, tension: 0.4 }]
          },
          options: commonOptions
        });
      }

      if (cholChartRef.current) {
        chartInstances.current.chol = new window.Chart(cholChartRef.current, {
          type: 'line',
          data: {
            labels: graphsData?.cholesterol?.labels || [],
            datasets: [{ label: 'Cholesterol (mg/dL)', data: graphsData?.cholesterol?.values || [], borderColor: '#f59e0b', backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.05)', fill: true, tension: 0.4 }]
          },
          options: commonOptions
        });
      }
    }
  }, [activeTab, loading, graphsData]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 dark:text-gray-400 font-medium">Loading Analytics...</p>
      </div>
    );
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'Blood Test': return 'text-rose-500 bg-rose-50 dark:bg-rose-900/20';
      case 'Imaging': return 'text-sky-500 bg-sky-50 dark:bg-sky-900/20';
      case 'Prescription':
      case 'Medicine': return 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20';
      case 'Appointment': return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
      case 'Vaccination': return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20';
      default: return 'text-gray-500 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Blood Test': return <Droplet className="w-4 h-4" />;
      case 'Imaging': return <Activity className="w-4 h-4" />;
      case 'Prescription':
      case 'Medicine': return <Pill className="w-4 h-4" />;
      case 'Appointment': return <Stethoscope className="w-4 h-4" />;
      case 'Vaccination': return <Target className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 lg:p-10 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex items-center gap-6 relative z-10 w-full">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <BarChart3 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">
              Smart Analytics
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              Visualize your health trends and predictions
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-3">
        {[
          { id: 'timeline', icon: CalendarIcon, label: 'Health Timeline' },
          { id: 'graphs', icon: TrendingUp, label: 'Disease Progress' },
          { id: 'risk', icon: Target, label: 'Health Risk Score' },
          { id: 'predictions', icon: Sparkles, label: 'Predictions' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
                isActive 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 dark:shadow-indigo-900/20' 
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Health Timeline Tab */}
      {activeTab === 'timeline' && (
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 lg:p-10 shadow-sm border border-gray-100 dark:border-gray-700">
          <SectionHeader title="Health Timeline" subtitle="Your medical history at a glance" />
          
          <div className="mt-8 relative space-y-8">
            {/* The vertical line */}
            <div className="absolute top-0 bottom-0 left-6 w-0.5 bg-gray-100 dark:bg-gray-700/50"></div>
            
            {timelineData.length === 0 ? (
              <p className="text-gray-400 dark:text-gray-500 text-center py-8 font-medium">No health events to display. Add records and medicines to build your timeline.</p>
            ) : timelineData.map((e, i) => (
              <div key={i} className="relative pl-16">
                {/* Timeline Dot */}
                <div className={`absolute left-6 top-1/2 -translate-x-1/2 -translate-y-1/2 p-2 rounded-full border-4 border-white dark:border-gray-800 ${getTypeColor(e.type)}`}>
                  {getTypeIcon(e.type)}
                </div>
                
                {/* Content */}
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-5 border border-gray-100 dark:border-gray-700/50 transition-all hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600">
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">{e.date}</div>
                  <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-1">{e.title}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-300 font-medium mb-4">{e.description}</p>
                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${getTypeColor(e.type)}`}>
                    {e.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Graphs Tab */}
      {activeTab === 'graphs' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl"><Droplet className="w-5 h-5" /></div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Blood Sugar Trend</h3>
            </div>
            <div className="h-[240px] relative"><canvas ref={sugarChartRef}></canvas></div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-500 rounded-xl"><HeartPulse className="w-5 h-5" /></div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Blood Pressure Trend</h3>
            </div>
            <div className="h-[240px] relative"><canvas ref={bpChartRef}></canvas></div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-cyan-50 dark:bg-cyan-900/20 text-cyan-500 rounded-xl"><Scale className="w-5 h-5" /></div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Weight Trend</h3>
            </div>
            <div className="h-[240px] relative"><canvas ref={weightChartRef}></canvas></div>
          </div>
          
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-xl"><Activity className="w-5 h-5" /></div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Cholesterol Trend</h3>
            </div>
            <div className="h-[240px] relative"><canvas ref={cholChartRef}></canvas></div>
          </div>
        </div>
      )}

      {/* Risk Score Tab */}
      {activeTab === 'risk' && riskData && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 lg:p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center relative overflow-hidden flex flex-col items-center">
            <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-8 tracking-tight">AI Health Risk Score</h3>
            
            <div className="relative w-56 h-56 mx-auto mb-6">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="currentColor" strokeWidth="6" className="text-gray-100 dark:text-gray-700" />
                <circle 
                  cx="50" cy="50" r="42" fill="none" 
                  stroke={riskData.overall_score > 70 ? '#10b981' : riskData.overall_score > 40 ? '#f59e0b' : '#ef4444'} 
                  strokeWidth="8" 
                  strokeDasharray="264" 
                  strokeDashoffset={264 - (264 * riskData.overall_score) / 100} 
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out" 
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-black" style={{ color: riskData.overall_score > 70 ? '#10b981' : riskData.overall_score > 40 ? '#f59e0b' : '#ef4444' }}>
                  {riskData.overall_score}
                </span>
                <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-1">Health Score</span>
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">Your overall health risk score based on profile data</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {riskData.risks.map((r, i) => {
              const level = r.score > 60 ? 'High' : r.score > 35 ? 'Medium' : 'Low';
              const colorClass = level === 'Low' ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : level === 'Medium' ? 'text-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'text-rose-500 bg-rose-50 dark:bg-rose-900/20';
              const barColor = level === 'Low' ? 'bg-emerald-500' : level === 'Medium' ? 'bg-amber-500' : 'bg-rose-500';
              
              return (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{r.icon}</span>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">{r.name}</h4>
                    </div>
                    <span className={`px-3 py-1 rounded-xl text-xs font-bold ${colorClass}`}>
                      {level} Risk
                    </span>
                  </div>
                  
                  <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden mb-3">
                    <div className={`h-full ${barColor} rounded-full`} style={{ width: `${r.score}%` }}></div>
                  </div>
                  <div className="text-right text-xs font-bold text-gray-500 dark:text-gray-400 mb-6">
                    Risk Score: {Math.round(r.score)}%
                  </div>
                  
                  <div>
                    <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">Contributing factors</p>
                    <div className="flex flex-wrap gap-2">
                      {r.factors.map(f => (
                        <span key={f} className="px-3 py-1.5 bg-gray-50 dark:bg-gray-900/50 text-gray-600 dark:text-gray-300 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700/50">
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Predictions Tab */}
      {activeTab === 'predictions' && (
        <div className="space-y-6">
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-[1.5rem] p-6 border border-indigo-100 dark:border-indigo-800/30 flex items-start gap-4">
            <Info className="w-6 h-6 text-indigo-500 shrink-0 mt-0.5" />
            <p className="text-indigo-700 dark:text-indigo-300 font-medium text-sm leading-relaxed">
              Predictions are generated by our AI based on your historical data trends and current health metrics. They are estimates to help you track your progress and are not medical advice.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {predictionsData.map((p, i) => {
              const isGood = p.trend.includes('Decreasing') && p.name.includes('Weight') || p.trend.includes('Decreasing') && p.name.includes('Blood') || p.trend.includes('Increasing') && p.name.includes('Muscle');
              const trendIcon = p.trend.includes('Increasing') ? <ArrowUpRight className="w-5 h-5" /> : p.trend.includes('Decreasing') ? <ArrowDownRight className="w-5 h-5" /> : <ArrowRight className="w-5 h-5" />;
              const cleanTrend = p.trend.replace(/[^a-zA-Z]/g, '').trim();
              
              return (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col items-center text-center hover:shadow-lg transition-all transform hover:-translate-y-1">
                  <div className="text-4xl mb-4">{p.icon}</div>
                  <h4 className="text-lg font-extrabold text-gray-900 dark:text-white mb-6">{p.name}</h4>
                  
                  <div className="w-full grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4">
                      <div className="text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Current</div>
                      <div className="text-lg font-black text-gray-900 dark:text-white">{p.current}</div>
                    </div>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-2xl p-4">
                      <div className="text-xs font-bold text-indigo-500 dark:text-indigo-400 mb-1">Predicted</div>
                      <div className="text-lg font-black text-indigo-600 dark:text-indigo-300">{p.predicted}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl text-gray-600 dark:text-gray-300 font-bold text-sm">
                    {trendIcon}
                    {cleanTrend}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
    </div>
  );
};

export default Analytics;
