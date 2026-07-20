import React, { useState, useEffect } from 'react';
import API from '../utils/api';

const AIFitness = ({ voiceAction, onVoiceActionConsumed }) => {
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

  const [stats, setStats] = useState({ steps: 0, calories_burned: 0, active_minutes: 0, distance_km: 0, step_goal: 10000 });
  const [currentCategory, setCurrentCategory] = useState('cardio');
  const [customMinusVal, setCustomMinusVal] = useState('');
  const [exercises, setExercises] = useState([]);
  const [weeklyPlan, setWeeklyPlan] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const statsRes = await API.get('/ai/fitness/stats');
        if (statsRes) setStats(statsRes);
      } catch (e) {
        console.error(e);
      }
    };
    const fetchWeeklyPlan = async () => {
      try {
        const planRes = await API.get('/ai/fitness/weekly-plan');
        if (planRes?.plan) setWeeklyPlan(planRes.plan);
      } catch (e) {
        console.error(e);
      }
    };
    fetchStats();
    fetchWeeklyPlan();
  }, []);

  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        const workoutRes = await API.get(`/ai/fitness/workout?category=${currentCategory}`);
        if (workoutRes?.exercises) setExercises(workoutRes.exercises);
      } catch (e) {
        console.error(e);
      }
    };
    fetchWorkouts();
  }, [currentCategory]);

  const refreshStats = async () => {
    try {
      const statsRes = await API.get('/ai/fitness/stats');
      if (statsRes) setStats(statsRes);
    } catch (e) {
      console.error(e);
    }
  };

  const addSteps = async (count) => {
    if (count === 0) return;
    try {
      await API.post(`/ai/fitness/steps?steps=${count}`);
      await refreshStats();
    } catch (e) {
      console.error(e);
    }
  };

  const handleCustomMinus = (e) => {
    if (e.key === 'Enter') {
      const count = parseInt(customMinusVal, 10);
      if (!isNaN(count) && count > 0) {
        addSteps(-count);
      }
      setCustomMinusVal('');
    }
  };

  const logExercise = async (name, calories) => {
    try {
      await API.post(`/ai/fitness/log?exercise_name=${encodeURIComponent(name)}&duration_minutes=30&calories=${calories}`);
      await refreshStats();
      alert(`✅ ${name} logged! Burned ${calories} calories`);
    } catch (e) {
      console.error(e);
      alert('Failed to log exercise');
    }
  };

  useEffect(() => {
    if (voiceAction && voiceAction.target_feature === 'ai-fitness') {
      if (voiceAction.action_name === 'add_steps' && voiceAction.data?.steps) {
        addSteps(voiceAction.data.steps);
      } else if (voiceAction.action_name === 'log_exercise' && voiceAction.data?.exercise) {
        logExercise(voiceAction.data.exercise, voiceAction.data.calories || 150);
      }
      if (onVoiceActionConsumed) onVoiceActionConsumed();
    }
  }, [voiceAction]);

  return (
    <div className="page-section active">
      <div className="section-header" style={{ background: 'var(--bg-card)', padding: '24px 32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', background: 'rgba(37,99,235,0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', fontFamily: "'Inter', sans-serif" }}>AI Fitness Coach</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }}></span>
              Personalized workout plans and activity tracking
            </p>
          </div>
        </div>
      </div>
        <div className="dashboard-stats" style={{ marginBottom: 'var(--space-xl)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div className="stat-card">
            <div className="stat-icon green" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>👣</div>
            <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.steps.toLocaleString()}</div>
            <div className="stat-label" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Steps Today</div>
            <div className="progress-bar mt-sm" style={{ height: '6px', background: 'var(--bg-secondary)', borderRadius: '10px', overflow: 'hidden', marginTop: '8px' }}>
              <div className="progress-fill green" style={{ width: `${Math.min(100, (stats.steps / stats.step_goal) * 100)}%`, background: 'var(--success)', height: '100%' }}></div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon teal" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>📏</div>
            <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.distance_km}</div>
            <div className="stat-label" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Distance (km)</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon coral" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔥</div>
            <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.calories_burned}</div>
            <div className="stat-label" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Calories Burned</div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⏱️</div>
            <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{stats.active_minutes}</div>
            <div className="stat-label" style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Active Minutes</div>
          </div>
        </div>

        <div className="glass-card no-hover mb-xl" style={{ padding: '24px', background: 'var(--bg-card)', borderRadius: '20px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
          <div className="flex justify-between items-center mb-md">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>👣 Daily Step Counter</h3>
            <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Goal: {stats.step_goal.toLocaleString()} steps</span>
          </div>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto' }}>
              <svg width="200" height="200">
                <circle cx="100" cy="100" r="90" fill="none" stroke="var(--bg-secondary)" strokeWidth="10" />
                <circle cx="100" cy="100" r="90" fill="none" stroke={stats.steps >= stats.step_goal ? 'var(--success)' : 'var(--primary)'} strokeWidth="10" strokeDasharray="565" strokeDashoffset={565 - (565 * Math.min(stats.steps, stats.step_goal)) / stats.step_goal} style={{ transition: 'stroke-dashoffset 1s ease-out' }} transform="rotate(-90 100 100)" />
              </svg>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2.2rem', fontWeight: 800 }}>{stats.steps.toLocaleString()}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Steps</div>
              </div>
            </div>
          </div>
          <div className="flex justify-center gap-sm mt-md" style={{ flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
            <div style={{ background: 'var(--danger)', borderRadius: '50px', padding: '2px 18px', color: 'white', display: 'inline-flex', alignItems: 'center', height: '32px', boxShadow: '0 4px 12px rgba(255, 107, 107, 0.3)', opacity: stats.steps <= 0 ? 0.4 : 1 }}>
              <span style={{ fontWeight: 700, marginRight: '2px' }}>-</span>
              <input type="number" className="no-spinners no-focus-ring" value={customMinusVal} onChange={(e) => setCustomMinusVal(e.target.value)} placeholder="0" style={{ background: 'transparent', border: 'none', color: 'white', width: '65px', outline: 'none', fontWeight: 600, fontSize: '0.9rem', textAlign: 'center' }} disabled={stats.steps <= 0} onKeyDown={handleCustomMinus} />
            </div>
            <button className="btn btn-primary btn-sm" style={{ background: 'var(--primary)', color: 'white', padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer' }} onClick={() => addSteps(1000)}>+ 1,000</button>
            <button className="btn btn-secondary btn-sm" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={() => addSteps(2500)}>+ 2,500</button>
            <button className="btn btn-secondary btn-sm" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', padding: '6px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }} onClick={() => addSteps(5000)}>+ 5,000</button>
          </div>
        </div>

        <div className="tabs mb-lg" style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
          {['cardio', 'strength', 'yoga'].map(cat => (
            <button key={cat} className={`tab ${currentCategory === cat ? 'active' : ''}`} onClick={() => setCurrentCategory(cat)} style={{ padding: '8px 16px', borderRadius: '12px', background: currentCategory === cat ? 'var(--primary)' : 'var(--bg-secondary)', color: currentCategory === cat ? 'white' : 'var(--text-primary)', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
              {cat === 'cardio' ? '🏃 Cardio' : cat === 'strength' ? '💪 Strength' : '🧘 Yoga'}
            </button>
          ))}
        </div>

        <div className="grid-3 gap-md" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {exercises.map((e, i) => (
            <div key={i} className="glass-card" style={{ textAlign: 'center', padding: '24px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>{e.icon}</div>
              <h4 style={{ fontSize: '1rem', fontWeight: 700 }}>{e.name}</h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '8px 0' }}>{e.duration || e.reps}</p>
              <div className="flex justify-center gap-sm" style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                <span className="badge badge-teal" style={{ background: 'rgba(20,184,166,0.1)', color: 'var(--teal-600, #0d9488)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>🔥 {e.calories} cal</span>
                <span className={`badge ${e.difficulty === 'Easy' ? 'badge-success' : e.difficulty === 'Hard' ? 'badge-danger' : 'badge-warning'}`} style={{ background: e.difficulty === 'Easy' ? 'rgba(34,197,94,0.1)' : e.difficulty === 'Hard' ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)', color: e.difficulty === 'Easy' ? 'var(--success)' : e.difficulty === 'Hard' ? 'var(--danger)' : 'var(--warning)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>{e.difficulty}</span>
              </div>
              <button className="btn btn-sm btn-primary mt-md" style={{ marginTop: '16px', background: 'var(--primary)', color: 'white', border: 'none', padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', width: '100%' }} onClick={() => logExercise(e.name, e.calories)}>
                ✅ Log Workout
              </button>
            </div>
          ))}
        </div>

        <h3 style={{ margin: '32px 0 16px', fontSize: '1.2rem', fontWeight: 700 }}>📅 Weekly Workout Plan</h3>
        <div className="glass-card no-hover" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
          {weeklyPlan.map((d, i) => (
            <div key={i} className="list-item" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '12px 16px', margin: '0 -16px', borderBottom: i < weeklyPlan.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
              <div className="item-icon" style={{ background: `rgba(${d.rest ? '255,107,107' : '108,92,231'},0.15)`, color: d.rest ? 'var(--accent)' : 'var(--primary-light)', width: '40px', height: '40px', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
                {d.icon}
              </div>
              <div className="item-content" style={{ flex: 1 }}>
                <div className="item-title" style={{ fontWeight: 600, fontSize: '0.95rem' }}>{d.day}</div>
                <div className="item-subtitle" style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{d.workout}</div>
              </div>
              <span className={`badge ${d.rest ? 'badge-danger' : 'badge-primary'}`} style={{ background: d.rest ? 'rgba(239,68,68,0.1)' : 'rgba(37,99,235,0.1)', color: d.rest ? 'var(--danger)' : 'var(--primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>{d.duration}</span>
            </div>
          ))}
        </div>
    </div>
  );
};

export default AIFitness;
