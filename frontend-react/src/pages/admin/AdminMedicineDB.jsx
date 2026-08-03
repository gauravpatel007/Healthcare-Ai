import React, { useState, useEffect, useMemo } from 'react';
import api from '../../utils/api';
import { 
  Plus, Search, Edit2, Trash2, Pill, User, Clock, CheckCircle
} from 'lucide-react';

export default function AdminMedicineDB() {
  const [medicines, setMedicines] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    type: 'tablet',
    frequency: 'once_daily',
    purpose: '',
    total_pills: 30,
    remaining: 30,
    user_id: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [medsData, usersData] = await Promise.all([
        api.getAdminMedicines(),
        api.getAdminUsers()
      ]);
      setMedicines(medsData || []);
      setUsers(usersData || []);
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  const handleOpenModal = (med = null) => {
    if (med) {
      setEditingId(med.id);
      setFormData({
        name: med.name || '',
        dosage: med.dosage || '',
        type: med.type || 'tablet',
        frequency: med.frequency || 'once_daily',
        purpose: med.purpose || '',
        total_pills: med.total_pills || 30,
        remaining: med.remaining || 30,
        user_id: med.user_id || ''
      });
    } else {
      setEditingId(null);
      setFormData({
        name: '',
        dosage: '',
        type: 'tablet',
        frequency: 'once_daily',
        purpose: '',
        total_pills: 30,
        remaining: 30,
        user_id: users.length > 0 ? users[0].id : ''
      });
    }
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.updateAdminMedicine(editingId, formData);
      } else {
        await api.createAdminMedicine(formData);
      }
      setShowModal(false);
      fetchData();
    } catch(e) {
      console.error(e);
      alert("Failed to save medicine.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medicine? It will be removed from the DB and user side immediately.")) return;
    try {
      await api.deleteAdminMedicine(id);
      fetchData();
    } catch(e) {
      console.error(e);
      alert("Failed to delete medicine.");
    }
  };

  const filteredMedicines = useMemo(() => {
    return medicines.filter(m => {
      if (!search) return true;
      const q = search.toLowerCase();
      return (m.name || '').toLowerCase().includes(q) ||
             (m.purpose || '').toLowerCase().includes(q) ||
             (m.user_name || '').toLowerCase().includes(q) ||
             (m.user_email || '').toLowerCase().includes(q) ||
             (m.dosage || '').toLowerCase().includes(q);
    });
  }, [medicines, search]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Medicine Database</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Manage all user medications directly in the database.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search medicines, users, dosage..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border-none rounded-xl focus:ring-2 focus:ring-teal-500/20 text-sm font-medium outline-none dark:text-white"
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors w-full md:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Add Medicine
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400 font-bold">
              <th className="p-4 pl-6">Medicine & User</th>
              <th className="p-4">Details</th>
              <th className="p-4">Stock & Frequency</th>
              <th className="p-4 text-right pr-6">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {loading ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-400 font-medium">Loading medicines...</td></tr>
            ) : filteredMedicines.length === 0 ? (
              <tr><td colSpan="4" className="p-8 text-center text-gray-400 font-medium">No medicines found.</td></tr>
            ) : (
              filteredMedicines.map(med => (
                <tr key={med.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-700/50 transition-colors">
                  <td className="p-4 pl-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 flex items-center justify-center shrink-0">
                        <Pill className="w-5 h-5 text-teal-600 dark:text-teal-400" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white text-base">{med.name}</div>
                        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>{med.user_email || 'Unknown User'}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="text-xs font-bold text-gray-800 dark:text-gray-300">
                      {med.dosage ? `${med.dosage} • ${med.type}` : med.type}
                    </div>
                    {med.purpose && (
                      <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 max-w-xs mt-0.5">
                        {med.purpose}
                      </div>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md w-fit">
                        <CheckCircle className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                        {med.remaining} / {med.total_pills} Pills Left
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {(med.frequency || 'once_daily').replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 pr-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleOpenModal(med)} className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title="Edit Medicine">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(med.id)} className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" title="Delete Medicine">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 md:p-8">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-6">
                {editingId ? 'Edit Medicine' : 'Add Medicine'}
              </h2>

              <form onSubmit={handleSave} className="space-y-6">
                
                {!editingId && users.length > 0 && (
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Assign to User</label>
                    <select
                      value={formData.user_id}
                      onChange={e => setFormData({...formData, user_id: e.target.value})}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                    >
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name || u.email} ({u.email})</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Medicine Name *</label>
                    <input 
                      type="text" required
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                      placeholder="e.g. AWS, Paracetamol"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Dosage</label>
                    <input 
                      type="text"
                      value={formData.dosage} onChange={e => setFormData({...formData, dosage: e.target.value})}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                      placeholder="e.g. 100, 500mg"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Type</label>
                    <select
                      value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                    >
                      <option value="tablet">Tablet 💊</option>
                      <option value="capsule">Capsule 🔵</option>
                      <option value="syrup">Syrup 🧴</option>
                      <option value="injection">Injection 💉</option>
                      <option value="drops">Drops 💧</option>
                      <option value="cream">Cream 🧴</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Frequency</label>
                    <select
                      value={formData.frequency} onChange={e => setFormData({...formData, frequency: e.target.value})}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                    >
                      <option value="once_daily">Once Daily</option>
                      <option value="twice_daily">Twice Daily</option>
                      <option value="thrice_daily">Thrice Daily</option>
                      <option value="once_weekly">Once Weekly</option>
                      <option value="as_needed">As Needed</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Total Pills</label>
                    <input 
                      type="number" min="1"
                      value={formData.total_pills} onChange={e => setFormData({...formData, total_pills: e.target.value})}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Remaining Pills</label>
                    <input 
                      type="number" min="0"
                      value={formData.remaining} onChange={e => setFormData({...formData, remaining: e.target.value})}
                      className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Purpose / Instructions</label>
                  <textarea 
                    rows="2"
                    value={formData.purpose} onChange={e => setFormData({...formData, purpose: e.target.value})}
                    className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-3 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none resize-none"
                    placeholder="e.g. qqqqqq"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    type="button" onClick={() => setShowModal(false)}
                    className="flex-1 py-3.5 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-3.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl transition-colors shadow-sm"
                  >
                    Save Medicine
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
