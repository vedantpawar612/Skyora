// Landmark Smoother — Exponential Moving Average filter
// Smooths raw MediaPipe landmark positions across frames to reduce jitter
// and produce more stable angle calculations and accuracy readings.

class LandmarkSmoother {
  constructor(alpha = 0.4) {
    // Smoothing factor: 0 = very smooth (laggy), 1 = no smoothing (raw)
    this.alpha = alpha;
    this.previousLandmarks = null;
  }

  /**
   * Apply EMA smoothing to a new set of landmarks.
   * Formula: smoothed = alpha * current + (1 - alpha) * previous
   *
   * @param {Array} landmarks - Array of 33 landmark objects { x, y, z, visibility }
   * @returns {Array} Smoothed landmark array
   */
  smooth(landmarks) {
    if (!landmarks || landmarks.length === 0) {
      return landmarks;
    }

    // First frame — no previous data, return as-is
    if (!this.previousLandmarks || this.previousLandmarks.length !== landmarks.length) {
      this.previousLandmarks = landmarks.map(lm => ({ ...lm }));
      return landmarks;
    }

    const smoothed = landmarks.map((lm, i) => {
      const prev = this.previousLandmarks[i];

      // Only smooth landmarks with sufficient visibility
      if ((lm.visibility ?? 1) < 0.5) {
        return lm;
      }

      // Compute velocity (change in position since last frame)
      const d = Math.sqrt(
        (lm.x - prev.x) ** 2 +
        (lm.y - prev.y) ** 2 +
        ((lm.z || 0) - (prev.z || 0)) ** 2
      );

      // Map velocity to adaptive alpha
      // Small movement (d ~ 0) -> alpha = 0.2 (maximum smoothing, filters jitter)
      // Fast movement (d >= 0.05) -> alpha = 0.85 (minimum smoothing, tracks instantly)
      const velocityScale = Math.min(1.0, d / 0.05);
      const adaptiveAlpha = 0.2 + (0.85 - 0.2) * velocityScale;

      return {
        x: adaptiveAlpha * lm.x + (1 - adaptiveAlpha) * prev.x,
        y: adaptiveAlpha * lm.y + (1 - adaptiveAlpha) * prev.y,
        z: adaptiveAlpha * (lm.z || 0) + (1 - adaptiveAlpha) * (prev.z || 0),
        visibility: lm.visibility,
      };
    });

    // Store for next frame
    this.previousLandmarks = smoothed.map(lm => ({ ...lm }));

    return smoothed;
  }

  /**
   * Reset the smoother (call when session starts/ends).
   */
  reset() {
    this.previousLandmarks = null;
  }

  /**
   * Update the smoothing factor.
   * @param {number} alpha - New alpha value (0-1)
   */
  setAlpha(alpha) {
    this.alpha = Math.max(0.1, Math.min(1.0, alpha));
  }
}

export default LandmarkSmoother;
