// Text-to-Speech Service for real-time voice feedback
// Supports guided instruction phase and active correction phase
import * as Speech from 'expo-speech';

class TTSService {
  constructor() {
    this.isSpeaking = false;
    this.lastSpokenMessage = '';
    this.lastSpeakTime = 0;
    this.sameMsgCooldownMs = 5000;   // 5s between same message
    this.diffMsgCooldownMs = 2000;   // 2s between different messages
    this.enabled = true;
    this.speechRate = 0.95;
    this.speechPitch = 1.0;
    this.language = 'en-US';

    // Message queue — stores the most recent pending message
    // so important corrections aren't silently dropped
    this._pendingMessage = null;
    this._queueTimer = null;
  }

  /**
   * Speak a feedback message with cooldown logic and queueing.
   * If currently speaking or in cooldown, queues the message
   * and speaks it when ready.
   */
  async speak(message) {
    if (!this.enabled || !message) return;

    const now = Date.now();

    // Don't interrupt if still speaking — queue instead
    if (this.isSpeaking) {
      this._queueMessage(message);
      return;
    }

    // Cooldown check
    const cooldown = message === this.lastSpokenMessage
      ? this.sameMsgCooldownMs
      : this.diffMsgCooldownMs;

    if (now - this.lastSpeakTime < cooldown) {
      this._queueMessage(message);
      return;
    }

    this._doSpeak(message);
  }

  /**
   * Speak a guided setup instruction (slower, clearer).
   * Used during the preparation phase before detection starts.
   */
  async speakInstruction(instruction) {
    if (!this.enabled || !instruction) return;

    // Stop any current speech first
    await this.stop();

    // Use a slightly slower rate for clarity
    const prevRate = this.speechRate;
    this.speechRate = 0.85;
    await this._doSpeak(instruction);
    this.speechRate = prevRate;
  }

  /**
   * Speak the most critical joint correction.
   * Uses adaptive cooldown — shorter when accuracy is very low.
   */
  async speakCorrection(message, accuracy) {
    if (!this.enabled || !message) return;

    const now = Date.now();

    // Adaptive cooldown: speak more frequently when user needs more help
    let cooldown = this.diffMsgCooldownMs;
    if (accuracy < 40) {
      cooldown = 1500; // More urgent
    } else if (accuracy < 60) {
      cooldown = 2000;
    } else if (accuracy >= 80) {
      cooldown = 4000; // Less frequent when doing well
    }

    if (this.isSpeaking) {
      this._queueMessage(message);
      return;
    }

    // Same-message cooldown always applies
    if (message === this.lastSpokenMessage && now - this.lastSpeakTime < this.sameMsgCooldownMs) {
      return;
    }

    if (now - this.lastSpeakTime < cooldown) {
      this._queueMessage(message);
      return;
    }

    this._doSpeak(message);
  }

  /**
   * Announce a phase transition (e.g., starting detection).
   */
  async speakPhaseTransition(message) {
    if (!this.enabled || !message) return;
    await this.stop();
    await this._doSpeak(message);
  }

  /**
   * Speak session start announcement.
   */
  speakSessionStart(poseName) {
    this.speakPhaseTransition(`Let's practice ${poseName}. Follow the instructions to get into position.`);
  }

  /**
   * Speak session end announcement.
   */
  speakSessionEnd(accuracy) {
    this.speakPhaseTransition(`Session complete! Your accuracy was ${accuracy} percent.`);
  }

  /**
   * Speak encouragement based on accuracy level.
   */
  speakEncouragement(accuracy) {
    if (accuracy >= 90) {
      this.speak('Perfect form! Hold this position.');
    } else if (accuracy >= 80) {
      this.speak('Great job! Almost perfect.');
    } else if (accuracy >= 70) {
      this.speak('Good progress! Make small adjustments.');
    } else if (accuracy >= 50) {
      this.speak('Keep trying! Follow the corrections.');
    }
  }

  /**
   * Stop any ongoing speech and clear the queue.
   */
  async stop() {
    try {
      await Speech.stop();
    } catch (error) {
      console.warn('TTS Stop Error:', error);
    }
    this.isSpeaking = false;
    this._pendingMessage = null;
    if (this._queueTimer) {
      clearTimeout(this._queueTimer);
      this._queueTimer = null;
    }
  }

  /**
   * Toggle TTS on/off.
   */
  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.stop();
    }
    return this.enabled;
  }

  /**
   * Set speech rate.
   */
  setRate(rate) {
    this.speechRate = Math.max(0.5, Math.min(2.0, rate));
  }

  /**
   * Dispose / cleanup.
   */
  dispose() {
    this.stop();
    this.isSpeaking = false;
  }

  // ─── Internal Methods ───

  /**
   * Actually perform the speech.
   */
  async _doSpeak(message) {
    try {
      this.isSpeaking = true;
      this.lastSpokenMessage = message;
      this.lastSpeakTime = Date.now();

      await Speech.speak(message, {
        language: this.language,
        rate: this.speechRate,
        pitch: this.speechPitch,
        onDone: () => {
          this.isSpeaking = false;
          this._processQueue();
        },
        onError: () => {
          this.isSpeaking = false;
          this._processQueue();
        },
      });
    } catch (error) {
      this.isSpeaking = false;
      console.warn('TTS Error:', error);
    }
  }

  /**
   * Queue a message (keeps only the most recent).
   */
  _queueMessage(message) {
    this._pendingMessage = message;

    // Set a timer to process the queue after cooldown
    if (!this._queueTimer) {
      this._queueTimer = setTimeout(() => {
        this._queueTimer = null;
        this._processQueue();
      }, this.diffMsgCooldownMs);
    }
  }

  /**
   * Process the queued message if available and not speaking.
   */
  _processQueue() {
    if (this.isSpeaking || !this._pendingMessage || !this.enabled) return;

    const msg = this._pendingMessage;
    this._pendingMessage = null;

    // Don't repeat same message
    if (msg === this.lastSpokenMessage && Date.now() - this.lastSpeakTime < this.sameMsgCooldownMs) {
      return;
    }

    this._doSpeak(msg);
  }
}

export default new TTSService();
