import React, { useState, useEffect, useRef } from 'react';
import API from '../utils/api';

const AINutrition = ({ voiceAction, onVoiceActionConsumed }) => {
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
  const [loading, setLoading] = useState(true);
  const [offset, setOffset] = useState(0);
  const [nutritionPlan, setNutritionPlan] = useState(null);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

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

  useEffect(() => {
    if (!loading && window.Chart && chartRef.current && nutritionPlan) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const carbsGrams = nutritionPlan.macro_breakdown?.carbs?.grams || 0;
      const proteinGrams = nutritionPlan.macro_breakdown?.protein?.grams || 0;
      const fatsGrams = nutritionPlan.macro_breakdown?.fats?.grams || 0;

      const carbsCal = carbsGrams * 4;
      const proteinCal = proteinGrams * 4;
      const fatCal = fatsGrams * 9;

      chartInstance.current = new window.Chart(chartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Carbs', 'Protein', 'Fats'],
          datasets: [{
            data: [carbsCal, proteinCal, fatCal],
            backgroundColor: ['#6C5CE7', '#00D2D3', '#FF6B6B'],
            borderWidth: 0,
            borderRadius: 5
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'bottom',
              labels: { color: '#a0a0b8', font: { family: 'Inter', size: 12 }, padding: 20 }
            }
          },
          cutout: '65%'
        }
      });
    }
  }, [loading, nutritionPlan]);

  const regeneratePlan = async () => {
    try {
      const res = await API.post('/ai/nutrition/regenerate');
      setNutritionPlan(res);
      alert('🔄 Meal plan regenerated!');
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

  if (loading || !nutritionPlan) return <div className="empty-state"><span className="spinner"></span> Loading Nutrition Plan...</div>;

  const mealCards = nutritionPlan.meals || [];
  const recommendations = nutritionPlan.recommendations || [];

  return (
    <div className="page-section active">
      <div className="section-header" style={{ background: 'var(--bg-card)', padding: '24px 32px', borderRadius: '16px', border: '1px solid var(--border-color)', boxShadow: '0 4px 20px rgba(0,0,0,0.03)', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ width: '52px', height: '52px', background: 'rgba(37,99,235,0.08)', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>
          </div>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', fontFamily: "'Inter', sans-serif" }}>AI Nutrition Planner</h2>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 6px var(--success)' }}></span>
              Personalized meal plans based on your profile
            </p>
          </div>
        </div>
        <div className="flex gap-md">
          <button className="btn btn-primary" onClick={regeneratePlan} style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', fontWeight: 600, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.92-10.27l-3.26 1.5"></path></svg>
            Regenerate Plan
          </button>
        </div>
      </div>
        <div className="dashboard-stats" style={{ marginBottom: 'var(--space-xl)', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
          <div className="stat-card">
            <div className="stat-icon coral" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🔥</div>
            <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{nutritionPlan.tdee}</div>
            <div className="stat-label" style={{ color: 'var(--text-muted)' }}>Daily Calories (TDEE)</div>
            <div className="stat-glow" style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '60px', height: '60px', background: 'var(--accent)', filter: 'blur(30px)', opacity: 0.5 }}></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon blue" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>💧</div>
            <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{nutritionPlan.water_goal_liters}L</div>
            <div className="stat-label" style={{ color: 'var(--text-muted)' }}>Water Goal</div>
            <div className="stat-glow" style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '60px', height: '60px', background: 'var(--info)', filter: 'blur(30px)', opacity: 0.5 }}></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon green" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>💪</div>
            <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{nutritionPlan.protein_goal_grams}g</div>
            <div className="stat-label" style={{ color: 'var(--text-muted)' }}>Protein Goal</div>
            <div className="stat-glow" style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '60px', height: '60px', background: 'var(--success)', filter: 'blur(30px)', opacity: 0.5 }}></div>
          </div>
          <div className="stat-card">
            <div className="stat-icon purple" style={{ fontSize: '1.5rem', marginBottom: '8px' }}>⚖️</div>
            <div className="stat-value" style={{ fontSize: '1.8rem', fontWeight: 800 }}>{nutritionPlan.bmi}</div>
            <div className="stat-label" style={{ color: 'var(--text-muted)' }}>Current BMI</div>
            <div className={`stat-change ${nutritionPlan.bmi < 25 ? 'positive' : 'negative'}`} style={{ color: nutritionPlan.bmi < 25 ? 'var(--success)' : 'var(--danger)', fontSize: '0.85rem', fontWeight: 600 }}>{nutritionPlan.bmi_category}</div>
            <div className="stat-glow" style={{ position: 'absolute', bottom: '-20px', right: '-20px', width: '60px', height: '60px', background: 'var(--primary)', filter: 'blur(30px)', opacity: 0.5 }}></div>
          </div>
        </div>

        <h3 style={{ marginBottom: 'var(--space-md)' }}>🍽️ Today's Meal Plan</h3>
        <div className="grid-2 gap-md mb-xl" id="meal-plan" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
          {mealCards.map((m, i) => (
            <div key={i} className="meal-card">
              <div className="meal-header" style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span className="meal-emoji" style={{ fontSize: '1.8rem', background: 'rgba(99,102,241,0.1)', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '12px' }}>{m.icon}</span>
                <div>
                  <div className="meal-title" style={{ fontWeight: 700, fontSize: '1.05rem', textTransform: 'capitalize' }}>{m.meal_type}</div>
                  <div className="meal-time" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>🕐 {m.time}</div>
                </div>
              </div>
              <ul className="meal-items" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-color)', fontSize: '0.9rem' }}>
                  <span>{m.name}</span>
                  <span className="meal-calories" style={{ fontWeight: 600, color: 'var(--primary)' }}>{m.calories} cal</span>
                </li>
                <li style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '0.9rem' }}>
                  <span>Protein</span>
                  <span className="meal-calories" style={{ fontWeight: 600, color: 'var(--primary)' }}>{m.protein}g</span>
                </li>
              </ul>
            </div>
          ))}
        </div>

        <div className="grid-2 gap-xl" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
          <div className="glass-card no-hover" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ marginBottom: '16px' }}>📊 Macro Breakdown</h4>
            <div className="chart-container" style={{ height: '250px', position: 'relative' }}>
              <canvas ref={chartRef}></canvas>
            </div>
          </div>
          <div className="glass-card no-hover" style={{ background: 'var(--bg-card)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
            <h4 style={{ marginBottom: '16px' }}>💡 AI Recommendations</h4>
            {recommendations.map((t, i) => (
              <div key={i} style={{ padding: '8px 0', fontSize: '0.85rem', color: 'var(--text-secondary)', borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                <span style={{ marginRight: '8px' }}>{t.icon}</span>{t.text}
              </div>
            ))}
          </div>
      </div>
    </div>
  );
};

export default AINutrition;
