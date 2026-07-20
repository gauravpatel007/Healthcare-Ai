import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../utils/api';
import '../index.css';

const SharedProfile = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Override layout for public page
    const appContainer = document.querySelector('.app-container');
    const rightPanel = document.querySelector('.right-panel');
    const sidebar = document.querySelector('.sidebar');
    if (appContainer) appContainer.style.display = 'block';
    if (rightPanel) rightPanel.style.display = 'none';
    if (sidebar) sidebar.style.display = 'none';
    
    // Create standalone wrapper
    const root = document.getElementById('root');
    if (root) {
      root.style.minHeight = '100vh';
      root.style.background = '#f1f5f9';
      root.style.padding = '0';
      root.style.display = 'flex';
      root.style.justifyContent = 'center';
      root.style.alignItems = 'flex-start';
    }

    const fetchSharedData = async () => {
      try {
        const response = await API.get(`/share/${token}`);
        setData(response);
      } catch (err) {
        setError(err.response?.data?.detail || "This secure link is invalid or has expired.");
      } finally {
        setLoading(false);
      }
    };

    fetchSharedData();

    return () => {
      // Restore layout on unmount
      if (appContainer) appContainer.style.display = 'grid';
      if (rightPanel) rightPanel.style.display = 'flex';
      if (sidebar) sidebar.style.display = 'flex';
      if (root) {
        root.style.background = '';
        root.style.display = '';
        root.style.justifyContent = '';
        root.style.alignItems = '';
        root.style.padding = '';
      }
    };
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%' }}>
        <div className="spinner" style={{ width: '40px', height: '40px', border: '4px solid rgba(14, 165, 233, 0.2)', borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '16px', color: '#64748b', fontWeight: 600 }}>Decrypting Secure Medical Profile...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', width: '100%', padding: '20px' }}>
        <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', boxShadow: '0 10px 40px rgba(0,0,0,0.05)', textAlign: 'center', maxWidth: '400px' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔒</div>
          <h2 style={{ color: '#0f172a', marginBottom: '12px', fontSize: '1.5rem' }}>Access Denied</h2>
          <p style={{ color: '#64748b', marginBottom: '24px', lineHeight: 1.6 }}>{error}</p>
          <Link to="/" style={{ display: 'inline-block', padding: '12px 24px', background: '#0ea5e9', color: '#fff', textDecoration: 'none', borderRadius: '50px', fontWeight: 600 }}>Return Home</Link>
        </div>
      </div>
    );
  }

  const { profile, contacts, records = [], vaccinations = [] } = data;

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '40px auto', padding: '0 20px' }} className="print:m-0 print:p-0 print:max-w-none">
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', padding: '32px', borderRadius: '24px 24px 0 0', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} className="print:bg-white print:text-slate-900 print:border-b print:rounded-none">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>HEALTH SUMMARY</h1>
          <p style={{ margin: '8px 0 0 0', opacity: 0.9, fontSize: '0.95rem' }} className="print:text-slate-500">Securely shared via LifeOS • Generated {new Date().toLocaleDateString()}</p>
        </div>
        <div style={{ fontSize: '40px' }} className="print:hidden">🏥</div>
        <button onClick={() => window.print()} className="print:hidden" style={{ background: 'rgba(255,255,255,0.2)', border: 'none', padding: '10px 20px', borderRadius: '8px', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}>
          Print / PDF
        </button>
      </div>

      {/* Body */}
      <div style={{ background: '#ffffff', padding: '32px', borderRadius: '0 0 24px 24px', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }} className="print:shadow-none print:p-8">
        
        {/* Core Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '32px', paddingBottom: '32px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ width: '100px', height: '100px', background: '#f1f5f9', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px' }} className="print:border print:border-slate-200">
            👤
          </div>
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '2rem', color: '#0f172a', fontWeight: 800 }}>{profile.name || 'Unknown'}</h2>
            <div style={{ display: 'flex', gap: '16px', color: '#64748b', fontSize: '1.05rem', fontWeight: 500, flexWrap: 'wrap' }}>
              <span>{profile.age ? `${profile.age} years` : 'Age unknown'}</span>
              <span>•</span>
              <span>{profile.gender || 'Gender unknown'}</span>
              <span>•</span>
              <span style={{ color: '#ef4444', fontWeight: 700 }}>Blood: {profile.blood_type || 'Unknown'}</span>
              <span>•</span>
              <span>{profile.height ? `${profile.height} cm` : 'Height N/A'}</span>
              <span>•</span>
              <span>{profile.weight ? `${profile.weight} kg` : 'Weight N/A'}</span>
            </div>
          </div>
        </div>

        {/* Medical Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
          <div style={{ background: '#fef2f2', padding: '20px', borderRadius: '16px', border: '1px solid #fecaca' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#b91c1c', textTransform: 'uppercase', letterSpacing: '1px' }}>Allergies</h3>
            <p style={{ margin: 0, color: '#7f1d1d', fontWeight: 600, fontSize: '1.1rem' }}>
              {profile.allergies?.join(', ') || 'None reported'}
            </p>
          </div>
          <div style={{ background: '#eff6ff', padding: '20px', borderRadius: '16px', border: '1px solid #bfdbfe' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: '0.85rem', color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '1px' }}>Medical Conditions</h3>
            <p style={{ margin: 0, color: '#1e3a8a', fontWeight: 600, fontSize: '1.1rem' }}>
              {profile.conditions?.join(', ') || 'None reported'}
            </p>
          </div>
        </div>

        {/* Recent Medical Records */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
            <span>📋</span> Recent Medical Records
          </h3>
          {records.length > 0 ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              {records.map((r) => (
                <div key={r.id} style={{ padding: '16px', borderRadius: '12px', background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#0f172a' }}>{r.title}</h4>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{r.category} • {r.date}</p>
                    </div>
                    {r.doctor && <span style={{ background: '#e0f2fe', color: '#0369a1', padding: '4px 10px', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 600 }}>Dr. {r.doctor}</span>}
                  </div>
                  {r.findings && (
                    <div style={{ marginTop: '12px', padding: '12px', background: '#ffffff', borderRadius: '8px', border: '1px dashed #cbd5e1', fontSize: '0.95rem', color: '#334155' }}>
                      <strong style={{ display: 'block', marginBottom: '4px', fontSize: '0.85rem', color: '#94a3b8' }}>KEY FINDINGS</strong>
                      {r.findings}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#64748b', fontStyle: 'italic' }}>No recent medical records available.</p>
          )}
        </div>

        {/* Vaccinations */}
        <div style={{ marginBottom: '32px' }}>
          <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
            <span>💉</span> Vaccination History
          </h3>
          {vaccinations.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
              {vaccinations.map((v) => (
                <div key={v.id} style={{ padding: '12px', borderRadius: '12px', background: '#f0fdfa', border: '1px solid #ccfbf1' }}>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '1rem', color: '#0f766e' }}>{v.name}</h4>
                  <p style={{ margin: 0, color: '#0f766e', fontSize: '0.85rem', opacity: 0.8 }}>{v.date}</p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#64748b', fontStyle: 'italic' }}>No vaccinations on record.</p>
          )}
        </div>

        {/* Emergency Contacts */}
        <div style={{ pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '1.25rem', color: '#0f172a', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '2px solid #f1f5f9', paddingBottom: '8px' }}>
            <span>📞</span> Emergency Contacts
          </h3>
          {contacts && contacts.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
              {contacts.map((contact, i) => (
                <div key={i} style={{ padding: '16px', borderRadius: '12px', background: '#fff', border: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: '#0f172a' }}>{contact.name}</h4>
                    <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>{contact.relation}</p>
                  </div>
                  <a href={`tel:${contact.phone}`} className="print:hidden" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: '#0ea5e9', color: 'white', padding: '8px 16px', borderRadius: '50px', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem' }}>
                    Call
                  </a>
                  <span className="hidden print:inline-block font-bold text-slate-800">{contact.phone}</span>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: '#64748b', fontStyle: 'italic' }}>No emergency contacts listed.</p>
          )}
        </div>

        {/* Organ Donor Status */}
        {profile.organ_donor && (
          <div style={{ marginTop: '32px', background: '#f0fdf4', padding: '20px', borderRadius: '16px', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ fontSize: '32px' }}>💚</div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', color: '#166534', fontSize: '1.1rem' }}>Registered Organ Donor</h4>
              <p style={{ margin: 0, color: '#15803d', fontSize: '0.9rem' }}>This patient is officially registered as an organ donor.</p>
            </div>
          </div>
        )}

      </div>
      
      <div style={{ textAlign: 'center', marginTop: '24px', marginBottom: '40px' }} className="print:mt-8">
        <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Provided securely by <strong>LifeOS</strong> for authorized medical personnel.</p>
      </div>
    </div>
  );
};

export default SharedProfile;
