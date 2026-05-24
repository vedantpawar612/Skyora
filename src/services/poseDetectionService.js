// Pose Detection Service - Real MediaPipe Integration
// Uses react-native-mediapipe + react-native-vision-camera for real-time
// pose landmark detection from the device camera.
//
// The usePoseDetection hook from react-native-mediapipe handles:
//   - Native model loading (pose_landmarker_full.task)
//   - Frame processor creation for Vision Camera
//   - GPU-accelerated inference via MediaPipe
//   - Returning 33 normalized landmarks per frame
//
// This module re-exports the hook and provides helper utilities
// to bridge MediaPipe results into our existing angle/comparison pipeline.
//
// IMPORTANT: We keep landmarks in NORMALIZED [0..1] coordinates because:
//   1. angleCalculator uses direction vectors (scale-invariant)
//   2. SkeletonOverlay already handles normalized→screen conversion

import { usePoseDetection, KnownPoseLandmarks } from 'react-native-mediapipe';
import { RunningMode, Delegate } from 'react-native-mediapipe';
import { calculateAllAngles, LANDMARK_INDICES, SKELETON_CONNECTIONS } from './angleCalculator';
import { comparePose } from './poseComparisonService';

// Path to the bundled MediaPipe model asset
// This references the .task file placed in assets/models/
const POSE_MODEL_ASSET = 'pose_landmarker_full.task';

/**
 * Default options for pose detection
 */
const DEFAULT_POSE_OPTIONS = {
  numPoses: 1,
  minPoseDetectionConfidence: 0.5,
  minPosePresenceConfidence: 0.5,
  minTrackingConfidence: 0.5,
  shouldOutputSegmentationMasks: false,
  delegate: Delegate.GPU,
  mirrorMode: 'mirror-front-only',
  forceOutputOrientation: 'portrait',
  fpsMode: 10, // 10 FPS for detection — good balance of perf and smoothness
};

/**
 * Process raw MediaPipe pose detection results into the format
 * expected by our angle calculator and comparison service.
 *
 * Landmarks are kept in NORMALIZED [0..1] coordinates.
 * The SkeletonOverlay handles the conversion to screen pixels.
 *
 * @param {Object} results - Raw results from usePoseDetection onResults callback
 * @param {Object} viewCoordinator - View coordinator (unused — we keep normalized coords)
 * @param {Object} targetAngles - The ideal pose angles to compare against
 * @returns {Object|null} Processed result with landmarks, angles, and comparison
 */
export function processPoseResults(results, viewCoordinator, targetAngles) {
  if (!results || !results.results || results.results.length === 0) {
    return null;
  }

  const firstPose = results.results[0];

  if (!firstPose.landmarks || firstPose.landmarks.length === 0) {
    return null;
  }

  // MediaPipe returns landmarks as an array of arrays (one per detected person)
  // We take the first person's landmarks
  const rawLandmarks = firstPose.landmarks[0];

  if (!rawLandmarks || rawLandmarks.length < 33) {
    return null;
  }

  // Keep landmarks in normalized [0..1] space
  // Each landmark has {x, y, z, visibility?} where x,y are in [0..1]
  // This is the same format the existing SkeletonOverlay and angleCalculator expect
  const landmarks = rawLandmarks.map((lm) => ({
    x: lm.x,
    y: lm.y,
    z: lm.z || 0,
    visibility: lm.visibility ?? 0.99,
  }));

  // Calculate joint angles from detected landmarks
  const angles = calculateAllAngles(landmarks);

  if (!angles) {
    return null;
  }

  // Compare with target pose if provided
  const comparison = targetAngles ? comparePose(angles, targetAngles) : null;

  return {
    landmarks,
    angles,
    comparison,
    timestamp: Date.now(),
    inferenceTime: results.inferenceTime || 0,
  };
}

/**
 * Hook configuration for pose detection.
 * Returns the model path and default options to pass to usePoseDetection.
 */
export function getPoseDetectionConfig(options = {}) {
  return {
    model: POSE_MODEL_ASSET,
    runningMode: RunningMode.LIVE_STREAM,
    options: {
      ...DEFAULT_POSE_OPTIONS,
      ...options,
    },
  };
}

// Re-export everything downstream consumers need
export {
  usePoseDetection,
  RunningMode,
  Delegate,
  KnownPoseLandmarks,
  LANDMARK_INDICES,
  SKELETON_CONNECTIONS,
};
