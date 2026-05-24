// Progress Dashboard Screen - Stats, charts, and session history
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../config/theme';
import StatCard from '../components/StatCard';
import { YOGA_POSES } from '../data/poses';
import { formatDate, calculateAccuracyColor } from '../utils/helpers';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - SPACING.lg * 2 - SPACING.md * 2;
const CHART_HEIGHT = 180;

// Demo progress data
const DEMO_PROGRESS = [
  { id: '1', poseId: 'mountain_pose', accuracy: 65, duration: 45, timestamp: new Date(Date.now() - 6 * 86400000) },
  { id: '2', poseId: 'warrior_one', accuracy: 58, duration: 30, timestamp: new Date(Date.now() - 5 * 86400000) },
  { id: '3', poseId: 'tree_pose', accuracy: 72, duration: 35, timestamp: new Date(Date.now() - 4 * 86400000) },
  { id: '4', poseId: 'downward_dog', accuracy: 68, duration: 50, timestamp: new Date(Date.now() - 3 * 86400000) },
  { id: '5', poseId: 'warrior_two', accuracy: 75, duration: 40, timestamp: new Date(Date.now() - 2 * 86400000) },
  { id: '6', poseId: 'cobra_pose', accuracy: 82, duration: 28, timestamp: new Date(Date.now() - 1 * 86400000) },
  { id: '7', poseId: 'mountain_pose', accuracy: 88, duration: 55, timestamp: new Date() },
];

