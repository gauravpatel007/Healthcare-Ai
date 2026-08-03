import { useState, useEffect } from 'react';
import API from '../../utils/api';
import { Bell, Send, Users, Calendar, Trash2 } from 'lucide-react';

const AdminNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    type: 'Push', target_audience: 'Everyone', title: '', message: '', scheduled_for: ''
  });

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await API.getAdminNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!formData.title || !formData.message) return alert("Title and Message are required");
    try {
      const payload = { ...formData };
      if (!payload.scheduled_for) delete payload.scheduled_for;
      
      await API.createAdminNotification(payload);
      setShowModal(false);
      fetchNotifications();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Delete this notification log?")) {
      await API.deleteAdminNotification(id);
      fetchNotifications();
    }
  };

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Notifications Hub</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Send alerts, announcements, and emails</p>
        </div>
        <button className="btn btn-primary" onClick={() => {
          setFormData({ type: 'Push', target_audience: 'Everyone', title: '', message: '', scheduled_for: '' });
          setShowModal(true);
        }}>
          <Send className="w-4 h-4" style={{ marginRight: '8px' }} />
          New Notification
        </button>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="glass-card" style={{ padding: '24px', borderRadius: '16px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                <th style={{ padding: '12px', fontWeight: 600 }}>TYPE</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>TARGET</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>MESSAGE</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>STATUS</th>
                <th style={{ padding: '12px', fontWeight: 600 }}>DATE</th>
                <th style={{ padding: '12px', fontWeight: 600 }}></th>
              </tr>
            </thead>
            <tbody>
              {notifications.map(n => (
                <tr key={n.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '16px 12px' }}>
                    <span className="badge" style={{ background: 'var(--bg-secondary)' }}>{n.type}</span>
                  </td>
                  <td style={{ padding: '16px 12px', fontSize: '0.9rem' }}>{n.target_audience}</td>
                  <td style={{ padding: '16px 12px' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{n.title}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{n.message}</div>
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <span className="badge" style={{ background: n.status === 'Sent' ? 'var(--success-light)' : 'var(--warning-light)', color: n.status === 'Sent' ? 'var(--success)' : 'var(--warning)' }}>
                      {n.status}
                    </span>
                  </td>
                  <td style={{ padding: '16px 12px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {new Date(n.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: '16px 12px' }}>
                    <button className="btn btn-icon" style={{ color: 'var(--danger)' }} onClick={() => handleDelete(n.id)}>
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {notifications.length === 0 && <tr><td colSpan="6" style={{ padding: '24px', textAlign: 'center' }}>No notifications found</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay active" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="modal-content glass-card" style={{ background: 'var(--bg-card)', padding: '32px', borderRadius: '20px', width: '90%', maxWidth: '600px' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '24px' }}>Send Notification</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group">
                <label className="form-label">Delivery Method</label>
                <select className="form-select" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}>
                  <option>Push</option><option>Email</option><option>SMS</option><option>In-App</option><option>Announcement</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Target Audience</label>
                <select className="form-select" value={formData.target_audience} onChange={e => setFormData({...formData, target_audience: e.target.value})}>
                  <option>Everyone</option><option>Premium</option><option>Doctors</option><option>Selected Users</option>
                </select>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Title</label>
              <input type="text" className="form-input" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
            </div>

            <div className="form-group" style={{ marginBottom: '16px' }}>
              <label className="form-label">Message</label>
              <textarea className="form-input" rows="4" value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})}></textarea>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Calendar className="w-4 h-4" /> Schedule (Optional)
              </label>
              <input type="datetime-local" className="form-input" value={formData.scheduled_for} onChange={e => setFormData({...formData, scheduled_for: e.target.value})} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn" style={{ background: 'var(--bg-secondary)' }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSend} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Send className="w-4 h-4" /> Send Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotifications;
