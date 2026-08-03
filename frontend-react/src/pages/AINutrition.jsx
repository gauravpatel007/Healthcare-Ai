import React, { useState, useEffect } from 'react';
import API from '../utils/api';
import {
  Utensils,
  Camera,
  RefreshCcw,
  Flame,
  Droplets,
  Dumbbell,
  Scale,
  PieChart,
  Lightbulb,
  CheckCircle2,
  Clock,
  ChevronRight,
  Activity,
  X
} from 'lucide-react';

const StatCard = ({ title, value, subtitle, icon: Icon, colorClass }) => (
  <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1.5 relative overflow-hidden group cursor-pointer">
    <div className={`absolute top-0 right-0 w-32 h-32 ${colorClass} opacity-10 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110`}></div>
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mb-1 tracking-wide uppercase">{title}</p>
        <h3 className="text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">{value}</h3>
      </div>
      <div className={`p-4 ${colorClass} bg-opacity-10 dark:bg-opacity-20 rounded-2xl shadow-sm transition-transform duration-300 ease-out group-hover:scale-125`}>
        <Icon className="w-7 h-7" style={{ color: 'currentColor' }} />
      </div>
    </div>
    <div className="mt-5 flex items-center text-sm">
      <span className="font-semibold text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-700/50 px-3 py-1 rounded-full">
        {subtitle}
      </span>
    </div>
  </div>
);

