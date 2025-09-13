/**
 * Toast utility for dispatching toast notifications
 * This utility dispatches custom events that the ToastManager component listens to
 */

export const showToast = (message, type = 'info', title = null) => {
  const notification = {
    id: Date.now(),
    title: title || getDefaultTitle(type),
    message: message,
    type: type,
    created_at: new Date().toISOString()
  };

  // Dispatch custom event that ToastManager listens to
  window.dispatchEvent(new CustomEvent('show-toast', {
    detail: { notification }
  }));
};

export const showSuccessToast = (message, title = null) => {
  showToast(message, 'success', title);
};

export const showErrorToast = (message, title = null) => {
  showToast(message, 'error', title);
};

export const showInfoToast = (message, title = null) => {
  showToast(message, 'info', title);
};

export const showWarningToast = (message, title = null) => {
  showToast(message, 'warning', title);
};

const getDefaultTitle = (type) => {
  switch (type) {
    case 'success':
      return 'Success';
    case 'error':
      return 'Error';
    case 'warning':
      return 'Warning';
    case 'info':
    default:
      return 'Information';
  }
};

export default {
  showToast,
  showSuccessToast,
  showErrorToast,
  showInfoToast,
  showWarningToast
};
