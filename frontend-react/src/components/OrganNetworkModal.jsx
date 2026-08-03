import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Search, Globe, Filter, AlertCircle, RefreshCcw } from 'lucide-react';
import API from '../utils/api';

const OrganNetworkModal = ({ isOpen, onClose, userBloodType }) => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [matchStatus, setMatchStatus] = useState('idle'); // idle, loading, success

  useEffect(() => {
    if (isOpen) {
      fetchNetworkData();
      setSelectedDonor(null);
      setMatchStatus('idle');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleInitiateMatch = async () => {
    setMatchStatus('loading');
    try {
      await API.post('/emergency/organ-network/match', {
        donor_id: selectedDonor.user_id,
        organ: selectedDonor.organ
      });
      setMatchStatus('success');
    } catch (e) {
      console.error(e);
      alert('Failed to initiate match request');
      setMatchStatus('idle');
    }
  };

  const fetchNetworkData = async (searchQuery = '') => {
    try {
      setLoading(true);
      const res = await API.get(`/emergency/organ-network/search?query=${searchQuery}`);
      setResults(res.results || []);
    } catch (e) {
      console.error(e);
      alert('Failed to load organ network data');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchNetworkData(query);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 md:p-8 w-full max-w-4xl shadow-2xl border border-gray-100 dark:border-gray-700 flex flex-col h-[85vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
              <Globe size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Global Organ Exchange</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Simulated Match Network</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="relative mb-6 shrink-0">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={20} />
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-shadow" 
            placeholder="Search by organ, blood type, or location..."
          />
          <button type="submit" className="absolute inset-y-2 right-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-colors">
            Search
          </button>
        </form>

        {/* Filters / Stats */}
        <div className="flex justify-between items-center mb-4 shrink-0">
          <div className="flex gap-2">
            <span className="px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 flex items-center gap-1">
              <Filter size={14} /> All Types
            </span>
            <span className="px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-xs font-bold text-indigo-700 dark:text-indigo-300">
              Your Blood: {userBloodType || 'Unknown'}
            </span>
          </div>
          <button onClick={() => fetchNetworkData(query)} className="text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
            <RefreshCcw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              Loading network data...
            </div>
          ) : results.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
              <AlertCircle size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
              <p>No organ matches found.</p>
            </div>
          ) : selectedDonor ? (
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 h-full overflow-y-auto">
              <button 
                onClick={() => { setSelectedDonor(null); setMatchStatus('idle'); }}
                className="mb-4 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                &larr; Back to Network List
              </button>
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {selectedDonor.organ} 
                  </h3>
                  <span className="px-2 py-0.5 rounded text-sm font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                    Blood: {selectedDonor.blood_type}
                  </span>
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${selectedDonor.type === 'Needed' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                    {selectedDonor.type}
                  </span>
                </div>
                
                <div className="text-right">
                  <span className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Match Score</span>
                  <div className="text-3xl font-black text-gray-900 dark:text-white">
                    {selectedDonor.match_score}%
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100 dark:border-gray-700">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Donor Details</h4>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedDonor.donor_name || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedDonor.donor_email || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Age</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedDonor.donor_age || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Location</p>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedDonor.location || 'N/A'}</p>
                    </div>
                  </div>
                </div>
                
                <div className={`p-4 rounded-xl border ${matchStatus === 'success' ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/30' : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'}`}>
                  <h4 className={`font-bold mb-2 flex items-center gap-2 ${matchStatus === 'success' ? 'text-green-800 dark:text-green-300' : 'text-blue-800 dark:text-blue-300'}`}>
                    <AlertCircle className="w-4 h-4" /> Next Steps
                  </h4>
                  <p className={`text-sm ${matchStatus === 'success' ? 'text-green-700 dark:text-green-400' : 'text-blue-700 dark:text-blue-400'}`}>
                    {matchStatus === 'success' 
                      ? 'Match process initiated successfully. A notification has been securely sent to the healthcare providers.' 
                      : 'If this match looks suitable, you can initiate contact or forward this profile directly to your primary healthcare provider for review.'}
                  </p>
                  
                  {matchStatus !== 'success' && (
                    <div className="mt-4 flex gap-3">
                       <button 
                         onClick={handleInitiateMatch}
                         disabled={matchStatus === 'loading'}
                         className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold transition-colors flex justify-center items-center gap-2"
                       >
                          {matchStatus === 'loading' ? (
                            <><RefreshCcw className="w-4 h-4 animate-spin" /> Processing...</>
                          ) : (
                            'Initiate Match Process'
                          )}
                       </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.map(item => (
                <div key={item.id} className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className={`absolute top-0 right-0 w-16 h-16 transform translate-x-8 -translate-y-8 rotate-45 ${item.type === 'Needed' ? 'bg-red-500' : 'bg-green-500'}`}></div>
                  <span className={`absolute top-2 right-2 text-[10px] font-bold text-white z-10 ${item.type === 'Needed' ? 'text-red-100' : 'text-green-100'}`}>
                    {item.type}
                  </span>

                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        {item.organ} 
                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
                          {item.blood_type}
                        </span>
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                        {item.location}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-end mt-4">
                    <div>
                      <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Match Score</span>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${item.match_score > 90 ? 'bg-green-500' : item.match_score > 80 ? 'bg-blue-500' : 'bg-orange-500'}`} style={{ width: `${item.match_score}%` }}></div>
                        </div>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">{item.match_score}%</span>
                      </div>
                    </div>
                    <button onClick={() => setSelectedDonor(item)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-xs font-bold transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
      </div>
    </div>
  , document.body);
};

export default OrganNetworkModal;