const AINutrition = ({ voiceAction, onVoiceActionConsumed }) => {
  const [loading, setLoading] = useState(true);
  const [nutritionPlan, setNutritionPlan] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const res = await API.get('/ai/nutrition/plan');
        setNutritionPlan(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchPlan();
  }, []);

  const regeneratePlan = async () => {
    try {
      const res = await API.post('/ai/nutrition/regenerate');
      setNutritionPlan(res);
      // Optional: Add a toast notification here instead of alert if a toast system exists
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (voiceAction && voiceAction.target_feature === 'ai-nutrition') {
      if (voiceAction.action_name === 'regenerate_plan') {
        regeneratePlan();
      }
      if (onVoiceActionConsumed) onVoiceActionConsumed();
    }
  }, [voiceAction]);

  const handleScanMeal = async (e) => {
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
              scan_type: 'food'
            });
            if (res && res.data) {
              setNutritionPlan(prev => ({
                ...prev,
                tdee: prev.tdee + res.data.calories,
                protein_goal_grams: prev.protein_goal_grams + res.data.protein,
                meals: [
                  ...prev.meals,
                  {
                    meal_type: "scanned snack",
                    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    name: res.data.name,
                    calories: res.data.calories,
                    protein: res.data.protein,
                    icon: "📸"
                  }
                ]
              }));

              setScanResult({
                type: 'success',
                title: 'Meal Analyzed Successfully! 🍽️',
                data: res.data
              });
            } else {
              setScanResult({
                type: 'error',
                title: 'Scan Failed',
                message: "Could not analyze the meal. Please try again."
              });
            }
          } catch (error) {
            console.error(error);
            setScanResult({
              type: 'error',
              title: 'Scan Failed',
              message: error.response?.data?.detail || error.message || "Could not analyze the meal. Please try again."
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

  if (loading || !nutritionPlan) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="flex flex-col items-center gap-4">
          <RefreshCcw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Loading Nutrition Plan...</p>
        </div>
      </div>
    );
  }

  const mealCards = nutritionPlan.meals || [];
  const recommendations = nutritionPlan.recommendations || [];

  const formatMealTime = (meal) => {
    if (meal.recorded_at) {
      const d = new Date(meal.recorded_at);
      if (!isNaN(d.getTime())) {
        return d.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
      }
    }
    return meal.time;
  };

  // Helper to calculate percentages for the progress bars
  const carbsGrams = nutritionPlan.macro_breakdown?.carbs?.grams || 0;
  const proteinGrams = nutritionPlan.macro_breakdown?.protein?.grams || 0;
  const fatsGrams = nutritionPlan.macro_breakdown?.fats?.grams || 0;
  const totalGrams = carbsGrams + proteinGrams + fatsGrams || 1; // Avoid div by zero

  const carbsPct = Math.round((carbsGrams / totalGrams) * 100);
  const proteinPct = Math.round((proteinGrams / totalGrams) * 100);
  const fatsPct = Math.round((fatsGrams / totalGrams) * 100);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20">

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
                  <p className="text-indigo-600 dark:text-indigo-400 font-extrabold text-2xl">{scanResult.data.calories} <span className="text-sm text-gray-500 font-medium">kcal</span></p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">Protein</div>
                    <div className="font-extrabold text-gray-900 dark:text-white">{scanResult.data.protein}g</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">Carbs</div>
                    <div className="font-extrabold text-gray-900 dark:text-white">{scanResult.data.carbs}g</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl text-center">
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-bold mb-1">Fats</div>
                    <div className="font-extrabold text-gray-900 dark:text-white">{scanResult.data.fats}g</div>
                  </div>
                </div>
              </div>
            )}

            <div className="p-6 pt-2">
              <button
                onClick={() => setScanResult(null)}
                className="w-full py-3.5 bg-gray-900 hover:bg-gray-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 text-white rounded-xl font-bold transition-colors"
              >
                Awesome, thanks!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Screen Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setSelectedImage(null)}>
          <button 
            onClick={() => setSelectedImage(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
          >
            <X className="w-8 h-8" />
          </button>
          <img 
            src={selectedImage} 
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300"
            alt="Enlarged meal"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center w-full gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
              <Utensils className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight mb-1">
                AI Nutrition Planner
              </h1>
              <p className="text-xs sm:text-sm lg:text-base text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)] animate-pulse shrink-0"></span>
                Personalized meal plans based on your profile
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0">
            <label htmlFor="meal-scan-upload" className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 shadow-md hover:bg-gray-800 dark:hover:bg-white hover:shadow-lg cursor-pointer ${isScanning ? 'opacity-80 cursor-wait' : ''}`}>
              <input id="meal-scan-upload" type="file" accept="image/*" capture="environment" className="hidden" onChange={handleScanMeal} disabled={isScanning} />
              {isScanning ? (
                <RefreshCcw className="w-5 h-5 animate-spin shrink-0" />
              ) : (
                <Camera className="w-5 h-5 shrink-0" />
              )}
              <span className="whitespace-nowrap">
                {isScanning ? 'Scanning...' : 'Scan Meal'}
              </span>
            </label>

            <button
              onClick={regeneratePlan}
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 font-bold text-sm transition-all border border-indigo-100 dark:border-indigo-800"
            >
              <RefreshCcw className="w-5 h-5 shrink-0" />
              <span className="hidden sm:inline">Regenerate</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Daily Calories"
          value={nutritionPlan.tdee}
          subtitle="TDEE"
          icon={Flame}
          colorClass="bg-rose-500 text-rose-500"
        />

        <StatCard
          title="Water Goal"
          value={`${nutritionPlan.water_goal_liters}L`}
          subtitle="Daily Goal"
          icon={Droplets}
          colorClass="bg-sky-500 text-sky-500"
        />

        <StatCard
          title="Protein Goal"
          value={`${nutritionPlan.protein_goal_grams}g`}
          subtitle="Daily Goal"
          icon={Dumbbell}
          colorClass="bg-emerald-500 text-emerald-500"
        />

        <StatCard
          title="Current BMI"
          value={nutritionPlan.bmi || '--'}
          subtitle={nutritionPlan.bmi_category || 'Unknown'}
          icon={Scale}
          colorClass="bg-purple-500 text-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Column: Today's Meal Plan */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <Utensils className="w-6 h-6 text-indigo-500 shrink-0" />
              Today's Meal Plan
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {mealCards.map((m, i) => (
                <div key={i} className="flex flex-col p-5 rounded-[2rem] bg-gray-50 hover:bg-gray-100 dark:bg-gray-900/50 dark:hover:bg-gray-800 transition-all border border-transparent hover:border-gray-200 dark:hover:border-gray-700 group cursor-pointer hover:-translate-y-1 hover:shadow-md">
                  <div className="flex items-center justify-between mb-4">
                    <div 
                      className={`w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-2xl flex items-center justify-center shadow-inner shrink-0 overflow-hidden ${m.image_url ? 'cursor-pointer' : ''}`}
                      onClick={() => m.image_url && setSelectedImage(`http://127.0.0.1:8000${m.image_url}`)}
                    >
                      {m.image_url ? (
                        <img src={`http://127.0.0.1:8000${m.image_url}`} alt={m.name} className="w-full h-full object-cover" />
                      ) : (
                        m.icon
                      )}
                    </div>
                    <span className="px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {formatMealTime(m)}
                    </span>
                  </div>
                  <div className="mb-4">
                    <div className="text-xs font-bold text-indigo-500 uppercase tracking-wider mb-1">{m.meal_type}</div>
                    <h4 className="font-bold text-gray-900 dark:text-white text-lg leading-tight">{m.name}</h4>
                  </div>
                  <div className="mt-auto grid grid-cols-2 gap-2">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 flex flex-col items-center justify-center border border-gray-100 dark:border-gray-700 shadow-sm">
                      <span className="text-sm font-extrabold text-rose-500">{m.calories}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Cal</span>
                    </div>
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 flex flex-col items-center justify-center border border-gray-100 dark:border-gray-700 shadow-sm">
                      <span className="text-sm font-extrabold text-emerald-500">{m.protein}g</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Protein</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Macros & Recommendations */}
        <div className="lg:col-span-1 flex flex-col gap-6 h-full">

          {/* Macro Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <PieChart className="w-5 h-5 text-purple-500 shrink-0" />
              Macro Breakdown
            </h3>

            <div className="space-y-5">
              {/* Carbs */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Carbs</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-extrabold text-purple-500">{carbsGrams}g</span>
                    <span className="text-xs font-semibold text-gray-400">({carbsPct}%)</span>
                  </div>
                </div>
                <div className="w-full bg-purple-50 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${carbsPct}%` }}></div>
                </div>
              </div>

              {/* Protein */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Protein</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-extrabold text-emerald-500">{proteinGrams}g</span>
                    <span className="text-xs font-semibold text-gray-400">({proteinPct}%)</span>
                  </div>
                </div>
                <div className="w-full bg-emerald-50 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${proteinPct}%` }}></div>
                </div>
              </div>

              {/* Fats */}
              <div>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Fats</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-lg font-extrabold text-rose-500">{fatsGrams}g</span>
                    <span className="text-xs font-semibold text-gray-400">({fatsPct}%)</span>
                  </div>
                </div>
                <div className="w-full bg-rose-50 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                  <div className="bg-rose-500 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${fatsPct}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-6 lg:p-8 shadow-sm border border-gray-100 dark:border-gray-700 flex-1">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-6">
              <Lightbulb className="w-5 h-5 text-amber-500 shrink-0" />
              Recommendations
            </h3>

            <div className="space-y-4">
              {recommendations.map((t, i) => (
                <div key={i} className="flex items-start gap-3 bg-amber-50/50 dark:bg-gray-900/50 p-4 rounded-2xl border border-amber-100/50 dark:border-gray-800 transition-colors hover:bg-amber-50 dark:hover:bg-gray-800">
                  <div className="mt-0.5 w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center shrink-0 shadow-sm">
                    <span className="text-xs">{t.icon}</span>
                  </div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-relaxed">
                    {t.text}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AINutrition;
