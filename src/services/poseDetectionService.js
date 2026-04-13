// Pose Detection Service
// Handles camera frame processing and landmark detection
// This module provides the integration layer for pose detection.
// On real devices, it uses expo-camera. The angle calculation and 
// comparison logic is fully functional. For demo purposes without
// a native build, simulated landmarks can be generated.

import { calculateAllAngles, LANDMARK_INDICES, SKELETON_CONNECTIONS } from './angleCalculator';
import { comparePose } from './poseComparisonService';

class PoseDetectionService {
  constructor() {
    this.isRunning = false;
    this.onResultCallback = null;
    this.frameCount = 0;
    this.lastProcessTime = 0;
    this.processIntervalMs = 100; // Process every 100ms (10 FPS for detection)
  }

  /**
   * Start pose detection
   * @param {Function} onResult - Callback receiving { landmarks, angles, comparison }
   */
  start(onResult) {
    this.isRunning = true;
    this.onResultCallback = onResult;
    this.frameCount = 0;
  }

  /**
   * Stop pose detection
   */
  stop() {
    this.isRunning = false;
    this.onResultCallback = null;
  }

  /**
   * Process a camera frame
   * @param {Object} frame - Camera frame data
   * @param {Object} targetAngles - Ideal pose angles for comparison
   * @returns {Object|null} Detection results
   */
  processFrame(landmarks, targetAngles) {
    if (!this.isRunning) return null;

    const now = Date.now();
    if (now - this.lastProcessTime < this.processIntervalMs) return null;
    this.lastProcessTime = now;
    this.frameCount++;

    if (!landmarks || landmarks.length < 33) return null;

    // Calculate joint angles from landmarks
    const angles = calculateAllAngles(landmarks);

    // Compare with target pose
    const comparison = comparePose(angles, targetAngles);

    const result = {
      landmarks,
      angles,
      comparison,
      frameCount: this.frameCount,
      timestamp: now,
    };

    if (this.onResultCallback) {
      this.onResultCallback(result);
    }

    return result;
  }

