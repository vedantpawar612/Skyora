// Student Certificates Screen — View earned certificates
import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  Animated, StatusBar, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';

const DEMO_CERTIFICATES = [
  { id: '1', courseName: 'Beginner Yoga Flow', teacherName: 'Guru Priya', completionDate: '2026-06-15', certificateNumber: 'SKYORA-2026-A3F92K', status: 'issued' },
  { id: '2', courseName: 'Meditation Basics', teacherName: 'Meera Sharma', completionDate: '2026-05-20', certificateNumber: 'SKYORA-2026-B7K41M', status: 'issued' },
];

const StudentCertificatesScreen = ({ navigation }) => {
  const { userProfile } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const handleDownload = (cert) => {
    Alert.alert('Download', `Certificate ${cert.certificateNumber} will be downloaded as PDF.`);
  };

  const handleShare = (cert) => {
    Alert.alert('Share', `Share certificate for ${cert.courseName}`);
  };

  const renderCertificate = ({ item, index }) => (
    <Animated.View style={[styles.certCard, { opacity: fadeAnim, transform: [{ translateY: fadeAnim.interpolate({ inputRange: [0, 1], outputRange: [20 * (index + 1), 0] }) }] }]}>
      <LinearGradient
        colors={['rgba(108,99,255,0.15)', 'rgba(0,217,166,0.08)']}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={styles.certGradient}
      >
        {/* Certificate Header */}
        <View style={styles.certHeader}>
          <View style={styles.ribbonIcon}>
            <Ionicons name="ribbon" size={24} color={COLORS.warning} />
          </View>
          <View style={styles.certBadge}>
            <Text style={styles.certBadgeText}>CERTIFICATE</Text>
          </View>
        </View>

        {/* Certificate Content */}
        <Text style={styles.certTitle}>Certificate of Completion</Text>
        <Text style={styles.certCourse}>{item.courseName}</Text>
        <Text style={styles.certStudent}>{userProfile?.name || 'Student'}</Text>

        <View style={styles.certDetails}>
          <View style={styles.certDetail}>
            <Ionicons name="person-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.certDetailText}>Instructor: {item.teacherName}</Text>
          </View>
          <View style={styles.certDetail}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.certDetailText}>Completed: {item.completionDate}</Text>
          </View>
          <View style={styles.certDetail}>
            <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.textMuted} />
            <Text style={styles.certDetailText}>ID: {item.certificateNumber}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.certActions}>
          <TouchableOpacity onPress={() => handleDownload(item)} style={styles.actionBtn}>
            <Ionicons name="download-outline" size={18} color={COLORS.primary} />
            <Text style={styles.actionBtnText}>Download PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleShare(item)} style={styles.actionBtn}>
            <Ionicons name="share-outline" size={18} color={COLORS.accent} />
            <Text style={[styles.actionBtnText, { color: COLORS.accent }]}>Share</Text>
          </TouchableOpacity>
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
          <Text style={styles.headerTitle}>My Certificates</Text>
          <View style={{ width: 40 }} />
        </View>

        <FlatList
          data={DEMO_CERTIFICATES}
          renderItem={renderCertificate}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="ribbon-outline" size={56} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>No Certificates Yet</Text>
              <Text style={styles.emptyText}>Complete a course to earn your first certificate!</Text>
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
    paddingHorizontal: SPACING.lg, paddingTop: 50, paddingBottom: SPACING.md,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.backgroundCard,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  headerTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.lg, ...FONTS.bold },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 30 },
  certCard: { marginBottom: SPACING.lg },
  certGradient: { borderRadius: BORDER_RADIUS.xl, padding: SPACING.lg, borderWidth: 1, borderColor: COLORS.surfaceBorder },
  certHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.md },
  ribbonIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.warning + '15', alignItems: 'center', justifyContent: 'center' },
  certBadge: { backgroundColor: COLORS.primary + '20', paddingHorizontal: SPACING.md, paddingVertical: 4, borderRadius: BORDER_RADIUS.round },
  certBadgeText: { color: COLORS.primary, fontSize: FONT_SIZES.xs, ...FONTS.bold, letterSpacing: 2 },
  certTitle: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, ...FONTS.medium, marginBottom: 4 },
  certCourse: { color: COLORS.textPrimary, fontSize: FONT_SIZES.xl, ...FONTS.bold, marginBottom: 4 },
  certStudent: { color: COLORS.accent, fontSize: FONT_SIZES.body, ...FONTS.semiBold, marginBottom: SPACING.md },
  certDetails: { marginBottom: SPACING.md },
  certDetail: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  certDetailText: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm },
  certActions: { flexDirection: 'row', gap: SPACING.sm, borderTopWidth: 1, borderTopColor: COLORS.surfaceBorder, paddingTop: SPACING.md },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.backgroundElevated },
  actionBtnText: { color: COLORS.primary, fontSize: FONT_SIZES.sm, ...FONTS.semiBold },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.lg, ...FONTS.bold, marginTop: SPACING.md },
  emptyText: { color: COLORS.textMuted, fontSize: FONT_SIZES.md, marginTop: SPACING.xs, textAlign: 'center' },
});

export default StudentCertificatesScreen;
