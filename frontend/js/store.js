/* ============================================
   LifeOS — Data Store (LocalStorage Manager)
   ============================================ */

const Store = {
  prefix: 'lifeos_',

  // === Core CRUD ===
  get(key) {
    try {
      const data = localStorage.getItem(this.prefix + key);
      return data ? JSON.parse(data) : null;
    } catch { return null; }
  },

  set(key, value) {
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(value));
      return true;
    } catch { return false; }
  },

  remove(key) {
    localStorage.removeItem(this.prefix + key);
  },

  // === User Profile ===
  getProfile() {
    return this.get('profile') || {
      name: 'User',
      age: 30,
      gender: 'Male',
      bloodType: 'O+',
      height: 170,
      weight: 70,
      allergies: [],
      conditions: [],
      emergencyContacts: [
        { name: 'Emergency Contact', phone: '112', relation: 'Emergency Services' }
      ],
      organDonor: false,
      language: 'en'
    };
  },

  saveProfile(profile) {
    this.set('profile', profile);
  },

  // === Medical Records ===
  getRecords() {
    return this.get('records') || [];
  },

  addRecord(record) {
    const records = this.getRecords();
    record.id = Date.now();
    record.createdAt = new Date().toISOString();
    records.unshift(record);
    this.set('records', records);
    return record;
  },

  deleteRecord(id) {
    const records = this.getRecords().filter(r => r.id !== id);
    this.set('records', records);
  },

  // === Medicines ===
  getMedicines() {
    return this.get('medicines') || [];
  },

  addMedicine(med) {
    const meds = this.getMedicines();
    med.id = Date.now();
    med.createdAt = new Date().toISOString();
    meds.push(med);
    this.set('medicines', meds);
    return med;
  },

  updateMedicine(id, updates) {
    const meds = this.getMedicines().map(m => m.id === id ? { ...m, ...updates } : m);
    this.set('medicines', meds);
  },

  deleteMedicine(id) {
    const meds = this.getMedicines().filter(m => m.id !== id);
    this.set('medicines', meds);
  },

  // === Appointments ===
  getAppointments() {
    return this.get('appointments') || [];
  },

  addAppointment(apt) {
    const apts = this.getAppointments();
    apt.id = Date.now();
    apts.push(apt);
    this.set('appointments', apts);
    return apt;
  },

  deleteAppointment(id) {
    const apts = this.getAppointments().filter(a => a.id !== id);
    this.set('appointments', apts);
  },

  // === Family Members ===
  getFamily() {
    return this.get('family') || [];
  },

  addFamilyMember(member) {
    const family = this.getFamily();
    member.id = Date.now();
    family.push(member);
    this.set('family', family);
    return member;
  },

  deleteFamilyMember(id) {
    const family = this.getFamily().filter(f => f.id !== id);
    this.set('family', family);
  },

  // === Health Data ===
  getHealthData() {
    return this.get('healthData') || {
      bloodSugar: [],
      bloodPressure: [],
      cholesterol: [],
      weight: [],
      bmi: [],
      heartRate: [],
      sleep: [],
      water: [],
      steps: [],
      mood: [],
      calories: []
    };
  },

  addHealthEntry(category, entry) {
    const data = this.getHealthData();
    if (!data[category]) data[category] = [];
    entry.date = entry.date || new Date().toISOString();
    entry.id = Date.now();
    data[category].push(entry);
    this.set('healthData', data);
  },

  // === Trackers ===
  getWaterIntake(date) {
    const key = 'water_' + (date || new Date().toISOString().split('T')[0]);
    return this.get(key) || 0;
  },

  setWaterIntake(glasses, date) {
    const key = 'water_' + (date || new Date().toISOString().split('T')[0]);
    this.set(key, glasses);
  },

  getSleepData() {
    return this.get('sleepData') || [];
  },

  addSleepEntry(entry) {
    const data = this.getSleepData();
    entry.id = Date.now();
    entry.date = entry.date || new Date().toISOString().split('T')[0];
    data.push(entry);
    this.set('sleepData', data);
  },

  // === Expenses ===
  getExpenses() {
    return this.get('expenses') || [];
  },

  addExpense(expense) {
    const expenses = this.getExpenses();
    expense.id = Date.now();
    expense.date = expense.date || new Date().toISOString();
    expenses.push(expense);
    this.set('expenses', expenses);
    return expense;
  },

  deleteExpense(id) {
    const expenses = this.getExpenses().filter(e => e.id !== id);
    this.set('expenses', expenses);
  },

  // === Challenges ===
  getChallenges() {
    return this.get('challenges') || {
      active: [],
      completed: [],
      badges: [],
      streaks: {}
    };
  },

  saveChallenges(challenges) {
    this.set('challenges', challenges);
  },

  // === Mood Journal ===
  getMoodEntries() {
    return this.get('moodEntries') || [];
  },

  addMoodEntry(entry) {
    const entries = this.getMoodEntries();
    entry.id = Date.now();
    entry.date = new Date().toISOString();
    entries.push(entry);
    this.set('moodEntries', entries);
    return entry;
  },

  // === Vaccinations ===
  getVaccinations() {
    return this.get('vaccinations') || [];
  },

  addVaccination(vax) {
    const vaxs = this.getVaccinations();
    vax.id = Date.now();
    vaxs.push(vax);
    this.set('vaccinations', vaxs);
    return vax;
  },

  // === Chat History ===
  getChatHistory() {
    return this.get('chatHistory') || [];
  },

  addChatMessage(msg) {
    const history = this.getChatHistory();
    msg.id = Date.now();
    msg.timestamp = new Date().toISOString();
    history.push(msg);
    // Keep last 100 messages
    if (history.length > 100) history.splice(0, history.length - 100);
    this.set('chatHistory', history);
  },

  clearChatHistory() {
    this.set('chatHistory', []);
  },

  // === Initialize with sample data ===
  initSampleData() {
    if (this.get('initialized')) return;

    // Sample profile
    this.saveProfile({
      name: 'Gaurav',
      age: 28,
      gender: 'Male',
      bloodType: 'B+',
      height: 175,
      weight: 72,
      allergies: ['Penicillin', 'Dust'],
      conditions: ['Mild Asthma'],
      emergencyContacts: [
        { name: 'Mom', phone: '+91-9876543210', relation: 'Mother' },
        { name: 'Dr. Sharma', phone: '+91-9876543211', relation: 'Family Doctor' }
      ],
      organDonor: false,
      language: 'en'
    });

    // Sample medicines
    this.addMedicine({
      name: 'Montelukast',
      dosage: '10mg',
      frequency: 'Once daily',
      times: ['22:00'],
      type: 'Tablet',
      purpose: 'Asthma prevention',
      startDate: '2025-01-15',
      endDate: '',
      remaining: 18,
      totalPills: 30
    });

    this.addMedicine({
      name: 'Vitamin D3',
      dosage: '60000 IU',
      frequency: 'Once weekly',
      times: ['09:00'],
      type: 'Capsule',
      purpose: 'Vitamin D deficiency',
      startDate: '2025-03-01',
      endDate: '2025-06-01',
      remaining: 6,
      totalPills: 12
    });

    this.addMedicine({
      name: 'Cetirizine',
      dosage: '10mg',
      frequency: 'As needed',
      times: ['08:00'],
      type: 'Tablet',
      purpose: 'Allergy relief',
      startDate: '2025-04-01',
      endDate: '',
      remaining: 22,
      totalPills: 30
    });

    // Sample appointments
    this.addAppointment({
      doctor: 'Dr. Priya Sharma',
      specialty: 'Pulmonologist',
      hospital: 'Apollo Hospital',
      date: '2026-07-15',
      time: '10:30',
      notes: 'Regular asthma checkup',
      status: 'upcoming'
    });

    this.addAppointment({
      doctor: 'Dr. Rajesh Patel',
      specialty: 'General Physician',
      hospital: 'City Care Clinic',
      date: '2026-07-28',
      time: '14:00',
      notes: 'Annual health checkup',
      status: 'upcoming'
    });

    // Sample records
    this.addRecord({
      title: 'Complete Blood Count',
      category: 'Blood Test',
      doctor: 'Dr. Rajesh Patel',
      hospital: 'City Care Lab',
      date: '2026-06-01',
      findings: 'Hemoglobin: 14.2 g/dL, WBC: 7,200, Platelets: 250,000',
      notes: 'All values within normal range'
    });

    this.addRecord({
      title: 'Chest X-Ray',
      category: 'Imaging',
      doctor: 'Dr. Priya Sharma',
      hospital: 'Apollo Hospital',
      date: '2026-05-15',
      findings: 'No abnormalities detected',
      notes: 'Annual lung screening - clear'
    });

    this.addRecord({
      title: 'Vitamin D Test',
      category: 'Blood Test',
      doctor: 'Dr. Rajesh Patel',
      hospital: 'City Care Lab',
      date: '2026-03-10',
      findings: 'Vitamin D: 18 ng/mL (Low)',
      notes: 'Prescribed Vitamin D3 supplementation'
    });

    // Sample family
    this.addFamilyMember({
      name: 'Rajesh Patel (Father)',
      relation: 'Father',
      age: 58,
      bloodType: 'B+',
      conditions: ['Type 2 Diabetes', 'Hypertension'],
      medications: ['Metformin 500mg', 'Amlodipine 5mg'],
      avatar: '👨'
    });

    this.addFamilyMember({
      name: 'Meena Patel (Mother)',
      relation: 'Mother',
      age: 54,
      bloodType: 'A+',
      conditions: ['Hypothyroidism'],
      medications: ['Thyroxine 50mcg'],
      avatar: '👩'
    });

    // Sample health data
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    months.forEach((m, i) => {
      this.addHealthEntry('bloodSugar', { value: 95 + Math.random() * 20, label: m });
      this.addHealthEntry('bloodPressure', { systolic: 118 + Math.random() * 10, diastolic: 76 + Math.random() * 8, label: m });
      this.addHealthEntry('weight', { value: 73 - (i * 0.3) + Math.random(), label: m });
      this.addHealthEntry('cholesterol', { value: 195 - (i * 3) + Math.random() * 5, label: m });
      this.addHealthEntry('heartRate', { value: 72 + Math.random() * 8, label: m });
    });

    // Sample mood data
    const moods = ['😊', '😐', '😊', '😴', '😊', '🙂', '😊'];
    moods.forEach((mood, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      this.addMoodEntry({ mood, note: '', date: d.toISOString() });
    });

    // Sample expenses
    this.addExpense({ category: 'Medicine', description: 'Monthly medicines', amount: 850, date: '2026-06-01' });
    this.addExpense({ category: 'Doctor', description: 'Dr. Sharma consultation', amount: 1500, date: '2026-05-28' });
    this.addExpense({ category: 'Tests', description: 'Blood test panel', amount: 2200, date: '2026-06-01' });

    // Sample vaccinations
    this.addVaccination({ name: 'COVID-19 Booster', date: '2025-11-15', nextDue: '', status: 'completed', person: 'Self' });
    this.addVaccination({ name: 'Flu Shot', date: '2025-10-01', nextDue: '2026-10-01', status: 'completed', person: 'Self' });

    this.set('initialized', true);
  }
};

// Initialize on load
Store.initSampleData();
