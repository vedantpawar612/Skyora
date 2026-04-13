// Text-to-Speech Service for real-time voice feedback
import * as Speech from 'expo-speech';

class TTSService {
  constructor() {
    this.isSpeaking = false;
    this.lastSpokenMessage = '';
    this.lastSpeakTime = 0;
    this.cooldownMs = 5000; // 5 seconds between same message
    this.minIntervalMs = 2500; // 2.5 seconds between any messages
    this.enabled = true;
    this.speechRate = 0.95;
    this.speechPitch = 1.0;
    this.language = 'en-US';
  }

  /**
   * Speak a feedback message with cooldown logic
   * Prevents repetitive/overlapping speech
   */
  async speak(message) {
    if (!this.enabled || !message) return;

    const now = Date.now();

    // Don't interrupt if still speaking
    if (this.isSpeaking) return;

    // Don't repeat the same message within cooldown
    if (message === this.lastSpokenMessage && 
        now - this.lastSpeakTime < this.cooldownMs) {
      return;
    }

    // Enforce minimum interval between any messages
    if (now - this.lastSpeakTime < this.minIntervalMs) return;

    try {
      this.isSpeaking = true;
      this.lastSpokenMessage = message;
      this.lastSpeakTime = now;

      await Speech.speak(message, {
        language: this.language,
        rate: this.speechRate,
        pitch: this.speechPitch,
        onDone: () => {
          this.isSpeaking = false;
        },
        onError: () => {
          this.isSpeaking = false;
        },
      });
    } catch (error) {
      this.isSpeaking = false;
      console.warn('TTS Error:', error);
    }
  }

  /**
   * Speak encouragement based on accuracy
   */
  speakEncouragement(accuracy) {
    if (accuracy >= 90) {
      this.speak('Perfect form! Hold this position.');
    } else if (accuracy >= 80) {
      this.speak('Great job! Almost perfect.');
    } else if (accuracy >= 70) {
      this.speak('Good progress! Make small adjustments.');
    }
  }

  /**
   * Speak session start
   */
  speakSessionStart(poseName) {
    this.speak(`Starting ${poseName}. Follow the instructions on screen.`);
  }

  /**
   * Speak session end
   */
  speakSessionEnd(accuracy) {
    this.speak(`Session complete! Your accuracy was ${accuracy} percent.`);
  }

  /**
   * Stop any ongoing speech
   */
  async stop() {
    try {
      await Speech.stop();
      this.isSpeaking = false;
    } catch (error) {
      console.warn('TTS Stop Error:', error);
    }
  }

  /**
   * Toggle TTS on/off
   */
  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stop();
    }
    return this.enabled;
  }

  /**
   * Set speech rate
   */
  setRate(rate) {
    this.speechRate = Math.max(0.5, Math.min(2.0, rate));
  }

  /**
   * Dispose / cleanup
   */
  dispose() {
    this.stop();
    this.isSpeaking = false;
  }
}

export default new TTSService();
