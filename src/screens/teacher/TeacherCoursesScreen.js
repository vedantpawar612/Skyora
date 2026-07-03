// TeacherCoursesScreen - Course management with search, filters, and course cards
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, StatusBar, TextInput, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import { ROUTES } from '../../config/navigation';

const { width } = Dimensions.get('window');

// ── Demo Data ────────────────────────────────────────────────────────────────
const DEMO_COURSES = [
  {
    id: '1',
    title: 'Beginner Yoga Flow',
    students: 48,
    revenue: 47952,
    status: 'published',
    difficulty: 'Beginner',
    modules: 8,
    rating: 4.7,
    gradientColors: [COLORS.primary, COLORS.accent],
  },
  {
    id: '2',
    title: 'Advanced Asanas',
    students: 23,
    revenue: 34477,
    status: 'published',
    difficulty: 'Advanced',
    modules: 12,
    rating: 4.9,
    gradientColors: [COLORS.error, COLORS.warning],
  },
  {
    id: '3',
    title: 'Morning Stretches',
    students: 67,
    revenue: 19933,
    status: 'published',
    difficulty: 'Beginner',
    modules: 5,
    rating: 4.5,
    gradientColors: [COLORS.accent, COLORS.accentLight],
  },
  {
    id: '4',
    title: 'Meditation Basics',
    students: 0,
    revenue: 0,
    status: 'draft',
    difficulty: 'Beginner',
    modules: 3,
    rating: 0,
    gradientColors: [COLORS.info, COLORS.primaryLight],
  },
  {
    id: '5',
    title: 'Power Yoga',
    students: 12,
    revenue: 17988,
    status: 'archived',
    difficulty: 'Intermediate',
    modules: 10,
    rating: 4.3,
    gradientColors: [COLORS.warning, COLORS.error],
  },
];

const FILTERS = ['All', 'Published', 'Draft', 'Archived'];

// ── Status Badge ─────────────────────────────────────────────────────────────
const getStatusStyle = (status) => {
  switch (status) {
    case 'published': return { bg: COLORS.success + '20', text: COLORS.success };
    case 'draft': return { bg: COLORS.warning + '20', text: COLORS.warning };
    case 'archived': return { bg: COLORS.textMuted + '20', text: COLORS.textMuted };
    default: return { bg: COLORS.info + '20', text: COLORS.info };
  }
};

const getDifficultyStyle = (diff) => {
  switch (diff) {
    case 'Beginner': return { bg: COLORS.success + '20', text: COLORS.success };
    case 'Intermediate': return { bg: COLORS.warning + '20', text: COLORS.warning };
    case 'Advanced': return { bg: COLORS.error + '20', text: COLORS.error };
    default: return { bg: COLORS.info + '20', text: COLORS.info };
  }
};

