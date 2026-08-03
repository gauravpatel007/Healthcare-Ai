import { useState, useEffect } from 'react';
import { 
  Users, Activity, Bot, Calendar, RefreshCcw,
  Stethoscope, FileText, Droplets, SmilePlus, Dumbbell, Clock, Zap,
  XCircle, Coins, TrendingUp, UserPlus, Wifi, BarChart3, Pill, ShieldAlert
} from 'lucide-react';
import API from '../../utils/api';

/* ─── Reusable Card (EXACT same design as original) ──────────── */
const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
  <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group">
    <div className={`absolute top-0 right-0 w-32 h-32 ${colorClass} opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-sm font-bold text-gray-500 mb-1 tracking-wide uppercase">{title}</p>
        <h3 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">{value}</h3>
      </div>
      <div className={`p-4 ${colorClass} bg-opacity-10 rounded-2xl shadow-sm`}>
        <Icon className="w-7 h-7" style={{ color: 'currentColor' }} />
      </div>
    </div>
    <div className="mt-5 flex items-center text-sm">
      <span className="font-semibold text-gray-400 bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-full">
        {subtitle}
      </span>
    </div>
  </div>
);

/* ─── Section Header ─────────────────────────────────────────── */
const SectionHeader = ({ title, subtitle }) => (
  <div className="flex items-center gap-3 mb-2">
    <div className="w-1.5 h-8 bg-gradient-to-b from-indigo-500 to-cyan-400 rounded-full"></div>
    <div>
      <h2 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">{title}</h2>
      {subtitle && <p className="text-gray-400 text-sm font-medium">{subtitle}</p>}
    </div>
  </div>
);

/* ─── Chart Tabs ─────────────────────────────────────────────── */
const chartTabs = [
  { key: 'ai_usage', label: 'AI Usage' },
  { key: 'user_growth', label: 'User Growth' },
  { key: 'daily_logins', label: 'Daily Logins' },
  { key: 'mood_trends', label: 'Mood Patterns' },
  { key: 'workout_usage', label: 'Workouts' },
];

/* ─── Main Component ─────────────────────────────────────────── */
const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeChart, setActiveChart] = useState('ai_usage');
  const [chartRange, setChartRange] = useState('7');
  const [chart2Range, setChart2Range] = useState('7');

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await API.getAdminStats();
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch admin stats:", error);
      // Fallback data if API fails
      setStats({
        total_users: 0, active_users: 0, total_appointments: 0,
        emergency_events: 0, ai_conversations: 0, medication_adherence: 0, system_health: 99.9,
        users: { total: 0, active_today: 0, weekly_active: 0, monthly_active: 0, new_registrations: 0, online: 0 },
        health: { symptom_scans: 0, medical_reports: 0, mood_entries: 0, workout_sessions: 0, medication_logs: 0, ai_conversations: 0 },
        ai: { requests_today: 0, avg_response_time_ms: 0, failed_requests: 0, total_tokens: 0, top_features: [], top_diseases: [] },
        charts: { user_growth: [], daily_logins: [], mood_trends: [], ai_usage: [], workout_usage: [] },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="h-96 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const u = stats.users || {};
  const h = stats.health || {};
  const ai = stats.ai || {};
  const charts = stats.charts || {};

  /* Get max value for chart scaling */
  const currentChartData = charts[activeChart] || [];
  const maxVal = Math.max(...currentChartData.map(d => d.count), 1);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* ── Header ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-gray-800 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-700">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Real-time pulse of the LifeOS Healthcare network.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchStats} className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors shadow-sm">
            <RefreshCcw className="w-5 h-5" />
          </button>
          <button className="px-6 py-3 bg-gray-900 dark:bg-indigo-600 hover:bg-black dark:hover:bg-indigo-700 text-white rounded-xl text-sm font-bold shadow-lg transition-all hover:shadow-xl hover:-translate-y-0.5">
            Download Report
          </button>
        </div>
      </div>

      {/* ── Main Stats ────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Total Users" value={(stats.total_users || 0).toLocaleString()} subtitle="Registered Accounts" icon={Users} colorClass="bg-blue-500" />
        <StatCard title="Active Users" value={(stats.active_users || 0).toLocaleString()} subtitle="Logged in recently" icon={Activity} colorClass="bg-emerald-500" />
        <StatCard title="AI Convos" value={(stats.ai_conversations || 0).toLocaleString()} subtitle="Messages processed" icon={Bot} colorClass="bg-purple-500" />
        <StatCard title="Appointments" value={(stats.total_appointments || 0).toLocaleString()} subtitle="Total scheduled" icon={Calendar} colorClass="bg-cyan-500" />
        <StatCard title="Emergency Events" value={(stats.emergency_events || 0).toLocaleString()} subtitle="SOS alerts triggered" icon={ShieldAlert} colorClass="bg-rose-500" />
      </div>

      {/* ── Platform Usage Chart ── */}
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="font-extrabold text-xl text-gray-900 dark:text-white">Platform Usage Trends</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">AI Interactions vs Active Users (Last {chartRange} Days)</p>
          </div>
          <select 
            value={chartRange}
            onChange={e => setChartRange(e.target.value)}
            className="bg-gray-50 dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-700 rounded-xl px-4 pr-10 py-2 text-sm font-bold text-gray-700 dark:text-gray-200 outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>
        
        {(() => {
          const aiData = charts.ai_usage || [];
          const loginData = charts.daily_logins || [];
          const rangeN = parseInt(chartRange);
          const displayAI = rangeN === 7 ? aiData.slice(-7) : aiData;
          const displayLogins = rangeN === 7 ? loginData.slice(-7) : loginData;
          const maxBarVal = Math.max(...displayAI.map(d => d.count), ...displayLogins.map(d => d.count), 1);
          const barData = displayAI.length > 0 ? displayAI : displayLogins;
          return (
            <div className="h-72 w-full flex items-end gap-2 px-4 relative">
              <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none">
                {[1,2,3,4,5].map(i => <div key={i} className="w-full border-t border-dashed border-gray-200 dark:border-gray-700/20"></div>)}
              </div>
              {barData.length > 0 ? barData.map((d, i) => {
                const pct = maxBarVal > 0 ? Math.max((d.count / maxBarVal) * 100, 3) : 3;
                const dayLabel = new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end group relative z-10 h-full">
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-20">
                      {d.count} — {dayLabel}
                    </div>
                    <div className="w-full bg-indigo-100 rounded-t-xl relative overflow-hidden transition-all duration-500 group-hover:bg-indigo-200" style={{ height: '100%' }}>
                      <div 
                        className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t-xl transition-all duration-700 shadow-[0_-5px_15px_rgba(79,70,229,0.3)]" 
                        style={{ height: `${pct}%` }}
                      ></div>
                    </div>
                    <div className="text-center mt-3 font-bold text-gray-400 text-xs uppercase tracking-wider">{new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' })}</div>
                  </div>
                );
              }) : (
                <div className="flex-1 flex items-center justify-center text-gray-400 font-medium">No data available</div>
              )}
            </div>
          );
        })()}
      </div>

      {/* ══════════════════════════════════════════════════════════
           NEW SECTIONS BELOW — same design system
           ══════════════════════════════════════════════════════════ */}

      {/* ── Users Breakdown ────────────────────────────────────── */}
      <SectionHeader title="Users Breakdown" subtitle="Detailed user activity metrics" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard title="Active Today" value={(u.active_today || 0).toLocaleString()} subtitle="Logged in today" icon={Activity} colorClass="bg-emerald-500" />
        <StatCard title="Weekly Active" value={(u.weekly_active || 0).toLocaleString()} subtitle="Last 7 days" icon={TrendingUp} colorClass="bg-blue-500" />
        <StatCard title="Monthly Active" value={(u.monthly_active || 0).toLocaleString()} subtitle="Last 30 days" icon={Users} colorClass="bg-indigo-500" />
        <StatCard title="New Registrations" value={(u.new_registrations || 0).toLocaleString()} subtitle="This week" icon={UserPlus} colorClass="bg-teal-500" />
        <StatCard title="Online Now" value={(u.online || 0).toLocaleString()} subtitle="Approximate" icon={Wifi} colorClass="bg-green-500" />
      </div>

      {/* ── Health Statistics ───────────────────────────────────── */}
      <SectionHeader title="Health Statistics" subtitle="Platform health feature usage" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Symptom Scans" value={(h.symptom_scans || 0).toLocaleString()} subtitle="AI diagnoses run" icon={Stethoscope} colorClass="bg-rose-500" />
        <StatCard title="Medical Reports" value={(h.medical_reports || 0).toLocaleString()} subtitle="Records uploaded" icon={FileText} colorClass="bg-blue-500" />
        <StatCard title="Mood Entries" value={(h.mood_entries || 0).toLocaleString()} subtitle="Emotional check-ins" icon={SmilePlus} colorClass="bg-amber-500" />
        <StatCard title="Workout Sessions" value={(h.workout_sessions || 0).toLocaleString()} subtitle="Fitness tracked" icon={Dumbbell} colorClass="bg-orange-500" />
        <StatCard title="Medication Logs" value={(h.medication_logs || 0).toLocaleString()} subtitle="Meds tracked" icon={Pill} colorClass="bg-purple-500" />
        <StatCard title="AI Conversations" value={(h.ai_conversations || 0).toLocaleString()} subtitle="Total messages" icon={Bot} colorClass="bg-indigo-500" />
      </div>

      {/* ── AI Analytics ────────────────────────────────────────── */}
      <SectionHeader title="AI Analytics" subtitle="Performance and usage insights" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Requests Today" value={(ai.requests_today || 0).toLocaleString()} subtitle="API calls today" icon={Zap} colorClass="bg-yellow-500" />
        <StatCard title="Avg Response" value={`${ai.avg_response_time_ms || 0}ms`} subtitle="Processing time" icon={Clock} colorClass="bg-blue-500" />
        <StatCard title="Failed Requests" value={(ai.failed_requests || 0).toLocaleString()} subtitle="Errors caught" icon={XCircle} colorClass="bg-rose-500" />
        <StatCard title="Token Usage" value={(ai.total_tokens || 0).toLocaleString()} subtitle="Tokens consumed" icon={Coins} colorClass="bg-amber-500" />
      </div>

      {/* Top Features & Diseases */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-extrabold text-lg text-gray-900 dark:text-white mb-4">Most Used AI Features</h3>
          {(ai.top_features || []).length > 0 ? (
            <div className="space-y-3">
              {ai.top_features.map((f, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-extrabold text-sm">{i + 1}</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{f.name}</span>
                  </div>
                  <span className="text-sm font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full">{f.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 font-medium text-sm">No AI usage data yet.</p>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="font-extrabold text-lg text-gray-900 dark:text-white mb-4">Top User Queries</h3>
          {(ai.top_diseases || []).length > 0 ? (
            <div className="space-y-3">
              {ai.top_diseases.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 flex items-center justify-center font-extrabold text-sm">{i + 1}</span>
                    <span className="font-bold text-gray-700 dark:text-gray-300">{d.name}</span>
                  </div>
                  <span className="text-sm font-bold bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-3 py-1 rounded-full">{d.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 font-medium text-sm">No query data yet.</p>
          )}
        </div>
      </div>

      {/* ── Charts Section (Tab Switcher + Same Gradient Style) ── */}
      <div className="flex items-center justify-between mb-2">
        <SectionHeader title="Analytics Charts" subtitle={`Visualize platform trends over the last ${chart2Range} days`} />
        <select 
            value={chart2Range}
            onChange={e => setChart2Range(e.target.value)}
            className="bg-gray-50 dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl px-4 pr-10 py-2 text-sm font-bold text-gray-700 dark:text-gray-300 outline-none focus:border-indigo-500 transition-colors cursor-pointer"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
        </select>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {chartTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveChart(tab.key)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                activeChart === tab.key
                  ? 'bg-gray-900 dark:bg-black text-white shadow-lg'
                  : 'bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-gray-100 dark:border-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chart */}
        <div className="h-72 w-full flex items-end gap-2 px-4 relative">
          {/* Grid lines */}
          <div className="absolute inset-0 flex flex-col justify-between py-4 pointer-events-none">
            {[1,2,3,4,5].map(i => <div key={i} className="w-full border-t border-dashed border-gray-200 dark:border-gray-700/20"></div>)}
          </div>
          
          {(() => {
            const range2N = parseInt(chart2Range);
            const displayData2 = range2N === 7 ? currentChartData.slice(-7) : currentChartData;
            const currentMaxVal = Math.max(...displayData2.map(d => d.count), 1);
            
            return displayData2.length > 0 ? displayData2.map((d, i) => {
              const pct = currentMaxVal > 0 ? Math.max((d.count / currentMaxVal) * 100, 3) : 3;
              const dayLabel = new Date(d.date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short' });
              return (
              <div key={i} className="flex-1 flex flex-col justify-end group relative z-10 h-full">
                {/* Tooltip */}
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-lg z-20">
                  {d.count}
                </div>
                <div className="w-full bg-indigo-100 rounded-t-xl relative overflow-hidden transition-all duration-500 group-hover:bg-indigo-200" style={{ height: '100%' }}>
                  <div 
                    className="absolute bottom-0 w-full bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t-xl transition-all duration-700 shadow-[0_-5px_15px_rgba(79,70,229,0.3)]" 
                    style={{ height: `${pct}%` }}
                  ></div>
                </div>
                <div className="text-center mt-3 font-bold text-gray-400 text-xs uppercase tracking-wider">{dayLabel}</div>
              </div>
            );
            }) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 font-medium">No data available</div>
            );
          })()}
        </div>
      </div>

    </div>
  );
};

export default AdminOverview;
