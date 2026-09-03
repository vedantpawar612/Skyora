// Camera Session Screen - Real-time pose detection with AI feedback
// Uses react-native-mediapipe + react-native-vision-camera for live
// pose landmark detection with GPU-accelerated MediaPipe inference.
//
// 3-PHASE SESSION FLOW:
//   Phase 1: GUIDED_SETUP  — Step-by-step voice instructions to get into pose
//   Phase 2: COUNTDOWN     — 3-2-1 countdown before detection starts
//   Phase 3: ACTIVE        — Real-time accuracy tracking with voice corrections
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  Dimensions, Animated, Platform, ScrollView,
} from 'react-native';
let useCameraPermission = () => ({ hasPermission: true, requestPermission: async () => true });

if (Platform.OS !== 'web') {
  try {
    const vc = require('react-native-vision-camera');
    useCameraPermission = vc.useCameraPermission;
  } catch (e) {
    console.warn('[CameraSession] Vision Camera not available:', e.message);
  }
}
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING } from '../config/theme';
import SkeletonOverlay from '../components/SkeletonOverlay';
import FeedbackOverlay from '../components/FeedbackOverlay';
import GradientButton from '../components/GradientButton';
import {
  usePoseDetection,
  RunningMode,
  Delegate,
  processPoseResults,
  resetSmoother,
  getPoseDetectionConfig,
  MediapipeCamera,
} from '../services/poseDetectionService';
import ttsService from '../services/ttsService';
import { generateSessionId } from '../utils/helpers';
import { ROUTES } from '../config/navigation';

// ── Session phases ──
const PHASE = {
  PRE_SESSION: 'pre_session',     // Before starting: shows steps card + camera preview
  COUNTDOWN: 'countdown',         // 3-2-1 countdown
  ACTIVE: 'active',               // Live detection and accuracy tracking
  COMPLETE: 'complete',           // Session results
};

// ── Stable config created ONCE at module level ──
// This prevents the usePoseDetection hook from tearing down and
// recreating the native MediaPipe detector on every component render.
const STABLE_POSE_CONFIG = getPoseDetectionConfig({
  delegate: Delegate.GPU,
  fpsMode: 15,
});
const STABLE_RUNNING_MODE = STABLE_POSE_CONFIG.runningMode;
const STABLE_MODEL = STABLE_POSE_CONFIG.model;
const STABLE_OPTIONS = STABLE_POSE_CONFIG.options;

const { width, height } = Dimensions.get('window');

