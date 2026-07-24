// Simple notification service without Firebase dependencies
class DashboardNotificationService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Request permission for notifications
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return;
      }

      this.isInitialized = true;
      console.log('Notification service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
    }
  }

  showNotification(title, body, options = {}) {
    if (title && body) {
      // Show browser notification
      if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification(title, {
          body,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'dashboard-notification',
          requireInteraction: true,
          ...options
        });

        // Handle notification click
        notification.onclick = () => {
          window.focus();
          notification.close();
          
          // Handle custom actions
          if (options.action) {
            window.location.href = options.action;
          }
        };
      }

      // Play notification sound
      this.playNotificationSound();
    }
  }

  // Play sound for new notifications using Web Audio API
  playNotificationSound() {
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create oscillator for beep sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      // Connect nodes
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Configure sound
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime); // 800Hz beep
      oscillator.type = 'sine';
      
      // Configure volume
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      // Play sound
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      console.log('Notification sound played successfully');
    } catch (error) {
      console.log('Could not play notification sound:', error);
      
      // Fallback to audio file if Web Audio API fails
      try {
        const audio = new Audio('/sounds/notification.mp3');
        audio.volume = 0.5;
        audio.play().catch(fallbackError => {
          console.log('Fallback audio also failed:', fallbackError);
        });
      } catch (fallbackError) {
        console.log('Fallback audio failed:', fallbackError);
      }
    }
  }
}

export default new DashboardNotificationService(); 