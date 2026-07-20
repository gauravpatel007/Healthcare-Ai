import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';

const AIChat = ({ voiceAction, onVoiceActionConsumed }) => {
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
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [healthTips, setHealthTips] = useState([]);
  const messagesEndRef = useRef(null);
  const chatClearedRef = useRef(false);
  const abortControllerRef = useRef(null);

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
      setInput(speechResult);
      // Optional: automatically send the message after a short delay
      // setTimeout(() => {
      //   // Needs a bit of refactoring to send the specific text since state update might be delayed
      // }, 300);
    };
    recognition.onerror = (event) => {
      console.error('Speech recognition error', event.error);
      alert('Could not recognize voice. Try again.');
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);

    recognition.start();
  };

  const defaultGreeting = (
    <div className="chat-message ai">
      <div className="ai-label">🤖 LifeOS AI</div>
      Hello! I'm your LifeOS AI Health Assistant. How can I help you today?
      <div style={{ marginTop: '12px', fontSize: '0.82rem' }}>
        Try asking me:
        <ul style={{ marginTop: '4px', paddingLeft: '16px', color: 'var(--text-secondary)' }}>
          <li>What is paracetamol used for?</li>
          <li>First aid for burns</li>
          <li>Why is my hemoglobin low?</li>
          <li>Give me a health tip</li>
        </ul>
      </div>
    </div>
  );

  useEffect(() => {
    const initChat = async () => {
      try {
        const [historyRes, tipsRes] = await Promise.all([
          API.get('/ai/chat/history', { 
            headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
            cache: 'no-store' 
          }),
          API.get('/ai/chat/tips')
        ]);
        
        if (historyRes && historyRes.length > 0) {
          setMessages(historyRes.map(m => ({ role: m.role, text: m.content })));
        } else {
          setMessages([{ role: 'assistant', custom: defaultGreeting }]);
        }

        if (tipsRes && tipsRes.tips) {
          setHealthTips(tipsRes.tips.map(t => `${t.icon} ${t.tip}`));
        }
      } catch (e) {
        console.error(e);
      }
    };
    initChat();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    chatClearedRef.current = false;

    // Abort any previous in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const res = await API.request('/ai/chat', {
        method: 'POST',
        body: { message: userMessage },
        signal: controller.signal
      });
      if (!chatClearedRef.current) {
        setMessages(prev => [...prev, { role: 'assistant', text: res.response }]);
      }
    } catch (e) {
      if (e.name === 'AbortError') return; // request was cancelled by clear
      if (!chatClearedRef.current) {
        setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't reach the server right now." }]);
      }
    } finally {
      setIsTyping(false);
      abortControllerRef.current = null;
    }
  };

  const clearChat = async () => {
    if (confirm('Clear chat history?')) {
      try {
        chatClearedRef.current = true;
        setIsTyping(false);

        // Abort any in-flight AI request so the backend doesn't commit new messages
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
          abortControllerRef.current = null;
        }

        await API.delete('/ai/chat/history');
        setMessages([{ role: 'assistant', custom: defaultGreeting }]);
      } catch (e) {
        chatClearedRef.current = false;
        alert('Failed to clear chat history');
      }
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSend();
  };

  // Voice action: auto-type and send message from "Hey AI"
  useEffect(() => {
    if (voiceAction && voiceAction.target_feature === 'ai-chat') {
      if (voiceAction.action_name === 'send_message' && voiceAction.data?.message) {
        const msg = voiceAction.data.message;
        setInput(msg);
        // Auto-send after a brief delay so user can see it typed
        setTimeout(() => {
          // Directly send since setInput may not have committed yet
          const userMessage = msg.trim();
          if (!userMessage) return;
          chatClearedRef.current = false;
          if (abortControllerRef.current) abortControllerRef.current.abort();
          const controller = new AbortController();
          abortControllerRef.current = controller;
          setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
          setInput('');
          setIsTyping(true);
          API.request('/ai/chat', { method: 'POST', body: { message: userMessage }, signal: controller.signal })
            .then(res => { if (!chatClearedRef.current) setMessages(prev => [...prev, { role: 'assistant', text: res.response }]); })
            .catch(e => { if (e.name !== 'AbortError' && !chatClearedRef.current) setMessages(prev => [...prev, { role: 'assistant', text: "Sorry, I couldn't reach the server." }]); })
            .finally(() => { setIsTyping(false); abortControllerRef.current = null; });
        }, 500);
      }
      if (onVoiceActionConsumed) onVoiceActionConsumed();
    }
  }, [voiceAction]);

  const quickAction = (type) => {
    const prompts = {
      medicine: 'Tell me about paracetamol',
      firstaid: 'First aid for burns',
      report: 'Why is my hemoglobin low?',
      general: 'Give me a health tip'
    };
    setInput(prompts[type] || '');
  };

  const formatMessage = (text) => {
    if (!text) return null;
    if (typeof text !== 'string') return text;
    // Escape HTML first
    let formatted = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Then apply simple markdown formatting
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/\n/g, '<br />');
    // Convert * or - bullet points to middle dots
    formatted = formatted.replace(/(^|<br \/>)\s*[\*\-]\s+/g, '$1• ');
    return <span dangerouslySetInnerHTML={{ __html: formatted }} style={{ lineHeight: '1.6' }} />;
  };

  return (
    <div className="page-section active" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div className="section-header" style={{ background: 'var(--bg-card)', padding: '24px 32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', background: 'rgba(37,99,235,0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', fontFamily: "'Inter', sans-serif" }}>AI Health Assistant</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }}></span>
              24/7 AI-powered health guidance
            </p>
          </div>
        </div>
        <div className="flex gap-md">
          <button className="btn btn-secondary" onClick={() => setShowTipsModal(true)} style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 600, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 11l3 3L22 4"></path><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"></path></svg>
            Daily Tips
          </button>
          <button className="btn btn-secondary" onClick={clearChat} style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 600, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--danger)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
            Clear Chat
          </button>
        </div>
      </div>

      <div className="grid-4 gap-md mb-xl">
        <div className="glass-card hover-lift" style={{ textAlign: 'center', cursor: 'pointer', padding: '20px' }} onClick={() => quickAction('medicine')}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>💊</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Medicine Info</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Drug information</div>
        </div>
        <div className="glass-card hover-lift" style={{ textAlign: 'center', cursor: 'pointer', padding: '20px' }} onClick={() => quickAction('firstaid')}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🩹</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>First Aid</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Emergency guide</div>
        </div>
        <div className="glass-card hover-lift" style={{ textAlign: 'center', cursor: 'pointer', padding: '20px' }} onClick={() => quickAction('report')}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>📋</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>Report Q&A</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Explain results</div>
        </div>
        <div className="glass-card hover-lift" style={{ textAlign: 'center', cursor: 'pointer', padding: '20px' }} onClick={() => quickAction('general')}>
          <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🏥</div>
          <div style={{ fontSize: '0.82rem', fontWeight: 600 }}>General Health</div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Any question</div>
        </div>
      </div>

      <div className="chat-container" style={{ display: 'flex', flexDirection: 'column', height: '65vh', minHeight: '400px', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
        <div className="chat-messages" style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {messages.length === 0 ? defaultGreeting : messages.map((m, i) => (
            <div key={i} className={`chat-message ${m.role}`}>
              {m.role === 'ai' && <div className="ai-label">🤖 LifeOS AI</div>}
              {m.custom || formatMessage(m.text)}
            </div>
          ))}
          {isTyping && (
            <div className="chat-message ai">
              <div className="typing-indicator"><span></span><span></span><span></span></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="chat-input-area" style={{ display: 'flex', gap: '10px', alignItems: 'center', padding: '12px 16px', background: 'var(--bg-card)', borderTop: '1px solid var(--border-color)', borderBottomLeftRadius: '16px', borderBottomRightRadius: '16px' }}>
          <input 
            type="text" 
            placeholder="Ask me anything about health..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', outline: 'none' }} 
          />
          <button className={`mic-btn ${isListening ? 'listening' : ''}`} onClick={startVoiceRecognition} style={{ background: isListening ? 'var(--accent)' : 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Voice input">🎤</button>
          <button className="btn btn-primary" onClick={handleSend} style={{ padding: '12px 24px', borderRadius: '12px' }}>Send</button>
        </div>
      </div>

      {showTipsModal && (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={(e) => { if (e.target === e.currentTarget) setShowTipsModal(false) }}>
          <div className="modal" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '20px', width: '90%', maxWidth: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>💡 Daily Health Tips</h3>
              <button onClick={() => setShowTipsModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}>✕</button>
            </div>
            <div style={{ background: 'rgba(108,92,231,0.1)', borderRadius: '12px', padding: '20px', marginBottom: '16px', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🌟</div>
              <h4>Today's Tip</h4>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', marginTop: '8px' }}>{healthTips[new Date().getDate() % healthTips.length]}</p>
            </div>
            <h4 style={{ marginBottom: '12px' }}>More Tips:</h4>
            {healthTips.slice(0, 5).map((t, i) => (
              <div key={i} style={{ padding: '8px 0', fontSize: '0.85rem', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>{t}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AIChat;
