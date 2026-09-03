// Session Storage Service — Persists AI yoga training sessions locally
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@skyora_session_history';

/**
 * Save a completed session report to local storage.
 * @param {Object} report - The session report object from CameraSessionScreen
 * @returns {Promise<Object>} The saved session record with id and timestamp
 */
export async function saveSessionRecord(report) {
  try {
    const existing = await getSessionHistory();
    const newRecord = {
      id: `session_${Date.now()}`,
      poseId: report.pose?.id || 'unknown',
      poseName: report.pose?.name || 'Yoga Pose',
      accuracy: report.avgAccuracy || 0,
      finalPoseAccuracy: report.finalPoseAccuracy || 0,
      startingAccuracy: report.startingAccuracy || 0,
      peakAccuracy: report.peakAccuracy || 0,
      duration: report.sessionDuration || 0,
      totalReadings: report.totalReadings || 0,
      timestamp: new Date().toISOString(),
      jointBreakdown: report.jointBreakdown || {},
      accuracyTimeline: report.accuracyTimeline || [],
      jointFeedbackCount: report.jointFeedbackCount || {},
    };

    // Prepend new session (keep up to 100 recent sessions)
    const updated = [newRecord, ...existing].slice(0, 100);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return newRecord;
  } catch (err) {
    console.warn('[SessionStorage] Error saving session record:', err);
    return null;
  }
}

/**
 * Retrieve all saved session records.
 * @returns {Promise<Array>} Array of session records (newest first)
 */
export async function getSessionHistory() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn('[SessionStorage] Error loading session history:', err);
    return [];
  }
}

/**
 * Clear all saved session history.
 */
export async function clearSessionHistory() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.warn('[SessionStorage] Error clearing session history:', err);
  }
}
