// TeacherLiveClassesScreen - Live class management with tabs, class cards, and quick actions
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar, Dimensions, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import { ROUTES } from '../../config/navigation';

const { width } = Dimensions.get('window');

// ── Demo Data ────────────────────────────────────────────────────────────────
const DEMO_CLASSES = [
  {
    id: '1',
    title: 'Morning Yoga Flow',
    date: '2026-07-03',
    time: '7:00 AM',
    duration: '60 min',
    registered: 18,
    capacity: 25,
    status: 'upcoming',
    hasMeetingLink: true,
    meetingLink: 'https://meet.google.com/abc-defg-hij',
  },
  {
    id: '2',
    title: 'Meditation & Breathing',
    date: '2026-07-04',
    time: '6:00 PM',
    duration: '45 min',
    registered: 12,
    capacity: 20,
    status: 'upcoming',
    hasMeetingLink: true,
    meetingLink: 'https://zoom.us/j/123456789',
  },
  {
    id: '3',
    title: 'Advanced Asana Workshop',
    date: '2026-07-06',
    time: '10:00 AM',
    duration: '90 min',
    registered: 8,
    capacity: 15,
    status: 'upcoming',
    hasMeetingLink: false,
    meetingLink: '',
  },
  {
    id: '4',
    title: 'Beginner Flexibility Class',
    date: '2026-06-28',
    time: '8:00 AM',
    duration: '60 min',
    registered: 22,
    capacity: 25,
    status: 'past',
    hasMeetingLink: true,
    meetingLink: 'https://meet.google.com/xyz-uvwx-qrs',
  },
  {
    id: '5',
    title: 'Power Yoga Intensive',
    date: '2026-06-25',
    time: '5:00 PM',
    duration: '75 min',
    registered: 5,
    capacity: 20,
    status: 'cancelled',
    hasMeetingLink: false,
    meetingLink: '',
  },
];

const TABS = ['Upcoming', 'Past', 'Cancelled'];

// ── Helper ───────────────────────────────────────────────────────────────────
const formatDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
};

const getStatusColor = (status) => {
  switch (status) {
    case 'upcoming': return COLORS.accent;
    case 'past': return COLORS.textMuted;
    case 'cancelled': return COLORS.error;
    default: return COLORS.info;
  }
};

