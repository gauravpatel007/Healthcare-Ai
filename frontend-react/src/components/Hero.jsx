import React from 'react';

const Hero = ({ onLoginClick }) => {
  return (
    <section className="relative min-h-[85vh] flex items-center px-6 md:px-10 pt-28">
      {/* Wavy Background Pattern (Mock via SVG) */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: "url('data:image/svg+xml,%3Csvg width=\\'100%25\\' height=\\'100%25\\' xmlns=\\'http://www.w3.org/2000/svg\\'%3E%3Cpath d=\\'M0,200 C150,300 350,100 500,200 C650,300 850,100 1000,200 C1150,300 1350,100 1500,200 L1500,0 L0,0 Z\\' fill=\\'none\\' stroke=\\'%23000\\' strokeWidth=\\'2\\'/%3E%3C/svg%3E')",
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      ></div>

      <div className="max-w-7xl mx-auto w-full flex flex-col items-center text-center relative z-10 space-y-8">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full border border-blue-100">
          <span className="material-symbols-outlined text-[16px]">show_chart</span>
          <span className="text-xs font-semibold tracking-wide">AI-Powered Health Intelligence</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-tight tracking-tight max-w-4xl">
          Your Personal AI Health<br />Operating System
        </h1>

        <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Monitor your health, chat with AI, track fitness, manage medications, analyze wellness trends, and improve
          your lifestyle—all in one intelligent platform.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button 
            onClick={onLoginClick}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-8 py-3.5 rounded-full font-semibold shadow-lg shadow-blue-500/25 hover:-translate-y-1 transition-all flex items-center gap-2 justify-center"
          >
            Get Started Free <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
          <button className="bg-white text-slate-900 border border-slate-200 px-8 py-3.5 rounded-full font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all flex items-center gap-2 justify-center shadow-sm">
            <span className="material-symbols-outlined text-[20px] text-blue-600">play_circle</span> Watch Demo
          </button>
        </div>

        {/* Dashboard Preview Card */}
        <div className="mt-16 w-full max-w-5xl mx-auto relative perspective-1000">
          <div className="bg-white/80 backdrop-blur-xl border border-white rounded-[24px] shadow-2xl p-6 transform rotate-x-12 translate-y-12">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="w-full md:w-1/3 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl p-6 text-white relative overflow-hidden">
                <div className="text-sm font-semibold opacity-90">Health Score</div>
                <div className="text-5xl font-bold mt-2">95<span className="text-xl opacity-70">/100</span></div>
                <div className="mt-4 w-full h-1.5 bg-white/30 rounded-full">
                  <div className="w-[95%] h-full bg-white rounded-full"></div>
                </div>
              </div>
              <div className="w-full md:w-1/3 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative">
                <div className="text-sm font-semibold text-slate-500">Heart Rate</div>
                <div className="text-4xl font-bold text-slate-900 mt-2">72 <span className="text-lg text-slate-400 font-normal">bpm</span></div>
                <span className="material-symbols-outlined text-red-500 absolute top-6 right-6">favorite</span>
                <div className="flex items-end gap-1.5 mt-6 h-12">
                  <div className="w-full bg-red-200 h-[40%] rounded-t-sm"></div>
                  <div className="w-full bg-red-400 h-[70%] rounded-t-sm"></div>
                  <div className="w-full bg-red-300 h-[50%] rounded-t-sm"></div>
                  <div className="w-full bg-red-500 h-[90%] rounded-t-sm"></div>
                  <div className="w-full bg-red-400 h-[60%] rounded-t-sm"></div>
                </div>
              </div>
              <div className="w-full md:w-1/3 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative">
                <div className="text-sm font-semibold text-slate-500">Sleep</div>
                <div className="text-4xl font-bold text-slate-900 mt-2">7h 42m</div>
                <span className="material-symbols-outlined text-purple-500 absolute top-6 right-6">bedtime</span>
                <div className="text-xs text-slate-400 mt-6">Deep sleep 32% · Quality 88%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
