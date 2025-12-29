// Notification Sound Service
// Handles playing different sounds for different notification types

class NotificationSoundService {
  constructor() {
    this.sounds = {
      user_registration: '/sounds/registration.mp3',
      new_order: '/sounds/order.mp3',
      default: '/sounds/notification.mp3'
    };
    
    this.audioElements = {};
    this.volume = 0.5;
    this.enabled = true;
    
    // Preload audio elements
    this.preloadSounds();
  }

  // Preload all sound files
  preloadSounds() {
    Object.entries(this.sounds).forEach(([type, src]) => {
      const audio = new Audio(src);
      audio.volume = this.volume;
      audio.preload = 'auto';
      this.audioElements[type] = audio;
    });
  }

  // Play notification sound based on type
  playSound(notificationType) {
    if (!this.enabled) return;

    try {
      const soundType = notificationType || 'default';
      const audio = this.audioElements[soundType] || this.audioElements.default;
      
      if (audio) {
        // Reset audio to beginning
        audio.currentTime = 0;
        audio.volume = this.volume;
        
        // Play the sound
        audio.play().catch(error => {
          console.log('Could not play notification sound:', error);
          this.playFallbackSound();
        });
        
        console.log(`Playing notification sound: ${soundType}`);
      } else {
        this.playFallbackSound();
      }
    } catch (error) {
      console.log('Error playing notification sound:', error);
      this.playFallbackSound();
    }
  }

  // Fallback sound using Web Audio API
  playFallbackSound() {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      // Different frequencies for different notification types
      const frequency = 800; // Default frequency
      oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
      
      console.log('Playing fallback notification sound');
    } catch (error) {
      console.log('Could not play fallback sound:', error);
    }
  }

  // Set volume (0.0 to 1.0)
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    Object.values(this.audioElements).forEach(audio => {
      audio.volume = this.volume;
    });
  }

  // Enable/disable sounds
  setEnabled(enabled) {
    this.enabled = enabled;
  }

  // Test sound
  testSound(type = 'default') {
    this.playSound(type);
  }

  // Get current volume
  getVolume() {
    return this.volume;
  }

  // Check if sounds are enabled
  isEnabled() {
    return this.enabled;
  }
}

// Create singleton instance
const notificationSoundService = new NotificationSoundService();

export default notificationSoundService; 