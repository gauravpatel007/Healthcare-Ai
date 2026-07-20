import React, { useState, useRef, useEffect } from 'react';
import API from '../utils/api';

const symptomDB = {
  'headache': { conditions: ['Tension Headache', 'Migraine', 'Sinusitis', 'Dehydration'], specialists: ['Neurologist', 'General Physician'] },
  'fever': { conditions: ['Viral Infection', 'Flu', 'Dengue', 'COVID-19', 'UTI'], specialists: ['General Physician', 'Infectious Disease'] },
  'cough': { conditions: ['Common Cold', 'Bronchitis', 'Asthma', 'Pneumonia', 'COVID-19'], specialists: ['Pulmonologist', 'ENT'] },
  'chest pain': { conditions: ['Acid Reflux', 'Costochondritis', 'Angina', 'Heart Attack'], specialists: ['Cardiologist', 'Emergency'] },
  'stomach pain': { conditions: ['Gastritis', 'Food Poisoning', 'IBS', 'Appendicitis', 'Ulcer'], specialists: ['Gastroenterologist', 'General Surgeon'] },
  'back pain': { conditions: ['Muscle Strain', 'Disc Herniation', 'Sciatica', 'Kidney Stones'], specialists: ['Orthopedic', 'Physiotherapist'] },
  'sore throat': { conditions: ['Pharyngitis', 'Tonsillitis', 'Strep Throat', 'GERD'], specialists: ['ENT', 'General Physician'] },
  'fatigue': { conditions: ['Anemia', 'Hypothyroidism', 'Diabetes', 'Depression', 'Sleep Apnea'], specialists: ['General Physician', 'Endocrinologist'] },
  'joint pain': { conditions: ['Arthritis', 'Gout', 'Lupus', 'Bursitis'], specialists: ['Rheumatologist', 'Orthopedic'] },
  'dizziness': { conditions: ['Vertigo', 'Low Blood Pressure', 'Anemia', 'Inner Ear Issue'], specialists: ['ENT', 'Neurologist'] },
  'shortness of breath': { conditions: ['Asthma', 'Anxiety', 'Heart Failure', 'Pneumonia', 'COPD'], specialists: ['Pulmonologist', 'Cardiologist'] },
  'nausea': { conditions: ['Gastritis', 'Food Poisoning', 'Pregnancy', 'Migraine', 'Appendicitis'], specialists: ['Gastroenterologist', 'General Physician'] },
  'rash': { conditions: ['Allergic Reaction', 'Eczema', 'Psoriasis', 'Fungal Infection'], specialists: ['Dermatologist', 'Allergist'] },
  'eye pain': { conditions: ['Conjunctivitis', 'Glaucoma', 'Migraine', 'Eye Strain'], specialists: ['Ophthalmologist'] },
  'ear pain': { conditions: ['Ear Infection', 'Otitis Media', 'TMJ', "Swimmer's Ear"], specialists: ['ENT'] },
  'abdominal pain': { conditions: ['Gastritis', 'Appendicitis', 'Gallstones', 'Pancreatitis'], specialists: ['Gastroenterologist', 'General Surgeon'] },
  'anxiety': { conditions: ['Generalized Anxiety', 'Panic Disorder', 'Hyperthyroidism', 'Caffeine'], specialists: ['Psychiatrist', 'Psychologist'] },
  'weight loss': { conditions: ['Hyperthyroidism', 'Diabetes', 'Cancer', 'Depression', 'Celiac Disease'], specialists: ['Endocrinologist', 'General Physician'] },
  'insomnia': { conditions: ['Stress', 'Anxiety', 'Depression', 'Sleep Apnea', 'Restless Legs'], specialists: ['Psychiatrist', 'Sleep Specialist'] },
  'numbness': { conditions: ['Carpal Tunnel', 'Diabetes Neuropathy', 'Multiple Sclerosis', 'Stroke'], specialists: ['Neurologist'] }
};

