import React, { useState, useEffect } from 'react';
import { Bell, X, User, Clock, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import '../../styles/common/ToastNotification.css';

const ToastNotification = ({ notification, onClose, onAction }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Show toast after a small delay
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return <CheckCircle size={20} />;
      case 'error':
        return <AlertCircle size={20} />;
      case 'warning':
        return <AlertTriangle size={20} />;
      case 'info':
        return <Info size={20} />;
      default:
        return <Bell size={20} />;
    }
  };

  const getNotificationClass = (type) => {
    switch (type) {
      case 'success':
        return 'toast-success';
      case 'error':
        return 'toast-error';
      case 'warning':
        return 'toast-warning';
      case 'info':
        return 'toast-info';
      default:
        return '';
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Wait for animation to complete
  };

  const handleAction = () => {
    console.log('[ToastNotification] Action button clicked!');
    console.log('[ToastNotification] Notification:', notification);
    console.log('[ToastNotification] Notification type:', notification.type);
    console.log('[ToastNotification] Notification data:', notification.data);
    
    if (onAction) {
      console.log('[ToastNotification] Calling onAction...');
      onAction();
    } else {
      console.log('[ToastNotification] No onAction provided');
    }
    handleClose();
  };

  return (
    <div className={`toast-notification ${isVisible ? 'show' : ''} ${getNotificationClass(notification.type)}`}>
      <div className="toast-content">
        <div className="toast-icon">
          {getNotificationIcon(notification.type)}
        </div>
                        <div className="toast-body">
                  <div className="toast-header">
                    <h4 className="toast-title">{notification.title}</h4>
                    {notification.data?.businessName && (
                      <span className="toast-business-name">{notification.data.businessName}</span>
                    )}
                  </div>
                  {notification.data?.userName && (
                    <p className="toast-user-name">{notification.data.userName}</p>
                  )}
                  <p className="toast-message">{notification.body || notification.message}</p>
                  <div className="toast-meta">
                    <Clock size={12} />
                    <span>{new Date(notification.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
        <div className="toast-actions">
          {/* Show action button based on notification type */}
          {(notification.type === 'user_registration' || notification.data?.notificationType === 'user_registration') && (
            <button 
              className="toast-action-btn"
              onClick={handleAction}
              title="View Users"
            >
              <User size={16} />
            </button>
          )}
          
          {(notification.type === 'new_order' || notification.data?.notificationType === 'new_order') && (
            <button 
              className="toast-action-btn"
              onClick={handleAction}
              title="View Orders"
            >
              <User size={16} />
            </button>
          )}
          
          <button 
            className="toast-close-btn"
            onClick={handleClose}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToastNotification; 