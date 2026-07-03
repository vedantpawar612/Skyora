// Teacher Attendance Screen — Mark and view attendance
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, StatusBar, FlatList, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';

const DEMO_STUDENTS = [
  { id: '1', name: 'Priya Sharma', email: 'priya@email.com', present: null },
  { id: '2', name: 'Arjun Patel', email: 'arjun@email.com', present: null },
  { id: '3', name: 'Sneha Reddy', email: 'sneha@email.com', present: null },
  { id: '4', name: 'Rahul Verma', email: 'rahul@email.com', present: null },
  { id: '5', name: 'Ananya Gupta', email: 'ananya@email.com', present: null },
  { id: '6', name: 'Vikram Singh', email: 'vikram@email.com', present: null },
  { id: '7', name: 'Meera Joshi', email: 'meera@email.com', present: null },
  { id: '8', name: 'Karthik Nair', email: 'karthik@email.com', present: null },
];

const TeacherAttendanceScreen = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [students, setStudents] = useState(DEMO_STUDENTS);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const markAttendance = (id, status) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, present: status } : s));
  };

  const markAll = (status) => {
    setStudents(prev => prev.map(s => ({ ...s, present: status })));
  };

  const handleSubmit = () => {
    const unmarked = students.filter(s => s.present === null).length;
    if (unmarked > 0) {
      Alert.alert('Incomplete', `${unmarked} students are not marked yet.`);
      return;
    }
    const presentCount = students.filter(s => s.present === true).length;
    Alert.alert('Attendance Submitted', `${presentCount}/${students.length} students present.`);
  };

  const presentCount = students.filter(s => s.present === true).length;
  const absentCount = students.filter(s => s.present === false).length;
  const unmarkedCount = students.filter(s => s.present === null).length;

  const renderStudent = ({ item, index }) => (
    <Animated.View style={[styles.studentCard, { opacity: fadeAnim }]}>
      <View style={styles.avatarCircle}>
        <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
      </View>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        <Text style={styles.studentEmail}>{item.email}</Text>
      </View>
      <View style={styles.attendanceBtns}>
        <TouchableOpacity
          onPress={() => markAttendance(item.id, true)}
          style={[styles.markBtn, item.present === true && styles.presentActive]}
        >
          <Ionicons name="checkmark" size={18} color={item.present === true ? '#FFF' : COLORS.success} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => markAttendance(item.id, false)}
          style={[styles.markBtn, item.present === false && styles.absentActive]}
        >
          <Ionicons name="close" size={18} color={item.present === false ? '#FFF' : COLORS.error} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Mark Attendance</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Date & Summary */}
        <View style={styles.summaryRow}>
          <View style={styles.dateCard}>
            <Ionicons name="calendar" size={16} color={COLORS.primary} />
            <Text style={styles.dateText}>{selectedDate}</Text>
          </View>
          <View style={styles.statsRow}>
            <View style={[styles.statBadge, { backgroundColor: COLORS.success + '20' }]}>
              <Text style={[styles.statValue, { color: COLORS.success }]}>{presentCount}</Text>
              <Text style={styles.statLabel}>Present</Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: COLORS.error + '20' }]}>
              <Text style={[styles.statValue, { color: COLORS.error }]}>{absentCount}</Text>
              <Text style={styles.statLabel}>Absent</Text>
            </View>
            <View style={[styles.statBadge, { backgroundColor: COLORS.warning + '20' }]}>
              <Text style={[styles.statValue, { color: COLORS.warning }]}>{unmarkedCount}</Text>
              <Text style={styles.statLabel}>Pending</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity onPress={() => markAll(true)} style={styles.quickBtn}>
            <Ionicons name="checkmark-done" size={16} color={COLORS.success} />
            <Text style={styles.quickBtnText}>All Present</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => markAll(false)} style={styles.quickBtn}>
            <Ionicons name="close-circle-outline" size={16} color={COLORS.error} />
            <Text style={styles.quickBtnText}>All Absent</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => markAll(null)} style={styles.quickBtn}>
            <Ionicons name="refresh" size={16} color={COLORS.info} />
            <Text style={styles.quickBtnText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <FlatList
          data={students}
          renderItem={renderStudent}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />

        <View style={styles.bottomBar}>
          <TouchableOpacity onPress={handleSubmit} style={styles.submitBtn}>
            <LinearGradient colors={COLORS.gradientPrimary} style={styles.submitGradient}>
              <Ionicons name="checkmark-circle" size={20} color="#FFF" />
              <Text style={styles.submitText}>Submit Attendance</Text>
            </LinearGradient>
          </TouchableOpacity>
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
  headerTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.lg, ...FONTS.bold },
  summaryRow: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  dateCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.backgroundCard,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start', borderWidth: 1, borderColor: COLORS.surfaceBorder, marginBottom: SPACING.sm,
  },
  dateText: { color: COLORS.textPrimary, fontSize: FONT_SIZES.md, ...FONTS.medium },
  statsRow: { flexDirection: 'row', gap: SPACING.sm },
  statBadge: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, alignItems: 'center',
  },
  statValue: { fontSize: FONT_SIZES.xl, ...FONTS.bold },
  statLabel: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, ...FONTS.medium, marginTop: 2 },
  quickActions: {
    flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.sm,
  },
  quickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: SPACING.sm, backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  quickBtnText: { color: COLORS.textSecondary, fontSize: FONT_SIZES.xs, ...FONTS.medium },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  studentCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  avatarCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + '20',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: COLORS.primary, fontSize: FONT_SIZES.body, ...FONTS.bold },
  studentInfo: { flex: 1, marginLeft: SPACING.md },
  studentName: { color: COLORS.textPrimary, fontSize: FONT_SIZES.md, ...FONTS.semiBold },
  studentEmail: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2 },
  attendanceBtns: { flexDirection: 'row', gap: SPACING.sm },
  markBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.backgroundElevated,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  presentActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  absentActive: { backgroundColor: COLORS.error, borderColor: COLORS.error },
  bottomBar: {
    paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, paddingBottom: 30,
    backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: COLORS.surfaceBorder,
  },
  submitBtn: { borderRadius: BORDER_RADIUS.lg, overflow: 'hidden' },
  submitGradient: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg,
  },
  submitText: { color: '#FFF', fontSize: FONT_SIZES.body, ...FONTS.bold },
});

export default TeacherAttendanceScreen;