// ── Main Component ───────────────────────────────────────────────────────────
const TeacherCoursesScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const filteredCourses = useMemo(() => {
    let courses = DEMO_COURSES;
    if (activeFilter !== 'All') {
      courses = courses.filter((c) => c.status === activeFilter.toLowerCase());
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      courses = courses.filter((c) => c.title.toLowerCase().includes(q));
    }
    return courses;
  }, [activeFilter, searchQuery]);

  const renderCourseCard = (course) => {
    const statusStyle = getStatusStyle(course.status);
    const diffStyle = getDifficultyStyle(course.difficulty);

    return (
      <TouchableOpacity
        key={course.id}
        activeOpacity={0.8}
        style={styles.courseCard}
        onPress={() => navigation.navigate(ROUTES.EDIT_COURSE, { courseId: course.id })}
      >
        {/* Thumbnail placeholder */}
        <LinearGradient
          colors={course.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.courseThumbnail}
        >
          <Ionicons name="body-outline" size={32} color="rgba(255,255,255,0.4)" />
          <View style={styles.thumbnailOverlay}>
            <Text style={styles.moduleCount}>{course.modules} modules</Text>
          </View>
        </LinearGradient>

        {/* Card Content */}
        <View style={styles.courseContent}>
          <View style={styles.courseHeader}>
            <Text style={styles.courseTitle} numberOfLines={1}>{course.title}</Text>
            <TouchableOpacity>
              <Ionicons name="ellipsis-vertical" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Badges row */}
          <View style={styles.badgesRow}>
            <View style={[styles.badge, { backgroundColor: statusStyle.bg }]}>
              <Text style={[styles.badgeText, { color: statusStyle.text }]}>
                {course.status.charAt(0).toUpperCase() + course.status.slice(1)}
              </Text>
            </View>
            <View style={[styles.badge, { backgroundColor: diffStyle.bg }]}>
              <Text style={[styles.badgeText, { color: diffStyle.text }]}>{course.difficulty}</Text>
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.courseStatsRow}>
            <View style={styles.courseStat}>
              <Ionicons name="people-outline" size={14} color={COLORS.textMuted} />
              <Text style={styles.courseStatText}>{course.students} students</Text>
            </View>
            <View style={styles.courseStat}>
              <Ionicons name="cash-outline" size={14} color={COLORS.success} />
              <Text style={[styles.courseStatText, { color: COLORS.success }]}>
                ₹{course.revenue.toLocaleString('en-IN')}
              </Text>
            </View>
            {course.rating > 0 && (
              <View style={styles.courseStat}>
                <Ionicons name="star" size={14} color={COLORS.warning} />
                <Text style={styles.courseStatText}>{course.rating}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        <Animated.View style={[styles.headerArea, { opacity: fadeAnim }]}>
          {/* Title Row */}
          <View style={styles.titleRow}>
            <Text style={styles.screenTitle}>My Courses</Text>
            <TouchableOpacity
              style={styles.createBtn}
              activeOpacity={0.8}
              onPress={() => navigation.navigate(ROUTES.CREATE_COURSE)}
            >
              <LinearGradient colors={COLORS.gradientPrimary} style={styles.createBtnGradient}>
                <Ionicons name="add" size={18} color="#FFF" />
                <Text style={styles.createBtnText}>Create</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search courses..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Filter Chips */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersRow}
          >
            {FILTERS.map((filter) => {
              const isActive = activeFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isActive ? COLORS.gradientPrimary : ['transparent', 'transparent']}
                    style={[styles.filterChip, !isActive && styles.filterChipInactive]}
                  >
                    <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                      {filter}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Animated.View>

        {/* Course List */}
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {filteredCourses.length > 0 ? (
            filteredCourses.map(renderCourseCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No courses found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search term' : 'Create your first course to get started'}
              </Text>
              {!searchQuery && (
                <TouchableOpacity
                  style={styles.emptyBtn}
                  onPress={() => navigation.navigate(ROUTES.CREATE_COURSE)}
                >
                  <LinearGradient colors={COLORS.gradientPrimary} style={styles.emptyBtnGradient}>
                    <Ionicons name="add" size={18} color="#FFF" />
                    <Text style={styles.emptyBtnText}>Create Course</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.ScrollView>

        {/* FAB */}
        <TouchableOpacity
          style={styles.fab}
          activeOpacity={0.85}
          onPress={() => navigation.navigate(ROUTES.CREATE_COURSE)}
        >
          <LinearGradient colors={COLORS.gradientPrimary} style={styles.fabGradient}>
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

  // Title Row
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  screenTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xxl,
    ...FONTS.bold,
  },
  createBtn: {
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },
  createBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    gap: 4,
  },
  createBtnText: {
    color: '#FFF',
    fontSize: FONT_SIZES.sm,
    ...FONTS.semiBold,
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
    height: 46,
  },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    marginLeft: SPACING.sm,
    ...FONTS.regular,
  },

  // Filters
  filtersRow: {
    paddingBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
  },
  filterChipInactive: {
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  filterText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.medium,
  },
  filterTextActive: {
    color: '#FFF',
    ...FONTS.semiBold,
  },

  // Course Card
  courseCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  courseThumbnail: {
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  thumbnailOverlay: {
    position: 'absolute',
    bottom: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  moduleCount: {
    color: '#FFF',
    fontSize: FONT_SIZES.xs,
    ...FONTS.medium,
  },
  courseContent: {
    padding: SPACING.md,
  },
  courseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  courseTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    ...FONTS.semiBold,
    flex: 1,
    marginRight: SPACING.sm,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: BORDER_RADIUS.round,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    ...FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  courseStatsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  courseStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  courseStatText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
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
    marginBottom: SPACING.lg,
  },
  emptyBtn: {
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },
  emptyBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.round,
    gap: 6,
  },
  emptyBtnText: {
    color: '#FFF',
    fontSize: FONT_SIZES.body,
    ...FONTS.semiBold,
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

export default TeacherCoursesScreen;
