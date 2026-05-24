// Camera Session Screen - Real-time pose detection with AI feedback
// Uses react-native-mediapipe + react-native-vision-camera for live
// pose landmark detection with GPU-accelerated MediaPipe inference.
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  Dimensions, Animated, Platform,
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
} from 'react-native-vision-camera';
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
  getPoseDetectionConfig,
} from '../services/poseDetectionService';
import { comparePose } from '../services/poseComparisonService';
import { calculateAllAngles } from '../services/angleCalculator';
import ttsService from '../services/ttsService';
import { generateSessionId } from '../utils/helpers';

const { width, height } = Dimensions.get('window');

const CameraSessionScreen = ({ route, navigation }) => {
  const { pose } = route.params;

  // Vision Camera setup
  const device = useCameraDevice('front');
  const { hasPermission, requestPermission } = useCameraPermission();

  // Session state
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [sessionDuration, setSessionDuration] = useState(0);
  const [landmarks, setLandmarks] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [accuracy, setAccuracy] = useState(0);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [showAngles, setShowAngles] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const [isModelReady, setIsModelReady] = useState(false);

  const timerRef = useRef(null);
  const accuracyHistory = useRef([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const sessionId = useRef(generateSessionId());
  const isSessionActiveRef = useRef(false);

  // Get pose detection configuration
  const poseConfig = useMemo(() => getPoseDetectionConfig({
    delegate: Delegate.GPU,
    fpsMode: 10,
  }), []);

  // MediaPipe pose detection callbacks
  const poseCallbacks = useMemo(() => ({
    onResults: (results, viewCoordinator) => {
      // Only process if session is active
      if (!isSessionActiveRef.current) return;

      const processed = processPoseResults(results, viewCoordinator, pose.targetAngles);

      if (processed) {
        setLandmarks(processed.landmarks);
        setComparison(processed.comparison);
        setAccuracy(processed.comparison?.overallAccuracy || 0);
        accuracyHistory.current.push(processed.comparison?.overallAccuracy || 0);

        // Voice feedback
        if (ttsEnabled && processed.comparison?.primaryFeedback) {
          ttsService.speak(processed.comparison.primaryFeedback);
        }
      }
    },
    onError: (error) => {
      console.warn('Pose detection error:', error);
    },
  }), [pose.targetAngles, ttsEnabled]);

  // Initialize MediaPipe pose detection hook
  const poseDetection = usePoseDetection(
    poseCallbacks,
    poseConfig.runningMode,
    poseConfig.model,
    poseConfig.options,
  );

  // Track model readiness
  useEffect(() => {
    if (poseDetection.frameProcessor) {
      setIsModelReady(true);
    }
  }, [poseDetection.frameProcessor]);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    return () => {
      stopSession();
      ttsService.dispose();
    };
  }, []);

  const startSession = useCallback(() => {
    setIsSessionActive(true);
    isSessionActiveRef.current = true;
    setSessionDuration(0);
    setSessionComplete(false);
    accuracyHistory.current = [];

    ttsService.speakSessionStart(pose.name);

    timerRef.current = setInterval(() => {
      setSessionDuration(prev => prev + 1);
    }, 1000);
  }, [pose]);

  const stopSession = useCallback(() => {
    setIsSessionActive(false);
    isSessionActiveRef.current = false;
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    ttsService.stop();
  }, []);

  const endSession = useCallback(() => {
    stopSession();
    const avgAccuracy = accuracyHistory.current.length > 0
      ? Math.round(accuracyHistory.current.reduce((a, b) => a + b, 0) / accuracyHistory.current.length)
      : 0;
    setFinalAccuracy(avgAccuracy);
    setSessionComplete(true);
    ttsService.speakSessionEnd(avgAccuracy);
  }, [stopSession]);

  const toggleTTS = () => {
    const enabled = ttsService.toggle();
    setTtsEnabled(enabled);
  };

  // No camera device available
  if (!device) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
          <Ionicons name="camera-off-outline" size={64} color={COLORS.error} />
          <Text style={styles.permissionTitle}>No Camera Found</Text>
          <Text style={styles.permissionText}>
            Could not find a front-facing camera on this device.
          </Text>
          <GradientButton title="Go Back" onPress={() => navigation.goBack()} style={{ marginTop: SPACING.lg }} />
        </LinearGradient>
      </View>
    );
  }

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

  // Session complete — show results
  if (sessionComplete) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
          <Animated.View style={[styles.resultsContainer, { opacity: fadeAnim }]}>
            <View style={styles.resultCircleOuter}>
              <LinearGradient
                colors={finalAccuracy >= 70 ? COLORS.gradientAccent : COLORS.gradientPrimary}
                style={styles.resultCircle}
              >
                <Text style={styles.resultValue}>{finalAccuracy}%</Text>
                <Text style={styles.resultLabel}>Accuracy</Text>
              </LinearGradient>
            </View>
            <Text style={styles.resultTitle}>
              {finalAccuracy >= 80 ? 'Excellent Work! 🎉' :
               finalAccuracy >= 60 ? 'Good Progress! 💪' : 'Keep Practicing! 🧘'}
            </Text>
            <View style={styles.resultStats}>
              <View style={styles.resultStatItem}>
                <Ionicons name="time-outline" size={20} color={COLORS.accent} />
                <Text style={styles.resultStatValue}>
                  {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}
                </Text>
                <Text style={styles.resultStatLabel}>Duration</Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultStatItem}>
                <Ionicons name="body-outline" size={20} color={COLORS.primary} />
                <Text style={styles.resultStatValue}>{pose.name}</Text>
                <Text style={styles.resultStatLabel}>Pose</Text>
              </View>
              <View style={styles.resultDivider} />
              <View style={styles.resultStatItem}>
                <Ionicons name="analytics-outline" size={20} color={COLORS.warning} />
                <Text style={styles.resultStatValue}>{accuracyHistory.current.length}</Text>
                <Text style={styles.resultStatLabel}>Readings</Text>
              </View>
            </View>
            <View style={styles.resultActions}>
              <GradientButton
                title="Practice Again"
                onPress={() => {
                  setSessionComplete(false); setAccuracy(0);
                  setLandmarks(null); setComparison(null);
                  sessionId.current = generateSessionId();
                }}
                icon={<Ionicons name="refresh" size={18} color="#FFF" />}
                style={styles.resultBtn}
              />
              <GradientButton
                title="Back to Library"
                onPress={() => navigation.navigate('Library')}
                variant="outline"
                style={styles.resultBtn}
              />
            </View>
          </Animated.View>
        </LinearGradient>
      </View>
    );
  }

  // Main camera session view
  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <Camera
        style={styles.camera}
        device={device}
        isActive={true}
        frameProcessor={poseDetection.frameProcessor}
        pixelFormat="rgb"
        onLayout={poseDetection.cameraViewLayoutChangeHandler}
        onOutputOrientationChanged={poseDetection.cameraOrientationChangedHandler}
        onInitialized={() => console.log('Camera initialized')}
      >
        {/* Skeleton overlay drawn on top of camera feed */}
        {isSessionActive && landmarks && (
          <SkeletonOverlay
            landmarks={landmarks}
            jointResults={comparison?.jointResults}
            width={width} height={height}
            showAngles={showAngles}
          />
        )}

        {/* Feedback overlay showing accuracy and instructions */}
        {isSessionActive && comparison && (
          <FeedbackOverlay
            accuracy={accuracy}
            primaryFeedback={comparison.primaryFeedback}
            feedback={comparison.feedback}
            duration={sessionDuration}
            poseName={pose.name}
          />
        )}

        {/* Pre-session overlay — shown before starting */}
        {!isSessionActive && (
          <View style={styles.preSessionOverlay}>
            <View style={styles.preTopBar}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={styles.preTitle}>{pose.name}</Text>
              <View style={{ width: 40 }} />
            </View>
            <View style={styles.preCenterContent}>
              <View style={styles.preInstructionBox}>
                <Ionicons name="body" size={40} color={COLORS.primary} />
                <Text style={styles.preInstructionTitle}>
                  {isModelReady ? 'Position Yourself' : 'Loading AI Model...'}
                </Text>
                <Text style={styles.preInstructionText}>
                  {isModelReady
                    ? `Stand in view of the camera.\nMake sure your full body is visible.`
                    : 'MediaPipe pose detection model is initializing.\nThis may take a few seconds.'
                  }
                </Text>
              </View>
              <GradientButton
                title={isModelReady ? 'Start Practice' : 'Loading...'}
                onPress={startSession}
                size="large"
                disabled={!isModelReady}
                icon={<Ionicons name={isModelReady ? 'play' : 'hourglass'} size={20} color="#FFF" />}
                style={styles.startBtn}
              />
            </View>
          </View>
        )}

        {/* Session controls — shown during active session */}
        {isSessionActive && (
          <View style={styles.sessionControls}>
            <TouchableOpacity onPress={toggleTTS} style={styles.controlBtn}>
              <Ionicons name={ttsEnabled ? 'volume-high' : 'volume-mute'} size={22}
                color={ttsEnabled ? COLORS.accent : COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowAngles(!showAngles)} style={styles.controlBtn}>
              <Ionicons name="analytics" size={22}
                color={showAngles ? COLORS.accent : COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={endSession} style={[styles.controlBtn, styles.endBtn]}>
              <Ionicons name="stop" size={22} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        )}
      </Camera>
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
  preCenterContent: { alignItems: 'center', paddingBottom: SPACING.xxl * 2 },
  preInstructionBox: { backgroundColor: 'rgba(10, 14, 33, 0.85)', borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, alignItems: 'center', marginHorizontal: SPACING.xl, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.surfaceBorder },
  preInstructionTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.xl, ...FONTS.bold, marginTop: SPACING.md, marginBottom: SPACING.sm },
  preInstructionText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.body, ...FONTS.regular, textAlign: 'center', lineHeight: 22 },
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
});

export default CameraSessionScreen;
