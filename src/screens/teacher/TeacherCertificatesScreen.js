// Teacher Certificates Screen — Issue and manage certificates
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Animated, StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';

const DEMO_ISSUED = [
  { id: '1', studentName: 'Priya Sharma', courseName: 'Beginner Yoga Flow', issuedDate: '2026-06-15', certId: 'SKYORA-A3F92K' },
  { id: '2', studentName: 'Arjun Patel', courseName: 'Beginner Yoga Flow', issuedDate: '2026-06-18', certId: 'SKYORA-B7K41M' },
  { id: '3', studentName: 'Sneha Reddy', courseName: 'Meditation Basics', issuedDate: '2026-05-20', certId: 'SKYORA-C2D83N' },
];

const PENDING_STUDENTS = [
  { id: '4', studentName: 'Rahul Verma', courseName: 'Beginner Yoga Flow', completedDate: '2026-07-05', progress: 100 },
  { id: '5', studentName: 'Ananya Gupta', courseName: 'Advanced Asanas', completedDate: '2026-07-08', progress: 100 },
];

const TeacherCertificatesScreen = ({ navigation }) => {
  const [tab, setTab] = useState('issued');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const handleIssue = (student) => {
    Alert.alert('Issue Certificate', `Issue certificate to ${student.studentName} for ${student.courseName}?`, [
      { text: 'Cancel' },
      { text: 'Issue', onPress: () => Alert.alert('Success', 'Certificate issued!') },
    ]);
  };

  const renderIssued = ({ item }) => (
    <View style={styles.certCard}>
      <View style={styles.certLeft}>
        <View style={styles.ribbonIcon}>
          <Ionicons name="ribbon" size={18} color={COLORS.warning} />
        </View>
        <View style={styles.certInfo}>
          <Text style={styles.certStudent}>{item.studentName}</Text>
          <Text style={styles.certCourse}>{item.courseName}</Text>
          <Text style={styles.certMeta}>Issued: {item.issuedDate} • {item.certId}</Text>
        </View>
      </View>
    </View>
  );

  const renderPending = ({ item }) => (
    <View style={styles.certCard}>
      <View style={styles.certLeft}>
        <View style={[styles.ribbonIcon, { backgroundColor: COLORS.accent + '15' }]}>
          <Ionicons name="hourglass-outline" size={18} color={COLORS.accent} />
        </View>
        <View style={styles.certInfo}>
          <Text style={styles.certStudent}>{item.studentName}</Text>
          <Text style={styles.certCourse}>{item.courseName}</Text>
          <Text style={styles.certMeta}>Completed: {item.completedDate}</Text>
        </View>
      </View>
      <TouchableOpacity onPress={() => handleIssue(item)} style={styles.issueBtn}>
        <Text style={styles.issueBtnText}>Issue</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Certificates</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Tab Selector */}
        <View style={styles.tabRow}>
          {[{ key: 'issued', label: `Issued (${DEMO_ISSUED.length})` }, { key: 'pending', label: `Pending (${PENDING_STUDENTS.length})` }].map(t => (
            <TouchableOpacity key={t.key} onPress={() => setTab(t.key)} style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}>
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <FlatList
          data={tab === 'issued' ? DEMO_ISSUED : PENDING_STUDENTS}
          renderItem={tab === 'issued' ? renderIssued : renderPending}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingTop: 50, paddingBottom: SPACING.md,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.backgroundCard, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder },
  headerTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.lg, ...FONTS.bold },
  tabRow: { flexDirection: 'row', paddingHorizontal: SPACING.lg, gap: SPACING.sm, marginBottom: SPACING.md },
  tabBtn: { flex: 1, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.backgroundCard, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder },
  tabBtnActive: { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
  tabText: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm, ...FONTS.semiBold },
  tabTextActive: { color: COLORS.primary },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 30 },
  certCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm, borderWidth: 1, borderColor: COLORS.surfaceBorder },
  certLeft: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  ribbonIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.warning + '15', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  certInfo: { flex: 1 },
  certStudent: { color: COLORS.textPrimary, fontSize: FONT_SIZES.body, ...FONTS.semiBold },
  certCourse: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, marginTop: 2 },
  certMeta: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2 },
  issueBtn: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.primary + '20' },
  issueBtnText: { color: COLORS.primary, fontSize: FONT_SIZES.sm, ...FONTS.bold },
});

export default TeacherCertificatesScreen;
