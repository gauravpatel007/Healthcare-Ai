/* ============================================
   LifeOS — Utilities & Helpers
   ============================================ */

const Utils = {
  // === Date Formatting ===
  formatDate(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  },

  formatTime(timeStr) {
    const [h, m] = timeStr.split(':');
    const hr = parseInt(h);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    return `${hr % 12 || 12}:${m} ${ampm}`;
  },

  formatDateTime(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  },

  timeAgo(dateStr) {
    const now = new Date();
    const d = new Date(dateStr);
    const diff = Math.floor((now - d) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return this.formatDate(dateStr);
  },

  getDaysUntil(dateStr) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);
    return Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  },

  getGreeting() {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  },

  // === BMI Calculator ===
  calculateBMI(weight, heightCm) {
    const heightM = heightCm / 100;
    const bmi = weight / (heightM * heightM);
    return Math.round(bmi * 10) / 10;
  },

  getBMICategory(bmi) {
    if (bmi < 18.5) return { label: 'Underweight', color: 'var(--info)' };
    if (bmi < 25) return { label: 'Normal', color: 'var(--success)' };
    if (bmi < 30) return { label: 'Overweight', color: 'var(--warning)' };
    return { label: 'Obese', color: 'var(--accent)' };
  },

  // === BMR Calculator ===
  calculateBMR(weight, heightCm, age, gender) {
    if (gender === 'Male') {
      return Math.round(88.362 + (13.397 * weight) + (4.799 * heightCm) - (5.677 * age));
    }
    return Math.round(447.593 + (9.247 * weight) + (3.098 * heightCm) - (4.330 * age));
  },

  // === Health Score Calculator ===
  calculateHealthScore(data) {
    // Replaced by backend logic
    return 70;
  },

  // === Toast Notifications ===
  showToast(message, type = 'info') {
    const container = document.querySelector('.toast-container') || this.createToastContainer();
    const icons = { success: '✅', warning: '⚠️', error: '❌', info: 'ℹ️' };

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-icon">${icons[type]}</span>
      <span class="toast-message">${message}</span>
      <button class="toast-close" onclick="this.parentElement.remove()">✕</button>
    `;

    container.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  },

  createToastContainer() {
    const container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
  },

  // === Modal Helper ===
  showModal(title, content, onSave) {
    const overlay = document.getElementById('modal-overlay');
    const modal = overlay.querySelector('.modal');

    modal.querySelector('.modal-header h3').innerHTML = title;
    modal.querySelector('.modal-body').innerHTML = content;

    const saveBtn = modal.querySelector('.modal-save-btn');
    if (saveBtn) {
      saveBtn.onclick = () => {
        if (onSave) onSave();
        this.closeModal();
      };
    }

    overlay.classList.add('active');
  },

  closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
  },

  // === Generate Unique ID ===
  uid() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // === Color helpers ===
  getScoreColor(score) {
    if (score >= 80) return 'var(--success)';
    if (score >= 60) return 'var(--primary)';
    if (score >= 40) return 'var(--warning)';
    return 'var(--accent)';
  },

  getRiskColor(level) {
    const colors = { Low: 'var(--success)', Medium: 'var(--warning)', High: 'var(--accent)' };
    return colors[level] || 'var(--text-muted)';
  },

  // === Circular Progress SVG ===
  createCircularProgress(value, max, size = 120, strokeWidth = 6, color = 'var(--primary)') {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (value / max) * circumference;

    return `
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${size/2}" cy="${size/2}" r="${radius}" 
                stroke="rgba(255,255,255,0.05)" stroke-width="${strokeWidth}" fill="none"/>
        <circle cx="${size/2}" cy="${size/2}" r="${radius}"
                stroke="${color}" stroke-width="${strokeWidth}" fill="none"
                stroke-linecap="round"
                stroke-dasharray="${circumference}"
                stroke-dashoffset="${offset}"
                style="transform: rotate(-90deg); transform-origin: center; transition: stroke-dashoffset 1.5s ease;"/>
      </svg>
    `;
  },

  // === Chart.js helpers ===
  getChartGradient(ctx, color1, color2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
  },

  chartDefaults: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        labels: { color: '#a0a0b8', font: { family: 'Inter' } }
      }
    },
    scales: {
      x: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: '#6c6c80', font: { family: 'Inter', size: 11 } }
      },
      y: {
        grid: { color: 'rgba(255,255,255,0.03)' },
        ticks: { color: '#6c6c80', font: { family: 'Inter', size: 11 } }
      }
    }
  },

  // === Calendar Generator ===
  generateCalendarDays(year, month) {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrev = new Date(year, month, 0).getDate();
    const days = [];

    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({ day: daysInPrev - i, currentMonth: false });
    }
    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ day: i, currentMonth: true });
    }
    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({ day: i, currentMonth: false });
    }

    return days;
  },

  // === Number formatting ===
  formatCurrency(amount) {
    return '₹' + amount.toLocaleString('en-IN');
  },

  // === Debounce ===
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  },

  // === Multilingual text ===
  translations: {
    en: { dashboard: 'Dashboard', records: 'Records', medicines: 'Medicines', appointments: 'Appointments' },
    hi: { dashboard: 'डैशबोर्ड', records: 'रिकॉर्ड', medicines: 'दवाइयाँ', appointments: 'अपॉइंटमेंट' },
    gu: { dashboard: 'ડેશબોર્ડ', records: 'રેકોર્ડ', medicines: 'દવાઓ', appointments: 'એપોઈન્ટમેન્ટ' }
  },

  t(key) {
    const profile = (typeof App !== 'undefined' ? App.currentProfile : null) || {};
    const lang = profile.language || 'en';
    return (this.translations[lang] && this.translations[lang][key]) || key;
  }
};
