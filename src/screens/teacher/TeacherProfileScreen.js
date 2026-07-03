// TeacherProfileScreen - Profile view/edit with bio, specialization, certs, and account links
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Animated, StatusBar, Dimensions, TextInput, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import { ROUTES } from '../../config/navigation';
import { useAuth } from '../../contexts/AuthContext';

const { width } = Dimensions.get('window');

// ── Demo Data (would come from Firestore in production) ──────────────────────
const DEFAULT_SPECIALIZATIONS = ['Hatha Yoga', 'Vinyasa', 'Meditation', 'Pranayama'];
const DEFAULT_CERTIFICATIONS = [
  { id: '1', name: 'RYT-200 Yoga Alliance', year: '2022' },
  { id: '2', name: 'Pranayama Teacher Training', year: '2023' },
  { id: '3', name: 'Advanced Asana Certification', year: '2024' },
];

// ── Helper ───────────────────────────────────────────────────────────────────
const getInitials = (name) => {
  if (!name) return '?';
  const parts = name.split(' ');
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.substring(0, 2).toUpperCase();
};

// ── Account Menu Items ───────────────────────────────────────────────────────
const ACCOUNT_ITEMS = [
  { id: '1', label: 'Notifications', icon: 'notifications-outline', color: COLORS.info, route: ROUTES.NOTIFICATIONS },
  { id: '2', label: 'Revenue & Payments', icon: 'wallet-outline', color: COLORS.success, route: ROUTES.TEACHER_REVENUE },
  { id: '3', label: 'Certificates', icon: 'ribbon-outline', color: COLORS.warning, route: ROUTES.TEACHER_CERTIFICATES },
  { id: '4', label: 'AI Assistant', icon: 'sparkles-outline', color: COLORS.primaryLight, route: ROUTES.AI_ASSISTANT },
];

