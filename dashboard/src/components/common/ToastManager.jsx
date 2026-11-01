import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { GooeyToaster, gooeyToast } from 'goey-toast';
import 'goey-toast/styles.css';

/**
 * Bridges the app's existing `show-toast` CustomEvent bus to the goey-toast
 * library (gooey / blob-morph notifications). Every toast — session messages,
 * success/error toasts (utils/toast), and realtime new-order / registration
 * notifications — flows through this one listener, so the whole dashboard uses
 * the gooey toast with no changes at the call sites.
 */

// Our internal toast types -> goey-toast methods.
const TYPE_METHOD = {
  success: 'success',
  error: 'error',
  warning: 'warning',
  info: 'info',
};

const ToastManager = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const handleShowToast = (event) => {
      const { notification } = event.detail || {};
      if (!notification) return;

      const rawType = notification.type || notification.data?.notificationType;
      const method = TYPE_METHOD[rawType] || null;

      const title = notification.title || notification.message || 'Notification';
      const body =
        notification.message && notification.message !== title
          ? notification.message
          : notification.body || undefined;

      // Tap-through navigation for actionable notifications.
      let action;
      if (rawType === 'new_order' || rawType === 'order') {
        action = { label: 'View order', onClick: () => navigate('/dashboard/orders') };
      } else if (rawType === 'user_registration') {
        action = { label: 'View firm', onClick: () => navigate('/dashboard/users') };
      }

      const options = { description: body, action };

      if (method) {
        gooeyToast[method](title, options);
      } else {
        gooeyToast(title, options);
      }
    };

    window.addEventListener('show-toast', handleShowToast);
    return () => window.removeEventListener('show-toast', handleShowToast);
  }, [navigate]);

  return (
    <GooeyToaster
      position="top-right"
      theme="light"
      bounce={0.45}
      closeButton
    />
  );
};

export default ToastManager;
