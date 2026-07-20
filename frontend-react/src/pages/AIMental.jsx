import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';

const meditations = [
  { name: 'Deep Breathing', duration: '5 min', icon: '🌬️', desc: 'Inhale 4s, hold 7s, exhale 8s' },
  { name: 'Body Scan', duration: '10 min', icon: '🧘', desc: 'Progressive muscle relaxation' },
  { name: 'Mindful Walking', duration: '15 min', icon: '🚶', desc: 'Focus on each step and breath' },
  { name: 'Gratitude Meditation', duration: '5 min', icon: '🙏', desc: "Reflect on 3 things you're grateful for" },
  { name: 'Loving Kindness', duration: '10 min', icon: '💗', desc: 'Send love to yourself and others' },
  { name: 'Sleep Meditation', duration: '15 min', icon: '🌙', desc: 'Guided relaxation for sleep' }
];

const screeningQuestions = [
  'Do you feel down, depressed, or hopeless?',
  'Do you have trouble falling or staying asleep?',
  'Do you feel tired or have little energy?',
  'Do you have poor appetite or overeating?',
  'Do you have trouble concentrating?',
  'Do you feel anxious or worried?'
];

const AIMental = ({ voiceAction, onVoiceActionConsumed }) => {
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
  const [activeTab, setActiveTab] = useState('assessment');
  const [loading, setLoading] = useState(true);
  const [moods, setMoods] = useState([]);
  const [analysis, setAnalysis] = useState(null);
  const [stress, setStress] = useState(null);
  const [journalEntry, setJournalEntry] = useState('');
  const [journalAnalysis, setJournalAnalysis] = useState(null);
  
  const [selectedMood, setSelectedMood] = useState('');
  const [screeningAnswers, setScreeningAnswers] = useState({});
  const [screeningResult, setScreeningResult] = useState(null);

  const [activeMeditation, setActiveMeditation] = useState(null);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [moodHistory, moodAnalysis, stressRes] = await Promise.all([
          API.get('/ai/mental/mood/history'),
          API.get('/ai/mental/mood/analysis'),
          API.get('/ai/mental/stress')
        ]);
        setMoods(moodHistory || []);
        setAnalysis(moodAnalysis);
        setStress(stressRes);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleLogMood = async (emoji) => {
    setSelectedMood(emoji);
    try {
      const res = await API.post('/ai/mental/mood', { mood: emoji, note: '' });
      if (res) {
        setMoods([res, ...moods].slice(0, 7));
        alert(`Mood recorded: ${emoji}`);
        const [moodAnalysis, stressRes] = await Promise.all([
          API.get('/ai/mental/mood/analysis'),
          API.get('/ai/mental/stress')
        ]);
        setAnalysis(moodAnalysis);
        setStress(stressRes);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save mood');
    }
  };

  const handleSaveJournal = async () => {
    if (!journalEntry.trim()) {
      alert('Please write something first');
      return;
    }
    
    try {
      const res = await API.post('/ai/mental/journal', { content: journalEntry });
      if (res) {
        setJournalAnalysis({ sentiment: res.sentiment, ai_analysis: res.ai_analysis });
        setJournalEntry('');
        const moodHistory = await API.get('/ai/mental/mood/history');
        if (moodHistory) setMoods(moodHistory);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to save journal');
    }
  };

  const handleStartMeditation = (meditation) => {
    setActiveTab('exercises');
    setActiveMeditation(meditation);
    setTimerSeconds(0);
    setTimerRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  useEffect(() => {
    if (voiceAction && voiceAction.target_feature === 'ai-mental') {
      if (voiceAction.action_name === 'start_meditation' && voiceAction.data?.meditation) {
        const target = meditations.find(m => m.name.toLowerCase().includes(voiceAction.data.meditation.toLowerCase()));
        if (target) {
          handleStartMeditation(target);
          setTimeout(() => toggleTimer(), 500); // Auto-start the timer
        } else {
          alert(`Could not find meditation: ${voiceAction.data.meditation}`);
        }
      }
      if (onVoiceActionConsumed) onVoiceActionConsumed();
    }
  }, [voiceAction]);

  const toggleTimer = () => {
    if (timerRunning) {
      clearInterval(timerRef.current);
      setTimerRunning(false);
    } else {
      setTimerRunning(true);
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    }
  };

  const formatTimer = (seconds) => {
    const min = Math.floor(seconds / 60).toString().padStart(2, '0');
    const sec = (seconds % 60).toString().padStart(2, '0');
    return `${min}:${sec}`;
  };

  const handleScreeningAnswer = (index, value) => {
    setScreeningAnswers({ ...screeningAnswers, [index]: parseInt(value) });
  };

  const evaluateScreening = async () => {
    const answersArr = screeningQuestions.map((_, i) => screeningAnswers[i] || 0);
    try {
      const res = await API.post('/ai/mental/screening', { answers: answersArr });
      if (res) setScreeningResult(res);
    } catch (e) {
      console.error(e);
      alert('Failed to evaluate screening');
    }
  };

  if (loading) return <div className="empty-state"><span className="spinner"></span> Loading Mental Health Data...</div>;

  const moodValues = { '😄': 5, '🙂': 4, '😐': 3, '😔': 2, '😢': 1, '😡': 1, '😰': 2 };
  const recentMoods = [...moods].reverse();

  return (
    <div className="page-section active">
      <div className="section-header" style={{ background: 'var(--bg-card)', padding: '24px 32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', background: 'rgba(37,99,235,0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line></svg>
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', fontFamily: "'Inter', sans-serif" }}>AI Mental Health Assistant</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }}></span>
              Track your mood, manage stress, and find peace
            </p>
          </div>
        </div>
      </div>
      <div className="glass-card no-hover mb-xl" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>😊 How are you feeling right now?</h3>
        <div className="mood-selector" style={{ display: 'flex', justifyContent: 'space-around', flexWrap: 'wrap', gap: '10px' }}>
          {[
            { emoji: '😄', label: 'Great' },
            { emoji: '🙂', label: 'Good' },
            { emoji: '😐', label: 'Okay' },
            { emoji: '😔', label: 'Low' },
            { emoji: '😢', label: 'Sad' },
            { emoji: '😡', label: 'Angry' },
            { emoji: '😰', label: 'Anxious' }
          ].map(m => (
            <div key={m.emoji} style={{ textAlign: 'center' }}>
              <button className={`mood-btn ${selectedMood === m.emoji ? 'selected' : ''}`} onClick={() => handleLogMood(m.emoji)} style={{ fontSize: '2.5rem', background: selectedMood === m.emoji ? 'rgba(99,102,241,0.2)' : 'transparent', border: selectedMood === m.emoji ? '2px solid var(--primary)' : '2px solid transparent', borderRadius: '50%', width: '60px', height: '60px', cursor: 'pointer', transition: 'all 0.2s' }}>{m.emoji}</button>
              <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '4px' }}>{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2 gap-xl mb-xl" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div className="glass-card no-hover" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ marginBottom: '16px', fontWeight: 600 }}>📅 Mood History (Last 7 days)</h4>
          {recentMoods.length > 0 ? (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '160px', padding: '10px 0', marginTop: '16px' }}>
              {recentMoods.map((m, i) => {
                const height = (moodValues[m.mood] || 3) * 18;
                let d = new Date();
                try {
                  if (m.created_at || m.date) {
                    d = new Date(m.created_at || m.date);
                    if (isNaN(d.getTime())) d = new Date();
                  }
                } catch (e) { }

                return (
                  <div key={i} style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '1.4rem', marginBottom: '4px' }}>{m.mood}</div>
                    <div style={{ width: '28px', height: `${height}px`, background: 'linear-gradient(to top, var(--primary), var(--primary-light))', borderRadius: '6px 6px 0 0', margin: '0 auto 8px auto' }}></div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{d.toLocaleDateString('en', { weekday: 'short' })}</div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>No mood data yet. Start tracking!</p>
          )}
          
          <div style={{ marginTop: '16px', padding: '12px', background: 'rgba(108,92,231,0.08)', borderRadius: '8px' }}>
            <p style={{ fontSize: '0.72rem', color: 'var(--secondary)', fontWeight: 700 }}>🤖 AI MOOD ANALYSIS</p>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              {analysis ? analysis.analysis : "Start tracking your mood daily to get personalized insights!"}
            </p>
          </div>
        </div>

        <div className="glass-card no-hover" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ marginBottom: '16px', fontWeight: 600 }}>😰 Stress Level Assessment</h4>
          <div style={{ textAlign: 'center', padding: '20px' }}>
            {stress && (
              <>
                <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto' }}>
                  <svg width="160" height="160">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="var(--bg-secondary)" strokeWidth="10" />
                    <circle cx="80" cy="80" r="70" fill="none" stroke={stress.stress_level > 70 ? 'var(--accent)' : stress.stress_level > 40 ? 'var(--warning)' : 'var(--success)'} strokeWidth="10" strokeDasharray="440" strokeDashoffset={440 - (440 * stress.stress_level) / 100} style={{ transition: 'stroke-dashoffset 1s ease-out' }} transform="rotate(-90 80 80)" />
                  </svg>
                  <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 800, color: stress.stress_level > 70 ? 'var(--accent)' : stress.stress_level > 40 ? 'var(--warning)' : 'var(--success)' }}>{stress.stress_level}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Stress</div>
                  </div>
                </div>
                <p style={{ marginTop: '12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  {stress.advice}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card no-hover mb-xl" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', marginBottom: '32px' }}>
        <h3 style={{ marginBottom: '16px', fontWeight: 700 }}>📝 Mood Journal</h3>
        <textarea className="form-textarea" rows="4" 
                  value={journalEntry} onChange={(e) => setJournalEntry(e.target.value)}
                  placeholder="Write about your day, feelings, or thoughts... The AI will analyze your journal for insights."
                  style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', resize: 'vertical' }}></textarea>
        <div className="flex justify-between items-center mt-md" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>🤖 AI will analyze your journal entry</span>
          <button className="btn btn-primary btn-sm" onClick={handleSaveJournal} style={{ padding: '8px 16px', background: 'var(--primary)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>📝 Save & Analyze</button>
        </div>
        
        {journalAnalysis && (
          <div id="journal-analysis" className="mt-md" style={{ marginTop: '16px' }}>
            <div style={{ background: 'rgba(108,92,231,0.08)', borderRadius: '12px', padding: '16px', borderLeft: `3px solid ${journalAnalysis.sentiment === 'Positive' ? 'var(--success)' : journalAnalysis.sentiment === 'Needs Attention' ? 'var(--warning)' : 'var(--info)'}` }}>
              <p style={{ fontSize: '0.72rem', color: 'var(--secondary)', fontWeight: 700, marginBottom: '8px' }}>🤖 AI JOURNAL ANALYSIS</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                <strong>Sentiment:</strong> <span style={{ color: journalAnalysis.sentiment === 'Positive' ? 'var(--success)' : journalAnalysis.sentiment === 'Needs Attention' ? 'var(--warning)' : 'var(--info)' }}>{journalAnalysis.sentiment}</span><br />
                <strong>Insight:</strong> {journalAnalysis.ai_analysis}
              </p>
            </div>
          </div>
        )}
      </div>

      <h3 style={{ marginBottom: 'var(--space-md)', fontWeight: 700 }}>🧘 Meditation & Relaxation</h3>
      <div className="grid-3 gap-md mb-xl" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {meditations.map(m => (
          <div key={m.name} className="glass-card" style={{ textAlign: 'center', cursor: 'pointer', background: 'var(--bg-card)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)', transition: 'transform 0.2s' }} onClick={() => handleStartMeditation(m)}>
            <div style={{ fontSize: '2.5rem', marginBottom: '8px' }}>{m.icon}</div>
            <h4 style={{ fontWeight: 600 }}>{m.name}</h4>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '8px 0' }}>{m.desc}</p>
            <span className="badge badge-primary" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>⏱ {m.duration}</span>
          </div>
        ))}
      </div>

      <div className="glass-card no-hover" style={{ borderLeft: '3px solid var(--warning)', background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', borderTop: '1px solid var(--border-color)', borderRight: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <h4 style={{ marginBottom: '12px', fontWeight: 700 }}>🔍 Quick Mental Health Check</h4>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Answer these questions honestly. This is not a diagnosis but a self-awareness tool.
        </p>
        <div id="mental-screening">
          {screeningQuestions.map((q, i) => (
            <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
              <p style={{ fontSize: '0.88rem', marginBottom: '8px' }}>{i + 1}. {q}</p>
              <div className="flex gap-sm" style={{ display: 'flex', gap: '12px' }}>
                {['Never', 'Sometimes', 'Often', 'Always'].map((a, j) => (
                  <label key={a} className="form-check" style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <input type="radio" name={`q${i}`} value={j} onChange={() => handleScreeningAnswer(i, j)} checked={screeningAnswers[i] === j} />
                    {a}
                  </label>
                ))}
              </div>
            </div>
          ))}
          <button className="btn btn-primary mt-md" onClick={evaluateScreening} style={{ marginTop: '16px', padding: '10px 20px', background: 'var(--primary)', color: 'white', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600 }}>📊 Evaluate</button>
        </div>
        
        {screeningResult && (
          <div id="screening-result">
            <div style={{ background: 'rgba(108,92,231,0.08)', borderRadius: '12px', padding: '20px', marginTop: '16px' }}>
              <div className="flex items-center gap-md mb-md" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                <div style={{ fontSize: '2rem' }}>{screeningResult.percentage <= 25 ? '✅' : screeningResult.percentage <= 50 ? '⚠️' : '🔴'}</div>
                <div>
                  <h4 style={{ color: screeningResult.percentage <= 25 ? 'var(--success)' : screeningResult.percentage <= 50 ? 'var(--warning)' : 'var(--accent)', fontWeight: 700 }}>{screeningResult.result}</h4>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Score: {screeningResult.score}/{screeningResult.max_score}</p>
                </div>
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>{screeningResult.advice}</p>
            </div>
          </div>
        )}
      </div>

      {activeMeditation && (
        <div className="modal-overlay active" style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }} onClick={(e) => { if (e.target === e.currentTarget) handleStartMeditation(null) }}>
          <div className="modal" style={{ background: '#ffffff', borderRadius: '24px', width: '100%', maxWidth: '500px', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, fontSize: '1.1rem', color: '#0f172a' }}>
                <span>{activeMeditation.icon}</span> {activeMeditation.name}
              </div>
              <button onClick={() => handleStartMeditation(null)} style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748b' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12"></path></svg>
              </button>
            </div>

            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '16px', animation: 'float 3s ease-in-out infinite' }}>{activeMeditation.icon}</div>
              <h3 style={{ fontWeight: 800, fontSize: '1.5rem', color: '#0f172a', marginBottom: '12px' }}>{activeMeditation.name}</h3>
              <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '300px', margin: '0 auto 24px auto', lineHeight: '1.5' }}>
                Find a comfortable position, close your eyes, and focus on your breath.
              </p>
              
              <div style={{ fontFamily: 'var(--font-heading), sans-serif', fontSize: '4.5rem', fontWeight: 800, color: '#3b82f6', margin: '16px 0 32px 0', letterSpacing: '-2px' }}>
                {formatTimer(timerSeconds)}
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <button onClick={toggleTimer} style={{ padding: '12px 32px', background: 'linear-gradient(135deg, #3b82f6, #0ea5e9)', color: 'white', borderRadius: '100px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem', display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 8px 16px rgba(59,130,246,0.3)' }}>
                  {timerRunning ? '⏸ Pause' : '▶ Start'}
                </button>
                <button onClick={() => { setTimerRunning(false); if (timerRef.current) clearInterval(timerRef.current); setTimerSeconds(0); }} style={{ padding: '12px 32px', background: 'transparent', color: '#64748b', borderRadius: '100px', border: '1px solid #cbd5e1', cursor: 'pointer', fontWeight: 600, fontSize: '0.95rem' }}>
                  Stop
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', borderTop: '1px solid #f1f5f9' }}>
              <button onClick={() => handleStartMeditation(null)} style={{ padding: '10px 24px', background: 'transparent', color: '#0f172a', borderRadius: '100px', border: '1px solid #e2e8f0', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                Cancel
              </button>
              <button onClick={() => { alert('Meditation session saved!'); handleStartMeditation(null); }} style={{ padding: '10px 32px', background: '#0ea5e9', color: 'white', borderRadius: '100px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                Save
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AIMental;
