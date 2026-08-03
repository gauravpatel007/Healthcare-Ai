import React, { useState, useEffect } from 'react';
import API from '../utils/api';

const HealthArticles = () => {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const data = await API.getUserArticles();
      setArticles(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (selectedArticle) {
    return (
      <div className="page-section active" style={{ maxWidth: '800px', margin: '0 auto' }}>
        <button 
          className="btn btn-secondary" 
          style={{ marginBottom: '24px' }} 
          onClick={() => setSelectedArticle(null)}
        >
          ← Back to Articles
        </button>
        <div className="bg-white dark:bg-gray-800 rounded-[20px] p-8 shadow-sm">
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
              {selectedArticle.category}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
              Published on {new Date(selectedArticle.created_at).toLocaleDateString()}
            </span>
          </div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '24px', lineHeight: 1.2 }}>
            {selectedArticle.title}
          </h1>
          {selectedArticle.featured_image_url && (
            <img 
              src={selectedArticle.featured_image_url} 
              alt={selectedArticle.title} 
              style={{ width: '100%', borderRadius: '16px', marginBottom: '32px', maxHeight: '400px', objectFit: 'cover' }}
            />
          )}
          <div 
            className="article-content" 
            style={{ fontSize: '1.1rem', lineHeight: 1.8, color: 'var(--text-primary)', whiteSpace: 'pre-wrap' }}
          >
            {selectedArticle.content}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-section active">
      <div className="section-header">
        <div>
          <h2>Health Articles</h2>
          <p style={{ color: 'var(--text-secondary)' }}>Curated medical news and wellness tips.</p>
        </div>
      </div>
      
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading articles...</div>
      ) : articles.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-[20px] p-8 shadow-sm text-center">
          <p style={{ color: 'var(--text-muted)' }}>No articles have been published yet.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
          {articles.map(article => (
            <div 
              key={article.id} 
              className="bg-white dark:bg-gray-800 rounded-[20px] shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => setSelectedArticle(article)}
              style={{ display: 'flex', flexDirection: 'column' }}
            >
              {article.featured_image_url ? (
                <div style={{ height: '180px', width: '100%', overflow: 'hidden' }}>
                  <img src={article.featured_image_url} alt={article.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ) : (
                <div style={{ height: '180px', width: '100%', background: 'linear-gradient(135deg, var(--primary-light), #e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: '3rem' }}>📰</span>
                </div>
              )}
              <div style={{ padding: '24px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ marginBottom: '12px' }}>
                  <span className="badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
                    {article.category}
                  </span>
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '12px', lineHeight: 1.4 }}>
                  {article.title}
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', flex: 1 }}>
                  {article.content}
                </p>
                <div style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Read Full Article →
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default HealthArticles;
