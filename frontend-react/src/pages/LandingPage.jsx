import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LandingChatbot from '../components/LandingChatbot';
import LoginModal from '../components/LoginModal';

const LandingPage = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (window.location.search.includes('login=true')) {
      setShowLogin(true);
    }
    
    // Check initial theme
    const saved = localStorage.getItem('lifeos_theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('lifeos_theme', 'light');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('lifeos_theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <div className={`absolute inset-0 w-full h-full overflow-y-auto m-0 p-0 selection:bg-blue-200 selection:text-blue-900 font-['Inter'] transition-colors duration-300 bg-slate-50 dark:bg-slate-950 ${isDark ? 'dark' : ''}`}>
      {/* ========== TOP NAV BAR ========== */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shadow-sm border-b border-slate-100 dark:border-slate-800 transition-colors duration-300">
        <nav className="flex justify-between items-center px-6 md:px-10 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
              <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>favorite</span>
            </div>
            <div className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">LifeOS</div>
          </div>
          {/* Desktop Navigation */}
          <div className="hidden md:flex gap-8 items-center font-medium text-slate-500 dark:text-slate-400 text-sm">
            <a className="hover:text-slate-900 dark:hover:text-white transition-colors" href="#">Home</a>
            <a className="hover:text-slate-900 dark:hover:text-white transition-colors" href="#features">Features</a>
            <a className="hover:text-slate-900 dark:hover:text-white transition-colors" href="#dashboard">Dashboard</a>
            <a className="hover:text-slate-900 dark:hover:text-white transition-colors" href="#ai">AI</a>
            <a className="hover:text-slate-900 dark:hover:text-white transition-colors" href="#pricing">Pricing</a>
            <a className="hover:text-slate-900 dark:hover:text-white transition-colors" href="#faq">FAQ</a>
          </div>
          <div className="flex items-center gap-4">
            {localStorage.getItem('offline_medical_id') && (
              <a href="/medical-id" className="flex items-center gap-1.5 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 px-3 py-1.5 rounded-full text-xs font-bold transition-colors no-underline">
                <span className="material-symbols-outlined text-[16px]">medical_services</span>
                Medical ID
              </a>
            )}
            <button onClick={toggleTheme} aria-label="Toggle dark mode" className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:text-slate-300 transition-colors border-none bg-transparent cursor-pointer">
              <span className="material-symbols-outlined text-[20px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <button onClick={() => setShowLogin(true)} className="text-sm font-semibold text-slate-900 dark:text-white hover:text-blue-600 transition-colors hidden md:block bg-transparent border-none cursor-pointer">Sign In</button>
            <button onClick={() => setShowLogin(true)} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all border-none cursor-pointer">Get Started</button>
          </div>
        </nav>
      </header>

      <main className="pt-28 overflow-hidden bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        {/* ========== HERO SECTION ========== */}
        <section className="relative min-h-[85vh] flex items-center px-6 md:px-10">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'100%25\\' height=\\'100%25\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cpath d=\\'M0,200 C150,300 350,100 500,200 C650,300 850,100 1000,200 C1150,300 1350,100 1500,200 L1500,0 L0,0 Z\\' fill=\\'none\\' stroke=\\'%23000\\' stroke-width=\\'2\\'/%3E%3C/svg%3E')", backgroundSize: 'cover', backgroundPosition: 'center' }}></div>
          
          <div className="max-w-7xl mx-auto w-full flex flex-col items-center text-center relative z-10 space-y-8">
            <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-4 py-1.5 rounded-full border border-blue-100 dark:border-blue-500/20">
              <span className="material-symbols-outlined text-[16px]">show_chart</span>
              <span className="text-xs font-semibold tracking-wide">AI-Powered Health Intelligence</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 dark:text-white leading-tight tracking-tight max-w-4xl">
              Your Personal AI Health<br />Operating System
            </h1>

            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Monitor your health, chat with AI, track fitness, manage medications, analyze wellness trends, and improve your lifestyle—all in one intelligent platform.
            </p>

            <div className="flex max-sm:flex-col gap-4 pt-4">
              <button onClick={() => setShowLogin(true)} className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-3.5 rounded-full font-semibold shadow-lg shadow-blue-500/25 hover:-translate-y-1 transition-all flex items-center gap-2 justify-center border-none cursor-pointer">
                Get Started Free <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
              </button>
              <button className="bg-white dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 px-8 py-3.5 rounded-full font-semibold hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-300 transition-all flex items-center gap-2 justify-center shadow-sm cursor-pointer">
                <span className="material-symbols-outlined text-[20px] text-blue-600 dark:text-blue-400">play_circle</span>
                Watch Demo
              </button>
            </div>

            {/* Dashboard Preview Card */}
            <div className="mt-16 w-full max-w-5xl mx-auto relative">
              <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white dark:border-slate-800 rounded-[24px] shadow-2xl p-6">
                <div className="flex max-md:flex-col gap-4 mb-6">
                  <div className="w-full md:w-1/3 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl p-6 text-white relative overflow-hidden text-left">
                    <div className="text-sm font-semibold opacity-90">Health Score</div>
                    <div className="text-5xl font-bold mt-2">95<span className="text-xl opacity-70">/100</span></div>
                    <div className="mt-4 w-full h-1.5 bg-white/30 rounded-full">
                      <div className="w-[95%] h-full bg-white rounded-full"></div>
                    </div>
                  </div>
                  <div className="w-full md:w-1/3 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm relative text-left">
                    <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">Heart Rate</div>
                    <div className="text-4xl font-bold text-slate-900 dark:text-white mt-2">72 <span className="text-lg text-slate-400 font-normal">bpm</span></div>
                    <span className="material-symbols-outlined text-red-500 absolute top-6 right-6">favorite</span>
                    <div className="flex items-end gap-1.5 mt-6 h-12">
                      <div className="w-full bg-red-200 h-[40%] rounded-t-sm"></div>
                      <div className="w-full bg-red-400 h-[70%] rounded-t-sm"></div>
                      <div className="w-full bg-red-300 h-[50%] rounded-t-sm"></div>
                      <div className="w-full bg-red-500 h-[90%] rounded-t-sm"></div>
                      <div className="w-full bg-red-400 h-[60%] rounded-t-sm"></div>
                    </div>
                  </div>
                  <div className="w-full md:w-1/3 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm relative text-left">
                    <div className="text-sm font-semibold text-slate-500 dark:text-slate-400">Sleep</div>
                    <div className="text-4xl font-bold text-slate-900 dark:text-white mt-2">7h 42m</div>
                    <span className="material-symbols-outlined text-purple-500 absolute top-6 right-6">bedtime</span>
                    <div className="text-xs text-slate-400 mt-6">Deep sleep 32% · Quality 88%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ========== FEATURES SECTION ========== */}
        <section id="features" className="py-24 px-6 md:px-10 bg-white dark:bg-slate-900 transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="text-blue-600 dark:text-blue-400 font-bold tracking-widest text-sm mb-4 uppercase">Features</div>
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Everything your health needs, in one place</h2>
              <p className="text-lg text-slate-500 dark:text-slate-400">Six intelligent modules working together to keep you healthier, every single day.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { icon: 'smart_toy', color: 'blue', colorHex: 'blue-600', bgHex: 'blue-100', title: 'AI Health Assistant', desc: 'Smart medical guidance with conversational AI chat for personalized recommendations tuned to your body.' },
                { icon: 'monitor_heart', color: 'red', colorHex: 'red-500', bgHex: 'red-100', title: 'Health Monitoring', desc: 'Track heart rate, blood pressure, sleep, oxygen levels, and daily wellness in real time.' },
                { icon: 'fitness_center', color: 'green', colorHex: 'green-500', bgHex: 'green-100', title: 'AI Fitness Coach', desc: 'Personalized workout plans, step tracking, calorie insights, and goal monitoring that adapts to you.' },
                { icon: 'coronavirus', color: 'purple', colorHex: 'purple-600', bgHex: 'purple-100', title: 'Symptom Checker', desc: 'Instantly check your symptoms with our AI triage system to know when you should see a doctor.' },
                { icon: 'restaurant', color: 'cyan', colorHex: 'cyan-600', bgHex: 'cyan-100', title: 'Nutrition Planner', desc: 'Log meals and get AI-generated nutrition plans designed to help you hit your optimal macros.' },
                { icon: 'folder_managed', color: 'orange', colorHex: 'orange-500', bgHex: 'orange-100', title: 'Medical Records', desc: 'Securely store, organize and analyze all your blood tests, MRI scans, and doctors notes.' }
              ].map((f, i) => (
                <div key={i} className="bg-slate-50 dark:bg-slate-800 rounded-[24px] p-8 hover:shadow-lg dark:hover:shadow-slate-900/50 transition-shadow">
                  <div className={`w-14 h-14 rounded-2xl bg-${f.bgHex} flex items-center justify-center text-${f.colorHex} mb-6`}>
                    <span className="material-symbols-outlined text-[28px]">{f.icon}</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{f.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== STATS / PROOF ========== */}
        <section id="stats" className="py-24 px-6 md:px-10 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-12">Why choose LifeOS</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { val: '98%', label: 'AI Accuracy', color: 'cyan-500' },
                { val: '10x', label: 'Faster Insights', color: 'blue-600' },
                { val: 'Smart', label: 'Symptom Analyzer', color: 'blue-500' },
                { val: '24/7', label: 'AI Support', color: 'blue-400' }
              ].map((s, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-sm">
                  <div className={`text-5xl font-extrabold text-${s.color} mb-2`}>{s.val}</div>
                  <div className="text-slate-500 dark:text-slate-400 font-semibold">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== HOW IT WORKS ========== */}
        <section className="py-24 px-6 md:px-10 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 transition-colors duration-300">
          <div className="max-w-7xl mx-auto text-center">
            <div className="text-blue-600 dark:text-blue-400 font-bold tracking-widest text-sm mb-4 uppercase">How it works</div>
            <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-16">Healthier in four simple steps</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
              <div className="hidden md:block absolute top-8 left-12 right-12 h-0.5 bg-slate-100 dark:bg-slate-800 z-0"></div>
              {[
                { step: 1, color: 'blue-600', shadow: 'blue-500/30', title: 'Connect your health data', desc: 'Sync wearables, apps, and records in minutes.' },
                { step: 2, color: 'blue-500', shadow: 'blue-500/30', title: 'AI analyzes your wellness', desc: 'Patterns and risks surface automatically.' },
                { step: 3, color: 'cyan-500', shadow: 'cyan-500/30', title: 'Receive recommendations', desc: 'Clear, actionable guidance daily.' },
                { step: 4, color: 'teal-500', shadow: 'teal-500/30', title: 'Improve every day', desc: 'Watch your health score climb over time.' }
              ].map((s, i) => (
                <div key={i} className="relative z-10 flex flex-col items-center">
                  <div className={`w-16 h-16 rounded-full bg-${s.color} text-white flex items-center justify-center text-2xl font-bold mb-6 shadow-lg shadow-${s.shadow}`}>{s.step}</div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{s.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ========== TESTIMONIALS ========== */}
        <section className="py-24 px-6 md:px-10 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 transition-colors duration-300">
          <div className="max-w-7xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <div className="text-blue-600 dark:text-blue-400 font-bold tracking-widest text-sm mb-4 uppercase">Testimonials</div>
              <h2 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-4">Trusted by people taking their health seriously</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-900 rounded-[24px] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex gap-1 text-amber-400 mb-4">
                  {[1,2,3,4,5].map(j => <span key={j} className="material-symbols-outlined text-[18px]" style={{fontVariationSettings:"'FILL' 1"}}>star</span>)}
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">"The UI is incredibly clean and intuitive. As a product designer, I appreciate how effortlessly it presents complex health data without overwhelming the user."</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm">RS</div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm">Ridhham Solanki</div>
                    <div className="text-slate-400 text-xs">Product Designer</div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-[24px] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex gap-1 text-amber-400 mb-4">
                  {[1,2,3,4,5].map(j => <span key={j} className="material-symbols-outlined text-[18px]" style={{fontVariationSettings:"'FILL' 1"}}>star</span>)}
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">"The architecture behind this app is solid. Everything from the medication reminders to the seamless background syncing works flawlessly."</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-400 flex items-center justify-center text-white font-bold text-sm">GP</div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm">Gaurav Patel</div>
                    <div className="text-slate-400 text-xs">Software Engineer</div>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-[24px] p-8 shadow-sm border border-slate-100 dark:border-slate-800">
                <div className="flex gap-1 text-amber-400 mb-4">
                  {[1,2,3,4,5].map(j => <span key={j} className="material-symbols-outlined text-[18px]" style={{fontVariationSettings:"'FILL' 1"}}>star</span>)}
                </div>
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6">"The accuracy of the AI triage models is genuinely impressive. It takes a lot of fine-tuning to provide this level of personalized insights."</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center text-white font-bold text-sm">DP</div>
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-white text-sm">Dhruv Patel</div>
                    <div className="text-slate-400 text-xs">AI Engineer</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ========== FOOTER ========== */}
      <footer className="bg-slate-900 dark:bg-black py-16 px-6 md:px-10 text-slate-400 transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white">
              <span className="material-symbols-outlined text-[20px]" style={{fontVariationSettings: "'FILL' 1"}}>favorite</span>
            </div>
            <div className="text-xl font-bold text-white tracking-tight">LifeOS</div>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <a className="hover:text-white transition-colors" href="#">Privacy Policy</a>
            <a className="hover:text-white transition-colors" href="#">Terms of Service</a>
            <a className="hover:text-white transition-colors" href="#">Contact Us</a>
          </div>
          <div className="text-sm">
            &copy; {new Date().getFullYear()} LifeOS. All rights reserved.
          </div>
        </div>
      </footer>

      <LandingChatbot />
      <LoginModal show={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );
};

export default LandingPage;
