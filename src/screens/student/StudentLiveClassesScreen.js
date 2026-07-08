// Student Live Classes Screen — Browse and join live classes
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
  Animated, StatusBar, FlatList, Linking, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';

const DEMO_CLASSES = [
  { id: '1', title: 'Morning Vinyasa Flow', teacher: 'Guru Priya', date: '2026-07-10', startTime: '08:00', endTime: '09:00', spots: 5, capacity: 20, price: 0, meetingLink: 'https://meet.google.com/abc-xyz', registered: false },
  { id: '2', title: 'Power Yoga Intensive', teacher: 'Acharya Dev', date: '2026-07-11', startTime: '17:00', endTime: '18:30', spots: 8, capacity: 15, price: 199, meetingLink: 'https://zoom.us/j/123456', registered: true },
  { id: '3', title: 'Meditation & Pranayama', teacher: 'Meera Sharma', date: '2026-07-12', startTime: '06:30', endTime: '07:30', spots: 12, capacity: 30, price: 0, meetingLink: 'https://meet.google.com/def-uvw', registered: false },
  { id: '4', title: 'Ashtanga Primary Series', teacher: 'Yogi Rajan', date: '2026-07-14', startTime: '07:00', endTime: '08:30', spots: 3, capacity: 10, price: 299, meetingLink: 'https://zoom.us/j/789012', registered: true },
];

const StudentLiveClassesScreen = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [classes, setClasses] = useState(DEMO_CLASSES);
  const [filter, setFilter] = useState('all');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const filteredClasses = filter === 'registered'
    ? classes.filter(c => c.registered)
    : filter === 'free'
    ? classes.filter(c => c.price === 0)
    : classes;

  const handleRegister = (id) => {
    setClasses(prev => prev.map(c => c.id === id ? { ...c, registered: true, spots: c.spots - 1 } : c));
    Alert.alert('Registered!', 'You have been registered for this class.');
  };

  const handleJoin = (link) => {
    Linking.openURL(link).catch(() => Alert.alert('Error', 'Could not open meeting link.'));
  };

  const renderClass = ({ item }) => (
    <Animated.View style={[styles.classCard, { opacity: fadeAnim }]}>
      <LinearGradient
        colors={item.registered ? ['rgba(0,217,166,0.1)', 'rgba(0,217,166,0.02)'] : ['rgba(108,99,255,0.1)', 'rgba(108,99,255,0.02)']}
        style={styles.classGradient}
      >
        <View style={styles.classHeader}>
          <View style={styles.dateBox}>
            <Text style={styles.dateDay}>{new Date(item.date).getDate()}</Text>
            <Text style={styles.dateMonth}>{new Date(item.date).toLocaleString('default', { month: 'short' })}</Text>
          </View>
          <View style={styles.classInfo}>
            <Text style={styles.classTitle}>{item.title}</Text>
            <Text style={styles.classTeacher}>{item.teacher}</Text>
            <View style={styles.classMeta}>
              <Ionicons name="time-outline" size={12} color={COLORS.textMuted} />
              <Text style={styles.classMetaText}>{item.startTime} - {item.endTime}</Text>
              <Ionicons name="people-outline" size={12} color={COLORS.textMuted} style={{ marginLeft: 8 }} />
              <Text style={styles.classMetaText}>{item.spots} spots left</Text>
            </View>
          </View>
          {item.price > 0 && (
            <View style={styles.priceBadge}>
              <Text style={styles.priceText}>₹{item.price}</Text>
            </View>
          )}
          {item.price === 0 && (
            <View style={[styles.priceBadge, { backgroundColor: COLORS.success + '20' }]}>
              <Text style={[styles.priceText, { color: COLORS.success }]}>Free</Text>
            </View>
          )}
        </View>
        <View style={styles.classActions}>
          {item.registered ? (
            <>
              <View style={styles.registeredBadge}>
                <Ionicons name="checkmark-circle" size={14} color={COLORS.accent} />
                <Text style={styles.registeredText}>Registered</Text>
              </View>
              <TouchableOpacity onPress={() => handleJoin(item.meetingLink)} style={styles.joinBtn}>
                <LinearGradient colors={COLORS.gradientAccent} style={styles.joinGradient}>
                  <Ionicons name="videocam" size={14} color="#FFF" />
                  <Text style={styles.joinText}>Join Class</Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity onPress={() => handleRegister(item.id)} style={styles.registerBtn}>
              <Text style={styles.registerBtnText}>Register</Text>
            </TouchableOpacity>
          )}
        </View>
      </LinearGradient>
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
          <Text style={styles.headerTitle}>Live Classes</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
          {[{ key: 'all', label: 'All Classes' }, { key: 'registered', label: 'My Classes' }, { key: 'free', label: 'Free' }].map(f => (
            <TouchableOpacity key={f.key} onPress={() => setFilter(f.key)} style={[styles.filterChip, filter === f.key && styles.filterChipActive]}>
              <Text style={[styles.filterText, filter === f.key && styles.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <FlatList
          data={filteredClasses}
          renderItem={renderClass}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="videocam-off-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No classes found</Text>
            </View>
          }
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
    paddingHorizontal: SPACING.lg, paddingTop: 50, paddingBottom: SPACING.sm,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.backgroundCard,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.lg, ...FONTS.bold },
  filterRow: { maxHeight: 44, marginBottom: SPACING.sm },
  filterContent: { paddingHorizontal: SPACING.lg, gap: SPACING.sm },
  filterChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.backgroundCard, borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  filterChipActive: { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
  filterText: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm, ...FONTS.medium },
  filterTextActive: { color: COLORS.primary },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 30 },
  classCard: { marginBottom: SPACING.md },
  classGradient: { borderRadius: BORDER_RADIUS.xl, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.surfaceBorder },
  classHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  dateBox: {
    width: 48, height: 52, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.primary + '20',
    alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md,
  },
  dateDay: { color: COLORS.primary, fontSize: FONT_SIZES.xl, ...FONTS.bold },
  dateMonth: { color: COLORS.primary, fontSize: FONT_SIZES.xs, ...FONTS.medium, textTransform: 'uppercase' },
  classInfo: { flex: 1 },
  classTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.body, ...FONTS.semiBold },
  classTeacher: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, marginTop: 2 },
  classMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 4 },
  classMetaText: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs },
  priceBadge: {
    backgroundColor: COLORS.primary + '20', paddingHorizontal: SPACING.sm, paddingVertical: 4,
    borderRadius: BORDER_RADIUS.round,
  },
  priceText: { color: COLORS.primary, fontSize: FONT_SIZES.sm, ...FONTS.bold },
  classActions: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: SPACING.md },
  registeredBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  registeredText: { color: COLORS.accent, fontSize: FONT_SIZES.sm, ...FONTS.medium },
  joinBtn: { borderRadius: BORDER_RADIUS.md, overflow: 'hidden' },
  joinGradient: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md },
  joinText: { color: '#FFF', fontSize: FONT_SIZES.sm, ...FONTS.bold },
  registerBtn: {
    flex: 1, alignItems: 'center', paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.primary, backgroundColor: COLORS.primary + '10',
  },
  registerBtnText: { color: COLORS.primary, fontSize: FONT_SIZES.md, ...FONTS.semiBold },
  emptyState: { alignItems: 'center', paddingTop: 60 },
  emptyText: { color: COLORS.textMuted, fontSize: FONT_SIZES.body, marginTop: SPACING.md },
});

export default StudentLiveClassesScreen;
