// TeacherDashboardScreen - Main teacher dashboard with stats, quick actions & activity
import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, StatusBar, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import { ROUTES } from '../../config/navigation';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - SPACING.lg * 2 - SPACING.sm) / 2;

// ── Demo Data ────────────────────────────────────────────────────────────────
const STATS = [
  { id: '1', label: 'Total Students', value: '156', icon: 'people', color: COLORS.primary, trend: '+12', trendUp: true },
  { id: '2', label: 'Active Students', value: '89', icon: 'person-add', color: COLORS.accent, trend: '+5', trendUp: true },
  { id: '3', label: 'Total Courses', value: '12', icon: 'book', color: COLORS.info, trend: '+2', trendUp: true },
  { id: '4', label: 'Total Revenue', value: '₹45,000', icon: 'cash', color: COLORS.success, trend: '+₹8K', trendUp: true },
  { id: '5', label: 'Attendance %', value: '87%', icon: 'checkmark-circle', color: COLORS.warning, trend: '-2%', trendUp: false },
  { id: '6', label: 'Upcoming Classes', value: '3', icon: 'videocam', color: COLORS.primaryLight, trend: 'Today', trendUp: true },
];

const QUICK_ACTIONS = [
  { id: '1', label: 'Create Course', icon: 'add-circle', color: COLORS.primary, route: ROUTES.CREATE_COURSE },
  { id: '2', label: 'Schedule Class', icon: 'calendar', color: COLORS.accent, route: ROUTES.SCHEDULE_CLASS },
  { id: '3', label: 'Attendance', icon: 'checkmark-done', color: COLORS.warning, route: ROUTES.TEACHER_ATTENDANCE },
  { id: '4', label: 'AI Assistant', icon: 'sparkles', color: COLORS.primaryLight, route: ROUTES.AI_ASSISTANT },
];

const RECENT_ACTIVITY = [
  { id: '1', text: 'New enrollment from Priya Sharma', icon: 'person-add-outline', color: COLORS.accent, time: '2 min ago' },
  { id: '2', text: 'Payment received ₹999', icon: 'card-outline', color: COLORS.success, time: '15 min ago' },
  { id: '3', text: 'Rahul completed "Beginner Yoga Flow"', icon: 'trophy-outline', color: COLORS.warning, time: '1 hr ago' },
  { id: '4', text: 'New review: ⭐ 4.8 from Ananya', icon: 'star-outline', color: COLORS.primaryLight, time: '3 hrs ago' },
];

// ── Stat Card Sub-component ──────────────────────────────────────────────────
const DashboardStatCard = ({ stat, index, fadeAnim }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 50,
      friction: 7,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.statCard, { transform: [{ scale: scaleAnim }] }]}>
      <LinearGradient
        colors={[stat.color + '18', stat.color + '08']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statCardGradient}
      >
        <View style={[styles.statIconWrap, { backgroundColor: stat.color + '20' }]}>
          <Ionicons name={stat.icon} size={22} color={stat.color} />
        </View>
        <Text style={styles.statValue}>{stat.value}</Text>
        <Text style={styles.statLabel}>{stat.label}</Text>
        <View style={styles.trendRow}>
          <Ionicons
            name={stat.trendUp ? 'trending-up' : 'trending-down'}
            size={12}
            color={stat.trendUp ? COLORS.success : COLORS.error}
          />
          <Text style={[styles.trendText, { color: stat.trendUp ? COLORS.success : COLORS.error }]}>
            {stat.trend}
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
};

// ── Main Component ───────────────────────────────────────────────────────────
const TeacherDashboardScreen = ({ navigation }) => {
  const { userProfile } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
          }
        >
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            {/* ── Header ─────────────────────────────────────────────── */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <Text style={styles.greeting}>{getGreeting()} 👋</Text>
                <Text style={styles.userName}>{userProfile?.name || 'Teacher'}</Text>
              </View>
              <TouchableOpacity
                onPress={() => navigation.navigate(ROUTES.NOTIFICATIONS)}
                style={styles.notifBtn}
              >
                <LinearGradient colors={COLORS.gradientPrimary} style={styles.notifGradient}>
                  <Ionicons name="notifications-outline" size={20} color="#FFF" />
                </LinearGradient>
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>3</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* ── Stats Grid ─────────────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Overview</Text>
            <View style={styles.statsGrid}>
              {STATS.map((stat, idx) => (
                <DashboardStatCard key={stat.id} stat={stat} index={idx} fadeAnim={fadeAnim} />
              ))}
            </View>

            {/* ── Quick Actions ──────────────────────────────────────── */}
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsRow}>
              {QUICK_ACTIONS.map((action) => (
                <TouchableOpacity
                  key={action.id}
                  style={styles.actionCard}
                  activeOpacity={0.75}
                  onPress={() => navigation.navigate(action.route)}
                >
                  <LinearGradient
                    colors={[action.color + '20', action.color + '08']}
                    style={styles.actionGradient}
                  >
                    <View style={[styles.actionIconWrap, { backgroundColor: action.color + '25' }]}>
                      <Ionicons name={action.icon} size={24} color={action.color} />
                    </View>
                    <Text style={styles.actionLabel} numberOfLines={1}>{action.label}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Recent Activity ────────────────────────────────────── */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Activity</Text>
              <TouchableOpacity>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.activityContainer}>
              {RECENT_ACTIVITY.map((item, idx) => (
                <View
                  key={item.id}
                  style={[
                    styles.activityItem,
                    idx < RECENT_ACTIVITY.length - 1 && styles.activityBorder,
                  ]}
                >
                  <View style={[styles.activityIcon, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityText}>{item.text}</Text>
                    <Text style={styles.activityTime}>{item.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        </Animated.ScrollView>
      </LinearGradient>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 120,
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
  notifBtn: { position: 'relative' },
  notifGradient: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: COLORS.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: '#FFF',
    fontSize: 10,
    ...FONTS.bold,
  },

  // Section
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    ...FONTS.bold,
    marginBottom: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.semiBold,
    marginBottom: SPACING.md,
  },

  // Stats Grid
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  statCard: {
    width: CARD_WIDTH,
    marginBottom: SPACING.sm,
  },
  statCardGradient: {
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  statIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  statValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    ...FONTS.bold,
    marginBottom: 2,
  },
  statLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.medium,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  trendText: {
    fontSize: FONT_SIZES.xs,
    ...FONTS.semiBold,
  },

  // Quick Actions
  actionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.lg,
  },
  actionCard: {
    width: (width - SPACING.lg * 2 - SPACING.sm) / 2,
    marginBottom: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
  },
  actionGradient: {
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.semiBold,
  },

  // Recent Activity
  activityContainer: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  activityBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  activityIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  activityContent: { flex: 1 },
  activityText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
    marginBottom: 2,
  },
  activityTime: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.regular,
  },
});

export default TeacherDashboardScreen;
