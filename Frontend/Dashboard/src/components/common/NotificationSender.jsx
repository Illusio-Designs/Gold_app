import React, { useState, useEffect } from 'react';
import { sendNotification, getUsers, getStoredTokens } from '../../services/adminApiService';
import '../../styles/common/NotificationSender.css';

const NotificationSender = ({ onNotificationSent }) => {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'general',
    targetType: 'all', // 'all', 'specific', 'topic'
    targetUsers: [],
    topic: '',
    data: {}
  });
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      if (!token) return;
      
      const response = await getUsers(token);
      setUsers(response.users || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUserSelection = (userId) => {
    setFormData(prev => ({
      ...prev,
      targetUsers: prev.targetUsers.includes(userId)
        ? prev.targetUsers.filter(id => id !== userId)
        : [...prev.targetUsers, userId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.body) {
      setMessage('Title and body are required');
      return;
    }

    if (formData.targetType === 'specific' && formData.targetUsers.length === 0) {
      setMessage('Please select at least one user');
      return;
    }

    if (formData.targetType === 'topic' && !formData.topic) {
      setMessage('Please enter a topic name');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('admin_token');
      if (!token) {
        setMessage('Authentication required');
        return;
      }

      const notificationData = {
        title: formData.title,
        body: formData.body,
        type: formData.type,
        data: formData.data
      };

      // Add target-specific data
      if (formData.targetType === 'specific') {
        notificationData.targetUsers = formData.targetUsers;
      } else if (formData.targetType === 'topic') {
        notificationData.topic = formData.topic;
      }

      const response = await sendNotification(notificationData, token);
      
      if (response.success) {
        setMessage('Notification sent successfully!');
        setFormData({
          title: '',
          body: '',
          type: 'general',
          targetType: 'all',
          targetUsers: [],
          topic: '',
          data: {}
        });
        setShowForm(false);
        
        if (onNotificationSent) {
          onNotificationSent();
        }
      } else {
        setMessage('Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setMessage('Error sending notification: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getTargetDescription = () => {
    switch (formData.targetType) {
      case 'all':
        return 'All registered users';
      case 'specific':
        return `${formData.targetUsers.length} selected user(s)`;
      case 'topic':
        return `Topic: ${formData.topic}`;
      default:
        return '';
    }
  };

  return (
    <div className="notification-sender">
      <div className="notification-sender-header">
        <h3>Send Notification</h3>
        <button 
          className="toggle-form-btn"
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? 'Hide' : 'Show'} Form
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="notification-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Notification title"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="body">Message *</label>
            <textarea
              id="body"
              name="body"
              value={formData.body}
              onChange={handleInputChange}
              placeholder="Notification message"
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="type">Type</label>
            <select
              id="type"
              name="type"
              value={formData.type}
              onChange={handleInputChange}
            >
              <option value="general">General</option>
              <option value="info">Information</option>
              <option value="warning">Warning</option>
              <option value="success">Success</option>
              <option value="error">Error</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="targetType">Target</label>
            <select
              id="targetType"
              name="targetType"
              value={formData.targetType}
              onChange={handleInputChange}
            >
              <option value="all">All Users</option>
              <option value="specific">Specific Users</option>
              <option value="topic">Topic</option>
            </select>
          </div>

          {formData.targetType === 'specific' && (
            <div className="form-group">
              <label>Select Users</label>
              <div className="user-selection">
                {users.map(user => (
                  <label key={user.id} className="user-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.targetUsers.includes(user.id)}
                      onChange={() => handleUserSelection(user.id)}
                    />
                    <span>{user.name} ({user.email})</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {formData.targetType === 'topic' && (
            <div className="form-group">
              <label htmlFor="topic">Topic Name</label>
              <input
                type="text"
                id="topic"
                name="topic"
                value={formData.topic}
                onChange={handleInputChange}
                placeholder="e.g., promotions, updates, alerts"
              />
            </div>
          )}

          <div className="target-description">
            <strong>Target:</strong> {getTargetDescription()}
          </div>

          {message && (
            <div className={`message ${message.includes('successfully') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <div className="form-actions">
            <button
              type="submit"
              disabled={loading}
              className="send-btn"
            >
              {loading ? 'Sending...' : 'Send Notification'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="cancel-btn"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default NotificationSender; 