// Pose Detail Screen - Premium split-panel view; all content visible in one frame on wide screens.
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar, Image, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../config/theme';
import { getDifficultyColor } from '../data/poses';
import GradientButton from '../components/GradientButton';

const formatJointName = (key) =>
  key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase());

const PoseDetailScreen = ({ route, navigation }) => {
  const { pose } = route.params;
  const { width: winWidth } = useWindowDimensions();
  const isWide = winWidth >= 900;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const difficultyColor = getDifficultyColor(pose.level);
  const jointCount = Object.keys(pose.targetAngles).length;

  const Hero = () => (
    <View style={styles.hero}>
      <Image source={{ uri: pose.thumbnailUrl }} style={styles.heroImg} />
      <LinearGradient
        colors={['rgba(10,14,33,0.15)', 'rgba(10,14,33,0.55)', 'rgba(10,14,33,0.98)']}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={['rgba(108,99,255,0.25)', 'transparent', 'rgba(0,217,166,0.15)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.75}>
        <Ionicons name="chevron-back" size={22} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <View style={styles.heroBottom}>
        <View style={[styles.difficultyBadge, { borderColor: difficultyColor + '80', backgroundColor: difficultyColor + '18' }]}>
          <View style={[styles.difficultyDot, { backgroundColor: difficultyColor }]} />
          <Text style={[styles.difficultyText, { color: difficultyColor }]}>{pose.level}</Text>
        </View>

        <Text style={styles.poseName} numberOfLines={1}>{pose.name}</Text>
        <Text style={styles.sanskritName} numberOfLines={1}>{pose.sanskritName}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaPill}>
            <Ionicons name="time-outline" size={14} color={COLORS.accent} />
            <Text style={styles.metaText}>{pose.duration}s hold</Text>
          </View>
          <View style={styles.metaPill}>
            <Ionicons name="pulse-outline" size={14} color={COLORS.primary} />
            <Text style={styles.metaText}>{jointCount} joints tracked</Text>
          </View>
        </View>

        <View style={styles.heroActions}>
          <GradientButton
            title="Watch Tutorial"
            onPress={() => navigation.navigate('VideoPlayer', { pose })}
            variant="outline"
            size="medium"
            icon={<Ionicons name="play-circle" size={18} color={COLORS.primary} />}
            style={styles.heroBtn}
          />
          <GradientButton
            title="Start AI Practice"
            onPress={() => navigation.navigate('CameraSession', { pose })}
            size="medium"
            icon={<Ionicons name="scan-circle" size={18} color="#FFF" />}
            style={styles.heroBtn}
          />
        </View>
      </View>
    </View>
  );

  const Card = ({ title, icon, iconColor, subtitle, children, style }) => (
    <LinearGradient
      colors={['rgba(255,255,255,0.045)', 'rgba(255,255,255,0.015)']}
      style={[styles.card, style]}
    >
      <View style={styles.cardHeader}>
        {icon ? (
          <View style={[styles.cardIcon, { backgroundColor: (iconColor || COLORS.primary) + '24' }]}>
            <Ionicons name={icon} size={14} color={iconColor || COLORS.primary} />
          </View>
        ) : null}
        <Text style={styles.cardTitle}>{title}</Text>
      </View>
      {subtitle ? <Text style={styles.cardSubtitle}>{subtitle}</Text> : null}
      {children}
    </LinearGradient>
  );

  const InfoPanel = () => (
    <Animated.View style={[styles.infoPanel, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      {/* Row 1: About + Benefits */}
      <View style={styles.row}>
        <Card
          title="About this Pose"
          icon="information-circle"
          iconColor={COLORS.primaryLight}
          style={styles.aboutCard}
        >
          <Text style={styles.description} numberOfLines={4}>{pose.description}</Text>
        </Card>

        {pose.benefits ? (
          <Card
            title="Benefits"
            icon="sparkles"
            iconColor={COLORS.accent}
            style={styles.benefitsCard}
          >
            <View style={styles.benefitsList}>
              {pose.benefits.map((b, i) => (
                <View key={i} style={styles.benefitRow}>
                  <Ionicons name="checkmark-circle" size={14} color={COLORS.accent} />
                  <Text style={styles.benefitText} numberOfLines={1}>{b}</Text>
                </View>
              ))}
            </View>
          </Card>
        ) : null}
      </View>

      {/* Row 2: Instructions */}
      <Card
        title="Instructions"
        icon="list"
        iconColor={COLORS.primaryLight}
        style={styles.instructionsCard}
      >
        <View style={styles.instructionsGrid}>
          {pose.instructions.map((ins, i) => (
            <View key={i} style={styles.instructionItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>{i + 1}</Text>
              </View>
              <Text style={styles.instructionText} numberOfLines={2}>{ins}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* Row 3: Target Angles */}
      <Card
        title="Target Angles"
        icon="analytics"
        iconColor={COLORS.accent}
        subtitle="AI compares your pose against these benchmarks"
        style={styles.anglesCard}
      >
        <View style={styles.anglesGrid}>
          {Object.entries(pose.targetAngles).map(([joint, angle]) => (
            <View key={joint} style={styles.angleItem}>
              <Text style={styles.angleValue}>
                {angle}
                <Text style={styles.angleDeg}>°</Text>
              </Text>
              <Text style={styles.angleName} numberOfLines={1}>{formatJointName(joint)}</Text>
            </View>
          ))}
        </View>
      </Card>
    </Animated.View>
  );

  if (!isWide) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.heroNarrow}><Hero /></View>
          <View style={styles.infoPanelNarrow}><InfoPanel /></View>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      <View style={styles.split}>
        <View style={styles.leftCol}><Hero /></View>
        <View style={styles.rightCol}><InfoPanel /></View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },

  // Layout
  split: { flex: 1, flexDirection: 'row' },
  leftCol: { flex: 1, maxWidth: 520 },
  rightCol: { flex: 1.25, padding: SPACING.lg, gap: SPACING.md },
  heroNarrow: { height: 340 },
  infoPanelNarrow: { padding: SPACING.md, gap: SPACING.md },

  // Hero
  hero: { flex: 1, overflow: 'hidden' },
  heroImg: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%', resizeMode: 'cover' },
  backBtn: {
    position: 'absolute',
    top: SPACING.lg,
    left: SPACING.md,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(10,14,33,0.55)',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 2,
  },
  heroBottom: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.round,
    borderWidth: 1,
  },
  difficultyDot: { width: 6, height: 6, borderRadius: 3 },
  difficultyText: {
    fontSize: FONT_SIZES.xs,
    ...FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  poseName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxl,
    ...FONTS.extraBold,
    letterSpacing: -0.5,
  },
  sanskritName: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
    fontStyle: 'italic',
    marginTop: -2,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    ...FONTS.semiBold,
  },
  heroActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.md,
  },
  heroBtn: { flex: 1 },

  // Info panel
  infoPanel: { flex: 1, gap: SPACING.md },
  row: { flexDirection: 'row', gap: SPACING.md, flex: 1 },
  aboutCard: { flex: 1.5 },
  benefitsCard: { flex: 1 },
  instructionsCard: { flex: 1.7 },
  anglesCard: { flex: 1.15 },

  // Card
  card: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  cardIcon: {
    width: 26, height: 26, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    ...FONTS.bold,
    letterSpacing: 0.2,
  },
  cardSubtitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.regular,
    marginTop: -SPACING.xs,
    marginBottom: SPACING.sm,
  },

  // About
  description: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    lineHeight: 20,
  },

  // Benefits
  benefitsList: { gap: 6 },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  benefitText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.medium,
  },

  // Instructions - 2 column grid
  instructionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    flexBasis: '48%',
    flexGrow: 1,
    paddingVertical: 2,
  },
  stepNumber: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: COLORS.primary + '22',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary + '55',
  },
  stepNumberText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    ...FONTS.bold,
  },
  instructionText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    lineHeight: 18,
  },

  // Angles - 4 column grid
  anglesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs + 2,
  },
  angleItem: {
    flexBasis: '23.5%',
    flexGrow: 1,
    minWidth: 70,
    backgroundColor: 'rgba(0,217,166,0.06)',
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,217,166,0.18)',
  },
  angleValue: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.lg,
    ...FONTS.extraBold,
    letterSpacing: -0.5,
  },
  angleDeg: {
    fontSize: FONT_SIZES.sm,
    ...FONTS.semiBold,
  },
  angleName: {
    color: COLORS.textMuted,
    fontSize: 10,
    ...FONTS.semiBold,
    marginTop: 2,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
});

export default PoseDetailScreen;