  /**
   * Generate simulated landmarks for demo/testing
   * Creates landmarks that slowly drift toward the target pose
   * @param {Object} targetAngles - Target pose angles
   * @param {number} progress - 0-1 how close to perfect (for simulation)
   * @returns {Array} Simulated 33-point landmarks
   */
  generateDemoLandmarks(targetAngles, progress = 0.7) {
    // Base skeleton positioned in center of frame
    const centerX = 0.5;
    const centerY = 0.4;
    const scale = 0.15;

    // Create a basic human figure with 33 points
    const baseLandmarks = [
      // 0: NOSE
      { x: centerX, y: centerY - scale * 2.5, z: 0, visibility: 0.99 },
      // 1: LEFT_EYE_INNER
      { x: centerX - 0.01, y: centerY - scale * 2.6, z: 0, visibility: 0.98 },
      // 2: LEFT_EYE
      { x: centerX - 0.02, y: centerY - scale * 2.6, z: 0, visibility: 0.98 },
      // 3: LEFT_EYE_OUTER
      { x: centerX - 0.03, y: centerY - scale * 2.6, z: 0, visibility: 0.97 },
      // 4: RIGHT_EYE_INNER
      { x: centerX + 0.01, y: centerY - scale * 2.6, z: 0, visibility: 0.98 },
      // 5: RIGHT_EYE
      { x: centerX + 0.02, y: centerY - scale * 2.6, z: 0, visibility: 0.98 },
      // 6: RIGHT_EYE_OUTER
      { x: centerX + 0.03, y: centerY - scale * 2.6, z: 0, visibility: 0.97 },
      // 7: LEFT_EAR
      { x: centerX - 0.04, y: centerY - scale * 2.5, z: 0, visibility: 0.90 },
      // 8: RIGHT_EAR
      { x: centerX + 0.04, y: centerY - scale * 2.5, z: 0, visibility: 0.90 },
      // 9: MOUTH_LEFT
      { x: centerX - 0.01, y: centerY - scale * 2.3, z: 0, visibility: 0.95 },
      // 10: MOUTH_RIGHT
      { x: centerX + 0.01, y: centerY - scale * 2.3, z: 0, visibility: 0.95 },
      // 11: LEFT_SHOULDER
      { x: centerX - scale * 1.2, y: centerY - scale * 1.5, z: 0, visibility: 0.99 },
      // 12: RIGHT_SHOULDER
      { x: centerX + scale * 1.2, y: centerY - scale * 1.5, z: 0, visibility: 0.99 },
      // 13: LEFT_ELBOW
      { x: centerX - scale * 1.5, y: centerY - scale * 0.5, z: 0, visibility: 0.95 },
      // 14: RIGHT_ELBOW
      { x: centerX + scale * 1.5, y: centerY - scale * 0.5, z: 0, visibility: 0.95 },
      // 15: LEFT_WRIST
      { x: centerX - scale * 1.3, y: centerY + scale * 0.3, z: 0, visibility: 0.92 },
      // 16: RIGHT_WRIST
      { x: centerX + scale * 1.3, y: centerY + scale * 0.3, z: 0, visibility: 0.92 },
      // 17: LEFT_PINKY
      { x: centerX - scale * 1.35, y: centerY + scale * 0.5, z: 0, visibility: 0.85 },
      // 18: RIGHT_PINKY
      { x: centerX + scale * 1.35, y: centerY + scale * 0.5, z: 0, visibility: 0.85 },
      // 19: LEFT_INDEX
      { x: centerX - scale * 1.25, y: centerY + scale * 0.5, z: 0, visibility: 0.88 },
      // 20: RIGHT_INDEX
      { x: centerX + scale * 1.25, y: centerY + scale * 0.5, z: 0, visibility: 0.88 },
      // 21: LEFT_THUMB
      { x: centerX - scale * 1.2, y: centerY + scale * 0.4, z: 0, visibility: 0.87 },
      // 22: RIGHT_THUMB
      { x: centerX + scale * 1.2, y: centerY + scale * 0.4, z: 0, visibility: 0.87 },
      // 23: LEFT_HIP
      { x: centerX - scale * 0.7, y: centerY + scale * 1.0, z: 0, visibility: 0.99 },
      // 24: RIGHT_HIP
      { x: centerX + scale * 0.7, y: centerY + scale * 1.0, z: 0, visibility: 0.99 },
      // 25: LEFT_KNEE
      { x: centerX - scale * 0.8, y: centerY + scale * 3.0, z: 0, visibility: 0.97 },
      // 26: RIGHT_KNEE
      { x: centerX + scale * 0.8, y: centerY + scale * 3.0, z: 0, visibility: 0.97 },
      // 27: LEFT_ANKLE
      { x: centerX - scale * 0.8, y: centerY + scale * 5.0, z: 0, visibility: 0.95 },
      // 28: RIGHT_ANKLE
      { x: centerX + scale * 0.8, y: centerY + scale * 5.0, z: 0, visibility: 0.95 },
      // 29: LEFT_HEEL
      { x: centerX - scale * 0.9, y: centerY + scale * 5.2, z: 0, visibility: 0.90 },
      // 30: RIGHT_HEEL
      { x: centerX + scale * 0.9, y: centerY + scale * 5.2, z: 0, visibility: 0.90 },
      // 31: LEFT_FOOT_INDEX
      { x: centerX - scale * 0.7, y: centerY + scale * 5.3, z: 0, visibility: 0.88 },
      // 32: RIGHT_FOOT_INDEX
      { x: centerX + scale * 0.7, y: centerY + scale * 5.3, z: 0, visibility: 0.88 },
    ];

    // Add slight randomness plus convergence toward target
    const jitter = (1 - progress) * 0.02;
    return baseLandmarks.map(p => ({
      x: p.x + (Math.random() - 0.5) * jitter,
      y: p.y + (Math.random() - 0.5) * jitter,
      z: p.z,
      visibility: p.visibility,
    }));
  }

  /**
   * Dispose resources
   */
  dispose() {
    this.stop();
  }
}

export default new PoseDetectionService();
export { LANDMARK_INDICES, SKELETON_CONNECTIONS };
