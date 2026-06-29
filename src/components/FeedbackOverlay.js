// FeedbackOverlay Component - Displays corrective feedback and accuracy during pose detection
// Supports 3 phases: GUIDED_SETUP, COUNTDOWN, ACTIVE_DETECTION
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING } from '../config/theme';
import { getAccuracyColor, getAccuracyStatus } from '../services/poseComparisonService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * SESSION PHASES:
 *   'guided_setup'      — Step-by-step instructions to get into pose
 *   'countdown'         — 3-2-1 countdown before detection
 *   'active_detection'  — Live accuracy tracking and corrections
 */
const FeedbackOverlay = ({
  // Phase control
  phase = 'active_detection',

  // Guided setup props
  currentInstruction = '',
  instructionStep = 0,
  totalInstructions = 0,

  // Guided setup extra props
  poseThumbnail = null,
  accuracy = 0,
  cameraHintText = '',

  // Countdown props
  countdownValue = 3,

  // Active detection props
  primaryFeedback = '',
  feedback = [],
  duration = 0,
  poseName = '',
}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const countdownScale = useRef(new Animated.Value(0.5)).current;
  const countdownOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Slide in animation
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 60,
      friction: 10,
      useNativeDriver: true,
    }).start();

    // Pulse animation for accuracy circle
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.08, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  // Countdown pop animation
  useEffect(() => {
    if (phase === 'countdown') {
      countdownScale.setValue(0.5);
      countdownOpacity.setValue(0);
      Animated.parallel([
        Animated.spring(countdownScale, {
          toValue: 1,
          tension: 100,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(countdownOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [phase, countdownValue]);

  const accuracyColor = getAccuracyColor(accuracy);
  const statusText = getAccuracyStatus(accuracy);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ── GUIDED SETUP PHASE ──
  // Renders at TOP + BOTTOM only — the center of the screen stays clear
  // so the camera feed and skeleton overlay remain visible.
  if (phase === 'guided_setup') {
    return (
      <View style={styles.container} pointerEvents="box-none">
        {/* Top bar — Pose name + step badge */}
        <Animated.View style={[styles.topBar, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.topBarInner}>
            <View style={styles.poseInfo}>
              <Text style={styles.poseName}>{poseName}</Text>
              <Text style={[styles.statusText, cameraHintText ? { color: COLORS.accent, ...FONTS.medium } : {}]}>
                {cameraHintText ? `📷 ${cameraHintText}` : 'Getting into position...'}
              </Text>
            </View>
            <View style={styles.stepBadge}>
              <Text style={styles.stepBadgeText}>
                {instructionStep + 1}/{totalInstructions}
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* Pose reference thumbnail — top-right corner below top bar */}
        {poseThumbnail ? (
          <View style={styles.poseThumbnailContainer}>
            <Image
              source={{ uri: poseThumbnail }}
              style={styles.poseThumbnail}
              resizeMode="cover"
            />
            <Text style={styles.poseThumbnailLabel}>Target Pose</Text>
          </View>
        ) : null}

        {/* Live accuracy badge — shown in mid-right if we have readings */}
        {accuracy > 0 && (
          <View style={styles.setupAccuracyBadge}>
            <Text style={[styles.setupAccuracyValue, { color: getAccuracyColor(accuracy) }]}>
              {accuracy}%
            </Text>
            <Text style={styles.setupAccuracyLabel}>Accuracy</Text>
          </View>
        )}

        {/* Bottom instruction card — sits at bottom so camera/skeleton stay visible */}
        <View style={styles.guidedBottom}>
          <View style={styles.instructionCardBottom}>
            <View style={styles.instructionRowCompact}>
              <View style={styles.instructionIconCircleSmall}>
                <Ionicons name="body" size={20} color={COLORS.primary} />
              </View>
              <View style={styles.instructionContentCompact}>
                <Text style={styles.instructionStepLabelSmall}>
                  Step {instructionStep + 1} of {totalInstructions}
                </Text>
                <Text style={styles.instructionTextCompact}>
                  {currentInstruction}
                </Text>
              </View>
            </View>
            {/* Progress dots */}
            <View style={styles.progressDots}>
              {Array.from({ length: totalInstructions }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.progressDot,
                    i <= instructionStep && styles.progressDotActive,
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  }

  // ── COUNTDOWN PHASE ──
  if (phase === 'countdown') {
    return (
      <View style={styles.container} pointerEvents="box-none">
        {/* Top bar — Pose name + status */}
        <Animated.View style={[styles.topBar, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.topBarInner}>
            <View style={styles.poseInfo}>
              <Text style={styles.poseName}>{poseName}</Text>
              <Text style={styles.statusText}>Starting in...</Text>
            </View>
          </View>
        </Animated.View>

        {/* Pose reference thumbnail */}
        {poseThumbnail ? (
          <View style={styles.poseThumbnailContainer}>
            <Image
              source={{ uri: poseThumbnail }}
              style={styles.poseThumbnail}
              resizeMode="cover"
            />
            <Text style={styles.poseThumbnailLabel}>Target Pose</Text>
          </View>
        ) : null}

        <View style={styles.countdownCenter}>
          <Animated.View
            style={[
              styles.countdownCircle,
              {
                transform: [{ scale: countdownScale }],
                opacity: countdownOpacity,
              },
            ]}
          >
            <Text style={styles.countdownValue}>{countdownValue}</Text>
          </Animated.View>
          <Text style={styles.countdownLabel}>
            {countdownValue > 0 ? 'Hold your pose...' : 'Go!'}
          </Text>
        </View>
      </View>
    );
  }

  // ── ACTIVE DETECTION PHASE ──
  const safeFeedback = feedback || [];
  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Top bar - Pose name and timer */}
      <Animated.View style={[styles.topBar, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.topBarInner}>
          <View style={styles.poseInfo}>
            <Text style={styles.poseName}>{poseName}</Text>
            <Text style={styles.statusText}>{statusText}</Text>
          </View>
          <View style={styles.timerContainer}>
            <Ionicons name="time-outline" size={16} color={COLORS.accent} />
            <Text style={styles.timerText}>{formatTimer(duration || 0)}</Text>
          </View>
        </View>
      </Animated.View>

      {/* Target pose thumbnail */}
      {poseThumbnail ? (
        <View style={styles.poseThumbnailContainer}>
          <Image
            source={{ uri: poseThumbnail }}
            style={styles.poseThumbnail}
            resizeMode="cover"
          />
          <Text style={styles.poseThumbnailLabel}>Target Pose</Text>
        </View>
      ) : null}

      {/* Accuracy circle */}
      <Animated.View
        style={[
          styles.accuracyContainer,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <View style={[styles.accuracyCircle, { borderColor: accuracyColor }]}>
          <Text style={[styles.accuracyValue, { color: accuracyColor }]}>
            {accuracy}%
          </Text>
          <Text style={styles.accuracyLabel}>Accuracy</Text>
        </View>
      </Animated.View>

      {/* Bottom feedback panel */}
      <View style={styles.bottomPanel}>
        <View style={styles.feedbackContainer}>
          {/* Primary feedback */}
          <View style={styles.primaryFeedbackRow}>
            <Ionicons
              name={accuracy >= 80 ? 'checkmark-circle' : 'information-circle'}
              size={20}
              color={accuracyColor}
            />
            <Text style={[styles.primaryFeedback, { color: accuracyColor }]}>
              {primaryFeedback}
            </Text>
          </View>

          {/* Secondary feedback items */}
          {safeFeedback.slice(0, 2).map((item, index) => (
            <View key={index} style={styles.feedbackItem}>
              <Ionicons name="arrow-forward" size={14} color={COLORS.textSecondary} />
              <Text style={styles.feedbackText}>{item}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  // ── Top bar ──
  topBar: {
    paddingTop: 60,
    paddingHorizontal: SPACING.md,
  },
  topBarInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(10, 14, 33, 0.75)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  poseInfo: {
    flex: 1,
  },
  poseName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    ...FONTS.bold,
  },
  statusText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    marginTop: 2,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 217, 166, 0.1)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    gap: 4,
  },
  timerText: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.lg,
    ...FONTS.bold,
    fontVariant: ['tabular-nums'],
  },
  // ── Step badge ──
  stepBadge: {
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  stepBadgeText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    ...FONTS.bold,
  },
  // ── Guided Setup (bottom-positioned) ──
  guidedBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl + 10,
  },
  instructionCardBottom: {
    backgroundColor: 'rgba(10, 14, 33, 0.88)',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  instructionRowCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  instructionIconCircleSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.25)',
  },
  instructionContentCompact: {
    flex: 1,
  },
  instructionStepLabelSmall: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.xs,
    ...FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 2,
  },
  instructionTextCompact: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    ...FONTS.semiBold,
    lineHeight: 22,
  },
  // ── Pose thumbnail (guided setup) ──
  poseThumbnailContainer: {
    position: 'absolute',
    top: 130,
    left: SPACING.md,
    alignItems: 'center',
  },
  poseThumbnail: {
    width: 80,
    height: 100,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: 'rgba(108, 99, 255, 0.4)',
  },
  poseThumbnailLabel: {
    color: COLORS.textSecondary,
    fontSize: 9,
    ...FONTS.medium,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // ── Setup accuracy badge ──
  setupAccuracyBadge: {
    position: 'absolute',
    top: 130,
    right: SPACING.md,
    backgroundColor: 'rgba(10, 14, 33, 0.75)',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  setupAccuracyValue: {
    fontSize: FONT_SIZES.lg,
    ...FONTS.extraBold,
  },
  setupAccuracyLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    ...FONTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 6,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  progressDotActive: {
    backgroundColor: COLORS.primary,
  },
  // ── Countdown ──
  countdownCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  countdownCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
    borderWidth: 3,
    borderColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countdownValue: {
    color: COLORS.textPrimary,
    fontSize: 64,
    ...FONTS.extraBold,
  },
  countdownLabel: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.lg,
    ...FONTS.medium,
    marginTop: SPACING.lg,
    textTransform: 'uppercase',
    letterSpacing: 2,
  },
  // ── Active Detection ──
  accuracyContainer: {
    alignSelf: 'flex-end',
    marginRight: SPACING.lg,
  },
  accuracyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    backgroundColor: 'rgba(10, 14, 33, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  accuracyValue: {
    fontSize: FONT_SIZES.xl,
    ...FONTS.extraBold,
  },
  accuracyLabel: {
    color: COLORS.textMuted,
    fontSize: 8,
    ...FONTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  bottomPanel: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  feedbackContainer: {
    backgroundColor: 'rgba(10, 14, 33, 0.85)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  primaryFeedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  primaryFeedback: {
    fontSize: FONT_SIZES.body,
    ...FONTS.semiBold,
    flex: 1,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 4,
    paddingLeft: SPACING.xs,
  },
  feedbackText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    flex: 1,
  },
});

export default FeedbackOverlay;