// ── Main Component ───────────────────────────────────────────────────────────
const TeacherLiveClassesScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [activeTab, setActiveTab] = useState('Upcoming');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const filteredClasses = useMemo(() => {
    return DEMO_CLASSES.filter((c) => c.status === activeTab.toLowerCase());
  }, [activeTab]);

  const handleEdit = (cls) => {
    navigation.navigate(ROUTES.SCHEDULE_CLASS, { classId: cls.id, editMode: true });
  };

  const handleCancel = (cls) => {
    Alert.alert(
      'Cancel Class',
      `Are you sure you want to cancel "${cls.title}"?`,
      [
        { text: 'No', style: 'cancel' },
        { text: 'Yes, Cancel', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  const handleCopyLink = (cls) => {
    if (cls.meetingLink) {
      Alert.alert('Link Copied', 'Meeting link has been copied to clipboard.');
    } else {
      Alert.alert('No Link', 'No meeting link is set for this class. Edit to add one.');
    }
  };

  const renderClassCard = (cls) => {
    const statusColor = getStatusColor(cls.status);
    const capacityPercent = (cls.registered / cls.capacity) * 100;

    return (
      <View key={cls.id} style={styles.classCard}>
        <LinearGradient
          colors={[statusColor + '12', statusColor + '05']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.classCardGradient}
        >
          {/* Header row */}
          <View style={styles.classHeader}>
            <View style={styles.classDateBadge}>
              <Ionicons name="calendar-outline" size={14} color={statusColor} />
              <Text style={[styles.classDate, { color: statusColor }]}>
                {formatDate(cls.date)} · {cls.time}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
              <View style={[styles.statusDotSmall, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {cls.status.charAt(0).toUpperCase() + cls.status.slice(1)}
              </Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.classTitle}>{cls.title}</Text>

          {/* Info row */}
          <View style={styles.classInfoRow}>
            <View style={styles.classInfoItem}>
              <Ionicons name="time-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.classInfoText}>{cls.duration}</Text>
            </View>
            <View style={styles.classInfoItem}>
              <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.classInfoText}>
                {cls.registered}/{cls.capacity} registered
              </Text>
            </View>
            {cls.hasMeetingLink && (
              <View style={styles.classInfoItem}>
                <Ionicons name="link-outline" size={14} color={COLORS.accent} />
                <Text style={[styles.classInfoText, { color: COLORS.accent }]}>Link set</Text>
              </View>
            )}
          </View>

          {/* Capacity bar */}
          <View style={styles.capacityBarContainer}>
            <View style={styles.capacityBar}>
              <LinearGradient
                colors={
                  capacityPercent > 80
                    ? [COLORS.warning, COLORS.error]
                    : COLORS.gradientAccent
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.capacityFill, { width: `${Math.min(capacityPercent, 100)}%` }]}
              />
            </View>
            <Text style={styles.capacityText}>
              {Math.round(capacityPercent)}% full
            </Text>
          </View>

          {/* Quick Actions */}
          {cls.status === 'upcoming' && (
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={[styles.quickActionBtn, styles.quickActionEdit]}
                onPress={() => handleEdit(cls)}
                activeOpacity={0.75}
              >
                <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                <Text style={[styles.quickActionText, { color: COLORS.primary }]}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionBtn, styles.quickActionCancel]}
                onPress={() => handleCancel(cls)}
                activeOpacity={0.75}
              >
                <Ionicons name="close-circle-outline" size={16} color={COLORS.error} />
                <Text style={[styles.quickActionText, { color: COLORS.error }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickActionBtn, styles.quickActionLink]}
                onPress={() => handleCopyLink(cls)}
                activeOpacity={0.75}
              >
                <Ionicons name="copy-outline" size={16} color={COLORS.accent} />
                <Text style={[styles.quickActionText, { color: COLORS.accent }]}>Copy Link</Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        <Animated.View style={[styles.headerArea, { opacity: fadeAnim }]}>
          {/* Title */}
          <Text style={styles.screenTitle}>Live Classes</Text>

          {/* Tab Selector */}
          <View style={styles.tabBar}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab;
              const count = DEMO_CLASSES.filter((c) => c.status === tab.toLowerCase()).length;
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.tab, isActive && styles.tabActive]}
                  onPress={() => setActiveTab(tab)}
                  activeOpacity={0.8}
                >
                  {isActive && (
                    <LinearGradient
                      colors={COLORS.gradientPrimary}
                      style={styles.tabActiveGradient}
                    />
                  )}
                  <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                    {tab} ({count})
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>

        {/* Classes List */}
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {filteredClasses.length > 0 ? (
            filteredClasses.map(renderClassCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="videocam-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} classes</Text>
              <Text style={styles.emptySubtext}>
                {activeTab === 'Upcoming'
                  ? 'Schedule a new class to get started'
                  : `You have no ${activeTab.toLowerCase()} classes`}
              </Text>
            </View>
          )}
        </Animated.ScrollView>

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate(ROUTES.SCHEDULE_CLASS)}
        >
          <LinearGradient colors={COLORS.gradientAccent} style={styles.fabGradient}>
            <Ionicons name="add" size={28} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  headerArea: {
    paddingTop: 60,
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: 120,
  },
  screenTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxl,
    ...FONTS.bold,
    marginBottom: SPACING.md,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.md,
    padding: 3,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.sm + 2,
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    position: 'relative',
  },
  tabActive: {},
  tabActiveGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BORDER_RADIUS.sm,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    ...FONTS.medium,
    zIndex: 1,
  },
  tabTextActive: {
    color: '#FFF',
    ...FONTS.semiBold,
  },

  // Class Card
  classCard: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  classCardGradient: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  classDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  classDate: {
    fontSize: FONT_SIZES.sm,
    ...FONTS.medium,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
    gap: 4,
  },
  statusDotSmall: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    ...FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  classTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    ...FONTS.semiBold,
    marginBottom: SPACING.sm,
  },
  classInfoRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  classInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  classInfoText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
  },

  // Capacity Bar
  capacityBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  capacityBar: {
    flex: 1,
    height: 5,
    backgroundColor: COLORS.surfaceBorder,
    borderRadius: 3,
    overflow: 'hidden',
  },
  capacityFill: {
    height: '100%',
    borderRadius: 3,
  },
  capacityText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.medium,
    minWidth: 50,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
    paddingTop: SPACING.sm,
  },
  quickActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    gap: 4,
  },
  quickActionEdit: {
    backgroundColor: COLORS.primary + '12',
  },
  quickActionCancel: {
    backgroundColor: COLORS.error + '12',
  },
  quickActionLink: {
    backgroundColor: COLORS.accent + '12',
  },
  quickActionText: {
    fontSize: FONT_SIZES.sm,
    ...FONTS.medium,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    ...FONTS.semiBold,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
    textAlign: 'center',
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 100,
    right: SPACING.lg,
    borderRadius: 30,
    ...SHADOWS.large,
  },
  fabGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default TeacherLiveClassesScreen;
