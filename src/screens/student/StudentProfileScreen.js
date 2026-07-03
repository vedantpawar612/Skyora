// StudentProfileScreen - Student profile with stats, menu items, and account settings
import React, { useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar, Alert, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import { ROUTES } from '../../config/navigation';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

const STATS = [
  { label: 'Courses\nEnrolled', value: '4', icon: 'book', color: COLORS.primary },
  { label: 'Completed', value: '1', icon: 'checkmark-done', color: COLORS.success },
  { label: 'Streak\nDays', value: '12', icon: 'flame', color: COLORS.warning },
];

const MENU_ITEMS = [
  { id: 'certs', label: 'My Certificates', icon: 'ribbon', color: '#FFD600', route: ROUTES.STUDENT_CERTIFICATES },
  { id: 'payment', label: 'Payment History', icon: 'card', color: '#448AFF', route: ROUTES.PAYMENT_HISTORY },
  { id: 'live', label: 'Live Classes', icon: 'videocam', color: '#00D9A6', route: ROUTES.STUDENT_LIVE_CLASSES },
  { id: 'notifs', label: 'Notifications', icon: 'notifications', color: '#FF6B6B', route: ROUTES.NOTIFICATIONS },
  { id: 'library', label: 'Pose Library', icon: 'body', color: '#9C88FF', route: ROUTES.LIBRARY },
  { id: 'pranayama', label: 'Pranayama', icon: 'leaf', color: '#00E676', route: ROUTES.PRANAYAM },
];

const APP_ITEMS = [
  { id: 'about', label: 'About Skyora', icon: 'information-circle-outline' },
  { id: 'help', label: 'Help & Support', icon: 'help-circle-outline' },
  { id: 'terms', label: 'Terms & Privacy', icon: 'document-text-outline' },
];

const StudentProfileScreen = ({ navigation }) => {
  const { user, userProfile, signOut } = useAuth();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const displayName = userProfile?.name || user?.displayName || 'Yoga Enthusiast';
  const displayEmail = userProfile?.email || user?.email || '';
  const firstLetter = displayName.charAt(0).toUpperCase();

  const memberSince = userProfile?.createdAt
    ? (userProfile.createdAt.toDate ? userProfile.createdAt.toDate() : new Date(userProfile.createdAt))
    : new Date();
  const memberSinceText = memberSince.toLocaleDateString('en-IN', {
    month: 'short', year: 'numeric',
  });

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
            } catch (e) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          },
        },
      ],
    );
  };

  const handleMenuItem = (item) => {
    if (item.route) {
      navigation.navigate(item.route);
    }
  };

  const handleAppItem = (item) => {
    Alert.alert(item.label, `${item.label} content would appear here.`);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* Profile Header */}
          <View style={styles.profileHeader}>
            <LinearGradient
              colors={COLORS.gradientPrimary}
              style={styles.avatarCircle}
            >
              <Text style={styles.avatarLetter}>{firstLetter}</Text>
            </LinearGradient>
            <Text style={styles.profileName}>{displayName}</Text>
            <Text style={styles.profileEmail}>{displayEmail}</Text>
            <View style={styles.memberRow}>
              <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.memberText}>Member since {memberSinceText}</Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsContainer}>
            {STATS.map((stat, index) => (
              <View key={stat.label} style={styles.statItem}>
                {index > 0 && <View style={styles.statDivider} />}
                <View style={[styles.statIconCircle, { backgroundColor: stat.color + '15' }]}>
                  <Ionicons name={stat.icon} size={20} color={stat.color} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Menu Items */}
          <View style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>My Activities</Text>
            <View style={styles.menuCard}>
              {MENU_ITEMS.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    index < MENU_ITEMS.length - 1 && styles.menuItemBorder,
                  ]}
                  activeOpacity={0.6}
                  onPress={() => handleMenuItem(item)}
                >
                  <View style={[styles.menuIconCircle, { backgroundColor: item.color + '15' }]}>
                    <Ionicons name={item.icon} size={18} color={item.color} />
                  </View>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* App Section */}
          <View style={styles.menuSection}>
            <Text style={styles.menuSectionTitle}>App</Text>
            <View style={styles.menuCard}>
              {APP_ITEMS.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.menuItem,
                    index < APP_ITEMS.length - 1 && styles.menuItemBorder,
                  ]}
                  activeOpacity={0.6}
                  onPress={() => handleAppItem(item)}
                >
                  <View style={[styles.menuIconCircle, { backgroundColor: COLORS.surface }]}>
                    <Ionicons name={item.icon} size={18} color={COLORS.textSecondary} />
                  </View>
                  <Text style={styles.menuItemLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutBtn}
            activeOpacity={0.7}
            onPress={handleLogout}
          >
            <LinearGradient
              colors={['rgba(255,82,82,0.1)', 'rgba(255,82,82,0.05)']}
              style={styles.logoutBtnInner}
            >
              <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
              <Text style={styles.logoutText}>Sign Out</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Version */}
          <Text style={styles.versionText}>Skyora v1.0.0</Text>
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
    paddingBottom: 120,
    paddingHorizontal: SPACING.lg,
  },
  // Profile Header
  profileHeader: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.glow,
  },
  avatarLetter: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.hero,
    ...FONTS.bold,
  },
  profileName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxl,
    ...FONTS.bold,
    marginBottom: SPACING.xs,
  },
  profileEmail: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
    marginBottom: SPACING.sm,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    marginLeft: 4,
  },
  // Stats
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 1,
    backgroundColor: COLORS.surfaceBorder,
  },
  statIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    ...FONTS.regular,
    textAlign: 'center',
    lineHeight: 14,
  },
  // Menu
  menuSection: {
    marginBottom: SPACING.lg,
  },
  menuSectionTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.xs,
  },
  menuCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  menuItemLabel: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    ...FONTS.medium,
  },
  // Logout
  logoutBtn: {
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,82,82,0.2)',
  },
  logoutBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.body,
    ...FONTS.semiBold,
    marginLeft: SPACING.sm,
  },
  // Version
  versionText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.regular,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});

export default StudentProfileScreen;
