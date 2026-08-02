// Camera Session Screen - Ghost-silhouette AI Practice
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  Animated, ScrollView, Linking, Platform, useWindowDimensions,
} from 'react-native';
import { useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Rect } from 'react-native-svg';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING } from '../config/theme';
import CameraSurface from '../components/CameraSurface';
import SkeletonOverlay from '../components/SkeletonOverlay';
import GhostOverlay from '../components/GhostOverlay';
import FeedbackOverlay from '../components/FeedbackOverlay';
import GradientButton from '../components/GradientButton';
import poseEngine from '../services/poseEngine';
import { comparePose, getAccuracyColor } from '../services/poseComparisonService';
import { buildTargetLandmarks, alignToUserBody } from '../services/targetPoseRenderer';
import ttsService from '../services/ttsService';
import authService from '../services/authService';
import firestoreService from '../services/firestoreService';
import { generateSessionId, humanizeJointName } from '../utils/helpers';
import StatCard from '../components/StatCard';

const isWeb = Platform.OS === 'web';
// Real detection runs at ~10 fps; the native demo engine only needs 2 fps.
const DETECTION_INTERVAL_MS = isWeb ? 100 : 500;
// Streak thresholds are in milliseconds so the state machine behaves the same
// at either tick rate.
const GOOD_MS_TO_HOLD = 1000;
const BAD_MS_TO_BREAK = 1000;
const LOST_MS_TO_WARN = 1500;

