// Home Screen - Main dashboard with welcome, stats, and quick actions
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, StatusBar, Image, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../config/theme';
import { YOGA_POSES, getDifficultyColor } from '../data/poses';
import StatCard from '../components/StatCard';
import GradientButton from '../components/GradientButton';
import { getGreeting } from '../utils/helpers';
import authService from '../services/authService';

const { width } = Dimensions.get('window');

const HomeScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState(null);
  const scrollAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Demo stats (would come from Firestore in production)
  const [stats] = useState({
    totalSessions: 12,
    averageAccuracy: 78,
    dailyStreak: 5,
    totalDuration: 3600,
  });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const featuredPoses = YOGA_POSES.slice(0, 4);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleLogout = async () => {
    await authService.logout();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollAnim } } }],
            { useNativeDriver: true }
          )}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.greeting}>{getGreeting()} 👋</Text>
                <Text style={styles.userName}>{user?.displayName || 'Yoga Enthusiast'}</Text>
              </View>
              <TouchableOpacity onPress={handleLogout} style={styles.profileBtn}>
                <LinearGradient colors={COLORS.gradientPrimary} style={styles.profileGradient}>
                  <Ionicons name="person" size={18} color="#FFF" />
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Hero Card */}
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => navigation.navigate('Library')}
            >
              <LinearGradient
                colors={['rgba(108, 99, 255, 0.3)', 'rgba(0, 217, 166, 0.15)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.heroContent}>
                  <Text style={styles.heroTitle}>Start Your{'\n'}Yoga Practice</Text>
                  <Text style={styles.heroSubtext}>AI-powered pose detection{'\n'}& real-time feedback</Text>
                  <GradientButton
                    title="Begin Session"
                    onPress={() => navigation.navigate('Library')}
                    size="medium"
                    icon={<Ionicons name="play" size={16} color="#FFF" />}
                    style={styles.heroBtn}
                  />
                </View>
                <View style={styles.heroIconContainer}>
                  <Ionicons name="body" size={80} color="rgba(255,255,255,0.08)" />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Stats Row */}
            <Text style={styles.sectionTitle}>Your Progress</Text>
            <View style={styles.statsRow}>
              <StatCard
                title="Sessions"
                value={stats.totalSessions}
                icon="flame-outline"
                iconColor={COLORS.error}
                gradient
              />
              <View style={{ width: SPACING.sm }} />
              <StatCard
                title="Accuracy"
                value={stats.averageAccuracy}
                suffix="%"
                icon="analytics-outline"
                iconColor={COLORS.accent}
              />
              <View style={{ width: SPACING.sm }} />
              <StatCard
                title="Streak"
                value={stats.dailyStreak}
                suffix="d"
                icon="trending-up-outline"
                iconColor={COLORS.warning}
              />
            </View>

            {/* Featured Poses */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Featured Poses</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Library')}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredScroll}
            >
              {featuredPoses.map((pose) => (
                <TouchableOpacity
                  key={pose.id}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('PoseDetail', { pose })}
                  style={styles.featuredCard}
                >
                  <Image source={{ uri: pose.thumbnailUrl }} style={styles.featuredImage} />
                  <LinearGradient
                    colors={['transparent', 'rgba(10, 14, 33, 0.95)']}
                    style={styles.featuredOverlay}
                  >
                    <View style={[styles.levelBadge, { backgroundColor: getDifficultyColor(pose.level) + '20' }]}>
                      <Text style={[styles.levelText, { color: getDifficultyColor(pose.level) }]}>
                        {pose.level}
                      </Text>
                    </View>
                    <Text style={styles.featuredName}>{pose.name}</Text>
                    <Text style={styles.featuredSanskrit}>{pose.sanskritName}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Quick Tips */}
            <Text style={styles.sectionTitle}>Quick Tips</Text>
            <View style={styles.tipCard}>
              <View style={styles.tipIcon}>
                <Ionicons name="bulb-outline" size={22} color={COLORS.warning} />
              </View>
              <View style={styles.tipContent}>
                <Text style={styles.tipTitle}>Practice Consistently</Text>
                <Text style={styles.tipText}>
                  Even 10 minutes daily can improve flexibility and reduce stress. Use the AI feedback to perfect your form!
                </Text>
              </View>
            </View>
          </Animated.View>
        </Animated.ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerLeft: {},
  greeting: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
  },
  userName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    ...FONTS.bold,
    marginTop: 2,
  },
  profileBtn: {},
  profileGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Hero Card
  heroCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    overflow: 'hidden',
    minHeight: 180,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  heroContent: { flex: 1, zIndex: 1 },
  heroTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxl,
    ...FONTS.bold,
    lineHeight: 34,
    marginBottom: SPACING.sm,
  },
  heroSubtext: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
    lineHeight: 22,
    marginBottom: SPACING.md,
  },
  heroBtn: { alignSelf: 'flex-start' },
  heroIconContainer: {
    position: 'absolute',
    right: SPACING.md,
    bottom: SPACING.md,
    opacity: 0.5,
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    marginBottom: SPACING.lg,
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    ...FONTS.bold,
    marginBottom: SPACING.md,
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.semiBold,
    marginBottom: SPACING.md,
  },
  // Featured
  featuredScroll: {
    paddingBottom: SPACING.md,
    marginBottom: SPACING.md,
  },
  featuredCard: {
    width: width * 0.4,
    height: width * 0.55,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginRight: SPACING.md,
    backgroundColor: COLORS.backgroundCard,
    ...SHADOWS.small,
  },
  featuredImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: SPACING.md,
  },
  levelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
    marginBottom: SPACING.xs,
  },
  levelText: {
    fontSize: 9,
    ...FONTS.semiBold,
    textTransform: 'uppercase',
  },
  featuredName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    ...FONTS.semiBold,
  },
  featuredSanskrit: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.regular,
    marginTop: 1,
  },
  // Tips
  tipCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  tipIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 214, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  tipContent: { flex: 1 },
  tipTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    ...FONTS.semiBold,
    marginBottom: 4,
  },
  tipText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    lineHeight: 18,
  },
});

export default HomeScreen;
