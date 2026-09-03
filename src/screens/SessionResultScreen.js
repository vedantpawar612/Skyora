// Session Result Screen — Post-session AI training report
// Shows detailed breakdown of accuracy, per-joint analysis,
// improvement tips, and accuracy timeline after a training session.
import React, { useMemo, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, StatusBar,
  Dimensions, TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING } from '../config/theme';
import { ROUTES } from '../config/navigation';
import GradientButton from '../components/GradientButton';
import { JOINT_PAIRS, getJointImprovementTip, getPerformanceMessage } from '../data/sessionFeedback';
import { saveSessionRecord } from '../services/sessionStorage';

const { width } = Dimensions.get('window');

const SessionResultScreen = ({ route, navigation }) => {
  const { sessionReport } = route.params;
  const [isSaved, setIsSaved] = useState(false);

  // Auto-save session to history
  useEffect(() => {
    let mounted = true;
    if (sessionReport) {
      saveSessionRecord(sessionReport).then(() => {
        if (mounted) setIsSaved(true);
      });
    }
    return () => { mounted = false; };
  }, [sessionReport]);
  const {
    pose,
    avgAccuracy,
    finalPoseAccuracy,
    startingAccuracy,
    peakAccuracy,
    sessionDuration,
    totalReadings,
    accuracyTimeline,
    jointBreakdown,
    lastJointResults,
    jointFeedbackCount,
  } = sessionReport;

  const performance = getPerformanceMessage(avgAccuracy);

  // Compute paired joint data (combine L/R into one entry)
  const pairedJointData = useMemo(() => {
    return JOINT_PAIRS.map(pair => {
      const leftAcc = jointBreakdown[pair.left] ?? null;
      const rightAcc = jointBreakdown[pair.right] ?? null;
      const validAccs = [leftAcc, rightAcc].filter(a => a !== null);
      const avgAcc = validAccs.length > 0
        ? Math.round(validAccs.reduce((a, b) => a + b, 0) / validAccs.length)
        : null;

      // Get improvement tip based on whichever side had more issues
      const leftFb = jointFeedbackCount[pair.left] || { tooSmall: 0, tooBig: 0 };
      const rightFb = jointFeedbackCount[pair.right] || { tooSmall: 0, tooBig: 0 };
      const combinedFb = {
        tooSmall: leftFb.tooSmall + rightFb.tooSmall,
        tooBig: leftFb.tooBig + rightFb.tooBig,
      };
      const totalIssues = combinedFb.tooSmall + combinedFb.tooBig;

      // Use the side with more issues for the tip
      const worseJoint = (leftFb.tooSmall + leftFb.tooBig) >= (rightFb.tooSmall + rightFb.tooBig)
        ? pair.left : pair.right;
      const tipInfo = getJointImprovementTip(worseJoint, combinedFb);

      return {
        ...pair,
        accuracy: avgAcc,
        totalIssues,
        tipInfo,
        status: avgAcc === null ? 'unknown'
          : avgAcc >= 80 ? 'good'
          : avgAcc >= 60 ? 'moderate'
          : 'poor',
      };
    }).filter(j => j.accuracy !== null);
  }, [jointBreakdown, jointFeedbackCount]);

  // Sort to find weakest joints (ones needing most improvement)
  const weakestJoints = useMemo(() => {
    return [...pairedJointData]
      .sort((a, b) => a.accuracy - b.accuracy)
      .filter(j => j.accuracy < 85)
      .slice(0, 3);
  }, [pairedJointData]);

  const improvement = finalPoseAccuracy - startingAccuracy;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'good': return { icon: 'checkmark-circle', color: '#00E676' };
      case 'moderate': return { icon: 'alert-circle', color: '#FFD600' };
      case 'poor': return { icon: 'close-circle', color: '#FF5252' };
      default: return { icon: 'help-circle', color: COLORS.textSecondary };
    }
  };

  const getAccuracyColor = (acc) => {
    if (acc >= 80) return '#00E676';
    if (acc >= 60) return '#FFD600';
    return '#FF5252';
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Session Report</Text>
            <Text style={styles.headerSubtitle}>{pose.name}</Text>
            {isSaved && (
              <View style={styles.savedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#00E676" />
                <Text style={styles.savedText}>Saved to Progress</Text>
              </View>
            )}
          </View>

          {/* ── Overall Score ── */}
          <View style={styles.scoreSection}>
            <View style={styles.scoreCircleOuter}>
              <LinearGradient
                colors={avgAccuracy >= 70 ? COLORS.gradientAccent : COLORS.gradientPrimary}
                style={styles.scoreCircle}
              >
                <Text style={styles.scoreValue}>{avgAccuracy}%</Text>
                <Text style={styles.scoreLabel}>Average</Text>
              </LinearGradient>
            </View>
            <Text style={styles.performanceTitle}>{performance.title}</Text>
            <Text style={styles.performanceSubtitle}>{performance.subtitle}</Text>
          </View>

          {/* ── Improvement Indicator ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>📈 Your Improvement</Text>
            <View style={styles.improvementRow}>
              <View style={styles.improvementItem}>
                <Text style={styles.improvementLabel}>Starting</Text>
                <Text style={[styles.improvementValue, { color: getAccuracyColor(startingAccuracy) }]}>
                  {startingAccuracy}%
                </Text>
              </View>
              <View style={styles.improvementArrow}>
                <Ionicons
                  name={improvement >= 0 ? 'arrow-forward' : 'arrow-forward'}
                  size={24}
                  color={improvement >= 0 ? '#00E676' : '#FF5252'}
                />
                <Text style={[styles.improvementDelta, {
                  color: improvement >= 0 ? '#00E676' : '#FF5252',
                }]}>
                  {improvement >= 0 ? '+' : ''}{improvement}%
                </Text>
              </View>
              <View style={styles.improvementItem}>
                <Text style={styles.improvementLabel}>Final Pose</Text>
                <Text style={[styles.improvementValue, { color: getAccuracyColor(finalPoseAccuracy) }]}>
                  {finalPoseAccuracy}%
                </Text>
              </View>
            </View>
          </View>

          {/* ── Session Stats ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>⏱️ Session Stats</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="time-outline" size={22} color={COLORS.accent} />
                <Text style={styles.statValue}>
                  {Math.floor(sessionDuration / 60)}:{(sessionDuration % 60).toString().padStart(2, '0')}
                </Text>
                <Text style={styles.statLabel}>Duration</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="trophy-outline" size={22} color="#FFD600" />
                <Text style={styles.statValue}>{peakAccuracy}%</Text>
                <Text style={styles.statLabel}>Peak</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Ionicons name="analytics-outline" size={22} color={COLORS.primary} />
                <Text style={styles.statValue}>{totalReadings}</Text>
                <Text style={styles.statLabel}>Frames</Text>
              </View>
            </View>
          </View>

          {/* ── Per-Joint Breakdown ── */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>🦴 Joint Breakdown</Text>
            {pairedJointData.map(joint => {
              const statusInfo = getStatusIcon(joint.status);
              return (
                <View key={joint.key} style={styles.jointRow}>
                  <View style={styles.jointLeft}>
                    <Ionicons name={statusInfo.icon} size={20} color={statusInfo.color} />
                    <Text style={styles.jointName}>{joint.name}</Text>
                  </View>
                  <View style={styles.jointRight}>
                    <View style={styles.jointBarBg}>
                      <View style={[styles.jointBarFill, {
                        width: `${joint.accuracy}%`,
                        backgroundColor: getAccuracyColor(joint.accuracy),
                      }]} />
                    </View>
                    <Text style={[styles.jointAccuracy, { color: getAccuracyColor(joint.accuracy) }]}>
                      {joint.accuracy}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── Joints to Improve ── */}
          {weakestJoints.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>🎯 Improve These Joints</Text>
              {weakestJoints.map(joint => (
                <View key={joint.key} style={styles.improveTipCard}>
                  <View style={styles.improveTipHeader}>
                    <Ionicons
                      name={getStatusIcon(joint.status).icon}
                      size={18}
                      color={getStatusIcon(joint.status).color}
                    />
                    <Text style={styles.improveTipJoint}>{joint.name}</Text>
                    <Text style={[styles.improveTipAcc, { color: getAccuracyColor(joint.accuracy) }]}>
                      {joint.accuracy}%
                    </Text>
                  </View>
                  <Text style={styles.improveTipText}>
                    💡 {joint.tipInfo.tip}
                  </Text>
                  {joint.tipInfo.exercises.length > 0 && (
                    <Text style={styles.improveTipExercises}>
                      🏋️ Try: {joint.tipInfo.exercises.join(' • ')}
                    </Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* ── Accuracy Timeline ── */}
          {accuracyTimeline.length > 2 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>📊 Accuracy Timeline</Text>
              <View style={styles.chartContainer}>
                <View style={styles.chartYAxis}>
                  <Text style={styles.chartYLabel}>100%</Text>
                  <Text style={styles.chartYLabel}>50%</Text>
                  <Text style={styles.chartYLabel}>0%</Text>
                </View>
                <View style={styles.chartArea}>
                  {/* Grid lines */}
                  <View style={[styles.chartGridLine, { bottom: '100%' }]} />
                  <View style={[styles.chartGridLine, { bottom: '50%' }]} />
                  <View style={[styles.chartGridLine, { bottom: '0%' }]} />
                  {/* Bars */}
                  <View style={styles.chartBars}>
                    {accuracyTimeline.map((acc, i) => (
                      <View key={i} style={styles.chartBarWrapper}>
                        <View style={[styles.chartBar, {
                          height: `${Math.max(2, acc)}%`,
                          backgroundColor: getAccuracyColor(acc),
                        }]} />
                      </View>
                    ))}
                  </View>
                </View>
              </View>
              <View style={styles.chartXLabels}>
                <Text style={styles.chartXLabel}>Start</Text>
                <Text style={styles.chartXLabel}>End</Text>
              </View>
            </View>
          )}

          {/* ── Action Buttons ── */}
          <View style={styles.actions}>
            <GradientButton
              title="Practice Again"
              onPress={() => navigation.replace(ROUTES.CAMERA_SESSION, { pose })}
              icon={<Ionicons name="refresh" size={18} color="#FFF" />}
              style={styles.actionBtn}
            />
            <GradientButton
              title="Back to Library"
              onPress={() => navigation.navigate(ROUTES.LIBRARY)}
              variant="outline"
              style={styles.actionBtn}
            />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: 60,
    paddingBottom: 20,
  },

  // Header
  header: {
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  savedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderRadius: BORDER_RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    marginTop: 6,
  },
  savedText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: '#00E676',
    marginLeft: 4,
  },

  // Score section
  scoreSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  scoreCircleOuter: {
    padding: 4,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  scoreCircle: {
    width: 130,
    height: 130,
    borderRadius: 65,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scoreValue: {
    fontSize: 36,
    fontFamily: FONTS.bold,
    color: '#FFF',
  },
  scoreLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: 'rgba(255,255,255,0.8)',
    marginTop: -2,
  },
  performanceTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginTop: SPACING.md,
  },
  performanceSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 4,
  },

  // Card
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },

  // Improvement
  improvementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  improvementItem: {
    alignItems: 'center',
    flex: 1,
  },
  improvementLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  improvementValue: {
    fontSize: 28,
    fontFamily: FONTS.bold,
  },
  improvementArrow: {
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  improvementDelta: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    marginTop: 2,
  },

  // Stats row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginTop: 4,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // Joint breakdown
  jointRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  jointLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 110,
  },
  jointName: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    color: COLORS.textPrimary,
    marginLeft: 8,
  },
  jointRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  jointBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  jointBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  jointAccuracy: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    marginLeft: 10,
    width: 42,
    textAlign: 'right',
  },

  // Improve tips
  improveTipCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderLeftWidth: 3,
    borderLeftColor: '#FFD600',
  },
  improveTipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  improveTipJoint: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
    color: COLORS.textPrimary,
    marginLeft: 6,
    flex: 1,
  },
  improveTipAcc: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.bold,
  },
  improveTipText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  improveTipExercises: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
    color: COLORS.textTertiary || COLORS.textSecondary,
    marginTop: 6,
    opacity: 0.8,
  },

  // Chart
  chartContainer: {
    flexDirection: 'row',
    height: 120,
  },
  chartYAxis: {
    width: 36,
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingRight: 6,
  },
  chartYLabel: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },
  chartArea: {
    flex: 1,
    position: 'relative',
  },
  chartGridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  chartBars: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  chartBarWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: '100%',
    paddingHorizontal: 1,
  },
  chartBar: {
    width: '80%',
    minWidth: 3,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 2,
  },
  chartXLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingLeft: 36,
  },
  chartXLabel: {
    fontSize: 10,
    fontFamily: FONTS.regular,
    color: COLORS.textSecondary,
  },

  // Actions
  actions: {
    marginTop: SPACING.md,
  },
  actionBtn: {
    marginBottom: SPACING.sm,
  },
});

export default SessionResultScreen;
