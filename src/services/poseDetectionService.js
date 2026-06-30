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

import { usePoseDetection, KnownPoseLandmarks, MediapipeCamera } from 'react-native-mediapipe';
import { RunningMode, Delegate } from 'react-native-mediapipe';
import { Platform, Dimensions } from 'react-native';
import { calculateAllAngles, LANDMARK_INDICES, SKELETON_CONNECTIONS } from './angleCalculator';
import { comparePose } from './poseComparisonService';
import LandmarkSmoother from './landmarkSmoother';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Path to the bundled MediaPipe model asset
// This references the .task file placed in assets/models/
const POSE_MODEL_ASSET = 'pose_landmarker_full.task';

// Singleton landmark smoother for the detection pipeline
const landmarkSmoother = new LandmarkSmoother(0.4);

// Throttle debug logging so we don't flood the console
let _lastLogTime = 0;
const DEBUG_LOG_INTERVAL_MS = 3000; // Log at most once every 3 seconds

function debugLog(...args) {
  const now = Date.now();
  if (now - _lastLogTime > DEBUG_LOG_INTERVAL_MS) {
    _lastLogTime = now;
    console.log('[PoseDetection]', ...args);
  }
}

/**
 * Default options for pose detection
 * NOTE: These must remain a stable reference to prevent the usePoseDetection
 * hook from tearing down and recreating the native detector.
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
 * Extract raw landmark array from the native MediaPipe results payload.
 *
 * react-native-mediapipe's native event emitter passes the raw event `args`
 * to the onResults callback. The structure may vary slightly between versions,
 * so we try multiple known paths:
 *
 *   Path A:  args.results[0].landmarks[0]   (array of pose results, each with landmarks array)
 *   Path B:  args.landmarks[0]              (direct landmarks array on args)
 *   Path C:  args.landmarks                 (landmarks is already the flat array)
 *
 * @param {Object} results - Raw args from the onResults native event callback
 * @returns {Array|null} Array of 33 landmark objects, or null if not found
 */
function extractLandmarks(results) {
  if (!results) return null;

  // Path A: results.results[i].landmarks[0]
  if (results.results && Array.isArray(results.results) && results.results.length > 0) {
    const firstPose = results.results[0];
    if (firstPose && firstPose.landmarks) {
      if (Array.isArray(firstPose.landmarks) && firstPose.landmarks.length > 0) {
        const lm = firstPose.landmarks[0];
        if (Array.isArray(lm) && lm.length >= 33) {
          debugLog('Landmarks found via Path A (results.results[0].landmarks[0]), count:', lm.length);
          return lm;
        }
        // Maybe landmarks[0] is already the individual landmark object (not nested)
        if (Array.isArray(firstPose.landmarks) && firstPose.landmarks.length >= 33) {
          debugLog('Landmarks found via Path A-flat (results.results[0].landmarks), count:', firstPose.landmarks.length);
          return firstPose.landmarks;
        }
      }
    }
  }

  // Path B: results.landmarks[0] (landmarks is array of arrays)
  if (results.landmarks && Array.isArray(results.landmarks) && results.landmarks.length > 0) {
    const lm = results.landmarks[0];
    if (Array.isArray(lm) && lm.length >= 33) {
      debugLog('Landmarks found via Path B (results.landmarks[0]), count:', lm.length);
      return lm;
    }
    // Path C: results.landmarks is already a flat array of landmark objects
    if (results.landmarks.length >= 33 && typeof results.landmarks[0] === 'object' && 'x' in results.landmarks[0]) {
      debugLog('Landmarks found via Path C (results.landmarks flat), count:', results.landmarks.length);
      return results.landmarks;
    }
  }

  // Debug: log the keys of the results object to understand the structure
  debugLog('No landmarks found. Results keys:', Object.keys(results));
  if (results.results && Array.isArray(results.results) && results.results.length > 0) {
    debugLog('results.results[0] keys:', Object.keys(results.results[0]));
    if (results.results[0].landmarks) {
      debugLog('results.results[0].landmarks type:', typeof results.results[0].landmarks,
        'isArray:', Array.isArray(results.results[0].landmarks),
        'length:', results.results[0].landmarks?.length);
      if (Array.isArray(results.results[0].landmarks) && results.results[0].landmarks.length > 0) {
        debugLog('results.results[0].landmarks[0] type:', typeof results.results[0].landmarks[0],
          'isArray:', Array.isArray(results.results[0].landmarks[0]));
      }
    }
  }

  return null;
}

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
 * @param {Object} [jointWeights] - Optional per-joint importance weights
 * @returns {Object|null} Processed result with landmarks, angles, and comparison
 */
