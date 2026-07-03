// StudentMyLearningScreen - Enrolled courses dashboard with progress tracking
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import { ROUTES } from '../../config/navigation';
import GradientButton from '../../components/GradientButton';

const { width } = Dimensions.get('window');

const IN_PROGRESS_COURSES = [
  {
    id: 'ip1',
    title: 'Hatha Yoga Foundations',
    teacher: 'Guru Priya',
    progress: 0.35,
    lastLesson: 'Lesson 5: Standing Poses',
    totalLessons: 14,
    completedLessons: 5,
    gradientColors: ['#6C63FF', '#9C88FF'],
    lastAccessed: '2 hours ago',
  },
  {
    id: 'ip2',
    title: 'Dynamic Vinyasa Flow',
    teacher: 'Acharya Dev',
    progress: 0.72,
    lastLesson: 'Lesson 11: Advanced Transitions',
    totalLessons: 15,
    completedLessons: 11,
    gradientColors: ['#00D9A6', '#00F5C0'],
    lastAccessed: 'Yesterday',
  },
  {
    id: 'ip3',
    title: 'Guided Meditation Journey',
    teacher: 'Guru Priya',
    progress: 0.10,
    lastLesson: 'Lesson 2: Breath Awareness',
    totalLessons: 20,
    completedLessons: 2,
    gradientColors: ['#9C88FF', '#B39DDB'],
    lastAccessed: '3 days ago',
  },
];

const COMPLETED_COURSES = [
  {
    id: 'cc1',
    title: 'Yin Yoga for Recovery',
    teacher: 'Meera Sharma',
    completedDate: '15 Jun 2026',
    hasCertificate: true,
    gradientColors: ['#448AFF', '#82B1FF'],
    totalLessons: 10,
    rating: 4.7,
  },
];

const UPCOMING_CLASSES = [
  {
    id: 'lc1',
    title: 'Morning Flow Session',
    teacher: 'Acharya Dev',
    time: 'Tomorrow, 7:00 AM',
    duration: '60 min',
    color: '#6C63FF',
  },
  {
    id: 'lc2',
    title: 'Evening Meditation',
    teacher: 'Guru Priya',
    time: 'Thu, 6:30 PM',
    duration: '45 min',
    color: '#00D9A6',
  },
];

const StudentMyLearningScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('inProgress');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const renderProgressCard = (course) => (
    <TouchableOpacity
      key={course.id}
      style={styles.courseCard}
      activeOpacity={0.85}
      onPress={() => navigation.navigate(ROUTES.COURSE_DETAIL, { courseId: course.id })}
    >
      <LinearGradient
        colors={['rgba(108,99,255,0.08)', 'rgba(0,217,166,0.04)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.courseCardInner}
      >
        {/* Thumbnail */}
        <LinearGradient
          colors={course.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.courseThumb}
        >
          <Ionicons name="play-circle" size={28} color="rgba(255,255,255,0.6)" />
        </LinearGradient>

        {/* Info */}
        <View style={styles.courseInfoSection}>
          <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
          <Text style={styles.courseTeacher}>{course.teacher}</Text>

          {/* Last Accessed */}
          <View style={styles.lastAccessedRow}>
            <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.lastAccessedText}>{course.lastAccessed}</Text>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: `${course.progress * 100}%` }]}>
                <LinearGradient
                  colors={COLORS.gradientPrimary}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.progressGradient}
                />
              </View>
            </View>
            <Text style={styles.progressText}>{Math.round(course.progress * 100)}%</Text>
          </View>

          {/* Lesson Info */}
          <Text style={styles.lessonText} numberOfLines={1}>
            {course.lastLesson} • {course.completedLessons}/{course.totalLessons} lessons
          </Text>

          {/* Continue Button */}
          <TouchableOpacity
            style={styles.continueBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(ROUTES.COURSE_PLAYER, { courseId: course.id })}
          >
            <LinearGradient
              colors={COLORS.gradientPrimary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueBtnGradient}
            >
              <Ionicons name="play" size={14} color="#FFF" />
              <Text style={styles.continueBtnText}>Continue</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderCompletedCard = (course) => (
    <TouchableOpacity
      key={course.id}
      style={styles.courseCard}
      activeOpacity={0.85}
      onPress={() => navigation.navigate(ROUTES.COURSE_DETAIL, { courseId: course.id })}
    >
      <LinearGradient
        colors={['rgba(0,230,118,0.06)', 'rgba(0,217,166,0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.courseCardInner}
      >
        {/* Thumbnail */}
        <LinearGradient
          colors={course.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.courseThumb}
        >
          <Ionicons name="checkmark-circle" size={28} color="rgba(255,255,255,0.8)" />
        </LinearGradient>

        {/* Info */}
        <View style={styles.courseInfoSection}>
          <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
          <Text style={styles.courseTeacher}>{course.teacher}</Text>

          <View style={styles.completedMetaRow}>
            <View style={styles.completedDateRow}>
              <Ionicons name="calendar-outline" size={12} color={COLORS.success} />
              <Text style={styles.completedDateText}>Completed {course.completedDate}</Text>
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={12} color={COLORS.warning} />
              <Text style={styles.ratingText}>{course.rating}</Text>
            </View>
          </View>

          <Text style={styles.lessonText}>{course.totalLessons} lessons completed</Text>

          {course.hasCertificate && (
            <View style={styles.certBadge}>
              <Ionicons name="ribbon" size={14} color={COLORS.accent} />
              <Text style={styles.certBadgeText}>Certificate Available</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="book-outline" size={48} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No courses yet</Text>
      <Text style={styles.emptySubtext}>
        {activeTab === 'inProgress'
          ? 'Start exploring courses to begin your yoga journey'
          : 'Complete a course to see it here'}
      </Text>
      {activeTab === 'inProgress' && (
        <GradientButton
          title="Explore Courses"
          onPress={() => navigation.navigate(ROUTES.EXPLORE)}
          size="medium"
          icon={<Ionicons name="compass-outline" size={16} color="#FFF" />}
          style={styles.emptyBtn}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* Header */}
          <Text style={styles.headerTitle}>My Learning</Text>
          <Text style={styles.headerSubtitle}>Track your yoga progress</Text>

          {/* Tab Selector */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'inProgress' && styles.tabActive]}
              activeOpacity={0.7}
              onPress={() => setActiveTab('inProgress')}
            >
              <Text style={[styles.tabText, activeTab === 'inProgress' && styles.tabTextActive]}>
                In Progress
              </Text>
              {IN_PROGRESS_COURSES.length > 0 && (
                <View style={[styles.tabBadge, activeTab === 'inProgress' && styles.tabBadgeActive]}>
                  <Text style={styles.tabBadgeText}>{IN_PROGRESS_COURSES.length}</Text>
                </View>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'completed' && styles.tabActive]}
              activeOpacity={0.7}
              onPress={() => setActiveTab('completed')}
            >
              <Text style={[styles.tabText, activeTab === 'completed' && styles.tabTextActive]}>
                Completed
              </Text>
              {COMPLETED_COURSES.length > 0 && (
                <View style={[styles.tabBadge, activeTab === 'completed' && styles.tabBadgeActive]}>
                  <Text style={styles.tabBadgeText}>{COMPLETED_COURSES.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* Course Lists */}
          {activeTab === 'inProgress' && (
            IN_PROGRESS_COURSES.length > 0
              ? IN_PROGRESS_COURSES.map(renderProgressCard)
              : renderEmptyState()
          )}

          {activeTab === 'completed' && (
            COMPLETED_COURSES.length > 0
              ? COMPLETED_COURSES.map(renderCompletedCard)
              : renderEmptyState()
          )}

          {/* Upcoming Live Classes */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Live Classes</Text>
            <TouchableOpacity onPress={() => navigation.navigate(ROUTES.STUDENT_LIVE_CLASSES)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>

          {UPCOMING_CLASSES.map((cls) => (
            <View key={cls.id} style={styles.liveClassCard}>
              <View style={[styles.liveClassDot, { backgroundColor: cls.color }]} />
              <View style={styles.liveClassInfo}>
                <Text style={styles.liveClassTitle}>{cls.title}</Text>
                <Text style={styles.liveClassTeacher}>{cls.teacher}</Text>
                <View style={styles.liveClassMeta}>
                  <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
                  <Text style={styles.liveClassTime}>{cls.time}</Text>
                  <Text style={styles.liveClassDuration}>• {cls.duration}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.joinBtn} activeOpacity={0.7}>
                <LinearGradient
                  colors={[cls.color, cls.color + 'CC']}
                  style={styles.joinBtnGradient}
                >
                  <Ionicons name="videocam" size={14} color="#FFF" />
                  <Text style={styles.joinBtnText}>Join</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))}
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
  // Header
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.hero,
    ...FONTS.bold,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.body,
    ...FONTS.regular,
    marginBottom: SPACING.lg,
  },
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: BORDER_RADIUS.md,
  },
  tabActive: {
    backgroundColor: COLORS.primary,
  },
  tabText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    ...FONTS.semiBold,
  },
  tabTextActive: {
    color: COLORS.textPrimary,
  },
  tabBadge: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.round,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.xs,
    paddingHorizontal: 6,
  },
  tabBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tabBadgeText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xs,
    ...FONTS.bold,
  },
  // Course Card
  courseCard: {
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  courseCardInner: {
    flexDirection: 'row',
    padding: SPACING.md,
  },
  courseThumb: {
    width: 70,
    height: 70,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  courseInfoSection: {
    flex: 1,
  },
  courseTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    ...FONTS.semiBold,
    marginBottom: 2,
  },
  courseTeacher: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    marginBottom: SPACING.xs,
  },
  lastAccessedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  lastAccessedText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.regular,
    marginLeft: 4,
  },
  // Progress
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  progressBarContainer: {
    flex: 1,
    height: 6,
    backgroundColor: COLORS.surface,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: SPACING.sm,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressGradient: {
    flex: 1,
  },
  progressText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.xs,
    ...FONTS.bold,
    minWidth: 32,
    textAlign: 'right',
  },
  lessonText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.regular,
    marginBottom: SPACING.sm,
  },
  // Continue Button
  continueBtn: {
    alignSelf: 'flex-start',
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },
  continueBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.round,
  },
  continueBtnText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.semiBold,
    marginLeft: 4,
  },
  // Completed
  completedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  completedDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  completedDateText: {
    color: COLORS.success,
    fontSize: FONT_SIZES.xs,
    ...FONTS.medium,
    marginLeft: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: COLORS.warning,
    fontSize: FONT_SIZES.xs,
    ...FONTS.semiBold,
    marginLeft: 3,
  },
  certBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,217,166,0.1)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(0,217,166,0.2)',
  },
  certBadgeText: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.xs,
    ...FONTS.semiBold,
    marginLeft: 4,
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    ...FONTS.bold,
  },
  seeAllText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.semiBold,
  },
  // Live Class Card
  liveClassCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  liveClassDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: SPACING.md,
  },
  liveClassInfo: {
    flex: 1,
  },
  liveClassTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    ...FONTS.semiBold,
    marginBottom: 2,
  },
  liveClassTeacher: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    marginBottom: 4,
  },
  liveClassMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveClassTime: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.regular,
    marginLeft: 4,
  },
  liveClassDuration: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.regular,
    marginLeft: 4,
  },
  joinBtn: {
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
    marginLeft: SPACING.sm,
  },
  joinBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
  },
  joinBtnText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.semiBold,
    marginLeft: 4,
  },
  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyIconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    ...FONTS.semiBold,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  emptyBtn: {
    marginTop: SPACING.sm,
  },
});

export default StudentMyLearningScreen;
