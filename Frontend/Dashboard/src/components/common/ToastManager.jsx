import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ToastNotification from './ToastNotification';

const ToastManager = () => {
  const [toasts, setToasts] = useState([]);
  const navigate = useNavigate();

  // Listen for custom events to show toasts
  useEffect(() => {
    const handleShowToast = (event) => {
      console.log('[ToastManager] Received show-toast event:', event.detail);
      const { notification } = event.detail;
      showToast(notification);
    };

    const handleLoginRequest = (event) => {
      console.log('[ToastManager] Received login-request event:', event.detail);
      const { phoneNumber, categoryIds } = event.detail;
      const notification = {
        id: Date.now(),
        title: 'New Login Request',
        message: `User ${phoneNumber} has requested access to categories.`,
        type: 'login_request',
        created_at: new Date().toISOString(),
        data: {
          action: 'redirect_to_login_requests',
          phoneNumber,
          categoryIds
        }
      };
      showToast(notification);
    };

    // Listen for custom events
    window.addEventListener('show-toast', handleShowToast);
    window.addEventListener('login-request', handleLoginRequest);

    return () => {
      window.removeEventListener('show-toast', handleShowToast);
      window.removeEventListener('login-request', handleLoginRequest);
    };
  }, []);

  const showToast = (notification) => {
    console.log('[ToastManager] Showing toast for notification:', notification);
    const toastId = Date.now();
    const newToast = {
      ...notification,
      id: toastId
    };

    setToasts(prev => [...prev, newToast]);
    console.log('[ToastManager] Toast added, total toasts:', toasts.length + 1);

    // Auto-remove toast after 8 seconds
    setTimeout(() => {
      removeToast(toastId);
    }, 8000);
  };

  const removeToast = (toastId) => {
    setToasts(prev => prev.filter(toast => toast.id !== toastId));
  };

  const handleToastAction = (toast) => {
    console.log('[ToastManager] Handling toast action:', toast);
    console.log('[ToastManager] Toast type:', toast.type);
    console.log('[ToastManager] Toast data:', toast.data);
    console.log('[ToastManager] Notification type from data:', toast.data?.notificationType);
    
    // Handle different notification types
    const notificationType = toast.type || toast.data?.notificationType;
    console.log('[ToastManager] Final notification type:', notificationType);
    
    switch (notificationType) {
      case 'user_registration':
        console.log('[ToastManager] Navigating to users page...');
        navigate('/dashboard/users');
        break;
        
      case 'login_request':
        console.log('[ToastManager] Navigating to login requests page...');
        navigate('/dashboard/login-requests');
        break;
        
      case 'new_order':
        console.log('[ToastManager] Navigating to orders page...');
        navigate('/dashboard/orders');
        break;
        
      default:
        // For other notifications, just close the toast
        console.log('[ToastManager] No specific action for notification type:', notificationType);
        break;
    }
  };

  return (
    <div className="toast-manager">
      {toasts.map((toast, index) => (
        <ToastNotification
          key={toast.id}
          notification={toast}
          onClose={() => removeToast(toast.id)}
          onAction={() => handleToastAction(toast)}
        />
      ))}
    </div>
  );
};

export default ToastManager; 