const ProgressScreen = ({ navigation }) => {
  const [selectedPeriod, setSelectedPeriod] = useState('Week');
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const chartAnim = useRef(new Animated.Value(0)).current;

  const progress = DEMO_PROGRESS;
  const totalSessions = progress.length;
  const avgAccuracy = Math.round(progress.reduce((s, p) => s + p.accuracy, 0) / totalSessions);
  const totalDuration = progress.reduce((s, p) => s + p.duration, 0);
  const bestAccuracy = Math.max(...progress.map(p => p.accuracy));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(chartAnim, { toValue: 1, duration: 1000, useNativeDriver: false }),
    ]).start();
  }, []);

  // Build chart data
  const chartData = progress.map((p, i) => ({
    x: (i / (progress.length - 1)) * CHART_WIDTH,
    y: CHART_HEIGHT - (p.accuracy / 100) * CHART_HEIGHT,
    accuracy: p.accuracy,
    date: p.timestamp,
  }));

  const polylinePoints = chartData.map(d => `${d.x},${d.y}`).join(' ');

  const getPoseName = (poseId) => {
    const p = YOGA_POSES.find(pose => pose.id === poseId);
    return p ? p.name : poseId;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.headerTitle}>Your Progress</Text>
              <Text style={styles.headerSubtitle}>Track your yoga journey</Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsRow}>
              <StatCard
                title="Total Sessions"
                value={totalSessions}
                icon="flame-outline"
                iconColor={COLORS.error}
                gradient
              />
              <View style={{ width: SPACING.sm }} />
              <StatCard
                title="Avg Accuracy"
                value={avgAccuracy}
                suffix="%"
                icon="analytics-outline"
                iconColor={COLORS.accent}
              />
            </View>
            <View style={styles.statsRow}>
              <StatCard
                title="Best Score"
                value={bestAccuracy}
                suffix="%"
                icon="trophy-outline"
                iconColor={COLORS.warning}
              />
              <View style={{ width: SPACING.sm }} />
              <StatCard
                title="Minutes"
                value={Math.round(totalDuration / 60)}
                icon="time-outline"
                iconColor={COLORS.info}
              />
            </View>

            {/* Accuracy Chart */}
            <View style={styles.chartCard}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Accuracy Over Time</Text>
                <View style={styles.periodSelector}>
                  {['Week', 'Month', 'All'].map((period) => (
                    <TouchableOpacity
                      key={period}
                      onPress={() => setSelectedPeriod(period)}
                      style={[
                        styles.periodBtn,
                        selectedPeriod === period && styles.periodBtnActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.periodText,
                          selectedPeriod === period && styles.periodTextActive,
                        ]}
                      >
                        {period}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.chartContainer}>
                <Svg width={CHART_WIDTH} height={CHART_HEIGHT + 30}>
                  {/* Grid lines */}
                  {[0, 25, 50, 75, 100].map((val) => {
                    const y = CHART_HEIGHT - (val / 100) * CHART_HEIGHT;
                    return (
                      <React.Fragment key={val}>
                        <Line
                          x1={0} y1={y} x2={CHART_WIDTH} y2={y}
                          stroke={COLORS.surfaceBorder}
                          strokeWidth={1}
                          strokeDasharray="4,4"
                        />
                        <SvgText x={-4} y={y + 4} fill={COLORS.textMuted} fontSize={9} textAnchor="end">
                          {val}%
                        </SvgText>
                      </React.Fragment>
                    );
                  })}

                  {/* Line chart */}
                  <Polyline
                    points={polylinePoints}
                    fill="none"
                    stroke={COLORS.primary}
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data points */}
                  {chartData.map((point, i) => (
                    <React.Fragment key={i}>
                      <Circle
                        cx={point.x} cy={point.y} r={5}
                        fill={COLORS.primary} opacity={0.3}
                      />
                      <Circle
                        cx={point.x} cy={point.y} r={3}
                        fill={COLORS.primary}
                      />
                    </React.Fragment>
                  ))}

                  {/* Date labels */}
                  {chartData.map((point, i) => {
                    if (i % 2 !== 0 && i !== chartData.length - 1) return null;
                    const dateStr = point.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    return (
                      <SvgText
                        key={`date-${i}`}
                        x={point.x}
                        y={CHART_HEIGHT + 18}
                        fill={COLORS.textMuted}
                        fontSize={9}
                        textAnchor="middle"
                      >
                        {dateStr}
                      </SvgText>
                    );
                  })}
                </Svg>
              </View>
            </View>

            {/* Session History */}
            <Text style={styles.sectionTitle}>Session History</Text>
            {progress.slice().reverse().map((session, index) => {
              const accColor = calculateAccuracyColor(session.accuracy);
              return (
                <Animated.View
                  key={session.id}
                  style={[
                    styles.sessionCard,
                    {
                      opacity: fadeAnim,
                      transform: [{
                        translateX: fadeAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [-30, 0],
                        }),
                      }],
                    },
                  ]}
                >
                  <View style={[styles.sessionAccuracyBar, { backgroundColor: accColor }]} />
                  <View style={styles.sessionContent}>
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionPose}>{getPoseName(session.poseId)}</Text>
                      <Text style={styles.sessionDate}>{formatDate(session.timestamp)}</Text>
                    </View>
                    <View style={styles.sessionMeta}>
                      <View style={styles.sessionMetaItem}>
                        <Text style={[styles.sessionAccuracy, { color: accColor }]}>
                          {session.accuracy}%
                        </Text>
                        <Text style={styles.sessionMetaLabel}>Accuracy</Text>
                      </View>
                      <View style={styles.sessionMetaItem}>
                        <Text style={styles.sessionDuration}>{session.duration}s</Text>
                        <Text style={styles.sessionMetaLabel}>Duration</Text>
                      </View>
                    </View>
                  </View>
                </Animated.View>
              );
            })}

            {/* Encouragement */}
            <View style={styles.encouragementCard}>
              <LinearGradient
                colors={['rgba(108, 99, 255, 0.15)', 'rgba(0, 217, 166, 0.08)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.encouragementGradient}
              >
                <Ionicons name="sparkles" size={28} color={COLORS.accent} />
                <Text style={styles.encouragementTitle}>Keep it up!</Text>
                <Text style={styles.encouragementText}>
                  Your accuracy is improving! Practice daily to maintain your streak and reach your goals.
                </Text>
              </LinearGradient>
            </View>
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 100,
    paddingHorizontal: SPACING.lg,
  },
  // Header
  header: { marginBottom: SPACING.lg },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxl,
    ...FONTS.bold,
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    marginTop: 4,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.sm,
  },
  // Chart
  chartCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  chartTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    ...FONTS.semiBold,
  },
  periodSelector: {
    flexDirection: 'row',
    gap: 4,
  },
  periodBtn: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
  },
  periodBtnActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.2)',
  },
  periodText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.medium,
  },
  periodTextActive: {
    color: COLORS.primary,
  },
  chartContainer: {
    paddingLeft: 28,
  },
  // Section
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    ...FONTS.bold,
    marginBottom: SPACING.md,
  },
  // Session history
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  sessionAccuracyBar: {
    width: 4,
  },
  sessionContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
  },
  sessionInfo: { flex: 1 },
  sessionPose: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    ...FONTS.semiBold,
  },
  sessionDate: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.regular,
    marginTop: 2,
  },
  sessionMeta: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  sessionMetaItem: {
    alignItems: 'center',
  },
  sessionAccuracy: {
    fontSize: FONT_SIZES.body,
    ...FONTS.bold,
  },
  sessionDuration: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    ...FONTS.bold,
  },
  sessionMetaLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    ...FONTS.regular,
    marginTop: 1,
  },
  // Encouragement
  encouragementCard: {
    marginTop: SPACING.md,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  encouragementGradient: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  encouragementTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    ...FONTS.bold,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  encouragementText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default ProgressScreen;
