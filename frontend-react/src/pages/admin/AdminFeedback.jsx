import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { MessageSquare, AlertTriangle, Star, Frown, CheckCircle, Trash2, Send } from 'lucide-react';

const AdminFeedback = () => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyId, setReplyId] = useState(null);
  const [replyText, setReplyText] = useState('');

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const data = await API.getAdminFeedback();
      setFeedbackList(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      await API.updateAdminFeedback(id, { status });
      fetchFeedback();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReplySubmit = async (id) => {
    if (!replyText) return;
    try {
      await API.updateAdminFeedback(id, { admin_reply: replyText, status: 'Closed' });
      setReplyId(null);
      setReplyText('');
      fetchFeedback();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this feedback?")) {
      await API.deleteAdminFeedback(id);
      fetchFeedback();
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Bug': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'Suggestion': return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case 'Rating': return <Star className="w-5 h-5 text-yellow-500" />;
      case 'Complaint': return <Frown className="w-5 h-5 text-orange-500" />;
      default: return <MessageSquare className="w-5 h-5 text-gray-500 dark:text-gray-400" />;
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>User Feedback & Reports</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage bugs, complaints, and user suggestions</p>
        </div>
      </div>

      {loading ? <p>Loading...</p> : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {feedbackList.length === 0 ? <p>No feedback found.</p> : feedbackList.map(item => (
            <div key={item.id} className="glass-card" style={{ padding: '24px', borderRadius: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '10px', borderRadius: '12px' }}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{item.type}</h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0 }}>
                      From: {item.user_name} ({item.user_email}) • {new Date(item.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="badge" style={{ 
                    background: item.status === 'Closed' ? 'var(--success-light)' : item.status === 'Assigned' ? 'var(--warning-light)' : 'var(--bg-secondary)', 
                    color: item.status === 'Closed' ? 'var(--success)' : item.status === 'Assigned' ? 'var(--warning)' : 'var(--text-primary)' 
                  }}>
                    {item.status}
                  </span>
                  {item.status !== 'Closed' && (
                    <button className="btn btn-icon" title="Mark as Closed" style={{ color: 'var(--success)' }} onClick={() => handleStatusUpdate(item.id, 'Closed')}>
                      <CheckCircle className="w-5 h-5" />
                    </button>
                  )}
                  <button className="btn btn-icon" title="Delete" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(item.id)}>
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div style={{ background: 'var(--bg-input)', padding: '16px', borderRadius: '12px', fontSize: '0.95rem' }}>
                {item.message}
              </div>

              {item.admin_reply ? (
                <div style={{ background: 'var(--primary-light)', padding: '16px', borderRadius: '12px', borderLeft: '4px solid var(--primary)' }}>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--primary)', marginBottom: '4px' }}>Admin Reply:</strong>
                  <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{item.admin_reply}</p>
                </div>
              ) : (
                replyId === item.id ? (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" className="form-input" placeholder="Type your reply..." value={replyText} onChange={e => setReplyText(e.target.value)} style={{ flex: 1 }} />
                    <button className="btn btn-primary" onClick={() => handleReplySubmit(item.id)}><Send className="w-4 h-4" /></button>
                    <button className="btn" onClick={() => setReplyId(null)}>Cancel</button>
                  </div>
                ) : (
                  <div>
                    <button className="btn btn-secondary" onClick={() => setReplyId(item.id)}>Reply to User</button>
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminFeedback;
