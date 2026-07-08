// Payment History Screen — Student payment records
import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList, Animated, StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING } from '../../config/theme';

const DEMO_PAYMENTS = [
  { id: '1', description: 'Beginner Yoga Flow', amount: 999, date: '2026-06-28', method: 'UPI', status: 'success', type: 'course' },
  { id: '2', description: 'Power Yoga Live Class', amount: 199, date: '2026-06-25', method: 'Card', status: 'success', type: 'class' },
  { id: '3', description: 'Advanced Asanas', amount: 1499, date: '2026-06-20', method: 'UPI', status: 'success', type: 'course' },
  { id: '4', description: 'Evening Meditation Session', amount: 99, date: '2026-06-18', method: 'NetBanking', status: 'failed', type: 'class' },
  { id: '5', description: 'Meditation Basics', amount: 499, date: '2026-06-10', method: 'Card', status: 'success', type: 'course' },
];

const PaymentHistoryScreen = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const totalSpent = DEMO_PAYMENTS.filter(p => p.status === 'success').reduce((s, p) => s + p.amount, 0);

  const renderPayment = ({ item }) => (
    <View style={styles.paymentCard}>
      <View style={[styles.typeIcon, { backgroundColor: (item.type === 'course' ? COLORS.primary : COLORS.accent) + '15' }]}>
        <Ionicons name={item.type === 'course' ? 'book' : 'videocam'} size={18} color={item.type === 'course' ? COLORS.primary : COLORS.accent} />
      </View>
      <View style={styles.paymentInfo}>
        <Text style={styles.paymentDesc}>{item.description}</Text>
        <Text style={styles.paymentMeta}>{item.date} • {item.method}</Text>
      </View>
      <View style={styles.paymentRight}>
        <Text style={[styles.paymentAmount, item.status === 'failed' && { color: COLORS.error }]}>₹{item.amount}</Text>
        <View style={[styles.statusBadge, { backgroundColor: (item.status === 'success' ? COLORS.success : COLORS.error) + '15' }]}>
          <Text style={[styles.statusText, { color: item.status === 'success' ? COLORS.success : COLORS.error }]}>
            {item.status === 'success' ? 'Paid' : 'Failed'}
          </Text>
        </View>
      </View>
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
          <Text style={styles.headerTitle}>Payment History</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Summary */}
        <Animated.View style={[styles.summaryCard, { opacity: fadeAnim }]}>
          <LinearGradient colors={COLORS.gradientCard} style={styles.summaryGradient}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryValue}>₹{totalSpent.toLocaleString()}</Text>
            <Text style={styles.summaryMeta}>{DEMO_PAYMENTS.filter(p => p.status === 'success').length} transactions</Text>
          </LinearGradient>
        </Animated.View>

        <FlatList
          data={DEMO_PAYMENTS}
          renderItem={renderPayment}
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
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.backgroundCard,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.lg, ...FONTS.bold },
  summaryCard: { marginHorizontal: SPACING.lg, marginBottom: SPACING.md },
  summaryGradient: { borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, alignItems: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder },
  summaryLabel: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm, ...FONTS.medium },
  summaryValue: { color: COLORS.textPrimary, fontSize: FONT_SIZES.display, ...FONTS.bold, marginVertical: 4 },
  summaryMeta: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 30 },
  paymentCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  typeIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  paymentInfo: { flex: 1 },
  paymentDesc: { color: COLORS.textPrimary, fontSize: FONT_SIZES.md, ...FONTS.semiBold },
  paymentMeta: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2 },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { color: COLORS.textPrimary, fontSize: FONT_SIZES.body, ...FONTS.bold },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: BORDER_RADIUS.round, marginTop: 4 },
  statusText: { fontSize: FONT_SIZES.xs, ...FONTS.semiBold },
});

export default PaymentHistoryScreen;
