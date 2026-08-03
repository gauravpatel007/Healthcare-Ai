import React, { useState } from 'react';
import { MessageSquare, Terminal } from 'lucide-react';
import AdminAIPrompts from './AdminAIPrompts';
import AdminAIChats from './AdminAIChats';

export default function AdminAI() {
  const [activeTab, setActiveTab] = useState('chats');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">AI Management</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Configure system prompts, versioning, and monitor AI interactions.</p>
        </div>
      </div>

      <div className="flex space-x-2 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 w-fit">
        <button
          onClick={() => setActiveTab('chats')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'chats' 
              ? 'bg-emerald-50 text-emerald-700 shadow-sm' 
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <MessageSquare className={`w-4 h-4 ${activeTab === 'chats' ? 'text-emerald-600' : ''}`} />
          Chat Logs & Analytics
        </button>
        <button
          onClick={() => setActiveTab('prompts')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'prompts' 
              ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Terminal className={`w-4 h-4 ${activeTab === 'prompts' ? 'text-indigo-600' : ''}`} />
          Prompt Studio
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'prompts' && <AdminAIPrompts />}
        {activeTab === 'chats' && <AdminAIChats />}
      </div>

    </div>
  );
}
