// Teacher Revenue Screen — Revenue analytics and payouts
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

const DEMO_TRANSACTIONS = [
  { id: '1', student: 'Priya Sharma', course: 'Beginner Yoga Flow', amount: 999, date: '2026-07-08', type: 'course' },
  { id: '2', student: 'Arjun Patel', course: 'Power Yoga Live', amount: 199, date: '2026-07-07', type: 'class' },
  { id: '3', student: 'Sneha Reddy', course: 'Advanced Asanas', amount: 1499, date: '2026-07-06', type: 'course' },
  { id: '4', student: 'Rahul Verma', course: 'Morning Vinyasa', amount: 999, date: '2026-07-05', type: 'course' },
  { id: '5', student: 'Ananya Gupta', course: 'Meditation Basics', amount: 499, date: '2026-07-03', type: 'course' },
  { id: '6', student: 'Vikram Singh', course: 'Evening Flow Live', amount: 199, date: '2026-07-02', type: 'class' },
];

const MONTHLY_DATA = [
  { month: 'Jan', amount: 12000 },
  { month: 'Feb', amount: 18500 },
  { month: 'Mar', amount: 15200 },
  { month: 'Apr', amount: 22800 },
  { month: 'May', amount: 28400 },
  { month: 'Jun', amount: 32700 },
  { month: 'Jul', amount: 24500 },
];

const TeacherRevenueScreen = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [period, setPeriod] = useState('month');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const totalRevenue = DEMO_TRANSACTIONS.reduce((s, t) => s + t.amount, 0);
  const courseRevenue = DEMO_TRANSACTIONS.filter(t => t.type === 'course').reduce((s, t) => s + t.amount, 0);
  const classRevenue = DEMO_TRANSACTIONS.filter(t => t.type === 'class').reduce((s, t) => s + t.amount, 0);
  const maxAmount = Math.max(...MONTHLY_DATA.map(d => d.amount));

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Revenue</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* Total Revenue Card */}
            <LinearGradient colors={COLORS.gradientPrimary} style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Revenue</Text>
              <Text style={styles.totalValue}>₹{totalRevenue.toLocaleString()}</Text>
              <View style={styles.totalRow}>
                <View style={styles.totalSplit}>
                  <Ionicons name="book-outline" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.totalSplitText}>Courses: ₹{courseRevenue.toLocaleString()}</Text>
                </View>
                <View style={styles.totalSplit}>
                  <Ionicons name="videocam-outline" size={14} color="rgba(255,255,255,0.7)" />
                  <Text style={styles.totalSplitText}>Classes: ₹{classRevenue.toLocaleString()}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Period Filter */}
            <View style={styles.periodRow}>
              {['week', 'month', 'year'].map(p => (
                <TouchableOpacity key={p} onPress={() => setPeriod(p)} style={[styles.periodBtn, period === p && styles.periodBtnActive]}>
                  <Text style={[styles.periodText, period === p && styles.periodTextActive]}>{p.charAt(0).toUpperCase() + p.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Bar Chart */}
            <View style={styles.chartCard}>
              <Text style={styles.chartTitle}>Monthly Earnings</Text>
              <View style={styles.chart}>
                {MONTHLY_DATA.map((d, i) => {
                  const barHeight = (d.amount / maxAmount) * 120;
                  return (
                    <View key={i} style={styles.barContainer}>
                      <Text style={styles.barValue}>₹{(d.amount / 1000).toFixed(0)}k</Text>
                      <LinearGradient
                        colors={i === MONTHLY_DATA.length - 1 ? COLORS.gradientAccent : [COLORS.primary + '60', COLORS.primary]}
                        style={[styles.bar, { height: barHeight }]}
                      />
                      <Text style={styles.barLabel}>{d.month}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {/* Recent Transactions */}
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            {DEMO_TRANSACTIONS.map(tx => (
              <View key={tx.id} style={styles.txCard}>
                <View style={[styles.txIcon, { backgroundColor: (tx.type === 'course' ? COLORS.primary : COLORS.accent) + '15' }]}>
                  <Ionicons name={tx.type === 'course' ? 'book' : 'videocam'} size={16} color={tx.type === 'course' ? COLORS.primary : COLORS.accent} />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txStudent}>{tx.student}</Text>
                  <Text style={styles.txCourse}>{tx.course} • {tx.date}</Text>
                </View>
                <Text style={styles.txAmount}>+₹{tx.amount}</Text>
              </View>
            ))}
          </Animated.View>
        </ScrollView>
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
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.backgroundCard,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.lg, ...FONTS.bold },
  scrollContent: { paddingHorizontal: SPACING.lg, paddingBottom: 30 },
  totalCard: { borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, marginBottom: SPACING.md, alignItems: 'center' },
  totalLabel: { color: 'rgba(255,255,255,0.7)', fontSize: FONT_SIZES.sm, ...FONTS.medium },
  totalValue: { color: '#FFF', fontSize: 36, ...FONTS.bold, marginVertical: 4 },
  totalRow: { flexDirection: 'row', gap: SPACING.lg, marginTop: SPACING.sm },
  totalSplit: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  totalSplitText: { color: 'rgba(255,255,255,0.8)', fontSize: FONT_SIZES.sm },
  periodRow: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md },
  periodBtn: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.surfaceBorder, alignItems: 'center',
  },
  periodBtnActive: { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
  periodText: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm, ...FONTS.medium },
  periodTextActive: { color: COLORS.primary },
  chartCard: {
    backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg,
    marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  chartTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.body, ...FONTS.bold, marginBottom: SPACING.md },
  chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 160 },
  barContainer: { alignItems: 'center' },
  barValue: { color: COLORS.textMuted, fontSize: 9, ...FONTS.medium, marginBottom: 4 },
  bar: { width: 28, borderRadius: BORDER_RADIUS.sm, minHeight: 8 },
  barLabel: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, ...FONTS.medium, marginTop: 6 },
  sectionTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.lg, ...FONTS.bold, marginBottom: SPACING.md },
  txCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  txIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  txInfo: { flex: 1 },
  txStudent: { color: COLORS.textPrimary, fontSize: FONT_SIZES.md, ...FONTS.semiBold },
  txCourse: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2 },
  txAmount: { color: COLORS.success, fontSize: FONT_SIZES.body, ...FONTS.bold },
});

export default TeacherRevenueScreen;