const CameraSessionScreen = ({ route, navigation }) => {
  const { pose } = route.params;

  // Camera permission
  const { hasPermission, requestPermission } = useCameraPermission();

  // Session state
  const [sessionPhase, setSessionPhase] = useState(PHASE.PRE_SESSION);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [landmarks, setLandmarks] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [accuracy, setAccuracy] = useState(0);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [showAngles, setShowAngles] = useState(false);
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const [isModelReady, setIsModelReady] = useState(false);
  const [poseError, setPoseError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('Waiting for detection...');
  const [noDetectionMsg, setNoDetectionMsg] = useState('');
  const [cameraFacing, setCameraFacing] = useState(pose.cameraHint === 'side' ? 'back' : 'front');

  // Guided setup state
  const [currentInstructionIndex, setCurrentInstructionIndex] = useState(0);
  const setupInstructions = pose.setupInstructions || pose.instructions || [];

  // Countdown state
  const [countdownValue, setCountdownValue] = useState(3);

  const timerRef = useRef(null);
  const accuracyHistory = useRef([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sessionId = useRef(generateSessionId());
  const sessionPhaseRef = useRef(PHASE.PRE_SESSION);
  const ttsEnabledRef = useRef(ttsEnabled);
  const targetAnglesRef = useRef(pose.targetAngles);
  const jointWeightsRef = useRef(pose.jointWeights || null);
  const tolerancesRef = useRef(pose.angleTolerance || null);
  const customFeedbackRef = useRef(pose.customFeedback || null);
  const accuracyRef = useRef(0);
  const resultCountRef = useRef(0);
  const lastResultTimeRef = useRef(0);
  const noDetectionTimerRef = useRef(null);
  const instructionTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const jointAccuracyHistoryRef = useRef({});   // { leftElbow: [acc1, acc2, ...], ... }
  const jointFeedbackCountRef = useRef({});      // { leftElbow: { tooSmall: 5, tooBig: 0 }, ... }

  // Keep refs in sync with state
  useEffect(() => { ttsEnabledRef.current = ttsEnabled; }, [ttsEnabled]);
  useEffect(() => { targetAnglesRef.current = pose.targetAngles; }, [pose.targetAngles]);
  useEffect(() => { jointWeightsRef.current = pose.jointWeights || null; }, [pose.jointWeights]);
  useEffect(() => { tolerancesRef.current = pose.angleTolerance || null; }, [pose.angleTolerance]);
  useEffect(() => { customFeedbackRef.current = pose.customFeedback || null; }, [pose.customFeedback]);
  useEffect(() => { sessionPhaseRef.current = sessionPhase; }, [sessionPhase]);

  // ── No-detection watchdog ──
  // MediaPipe's native code calls onEmpty() (no JS event) when it
  // cannot find a body in the frame.  This timer detects that silence
  // and shows a helpful message asking the user to step back.
  const startNoDetectionWatchdog = useCallback(() => {
    if (noDetectionTimerRef.current) clearInterval(noDetectionTimerRef.current);
    noDetectionTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - lastResultTimeRef.current;
      if (elapsed > 3000) {
        setNoDetectionMsg('Step back so your full body is visible in the camera');
        setDebugInfo(`⏳ No pose detected for ${Math.round(elapsed / 1000)}s`);
      }
    }, 2000);
  }, []);

  const stopNoDetectionWatchdog = useCallback(() => {
    if (noDetectionTimerRef.current) {
      clearInterval(noDetectionTimerRef.current);
      noDetectionTimerRef.current = null;
    }
  }, []);

  // ── Stable callbacks using refs (never changes reference) ──
  const poseCallbacks = useMemo(() => ({
    onResults: (results, viewCoordinator) => {
      resultCountRef.current += 1;
      lastResultTimeRef.current = Date.now();

      // Clear the no-detection message since we got results
      setNoDetectionMsg('');

      // Log first few results for debugging
      if (resultCountRef.current <= 5) {
        const keys = results ? Object.keys(results) : 'null';
        console.log(`[CameraSession] onResults #${resultCountRef.current}, keys:`, keys);
        if (results) {
          console.log(`[CameraSession] results structure:`, JSON.stringify(results).substring(0, 300));
        }
      }

      const processed = processPoseResults(
        results,
        viewCoordinator,
        targetAnglesRef.current,
        jointWeightsRef.current,
        tolerancesRef.current,
        customFeedbackRef.current,
      );

      if (processed) {
        if (resultCountRef.current <= 5) {
          console.log(`[CameraSession] Pose processed! landmarks: ${processed.landmarks?.length}, accuracy: ${processed.comparison?.overallAccuracy}%`);
        }

        setLandmarks(processed.landmarks);

        // ONLY calculate and track accuracy during ACTIVE detection phase (after steps are shown)
        if (sessionPhaseRef.current === PHASE.ACTIVE) {
          const rawAccuracy = processed.comparison?.overallAccuracy || 0;
          // Smooth displayed accuracy (Fix 7)
          const smoothedAccuracy = Math.round(
            0.3 * rawAccuracy + 0.7 * (accuracyRef.current || rawAccuracy)
          );
          accuracyRef.current = smoothedAccuracy;

          setComparison(processed.comparison);
          setAccuracy(smoothedAccuracy);
          setDebugInfo(`✅ #${resultCountRef.current} | LM:${processed.landmarks?.length} | Acc:${smoothedAccuracy || '-'}%`);

          accuracyHistory.current.push(smoothedAccuracy);

          // Track per-joint accuracy for the session report
          if (processed.comparison?.jointResults) {
            for (const [jointName, result] of Object.entries(processed.comparison.jointResults)) {
              if (!jointAccuracyHistoryRef.current[jointName]) {
                jointAccuracyHistoryRef.current[jointName] = [];
              }
              jointAccuracyHistoryRef.current[jointName].push(result.accuracy);
            }
          }

          // Track feedback frequency per joint for improvement tips
          if (processed.comparison?.allFeedback) {
            for (const fb of processed.comparison.allFeedback) {
              if (!jointFeedbackCountRef.current[fb.joint]) {
                jointFeedbackCountRef.current[fb.joint] = { tooSmall: 0, tooBig: 0 };
              }
              jointFeedbackCountRef.current[fb.joint][fb.direction]++;
            }
          }

          // Use the new speakCorrection method with adaptive cooldown
          if (ttsEnabledRef.current && processed.comparison?.primaryFeedback) {
            ttsService.speakCorrection(
              processed.comparison.primaryFeedback,
              smoothedAccuracy,
            );
          }
        } else {
          // Pre-session or countdown: keep accuracy 0, do not evaluate score
          setComparison(null);
          setAccuracy(0);
          accuracyRef.current = 0;
          setDebugInfo(`⏳ Positioning body... (#${resultCountRef.current})`);
        }
      } else {
        if (resultCountRef.current <= 10) {
          console.log(`[CameraSession] onResults #${resultCountRef.current}: processPoseResults returned null`);
        }
        setDebugInfo(`❌ #${resultCountRef.current} | null result`);
      }
    },
    onError: (error) => {
      console.warn('[CameraSession] Pose detection error:', error);
      const errMsg = typeof error === 'string' ? error : error?.message || JSON.stringify(error);
      setPoseError(errMsg);
      setDebugInfo(`⚠️ ERROR: ${errMsg}`);
    },
  }), []); // Empty deps — uses refs for latest values

  // Initialize MediaPipe pose detection hook with STABLE references
  const poseDetection = usePoseDetection(
    poseCallbacks,
    STABLE_RUNNING_MODE,
    STABLE_MODEL,
    STABLE_OPTIONS,
  );

  // Track model readiness — the frame processor exists even before
  // the detector handle is set, so we also log to confirm
  useEffect(() => {
    if (poseDetection.frameProcessor) {
      console.log('[CameraSession] Frame processor available');
      setIsModelReady(true);
    }
  }, [poseDetection.frameProcessor]);

  useEffect(() => {
    console.log('[CameraSession] Component MOUNTED');
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    return () => {
      console.log('[CameraSession] Component UNMOUNTING');
      cleanupTimers();
      ttsService.dispose();
      resetSmoother();
    };
  }, []);

  // ── Cleanup all timers ──
  const cleanupTimers = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (instructionTimerRef.current) { clearTimeout(instructionTimerRef.current); instructionTimerRef.current = null; }
    if (countdownTimerRef.current) { clearInterval(countdownTimerRef.current); countdownTimerRef.current = null; }
    stopNoDetectionWatchdog();
  }, [stopNoDetectionWatchdog]);

  // ── Start Practice (After steps are shown, straight to countdown) ──
  const startPractice = useCallback(() => {
    resetSmoother();
    resultCountRef.current = 0;
    accuracyRef.current = 0;
    setAccuracy(0);
    setNoDetectionMsg('');
    accuracyHistory.current = [];
    jointAccuracyHistoryRef.current = {};
    jointFeedbackCountRef.current = {};

    startNoDetectionWatchdog();
    startCountdown();
  }, [startNoDetectionWatchdog, startCountdown]);

  // ── Countdown Phase (3-2-1) ──
  const startCountdown = useCallback(() => {
    setSessionPhase(PHASE.COUNTDOWN);
    setCountdownValue(3);

    let count = 3;
    countdownTimerRef.current = setInterval(() => {
      count -= 1;
      if (count <= 0) {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        startActiveDetection();
      } else {
        setCountdownValue(count);
      }
    }, 1000);
  }, [startActiveDetection]);

  // ── PHASE 3: Active Detection ──
  const startActiveDetection = useCallback(() => {
    setSessionPhase(PHASE.ACTIVE);
    setSessionDuration(0);
    accuracyHistory.current = [];

    timerRef.current = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);
  }, []);

  // ── End Session ──
  const endSession = useCallback(() => {
    cleanupTimers();
    ttsService.stop();

    // Calculate session statistics
    const avgAccuracy = accuracyHistory.current.length > 0
      ? Math.round(accuracyHistory.current.reduce((a, b) => a + b, 0) / accuracyHistory.current.length)
      : 0;

    // Final pose accuracy — the smoothed accuracy of the last frame
    const finalPoseAccuracy = accuracyRef.current || 0;

    // Peak accuracy achieved during the session
    const peakAccuracy = accuracyHistory.current.length > 0
      ? Math.max(...accuracyHistory.current)
      : 0;

    // Starting accuracy — average of first 10% of readings
    const startSlice = Math.max(1, Math.floor(accuracyHistory.current.length * 0.1));
    const startingAccuracy = accuracyHistory.current.length > 0
      ? Math.round(accuracyHistory.current.slice(0, startSlice).reduce((a, b) => a + b, 0) / startSlice)
      : 0;

    // Per-joint breakdown — average accuracy for each joint
    const jointBreakdown = {};
    for (const [joint, readings] of Object.entries(jointAccuracyHistoryRef.current)) {
      jointBreakdown[joint] = readings.length > 0
        ? Math.round(readings.reduce((a, b) => a + b, 0) / readings.length)
        : 0;
    }

    // Sample accuracy timeline for chart (max 40 data points)
    const sampleRate = Math.max(1, Math.floor(accuracyHistory.current.length / 40));
    const accuracyTimeline = accuracyHistory.current.filter((_, i) => i % sampleRate === 0);

    const sessionReport = {
      pose,
      avgAccuracy,
      finalPoseAccuracy,
      startingAccuracy,
      peakAccuracy,
      sessionDuration,
      totalReadings: accuracyHistory.current.length,
      accuracyTimeline,
      jointBreakdown,
      lastJointResults: comparison?.jointResults || {},
      jointFeedbackCount: { ...jointFeedbackCountRef.current },
    };

    ttsService.speakSessionEnd(avgAccuracy);
    navigation.replace(ROUTES.SESSION_RESULT, { sessionReport });
  }, [cleanupTimers, sessionDuration, comparison, pose, navigation]);

  // ── Stop/Cancel Session ──
  const stopSession = useCallback(() => {
    cleanupTimers();
    setSessionPhase(PHASE.PRE_SESSION);
    ttsService.stop();
    resetSmoother();
  }, [cleanupTimers]);

  const toggleTTS = () => {
    const enabled = ttsService.toggle();
    setTtsEnabled(enabled);
  };

  // Permission not granted
  if (!hasPermission) {
    return (
      <View style={styles.permissionContainer}>
        <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
          <Ionicons name="camera-outline" size={64} color={COLORS.primary} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need camera access to detect your yoga poses and provide real-time AI feedback.
          </Text>
          <GradientButton title="Grant Camera Access" onPress={requestPermission} style={{ marginTop: SPACING.lg }} />
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: SPACING.lg }}>
            <Text style={styles.cancelText}>Go Back</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  // Session complete — navigating to SessionResultScreen
  if (sessionPhase === PHASE.COMPLETE) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: COLORS.textPrimary, fontFamily: FONTS.medium, fontSize: FONT_SIZES.lg }}>
              Preparing your report...
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  }

  // Main camera session view
  // Uses MediapipeCamera which properly handles the camera-detector
  // lifecycle (device changes, orientation, frame processor binding)
  return (
    <View style={styles.container}>
      <StatusBar hidden />

      {/* Camera rendered by the library's component (Fix 10) */}
      <MediapipeCamera
        style={styles.camera}
        solution={poseDetection}
        activeCamera={cameraFacing}
        resizeMode="cover"
      />

      {/* Skeleton preview before session (semi-transparent to confirm detection) */}
      {sessionPhase === PHASE.PRE_SESSION && landmarks && (
        <View style={[StyleSheet.absoluteFill, { opacity: 0.4 }]} pointerEvents="none">
          <SkeletonOverlay
            landmarks={landmarks}
            width={width} height={height}
          />
        </View>
      )}

      {/* Skeleton during guided setup (visible so user can see their body) */}
      {sessionPhase === PHASE.GUIDED_SETUP && landmarks && (
        <SkeletonOverlay
          landmarks={landmarks}
          jointResults={comparison?.jointResults || {}}
          width={width} height={height}
        />
      )}

      {/* Skeleton during countdown (visible so user can see their body) */}
      {sessionPhase === PHASE.COUNTDOWN && landmarks && (
        <SkeletonOverlay
          landmarks={landmarks}
          jointResults={comparison?.jointResults || {}}
          width={width} height={height}
        />
      )}

      {/* Skeleton overlay drawn on top of camera feed during active detection */}
      {sessionPhase === PHASE.ACTIVE && landmarks && (
        <SkeletonOverlay
          landmarks={landmarks}
          jointResults={comparison?.jointResults || {}}
          width={width} height={height}
          showAngles={showAngles}
        />
      )}

      {/* Feedback overlay — Countdown phase */}
      {sessionPhase === PHASE.COUNTDOWN && (
        <FeedbackOverlay
          phase="countdown"
          countdownValue={countdownValue}
          poseName={pose.name}
          poseThumbnail={pose.thumbnailUrl}
        />
      )}

      {/* Feedback overlay — Active detection phase (accuracy tracking starts here) */}
      {sessionPhase === PHASE.ACTIVE && (
        <FeedbackOverlay
          phase="active_detection"
          accuracy={accuracy}
          primaryFeedback={comparison?.primaryFeedback || noDetectionMsg || 'Detecting your pose...'}
          feedback={comparison?.feedback || (noDetectionMsg ? ['Make sure your shoulders, hips and legs are visible'] : [])}
          duration={sessionDuration}
          poseName={pose.name}
          poseThumbnail={pose.thumbnailUrl}
        />
      )}

      {/* Pre-session overlay — Steps are shown clearly here BEFORE practice begins */}
      {sessionPhase === PHASE.PRE_SESSION && (
        <View style={styles.preSessionOverlay}>
          <View style={styles.preTopBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
              <Ionicons name="arrow-back" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={styles.preTitle}>{pose.name}</Text>
            {/* Flip camera button */}
            <TouchableOpacity onPress={() => setCameraFacing(prev => prev === 'front' ? 'back' : 'front')} style={styles.navBtn}>
              <Ionicons name="camera-reverse" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.preScrollView}
            contentContainerStyle={styles.preCenterContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.preInstructionBox}>
              <View style={styles.poseHeaderRow}>
                <Ionicons name="body-outline" size={24} color={COLORS.primary} />
                <Text style={styles.preInstructionTitle}>How to Perform</Text>
              </View>

              {/* Step by step instructions shown clearly */}
              <View style={styles.stepsListContainer}>
                {setupInstructions.map((instruction, idx) => (
                  <View key={idx} style={styles.stepItemRow}>
                    <View style={styles.stepNumberBadge}>
                      <Text style={styles.stepNumberText}>{idx + 1}</Text>
                    </View>
                    <Text style={styles.stepItemText}>{instruction}</Text>
                  </View>
                ))}
              </View>

              {/* Camera hint badge */}
              {pose.cameraHintText ? (
                <View style={styles.cameraHintBadge}>
                  <Ionicons name="videocam" size={16} color={COLORS.accent} />
                  <Text style={styles.cameraHintText}>{pose.cameraHintText}</Text>
                </View>
              ) : null}
            </View>

            <GradientButton
              title={isModelReady ? 'Start Practice' : poseError ? 'Error — Retry' : 'Loading AI Model...'}
              onPress={poseError ? () => { setPoseError(null); } : startPractice}
              size="large"
              disabled={!isModelReady && !poseError}
              icon={<Ionicons name={isModelReady ? 'play' : poseError ? 'refresh' : 'hourglass'} size={20} color="#FFF" />}
              style={styles.startBtn}
            />
          </ScrollView>
        </View>
      )}

      {/* Session controls — shown during countdown and active phase */}
      {(sessionPhase === PHASE.COUNTDOWN || sessionPhase === PHASE.ACTIVE) && (
        <View style={styles.sessionControls}>
          {/* Flip camera button during session (Fix 10) */}
          <TouchableOpacity onPress={() => setCameraFacing(prev => prev === 'front' ? 'back' : 'front')} style={styles.controlBtn}>
            <Ionicons name="camera-reverse" size={22} color={COLORS.accent} />
          </TouchableOpacity>
          <TouchableOpacity onPress={toggleTTS} style={styles.controlBtn}>
            <Ionicons name={ttsEnabled ? 'volume-high' : 'volume-mute'} size={22}
              color={ttsEnabled ? COLORS.accent : COLORS.textMuted} />
          </TouchableOpacity>
          {sessionPhase === PHASE.ACTIVE && (
            <TouchableOpacity onPress={() => setShowAngles(!showAngles)} style={styles.controlBtn}>
              <Ionicons name="analytics" size={22}
                color={showAngles ? COLORS.accent : COLORS.textMuted} />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            onPress={sessionPhase === PHASE.ACTIVE ? endSession : stopSession}
            style={[styles.controlBtn, styles.endBtn]}
          >
            <Ionicons name="stop" size={22} color={COLORS.error} />
          </TouchableOpacity>
        </View>
      )}

      {/* Debug status bar — shows detection state on device */}
      {sessionPhase !== PHASE.PRE_SESSION && sessionPhase !== PHASE.COMPLETE && (
        <View style={styles.debugBar}>
          <Text style={styles.debugText}>
            {debugInfo} | Phase: {sessionPhase} | LM: {landmarks ? landmarks.length : 'null'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  gradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  camera: { flex: 1, width, height },
  permissionContainer: { flex: 1 },
  permissionTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.xl, ...FONTS.bold, marginTop: SPACING.lg, textAlign: 'center' },
  permissionText: { color: COLORS.textMuted, fontSize: FONT_SIZES.body, ...FONTS.regular, textAlign: 'center', marginTop: SPACING.sm, paddingHorizontal: SPACING.xxl, lineHeight: 22 },
  cancelText: { color: COLORS.textMuted, fontSize: FONT_SIZES.md, ...FONTS.medium },
  preSessionOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'space-between' },
  preTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: SPACING.md },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  preTitle: { color: '#FFF', fontSize: FONT_SIZES.lg, ...FONTS.bold },
  preScrollView: { flex: 1, width: '100%' },
  preCenterContent: { alignItems: 'center', paddingTop: SPACING.md, paddingBottom: SPACING.xxl * 2 },
  preInstructionBox: { backgroundColor: 'rgba(10, 14, 33, 0.9)', borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, marginHorizontal: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.surfaceBorder, width: width - SPACING.lg * 2 },
  poseHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: 8 },
  preInstructionTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.lg, ...FONTS.bold },
  stepsListContainer: { width: '100%', marginBottom: SPACING.sm },
  stepItemRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10, paddingRight: SPACING.md },
  stepNumberBadge: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(108, 99, 255, 0.25)', alignItems: 'center', justifyContent: 'center', marginRight: 10, marginTop: 1, borderWidth: 1, borderColor: 'rgba(108, 99, 255, 0.5)' },
  stepNumberText: { color: COLORS.primaryLight || '#A5A6F6', fontSize: 11, fontFamily: FONTS.bold },
  stepItemText: { flex: 1, color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, ...FONTS.regular, lineHeight: 20 },
  cameraHintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 217, 166, 0.12)',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginTop: SPACING.xs,
    borderWidth: 1,
    borderColor: 'rgba(0, 217, 166, 0.25)',
    gap: 8,
  },
  cameraHintText: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.sm,
    ...FONTS.medium,
  },
  startBtn: { minWidth: 200 },
  sessionControls: { position: 'absolute', right: SPACING.md, top: '45%', gap: SPACING.md },
  controlBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(10, 14, 33, 0.7)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder },
  endBtn: { borderColor: 'rgba(255, 82, 82, 0.3)' },
  resultsContainer: { alignItems: 'center', paddingHorizontal: SPACING.lg, width: '100%' },
  resultCircleOuter: { width: 140, height: 140, borderRadius: 70, padding: 4, marginBottom: SPACING.xl },
  resultCircle: { flex: 1, borderRadius: 70, alignItems: 'center', justifyContent: 'center' },
  resultValue: { color: '#FFF', fontSize: FONT_SIZES.display, ...FONTS.extraBold },
  resultLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZES.sm, ...FONTS.medium, textTransform: 'uppercase', letterSpacing: 1 },
  resultTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.xxl, ...FONTS.bold, marginBottom: SPACING.xl, textAlign: 'center' },
  resultStats: { flexDirection: 'row', backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.surfaceBorder, marginBottom: SPACING.xl, width: '100%' },
  resultStatItem: { flex: 1, alignItems: 'center', gap: 4 },
  resultStatValue: { color: COLORS.textPrimary, fontSize: FONT_SIZES.body, ...FONTS.bold, textAlign: 'center' },
  resultStatLabel: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, ...FONTS.regular },
  resultDivider: { width: 1, backgroundColor: COLORS.surfaceBorder, marginHorizontal: SPACING.sm },
  resultActions: { gap: SPACING.md, width: '100%' },
  resultBtn: { width: '100%' },
  debugBar: { position: 'absolute', bottom: 4, left: 4, right: 100, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 3 },
  debugText: { color: '#0F0', fontSize: 9, fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
});

export default CameraSessionScreen;
