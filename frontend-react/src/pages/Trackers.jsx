import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';
import { toast } from 'react-hot-toast';
import { Moon, Scale, Watch, Activity, HeartPulse, Footprints, Flame } from 'lucide-react';

/* ─── Section Header (same as Dashboard) ──────────── */
const SectionHeader = ({ title, subtitle }) => (
  <div className="flex items-center gap-3">
    <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-indigo-400 rounded-full"></div>
    <div>
      <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h2>
      {subtitle && <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{subtitle}</p>}
    </div>
  </div>
);

/* ─── Stat Mini Card (same style as Dashboard) ──────────── */
const StatMiniCard = ({ icon: Icon, value, label, colorClass }) => (
  <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 relative overflow-hidden group cursor-pointer">
    <div className={`absolute top-0 right-0 w-32 h-32 ${colorClass} opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1 tracking-wide uppercase">{label}</p>
        <h3 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">{value}</h3>
      </div>
      <div className={`p-4 ${colorClass} bg-opacity-10 dark:bg-opacity-20 rounded-2xl shadow-sm transition-transform duration-300 ease-out group-hover:scale-125`}>
        <Icon className="w-6 h-6" />
      </div>
    </div>
  </div>
);

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

  const [activeTab, setActiveTab] = useState('sleep');
  const [loading, setLoading] = useState(true);

  const [sleepData, setSleepData] = useState([]);
  const [bmiData, setBmiData] = useState(null);

  const [selectedQuality, setSelectedQuality] = useState(4);
  const [bedtime, setBedtime] = useState('23:00');
  const [waketime, setWaketime] = useState('07:00');

  const [connectedDevices, setConnectedDevices] = useState({ 'Apple Watch': false, 'Fitbit': false, 'Galaxy Watch': false });
  const [syncedWearableData, setSyncedWearableData] = useState(null);
  const [syncingWearable, setSyncingWearable] = useState(false);

  const sleepChartRef = useRef(null);
  const chartInstances = useRef({ sleep: null });

  useEffect(() => {
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
            toast.success('✅ Successfully linked real Fitbit account!');
            setConnectedDevices(prev => ({ ...prev, 'Fitbit': true }));
          } else {
            toast.error(`Fitbit Connection Failed: ${res.message}`);
          }
        } catch (e) {
          console.error("Fitbit token exchange error:", e);
          toast.error('Failed to connect Fitbit account.');
        }
      };
      exchangeCode();
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchData = async () => {
      try {
        const [sleepRes, bmiRes, wearableRes] = await Promise.all([
          API.get('/trackers/sleep'),
          API.get('/trackers/bmi'),
          API.get('/trackers/wearable/status')
        ]);
        if (isMounted) {
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
    if (activeTab === 'sleep' && sleepChartRef.current) {
      if (chartInstances.current.sleep) chartInstances.current.sleep.destroy();
      const sleepChartData = [...sleepData].slice(0, 7).reverse();
      chartInstances.current.sleep = new window.Chart(sleepChartRef.current, {
        type: 'bar',
        data: {
          labels: sleepChartData.map(s => new Date(s.date).toLocaleDateString('en', { weekday: 'short' })),
          datasets: [{
            label: 'Hours',
            data: sleepChartData.map(s => s.hours),
            backgroundColor: 'rgba(99, 102, 241, 0.3)',
            borderColor: '#6366f1',
            borderWidth: 2,
            borderRadius: 12,
            borderSkipped: false,
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              titleFont: { family: "'Inter', sans-serif", weight: '600' },
              bodyFont: { family: "'Inter', sans-serif" },
              padding: 12,
              cornerRadius: 8,
            }
          },
          scales: {
            x: { grid: { display: false } },
            y: { beginAtZero: true, suggestedMax: 12, grid: { color: 'rgba(0,0,0,0.05)', borderDash: [5, 5] } }
          }
        }
      });
    }
  }, [activeTab, loading, sleepData]);

  const handleLogSleep = async () => {
    if (!bedtime || !waketime) {
      toast.error("Please select both bedtime and wake time.");
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
      toast.success(`Sleep logged: ${sleepEntry.hours.toFixed(1)} hours`);
    } catch (e) {
      console.error("Sleep log error:", e);
      const msg = e.response?.data?.detail || e.message;
      toast.error(`Failed to log sleep: ${msg}`);
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
      toast.loading(`⌚ Connecting to ${name} (Simulation fallback)...`);
      try {
        const res = await API.post('/trackers/wearable/connect', { device_name: name });
        if (res.success) {
          setConnectedDevices(prev => ({ ...prev, [name]: true }));
          toast.dismiss();
          toast.success(`✅ Successfully connected to ${name}!`);
        }
      } catch (e) {
        console.error("Wearable connect error:", e);
        toast.dismiss();
        toast.error(`Failed to connect ${name}.`);
      }
    }
  };

  const handleSyncWearable = async () => {
    setSyncingWearable(true);
    try {
      const res = await API.get('/trackers/wearable/sync');
      setSyncedWearableData(res);
      toast.success('🔄 Data successfully synced from wearables!');
    } catch (e) {
      console.error("Wearable sync error:", e);
      toast.error('Failed to sync wearable data.');
    } finally {
      setSyncingWearable(false);
    }
  };

  const qualityEmojis = ['😫', '😔', '😐', '🙂', '😴'];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Loading Trackers...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">

      {/* ── Page Header ────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center">
              <Activity className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Smart Trackers</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"></span>
                Track your daily health metrics
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab Navigation (Dashboard pill style) ────────── */}
      <div className="flex items-center bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700 w-fit">
        {[
          { id: 'sleep', icon: Moon, label: 'Sleep' },
          { id: 'bmi', icon: Scale, label: 'BMI / BMR' },
          { id: 'wearable', icon: Watch, label: 'Wearable' }
        ].map(t => (
          <button
            key={t.id}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === t.id
                ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setActiveTab(t.id)}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* ══════ SLEEP TAB ══════ */}
      {activeTab === 'sleep' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Log Sleep Card */}
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
              <SectionHeader title="Log Sleep" subtitle="Record your nightly rest" />
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Bed Time</label>
                  <input
                    type="time"
                    value={bedtime}
                    onChange={(e) => setBedtime(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Wake Time</label>
                  <input
                    type="time"
                    value={waketime}
                    onChange={(e) => setWaketime(e.target.value)}
                    className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Sleep Quality</label>
                <div className="flex items-center justify-center gap-3">
                  {qualityEmojis.map((emoji, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedQuality(i + 1)}
                      className={`w-12 h-12 rounded-full text-xl flex items-center justify-center transition-all duration-200 ${
                        i + 1 === selectedQuality
                          ? 'bg-indigo-100 dark:bg-indigo-900/50 border-2 border-indigo-500 scale-110 shadow-md'
                          : 'bg-gray-50 dark:bg-gray-900 border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-600 hover:scale-105'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={handleLogSleep}
                className="w-full mt-8 flex items-center justify-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors shadow-md hover:shadow-lg"
              >
                <Moon className="w-4 h-4" /> Log Sleep
              </button>
            </div>

            {/* Sleep Trend Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
              <SectionHeader title="Sleep Trend" subtitle="Last 7 nights" />
              <div className="mt-6 h-[280px] relative">
                <canvas ref={sleepChartRef}></canvas>
              </div>
            </div>
          </div>

          {/* Recent Sleep Log */}
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <SectionHeader title="Recent Sleep Log" />
            <div className="space-y-3 mt-4">
              {sleepData.length > 0 ? sleepData.slice(0, 7).map((s, i) => (
                <div key={i} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 text-xl">
                    😴
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{s.hours} hours of sleep</div>
                    <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5">
                      {new Date(s.date).toLocaleDateString()} • Quality: {'⭐'.repeat(s.quality)}
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold shrink-0 ${
                    s.hours >= 7
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400'
                  }`}>
                    {s.hours >= 7 ? 'Good' : 'Low'}
                  </span>
                </div>
              )) : (
                <p className="text-sm font-medium text-gray-400 dark:text-gray-500 text-center py-8">No sleep data logged yet</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════ BMI / BMR TAB ══════ */}
      {activeTab === 'bmi' && bmiData && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* BMI Card */}
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
              <SectionHeader title="Current BMI" subtitle="Body Mass Index" />
              <div className="mt-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-8 text-center">
                <div className="text-5xl font-extrabold tracking-tight" style={{ color: bmiData.category.color }}>
                  {bmiData.bmi}
                </div>
                <div className="text-sm font-bold mt-2" style={{ color: bmiData.category.color }}>
                  {bmiData.category.label}
                </div>
                <div className="mt-6 relative">
                  <div className="w-full h-3 rounded-full bg-gradient-to-r from-blue-400 via-emerald-400 via-amber-400 to-red-400 overflow-hidden"></div>
                  <div
                    className="absolute top-[-2px] w-1 h-[18px] bg-white dark:bg-gray-200 rounded-full shadow-md"
                    style={{ left: `${Math.min(95, (bmiData.bmi / 40) * 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-2">
                  <span className="text-[10px] font-bold text-gray-400">Under 18.5</span>
                  <span className="text-[10px] font-bold text-gray-400">Normal 18.5-25</span>
                  <span className="text-[10px] font-bold text-gray-400">Over 25-30</span>
                  <span className="text-[10px] font-bold text-gray-400">Obese 30+</span>
                </div>
              </div>
              <p className="text-center mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">
                Based on Weight: {bmiData.weight}kg, Height: {bmiData.height}cm
              </p>
            </div>

            {/* BMR Calculator Card */}
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
              <SectionHeader title="BMR Calculator" subtitle="Basal Metabolic Rate" />
              <div className="mt-6 bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-8 text-center">
                <p className="text-[10px] font-extrabold text-gray-400 dark:text-gray-500 uppercase tracking-[0.15em]">Basal Metabolic Rate</p>
                <div className="text-5xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-2 tracking-tight">
                  {Math.round(bmiData.bmr)}
                </div>
                <p className="text-sm font-medium text-gray-400 dark:text-gray-500 mt-1">calories/day at rest</p>
              </div>
              <div className="mt-6">
                <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-3">Daily Calorie Needs by Activity</h4>
                <div className="space-y-1">
                  {[
                    { level: 'Sedentary', key: 'sedentary', desc: 'Little/no exercise' },
                    { level: 'Light Active', key: 'light', desc: '1-3 days/week' },
                    { level: 'Moderate', key: 'moderate', desc: '3-5 days/week' },
                    { level: 'Very Active', key: 'very_active', desc: '6-7 days/week' },
                    { level: 'Extra Active', key: 'extra_active', desc: 'Athlete level' }
                  ].map(a => (
                    <div key={a.key} className="flex items-center justify-between py-3 px-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900/30 transition-colors">
                      <div>
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{a.level}</span>
                        <span className="text-xs font-medium text-gray-400 dark:text-gray-500 ml-2">({a.desc})</span>
                      </div>
                      <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                        {Math.round(bmiData.tdee_by_activity[a.key])} cal
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'bmi' && !bmiData && (
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-12 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
          <Scale className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-sm font-bold text-gray-400 dark:text-gray-500">No BMI data available. Log your weight and height first.</p>
        </div>
      )}

      {/* ══════ WEARABLE TAB ══════ */}
      {activeTab === 'wearable' && (
        <div className="space-y-6">

          {/* Integration Hero */}
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 lg:p-10 shadow-sm border border-gray-100 dark:border-gray-700 text-center">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 rounded-3xl flex items-center justify-center mx-auto mb-5">
              <Watch className="w-10 h-10 text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">Wearable Integration</h3>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mt-2 max-w-md mx-auto">
              Connect your smart watch or fitness band to sync health data automatically.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 max-w-2xl mx-auto">
              {[
                { name: 'Apple Watch', icon: '⌚' },
                { name: 'Fitbit', icon: '📱' },
                { name: 'Galaxy Watch', icon: '⌚' }
              ].map(d => (
                <div
                  key={d.name}
                  onClick={() => handleConnectDevice(d.name)}
                  className="bg-gray-50 dark:bg-gray-900/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 rounded-2xl p-6 cursor-pointer transition-all duration-200 hover:shadow-md hover:-translate-y-1 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                >
                  <div className="text-4xl mb-3">{d.icon}</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-3">{d.name}</div>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                    connectedDevices[d.name]
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'
                      : 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                  }`}>
                    {connectedDevices[d.name] ? '✓ Connected' : 'Connect'}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap items-center justify-between mt-8 pt-6 border-t border-gray-100 dark:border-gray-700">
              <p className="text-xs font-bold text-gray-400 dark:text-gray-500">
                Sync: ❤️ Heart Rate • 😴 Sleep • 👣 Steps • 🔥 Calories
              </p>
              {Object.values(connectedDevices).some(v => v) && (
                <button
                  onClick={handleSyncWearable}
                  disabled={syncingWearable}
                  className="flex items-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
                >
                  {syncingWearable ? 'Syncing...' : '🔄 Sync Now'}
                </button>
              )}
            </div>
          </div>

          {/* Synced Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatMiniCard
              icon={HeartPulse}
              value={syncedWearableData ? syncedWearableData.heart_rate : '--'}
              label="Heart Rate (bpm)"
              colorClass="bg-rose-500 text-rose-500"
            />
            <StatMiniCard
              icon={Moon}
              value={syncedWearableData ? syncedWearableData.sleep_hours : '--'}
              label="Sleep (hours)"
              colorClass="bg-indigo-500 text-indigo-500"
            />
            <StatMiniCard
              icon={Footprints}
              value={syncedWearableData ? syncedWearableData.steps.toLocaleString() : '--'}
              label="Steps"
              colorClass="bg-emerald-500 text-emerald-500"
            />
            <StatMiniCard
              icon={Flame}
              value={syncedWearableData ? syncedWearableData.calories_burned : '--'}
              label="Calories Burned"
              colorClass="bg-amber-500 text-amber-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Trackers;
