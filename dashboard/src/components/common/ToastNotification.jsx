import React, { useState, useEffect } from 'react';
import { HugeiconsIcon } from '@hugeicons/react';
import { Notification03Icon, Cancel01Icon, UserIcon, Clock01Icon, CheckmarkCircle02Icon, AlertCircleIcon, Alert02Icon, InformationCircleIcon } from '@hugeicons/core-free-icons';
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
        return <HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} />;
      case 'error':
        return <HugeiconsIcon icon={AlertCircleIcon} size={20} />;
      case 'warning':
        return <HugeiconsIcon icon={Alert02Icon} size={20} />;
      case 'info':
        return <HugeiconsIcon icon={InformationCircleIcon} size={20} />;
      default:
        return <HugeiconsIcon icon={Notification03Icon} size={20} />;
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
                    <HugeiconsIcon icon={Clock01Icon} size={12} />
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
              <HugeiconsIcon icon={UserIcon} size={16} />
            </button>
          )}
          
          {(notification.type === 'new_order' || notification.data?.notificationType === 'new_order') && (
            <button 
              className="toast-action-btn"
              onClick={handleAction}
              title="View Orders"
            >
              <HugeiconsIcon icon={UserIcon} size={16} />
            </button>
          )}
          
          <button 
            className="toast-close-btn"
            onClick={handleClose}
            title="Close"
          >
            <HugeiconsIcon icon={Cancel01Icon} size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ToastNotification; 