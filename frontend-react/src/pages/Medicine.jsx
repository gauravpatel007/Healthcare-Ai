import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import editIcon from '../../../Icons/edit sign.png';
import { 
  CheckCircle2, 
  Activity, 
  X,
  Pill,
  CheckCircle,
  AlertTriangle,
  Plus,
  Camera,
  ShieldAlert,
  Edit,
  Trash2,
  Clock,
  Calendar,
  Info,
  Box,
  Syringe,
  Droplet,
  FlaskConical,
  Circle,
  Pipette,
  Disc
} from 'lucide-react';

const ScoredTablet = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <ellipse cx="12" cy="8" rx="10" ry="5" />
    <path d="M2 8v5c0 2.76 4.48 5 10 5s10-2.24 10-5V8" />
    <line x1="6" y1="4" x2="18" y2="12" />
  </svg>
);

const Medicine = ({ voiceAction, onVoiceActionConsumed }) => {
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
  const [medicines, setMedicines] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editMedicine, setEditMedicine] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [newMedicine, setNewMedicine] = useState({
    name: '', dosage: '', type: 'tablet', frequency: 'once_daily', purpose: '', times: ['08:00'], total_pills: 30, remaining: 30, start_date: new Date().toISOString().split('T')[0]
  });
  const [isScanning, setIsScanning] = useState(false);

  // Listen for voice actions
  useEffect(() => {
    if (voiceAction && voiceAction.target_feature === 'medicine') {
      if (voiceAction.action_name === 'open_add_modal') {
        setShowAddForm(true);
      } else if (voiceAction.action_name === 'fill_form' && voiceAction.data) {
        setShowAddForm(true);
        setNewMedicine(prev => ({
          ...prev,
          ...(voiceAction.data.name && { name: voiceAction.data.name }),
          ...(voiceAction.data.dosage && { dosage: voiceAction.data.dosage }),
          ...(voiceAction.data.type && { type: voiceAction.data.type }),
          ...(voiceAction.data.frequency && { frequency: voiceAction.data.frequency }),
          ...(voiceAction.data.purpose && { purpose: voiceAction.data.purpose }),
        }));
      }
      if (onVoiceActionConsumed) onVoiceActionConsumed();
    }
  }, [voiceAction]);

  const typeIcon = { 
    tablet: <ScoredTablet className="w-7 h-7" />, 
    capsule: <Pill className="w-7 h-7" />, 
    syrup: <FlaskConical className="w-7 h-7" />, 
    injection: <Syringe className="w-7 h-7" />, 
    drops: <Droplet className="w-7 h-7" />, 
    cream: <Box className="w-7 h-7" /> 
  };

  const typeColor = {
    tablet: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    capsule: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    syrup: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    injection: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    drops: 'bg-sky-50 text-sky-600 dark:bg-sky-900/30 dark:text-sky-400',
    cream: 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400'
  };

  const fetchData = async () => {
    try {
      const [meds, preds] = await Promise.all([
        API.get('/medicines'),
        API.get('/medicines/refill-predictions')
      ]);
      setMedicines(meds || []);
      setPredictions(preds || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const deleteMedicine = async (id) => {
    if (window.confirm('Remove this medicine?')) {
      try {
        await API.delete(`/medicines/${id}`);
        setMedicines(medicines.filter(m => m.id !== id));
      } catch (e) {
        alert('Failed to delete medicine');
      }
    }
  };

  const openEditModal = (med) => {
    setEditMedicine({ ...med });
    setShowEditForm(true);
  };

  const handleUpdateMedicine = async () => {
    if (!editMedicine.name || !editMedicine.dosage) {
      alert('Name and dosage are required');
      return;
    }
    try {
      const updated = await API.request(`/medicines/${editMedicine.id}`, {
        method: 'PUT',
        body: editMedicine
      });
      setMedicines(medicines.map(m => m.id === updated.id ? updated : m));
      setShowEditForm(false);
      setEditMedicine(null);
    } catch (e) {
      alert('Failed to update medicine');
    }
  };

  const checkInteractions = async () => {
    try {
      const res = await API.get('/medicines/interactions');
      if (res.has_interactions) {
        alert(`⚠️ Interactions Found:\n\n${res.warnings.map(w => w.description).join('\n')}`);
      } else {
        alert("✅ No Interactions Found\n\nYour current medications appear safe to take together.");
      }
    } catch (e) {
      alert('Failed to check interactions');
    }
  };

  const handleSaveMedicine = async () => {
    if (!newMedicine.name || !newMedicine.dosage) {
      alert('Name and dosage are required');
      return;
    }
    try {
      const added = await API.post('/medicines', newMedicine);
      setMedicines([added, ...medicines]);
      setShowAddForm(false);
      setNewMedicine({ name: '', dosage: '', type: 'tablet', frequency: 'once_daily', purpose: '', times: ['08:00'], total_pills: 30, remaining: 30, start_date: new Date().toISOString().split('T')[0] });
    } catch (e) {
      alert('Failed to save medicine');
    }
  };

  const handleScanPill = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          const MAX_HEIGHT = 800;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          const base64data = canvas.toDataURL('image/jpeg', 0.8);

          try {
            const res = await API.post('/vision/analyze', {
              image_data: base64data,
              scan_type: 'pill'
            });
            if (res && res.data) {
              setNewMedicine(prev => ({
                ...prev,
                name: res.data.name,
                purpose: res.data.purpose,
              }));
              setShowAddForm(true);

              setScanResult({
                type: 'success',
                title: 'Pill Analyzed Successfully! 💊',
                data: res.data
              });
            } else {
              setScanResult({
                type: 'error',
                title: 'Scan Failed',
                message: "Could not analyze the pill. Please try again."
              });
            }
          } catch (error) {
            console.error(error);
            setScanResult({
              type: 'error',
              title: 'Scan Failed',
              message: error.response?.data?.detail || error.message || "Could not analyze the pill. Please try again."
            });
          } finally {
            setIsScanning(false);
          }
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsScanning(false);
    }
    e.target.value = null;
  };

  if (loading) return <div className="empty-state"><span className="spinner"></span> Loading Medicines...</div>;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20 relative">

      {/* Scan Result Modal */}
      {scanResult && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 animate-in zoom-in-95 duration-300">
            <div className={`p-6 text-center ${scanResult.type === 'success' ? 'bg-indigo-50 dark:bg-indigo-900/30' : 'bg-red-50 dark:bg-red-900/30'}`}>
              <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${scanResult.type === 'success' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-800 dark:text-indigo-300' : 'bg-red-100 text-red-600 dark:bg-red-800 dark:text-red-300'}`}>
                {scanResult.type === 'success' ? <CheckCircle2 className="w-8 h-8" /> : <Activity className="w-8 h-8" />}
              </div>
              <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">{scanResult.title}</h3>
              {scanResult.type === 'error' && (
                <p className="text-gray-600 dark:text-gray-300 font-medium">{scanResult.message}</p>
              )}
            </div>

            {scanResult.type === 'success' && scanResult.data && (
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4">
                  <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{scanResult.data.name}</h4>
                  <p className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">{scanResult.data.purpose}</p>
                </div>

                {scanResult.data.common_interactions && scanResult.data.common_interactions.length > 0 && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-2xl p-4 border border-amber-100 dark:border-amber-900/50">
                    <div className="flex items-center gap-2 mb-2 text-amber-800 dark:text-amber-400 font-bold text-sm">
                      <AlertTriangle className="w-4 h-4" />
                      Warnings & Interactions
                    </div>
                    <ul className="text-sm text-amber-700 dark:text-amber-500 space-y-1 pl-6 list-disc">
                      {scanResult.data.common_interactions.map((warn, i) => (
                        <li key={i}>{warn}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="p-6 pt-2">
              <button
                onClick={() => setScanResult(null)}
                className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors"
              >
                Continue to Add Form
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-row flex-wrap md:flex-nowrap items-center justify-between gap-4 relative overflow-hidden w-full">
        <div className="flex items-center gap-4 lg:gap-6 relative z-10 w-auto">
          <div className="w-16 h-16 bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <Pill className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1 text-left">
              Medicine Management
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 text-left">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse shrink-0"></span>
              {medicines.length} active medications
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 relative z-10 shrink-0 ml-auto pr-2 flex-wrap">
          <label className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md hover:bg-gray-800 dark:hover:bg-white hover:shadow-lg cursor-pointer ${isScanning ? 'opacity-80 cursor-wait' : ''}`}>
            <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanPill} disabled={isScanning} />
            {isScanning ? (
              <>
                <Clock className="w-4 h-4 animate-spin shrink-0" />
                <span className="whitespace-nowrap">Scanning...</span>
              </>
            ) : (
              <>
                <Camera className="w-4 h-4 shrink-0" />
                <span className="whitespace-nowrap">Scan Pill</span>
              </>
            )}
          </label>
          <button 
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50" 
            onClick={checkInteractions}
          >
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Check Interactions</span>
          </button>
          <button 
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg" 
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Add Medicine</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500 opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1 tracking-wide uppercase">Active</p>
              <h3 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight leading-tight">{medicines.length}</h3>
            </div>
            <div className="p-4 bg-purple-500 bg-opacity-10 dark:bg-opacity-20 rounded-2xl shadow-sm transition-transform duration-300 ease-out group-hover:scale-125 text-purple-600 dark:text-purple-400">
              <Pill className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm font-semibold text-gray-500 relative z-10">
            Medications
          </div>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1 tracking-wide uppercase">Well Stocked</p>
              <h3 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight leading-tight">{medicines.filter(m => m.remaining > 5).length}</h3>
            </div>
            <div className="p-4 bg-emerald-500 bg-opacity-10 dark:bg-opacity-20 rounded-2xl shadow-sm transition-transform duration-300 ease-out group-hover:scale-125 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm font-semibold text-emerald-600 dark:text-emerald-400 relative z-10">
            <span className="bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-lg">Healthy Supply</span>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500 opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110"></div>
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1 tracking-wide uppercase">Refill Soon</p>
              <h3 className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight leading-tight">{medicines.filter(m => m.remaining <= 5).length}</h3>
            </div>
            <div className="p-4 bg-rose-500 bg-opacity-10 dark:bg-opacity-20 rounded-2xl shadow-sm transition-transform duration-300 ease-out group-hover:scale-125 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm font-semibold text-rose-600 dark:text-rose-400 relative z-10">
            <span className="bg-rose-50 dark:bg-rose-900/30 px-2.5 py-1 rounded-lg">Requires Attention</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
        {medicines.length > 0 ? medicines.map(m => {
          const pct = m.remaining && m.total_pills ? (m.remaining / m.total_pills) * 100 : 100;
          return (
            <div key={m.id} className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-[0.03] dark:opacity-[0.05] rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 pointer-events-none"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="flex items-center gap-4">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${typeColor[m.type] || 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400'}`}>
                    {typeIcon[m.type] || <Pill className="w-7 h-7" />}
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1">{m.name}</h4>
                    <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                      {m.dosage} • <span className="capitalize">{m.type}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditModal(m)} className="p-2.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors" title="Edit Medicine">
                    <Edit className="w-5 h-5" />
                  </button>
                  <button onClick={() => deleteMedicine(m.id)} className="p-2.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" title="Delete Medicine">
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-grow mb-5 relative z-10">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-4">{m.purpose}</p>
                <div className="flex justify-between items-center mb-4">
                  <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-100 dark:border-gray-600">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span className="capitalize">{m.frequency.replace('_', ' ')}</span>
                  </span>
                  <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${pct > 40 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : pct > 20 ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                    {m.remaining} pills left
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {(m.times || []).map(t => (
                    <span key={t} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400 px-2.5 py-1 rounded-lg text-xs font-bold border border-indigo-100 dark:border-indigo-800">
                      <Clock className="w-3 h-3" />
                      {t}
                    </span>
                  ))}
                </div>
                {m.start_date && (
                  <p className="text-xs text-gray-400 mt-4 font-medium flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Started: {m.start_date}
                  </p>
                )}
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-gray-800 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 rounded-full flex items-center justify-center mb-4">
              <Pill className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">No Medicines Added</h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm mb-6">Track your medications, set reminders, and never miss a dose.</p>
            <button 
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Add Medicine
            </button>
          </div>
        )}
      </div>

      {predictions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center shadow-sm">
              <Box className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Refill Predictions</h2>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {predictions.map((p, i) => {
                const med = medicines.find(m => m.id === p.medicine_id);
                const pType = med ? med.type : 'tablet';
                return (
                <div key={i} className="flex flex-col gap-4 p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all group">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform ${typeColor[pType] || 'bg-slate-100 text-slate-600 dark:bg-slate-800/50 dark:text-slate-400'}`}>
                      {typeIcon[pType] || <Pill className="w-6 h-6" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white truncate leading-tight">{p.medicine_name}</h4>
                      <span className={`px-2.5 py-1 inline-block mt-1.5 rounded-lg text-xs font-bold whitespace-nowrap ${p.days_left > 10 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : p.days_left > 5 ? 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400'}`}>
                        ~{p.days_left} days left
                      </span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                      {p.remaining} of {p.total_pills} pills remaining
                    </p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${p.percentage > 40 ? 'bg-emerald-500' : p.percentage > 20 ? 'bg-amber-500' : 'bg-rose-500'}`} 
                        style={{ width: `${p.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              )})}
            </div>
          </div>
        </div>
      )}

      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) setShowAddForm(false) }}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Pill className="w-6 h-6 text-indigo-500" /> Add Medicine
              </h3>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors" onClick={() => setShowAddForm(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Medicine Name</label>
                  <input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white" value={newMedicine.name} onChange={e => setNewMedicine({ ...newMedicine, name: e.target.value })} placeholder="e.g., Paracetamol" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Dosage</label>
                  <input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white" value={newMedicine.dosage} onChange={e => setNewMedicine({ ...newMedicine, dosage: e.target.value })} placeholder="e.g., 500mg" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <select className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white" value={newMedicine.type} onChange={e => setNewMedicine({ ...newMedicine, type: e.target.value })}>
                    <option value="tablet">Tablet</option><option value="capsule">Capsule</option><option value="syrup">Syrup</option>
                    <option value="injection">Injection</option><option value="drops">Drops</option><option value="cream">Cream</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Frequency</label>
                  <select className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white" value={newMedicine.frequency} onChange={e => setNewMedicine({ ...newMedicine, frequency: e.target.value })}>
                    <option value="once_daily">Once daily</option><option value="twice_daily">Twice daily</option>
                    <option value="thrice_daily">Thrice daily</option><option value="once_weekly">Once weekly</option>
                    <option value="as_needed">As needed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Time(s)</label>
                <input type="time" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white" value={newMedicine.times[0]} onChange={e => setNewMedicine({ ...newMedicine, times: [e.target.value] })} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Purpose</label>
                <input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white" value={newMedicine.purpose} onChange={e => setNewMedicine({ ...newMedicine, purpose: e.target.value })} placeholder="What is this medicine for?" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Total Pills</label>
                  <input type="number" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white" value={newMedicine.total_pills} onChange={e => setNewMedicine({ ...newMedicine, total_pills: parseInt(e.target.value) || 0, remaining: parseInt(e.target.value) || 0 })} placeholder="30" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Remaining</label>
                  <input type="number" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white" value={newMedicine.remaining} onChange={e => setNewMedicine({ ...newMedicine, remaining: parseInt(e.target.value) || 0 })} placeholder="30" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 shrink-0">
              <button className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button className="px-5 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-all hover:shadow-lg" onClick={handleSaveMedicine}>Save Medicine</button>
            </div>
          </div>
        </div>
      )}

      {showEditForm && editMedicine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) setShowEditForm(false) }}>
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Edit className="w-6 h-6 text-indigo-500" /> Edit Medicine
              </h3>
              <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors" onClick={() => setShowEditForm(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Medicine Name</label>
                  <input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white" value={editMedicine.name} onChange={e => setEditMedicine({ ...editMedicine, name: e.target.value })} placeholder="e.g., Paracetamol" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Dosage</label>
                  <input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white" value={editMedicine.dosage} onChange={e => setEditMedicine({ ...editMedicine, dosage: e.target.value })} placeholder="e.g., 500mg" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Type</label>
                  <select className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white" value={editMedicine.type} onChange={e => setEditMedicine({ ...editMedicine, type: e.target.value })}>
                    <option value="tablet">Tablet</option><option value="capsule">Capsule</option><option value="syrup">Syrup</option>
                    <option value="injection">Injection</option><option value="drops">Drops</option><option value="cream">Cream</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Frequency</label>
                  <select className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white" value={editMedicine.frequency} onChange={e => setEditMedicine({ ...editMedicine, frequency: e.target.value })}>
                    <option value="once_daily">Once daily</option><option value="twice_daily">Twice daily</option>
                    <option value="thrice_daily">Thrice daily</option><option value="once_weekly">Once weekly</option>
                    <option value="as_needed">As needed</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Time(s)</label>
                <input type="time" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white" value={(editMedicine.times && editMedicine.times.length) ? editMedicine.times[0] : '08:00'} onChange={e => setEditMedicine({ ...editMedicine, times: [e.target.value] })} />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Purpose</label>
                <input type="text" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white" value={editMedicine.purpose || ''} onChange={e => setEditMedicine({ ...editMedicine, purpose: e.target.value })} placeholder="What is this medicine for?" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Total Pills</label>
                  <input type="number" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white" value={editMedicine.total_pills || 0} onChange={e => setEditMedicine({ ...editMedicine, total_pills: parseInt(e.target.value) || 0 })} placeholder="30" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Remaining</label>
                  <input type="number" className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all dark:text-white" value={editMedicine.remaining || 0} onChange={e => setEditMedicine({ ...editMedicine, remaining: parseInt(e.target.value) || 0 })} placeholder="30" />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex justify-end gap-3 shrink-0">
              <button className="px-5 py-2.5 rounded-xl font-bold text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors" onClick={() => setShowEditForm(false)}>Cancel</button>
              <button className="px-5 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-all hover:shadow-lg" onClick={handleUpdateMedicine}>Update Medicine</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Medicine;
