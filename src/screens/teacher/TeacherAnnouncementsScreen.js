// Teacher Announcements Screen — Create and manage announcements
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList,
  Animated, StatusBar, Alert, Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';
import GradientButton from '../../components/GradientButton';

const DEMO_ANNOUNCEMENTS = [
  { id: '1', title: 'Holiday Schedule Change', message: 'Classes will be held at modified timings next week due to the festival.', audience: 'All Students', date: '2026-07-08', readCount: 42 },
  { id: '2', title: 'New Course Launch!', message: 'Excited to announce Advanced Pranayama starting July 15th. Early bird discount available!', audience: 'All Students', date: '2026-07-05', readCount: 38 },
  { id: '3', title: 'Assignment Reminder', message: 'Please submit your weekly practice log by Friday.', audience: 'Beginner Yoga Flow', date: '2026-07-01', readCount: 15 },
];

const TeacherAnnouncementsScreen = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [announcements, setAnnouncements] = useState(DEMO_ANNOUNCEMENTS);
  const [showModal, setShowModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [audience, setAudience] = useState('All Students');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const handleCreate = () => {
    if (!newTitle.trim() || !newMessage.trim()) {
      Alert.alert('Error', 'Please fill in both title and message.');
      return;
    }
    const newAnn = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      message: newMessage.trim(),
      audience,
      date: new Date().toISOString().split('T')[0],
      readCount: 0,
    };
    setAnnouncements(prev => [newAnn, ...prev]);
    setNewTitle('');
    setNewMessage('');
    setShowModal(false);
    Alert.alert('Sent!', 'Announcement has been sent to students.');
  };

  const handleDelete = (id) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setAnnouncements(prev => prev.filter(a => a.id !== id)) },
    ]);
  };

  const renderAnnouncement = ({ item }) => (
    <View style={styles.annCard}>
      <View style={styles.annHeader}>
        <View style={styles.megaphoneIcon}>
          <Ionicons name="megaphone" size={18} color={COLORS.primary} />
        </View>
        <View style={styles.annInfo}>
          <Text style={styles.annTitle}>{item.title}</Text>
          <Text style={styles.annDate}>{item.date} • {item.audience}</Text>
        </View>
        <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={16} color={COLORS.error} />
        </TouchableOpacity>
      </View>
      <Text style={styles.annMessage}>{item.message}</Text>
      <View style={styles.annFooter}>
        <Ionicons name="eye-outline" size={14} color={COLORS.textMuted} />
        <Text style={styles.annReadCount}>{item.readCount} students read</Text>
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
          <Text style={styles.headerTitle}>Announcements</Text>
          <TouchableOpacity onPress={() => setShowModal(true)} style={styles.addBtn}>
            <Ionicons name="add" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={announcements}
          renderItem={renderAnnouncement}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="megaphone-outline" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No announcements yet</Text>
            </View>
          }
        />

        {/* FAB */}
        <TouchableOpacity onPress={() => setShowModal(true)} style={styles.fab}>
          <LinearGradient colors={COLORS.gradientPrimary} style={styles.fabGradient}>
            <Ionicons name="add" size={28} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>

        {/* Create Modal */}
        <Modal visible={showModal} animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>New Announcement</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Title</Text>
              <TextInput style={styles.input} placeholder="Announcement title..." placeholderTextColor={COLORS.textMuted} value={newTitle} onChangeText={setNewTitle} />

              <Text style={styles.inputLabel}>Message</Text>
              <TextInput style={[styles.input, styles.inputMulti]} placeholder="Write your announcement..." placeholderTextColor={COLORS.textMuted} value={newMessage} onChangeText={setNewMessage} multiline />

              <Text style={styles.inputLabel}>Audience</Text>
              <View style={styles.audienceRow}>
                {['All Students', 'Beginner Yoga Flow', 'Advanced Asanas'].map(a => (
                  <TouchableOpacity key={a} onPress={() => setAudience(a)} style={[styles.audienceChip, audience === a && styles.audienceChipActive]}>
                    <Text style={[styles.audienceText, audience === a && styles.audienceTextActive]}>{a}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <GradientButton title="Send Announcement" onPress={handleCreate} style={{ marginTop: SPACING.lg }} icon={<Ionicons name="send" size={16} color="#FFF" />} />
            </View>
          </View>
        </Modal>
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
  addBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary + '15',
    alignItems: 'center', justifyContent: 'center',
  },
  list: { paddingHorizontal: SPACING.lg, paddingBottom: 100 },
  annCard: {
    backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.xl, padding: SPACING.md,
    marginBottom: SPACING.md, borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  annHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  megaphoneIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primary + '15', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  annInfo: { flex: 1 },
  annTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.body, ...FONTS.semiBold },
  annDate: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs, marginTop: 2 },
  deleteBtn: { padding: SPACING.xs },
  annMessage: { color: COLORS.textSecondary, fontSize: FONT_SIZES.md, lineHeight: 22, marginBottom: SPACING.sm },
  annFooter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  annReadCount: { color: COLORS.textMuted, fontSize: FONT_SIZES.xs },
  fab: { position: 'absolute', bottom: 30, right: SPACING.lg, borderRadius: 28, overflow: 'hidden', ...SHADOWS.large },
  fabGradient: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingTop: 80 },
  emptyText: { color: COLORS.textMuted, fontSize: FONT_SIZES.body, marginTop: SPACING.md },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { backgroundColor: COLORS.backgroundCard, borderTopLeftRadius: BORDER_RADIUS.xl, borderTopRightRadius: BORDER_RADIUS.xl, padding: SPACING.lg, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.lg },
  modalTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.xl, ...FONTS.bold },
  inputLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, ...FONTS.medium, marginBottom: SPACING.xs, marginTop: SPACING.sm },
  input: {
    backgroundColor: COLORS.backgroundElevated, borderRadius: BORDER_RADIUS.md, borderWidth: 1,
    borderColor: COLORS.surfaceBorder, paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    color: COLORS.textPrimary, fontSize: FONT_SIZES.body, height: 48,
  },
  inputMulti: { height: 100, textAlignVertical: 'top' },
  audienceRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm, marginTop: SPACING.xs },
  audienceChip: {
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.round,
    backgroundColor: COLORS.backgroundElevated, borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  audienceChipActive: { backgroundColor: COLORS.primary + '20', borderColor: COLORS.primary },
  audienceText: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm, ...FONTS.medium },
  audienceTextActive: { color: COLORS.primary },
});

export default TeacherAnnouncementsScreen;
