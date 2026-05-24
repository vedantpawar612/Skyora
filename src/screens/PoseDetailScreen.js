// Pose Detail Screen - Individual pose info, instructions, and video
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar, Image, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../config/theme';
import { getDifficultyColor } from '../data/poses';
import GradientButton from '../components/GradientButton';

const { width, height } = Dimensions.get('window');

const PoseDetailScreen = ({ route, navigation }) => {
  const { pose } = route.params;
  const scrollY = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);

  const difficultyColor = getDifficultyColor(pose.level);

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 200],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Fixed header that appears on scroll */}
      <Animated.View style={[styles.fixedHeader, { opacity: headerOpacity }]}>
        <LinearGradient colors={[COLORS.background, COLORS.background]} style={styles.fixedHeaderGradient}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBackBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.fixedHeaderTitle} numberOfLines={1}>{pose.name}</Text>
          <View style={{ width: 40 }} />
        </LinearGradient>
      </Animated.View>

      <Animated.ScrollView
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: pose.thumbnailUrl }} style={styles.heroImage} />
          <LinearGradient
            colors={['rgba(10,14,33,0.3)', 'rgba(10,14,33,0.95)', COLORS.background]}
            style={styles.heroOverlay}
          />
          
          {/* Back button on image */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>

          {/* Pose info on image */}
          <View style={styles.heroInfo}>
            <View style={[styles.difficultyBadge, { backgroundColor: difficultyColor + '20' }]}>
              <Text style={[styles.difficultyText, { color: difficultyColor }]}>{pose.level}</Text>
            </View>
            <Text style={styles.poseName}>{pose.name}</Text>
            <Text style={styles.sanskritName}>{pose.sanskritName}</Text>
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={16} color={COLORS.accent} />
                <Text style={styles.metaText}>{pose.duration}s hold</Text>
              </View>
              <View style={styles.metaDot} />
              <View style={styles.metaItem}>
                <Ionicons name="fitness-outline" size={16} color={COLORS.primary} />
                <Text style={styles.metaText}>{Object.keys(pose.targetAngles).length} joints tracked</Text>
              </View>
            </View>
          </View>
        </View>

        <Animated.View style={[styles.contentContainer, { opacity: fadeAnim }]}>
          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About this Pose</Text>
            <Text style={styles.description}>{pose.description}</Text>
          </View>

          {/* Benefits */}
          {pose.benefits && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Benefits</Text>
              <View style={styles.benefitsContainer}>
                {pose.benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <View style={styles.benefitDot}>
                      <Ionicons name="checkmark" size={12} color={COLORS.accent} />
                    </View>
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Step-by-step Instructions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {pose.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>

          {/* Target Joint Angles */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Target Angles</Text>
            <Text style={styles.sectionSubtitle}>AI will compare your pose against these benchmarks</Text>
            <View style={styles.anglesGrid}>
              {Object.entries(pose.targetAngles).map(([joint, angle]) => (
                <View key={joint} style={styles.angleItem}>
                  <Text style={styles.angleValue}>{angle}°</Text>
                  <Text style={styles.angleName}>
                    {joint.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <GradientButton
              title="Watch Tutorial Video"
              onPress={() => navigation.navigate('VideoPlayer', { pose })}
              variant="outline"
              icon={<Ionicons name="play-circle-outline" size={20} color={COLORS.primary} />}
              style={styles.actionBtn}
            />
            <GradientButton
              title="Start AI Practice Session"
              onPress={() => navigation.navigate('CameraSession', { pose })}
              icon={<Ionicons name="camera-outline" size={20} color="#FFF" />}
              style={styles.actionBtn}
            />
          </View>
        </Animated.View>
      </Animated.ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  // Fixed header
  fixedHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  fixedHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  headerBackBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  fixedHeaderTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    ...FONTS.semiBold,
    flex: 1,
    textAlign: 'center',
  },
  // Hero
  heroContainer: {
    height: height * 0.45,
    width: '100%',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: SPACING.md,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0, right: 0,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.md,
  },
  difficultyBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    marginBottom: SPACING.sm,
  },
  difficultyText: {
    fontSize: FONT_SIZES.xs,
    ...FONTS.bold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  poseName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.hero,
    ...FONTS.bold,
    marginBottom: 2,
  },
  sanskritName: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.body,
    ...FONTS.regular,
    fontStyle: 'italic',
    marginBottom: SPACING.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.medium,
  },
  metaDot: {
    width: 4, height: 4, borderRadius: 2,
    backgroundColor: COLORS.textMuted,
    marginHorizontal: SPACING.sm,
  },
  // Content
  contentContainer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    ...FONTS.bold,
    marginBottom: SPACING.sm,
  },
  sectionSubtitle: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    marginBottom: SPACING.md,
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    ...FONTS.regular,
    lineHeight: 24,
  },
  // Benefits
  benefitsContainer: {
    gap: SPACING.sm,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  benefitDot: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: 'rgba(0, 217, 166, 0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  benefitText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
  },
  // Instructions
  instructionItem: {
    flexDirection: 'row',
    marginBottom: SPACING.md,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.backgroundElevated,
    alignItems: 'center', justifyContent: 'center',
    marginRight: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  stepNumberText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.bold,
  },
  instructionText: {
    flex: 1,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
    lineHeight: 22,
    paddingTop: 3,
  },
  // Angles
  anglesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  angleItem: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    minWidth: (width - SPACING.lg * 2 - SPACING.sm * 3) / 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  angleValue: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.lg,
    ...FONTS.bold,
  },
  angleName: {
    color: COLORS.textMuted,
    fontSize: 9,
    ...FONTS.medium,
    marginTop: 2,
    textAlign: 'center',
  },
  // Actions
  actionButtons: {
    gap: SPACING.md,
    marginTop: SPACING.md,
  },
  actionBtn: {
    width: '100%',
  },
});

export default PoseDetailScreen;