const AISymptom = ({ voiceAction, onVoiceActionConsumed }) => {
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
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  
  const [duration, setDuration] = useState('1-3 days');
  const [severity, setSeverity] = useState('Moderate');
  const [ageGroup, setAgeGroup] = useState('Adult (18-60)');
  
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState(null);

  const resultsRef = useRef(null);

  const handleAddSymptom = (s) => {
    const symptom = s.trim().toLowerCase();
    if (symptom && !selectedSymptoms.includes(symptom)) {
      setSelectedSymptoms([...selectedSymptoms, symptom]);
    }
    setInputValue('');
  };

  useEffect(() => {
    if (voiceAction && voiceAction.target_feature === 'ai-symptom') {
      if (voiceAction.action_name === 'check_symptoms' && voiceAction.data) {
        if (voiceAction.data.duration) setDuration(voiceAction.data.duration);
        if (voiceAction.data.severity) setSeverity(voiceAction.data.severity);
        if (voiceAction.data.age_group) setAgeGroup(voiceAction.data.age_group);
        if (voiceAction.data.symptoms && Array.isArray(voiceAction.data.symptoms)) {
          const newSymptoms = voiceAction.data.symptoms.map(s => s.toLowerCase());
          setSelectedSymptoms(prev => [...new Set([...prev, ...newSymptoms])]);
          // Automatically trigger analysis after a short delay to allow state update
          setTimeout(() => analyze(), 500);
        }
      }
      if (onVoiceActionConsumed) onVoiceActionConsumed();
    }
  }, [voiceAction]);

  const handleRemoveSymptom = (symptom) => {
    setSelectedSymptoms(selectedSymptoms.filter(s => s !== symptom));
  };

  const startVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in your browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      setInputValue(speechResult);
      setTimeout(() => handleAddSymptom(speechResult), 300);
    };
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      alert('Could not recognize voice. Try again.');
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const analyze = async () => {
    if (selectedSymptoms.length === 0) {
      alert('Please add at least one symptom');
      return;
    }

    setAnalyzing(true);
    setResults(null);
    setTimeout(() => {
      if (resultsRef.current) resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }, 100);

    try {
      const res = await API.post('/ai/symptoms/analyze', {
        symptoms: selectedSymptoms,
        duration: duration,
        severity: severity,
        age_group: ageGroup
      });
      setResults(res);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (e) {
      alert('Failed to analyze symptoms');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="page-section active">
      <div className="section-header" style={{ background: 'var(--bg-card)', padding: '24px 32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', background: 'rgba(37,99,235,0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', fontFamily: "'Inter', sans-serif" }}>AI Symptom Checker</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }}></span>
              Enter your symptoms for AI-powered analysis
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card no-hover mb-xl" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)', minHeight: 'calc(100vh - 200px)' }}>
        <div style={{ background: 'rgba(255,107,107,0.08)', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid rgba(255,107,107,0.15)' }}>
          <p style={{ fontSize: '0.82rem', color: 'var(--accent)' }}>
            ⚠️ <strong>Disclaimer:</strong> This is NOT a medical diagnosis. It provides possible conditions based on symptoms. Always consult a healthcare professional for accurate diagnosis and treatment.
          </p>
        </div>

        <h3 style={{ marginBottom: '16px', fontSize: '1.2rem', fontWeight: 700 }}>What symptoms are you experiencing?</h3>
        
        <div className="form-group" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '16px' }}>
          <input type="text" className="form-input" 
                 placeholder={isListening ? "Listening... Speak your symptom" : "Type a symptom (e.g., headache, fever, cough...)"}
                 value={inputValue}
                 onChange={(e) => setInputValue(e.target.value)}
                 onKeyDown={(e) => { if (e.key === 'Enter') handleAddSymptom(inputValue) }}
                 style={{ fontSize: '1rem', padding: '14px 18px', flex: 1, borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }} />
          <button className={`mic-btn ${isListening ? 'listening' : ''}`} onClick={startVoiceRecognition} title="Voice input" style={{ width: '50px', height: '50px', borderRadius: '12px', border: 'none', background: isListening ? 'var(--accent)' : 'var(--bg-secondary)', cursor: 'pointer', fontSize: '1.2rem' }}>
            🎤
          </button>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '8px' }}>Quick add:</p>
          <div className="flex flex-wrap gap-sm" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['Headache', 'Fever', 'Cough', 'Fatigue', 'Nausea', 'Back Pain', 'Sore Throat', 'Dizziness', 'Chest Pain', 'Joint Pain', 'Shortness of Breath', 'Rash'].map(s => (
              <button key={s} className="tag" style={{ cursor: 'pointer', background: 'var(--bg-secondary)', padding: '6px 12px', borderRadius: '8px', border: 'none', fontSize: '0.85rem' }} onClick={() => handleAddSymptom(s)}>{s}</button>
            ))}
          </div>
        </div>

        {selectedSymptoms.length > 0 && (
          <div id="selected-symptoms" className="flex flex-wrap gap-sm mb-lg" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
            {selectedSymptoms.map(s => (
              <span key={s} className="badge badge-primary" style={{ cursor: 'pointer', padding: '6px 14px', fontSize: '0.82rem', background: 'var(--primary)', color: 'white', borderRadius: '8px' }} onClick={() => handleRemoveSymptom(s)}>
                {s} ✕
              </span>
            ))}
          </div>
        )}

        <div className="grid-3 gap-md mb-lg" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Duration</label>
            <select className="form-select" value={duration} onChange={(e) => setDuration(e.target.value)} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
              <option>Less than 24 hours</option><option>1-3 days</option><option>3-7 days</option><option>More than a week</option><option>More than a month</option>
            </select>
          </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Severity</label>
            <select className="form-select" value={severity} onChange={(e) => setSeverity(e.target.value)} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
              <option>Mild</option><option>Moderate</option><option>Severe</option>
            </select>
          </div>
          <div className="form-group" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label className="form-label" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Age Group</label>
            <select className="form-select" value={ageGroup} onChange={(e) => setAgeGroup(e.target.value)} style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-input)' }}>
              <option>Child (0-12)</option><option>Teen (13-17)</option><option>Adult (18-60)</option><option>Senior (60+)</option>
            </select>
          </div>
        </div>

        <button className="btn btn-primary btn-lg w-full" onClick={analyze} style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 600, background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '12px', cursor: 'pointer' }}>
          🔍 Analyze Symptoms
        </button>
      </div>

      <div ref={resultsRef} id="symptom-results" style={{ marginTop: '32px' }}>
        {analyzing && <div style={{ textAlign: 'center', padding: '40px' }}><p>🤖 AI is analyzing your symptoms...</p></div>}
        
        {results && (
          <div className="glass-card no-hover mb-lg" style={{ animation: 'fadeInUp 0.5s ease', background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <div className="flex justify-between items-center mb-lg" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>🔍 Analysis Results</h3>
              <div className={`badge urgency-${results.urgency.toLowerCase()}`} style={{ padding: '8px 16px', fontSize: '0.88rem', background: results.urgency === 'High' ? 'rgba(239,68,68,0.1)' : results.urgency === 'Medium' ? 'rgba(245,158,11,0.1)' : 'rgba(34,197,94,0.1)', color: results.urgency === 'High' ? 'var(--danger)' : results.urgency === 'Medium' ? 'var(--warning)' : 'var(--success)', borderRadius: '8px', fontWeight: 600 }}>
                {results.urgency === 'High' ? '🚨' : results.urgency === 'Medium' ? '⚠️' : '✅'} {results.urgency} Urgency
              </div>
            </div>

            {results.urgency === 'High' && (
              <div style={{ background: 'rgba(255,107,107,0.1)', borderRadius: '12px', padding: '16px', marginBottom: '20px', border: '1px solid rgba(255,107,107,0.2)' }}>
                <p style={{ color: 'var(--accent)', fontWeight: 700 }}>🚨 Please seek medical attention immediately!</p>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>Your symptoms indicate a potentially serious condition. Contact your doctor or go to the nearest emergency room.</p>
              </div>
            )}

            <div className="mb-lg" style={{ marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '8px', fontWeight: 600 }}>Symptoms Analyzed:</h4>
              <div className="flex flex-wrap gap-sm" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {selectedSymptoms.map(s => <span key={s} className="badge badge-primary" style={{ background: 'rgba(37,99,235,0.1)', color: 'var(--primary)', padding: '4px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>{s}</span>)}
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '8px' }}>Duration: {duration} • Severity: {severity}</p>
            </div>

            <h4 style={{ marginBottom: '12px', fontWeight: 600 }}>Possible Conditions:</h4>
            <div className="grid-2 gap-md mb-lg" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '16px', marginBottom: '24px' }}>
              {results.conditions.map(c => {
                const probColor = c.probability > 70 ? 'coral' : c.probability > 50 ? 'gold' : 'green';
                return (
                  <div key={c.condition} className="glass-card" style={{ padding: '16px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                    <div className="flex justify-between items-center mb-sm" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 600 }}>{c.condition}</h4>
                      <span style={{ fontWeight: 700, color: c.probability > 70 ? 'var(--accent)' : c.probability > 50 ? 'var(--warning)' : 'var(--success)' }}>{c.probability}%</span>
                    </div>
                    <div className="progress-bar" style={{ height: '6px', background: 'rgba(0,0,0,0.05)', borderRadius: '10px', overflow: 'hidden' }}>
                      <div className={`progress-fill ${probColor}`} style={{ width: `${c.probability}%`, background: c.probability > 70 ? 'var(--accent)' : c.probability > 50 ? 'var(--warning)' : 'var(--success)', height: '100%' }}></div>
                    </div>
                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                      Matched {c.matched_symptoms || selectedSymptoms.length} symptoms
                    </p>
                  </div>
                );
              })}
            </div>

            <h4 style={{ marginBottom: '12px', fontWeight: 600 }}>Recommended Specialists:</h4>
            <div className="flex flex-wrap gap-md mb-lg" style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
              {results.specialists.map(s => (
                <div key={s} className="glass-card" style={{ padding: '12px 20px', textAlign: 'center', background: 'var(--bg-secondary)', borderRadius: '12px', flex: 1, minWidth: '120px' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '4px' }}>👨‍⚕️</div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>{s}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(0,210,211,0.08)', borderRadius: '12px', padding: '16px', borderLeft: '3px solid var(--secondary)' }}>
              <h4 style={{ color: 'var(--secondary)', marginBottom: '8px', fontWeight: 600 }}>💡 General Recommendations</h4>
              <ul style={{ paddingLeft: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 2, margin: 0 }}>
                {results.recommendations.map(r => <li key={r}>{r}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AISymptom;