export function processPoseResults(results, viewCoordinator, targetAngles, jointWeights = null, tolerances = null) {
  const rawLandmarks = extractLandmarks(results);

  if (!rawLandmarks) {
    return null;
  }

  const frameDims = {
    width: results.inputImageWidth || 640,
    height: results.inputImageHeight || 480,
  };

  // Convert raw landmarks to screen space using the view coordinator
  // to resolve native orientation, rotation, and aspect ratio.
  const landmarks = rawLandmarks.map((lm) => {
    if (viewCoordinator && typeof viewCoordinator.convertPoint === 'function') {
      const converted = viewCoordinator.convertPoint(frameDims, { x: lm.x, y: lm.y });
      // Scale z by viewSize width to maintain uniform 3D proportions in screen pixels
      const zScale = viewCoordinator.viewSize?.width || SCREEN_WIDTH;
      return {
        x: converted.x,
        y: converted.y,
        z: (lm.z || 0) * zScale,
        visibility: lm.visibility ?? 0.99,
      };
    }
    return {
      x: lm.x,
      y: lm.y,
      z: lm.z || 0,
      visibility: lm.visibility ?? 0.99,
    };
  });

  // Apply EMA smoothing to reduce jitter
  const smoothedLandmarks = landmarkSmoother.smooth(landmarks);

  // Calculate joint angles from detected landmarks
  const angles = calculateAllAngles(smoothedLandmarks);

  // Compare with target pose if provided (now with optional weights and tolerances)
  // NOTE: comparison may be null if angles couldn't be computed,
  // but we still return landmarks so the skeleton can draw.
  const comparison = (angles && targetAngles)
    ? comparePose(angles, targetAngles, jointWeights, tolerances)
    : null;

  if (angles) {
    debugLog('Pose processed — accuracy:', comparison?.overallAccuracy, '%, angles:', JSON.stringify(angles).substring(0, 100));
  } else {
    debugLog('Landmarks found but angles could not be computed');
  }

  return {
    landmarks: smoothedLandmarks,
    angles,
    comparison,
    timestamp: Date.now(),
    inferenceTime: results.inferenceTime || 0,
  };
}

/**
 * Reset the landmark smoother (call when session starts/ends).
 */
export function resetSmoother() {
  landmarkSmoother.reset();
}

/**
 * Hook configuration for pose detection.
 * Returns the model path and default options to pass to usePoseDetection.
 *
 * IMPORTANT: The returned options object must be referentially stable
 * to prevent the usePoseDetection hook from tearing down and recreating
 * the native detector on every render.
 */
export function getPoseDetectionConfig(overrides = {}) {
  return {
    model: POSE_MODEL_ASSET,
    runningMode: RunningMode.LIVE_STREAM,
    options: {
      ...DEFAULT_POSE_OPTIONS,
      ...overrides,
    },
  };
}

// Re-export everything downstream consumers need
export {
  usePoseDetection,
  RunningMode,
  Delegate,
  KnownPoseLandmarks,
  MediapipeCamera,
  LANDMARK_INDICES,
  SKELETON_CONNECTIONS,
};
