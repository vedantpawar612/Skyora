// FeedbackOverlay Component - Displays corrective feedback and accuracy during pose detection
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING } from '../config/theme';
import { getAccuracyColor, getAccuracyStatus } from '../services/poseComparisonService';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const FeedbackOverlay = ({ accuracy, primaryFeedback, feedback = [], duration, poseName }) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

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

  const accuracyColor = getAccuracyColor(accuracy);
  const statusText = getAccuracyStatus(accuracy);

  const formatTimer = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
          {feedback.slice(0, 2).map((item, index) => (
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
