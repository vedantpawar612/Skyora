// TeacherStudentsScreen - Student management with search, filters, and student list
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar, TextInput, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import { ROUTES } from '../../config/navigation';

const { width } = Dimensions.get('window');

// ── Demo Data ────────────────────────────────────────────────────────────────
const DEMO_STUDENTS = [
  { id: '1', name: 'Priya Sharma', email: 'priya.sharma@gmail.com', courses: 3, progress: 78, paid: true, active: true, joinDate: '2026-06-01' },
  { id: '2', name: 'Rahul Verma', email: 'rahul.v@gmail.com', courses: 2, progress: 92, paid: true, active: true, joinDate: '2026-05-15' },
  { id: '3', name: 'Ananya Gupta', email: 'ananya.g@gmail.com', courses: 1, progress: 45, paid: true, active: true, joinDate: '2026-06-20' },
  { id: '4', name: 'Vikram Singh', email: 'vikram.s@gmail.com', courses: 2, progress: 60, paid: false, active: true, joinDate: '2026-04-10' },
  { id: '5', name: 'Meera Patel', email: 'meera.p@gmail.com', courses: 4, progress: 95, paid: true, active: true, joinDate: '2026-03-22' },
  { id: '6', name: 'Arjun Nair', email: 'arjun.n@gmail.com', courses: 1, progress: 20, paid: false, active: false, joinDate: '2026-02-18' },
  { id: '7', name: 'Kavya Iyer', email: 'kavya.i@gmail.com', courses: 2, progress: 67, paid: true, active: true, joinDate: '2026-06-28' },
  { id: '8', name: 'Rohan Desai', email: 'rohan.d@gmail.com', courses: 1, progress: 10, paid: false, active: false, joinDate: '2026-01-05' },
];

const FILTERS = ['All', 'Active', 'Inactive', 'Paid', 'Unpaid'];

// ── Summary Stats ────────────────────────────────────────────────────────────
const SUMMARY_STATS = [
  { label: 'Total', value: DEMO_STUDENTS.length, icon: 'people', color: COLORS.primary },
  { label: 'Active', value: DEMO_STUDENTS.filter((s) => s.active).length, icon: 'checkmark-circle', color: COLORS.accent },
  { label: 'New This Month', value: DEMO_STUDENTS.filter((s) => s.joinDate >= '2026-06-01').length, icon: 'person-add', color: COLORS.info },
];

// ── Helper ───────────────────────────────────────────────────────────────────
const getInitials = (name) => {
  const parts = name.split(' ');
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name) => {
  const colors = [COLORS.primary, COLORS.accent, COLORS.info, COLORS.warning, COLORS.primaryLight, COLORS.error];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// ── Main Component ───────────────────────────────────────────────────────────
const TeacherStudentsScreen = ({ navigation }) => {
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

  const filteredStudents = useMemo(() => {
    let students = DEMO_STUDENTS;
    switch (activeFilter) {
      case 'Active': students = students.filter((s) => s.active); break;
      case 'Inactive': students = students.filter((s) => !s.active); break;
      case 'Paid': students = students.filter((s) => s.paid); break;
      case 'Unpaid': students = students.filter((s) => !s.paid); break;
      default: break;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      students = students.filter(
        (s) => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)
      );
    }
    return students;
  }, [activeFilter, searchQuery]);

  const renderStudentCard = (student) => {
    const avatarColor = getAvatarColor(student.name);

    return (
      <TouchableOpacity
        key={student.id}
        activeOpacity={0.8}
        style={styles.studentCard}
        onPress={() => navigation.navigate(ROUTES.STUDENT_DETAIL, { studentId: student.id })}
      >
        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: avatarColor + '25' }]}>
          <Text style={[styles.avatarText, { color: avatarColor }]}>
            {getInitials(student.name)}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.studentInfo}>
          <View style={styles.studentNameRow}>
            <Text style={styles.studentName} numberOfLines={1}>{student.name}</Text>
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: student.active ? COLORS.success : COLORS.textMuted }]} />
            </View>
          </View>
          <Text style={styles.studentEmail} numberOfLines={1}>{student.email}</Text>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="book-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.metaText}>{student.courses} courses</Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={COLORS.gradientAccent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${student.progress}%` }]}
                />
              </View>
              <Text style={styles.progressText}>{student.progress}%</Text>
            </View>

            {/* Payment badge */}
            <View style={[
              styles.paymentBadge,
              { backgroundColor: student.paid ? COLORS.success + '20' : COLORS.error + '20' },
            ]}>
              <Text style={[
                styles.paymentBadgeText,
                { color: student.paid ? COLORS.success : COLORS.error },
              ]}>
                {student.paid ? 'Paid' : 'Unpaid'}
              </Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        <Animated.View style={[styles.headerArea, { opacity: fadeAnim }]}>
          {/* Title */}
          <Text style={styles.screenTitle}>Students</Text>

          {/* Summary Stats */}
          <View style={styles.summaryRow}>
            {SUMMARY_STATS.map((stat, idx) => (
              <View key={idx} style={styles.summaryCard}>
                <LinearGradient
                  colors={[stat.color + '18', stat.color + '08']}
                  style={styles.summaryGradient}
                >
                  <Ionicons name={stat.icon} size={18} color={stat.color} />
                  <Text style={styles.summaryValue}>{stat.value}</Text>
                  <Text style={styles.summaryLabel}>{stat.label}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Ionicons name="search-outline" size={18} color={COLORS.textMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students..."
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

        {/* Student List */}
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {filteredStudents.length > 0 ? (
            filteredStudents.map(renderStudentCard)
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={64} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No students found</Text>
              <Text style={styles.emptySubtext}>
                {searchQuery ? 'Try a different search term' : 'Students will appear here once they enroll'}
              </Text>
            </View>
          )}
        </Animated.ScrollView>
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

  // Summary Row
  summaryRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  summaryCard: {
    flex: 1,
  },
  summaryGradient: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  summaryValue: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    ...FONTS.bold,
    marginTop: SPACING.xs,
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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

  // Student Card
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    ...SHADOWS.small,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    fontSize: FONT_SIZES.body,
    ...FONTS.bold,
  },
  studentInfo: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  studentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  studentName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    ...FONTS.semiBold,
    flex: 1,
  },
  statusIndicator: {},
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  studentEmail: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    marginBottom: SPACING.xs,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metaText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.regular,
  },

  // Progress bar
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: COLORS.surfaceBorder,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.medium,
    minWidth: 28,
  },

  // Payment badge
  paymentBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.round,
  },
  paymentBadgeText: {
    fontSize: 9,
    ...FONTS.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
});

export default TeacherStudentsScreen;
