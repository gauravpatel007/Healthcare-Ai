import React, { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';
import { 
  FileText, Activity, AlertCircle, FilePlus, Download, 
  Trash2, RefreshCw, Eye, Search, Filter, CheckCircle2,
  XCircle, FileEdit, Clock, ChevronDown
} from 'lucide-react';

const CATEGORIES = [
  'All', 'Blood Test', 'Imaging', 'Prescription', 'Surgery', 'Vaccination', 'Other'
];

export default function AdminMedicalRecords() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showDeleted, setShowDeleted] = useState(false);

  // Replace file state
  const [replacingId, setReplacingId] = useState(null);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminMedicalRecords();
      setRecords(data || []);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      const res = await api.updateMedicalRecordStatus(id, status);
      if(res.success) {
        setRecords(records.map(r => r.id === id ? { ...r, status } : r));
      }
    } catch(e) { console.error(e); }
  };

  const handleSoftDelete = async (id) => {
    if(!window.confirm("Are you sure you want to delete this medical record?")) return;
    try {
      const res = await api.softDeleteMedicalRecord(id);
      if(res.success) {
        setRecords(records.map(r => r.id === id ? { ...r, is_deleted: true } : r));
      }
    } catch(e) { console.error(e); }
  };

  const handleRestore = async (id) => {
    try {
      const res = await api.restoreMedicalRecord(id);
      if(res.success) {
        setRecords(records.map(r => r.id === id ? { ...r, is_deleted: false } : r));
      }
    } catch(e) { console.error(e); }
  };

  const handleHardDelete = async (id) => {
    if(!window.confirm("Are you sure you want to PERMANENTLY delete this record?")) return;
    try {
      const res = await api.hardDeleteMedicalRecord(id);
      if(res.success) {
        setRecords(records.filter(r => r.id !== id));
      }
    } catch(e) { console.error(e); }
  };

  const handleFileChange = async (e, id) => {
    const file = e.target.files[0];
    if(!file) {
      setReplacingId(null);
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const res = await api.replaceMedicalRecordFile(id, formData);
      if(res.success) {
        setRecords(records.map(r => r.id === id ? { ...r, file_path: res.file_path } : r));
        alert("File replaced successfully!");
      }
    } catch(err) {
      alert("Failed to upload file");
    }
    setReplacingId(null);
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (!showDeleted && r.is_deleted) return false;
      if (showDeleted && !r.is_deleted) return false;
      if (filterCategory !== 'All' && r.category !== filterCategory) return false;
      if (search) {
        const q = search.toLowerCase();
        return (r.title || '').toLowerCase().includes(q) || 
               (r.user_name || '').toLowerCase().includes(q) || 
               (r.user_email || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [records, search, filterCategory, showDeleted]);

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-row flex-wrap md:flex-nowrap items-center justify-between gap-4 relative overflow-hidden w-full">
        <div className="flex items-center gap-4 lg:gap-6 relative z-10 w-auto">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
            <FileText className="w-8 h-8" />
          </div>
          <div className="text-left">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1 text-left">
              Medical Records
            </h1>
            <p className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2 text-left">
              Manage and moderate user medical documents
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center justify-end gap-3 relative z-10 shrink-0 ml-auto pr-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" placeholder="Search records, users..." 
              value={search} onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 w-64"
            />
          </div>
          <div className="relative">
            <select 
              value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="pl-4 pr-10 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer text-gray-700 dark:text-gray-300 hover:border-gray-300 transition-colors"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
          <button 
            onClick={() => setShowDeleted(!showDeleted)}
            className={`px-4 py-2 rounded-xl text-sm font-bold border transition-colors ${showDeleted ? 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
          >
            {showDeleted ? 'Show Active' : 'Show Deleted'}
          </button>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">
                <th className="p-4 pl-6">Record Info</th>
                <th className="p-4">User</th>
                <th className="p-4">Category</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right pr-6">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-gray-400 font-medium">Loading records...</td></tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-500 dark:text-gray-400 font-medium">No medical records found</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map(record => (
                  <tr key={record.id} className={`hover:bg-gray-50/50 transition-colors ${record.is_deleted ? 'opacity-60' : ''}`}>
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-extrabold text-gray-900 dark:text-white line-clamp-1">{record.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5 flex items-center gap-2">
                            <span>{new Date(record.created_at).toLocaleDateString()}</span>
                            {record.doctor && <><span className="w-1 h-1 rounded-full bg-gray-300"></span><span>Dr. {record.doctor}</span></>}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-gray-900 dark:text-white">{record.user_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{record.user_email}</div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                        {record.category}
                      </span>
                    </td>
                    <td className="p-4">
                      {record.is_deleted ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700">
                          <Trash2 className="w-3.5 h-3.5" /> Deleted
                        </span>
                      ) : record.status === 'approved' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Approved
                        </span>
                      ) : record.status === 'rejected' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-700">
                          <XCircle className="w-3.5 h-3.5" /> Rejected
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-700">
                          <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {record.file_path && (
                          <a 
                            href={`http://localhost:8000/uploads/${record.file_path.replace(/^\/+/, '')}`} 
                            target="_blank" rel="noreferrer"
                            download
                            className="p-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors"
                            title="Download File"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        )}

                        {!record.is_deleted && (
                          <>
                            <button
                              onClick={() => document.getElementById(`file-${record.id}`).click()}
                              className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 transition-colors"
                              title="Replace File"
                            >
                              <FileEdit className="w-4 h-4" />
                            </button>
                            <input 
                              type="file" 
                              id={`file-${record.id}`} 
                              className="hidden" 
                              onChange={(e) => handleFileChange(e, record.id)}
                            />

                            {record.status !== 'approved' && (
                              <button onClick={() => handleStatusUpdate(record.id, 'approved')} className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg hover:bg-emerald-100 transition-colors" title="Approve">
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                            )}
                            {record.status !== 'rejected' && (
                              <button onClick={() => handleStatusUpdate(record.id, 'rejected')} className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-lg hover:bg-rose-100 transition-colors" title="Reject">
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button onClick={() => handleSoftDelete(record.id)} className="p-2 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 transition-colors" title="Delete">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {record.is_deleted && (
                          <>
                            <button onClick={() => handleRestore(record.id)} className="p-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors font-bold text-xs" title="Restore">
                              Restore
                            </button>
                            <button onClick={() => handleHardDelete(record.id)} className="p-2 bg-red-100 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 transition-colors font-bold text-xs" title="Hard Delete">
                              Perm. Delete
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
