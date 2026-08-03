import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import {
  Activity, HeartPulse, Flame, Target, Calendar,
  Stethoscope, FileText, Pill, Plus, ArrowRight,
  TrendingUp, Droplet, Moon, Link, Dumbbell, UtensilsCrossed, Check, Sparkles, Brain
} from 'lucide-react';

/* ─── Reusable Card (Matches AdminUI) ──────────── */
const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
  <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 relative overflow-hidden group cursor-pointer">
    <div className={`absolute top-0 right-0 w-32 h-32 ${colorClass} opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1 tracking-wide uppercase">{title}</p>
        <h3 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">{value}</h3>
      </div>
      <div className={`p-4 ${colorClass} bg-opacity-10 dark:bg-opacity-20 rounded-2xl shadow-sm transition-transform duration-300 ease-out group-hover:scale-125`}>
        <Icon className="w-7 h-7" style={{ color: 'currentColor' }} />
      </div>
    </div>
    <div className="mt-5 flex items-center text-sm">
      <span className="font-semibold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 px-3 py-1 rounded-full">
        {subtitle}
      </span>
    </div>
  </div>
);

/* ─── Section Header ─────────────────────────────────────────── */
const SectionHeader = ({ title, subtitle }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-1.5 h-8 bg-gradient-to-b from-blue-500 to-indigo-400 rounded-full"></div>
    <div>
      <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">{title}</h2>
      {subtitle && <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{subtitle}</p>}
    </div>
  </div>
);

const DashboardOverview = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [healthData, setHealthData] = useState({});
  const [fitnessStats, setFitnessStats] = useState({});
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [nutritionPlan, setNutritionPlan] = useState(null);
  const [recentRecords, setRecentRecords] = useState([]);
  const [myMeds, setMyMeds] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [todayMedLogs, setTodayMedLogs] = useState([]);

  const [isSharing, setIsSharing] = useState(false);
  const [sharedLink, setSharedLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // States for interactive components
  const [activeParam, setActiveParam] = useState('weight'); // 'weight', 'bp', 'pulse'
  const [paramTimeframe, setParamTimeframe] = useState('6months'); // '6months', '3months', 'thisMonth'
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [d, hData, fStats, nPlan, records, meds, apts, medLogs] = await Promise.all([
          API.get('/dashboard/summary').catch(() => null),
          API.get('/trackers/health-data').catch(() => ({})),
          API.get('/ai/fitness/stats').catch(() => ({})),
          API.get('/ai/nutrition/plan').catch(() => null),
          API.get('/records').catch(() => []),
          API.get('/medicines').catch(() => []),
          API.get('/appointments').catch(() => []),
          API.get('/medicines/today-logs').catch(() => [])
        ]);
        setDashboardSummary(d);
        setHealthData(hData || {});
        setFitnessStats(fStats || { steps: 0, calories_burned: 0, step_goal: 10000 });
        setNutritionPlan(nPlan || { tdee: 2200, protein_goal_grams: 84, carbs_goal_grams: 200, fat_goal_grams: 60 });
        setRecentRecords(records ? records.slice(0, 3) : []);
        setMyMeds(meds ? meds.filter(m => m.is_active).slice(0, 3) : []);
        setAppointments(apts || []);
        setTodayMedLogs(medLogs || []);
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

    let labels = [];
    let datasets = [];

    const getAggregatedData = (records, extractor) => {
      if (!records || records.length === 0) return { labels: [], data: [] };

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const currentDate = now.getDate();

      const fillNulls = (arr) => {
        let lastValid = arr.find(v => v !== null);
        if (lastValid === undefined) return arr.map(() => 0);
        const res = [...arr];
        for (let i = 0; i < res.length; i++) {
          if (res[i] !== null) lastValid = res[i];
          else res[i] = lastValid;
        }
        let firstValid = res.find(v => v !== null) || 0;
        for (let i = 0; i < res.length; i++) {
          if (res[i] === null) res[i] = firstValid;
          else break;
        }
        return res;
      };

      if (paramTimeframe === '6months' || paramTimeframe === '3months') {
        const numMonths = paramTimeframe === '6months' ? 6 : 3;
        const aggregated = [];
        const monthLabels = [];
        
        for (let i = numMonths - 1; i >= 0; i--) {
          const targetDate = new Date(currentYear, currentMonth - i, 1);
          monthLabels.push(targetDate.toLocaleDateString('en-US', { month: 'short' }));
          
          const monthRecords = records.filter(r => {
            const d = new Date(r.recorded_at || r.date);
            return d.getMonth() === targetDate.getMonth() && d.getFullYear() === targetDate.getFullYear();
          });
          
          if (monthRecords.length > 0) {
            const sum = monthRecords.reduce((acc, r) => acc + (extractor(r) || 0), 0);
            aggregated.push(sum / monthRecords.length);
          } else {
            aggregated.push(null);
          }
        }
        return { labels: monthLabels, data: fillNulls(aggregated) };
      } else {
        const weekLabels = [];
        const aggregated = [];
        
        const getCurrentWeekIdx = (dateNum) => Math.min(Math.floor((dateNum - 1) / 7), 3);
        const currentWeekIdx = getCurrentWeekIdx(currentDate);

        const thisMonthRecords = records.filter(r => {
          const d = new Date(r.recorded_at || r.date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        });

        for (let w = 0; w <= currentWeekIdx; w++) {
          weekLabels.push(`Week ${w + 1}`);
          const weekRecords = thisMonthRecords.filter(r => {
            const d = new Date(r.recorded_at || r.date);
            return getCurrentWeekIdx(d.getDate()) === w;
          });
          
          if (weekRecords.length > 0) {
            const sum = weekRecords.reduce((acc, r) => acc + (extractor(r) || 0), 0);
            aggregated.push(sum / weekRecords.length);
          } else {
            aggregated.push(null);
          }
        }
        
        const filledData = fillNulls(aggregated);
        
        if (weekLabels.length === 1) {
          weekLabels.unshift('Start');
          filledData.unshift(filledData[0]);
        }
        
        return { labels: weekLabels, data: filledData };
      }
    };

    if (activeParam === 'weight') {
      const { labels: l, data: weightData } = getAggregatedData(healthData.weight, r => r.value);
      labels = l || [];
      const fatData = weightData.map(w => w ? w * 0.25 : null);
      datasets = [
        {
          label: 'Weight', data: weightData, borderColor: '#4f46e5', backgroundColor: 'rgba(79, 70, 229, 0.05)',
          borderWidth: 2, tension: 0.5, pointRadius: 0, pointHoverRadius: 6, fill: true, spanGaps: true
        },
        {
          label: '% Fat', data: fatData, borderColor: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.05)',
          borderWidth: 2, tension: 0.5, pointRadius: 0, pointHoverRadius: 6, fill: true, spanGaps: true
        }
      ];
    } else if (activeParam === 'bp') {
      const { labels: l, data: sysData } = getAggregatedData(healthData.blood_pressure, r => r.systolic || r.value);
      labels = l || [];
      const { data: diaData } = getAggregatedData(healthData.blood_pressure, r => r.diastolic || r.secondary_value || 80);
      datasets = [
        {
          label: 'Systolic', data: sysData, borderColor: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.05)',
          borderWidth: 2, tension: 0.5, pointRadius: 0, pointHoverRadius: 6, fill: true, spanGaps: true
        },
        {
          label: 'Diastolic', data: diaData, borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.05)',
          borderWidth: 2, tension: 0.5, pointRadius: 0, pointHoverRadius: 6, fill: true, spanGaps: true
        }
      ];
    } else if (activeParam === 'pulse') {
      const { labels: l, data: pulseData } = getAggregatedData(healthData.heart_rate, r => r.value);
      labels = l || [];
      datasets = [
        {
          label: 'Heart Rate', data: pulseData, borderColor: '#8b5cf6', backgroundColor: 'rgba(139, 92, 246, 0.05)',
          borderWidth: 2, tension: 0.5, pointRadius: 0, pointHoverRadius: 6, fill: true, spanGaps: true
        }
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
            interaction: {
              mode: 'index',
              intersect: false,
            },
            plugins: {
              legend: {
                position: 'bottom',
                labels: { usePointStyle: true, pointStyle: 'circle', padding: 20, font: { family: "'Inter', sans-serif", weight: '600' } }
              },
              tooltip: {
                backgroundColor: 'rgba(15, 23, 42, 0.9)',
                titleFont: { family: "'Inter', sans-serif" },
                bodyFont: { family: "'Inter', sans-serif" },
                padding: 12,
                cornerRadius: 8,
              }
            },
            scales: {
              x: { grid: { display: false } },
              y: { grid: { color: 'rgba(0,0,0,0.05)', borderDash: [5, 5] }, beginAtZero: false }
            }
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

  const handleLogMedicine = async (medicineId, date, scheduledTime, currentStatus) => {
    try {
      const newStatus = currentStatus === 'taken' ? 'pending' : 'taken';
      const logData = {
        medicine_id: medicineId,
        date: date,
        scheduled_time: scheduledTime,
        status: newStatus
      };

      const updatedLog = await API.post('/medicines/log', logData);

      setTodayMedLogs(prev => {
        const existing = prev.findIndex(l => l.medicine_id === medicineId && l.scheduled_time === scheduledTime);
        if (existing >= 0) {
          const next = [...prev];
          next[existing] = updatedLog;
          return next;
        }
        return [...prev, updatedLog];
      });
    } catch (e) {
      console.error('Failed to log medicine', e);
      alert('Failed to log medicine');
    }
  };

  if (loading) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const userName = (() => {
    const apiName = dashboardSummary?.user_name;
    if (apiName && apiName.toLowerCase() !== 'user') return apiName;
    try {
      const accounts = JSON.parse(localStorage.getItem('lifeos_accounts') || '[]');
      const currentToken = localStorage.getItem('lifeos_token');
      const acc = accounts.find(a => a.token === currentToken);
      if (acc && acc.name && acc.name.toLowerCase() !== 'user') return acc.name;
    } catch (e) { }
    return 'User';
  })();

  const healthScore = dashboardSummary?.health_score || 85;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10 max-w-7xl mx-auto">

      {/* ── Header / Hero Section ─────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700 relative overflow-hidden p-5 sm:p-6 flex flex-wrap justify-between items-center gap-6 group">

        {/* Abstract Background Pattern */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 2px, transparent 2px)', backgroundSize: '30px 30px' }}></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 opacity-5 rounded-full blur-3xl -mr-20 -mt-20 transition-transform duration-1000 group-hover:scale-110 pointer-events-none"></div>

        {/* Greeting block */}
        <div className="relative z-10 flex-1 min-w-[280px]">
          <div className="inline-block px-3 py-1 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full mb-1.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight leading-tight">
            Good {getGreetingTime()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{userName}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mt-1">
            Keep up the great work with your personalized health goals!
          </p>
        </div>

        {/* Insights & Health Score block */}
        <div className="relative z-10 flex items-center gap-3 shrink-0">

          <div className="flex flex-col gap-2">
            <div className="bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-2xl border border-gray-100 dark:border-gray-600 flex items-center gap-2.5">
              <Flame className="w-4 h-4 text-orange-500" />
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-tight">Daily Goal</p>
                <p className="text-xs font-extrabold text-gray-800 dark:text-white leading-tight">45 mins</p>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700/50 px-3 py-2 rounded-2xl border border-gray-100 dark:border-gray-600 flex items-center gap-2.5">
              <Droplet className="w-4 h-4 text-blue-500" />
              <div>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest leading-tight">Hydration</p>
                <p className="text-xs font-extrabold text-gray-800 dark:text-white leading-tight">1.5L</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 p-3 sm:p-4 rounded-[1.5rem] border border-indigo-100 dark:border-gray-500 shadow-inner">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] font-black text-indigo-400 dark:text-gray-300 uppercase tracking-widest block mb-0.5">Health Score</span>
              <div className="flex items-baseline gap-1 justify-end">
                <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 leading-none">{healthScore}</span>
                <span className="text-xs text-indigo-400 font-bold">/100</span>
              </div>
            </div>
            <div className="relative w-16 h-16 sm:w-20 sm:h-20">
              <svg width="100%" height="100%" viewBox="0 0 96 96" className="rotate-[-90deg]">
                <circle cx="48" cy="48" r="40" fill="none" className="stroke-indigo-100 dark:stroke-gray-500" strokeWidth="8" />
                <circle cx="48" cy="48" r="40" fill="none" className="stroke-indigo-500" strokeWidth="8" strokeDasharray="251" strokeDashoffset={251 - (251 * healthScore) / 100} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.5s ease-out' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="w-6 h-6 text-indigo-500" />
              </div>
            </div>
          </div>

        </div>
      </div>



      {/* ── Main Quick Stats (Vitals & Activity) ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Steps Today"
          value={(fitnessStats?.steps || 0).toLocaleString()}
          subtitle={`Goal: ${(fitnessStats?.step_goal || 10000).toLocaleString()}`}
          icon={Activity}
          colorClass="bg-emerald-500 text-emerald-500"
        />
        <StatCard
          title="Calories Burned"
          value={fitnessStats?.calories_burned || 0}
          subtitle="Kcal active"
          icon={Flame}
          colorClass="bg-orange-500 text-orange-500"
        />
        <StatCard
          title="Heart Rate"
          value={healthData?.heart_rate?.[healthData.heart_rate.length - 1]?.value || '--'}
          subtitle="bpm (Last reading)"
          icon={HeartPulse}
          colorClass="bg-rose-500 text-rose-500"
        />
        <StatCard
          title="Sleep"
          value={`${healthData?.sleep?.[healthData.sleep.length - 1]?.value || '--'}h`}
          subtitle="Last night"
          icon={Moon}
          colorClass="bg-indigo-500 text-indigo-500"
        />
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: Charts and Parameters */}
        <div className="lg:col-span-2 space-y-6">

          {/* Health Parameters Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex flex-wrap justify-between items-center mb-8 gap-4 w-full">
              <SectionHeader title="My Parameters" subtitle="Track key health metrics over time" />
              <button
                onClick={() => setShowParamModal(true)}
                className="flex items-center justify-center gap-2 px-5 py-2.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-bold hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shrink-0"
              >
                <Plus className="w-4 h-4" /> Log Data
              </button>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6 w-full">
              <div className="flex flex-wrap items-center bg-gray-50 dark:bg-gray-900/50 p-1.5 rounded-2xl border border-gray-100 dark:border-gray-700">
                <button
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${activeParam === 'weight' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveParam('weight')}
                >
                  Weight
                </button>
                <button
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${activeParam === 'bp' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveParam('bp')}
                >
                  Blood Pressure
                </button>
                <button
                  className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${activeParam === 'pulse' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                  onClick={() => setActiveParam('pulse')}
                >
                  Pulse
                </button>
              </div>

              {/* Styled Select */}
              <div className="relative shrink-0 min-w-[140px]">
                <select
                  className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 text-sm font-bold rounded-xl px-4 py-2.5 pr-10 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer shadow-sm w-full"
                  value={paramTimeframe}
                  onChange={(e) => setParamTimeframe(e.target.value)}
                >
                  <option value="6months">Past 6 Months</option>
                  <option value="3months">Past 3 Months</option>
                  <option value="thisMonth">This Month</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                  <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="h-80 w-full relative">
              <canvas id="params-chart"></canvas>
            </div>
          </div>

          {/* Quick Actions & Sharing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
              onClick={() => navigate('/app/ai-fitness')}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2rem] p-6 text-gray-900 dark:text-gray-100 shadow-sm hover:shadow-md hover:bg-cyan-50 dark:hover:bg-cyan-900/20 hover:border-cyan-200 dark:hover:border-cyan-800 transition-all duration-300 cursor-pointer group flex justify-between items-center"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-cyan-50 dark:bg-cyan-900/30 group-hover:bg-cyan-100 dark:group-hover:bg-cyan-800/50 rounded-2xl flex items-center justify-center text-cyan-600 dark:text-cyan-400 transition-colors">
                  <Dumbbell className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-extrabold text-xl group-hover:text-cyan-900 dark:group-hover:text-cyan-100 transition-colors">Start Workout</h3>
                  <p className="text-gray-500 dark:text-gray-400 group-hover:text-cyan-600 dark:group-hover:text-cyan-300 font-medium text-sm transition-colors">AI personalized plan</p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-cyan-500 opacity-50 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
            </div>

            <div className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-[2rem] p-6 text-gray-900 dark:text-gray-100 shadow-sm flex flex-col justify-center hover:shadow-md hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:border-pink-200 dark:hover:border-pink-800 transition-all duration-300 relative group overflow-hidden cursor-pointer" onClick={!sharedLink ? handleShareSummary : undefined}>
              {!sharedLink ? (
                <div className="flex justify-between items-center w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-pink-50 dark:bg-pink-900/30 group-hover:bg-pink-100 dark:group-hover:bg-pink-800/50 rounded-2xl flex items-center justify-center text-pink-500 dark:text-pink-400 shrink-0 transition-colors">
                      <Link className="w-7 h-7" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-xl group-hover:text-pink-900 dark:group-hover:text-pink-100 transition-colors">{isSharing ? 'Generating...' : 'Doctor Summary'}</h3>
                      <p className="text-gray-500 dark:text-gray-400 group-hover:text-pink-600 dark:group-hover:text-pink-300 font-medium text-sm transition-colors">Share your health data</p>
                    </div>
                  </div>
                  <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-pink-500 opacity-50 group-hover:opacity-100 transition-all group-hover:translate-x-1" />
                </div>
              ) : (
                <div className="flex items-center gap-4 w-full animate-in fade-in duration-300 cursor-default" onClick={e => e.stopPropagation()}>
                  <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center shrink-0">
                    <Check className="w-7 h-7" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-pink-900 dark:text-pink-100 font-bold mb-1.5 truncate">Summary Link Ready!</p>
                    <div className="flex items-center gap-2 w-full bg-white dark:bg-gray-900 p-1 rounded-lg border border-pink-200 dark:border-pink-700 focus-within:border-pink-400 transition-colors shadow-inner">
                      <input type="text" readOnly value={sharedLink} className="flex-1 bg-transparent text-gray-700 dark:text-gray-300 px-2 py-0.5 text-xs font-medium outline-none truncate min-w-0" onClick={e => e.target.select()} />
                      <button onClick={(e) => { 
                          e.stopPropagation(); 
                          navigator.clipboard.writeText(sharedLink); 
                          setIsCopied(true);
                          setTimeout(() => {
                            setIsCopied(false);
                            setSharedLink('');
                          }, 5000);
                        }} 
                        className={`${isCopied ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-pink-500 hover:bg-pink-600'} text-white px-3 py-1 rounded font-bold text-xs transition-colors shadow-md shrink-0`}
                      >
                        {isCopied ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Recent Records & Medications (Split into 2 columns for better layout balance) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">

            {/* Recent Activity Card */}
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <SectionHeader title="Recent Activity" />
              </div>
              <div className="space-y-3">
                {recentRecords.length > 0 ? recentRecords.map(r => (
                  <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{r.title}</div>
                      <div className="text-xs font-medium text-gray-500">{r.date}</div>
                    </div>
                  </div>
                )) : (
                  <p className="text-xs font-medium text-gray-400 py-2">No recent records.</p>
                )}
              </div>
            </div>

            {/* Today's Medications Card */}
            <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-6">
                <SectionHeader title="Medications" />
              </div>
              <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {(() => {
                  if (!myMeds.length) return <p className="text-xs font-medium text-gray-400 py-2">No active medications.</p>;

                  const todayDoses = [];
                  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

                  myMeds.forEach(med => {
                    let slots = [];
                    if (med.frequency === 'once_daily') slots = ['Morning'];
                    else if (med.frequency === 'twice_daily') slots = ['Morning', 'Evening'];
                    else if (med.frequency === 'thrice_daily') slots = ['Morning', 'Afternoon', 'Evening'];
                    else slots = ['Anytime'];

                    slots.forEach(slot => {
                      const log = todayMedLogs.find(l => l.medicine_id === med.id && l.scheduled_time === slot);
                      todayDoses.push({
                        med,
                        slot,
                        status: log ? log.status : 'pending'
                      });
                    });
                  });

                  const currentSlot = getGreetingTime();
                  const filteredDoses = todayDoses.filter(d => d.slot === currentSlot || d.slot === 'Anytime');

                  if (!filteredDoses.length) return <p className="text-xs font-medium text-gray-400 py-2">No medications scheduled for this {currentSlot.toLowerCase()}.</p>;

                  return filteredDoses.map((dose, idx) => {
                    const isTaken = dose.status === 'taken';
                    return (
                      <div key={idx} className="flex items-start gap-4 group cursor-pointer" onClick={() => handleLogMedicine(dose.med.id, todayStr, dose.slot, dose.status)}>
                        <div className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 shadow-inner transition-colors ${isTaken ? 'bg-indigo-500 border-indigo-500 text-white' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 group-hover:border-indigo-400'}`}>
                          {isTaken && <Check className="w-3 h-3" />}
                        </div>
                        <div className={isTaken ? 'opacity-50' : ''}>
                          <p className={`text-sm font-bold transition-colors ${isTaken ? 'line-through text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-gray-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`}>{dose.med.name} {dose.med.dosage}</p>
                          <p className="text-[11px] font-black text-indigo-500 uppercase tracking-wider mt-0.5">{dose.slot} • {dose.med.times?.[0] || 'Flexible'}</p>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Nutrition, Appointments, Records */}
        <div className="space-y-6">

          {/* Nutrition Tracker */}
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <SectionHeader title="Nutrition" />
              <button onClick={() => navigate('/app/ai-nutrition')} className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 flex items-center justify-center text-gray-500 transition-colors">
                <UtensilsCrossed className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="flex items-center gap-2 text-rose-500"><Flame className="w-4 h-4" /> Protein</span>
                  <span className="text-gray-900 dark:text-gray-100">{nutritionPlan?.protein_goal_grams || 84}g</span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="flex items-center gap-2 text-amber-500"><Activity className="w-4 h-4" /> Carbs</span>
                  <span className="text-gray-900 dark:text-gray-100">{nutritionPlan?.carbs_goal_grams || 200}g</span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="flex items-center gap-2 text-indigo-500"><Droplet className="w-4 h-4" /> Fats</span>
                  <span className="text-gray-900 dark:text-gray-100">{nutritionPlan?.fat_goal_grams || 60}g</span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
            <div className="mt-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 flex justify-between items-center border border-emerald-100 dark:border-emerald-800/50">
              <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2"><Target className="w-4 h-4" /> Calories</span>
              <span className="font-extrabold text-gray-900 dark:text-gray-100">{nutritionPlan?.tdee || 2200} <span className="text-xs text-gray-500 font-medium">kcal/day</span></span>
            </div>
          </div>

          {/* My Appointments */}
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <SectionHeader title="Appointments" />
              <div className="flex bg-gray-50 dark:bg-gray-900/50 p-1 rounded-xl border border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => setAptTimeframe('today')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${aptTimeframe === 'today'
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  Today
                </button>
                <button
                  onClick={() => setAptTimeframe('week')}
                  className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${aptTimeframe === 'week'
                    ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                    }`}
                >
                  This Week
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {(() => {
                let apts = appointments || [];
                const now = new Date();
                const todayStr = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().split('T')[0];
                const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                const nextWeekStr = new Date(nextWeek.getTime() - nextWeek.getTimezoneOffset() * 60000).toISOString().split('T')[0];

                apts = apts.filter(a => {
                  if (a.status !== 'upcoming') return false;
                  const aptTime = new Date(`${a.date}T${a.time || '00:00'}`);
                  return aptTime >= now;
                });

                if (aptTimeframe === 'today') {
                  apts = apts.filter(a => a.date === todayStr);
                } else if (aptTimeframe === 'week') {
                  apts = apts.filter(a => a.date >= todayStr && a.date <= nextWeekStr);
                }

                apts.sort((a, b) => new Date(`${a.date}T${a.time || '00:00'}`) - new Date(`${b.date}T${b.time || '00:00'}`));

                if (apts.length > 0) {
                  return apts.slice(0, 3).map((apt, i) => (
                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer group">
                      <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-bold uppercase">{new Date(`1970-01-01T${apt.time}`).toLocaleTimeString([], { hour: 'numeric' })}</span>
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate text-sm">Dr. {apt.doctor}</h4>
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate">{apt.specialty}</p>
                      </div>
                    </div>
                  ));
                } else {
                  return (
                    <div className="py-6 text-center text-sm font-medium text-gray-400 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                      No appointments {aptTimeframe}
                    </div>
                  );
                }
              })()}
            </div>
            <button
              onClick={() => navigate('/app/appointments')}
              className="w-full mt-4 py-3 rounded-xl bg-gray-900 dark:bg-gray-700 text-white text-sm font-bold hover:bg-black dark:hover:bg-gray-600 transition-colors shadow-md"
            >
              Book Appointment
            </button>
          </div>

          {/* Weekly Goals Tracker */}
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-300">
            <div className="flex justify-between items-center mb-6">
              <SectionHeader title="Weekly Goals" />
              <div className="w-10 h-10 rounded-full bg-orange-50 dark:bg-orange-900/30 flex items-center justify-center text-orange-500 transition-transform hover:scale-110 cursor-pointer">
                <Target className="w-5 h-5" />
              </div>
            </div>

            <div className="space-y-6">
              {/* Goal 1 */}
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Dumbbell className="w-4 h-4 text-orange-500" /> Workouts</span>
                  <span className="text-gray-900 dark:text-gray-100">{fitnessStats?.workouts_this_week || 0} <span className="text-gray-400 font-medium">/ 5 Days</span></span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(((fitnessStats?.workouts_this_week || 0) / 5) * 100, 100)}%` }}></div>
                </div>
              </div>

              {/* Goal 2 */}
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Moon className="w-4 h-4 text-cyan-500" /> 8h Sleep</span>
                  <span className="text-gray-900 dark:text-gray-100">{
                    (healthData?.sleep || []).filter(s => s.value >= 8).length
                  } <span className="text-gray-400 font-medium">/ 7 Days</span></span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min((((healthData?.sleep || []).filter(s => s.value >= 8).length) / 7) * 100, 100)}%` }}></div>
                </div>
              </div>

              {/* Goal 3 */}
              <div>
                <div className="flex justify-between text-sm font-bold mb-2">
                  <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300"><Brain className="w-4 h-4 text-purple-500" /> Mindfulness</span>
                  <span className="text-gray-900 dark:text-gray-100">{
                    (healthData?.mindfulness || []).length
                  } <span className="text-gray-400 font-medium">/ 3 Sessions</span></span>
                </div>
                <div className="h-2.5 w-full bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-400 to-purple-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min((((healthData?.mindfulness || []).length) / 3) * 100, 100)}%` }}></div>
                </div>
              </div>

            </div>
          </div>        </div>

      </div>

      {/* ── Modal for Adding Parameter ────────────────────────────── */}
      {showParamModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) setShowParamModal(false); }}>
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white">Log Health Metric</h3>
              <button onClick={() => setShowParamModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors text-gray-500">✕</button>
            </div>

            <div className="space-y-5 mb-8">
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Parameter</label>
                <select
                  value={newParam.category}
                  onChange={(e) => setNewParam({ ...newParam, category: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="weight">Weight (kg)</option>
                  <option value="blood_pressure">Blood Pressure</option>
                  <option value="heart_rate">Heart Rate (bpm)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {newParam.category === 'blood_pressure' ? 'Systolic (mmHg)' : 'Value'}
                </label>
                <input
                  type="number"
                  value={newParam.value}
                  onChange={(e) => setNewParam({ ...newParam, value: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                  placeholder="e.g. 78"
                />
              </div>

              {newParam.category === 'blood_pressure' && (
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Diastolic (mmHg)</label>
                  <input
                    type="number"
                    value={newParam.secondary_value}
                    onChange={(e) => setNewParam({ ...newParam, secondary_value: e.target.value })}
                    className="w-full bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 dark:text-white outline-none focus:border-indigo-500 transition-colors"
                    placeholder="e.g. 80"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleSaveParam}
              disabled={savingParam || !newParam.value}
              className="w-full py-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-sm transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {savingParam ? 'Saving...' : 'Save Parameter'}
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DashboardOverview;