// ── Main Component ───────────────────────────────────────────────────────────
const TeacherProfileScreen = ({ navigation }) => {
  const { userProfile, user, signOut, updateUserProfile } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [bio, setBio] = useState(
    userProfile?.bio || 'Passionate yoga instructor with a focus on helping beginners build a strong foundation. I believe in the transformative power of mindful movement and breathwork.'
  );
  const [specializations, setSpecializations] = useState(
    userProfile?.specialization || DEFAULT_SPECIALIZATIONS
  );
  const [experience, setExperience] = useState(
    userProfile?.yearsOfExperience || 5
  );
  const [certifications, setCertifications] = useState(DEFAULT_CERTIFICATIONS);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleSaveBio = async () => {
    setIsEditingBio(false);
    try {
      await updateUserProfile({ bio });
    } catch (e) {
      // silent fail — demo mode
    }
  };

  const handleRemoveCert = (certId) => {
    Alert.alert('Remove Certification', 'Are you sure you want to remove this certification?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => setCertifications((prev) => prev.filter((c) => c.id !== certId)),
      },
    ]);
  };

  const handleAddCert = () => {
    Alert.alert('Add Certification', 'This feature will open a form to add a new certification.');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  const handleEditProfile = () => {
    Alert.alert('Edit Profile', 'Profile editing form would open here.');
  };

  const profileName = userProfile?.name || user?.displayName || 'Teacher';
  const profileEmail = userProfile?.email || user?.email || 'teacher@skyora.com';
  const profilePhoto = userProfile?.profilePhoto;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        <Animated.ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          style={{ opacity: fadeAnim }}
        >
          <Animated.View style={{ transform: [{ translateY: slideAnim }] }}>
            {/* ── Profile Header ──────────────────────────────────── */}
            <View style={styles.profileHeader}>
              <LinearGradient
                colors={['rgba(108,99,255,0.2)', 'rgba(0,217,166,0.1)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.headerGradient}
              >
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                  {profilePhoto ? (
                    <View style={styles.avatarLarge}>
                      <Text style={styles.avatarTextLarge}>{getInitials(profileName)}</Text>
                    </View>
                  ) : (
                    <LinearGradient colors={COLORS.gradientPrimary} style={styles.avatarLarge}>
                      <Text style={styles.avatarTextLarge}>{getInitials(profileName)}</Text>
                    </LinearGradient>
                  )}
                  <TouchableOpacity style={styles.cameraBtn}>
                    <Ionicons name="camera" size={14} color="#FFF" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.profileName}>{profileName}</Text>
                <Text style={styles.profileEmail}>{profileEmail}</Text>

                {/* Edit Button */}
                <TouchableOpacity
                  style={styles.editProfileBtn}
                  onPress={handleEditProfile}
                  activeOpacity={0.8}
                >
                  <LinearGradient colors={COLORS.gradientPrimary} style={styles.editProfileGradient}>
                    <Ionicons name="create-outline" size={16} color="#FFF" />
                    <Text style={styles.editProfileText}>Edit Profile</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>

            {/* ── Bio Section ─────────────────────────────────────── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
                  <Text style={styles.sectionTitle}>Bio</Text>
                </View>
                <TouchableOpacity
                  onPress={() => isEditingBio ? handleSaveBio() : setIsEditingBio(true)}
                >
                  <Text style={styles.editLink}>
                    {isEditingBio ? 'Save' : 'Edit'}
                  </Text>
                </TouchableOpacity>
              </View>
              {isEditingBio ? (
                <TextInput
                  style={styles.bioInput}
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor={COLORS.textMuted}
                  placeholder="Tell students about yourself..."
                />
              ) : (
                <Text style={styles.bioText}>{bio}</Text>
              )}
            </View>

            {/* ── Specialization Section ──────────────────────────── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="fitness-outline" size={18} color={COLORS.accent} />
                <Text style={styles.sectionTitle}>Specialization</Text>
              </View>
              <View style={styles.tagsContainer}>
                {specializations.map((spec, idx) => (
                  <View key={idx} style={styles.tagChip}>
                    <LinearGradient
                      colors={[COLORS.accent + '20', COLORS.accent + '08']}
                      style={styles.tagGradient}
                    >
                      <Text style={styles.tagText}>{spec}</Text>
                    </LinearGradient>
                  </View>
                ))}
              </View>
            </View>

            {/* ── Experience Section ──────────────────────────────── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="trophy-outline" size={18} color={COLORS.warning} />
                <Text style={styles.sectionTitle}>Experience</Text>
              </View>
              <View style={styles.experienceRow}>
                <View style={styles.experienceCircle}>
                  <LinearGradient
                    colors={[COLORS.warning + '30', COLORS.warning + '10']}
                    style={styles.experienceGradient}
                  >
                    <Text style={styles.experienceValue}>{experience}</Text>
                    <Text style={styles.experienceUnit}>years</Text>
                  </LinearGradient>
                </View>
                <View style={styles.experienceInfo}>
                  <Text style={styles.experienceLabel}>Teaching Experience</Text>
                  <Text style={styles.experienceDesc}>
                    Professional yoga instructor since {2026 - experience}
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Certifications Section ──────────────────────────── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="ribbon-outline" size={18} color={COLORS.info} />
                  <Text style={styles.sectionTitle}>Certifications</Text>
                </View>
                <TouchableOpacity onPress={handleAddCert}>
                  <View style={styles.addBtn}>
                    <Ionicons name="add-circle" size={22} color={COLORS.primary} />
                  </View>
                </TouchableOpacity>
              </View>
              {certifications.map((cert) => (
                <View key={cert.id} style={styles.certItem}>
                  <View style={styles.certIcon}>
                    <Ionicons name="checkmark-circle" size={18} color={COLORS.success} />
                  </View>
                  <View style={styles.certInfo}>
                    <Text style={styles.certName}>{cert.name}</Text>
                    <Text style={styles.certYear}>{cert.year}</Text>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveCert(cert.id)}>
                    <Ionicons name="trash-outline" size={18} color={COLORS.error + '80'} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* ── Account Section ─────────────────────────────────── */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="settings-outline" size={18} color={COLORS.textSecondary} />
                <Text style={styles.sectionTitle}>Account</Text>
              </View>
              {ACCOUNT_ITEMS.map((item, idx) => (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.accountItem,
                    idx < ACCOUNT_ITEMS.length - 1 && styles.accountItemBorder,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => navigation.navigate(item.route)}
                >
                  <View style={[styles.accountIcon, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon} size={20} color={item.color} />
                  </View>
                  <Text style={styles.accountLabel}>{item.label}</Text>
                  <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>

            {/* ── Logout Button ───────────────────────────────────── */}
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={handleLogout}
              activeOpacity={0.8}
            >
              <View style={styles.logoutInner}>
                <Ionicons name="log-out-outline" size={20} color={COLORS.error} />
                <Text style={styles.logoutText}>Sign Out</Text>
              </View>
            </TouchableOpacity>

            {/* App Version */}
            <Text style={styles.versionText}>Skyora v1.0.0</Text>
          </Animated.View>
        </Animated.ScrollView>
      </LinearGradient>
    </View>
  );
};

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollContent: {
    paddingTop: 60,
    paddingBottom: 120,
    paddingHorizontal: SPACING.lg,
  },

  // Profile Header
  profileHeader: {
    marginBottom: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
  },
  headerGradient: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.xl,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  avatarLarge: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.glow,
  },
  avatarTextLarge: {
    color: '#FFF',
    fontSize: FONT_SIZES.hero,
    ...FONTS.bold,
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  profileName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    ...FONTS.bold,
    marginBottom: 4,
  },
  profileEmail: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
    marginBottom: SPACING.md,
  },
  editProfileBtn: {
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },
  editProfileGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
    gap: 6,
  },
  editProfileText: {
    color: '#FFF',
    fontSize: FONT_SIZES.sm,
    ...FONTS.semiBold,
  },

  // Section Card
  sectionCard: {
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    ...FONTS.semiBold,
  },
  editLink: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.semiBold,
  },

  // Bio
  bioText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
    lineHeight: 22,
  },
  bioInput: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
    lineHeight: 22,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
    textAlignVertical: 'top',
    minHeight: 100,
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  tagChip: {
    borderRadius: BORDER_RADIUS.round,
    overflow: 'hidden',
  },
  tagGradient: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.round,
  },
  tagText: {
    color: COLORS.accent,
    fontSize: FONT_SIZES.sm,
    ...FONTS.medium,
  },

  // Experience
  experienceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  experienceCircle: {
    marginRight: SPACING.md,
  },
  experienceGradient: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
  },
  experienceValue: {
    color: COLORS.warning,
    fontSize: FONT_SIZES.xxl,
    ...FONTS.bold,
  },
  experienceUnit: {
    color: COLORS.warning,
    fontSize: FONT_SIZES.xs,
    ...FONTS.medium,
    marginTop: -2,
  },
  experienceInfo: { flex: 1 },
  experienceLabel: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    ...FONTS.semiBold,
    marginBottom: 2,
  },
  experienceDesc: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
  },

  // Certifications
  addBtn: {
    padding: 2,
  },
  certItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  certIcon: {
    marginRight: SPACING.sm,
  },
  certInfo: { flex: 1 },
  certName: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.md,
    ...FONTS.medium,
  },
  certYear: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
  },

  // Account
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  accountItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  accountIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  accountLabel: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body,
    ...FONTS.medium,
  },

  // Logout
  logoutBtn: {
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
    backgroundColor: COLORS.error + '08',
    overflow: 'hidden',
  },
  logoutInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
  },
  logoutText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.body,
    ...FONTS.semiBold,
  },

  // Version
  versionText: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    textAlign: 'center',
    marginTop: SPACING.lg,
  },
});

export default TeacherProfileScreen;
