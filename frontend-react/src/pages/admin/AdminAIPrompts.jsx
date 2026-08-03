import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { 
  Bot, Save, History, Play, CheckCircle2,
  Clock, AlertCircle, Terminal, Undo2
} from 'lucide-react';

export default function AdminAIPrompts() {
  const [prompts, setPrompts] = useState([]);
  const [activePrompt, setActivePrompt] = useState(null);
  const [content, setContent] = useState('');
  const [versions, setVersions] = useState([]);
  const [showVersions, setShowVersions] = useState(false);
  const [loading, setLoading] = useState(true);

  // Test state
  const [testMessage, setTestMessage] = useState('');
  const [testContext, setTestContext] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    fetchPrompts();
  }, []);

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const data = await api.getAdminPrompts();
      setPrompts(data || []);
      if(data && data.length > 0 && !activePrompt) {
        handleSelectPrompt(data[0]);
      }
    } catch(e) { console.error(e); }
    setLoading(false);
  };

  const handleSelectPrompt = (prompt) => {
    setActivePrompt(prompt);
    setContent(prompt.content);
    setTestResponse('');
    fetchVersions(prompt.id);
  };

  const fetchVersions = async (id) => {
    try {
      const data = await api.getAdminPromptVersions(id);
      setVersions(data || []);
    } catch(e) { console.error(e); }
  };

  const handleSave = async () => {
    if(!activePrompt) return;
    try {
      const updated = await api.updateAdminPrompt(activePrompt.id, content);
      setPrompts(prompts.map(p => p.id === updated.id ? updated : p));
      setActivePrompt(updated);
      fetchVersions(updated.id);
      alert('Prompt saved successfully!');
    } catch(e) { alert('Failed to save prompt'); }
  };

  const handleRollback = async (versionId) => {
    if(!window.confirm("Rollback to this previous version? Current edits will be saved to history.")) return;
    try {
      const rolledBack = await api.rollbackAdminPrompt(activePrompt.id, versionId);
      setPrompts(prompts.map(p => p.id === rolledBack.id ? rolledBack : p));
      setActivePrompt(rolledBack);
      setContent(rolledBack.content);
      fetchVersions(rolledBack.id);
      setShowVersions(false);
    } catch(e) { alert('Failed to rollback'); }
  };

  const handleTest = async () => {
    if(!activePrompt || !testMessage.trim()) return;
    setIsTesting(true);
    setTestResponse('');
    try {
      const res = await api.testAdminPrompt(activePrompt.module, testMessage, testContext);
      setTestResponse(res.response);
    } catch(e) {
      setTestResponse('Error: Failed to fetch response.');
    }
    setIsTesting(false);
  };

  if(loading) return <div className="p-8 text-center text-gray-500 dark:text-gray-400">Loading AI Prompts...</div>;

  return (
    <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-12rem)] min-h-[600px]">
      
      {/* Sidebar - Prompt List */}
      <div className="w-full md:w-64 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 flex flex-col gap-2 overflow-y-auto shrink-0">
        <h2 className="text-sm font-extrabold text-gray-400 uppercase tracking-wider mb-2 px-2">AI Modules</h2>
        {prompts.map(p => (
          <button
            key={p.id}
            onClick={() => handleSelectPrompt(p)}
            className={`flex items-center gap-3 p-3 rounded-2xl text-left transition-all ${
              activePrompt?.id === p.id
                ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm'
                : 'text-gray-600 hover:bg-gray-50 font-medium'
            }`}
          >
            <Bot className={`w-5 h-5 ${activePrompt?.id === p.id ? 'text-indigo-600' : 'text-gray-400'}`} />
            <span className="truncate">{p.name}</span>
          </button>
        ))}
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-gray-50/50 dark:bg-gray-700/30">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 dark:text-white">{activePrompt?.name}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
              Active (v{activePrompt?.version})
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowVersions(!showVersions)}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-xl text-sm font-bold hover:bg-gray-50 dark:bg-gray-900 transition-colors"
            >
              <History className="w-4 h-4" /> History
            </button>
            <button 
              onClick={handleSave}
              disabled={content === activePrompt?.content}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                content !== activePrompt?.content 
                  ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm' 
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" /> Save Prompt
            </button>
          </div>
        </div>

        <div className="flex-1 flex overflow-hidden">
          {/* Prompt Editor */}
          <div className={`flex flex-col border-r border-gray-100 transition-all ${showVersions ? 'w-1/2' : 'w-full lg:w-3/5'}`}>
            <div className="bg-gray-900 text-gray-100 flex-1 p-4 flex flex-col font-mono text-sm relative">
              <div className="absolute top-2 right-4 text-gray-500 dark:text-gray-400 flex items-center gap-2">
                <Terminal className="w-4 h-4" /> System Prompt
              </div>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                className="w-full h-full bg-transparent border-none outline-none resize-none pt-6 leading-relaxed"
                spellCheck="false"
              />
            </div>
          </div>

          {/* Right Panel (Testing or Versions) */}
          <div className={`flex flex-col bg-gray-50 overflow-hidden transition-all ${showVersions ? 'w-1/2' : 'hidden lg:flex lg:w-2/5'}`}>
            
            {showVersions ? (
              <div className="p-4 overflow-y-auto h-full">
                <h3 className="font-extrabold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-600" /> Version History
                </h3>
                <div className="space-y-3">
                  {versions.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 text-sm">No previous versions.</p>
                  ) : (
                    versions.map(v => (
                      <div key={v.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-600 shadow-sm">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-bold text-gray-900 dark:text-white">Version {v.version}</span>
                          <span className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {new Date(v.created_at).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 bg-gray-50 dark:bg-gray-900 p-2 rounded-lg line-clamp-3 font-mono">
                          {v.content}
                        </div>
                        <button 
                          onClick={() => handleRollback(v.id)}
                          className="mt-3 w-full py-1.5 flex items-center justify-center gap-2 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                        >
                          <Undo2 className="w-3.5 h-3.5" /> Rollback to v{v.version}
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="p-4 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 shadow-sm z-10 shrink-0">
                  <h3 className="font-extrabold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                    <Play className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Test Sandbox
                  </h3>
                  <textarea 
                    placeholder="User's Health Context (Optional)"
                    value={testContext} onChange={e => setTestContext(e.target.value)}
                    className="w-full text-xs p-2 rounded-lg border border-gray-200 dark:border-gray-600 mb-2 bg-gray-50 dark:bg-gray-900 focus:bg-white dark:bg-gray-800 outline-none focus:ring-1 focus:ring-indigo-500 h-16 resize-none"
                  />
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="Simulate user message..."
                      value={testMessage} onChange={e => setTestMessage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleTest()}
                      className="flex-1 text-sm p-2 rounded-lg border border-gray-200 dark:border-gray-600 outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button 
                      onClick={handleTest} disabled={isTesting || !testMessage}
                      className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-bold disabled:opacity-50 flex items-center gap-2 shrink-0"
                    >
                      {isTesting ? 'Thinking...' : 'Send'}
                    </button>
                  </div>
                </div>
                <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-gray-900 font-sans text-sm">
                  {testResponse ? (
                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-600 shadow-sm whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100 dark:border-gray-700 font-bold text-gray-900 dark:text-white">
                        <Bot className="w-4 h-4 text-indigo-600" /> AI Response
                      </div>
                      {testResponse}
                    </div>
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
                      <Bot className="w-12 h-12 mb-2" />
                      <p>Run a test to preview the prompt.</p>
                      <p className="text-xs text-center px-8 mt-2">Note: This runs against the currently saved DB version, not unsaved edits.</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </div>
  );
}
