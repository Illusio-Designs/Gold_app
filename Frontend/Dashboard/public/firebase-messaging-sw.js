// Firebase messaging service worker for dashboard
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDW0FnbA7vJrV7EsNnZK7Adu2dfBcVe3eg",
  authDomain: "amrut-9cc5e.firebaseapp.com",
  projectId: "amrut-9cc5e",
  storageBucket: "amrut-9cc5e.firebasestorage.app",
  messagingSenderId: "76051395970",
  appId: "1:76051395970:web:1d7817edf09d6b2bb4cb9b",
  measurementId: "G-C0MD37JBH6"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('🔔 [SW] Received background message:', payload);

  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new notification',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data || {},
    requireInteraction: true,
    actions: [
      {
        action: 'view',
        title: 'View',
        icon: '/favicon.ico'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/favicon.ico'
      }
    ]
  };

  // Show notification
  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 [SW] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'view') {
    // Open dashboard when notification is clicked
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('🔔 [SW] Notification closed:', event);
});

console.log('✅ [SW] Firebase messaging service worker loaded'); 