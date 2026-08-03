import React, { useState } from 'react';
import { Dumbbell, CalendarRange } from 'lucide-react';
import AdminExerciseLibrary from './AdminExerciseLibrary';
import AdminWorkoutPlans from './AdminWorkoutPlans';

export default function AdminFitness() {
  const [activeTab, setActiveTab] = useState('exercises');

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Fitness Management</h1>
          <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">Manage the exercise library and workout plans.</p>
        </div>
      </div>

      <div className="flex space-x-2 bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 w-fit">
        <button
          onClick={() => setActiveTab('exercises')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'exercises' 
              ? 'bg-rose-50 text-rose-700 shadow-sm' 
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <Dumbbell className={`w-4 h-4 ${activeTab === 'exercises' ? 'text-rose-600' : ''}`} />
          Exercise Library
        </button>
        <button
          onClick={() => setActiveTab('plans')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all ${
            activeTab === 'plans' 
              ? 'bg-blue-50 text-blue-700 shadow-sm' 
              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
          }`}
        >
          <CalendarRange className={`w-4 h-4 ${activeTab === 'plans' ? 'text-blue-600' : ''}`} />
          Workout Plans
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'exercises' && <AdminExerciseLibrary />}
        {activeTab === 'plans' && <AdminWorkoutPlans />}
      </div>

    </div>
  );
}
