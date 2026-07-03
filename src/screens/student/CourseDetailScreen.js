// Course Detail Screen — Student view of a course with enrollment
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, StatusBar, Dimensions, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import GradientButton from '../../components/GradientButton';

const { width } = Dimensions.get('window');

const CourseDetailScreen = ({ navigation, route }) => {
  const { userProfile } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [enrolled, setEnrolled] = useState(false);

  const course = route.params?.course || {
    title: 'Morning Yoga Flow',
    teacher: 'Guru Priya',
    price: 999,
    rating: 4.7,
    level: 'Beginner',
    students: 234,
    duration: '4 weeks',
    description: 'Start your day with an energizing yoga flow that combines breath work with dynamic movements. Perfect for beginners looking to build a consistent morning practice.',
  };

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const modules = [
    { title: 'Week 1: Foundations', lessons: 5, duration: '2.5 hrs', completed: false },
    { title: 'Week 2: Sun Salutations', lessons: 4, duration: '2 hrs', completed: false },
    { title: 'Week 3: Standing Poses', lessons: 6, duration: '3 hrs', completed: false },
    { title: 'Week 4: Flow Sequences', lessons: 5, duration: '2.5 hrs', completed: false },
  ];

  const handleEnroll = () => {
    if (course.price === 0) {
      setEnrolled(true);
      Alert.alert('Enrolled!', 'You have been enrolled in this course.');
    } else {
      Alert.alert('Payment', `This will cost ₹${course.price}. Payment integration coming soon!`);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.shareBtn}>
            <Ionicons name="share-outline" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Hero */}
            <LinearGradient
              colors={['rgba(108, 99, 255, 0.3)', 'rgba(0, 217, 166, 0.15)']}
              style={styles.heroCard}
            >
              <Ionicons name="book" size={60} color="rgba(255,255,255,0.1)" style={styles.heroIcon} />
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{course.level}</Text>
              </View>
              <Text style={styles.courseTitle}>{course.title}</Text>
              <View style={styles.metaRow}>
                <View style={styles.metaItem}>
                  <Ionicons name="star" size={14} color={COLORS.warning} />
                  <Text style={styles.metaText}>{course.rating}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="people" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{course.students} students</Text>
                </View>
                <View style={styles.metaItem}>
                  <Ionicons name="time" size={14} color={COLORS.textSecondary} />
                  <Text style={styles.metaText}>{course.duration}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Teacher Info */}
            <View style={styles.teacherCard}>
              <View style={styles.teacherAvatar}>
                <Text style={styles.teacherAvatarText}>{course.teacher?.charAt(0) || 'T'}</Text>
              </View>
              <View style={styles.teacherInfo}>
                <Text style={styles.teacherName}>{course.teacher}</Text>
                <Text style={styles.teacherSubtext}>Yoga Instructor</Text>
              </View>
              <TouchableOpacity style={styles.viewProfileBtn}>
                <Text style={styles.viewProfileText}>View Profile</Text>
              </TouchableOpacity>
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About this Course</Text>
              <Text style={styles.descText}>{course.description}</Text>
            </View>

            {/* What you'll learn */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>What You'll Learn</Text>
              {['Proper alignment for key yoga poses', 'Breathing techniques for each movement', 'Building a daily yoga habit', 'Stress reduction through mindful movement'].map((item, i) => (
                <View key={i} style={styles.learnItem}>
                  <Ionicons name="checkmark-circle" size={18} color={COLORS.accent} />
                  <Text style={styles.learnText}>{item}</Text>
                </View>
              ))}
            </View>

            {/* Curriculum */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Curriculum</Text>
              <Text style={styles.curriculumMeta}>
                {modules.length} modules • {modules.reduce((s, m) => s + m.lessons, 0)} lessons
              </Text>
              {modules.map((mod, i) => (
                <View key={i} style={styles.moduleCard}>
                  <View style={styles.moduleHeader}>
                    <View style={styles.moduleNum}>
                      <Text style={styles.moduleNumText}>{i + 1}</Text>
                    </View>
                    <View style={styles.moduleInfo}>
                      <Text style={styles.moduleTitle}>{mod.title}</Text>
                      <Text style={styles.moduleMeta}>{mod.lessons} lessons • {mod.duration}</Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color={COLORS.textMuted} />
                  </View>
                </View>
              ))}
            </View>
          </Animated.View>
        </ScrollView>

        {/* Bottom Bar */}
        <View style={styles.bottomBar}>
          <View style={styles.priceColumn}>
            <Text style={styles.priceLabel}>{course.price === 0 ? 'Free' : 'Price'}</Text>
            {course.price > 0 && <Text style={styles.priceValue}>₹{course.price}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <GradientButton
              title={enrolled ? 'Continue Learning' : (course.price === 0 ? 'Enroll Free' : 'Enroll Now')}
              onPress={handleEnroll}
              icon={<Ionicons name={enrolled ? 'play' : 'cart'} size={16} color="#FFF" />}
            />
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingTop: 50, paddingBottom: SPACING.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.backgroundCard,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  shareBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.backgroundCard,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: 120 },
  heroCard: {
    borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.surfaceBorder, overflow: 'hidden',
  },
  heroIcon: { position: 'absolute', right: 20, top: 20, opacity: 0.3 },
  levelBadge: {
    alignSelf: 'flex-start', backgroundColor: COLORS.accent + '20', paddingHorizontal: SPACING.md,
    paddingVertical: 4, borderRadius: BORDER_RADIUS.round, marginBottom: SPACING.sm,
  },
  levelText: { color: COLORS.accent, fontSize: FONT_SIZES.xs, ...FONTS.bold, textTransform: 'uppercase' },
  courseTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.xxl, ...FONTS.bold, marginBottom: SPACING.md },
  metaRow: { flexDirection: 'row', gap: SPACING.md },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
  teacherCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  teacherAvatar: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  teacherAvatarText: { color: COLORS.primary, fontSize: FONT_SIZES.lg, ...FONTS.bold },
  teacherInfo: { flex: 1, marginLeft: SPACING.md },
  teacherName: { color: COLORS.textPrimary, fontSize: FONT_SIZES.body, ...FONTS.semiBold },
  teacherSubtext: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm },
  viewProfileBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  viewProfileText: { color: COLORS.primary, fontSize: FONT_SIZES.sm, ...FONTS.semiBold },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.lg, ...FONTS.bold, marginBottom: SPACING.sm },
  descText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md, lineHeight: 24 },
  learnItem: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  learnText: { color: COLORS.textPrimary, fontSize: FONT_SIZES.md, flex: 1 },
  curriculumMeta: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm, marginBottom: SPACING.md },
  moduleCard: {
    backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.md, padding: SPACING.md,
    marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  moduleHeader: { flexDirection: 'row', alignItems: 'center' },
  moduleNum: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: COLORS.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  moduleNumText: { color: COLORS.primary, fontSize: FONT_SIZES.sm, ...FONTS.bold },
  moduleInfo: { flex: 1, marginLeft: SPACING.md },
  moduleTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.md, ...FONTS.semiBold },
  moduleMeta: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2 },
  bottomBar: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md, paddingBottom: 30, gap: SPACING.md,
    backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.surfaceBorder,
  },
  priceColumn: { alignItems: 'center' },
  priceLabel: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs },
  priceValue: { color: COLORS.textPrimary, fontSize: FONT_SIZES.xl, ...FONTS.bold },
});

export default CourseDetailScreen;
