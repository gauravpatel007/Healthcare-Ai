/* ============================================
   LifeOS — AI Health Assistant & Chat Doctor
   ============================================ */

const AIAssistant = {
  init() { this.render(); },

  responses: {
    greetings: ['Hello! I\'m your LifeOS AI Health Assistant. How can I help you today?', 'Hi there! Ready to help with any health questions.', 'Welcome! Ask me about medicines, first aid, or health concerns.'],

    medicine: {
      'paracetamol': 'Paracetamol (Acetaminophen) is used for pain relief and fever reduction. Usual adult dose: 500mg-1g every 4-6 hours. Max: 4g/day. Avoid with alcohol. Side effects are rare but may include liver damage at high doses.',
      'ibuprofen': 'Ibuprofen is an NSAID used for pain, inflammation, and fever. Usual dose: 200-400mg every 4-6 hours. Take with food. Avoid if you have stomach ulcers or kidney issues.',
      'amoxicillin': 'Amoxicillin is an antibiotic used for bacterial infections. Always complete the full course. Take with or without food. May cause diarrhea or allergic reactions.',
      'metformin': 'Metformin is used for Type 2 Diabetes management. It lowers blood sugar levels. Take with meals. Common side effects: stomach upset, diarrhea. Avoid with alcohol.',
      'omeprazole': 'Omeprazole is a proton pump inhibitor for acid reflux and stomach ulcers. Take before meals. Long-term use may affect calcium absorption.',
      'cetirizine': 'Cetirizine is an antihistamine for allergies. It reduces sneezing, itching, and runny nose. May cause drowsiness. Usual dose: 10mg once daily.',
      'aspirin': 'Aspirin is used for pain relief, fever, and blood thinning. Low-dose aspirin (75-150mg) is used to prevent heart attacks. Take with food to avoid stomach irritation.'
    },

    firstAid: {
      'burn': '🔥 Burns First Aid:\n1. Cool the burn under running water for 20 minutes\n2. Remove jewelry/clothing (if not stuck)\n3. Cover with sterile, non-fluffy dressing\n4. Do NOT apply ice, butter, or toothpaste\n5. Take paracetamol for pain\n6. Seek medical help for severe burns',
      'cut': '🩹 Cuts First Aid:\n1. Apply pressure with clean cloth to stop bleeding\n2. Clean the wound under running water\n3. Apply antiseptic\n4. Cover with sterile bandage\n5. Get tetanus shot if deep/dirty wound\n6. Seek help if bleeding doesn\'t stop in 10 minutes',
      'choking': '😰 Choking First Aid:\n1. Encourage coughing\n2. Give 5 back blows between shoulder blades\n3. Give 5 abdominal thrusts (Heimlich maneuver)\n4. Alternate between back blows and thrusts\n5. Call emergency if person becomes unconscious\n6. Start CPR if needed',
      'fever': '🌡️ Fever Management:\n1. Rest and stay hydrated\n2. Take paracetamol or ibuprofen\n3. Use lukewarm sponge bath\n4. Wear light clothing\n5. Monitor temperature regularly\n6. Seek medical help if fever >103°F or lasts >3 days',
      'sprain': '🦶 Sprain First Aid (RICE):\n1. Rest - Stop activity\n2. Ice - Apply ice pack for 15-20 min\n3. Compression - Elastic bandage\n4. Elevation - Keep above heart level\n5. Take anti-inflammatory medicine\n6. See doctor if severe swelling/pain'
    },

    healthTips: [
      '💡 Drink at least 8 glasses of water daily to stay hydrated and support kidney function.',
      '💡 Take a 30-minute walk daily — it reduces heart disease risk by 30%.',
      '💡 Get 7-9 hours of sleep for optimal brain function and immune health.',
      '💡 Eat 5 servings of fruits and vegetables daily for essential vitamins.',
      '💡 Practice deep breathing for 5 minutes daily to reduce stress hormones.',
      '💡 Limit screen time before bed — blue light disrupts melatonin production.',
      '💡 Schedule regular health checkups — early detection saves lives.',
      '💡 Maintain good posture to prevent back pain and spinal issues.',
      '💡 Reduce sodium intake to less than 2,300mg/day for heart health.',
      '💡 Laugh more! It boosts immune cells and reduces stress hormones.'
    ]
  },

  async render() {
    let chatHistory = [];
    try {
      const history = await API.get('/ai/chat/history');
      chatHistory = history.map(m => ({ role: m.role, text: m.content }));
    } catch (e) {
      console.error('Failed to load chat history', e);
      chatHistory = [];
    }
    const container = document.getElementById('page-ai-chat');

    container.innerHTML = `
      <div class="section-header" style="background: var(--bg-card); padding: 24px 32px; border-radius: 16px; border: 1px solid var(--border-color); box-shadow: 0 4px 20px rgba(0,0,0,0.03); margin-bottom: 28px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px;">
        <div style="display: flex; align-items: center; gap: 16px;">
          <div style="width: 52px; height: 52px; background: rgba(37,99,235,0.08); border-radius: 14px; display: flex; align-items: center; justify-content: center; color: var(--primary);">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          </div>
          <div>
            <h2 style="font-size: 1.5rem; font-weight: 700; color: var(--text-primary); margin: 0 0 4px 0; font-family: 'Inter', sans-serif;">AI Health Assistant</h2>
            <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary); display: flex; align-items: center; gap: 8px;">
              <span style="display: inline-block; width: 6px; height: 6px; border-radius: 50%; background: var(--success); box-shadow: 0 0 6px var(--success);"></span>
              24/7 AI-powered health guidance
            </p>
          </div>
        </div>
        <div class="flex gap-md">
          <button class="btn btn-secondary" onclick="AIAssistant.showTips()" style="font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 600; padding: 10px 18px; display: flex; align-items: center; gap: 8px;">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            Daily Tips
          </button>
          <button class="btn btn-secondary" onclick="AIAssistant.clearChat()" style="font-family: 'Inter', sans-serif; font-size: 0.9rem; font-weight: 600; padding: 10px 18px; display: flex; align-items: center; gap: 8px; color: var(--danger);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            Clear Chat
          </button>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid-4 gap-md mb-xl">
        <div class="glass-card" style="text-align:center; cursor:pointer; padding:20px;" onclick="AIAssistant.quickAction('medicine')">
          <div style="font-size:2rem; margin-bottom:8px;">💊</div>
          <div style="font-size:0.82rem; font-weight:600;">Medicine Info</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Drug information</div>
        </div>
        <div class="glass-card" style="text-align:center; cursor:pointer; padding:20px;" onclick="AIAssistant.quickAction('firstaid')">
          <div style="font-size:2rem; margin-bottom:8px;">🩹</div>
          <div style="font-size:0.82rem; font-weight:600;">First Aid</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Emergency guide</div>
        </div>
        <div class="glass-card" style="text-align:center; cursor:pointer; padding:20px;" onclick="AIAssistant.quickAction('report')">
          <div style="font-size:2rem; margin-bottom:8px;">📋</div>
          <div style="font-size:0.82rem; font-weight:600;">Report Q&A</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Explain results</div>
        </div>
        <div class="glass-card" style="text-align:center; cursor:pointer; padding:20px;" onclick="AIAssistant.quickAction('general')">
          <div style="font-size:2rem; margin-bottom:8px;">🏥</div>
          <div style="font-size:0.82rem; font-weight:600;">General Health</div>
          <div style="font-size:0.72rem; color:var(--text-muted);">Any question</div>
        </div>
      </div>



      <!-- Chat Interface -->
      <div class="chat-container" id="ai-chat-container">
        <div class="chat-messages" id="chat-messages">
          ${chatHistory.length > 0 ? chatHistory.map(m => this.renderMessage(m)).join('') : `
            <div class="chat-message ai">
              <div class="ai-label">🤖 LifeOS AI</div>
              ${this.responses.greetings[0]}
              <div style="margin-top:12px; font-size:0.82rem;">
                Try asking me:
                <ul style="margin-top:4px; padding-left:16px; color:var(--text-secondary);">
                  <li>What is paracetamol used for?</li>
                  <li>First aid for burns</li>
                  <li>Why is my hemoglobin low?</li>
                  <li>Give me a health tip</li>
                </ul>
              </div>
            </div>
          `}
        </div>
        <div class="chat-input-area" style="display:flex; gap:10px; align-items:center;">
          <input type="text" id="chat-input" placeholder="Ask me anything about health..." 
                 onkeydown="if(event.key==='Enter') AIAssistant.sendMessage()" style="flex:1;">
          <button class="mic-btn" id="chat-mic-btn" onclick="AIAssistant.startVoiceRecognition()" title="Voice input">
            🎤
          </button>
          <button onclick="AIAssistant.sendMessage()">Send</button>
        </div>
      </div>
    `;

    this.scrollToBottom();
  },

  renderMessage(msg) {
    if (msg.role === 'user') {
      return `<div class="chat-message user">${msg.text}</div>`;
    }
    return `
      <div class="chat-message ai">
        <div class="ai-label">🤖 LifeOS AI</div>
        ${msg.text.replace(/\n/g, '<br>')}
      </div>
    `;
  },

  async sendMessage() {
    const input = document.getElementById('chat-input');
    const text = input.value.trim();
    if (!text) return;

    const messagesDiv = document.getElementById('chat-messages');
    messagesDiv.innerHTML += `<div class="chat-message user">${text}</div>`;
    input.value = '';

    // Show typing indicator
    messagesDiv.innerHTML += `<div class="chat-message ai" id="typing-indicator"><div class="typing-indicator"><span></span><span></span><span></span></div></div>`;
    this.scrollToBottom();

    try {
      const res = await API.post('/ai/chat', { message: text });
      const responseText = res.response;

      document.getElementById('typing-indicator')?.remove();
      messagesDiv.innerHTML += `
        <div class="chat-message ai">
          <div class="ai-label">🤖 LifeOS AI</div>
          ${responseText.replace(/\n/g, '<br>')}
        </div>
      `;
    } catch (error) {
      console.error('Error fetching from chatbot backend:', error);
      document.getElementById('typing-indicator')?.remove();
      Utils.showToast('Failed to send message', 'error');
    }
    this.scrollToBottom();
  },

  generateResponse(query) {
    const q = query.toLowerCase();

    // Medicine queries
    for (const [drug, info] of Object.entries(this.responses.medicine)) {
      if (q.includes(drug)) return `💊 ${drug.charAt(0).toUpperCase() + drug.slice(1)}:\n\n${info}`;
    }

    // First aid queries
    for (const [topic, info] of Object.entries(this.responses.firstAid)) {
      if (q.includes(topic)) return info;
    }

    // Health tip request
    if (q.includes('tip') || q.includes('advice') || q.includes('suggestion')) {
      return this.responses.healthTips[Math.floor(Math.random() * this.responses.healthTips.length)];
    }

    // Report-related queries
    if (q.includes('hemoglobin') || q.includes('hb')) {
      return '🩸 Low Hemoglobin (Anemia):\n\nHemoglobin carries oxygen in your blood. Low levels may cause:\n• Fatigue and weakness\n• Shortness of breath\n• Pale skin\n\nCommon causes: Iron deficiency, Vitamin B12 deficiency, chronic disease.\n\nRecommendations:\n• Eat iron-rich foods (spinach, red meat, beans)\n• Take Vitamin C to improve iron absorption\n• Consult your doctor for supplements if needed';
    }

    if (q.includes('vitamin d') || q.includes('vit d')) {
      return '☀️ Vitamin D:\n\nVitamin D is essential for bone health and immune function.\n\nLow levels can cause:\n• Bone pain and muscle weakness\n• Fatigue\n• Depression\n\nRecommendations:\n• Get 15-20 min of sunlight daily\n• Eat eggs, fatty fish, fortified milk\n• Doctor may prescribe D3 supplements (60,000 IU weekly)';
    }

    if (q.includes('cholesterol')) {
      return '🫀 Cholesterol:\n\nTotal cholesterol should be below 200 mg/dL.\n• LDL (bad): <100 mg/dL\n• HDL (good): >40 mg/dL (men), >50 mg/dL (women)\n• Triglycerides: <150 mg/dL\n\nTo improve:\n• Exercise regularly\n• Eat more fiber\n• Reduce saturated fats\n• Consider medication if lifestyle changes aren\'t enough';
    }

    if (q.includes('blood pressure') || q.includes('bp')) {
      return '🩺 Blood Pressure:\n\nNormal: <120/80 mmHg\nElevated: 120-129/<80\nHigh (Stage 1): 130-139/80-89\nHigh (Stage 2): ≥140/≥90\n\nManagement:\n• Reduce salt intake\n• Exercise 30 min/day\n• Maintain healthy weight\n• Limit alcohol\n• Manage stress\n• Take prescribed medications regularly';
    }

    if (q.includes('sugar') || q.includes('diabetes') || q.includes('glucose')) {
      return '🍬 Blood Sugar Levels:\n\nFasting: 70-100 mg/dL (Normal)\nPre-diabetic: 100-125 mg/dL\nDiabetic: >126 mg/dL\n\nHbA1c Targets:\n• Normal: <5.7%\n• Pre-diabetic: 5.7-6.4%\n• Diabetic: ≥6.5%\n\nManagement:\n• Monitor levels regularly\n• Exercise daily\n• Follow a balanced diet\n• Take medications as prescribed\n• Stay hydrated';
    }

    // General health questions
    if (q.includes('headache')) {
      return '🤕 Headache Management:\n\n• Stay hydrated\n• Rest in a dark, quiet room\n• Take paracetamol or ibuprofen\n• Apply cold compress to forehead\n• Practice relaxation techniques\n\n⚠️ See a doctor if: Severe/sudden, with fever, vision changes, or neck stiffness.';
    }

    if (q.includes('cold') || q.includes('cough') || q.includes('flu')) {
      return '🤧 Cold/Flu Management:\n\n• Rest well\n• Drink warm fluids (soup, tea, honey-lemon water)\n• Steam inhalation\n• Gargle with warm salt water\n• Take paracetamol for fever\n• Use honey for sore throat\n\n⚠️ See a doctor if symptoms last >7 days or worsen.';
    }

    if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
      return this.responses.greetings[Math.floor(Math.random() * this.responses.greetings.length)];
    }

    if (q.includes('thank')) {
      return 'You\'re welcome! 😊 Remember, I\'m always here to help with your health questions. Stay healthy! 🌟';
    }

    // Default response
    return `I understand you're asking about "${query}". While I can provide general health information, here are some suggestions:\n\n1. 🔍 Try the Symptom Checker for condition analysis\n2. 💊 Ask me about specific medicines\n3. 🩹 Ask about first aid procedures\n4. 📋 Ask about specific test results\n\n⚠️ For specific medical advice, please consult a healthcare professional.`;
  },

  quickAction(type) {
    const input = document.getElementById('chat-input');
    const prompts = {
      medicine: 'Tell me about paracetamol',
      firstaid: 'First aid for burns',
      report: 'Why is my hemoglobin low?',
      general: 'Give me a health tip'
    };
    input.value = prompts[type] || '';
    input.focus();
  },

  showTips() {
    const tips = this.responses.healthTips;
    const todayTip = tips[new Date().getDate() % tips.length];
    Utils.showModal('💡 Daily Health Tips', `
      <div style="background:rgba(108,92,231,0.1); border-radius:12px; padding:20px; margin-bottom:16px; text-align:center;">
        <div style="font-size:2rem; margin-bottom:8px;">🌟</div>
        <h4>Today's Tip</h4>
        <p style="font-size:0.9rem; color:var(--text-primary); margin-top:8px;">${todayTip}</p>
      </div>
      <h4 style="margin-bottom:12px;">More Tips:</h4>
      ${tips.slice(0, 5).map(t => `<div style="padding:8px 0; font-size:0.85rem; color:var(--text-secondary); border-bottom:1px solid rgba(255,255,255,0.03);">${t}</div>`).join('')}
    `);
  },

  async clearChat() {
    if (confirm('Clear chat history?')) {
      try {
        await API.delete('/ai/chat/history');
        const list = document.getElementById('chat-list');
        if (list) list.innerHTML = '';
        Utils.showToast('Chat history cleared', 'info');
        this.render();
      } catch(e) {
        Utils.showToast('Failed to clear chat', 'error');
      }
    }
  },

  setLanguage(lang) {
    const profile = Store.getProfile();
    profile.language = lang;
    Store.saveProfile(profile);
    const langNames = { en: 'English', hi: 'Hindi', gu: 'Gujarati' };
    Utils.showToast(`Language set to ${langNames[lang]}`, 'success');
  },

  openSettings() {
    App.navigate('settings');
  },

  scrollToBottom() {
    const messages = document.getElementById('chat-messages');
    if (messages) messages.scrollTop = messages.scrollHeight;
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

    const micBtn = document.getElementById('chat-mic-btn');
    const inputField = document.getElementById('chat-input');
    const originalPlaceholder = inputField.placeholder;

    recognition.onstart = () => {
      micBtn.classList.add('listening');
      inputField.placeholder = 'Listening... Speak now';
    };

    recognition.onresult = (event) => {
      const speechResult = event.results[0][0].transcript;
      inputField.value = speechResult;
      // Auto send
      setTimeout(() => this.sendMessage(), 300);
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
