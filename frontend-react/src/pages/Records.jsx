import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import editIcon from '../../../Icons/edit sign.png';
import { 
  FolderOpen,
  GitCompare,
  UploadCloud,
  Plus,
  Search,
  FileText,
  Edit,
  Trash2,
  Sparkles,
  Stethoscope,
  Building2,
  Calendar,
  Droplet,
  Scan,
  Pill,
  Activity,
  Syringe
} from 'lucide-react';

const Records = ({ voiceAction, onVoiceActionConsumed }) => {
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
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedForCompare, setSelectedForCompare] = useState([]);
  const [familyMembers, setFamilyMembers] = useState([]);
  
  const [newRecord, setNewRecord] = useState({
    title: '',
    category: 'Blood Test',
    date: new Date().toISOString().split('T')[0],
    doctor: '',
    hospital: '',
    findings: '',
    family_member_id: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCompare, setShowCompare] = useState(false);
  const [showAIUpload, setShowAIUpload] = useState(false);
  const [aiUploadStatus, setAiUploadStatus] = useState(null);
  const [compareResult, setCompareResult] = useState(null);
  const [showSummary, setShowSummary] = useState(false);
  const [summaryResult, setSummaryResult] = useState(null);

  // Listen for voice actions
  useEffect(() => {
    const handleVoice = async () => {
      if (voiceAction && voiceAction.target_feature === 'records') {
        if (voiceAction.action_name === 'open_add_modal') {
          setShowAddForm(true);
        } else if (voiceAction.action_name === 'compare_reports') {
          setCompareMode(true);
          alert('Compare mode enabled! Select 2 records to compare.');
        } else if (voiceAction.action_name === 'ai_summary' && voiceAction.data?.record_name) {
          const target = records.find(r => 
            r.title.toLowerCase().includes(voiceAction.data.record_name.toLowerCase())
          );
          if (target) {
            try {
              const res = await API.get(`/records/${target.id}/summary`);
              setSummaryResult(res);
              setShowSummary(true);
            } catch(e) {
              alert(`AI Summary for "${target.title}": Feature in progress.`);
            }
          } else {
            alert(`Could not find a record matching "${voiceAction.data.record_name}"`);
          }
        }
        if (onVoiceActionConsumed) onVoiceActionConsumed();
      }
    };
    handleVoice();
  }, [voiceAction, records]);

  const categories = ['All', 'Blood Test', 'Imaging', 'Prescription', 'Surgery', 'Vaccination', 'Other'];

  const categoryIcons = {
    'Blood Test': <Droplet className="w-8 h-8" />,
    'Imaging': <Scan className="w-8 h-8" />,
    'Prescription': <Pill className="w-8 h-8" />,
    'Surgery': <Activity className="w-8 h-8" />,
    'Vaccination': <Syringe className="w-8 h-8" />,
    'Other': <FileText className="w-8 h-8" />
  };

  const fetchRecords = async () => {
    try {
      const data = await API.request('/records');
      setRecords(data);
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // Fetch family members for the edit modal
    API.request('/family/members').then(data => {
      if (Array.isArray(data)) setFamilyMembers(data);
    }).catch(() => {});
  }, []);

  const filteredRecords = records.filter(r => {
    if (category !== 'All' && r.category !== category) return false;
    if (searchQuery && !r.title.toLowerCase().includes(searchQuery.toLowerCase()) && 
        !(r.doctor || '').toLowerCase().includes(searchQuery.toLowerCase()) && 
        !(r.hospital || '').toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const toggleCompareSelection = (record) => {
    if (selectedForCompare.find(r => r.id === record.id)) {
      setSelectedForCompare(selectedForCompare.filter(r => r.id !== record.id));
    } else {
      if (selectedForCompare.length >= 2) {
        alert('You can only compare 2 reports at a time.');
        return;
      }
      setSelectedForCompare([...selectedForCompare, record]);
    }
  };

  const handleCompareReports = async () => {
    if (!compareMode) {
      setCompareMode(true);
      setSelectedForCompare([]);
      return;
    }

    if (selectedForCompare.length !== 2) {
      alert('Please select exactly 2 records to compare');
      return;
    }

    const [r1, r2] = selectedForCompare;
    setShowCompare(true);
    setCompareResult({ type: 'loading' });
    setCompareMode(false);
    setSelectedForCompare([]);

    try {
      const res = await API.request('/records/compare', {
        method: 'POST',
        body: { record_id_1: r1.id, record_id_2: r2.id }
      });
      setCompareResult({ type: 'success', data: res });
    } catch (e) {
      setCompareResult({ type: 'error', message: 'Failed to compare records' });
    }
  };

  const handleAISummary = async (record) => {
    setShowSummary(true);
    setSummaryResult({ type: 'loading', recordTitle: record.title });
    try {
      const res = await API.request(`/records/${record.id}/ai-summary`, { method: 'POST' });
      setSummaryResult({ type: 'success', data: res, recordTitle: record.title });
    } catch (e) {
      setSummaryResult({ type: 'error', message: 'Failed to generate summary', recordTitle: record.title });
    }
  };

  const deleteRecord = async (id) => {
    if (window.confirm('Delete this record?')) {
      try {
        await API.delete(`/records/${id}`);
        setRecords(records.filter(r => r.id !== id));
      } catch (e) {
        alert('Failed to delete record');
      }
    }
  };

  const openEditModal = (record) => {
    setEditRecord({ ...record });
    setShowEditForm(true);
  };

  const handleUpdateRecord = async () => {
    if (!editRecord.title || !editRecord.category || !editRecord.date) {
      alert('Title, Category, and Date are required');
      return;
    }
    try {
      const updated = await API.request(`/records/${editRecord.id}`, {
        method: 'PUT',
        body: editRecord
      });
      setRecords(records.map(r => r.id === updated.id ? updated : r));
      setShowEditForm(false);
      setEditRecord(null);
    } catch (e) {
      alert(`Failed to update. Date sent: ${editRecord.date}. Error: ${e.message}`);
    }
  };

  const handleSaveRecord = async () => {
    if (!newRecord.title || !newRecord.category || !newRecord.date) {
      alert('Title, Category, and Date are required');
      return;
    }
    const formData = new FormData();
    formData.append('title', newRecord.title);
    formData.append('category', newRecord.category);
    formData.append('date', newRecord.date);
    if (newRecord.doctor) formData.append('doctor', newRecord.doctor);
    if (newRecord.hospital) formData.append('hospital', newRecord.hospital);
    if (newRecord.findings) formData.append('findings', newRecord.findings);
    if (selectedFile) formData.append('file', selectedFile);

    try {
      const added = await API.request('/records', {
        method: 'POST',
        body: formData
      });
      setRecords([...records, added]);
      setShowAddForm(false);
      setNewRecord({ title: '', category: 'Blood Test', date: new Date().toISOString().split('T')[0], doctor: '', hospital: '', findings: '' });
      setSelectedFile(null);
    } catch (e) {
      alert('Failed to upload record: ' + (e.message || 'Unknown error'));
    }
  };

  if (loading) return <div className="empty-state"><span className="spinner"></span> Loading Records...</div>;

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 pb-20">
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-row flex-wrap md:flex-nowrap items-center justify-between gap-4 relative overflow-hidden w-full">
        <div className="flex items-center gap-4 lg:gap-6 relative z-10 w-auto">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <FolderOpen className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1 text-left">
              Medical Records Vault
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 text-left">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse shrink-0"></span>
              {records.length} records stored securely
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 relative z-10 shrink-0 ml-auto pr-2 flex-wrap">
          {compareMode && (
             <button 
               className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600" 
               onClick={() => { setCompareMode(false); setSelectedForCompare([]); }}
             >
               Cancel
             </button>
          )}
          <button 
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${compareMode ? 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50'}`} 
            onClick={handleCompareReports}
          >
            <GitCompare className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">{compareMode ? `Compare (${selectedForCompare.length}/2)` : 'Compare Reports'}</span>
          </button>
          <button 
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50" 
            onClick={() => setShowAIUpload(true)}
          >
            <Sparkles className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">AI Upload</span>
          </button>
          <button 
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all bg-blue-600 text-white shadow-md hover:bg-blue-700 hover:shadow-lg" 
            onClick={() => setShowAddForm(true)}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="whitespace-nowrap">Add Record</span>
          </button>
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 w-full">
        <div className="flex flex-wrap items-center justify-start gap-2 w-full md:w-auto">
          {categories.map(c => (
            <button 
              key={c} 
              onClick={() => setCategory(c)} 
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${category === c ? 'bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-72 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input 
            type="text" 
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all dark:text-white" 
            placeholder="Search records..." 
            value={searchQuery} 
            onChange={e => setSearchQuery(e.target.value)} 
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredRecords.length > 0 ? filteredRecords.map(r => (
          <div key={r.id} className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 relative overflow-hidden group flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 opacity-[0.03] dark:opacity-[0.05] rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110 pointer-events-none"></div>
            
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner text-2xl">
                  {categoryIcons[r.category] || '📋'}
                </div>
                <div>
                  <span className="inline-block bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase mb-1">
                    {r.category}
                  </span>
                  <div className="text-xs font-bold text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    {r.date}
                  </div>
                </div>
                {compareMode && (
                  <div className="ml-2 flex items-center">
                    <input type="checkbox" checked={!!selectedForCompare.find(s => s.id === r.id)} onChange={() => toggleCompareSelection(r)} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => openEditModal(r)} className="p-2.5 text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors" title="Edit Record">
                  <Edit className="w-5 h-5" />
                </button>
                <button onClick={() => deleteRecord(r.id)} className="p-2.5 text-gray-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-lg transition-colors" title="Delete Record">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-grow mb-5 relative z-10">
              <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-3" title={r.title}>
                {r.title && r.title.length > 40 ? `${r.title.substring(0, 20)}...${r.title.substring(r.title.length - 10)}` : r.title}
              </h4>
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {r.doctor && (
                  <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-100 dark:border-gray-600">
                    <Stethoscope className="w-3.5 h-3.5 text-indigo-500" />
                    {r.doctor}
                  </span>
                )}
                {r.hospital && (
                  <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg text-xs font-semibold border border-gray-100 dark:border-gray-600">
                    <Building2 className="w-3.5 h-3.5 text-purple-500" />
                    {r.hospital}
                  </span>
                )}
              </div>
              {r.findings && (
                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-3.5 rounded-xl border-l-2 border-indigo-500 text-sm font-medium text-gray-700 dark:text-gray-300 italic shadow-sm">
                  "{r.findings}"
                </div>
              )}
            </div>

            <div className="mt-auto relative z-10">
              <button 
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/30 py-2.5 px-4 rounded-xl font-bold text-sm hover:from-indigo-100 hover:to-purple-100 dark:hover:from-indigo-900/40 dark:hover:to-purple-900/40 transition-all shadow-sm"
                onClick={() => handleAISummary(r)}
              >
                <Sparkles className="w-4 h-4" />
                Generate AI Summary
              </button>
            </div>
          </div>
        )) : (
          <div className="col-span-full bg-white dark:bg-gray-800 rounded-[2.5rem] p-12 text-center border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-gray-50 dark:bg-gray-700 text-gray-300 dark:text-gray-500 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white mb-2">No Records Found</h3>
            <p className="text-gray-500 dark:text-gray-400 font-medium mb-6 max-w-sm">Upload your medical reports, prescriptions, and scans to keep them organized and accessible.</p>
            <button 
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-md hover:bg-blue-700 hover:shadow-lg"
              onClick={() => setShowAddForm(true)}
            >
              <Plus className="w-4 h-4" />
              Add Your First Record
            </button>
          </div>
        )}
      </div>

      {/* Add Record Modal */}
      {showAddForm && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setShowAddForm(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content" style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '24px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto', position: 'relative' }}>
            <h3 style={{ marginTop: 0, fontSize: '1.5rem', marginBottom: '24px' }}>Add Medical Record</h3>
            <div className="form-group mb-md">
              <label>Title</label>
              <input type="text" className="form-input" value={newRecord.title} onChange={e => setNewRecord({...newRecord, title: e.target.value})} placeholder="e.g. Annual Blood Test" />
            </div>
            <div className="form-group mb-md" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label>Category</label>
                <select className="form-select" value={newRecord.category} onChange={e => setNewRecord({...newRecord, category: e.target.value})}>
                  {categories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label>Date</label>
                <input type="date" className="form-input" value={newRecord.date} onChange={e => setNewRecord({...newRecord, date: e.target.value})} />
              </div>
            </div>
            <div className="form-group mb-md" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label>Doctor (Optional)</label>
                <input type="text" className="form-input" value={newRecord.doctor} onChange={e => setNewRecord({...newRecord, doctor: e.target.value})} placeholder="Dr. Smith" />
              </div>
              <div>
                <label>Hospital (Optional)</label>
                <input type="text" className="form-input" value={newRecord.hospital} onChange={e => setNewRecord({...newRecord, hospital: e.target.value})} placeholder="City Clinic" />
              </div>
            </div>
            <div className="form-group mb-md">
              <label>Key Findings (Optional)</label>
              <textarea className="form-input" rows={3} value={newRecord.findings} onChange={e => setNewRecord({...newRecord, findings: e.target.value})} placeholder="Enter key findings, test results, diagnosis..." style={{ resize: 'vertical', minHeight: '80px' }} />
            </div>
            <div className="form-group mb-lg">
              <label>Upload Document (PDF/Image)</label>
              <input type="file" className="form-input" onChange={e => setSelectedFile(e.target.files[0])} />
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSaveRecord}>Save Record</button>
            </div>
          </div>
        </div>
      )}

      {showEditForm && editRecord && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setShowEditForm(false) }}>
          <div className="modal">
            <div className="modal-header">
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img src={editIcon} alt="Edit" style={{ width: '20px', height: '20px' }} /> Edit Medical Record
              </h3>
              <button className="modal-close" onClick={() => setShowEditForm(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Report Title</label>
                <input type="text" className="form-input" value={editRecord.title} onChange={e => setEditRecord({...editRecord, title: e.target.value})} placeholder="e.g., Complete Blood Count" />
              </div>
              <div className="form-group mt-sm">
                <label className="form-label">Profile / Family Member</label>
                <select className="form-select" value={editRecord.family_member_id || ''} onChange={e => setEditRecord({...editRecord, family_member_id: e.target.value})}>
                  <option value="">My Profile (Me)</option>
                  {familyMembers.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid-2 gap-md mt-sm">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-select" value={editRecord.category} onChange={e => setEditRecord({...editRecord, category: e.target.value})}>
                    {categories.slice(1).map(opt => <option key={opt}>{opt}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input type="date" className="form-input" value={editRecord.date} onChange={e => setEditRecord({...editRecord, date: e.target.value})} />
                </div>
              </div>
              <div className="grid-2 gap-md">
                <div className="form-group">
                  <label className="form-label">Doctor</label>
                  <input type="text" className="form-input" value={editRecord.doctor || ''} onChange={e => setEditRecord({...editRecord, doctor: e.target.value})} placeholder="Dr. Name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Hospital/Lab</label>
                  <input type="text" className="form-input" value={editRecord.hospital || ''} onChange={e => setEditRecord({...editRecord, hospital: e.target.value})} placeholder="Hospital name" />
                </div>
              </div>
              <div className="form-group mt-sm">
                <label className="form-label">Key Findings</label>
                <textarea className="form-textarea" value={editRecord.findings || ''} onChange={e => setEditRecord({...editRecord, findings: e.target.value})} placeholder="Enter key findings, test results..."></textarea>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowEditForm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateRecord}>Update Record</button>
            </div>
          </div>
        </div>
      )}

      {showAIUpload && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget && aiUploadStatus?.type !== 'loading') { setShowAIUpload(false); setAiUploadStatus(null); } }}>
          <div className="modal">
            <div className="modal-header">
              <h3>🤖 AI Report Parser</h3>
              <button className="modal-close" onClick={() => setShowAIUpload(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '32px 20px 20px 20px' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>📄</div>
              <h3 style={{ marginBottom: '12px', color: '#0f172a', fontWeight: '700', fontSize: '1.25rem' }}>Upload Your Lab Report</h3>
              <p style={{ color: '#475569', fontSize: '0.9rem', marginBottom: '32px', maxWidth: '90%', margin: '0 auto 32px auto', lineHeight: '1.5' }}>
                Upload a PDF of your blood test or lab report. Our AI will automatically extract key health metrics like Hemoglobin, Blood Sugar, Cholesterol, and more.
              </p>
              <div style={{ border: '1px dashed #cbd5e1', borderRadius: '16px', padding: '40px 20px', cursor: 'pointer', transition: 'all 0.3s', background: '#F8FAFC', textAlign: 'center' }}
                   onClick={() => document.getElementById('ai-report-file').click()}>
                <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>⬆️</div>
                <p style={{ fontWeight: '600', marginBottom: '8px', color: '#0f172a', fontSize: '1.1rem' }}>Click to select or drag & drop</p>
                <p style={{ fontSize: '0.85rem', color: '#475569' }}>PDF files only · Max 10MB</p>
              </div>
              <input type="file" id="ai-report-file" accept=".pdf" style={{ display: 'none' }} onChange={async (e) => {
                if(e.target.files.length) {
                   setAiUploadStatus({ type: 'loading', message: 'Analyzing report...' });
                   const formData = new FormData();
                   formData.append('file', e.target.files[0]);
                   try {
                     const res = await API.request('/records/upload-ai', {
                       method: 'POST',
                       body: formData
                     });
                     if (res.success) {
                       setAiUploadStatus({ type: 'success', data: res });
                       fetchRecords();
                     } else {
                       setAiUploadStatus({ type: 'error', message: res.error || 'Failed to analyze' });
                     }
                   } catch (err) {
                     setAiUploadStatus({ type: 'error', message: err.message || 'Failed to upload and analyze report.' });
                   }
                }
              }} />
              {aiUploadStatus && aiUploadStatus.type === 'loading' && (
                <div style={{ marginTop: '20px', padding: '20px', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.1))', borderRadius: '16px', textAlign: 'center' }}>
                  <div className="spinner" style={{ margin: '0 auto 12px' }}></div>
                  <p style={{ fontWeight: '600', marginBottom: '4px' }}>🤖 AI is analyzing your report...</p>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Extracting health metrics</p>
                </div>
              )}
              {aiUploadStatus && aiUploadStatus.type === 'error' && (
                <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(231,76,60,0.1)', borderRadius: '12px', borderLeft: '3px solid var(--danger)', textAlign: 'left' }}>
                  <p style={{ fontWeight: '600', color: 'var(--danger)', margin: 0 }}>❌ {aiUploadStatus.message}</p>
                </div>
              )}
              {aiUploadStatus && aiUploadStatus.type === 'success' && (
                <div style={{ marginTop: '20px', padding: '20px', background: 'rgba(34,197,94,0.1)', borderRadius: '16px', textAlign: 'center' }}>
                  <p style={{ fontWeight: '700', color: 'var(--success)', marginBottom: '8px' }}>✅ {aiUploadStatus.data.message}</p>
                  {(aiUploadStatus.data.metrics_extracted || 0) > 0 ? (
                    <>
                      <div style={{ marginTop: '12px', maxHeight: '300px', overflowY: 'auto', textAlign: 'left' }}>
                        {Object.entries(aiUploadStatus.data.metrics || {}).map(([key, val], idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border-light)' }}>
                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{key}</span>
                            <span style={{ fontWeight: '700', color: 'var(--primary)' }}>{val}</span>
                          </div>
                        ))}
                      </div>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-primary)', marginTop: '16px', textAlign: 'center' }}>
                        {aiUploadStatus.data.health_entries_created || 0} health entries saved to your dashboard.
                      </p>
                    </>
                  ) : (
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>No metrics could be extracted. The report has been saved as a record.</p>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '20px', paddingBottom: '8px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => { setShowAIUpload(false); setAiUploadStatus(null); }}
                disabled={aiUploadStatus?.type === 'loading'}
                style={{ padding: '10px 24px', borderRadius: '24px', border: '1px solid #e2e8f0', background: '#ffffff', color: '#0f172a', fontWeight: '600', fontSize: '0.95rem', opacity: aiUploadStatus?.type === 'loading' ? 0.5 : 1, cursor: aiUploadStatus?.type === 'loading' ? 'not-allowed' : 'pointer' }}
              >Cancel</button>
              {(aiUploadStatus?.type === 'success' || aiUploadStatus?.type === 'error') && (
                <button
                  className="btn btn-primary"
                  onClick={() => { setShowAIUpload(false); setAiUploadStatus(null); }}
                  style={{ padding: '10px 32px', borderRadius: '24px', border: 'none', background: '#0ea5e9', color: '#ffffff', fontWeight: '600', fontSize: '0.95rem' }}
                >Done</button>
              )}
            </div>
          </div>
        </div>
      )}

      {showCompare && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setShowCompare(false) }}>
          <div className="modal" style={{ maxWidth: '700px', width: '100%' }}>
            <div className="modal-header">
              <h3>📊 AI Report Comparison</h3>
              <button className="modal-close" onClick={() => setShowCompare(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '24px' }}>
              {compareResult?.type === 'loading' && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 20px' }}>
                  <div className="spinner" style={{ margin: '0 auto 16px auto' }}></div>
                  <p style={{ fontWeight: 600 }}>Comparing recent blood tests...</p>
                  <p style={{ fontSize: '0.85rem' }}>Our AI is analyzing the changes.</p>
                </div>
              )}
              {compareResult?.type === 'error' && (
                <div style={{ textAlign: 'center', color: 'var(--danger)', padding: '40px 20px' }}>
                  <p style={{ fontWeight: 600 }}>❌ {compareResult.message}</p>
                </div>
              )}
              {compareResult?.type === 'success' && (
                <div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                    <div className="glass-card" style={{ textAlign: 'center', padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📅 {new Date(compareResult.data.record_1.date).toLocaleDateString()}</p>
                      <h4 style={{ margin: '8px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>{compareResult.data.record_1.title}</h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{compareResult.data.record_1.findings || 'No data'}</p>
                    </div>
                    <div className="glass-card" style={{ textAlign: 'center', padding: '16px', borderRadius: '12px', background: 'var(--bg-card)', border: '1px solid var(--border-light)' }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>📅 {new Date(compareResult.data.record_2.date).toLocaleDateString()}</p>
                      <h4 style={{ margin: '8px 0', fontSize: '1rem', color: 'var(--text-primary)' }}>{compareResult.data.record_2.title}</h4>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{compareResult.data.record_2.findings || 'No data'}</p>
                    </div>
                  </div>
                  <div style={{ padding: '16px', background: 'rgba(0,184,148,0.1)', borderRadius: '12px', borderLeft: '3px solid var(--success)' }}>
                    <p style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: '700', marginBottom: '8px' }}>🤖 AI COMPARISON</p>
                    <div className="ai-markdown-content" style={{ fontSize: '0.85rem', color: 'var(--text-primary)', lineHeight: 1.6 }}
                         dangerouslySetInnerHTML={{ __html: window.marked ? window.marked.parse(compareResult.data.comparison) : compareResult.data.comparison.replace(/\n/g, '<br>') }}>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowCompare(false)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {showSummary && (
        <div className="modal-overlay active" onClick={(e) => { if (e.target === e.currentTarget) setShowSummary(false) }}>
          <div className="modal" style={{ maxWidth: '700px', width: '100%' }}>
            <div className="modal-header">
              <h3>✨ AI Summary: {summaryResult?.recordTitle}</h3>
              <button className="modal-close" onClick={() => setShowSummary(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ padding: '24px', maxHeight: '70vh', overflowY: 'auto' }}>
              {summaryResult?.type === 'loading' && (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px 20px' }}>
                  <div className="spinner" style={{ margin: '0 auto 16px auto' }}></div>
                  <p style={{ fontWeight: 600 }}>Analyzing {summaryResult.recordTitle}...</p>
                  <p style={{ fontSize: '0.85rem' }}>Our medical AI is extracting key insights.</p>
                </div>
              )}
              {summaryResult?.type === 'error' && (
                <div style={{ textAlign: 'center', color: 'var(--danger)', padding: '40px 20px' }}>
                  <p style={{ fontWeight: 600 }}>❌ {summaryResult.message}</p>
                </div>
              )}
              {summaryResult?.type === 'success' && (
                <div className="ai-markdown-content" style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: 1.6 }}
                     dangerouslySetInnerHTML={{ __html: window.marked ? window.marked.parse(summaryResult.data.summary) : summaryResult.data.summary.replace(/\n/g, '<br>') }}>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSummary(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Records;
