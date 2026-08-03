import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = ({ onLoginClick }) => {
  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-slate-100">
      <nav className="flex justify-between items-center px-6 md:px-10 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
            <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>favorite</span>
          </div>
          <div className="text-xl font-bold text-slate-900 tracking-tight">LifeOS</div>
        </div>
        {/* Desktop Navigation */}
        <div className="hidden md:flex gap-8 items-center font-medium text-slate-500 text-sm">
          <a className="hover:text-slate-900 transition-colors" href="#">Home</a>
          <a className="hover:text-slate-900 transition-colors" href="#features">Features</a>
          <a className="hover:text-slate-900 transition-colors" href="#dashboard">Dashboard</a>
          <a className="hover:text-slate-900 transition-colors" href="#ai">AI</a>
          <a className="hover:text-slate-900 transition-colors" href="#pricing">Pricing</a>
          <a className="hover:text-slate-900 transition-colors" href="#faq">FAQ</a>
        </div>
        <div className="flex items-center gap-4">
          <button 
            className="text-sm font-semibold text-slate-900 hover:text-blue-600 transition-colors hidden md:block"
            onClick={onLoginClick}
          >
            Sign In
          </button>
          <button 
            onClick={onLoginClick}
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-blue-500/30 hover:-translate-y-0.5 transition-all"
          >
            Get Started
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
