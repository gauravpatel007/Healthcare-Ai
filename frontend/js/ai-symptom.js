/* ============================================
   LifeOS — AI Symptom Checker
   ============================================ */

const AISymptom = {
  symptomDB: {
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
    'ear pain': { conditions: ['Ear Infection', 'Otitis Media', 'TMJ', 'Swimmer\'s Ear'], specialists: ['ENT'] },
    'abdominal pain': { conditions: ['Gastritis', 'Appendicitis', 'Gallstones', 'Pancreatitis'], specialists: ['Gastroenterologist', 'General Surgeon'] },
    'anxiety': { conditions: ['Generalized Anxiety', 'Panic Disorder', 'Hyperthyroidism', 'Caffeine'], specialists: ['Psychiatrist', 'Psychologist'] },
    'weight loss': { conditions: ['Hyperthyroidism', 'Diabetes', 'Cancer', 'Depression', 'Celiac Disease'], specialists: ['Endocrinologist', 'General Physician'] },
    'insomnia': { conditions: ['Stress', 'Anxiety', 'Depression', 'Sleep Apnea', 'Restless Legs'], specialists: ['Psychiatrist', 'Sleep Specialist'] },
    'numbness': { conditions: ['Carpal Tunnel', 'Diabetes Neuropathy', 'Multiple Sclerosis', 'Stroke'], specialists: ['Neurologist'] }
  },

  init() { this.render(); },

  render() {
    const container = document.getElementById('page-ai-symptom');
    container.innerHTML = `
      <div class="section-header" style="background: var(--bg-card); padding: 24px 32px; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 52px; height: 52px; background: rgba(37,99,235,0.08); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line><line x1="11" y1="8" x2="11" y2="14"></line><line x1="8" y1="11" x2="14" y2="11"></line></svg>
          </div>
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0; font-family: 'Inter', sans-serif;">AI Symptom Checker</h2>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--success); box-shadow: 0 0 6px var(--success);"></span>
              Enter your symptoms for AI-powered analysis
            </p>
          </div>
        </div>
      </div>

      <div class="glass-card no-hover mb-xl">
        <div style="background:rgba(255,107,107,0.08); border-radius:12px; padding:16px; margin-bottom:20px; border:1px solid rgba(255,107,107,0.15);">
          <p style="font-size:0.82rem; color:var(--accent);">
            ⚠️ <strong>Disclaimer:</strong> This is NOT a medical diagnosis. It provides possible conditions based on symptoms. Always consult a healthcare professional for accurate diagnosis and treatment.
          </p>
        </div>

        <h3 style="margin-bottom:16px;">What symptoms are you experiencing?</h3>
        
        <!-- Symptom Input -->
        <div class="form-group" style="display:flex; gap:10px; align-items:center;">
          <input type="text" class="form-input" id="symptom-input" 
                 placeholder="Type a symptom (e.g., headache, fever, cough...)"
                 onkeydown="if(event.key==='Enter') AISymptom.addSymptom()"
                 style="font-size:1rem; padding:14px 18px; flex:1;">
          <button class="mic-btn" id="symptom-mic-btn" onclick="AISymptom.startVoiceRecognition()" title="Voice input">
            🎤
          </button>
        </div>

        <!-- Quick Symptom Tags -->
        <div style="margin-bottom:20px;">
          <p style="font-size:0.78rem; color:var(--text-muted); margin-bottom:8px;">Quick add:</p>
          <div class="flex flex-wrap gap-sm">
            ${['Headache', 'Fever', 'Cough', 'Fatigue', 'Nausea', 'Back Pain', 'Sore Throat', 'Dizziness', 'Chest Pain', 'Joint Pain', 'Shortness of Breath', 'Rash'].map(s => `
              <button class="tag" style="cursor:pointer;" onclick="AISymptom.addQuickSymptom('${s.toLowerCase()}')">${s}</button>
            `).join('')}
          </div>
        </div>

        <!-- Selected Symptoms -->
        <div id="selected-symptoms" class="flex flex-wrap gap-sm mb-lg"></div>

        <!-- Additional Info -->
        <div class="grid-3 gap-md mb-lg">
          <div class="form-group">
            <label class="form-label">Duration</label>
            <select class="form-select" id="symptom-duration">
              <option>Less than 24 hours</option>
              <option>1-3 days</option>
              <option>3-7 days</option>
              <option>More than a week</option>
              <option>More than a month</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Severity</label>
            <select class="form-select" id="symptom-severity">
              <option>Mild</option>
              <option>Moderate</option>
              <option>Severe</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Age Group</label>
            <select class="form-select" id="symptom-age">
              <option>Child (0-12)</option>
              <option>Teen (13-17)</option>
              <option>Adult (18-60)</option>
              <option>Senior (60+)</option>
            </select>
          </div>
        </div>

        <button class="btn btn-primary btn-lg w-full" onclick="AISymptom.analyze()">
          🔍 Analyze Symptoms
        </button>
      </div>

      <!-- Results Area -->
      <div id="symptom-results"></div>
    `;

    this.selectedSymptoms = [];
  },

  selectedSymptoms: [],

  addSymptom() {
    const input = document.getElementById('symptom-input');
    const symptom = input.value.trim().toLowerCase();
    if (symptom && !this.selectedSymptoms.includes(symptom)) {
      this.selectedSymptoms.push(symptom);
      this.updateSelectedUI();
    }
    input.value = '';
    input.focus();
  },

  addQuickSymptom(symptom) {
    if (!this.selectedSymptoms.includes(symptom)) {
      this.selectedSymptoms.push(symptom);
      this.updateSelectedUI();
    }
  },

  removeSymptom(symptom) {
    this.selectedSymptoms = this.selectedSymptoms.filter(s => s !== symptom);
    this.updateSelectedUI();
  },

  updateSelectedUI() {
    const container = document.getElementById('selected-symptoms');
    container.innerHTML = this.selectedSymptoms.map(s => `
      <span class="badge badge-primary" style="cursor:pointer; padding:6px 14px; font-size:0.82rem;" onclick="AISymptom.removeSymptom('${s}')">
        ${s} ✕
      </span>
    `).join('');
  },

  async analyze() {
    if (this.selectedSymptoms.length === 0) {
      Utils.showToast('Please add at least one symptom', 'warning');
      return;
    }

    const duration = document.getElementById('symptom-duration').value;
    const severity = document.getElementById('symptom-severity').value;
    const ageGroup = document.getElementById('symptom-age').value;
    const resultsDiv = document.getElementById('symptom-results');
    resultsDiv.innerHTML = '<div style="text-align:center; padding:40px;"><p>🤖 AI is analyzing your symptoms...</p></div>';
    resultsDiv.scrollIntoView({ behavior: 'smooth' });

    try {
      const res = await API.post('/ai/symptoms/analyze', {
        symptoms: this.selectedSymptoms,
        duration: duration,
        severity: severity,
        age_group: ageGroup
      });
      this.renderResults(res, duration, severity);
    } catch(e) {
      console.error(e);
      // Fallback
      this.fallbackAnalyze(duration, severity);
    }
  },

  renderResults(res, duration, severity) {
    const resultsDiv = document.getElementById('symptom-results');
    const urgency = res.urgency;
    let urgencyClass = 'urgency-low';
    if (urgency === 'High') urgencyClass = 'urgency-high';
    else if (urgency === 'Medium') urgencyClass = 'urgency-medium';

    resultsDiv.innerHTML = `
      <div class="glass-card no-hover mb-lg" style="animation: fadeInUp 0.5s ease;">
        <!-- Urgency Level -->
        <div class="flex justify-between items-center mb-lg">
          <h3>🔍 Analysis Results</h3>
          <div class="badge ${urgencyClass}" style="padding:8px 16px; font-size:0.88rem;">
            ${urgency === 'High' ? '🚨' : urgency === 'Medium' ? '⚠️' : '✅'} ${urgency} Urgency
          </div>
        </div>

        ${urgency === 'High' ? `
          <div style="background:rgba(255,107,107,0.1); border-radius:12px; padding:16px; margin-bottom:20px; border:1px solid rgba(255,107,107,0.2);">
            <p style="color:var(--accent); font-weight:700;">🚨 Please seek medical attention immediately!</p>
            <p style="font-size:0.82rem; color:var(--text-secondary); margin-top:4px;">Your symptoms indicate a potentially serious condition. Contact your doctor or go to the nearest emergency room.</p>
          </div>
        ` : ''}

        <!-- Symptoms Analyzed -->
        <div class="mb-lg">
          <h4 style="margin-bottom:8px;">Symptoms Analyzed:</h4>
          <div class="flex flex-wrap gap-sm">
            ${this.selectedSymptoms.map(s => `<span class="badge badge-primary">${s}</span>`).join('')}
          </div>
          <p style="font-size:0.78rem; color:var(--text-muted); margin-top:8px;">Duration: ${duration} • Severity: ${severity}</p>
        </div>

        <!-- Possible Conditions -->
        <h4 style="margin-bottom:12px;">Possible Conditions:</h4>
        <div class="grid-2 gap-md mb-lg">
          ${res.conditions.map(c => {
            const probability = c.probability;
            const probColor = probability > 70 ? 'coral' : probability > 50 ? 'gold' : 'green';
            return `
              <div class="glass-card" style="padding:16px;">
                <div class="flex justify-between items-center mb-sm">
                  <h4 style="font-size:0.92rem;">${c.condition}</h4>
                  <span style="font-weight:700; color:${probability > 70 ? 'var(--accent)' : probability > 50 ? 'var(--warning)' : 'var(--success)'};">${probability}%</span>
                </div>
                <div class="progress-bar">
                  <div class="progress-fill ${probColor}" style="width:${probability}%"></div>
                </div>
                <p style="font-size:0.72rem; color:var(--text-muted); margin-top:8px;">
                  Matched ${c.matched_symptoms || this.selectedSymptoms.length} symptoms
                </p>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Recommended Specialists -->
        <h4 style="margin-bottom:12px;">Recommended Specialists:</h4>
        <div class="flex flex-wrap gap-md mb-lg">
          ${res.specialists.map(s => `
            <div class="glass-card" style="padding:12px 20px; text-align:center;">
              <div style="font-size:1.5rem; margin-bottom:4px;">👨‍⚕️</div>
              <div style="font-size:0.85rem; font-weight:600;">${s}</div>
            </div>
          `).join('')}
        </div>

        <!-- General Recommendations -->
        <div style="background:rgba(0,210,211,0.08); border-radius:12px; padding:16px; border-left:3px solid var(--secondary);">
          <h4 style="color:var(--secondary); margin-bottom:8px;">💡 General Recommendations</h4>
          <ul style="padding-left:16px; font-size:0.85rem; color:var(--text-secondary); line-height:2;">
            ${res.recommendations.map(r => `<li>${r}</li>`).join('')}
          </ul>
        </div>
      </div>
    `;
    resultsDiv.scrollIntoView({ behavior: 'smooth' });
  },

  fallbackAnalyze(duration, severity) {
    const allConditions = {};
    const allSpecialists = new Set();
    this.selectedSymptoms.forEach(symptom => {
      const match = this.symptomDB[symptom];
      if (match) {
        match.conditions.forEach(c => allConditions[c] = (allConditions[c] || 0) + 1);
        match.specialists.forEach(s => allSpecialists.add(s));
      }
    });
    const sorted = Object.entries(allConditions).sort((a, b) => b[1] - a[1]).slice(0, 6);
    let urgency = 'Low';
    if (severity === 'Severe' || this.selectedSymptoms.includes('chest pain') || this.selectedSymptoms.includes('shortness of breath')) urgency = 'High';
    else if (severity === 'Moderate' || duration.includes('week') || this.selectedSymptoms.length >= 3) urgency = 'Medium';

    this.renderResults({
      urgency: urgency,
      conditions: sorted.map(([c, s], i) => ({ condition: c, probability: Math.min(90, 40 + s * 20 + (i === 0 ? 15 : 0)), matched_symptoms: s })),
      specialists: [...allSpecialists],
      recommendations: ["Stay hydrated and get adequate rest", "Monitor your symptoms", "Schedule an appointment if symptoms worsen"]
    }, duration, severity);
  },

  startVoiceRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      Utils.showToast('Voice recognition is not supported in your browser.', 'error');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    const micBtn = document.getElementById('symptom-mic-btn');
    const inputField = document.getElementById('symptom-input');
    const originalPlaceholder = inputField.placeholder;

    recognition.onstart = () => {
      micBtn.classList.add('listening');
      inputField.placeholder = 'Listening... Speak your symptom';
    };

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      inputField.value = speechResult;
      // Auto add symptom
      setTimeout(() => this.addSymptom(), 300);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed') {
        Utils.showToast('Microphone access denied.', 'error');
      } else {
        Utils.showToast('Could not recognize voice. Try again.', 'error');
      }
    };

    recognition.onend = () => {
      micBtn.classList.remove('listening');
      inputField.placeholder = originalPlaceholder;
    };

    recognition.start();
  }
};
