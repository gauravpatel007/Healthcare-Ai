import React, { useState } from 'react';
import { CalendarDays, History, UtensilsCrossed, Camera } from 'lucide-react';
import AdminMealPlans from './AdminMealPlans';
import AdminMeals from './AdminMeals';
import AdminScannedMeals from './AdminScannedMeals';

export default function AdminDiet() {
  const [activeTab, setActiveTab] = useState('meals');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">

      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Diet Management</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Manage recipes, meal plans, nutrition, and shopping lists.</p>
        </div>
      </div>

      <div className="flex space-x-2 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 w-fit">
        <button
          onClick={() => setActiveTab('meals')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'meals'
              ? 'bg-teal-50 dark:!bg-white text-teal-700 dark:!text-teal-700 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <UtensilsCrossed className={`w-4 h-4 ${activeTab === 'meals' ? 'text-teal-600 dark:!text-teal-600' : ''}`} />
          All Meals
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'history'
              ? 'bg-blue-50 dark:!bg-white text-blue-700 dark:!text-blue-700 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <History className={`w-4 h-4 ${activeTab === 'history' ? 'text-blue-600 dark:!text-blue-600' : ''}`} />
          Generation History
        </button>
        <button
          onClick={() => setActiveTab('scanned')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'scanned'
              ? 'bg-purple-50 dark:!bg-white text-purple-700 dark:!text-purple-700 shadow-sm'
              : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
          }`}
        >
          <Camera className={`w-4 h-4 ${activeTab === 'scanned' ? 'text-purple-600 dark:!text-purple-600' : ''}`} />
          Scanned Meals
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'meals' && <AdminMeals />}
        {activeTab === 'history' && <AdminMealPlans activeTab="history" />}
        {activeTab === 'scanned' && <AdminScannedMeals />}
      </div>

    </div>
  );
}