const CameraSessionScreen = ({ route, navigation }) => {
  const { pose } = route.params;
  const { width, height } = useWindowDimensions();
  const [permission, requestPermission] = useCameraPermissions();

  const [phase, setPhase] = useState('positioning'); // positioning | matching | holding
  const [sessionDuration, setSessionDuration] = useState(0);
  const [landmarks, setLandmarks] = useState(null);
  const [targetLandmarks, setTargetLandmarks] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const [finalAccuracy, setFinalAccuracy] = useState(0);
  const [wasEarlyExit, setWasEarlyExit] = useState(false);
  const [jointBreakdown, setJointBreakdown] = useState([]);
  const [reward, setReward] = useState(null); // { type: 'best' | 'streak' | 'first', value }
  const [engineStatus, setEngineStatus] = useState(poseEngine.getStatus());
  const [cameraError, setCameraError] = useState(null);
  const [bodyLost, setBodyLost] = useState(false);

  const phaseRef = useRef('positioning');
  const timerRef = useRef(null);
  const detectionRef = useRef(null);
  const accuracyHistory = useRef([]);
  const jointAccuracyHistory = useRef({});
  const sessionDurationRef = useRef(0);
  const lastAnchorRef = useRef(null);
  const goodMsRef = useRef(0);
  const badMsRef = useRef(0);
  const lostMsRef = useRef(0);
  const heldMsRef = useRef(0);
  const halfwayAnnouncedRef = useRef(false);
  const priorStatsRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const rewardAnim = useRef(new Animated.Value(0)).current;
  const sessionId = useRef(generateSessionId());

  const baseTargetLandmarks = useMemo(
    () => buildTargetLandmarks(pose.targetAngles),
    [pose]
  );

  const goToPhase = useCallback((next) => {
    phaseRef.current = next;
    setPhase(next);
  }, []);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    // stopLoops() halts the engine but deliberately leaves the model loaded —
    // it's a singleton, so re-entering a session is instant instead of
    // re-initialising WASM + weights each time.
    return () => {
      stopLoops();
      ttsService.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    poseEngine.init().then(() => {
      if (!cancelled) setEngineStatus(poseEngine.getStatus());
    });
    setEngineStatus(poseEngine.getStatus());
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    poseEngine.setViewport(width, height);
  }, [width, height]);

  useEffect(() => {
    const uid = authService.getCurrentUser()?.uid;
    if (uid) {
      firestoreService.getUserStats(uid).then(({ data }) => {
        priorStatsRef.current = data;
      });
    }
  }, []);

  const handleVideoReady = useCallback((video) => {
    poseEngine.attachVideo(video);
    setCameraError(null);
  }, []);

  const handleCameraError = useCallback((err) => {
    setCameraError(err);
  }, []);

  const stopLoops = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    if (detectionRef.current) { clearInterval(detectionRef.current); detectionRef.current = null; }
    poseEngine.stop();
    ttsService.stop();
  }, []);

  const finishSession = useCallback((completed = true) => {
    stopLoops();
    const avg = accuracyHistory.current.length > 0
      ? Math.round(accuracyHistory.current.reduce((a, b) => a + b, 0) / accuracyHistory.current.length)
      : 0;
    const breakdown = Object.entries(jointAccuracyHistory.current).map(([joint, arr]) => ({
      joint,
      avg: arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0,
    }));
    setJointBreakdown(breakdown);
    setWasEarlyExit(!completed);
    setFinalAccuracy(avg);
    setSessionComplete(true);
    setReward(null);
    rewardAnim.setValue(0);
    if (ttsEnabled) {
      if (completed) {
        ttsService.speakSessionEnd(avg);
      } else {
        ttsService.speak('Session ended.');
      }
    }
    if (completed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const uid = authService.getCurrentUser()?.uid;
    if (uid) {
      const prior = priorStatsRef.current;
      firestoreService.saveProgress(uid, {
        poseId: pose.id,
        poseName: pose.name,
        accuracy: avg,
        duration: sessionDurationRef.current,
        completed,
        jointBreakdown: breakdown,
      }).then(({ error }) => {
        if (error) console.warn('saveProgress failed', error);
        if (!completed) return;

        const isNewBest = !!prior && prior.totalSessions > 0 && avg > prior.bestAccuracy;
        const isFirstSession = !!prior && prior.totalSessions === 0;

        firestoreService.getUserStats(uid).then(({ data: postStats }) => {
          if (!postStats) return;
          const STREAK_MILESTONES = [3, 7, 14, 30, 100];
          const hitMilestone = STREAK_MILESTONES.includes(postStats.dailyStreak);

          let nextReward = null;
          if (isNewBest) {
            nextReward = { type: 'best', value: avg };
          } else if (hitMilestone) {
            nextReward = { type: 'streak', value: postStats.dailyStreak };
          } else if (isFirstSession) {
            nextReward = { type: 'first', value: avg };
          }

          if (nextReward) {
            setReward(nextReward);
            Animated.spring(rewardAnim, {
              toValue: 1,
              tension: 60,
              friction: 8,
              useNativeDriver: true,
            }).start();
          }
        });
      });
    }
  }, [stopLoops, ttsEnabled, pose, rewardAnim]);

  const allJointsGood = (result) => {
    const joints = result && result.jointResults ? Object.values(result.jointResults) : [];
    if (joints.length === 0) return false;
    return joints.every((j) => j.status === 'good');
  };

  const startSession = useCallback(() => {
    accuracyHistory.current = [];
    jointAccuracyHistory.current = {};
    lastAnchorRef.current = null;
    goodMsRef.current = 0;
    badMsRef.current = 0;
    lostMsRef.current = 0;
    heldMsRef.current = 0;
    halfwayAnnouncedRef.current = false;
    sessionDurationRef.current = 0;
    setSessionDuration(0);
    setSessionComplete(false);
    setHoldProgress(0);
    setBodyLost(false);
    goToPhase('matching');
    poseEngine.start();

    if (ttsEnabled) ttsService.speakSessionStart(pose.name);

    timerRef.current = setInterval(() => {
      setSessionDuration((prev) => {
        const next = prev + 1;
        sessionDurationRef.current = next;
        return next;
      });
    }, 1000);

    detectionRef.current = setInterval(() => {
      const reading = poseEngine.read(pose.targetAngles);

      // No body in frame — hold the state machine steady rather than scoring noise.
      if (!reading || !reading.angles) {
        lostMsRef.current += DETECTION_INTERVAL_MS;
        goodMsRef.current = 0;
        if (lostMsRef.current >= LOST_MS_TO_WARN) {
          setBodyLost(true);
          setLandmarks(null);
          if (phaseRef.current === 'holding') {
            badMsRef.current += DETECTION_INTERVAL_MS;
            if (badMsRef.current >= BAD_MS_TO_BREAK) {
              badMsRef.current = 0;
              heldMsRef.current = 0;
              setHoldProgress(0);
              goToPhase('matching');
            }
          }
        }
        return;
      }

      lostMsRef.current = 0;
      setBodyLost(false);

      const userLandmarks = reading.landmarks;
      setLandmarks(userLandmarks);

      const { landmarks: aligned, anchor } = alignToUserBody(
        baseTargetLandmarks,
        userLandmarks,
        lastAnchorRef.current
      );
      if (anchor) lastAnchorRef.current = anchor;
      setTargetLandmarks(aligned);

      const result = comparePose(reading.angles, pose.targetAngles);
      setComparison(result);
      accuracyHistory.current.push(result.overallAccuracy);
      Object.entries(result.jointResults).forEach(([joint, r]) => {
        if (!jointAccuracyHistory.current[joint]) jointAccuracyHistory.current[joint] = [];
        jointAccuracyHistory.current[joint].push(r.accuracy);
      });

      if (
        phaseRef.current === 'matching' &&
        ttsEnabled &&
        result.overallAccuracy < 70 &&
        result.primaryFeedback
      ) {
        ttsService.speak(result.primaryFeedback);
      }

      const matched = allJointsGood(result);

      if (phaseRef.current === 'matching') {
        if (matched) {
          goodMsRef.current += DETECTION_INTERVAL_MS;
          if (goodMsRef.current >= GOOD_MS_TO_HOLD) {
            goodMsRef.current = 0;
            badMsRef.current = 0;
            heldMsRef.current = 0;
            halfwayAnnouncedRef.current = false;
            setHoldProgress(0);
            goToPhase('holding');
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (ttsEnabled) ttsService.speak('Hold.');
          }
        } else {
          goodMsRef.current = 0;
        }
      } else if (phaseRef.current === 'holding') {
        if (matched) {
          badMsRef.current = 0;
          heldMsRef.current += DETECTION_INTERVAL_MS;
          const target = Math.max(1, pose.duration) * 1000;
          const progress = Math.min(1, heldMsRef.current / target);
          setHoldProgress(progress);
          if (!halfwayAnnouncedRef.current && progress >= 0.5) {
            halfwayAnnouncedRef.current = true;
            if (ttsEnabled) ttsService.speakEncouragement(result.overallAccuracy);
          }
          if (heldMsRef.current >= target) {
            finishSession();
          }
        } else {
          badMsRef.current += DETECTION_INTERVAL_MS;
          if (badMsRef.current >= BAD_MS_TO_BREAK) {
            badMsRef.current = 0;
            heldMsRef.current = 0;
            goodMsRef.current = 0;
            setHoldProgress(0);
            goToPhase('matching');
            if (ttsEnabled) ttsService.speak(result.primaryFeedback || 'Reset your form.');
          }
        }
      }
    }, DETECTION_INTERVAL_MS);
  }, [pose, ttsEnabled, baseTargetLandmarks, goToPhase, finishSession]);

  const endEarly = useCallback(() => {
    finishSession(false);
  }, [finishSession]);

  const toggleTTS = () => {
    const enabled = ttsService.toggle();
    setTtsEnabled(enabled);
  };

  const resetToPractice = () => {
    setSessionComplete(false);
    setLandmarks(null);
    setTargetLandmarks(null);
    setComparison(null);
    setHoldProgress(0);
    setBodyLost(false);
    goToPhase('positioning');
    sessionId.current = generateSessionId();
  };

  // On web the browser prompts for camera access through getUserMedia inside
  // CameraSurface, so expo-camera's permission gate doesn't apply.
  if (!isWeb && !permission) return <View style={styles.container} />;

  if (!isWeb && !permission.granted) {
    const canAskAgain = permission.canAskAgain !== false;
    return (
      <View style={styles.permissionContainer}>
        <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
          <Ionicons name="camera-outline" size={64} color={COLORS.primary} />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            {canAskAgain
              ? 'We need camera access to detect your yoga poses and provide real-time AI feedback.'
              : 'Camera access was denied. Enable it in your device Settings to start your practice.'}
          </Text>
          <GradientButton
            title={canAskAgain ? 'Grant Camera Access' : 'Open Settings'}
            onPress={canAskAgain ? requestPermission : Linking.openSettings}
            style={{ marginTop: SPACING.lg }}
          />
          <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: SPACING.lg }}>
            <Text style={styles.cancelText}>Go Back</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  if (sessionComplete) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
          <ScrollView
            style={styles.resultsScroll}
            contentContainerStyle={styles.resultsScrollContent}
            showsVerticalScrollIndicator={false}
          >
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
            {reward && (
              <Animated.View
                style={[
                  styles.rewardBadge,
                  {
                    opacity: rewardAnim,
                    transform: [{ scale: rewardAnim }],
                  },
                ]}
              >
                <Ionicons name="trophy" size={16} color={COLORS.warning} />
                <Text style={styles.rewardBadgeText}>
                  {reward.type === 'best' && 'New Personal Best!'}
                  {reward.type === 'streak' && `${reward.value}-Day Streak!`}
                  {reward.type === 'first' && 'First Session Complete!'}
                </Text>
              </Animated.View>
            )}
            <Text style={styles.resultTitle}>
              {wasEarlyExit ? 'Session Ended Early' :
               finalAccuracy >= 80 ? 'Excellent Work! 🎉' :
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
            {jointBreakdown.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.jointBreakdownScroll}
                contentContainerStyle={styles.jointBreakdownContent}
              >
                {jointBreakdown.map(({ joint, avg }) => (
                  <StatCard
                    key={joint}
                    title={humanizeJointName(joint)}
                    value={avg}
                    suffix="%"
                    icon="body-outline"
                    iconColor={getAccuracyColor(avg)}
                    style={styles.jointBreakdownCard}
                  />
                ))}
              </ScrollView>
            )}
            <View style={styles.resultActions}>
              <GradientButton
                title="Practice Again"
                onPress={resetToPractice}
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
          </ScrollView>
        </LinearGradient>
      </View>
    );
  }

  const isActive = phase === 'matching' || phase === 'holding';
  const setupHint = pose.instructions && pose.instructions[0] ? pose.instructions[0] : 'Stand where the camera sees your full body.';
  const perimeter = 2 * (width + height);
  const engineFailed = engineStatus === 'error';
  // 'idle' means init() hasn't run yet — starting then would tick against a
  // null landmarker and show an empty session until the model lands.
  const engineReady = engineStatus === 'ready';

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <CameraSurface
        facing="front"
        onVideoReady={handleVideoReady}
        onError={handleCameraError}
      >
        {isActive && targetLandmarks && (
          <GhostOverlay
            targetLandmarks={targetLandmarks}
            jointResults={comparison?.jointResults}
            width={width}
            height={height}
            holding={phase === 'holding'}
          />
        )}
        {isActive && landmarks && (
          <SkeletonOverlay
            landmarks={landmarks}
            jointResults={comparison?.jointResults}
            width={width}
            height={height}
          />
        )}
        {phase === 'matching' && comparison && (
          <FeedbackOverlay
            accuracy={comparison.overallAccuracy}
            primaryFeedback={comparison.primaryFeedback}
            feedback={comparison.feedback}
            duration={sessionDuration}
            poseName={pose.name}
            showTopBar={false}
            showAccuracyCircle={false}
          />
        )}

        {phase === 'positioning' && (
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
                <Text style={styles.preInstructionTitle}>Fill the silhouette</Text>
                <Text style={styles.preInstructionText}>
                  A translucent pose will appear on top of you. Move your body into it — joints glow green as they align. Hold all green to complete.
                </Text>
                <View style={styles.preHintRow}>
                  <Ionicons name="information-circle-outline" size={16} color={COLORS.accent} />
                  <Text style={styles.preHintText}>{setupHint}</Text>
                </View>
                {cameraError && (
                  <View style={styles.preHintRow}>
                    <Ionicons name="videocam-off-outline" size={16} color={COLORS.error} />
                    <Text style={[styles.preHintText, { color: COLORS.error }]}>
                      {cameraError === 'NotAllowedError'
                        ? 'Camera blocked. Allow camera access and reload.'
                        : 'No camera available. Connect one and reload.'}
                    </Text>
                  </View>
                )}
                {engineFailed && !cameraError && (
                  <View style={styles.preHintRow}>
                    <Ionicons name="warning-outline" size={16} color={COLORS.warning} />
                    <Text style={[styles.preHintText, { color: COLORS.warning }]}>
                      Pose model failed to load. Restart the app to retry.
                    </Text>
                  </View>
                )}
              </View>
              <GradientButton
                title={
                  engineFailed ? 'Pose model unavailable'
                    : engineReady ? 'Start Practice'
                    : 'Loading pose model…'
                }
                onPress={startSession}
                size="large"
                disabled={!engineReady || !!cameraError}
                icon={<Ionicons name="play" size={20} color="#FFF" />}
                style={styles.startBtn}
              />
            </View>
          </View>
        )}

        {isActive && bodyLost && (
          <View style={styles.lostBanner} pointerEvents="none">
            <Ionicons name="scan-outline" size={16} color={COLORS.warning} />
            <Text style={styles.lostBannerText}>Step back so your whole body is in frame</Text>
          </View>
        )}

        {isActive && (
          <View style={styles.activeTopBar} pointerEvents="box-none">
            <View style={styles.poseNamePill}>
              <Text style={styles.poseNameText}>{pose.name}</Text>
              {phase === 'holding' && (
                <View style={styles.holdBadge}>
                  <Ionicons name="checkmark-circle" size={12} color={COLORS.jointGood} />
                  <Text style={styles.holdBadgeText}>HOLD</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {phase === 'holding' && (
          <View style={styles.ringLayer} pointerEvents="none">
            <Svg width={width} height={height}>
              <Rect
                x={3}
                y={3}
                width={width - 6}
                height={height - 6}
                stroke={COLORS.jointGood}
                strokeWidth={4}
                fill="none"
                strokeDasharray={`${perimeter}`}
                strokeDashoffset={perimeter * (1 - holdProgress)}
                opacity={0.9}
              />
            </Svg>
          </View>
        )}

        {isActive && (
          <View style={styles.sessionControls}>
            <TouchableOpacity onPress={toggleTTS} style={styles.controlBtn}>
              <Ionicons name={ttsEnabled ? 'volume-high' : 'volume-mute'} size={22}
                color={ttsEnabled ? COLORS.accent : COLORS.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={endEarly} style={[styles.controlBtn, styles.endBtn]}>
              <Ionicons name="stop" size={22} color={COLORS.error} />
            </TouchableOpacity>
          </View>
        )}
      </CameraSurface>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  gradient: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  permissionContainer: { flex: 1 },
  permissionTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.xl, ...FONTS.bold, marginTop: SPACING.lg, textAlign: 'center' },
  permissionText: { color: COLORS.textMuted, fontSize: FONT_SIZES.body, ...FONTS.regular, textAlign: 'center', marginTop: SPACING.sm, paddingHorizontal: SPACING.xxl, lineHeight: 22 },
  cancelText: { color: COLORS.textMuted, fontSize: FONT_SIZES.md, ...FONTS.medium },
  preSessionOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'space-between' },
  preTopBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 50, paddingHorizontal: SPACING.md },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,0,0,0.3)', alignItems: 'center', justifyContent: 'center' },
  preTitle: { color: '#FFF', fontSize: FONT_SIZES.lg, ...FONTS.bold },
  preCenterContent: { alignItems: 'center', paddingBottom: SPACING.xxl * 2 },
  preInstructionBox: { backgroundColor: 'rgba(10, 14, 33, 0.85)', borderRadius: BORDER_RADIUS.xl, padding: SPACING.xl, alignItems: 'center', marginHorizontal: SPACING.xl, marginBottom: SPACING.xl, borderWidth: 1, borderColor: COLORS.surfaceBorder },
  preInstructionTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.xl, ...FONTS.bold, marginTop: SPACING.md, marginBottom: SPACING.sm },
  preInstructionText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.body, ...FONTS.regular, textAlign: 'center', lineHeight: 22 },
  preHintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.md, paddingTop: SPACING.md, borderTopWidth: 1, borderTopColor: COLORS.surfaceBorder, alignSelf: 'stretch', justifyContent: 'center' },
  preHintText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, ...FONTS.medium, flexShrink: 1, textAlign: 'center' },
  startBtn: { minWidth: 200 },
  activeTopBar: { position: 'absolute', top: 50, left: 0, right: 0, alignItems: 'center' },
  poseNamePill: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: 'rgba(10, 14, 33, 0.6)', paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.round, borderWidth: 1, borderColor: COLORS.surfaceBorder },
  poseNameText: { color: '#FFF', fontSize: FONT_SIZES.sm, ...FONTS.medium },
  holdBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(0, 230, 118, 0.15)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: BORDER_RADIUS.round },
  holdBadgeText: { color: COLORS.jointGood, fontSize: FONT_SIZES.xs, ...FONTS.bold, letterSpacing: 1 },
  lostBanner: { position: 'absolute', top: 104, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(10, 14, 33, 0.8)', paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.round, borderWidth: 1, borderColor: 'rgba(255, 214, 0, 0.35)' },
  lostBannerText: { color: COLORS.warning, fontSize: FONT_SIZES.sm, ...FONTS.medium },
  ringLayer: { ...StyleSheet.absoluteFillObject },
  sessionControls: { position: 'absolute', right: SPACING.md, top: '45%', gap: SPACING.md },
  controlBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(10, 14, 33, 0.7)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder },
  endBtn: { borderColor: 'rgba(255, 82, 82, 0.3)' },
  resultsScroll: { flex: 1, width: '100%' },
  resultsScrollContent: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: SPACING.xl },
  resultsContainer: { alignItems: 'center', paddingHorizontal: SPACING.lg, width: '100%' },
  resultCircleOuter: { width: 140, height: 140, borderRadius: 70, padding: 4, marginBottom: SPACING.xl },
  resultCircle: { flex: 1, borderRadius: 70, alignItems: 'center', justifyContent: 'center' },
  resultValue: { color: '#FFF', fontSize: FONT_SIZES.display, ...FONTS.extraBold },
  resultLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZES.sm, ...FONTS.medium, textTransform: 'uppercase', letterSpacing: 1 },
  rewardBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255, 214, 0, 0.15)', paddingHorizontal: SPACING.md, paddingVertical: 6, borderRadius: BORDER_RADIUS.round, borderWidth: 1, borderColor: 'rgba(255, 214, 0, 0.3)', marginBottom: SPACING.md },
  rewardBadgeText: { color: COLORS.warning, fontSize: FONT_SIZES.sm, ...FONTS.bold, letterSpacing: 0.3 },
  resultTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.xxl, ...FONTS.bold, marginBottom: SPACING.xl, textAlign: 'center' },
  resultStats: { flexDirection: 'row', backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.surfaceBorder, marginBottom: SPACING.xl, width: '100%' },
  resultStatItem: { flex: 1, alignItems: 'center', gap: 4 },
  resultStatValue: { color: COLORS.textPrimary, fontSize: FONT_SIZES.body, ...FONTS.bold, textAlign: 'center' },
  resultStatLabel: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, ...FONTS.regular },
  resultDivider: { width: 1, backgroundColor: COLORS.surfaceBorder, marginHorizontal: SPACING.sm },
  jointBreakdownScroll: { width: '100%', marginBottom: SPACING.xl },
  jointBreakdownContent: { gap: SPACING.sm, paddingHorizontal: 2 },
  jointBreakdownCard: { width: 92, minWidth: 92 },
  resultActions: { gap: SPACING.md, width: '100%' },
  resultBtn: { width: '100%' },
});

export default CameraSessionScreen;
