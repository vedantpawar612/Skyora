// StudentExploreScreen - Course discovery with search, categories, teachers, and courses
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, Dimensions, StatusBar, TextInput, FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import { ROUTES } from '../../config/navigation';

const { width } = Dimensions.get('window');

const CATEGORIES = ['All', 'Hatha', 'Vinyasa', 'Ashtanga', 'Yin', 'Meditation', 'Pranayama'];

const FEATURED_TEACHERS = [
  { id: 't1', name: 'Guru Priya', color: '#6C63FF' },
  { id: 't2', name: 'Acharya Dev', color: '#00D9A6' },
  { id: 't3', name: 'Meera Sharma', color: '#FF6B6B' },
  { id: 't4', name: 'Yogi Rajan', color: '#FFD600' },
];

const POPULAR_COURSES = [
  {
    id: 'c1', title: 'Hatha Yoga Foundations', teacher: 'Guru Priya',
    price: 999, rating: 4.8, level: 'Beginner', category: 'Hatha',
    gradientColors: ['#6C63FF', '#9C88FF'], students: 1240,
  },
  {
    id: 'c2', title: 'Dynamic Vinyasa Flow', teacher: 'Acharya Dev',
    price: 1499, rating: 4.9, level: 'Intermediate', category: 'Vinyasa',
    gradientColors: ['#00D9A6', '#00F5C0'], students: 890,
  },
  {
    id: 'c3', title: 'Ashtanga Primary Series', teacher: 'Yogi Rajan',
    price: 2999, rating: 4.5, level: 'Advanced', category: 'Ashtanga',
    gradientColors: ['#FF6B6B', '#FF8E8E'], students: 456,
  },
  {
    id: 'c4', title: 'Yin Yoga for Recovery', teacher: 'Meera Sharma',
    price: 499, rating: 4.7, level: 'Beginner', category: 'Yin',
    gradientColors: ['#448AFF', '#82B1FF'], students: 2100,
  },
  {
    id: 'c5', title: 'Guided Meditation Journey', teacher: 'Guru Priya',
    price: 799, rating: 4.6, level: 'Beginner', category: 'Meditation',
    gradientColors: ['#9C88FF', '#B39DDB'], students: 3400,
  },
  {
    id: 'c6', title: 'Advanced Pranayama Mastery', teacher: 'Acharya Dev',
    price: 1999, rating: 4.2, level: 'Advanced', category: 'Pranayama',
    gradientColors: ['#FFD600', '#FFEB3B'], students: 670,
  },
];

const LEVELS = ['All', 'Beginner', 'Intermediate', 'Advanced'];
const SORT_OPTIONS = ['Popular', 'Price', 'New'];

const StudentExploreScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedLevel, setSelectedLevel] = useState('All');
  const [selectedSort, setSelectedSort] = useState('Popular');

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner': return COLORS.success;
      case 'Intermediate': return COLORS.warning;
      case 'Advanced': return COLORS.error;
      default: return COLORS.textSecondary;
    }
  };

  // Filter courses based on search, category, and level
  const filteredCourses = POPULAR_COURSES.filter((course) => {
    const matchSearch = !searchQuery || course.title.toLowerCase().includes(searchQuery.toLowerCase()) || course.teacher.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = selectedCategory === 'All' || course.category === selectedCategory;
    const matchLevel = selectedLevel === 'All' || course.level === selectedLevel;
    return matchSearch && matchCategory && matchLevel;
  }).sort((a, b) => {
    if (selectedSort === 'Price') return a.price - b.price;
    if (selectedSort === 'New') return 0; // hardcoded data, no date
    return b.students - a.students; // Popular
  });

  const renderTeacher = (teacher) => (
    <TouchableOpacity
      key={teacher.id}
      style={styles.teacherItem}
      activeOpacity={0.7}
      onPress={() => navigation.navigate(ROUTES.TEACHER_PROFILE_VIEW, { teacherId: teacher.id })}
    >
      <LinearGradient
        colors={[teacher.color, teacher.color + '88']}
        style={styles.teacherAvatar}
      >
        <Text style={styles.teacherInitial}>{teacher.name.charAt(0)}</Text>
      </LinearGradient>
      <Text style={styles.teacherName} numberOfLines={1}>{teacher.name.split(' ')[0]}</Text>
    </TouchableOpacity>
  );

  const renderCourseCard = (course) => (
    <TouchableOpacity
      key={course.id}
      style={styles.courseCard}
      activeOpacity={0.85}
      onPress={() => navigation.navigate(ROUTES.COURSE_DETAIL, { courseId: course.id })}
    >
      <LinearGradient
        colors={course.gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.courseThumbnail}
      >
        <Ionicons name="body-outline" size={36} color="rgba(255,255,255,0.3)" />
        <View style={styles.courseRatingBadge}>
          <Ionicons name="star" size={12} color={COLORS.warning} />
          <Text style={styles.courseRatingText}>{course.rating}</Text>
        </View>
      </LinearGradient>
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle} numberOfLines={2}>{course.title}</Text>
        <Text style={styles.courseTeacher}>{course.teacher}</Text>
        <View style={styles.courseMetaRow}>
          <View style={[styles.levelPill, { backgroundColor: getLevelColor(course.level) + '20' }]}>
            <Text style={[styles.levelPillText, { color: getLevelColor(course.level) }]}>{course.level}</Text>
          </View>
          <Text style={styles.courseStudents}>{course.students.toLocaleString()} students</Text>
        </View>
        <Text style={styles.coursePrice}>₹{course.price.toLocaleString()}</Text>
      </View>
    </TouchableOpacity>
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
          <Text style={styles.headerTitle}>Explore</Text>
          <Text style={styles.headerSubtitle}>Discover yoga courses & teachers</Text>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={20} color={COLORS.textMuted} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search courses, teachers..."
              placeholderTextColor={COLORS.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={18} color={COLORS.textMuted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Categories */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.7}
                onPress={() => setSelectedCategory(cat)}
                style={[
                  styles.categoryChip,
                  selectedCategory === cat && styles.categoryChipActive,
                ]}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === cat && styles.categoryTextActive,
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Featured Teachers */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Featured Teachers</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.teacherScroll}
          >
            {FEATURED_TEACHERS.map(renderTeacher)}
          </ScrollView>

          {/* Filter Row */}
          <View style={styles.filterRow}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterInner}>
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Level:</Text>
                {LEVELS.map((lvl) => (
                  <TouchableOpacity
                    key={lvl}
                    onPress={() => setSelectedLevel(lvl)}
                    style={[styles.filterChip, selectedLevel === lvl && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, selectedLevel === lvl && styles.filterChipTextActive]}>
                      {lvl}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.filterDivider} />
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Sort:</Text>
                {SORT_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt}
                    onPress={() => setSelectedSort(opt)}
                    style={[styles.filterChip, selectedSort === opt && styles.filterChipActive]}
                  >
                    <Text style={[styles.filterChipText, selectedSort === opt && styles.filterChipTextActive]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Popular Courses */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Popular Courses</Text>
            <Text style={styles.resultCount}>{filteredCourses.length} courses</Text>
          </View>

          {filteredCourses.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No courses found</Text>
              <Text style={styles.emptySubtext}>Try adjusting your filters or search term</Text>
            </View>
          ) : (
            filteredCourses.map(renderCourseCard)
          )}
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
  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    height: 52,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  searchIcon: { marginRight: SPACING.sm },
  searchInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    ...FONTS.regular,
  },
  // Categories
  categoryScroll: {
    paddingBottom: SPACING.md,
    marginBottom: SPACING.sm,
  },
  categoryChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.backgroundCard,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginRight: SPACING.sm,
  },
  categoryChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    ...FONTS.medium,
  },
  categoryTextActive: {
    color: COLORS.textPrimary,
    ...FONTS.semiBold,
  },
  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    marginTop: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    ...FONTS.bold,
  },
  resultCount: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
  },
  // Teachers
  teacherScroll: {
    paddingBottom: SPACING.md,
    marginBottom: SPACING.sm,
  },
  teacherItem: {
    alignItems: 'center',
    marginRight: SPACING.lg,
    width: 72,
  },
  teacherAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
    ...SHADOWS.small,
  },
  teacherInitial: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    ...FONTS.bold,
  },
  teacherName: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
    ...FONTS.medium,
    textAlign: 'center',
  },
  // Filter Row
  filterRow: {
    marginBottom: SPACING.md,
  },
  filterInner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: SPACING.xs,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    ...FONTS.medium,
    marginRight: SPACING.xs,
  },
  filterChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.surface,
    marginRight: SPACING.xs,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterChipActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    borderColor: COLORS.primary,
  },
  filterChipText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.medium,
  },
  filterChipTextActive: {
    color: COLORS.primary,
  },
  filterDivider: {
    width: 1,
    height: 20,
    backgroundColor: COLORS.surfaceBorder,
    marginHorizontal: SPACING.sm,
  },
  // Course Card
  courseCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.small,
  },
  courseThumbnail: {
    width: 110,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  courseRatingBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
  },
  courseRatingText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xs,
    ...FONTS.semiBold,
    marginLeft: 3,
  },
  courseInfo: {
    flex: 1,
    padding: SPACING.md,
    justifyContent: 'center',
  },
  courseTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    ...FONTS.semiBold,
    marginBottom: 4,
    lineHeight: 22,
  },
  courseTeacher: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    marginBottom: SPACING.sm,
  },
  courseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  levelPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
    marginRight: SPACING.sm,
  },
  levelPillText: {
    fontSize: FONT_SIZES.xs,
    ...FONTS.semiBold,
    textTransform: 'uppercase',
  },
  courseStudents: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.regular,
  },
  coursePrice: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.lg,
    ...FONTS.bold,
  },
  // Empty
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    ...FONTS.semiBold,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
    marginTop: SPACING.xs,
  },
});

export default StudentExploreScreen;
