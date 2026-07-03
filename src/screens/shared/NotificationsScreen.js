// NotificationsScreen - Shared notification center for students and teachers
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  FlatList,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';

// Map notification type → icon config
const TYPE_ICONS = {
  enrollment: { name: 'person-add', color: COLORS.primary },
  payment: { name: 'cash', color: COLORS.success },
  reminder: { name: 'alarm', color: COLORS.warning },
  announcement: { name: 'megaphone', color: COLORS.info },
  certificate: { name: 'ribbon', color: COLORS.accent },
};

// Hardcoded demo notifications
const DEMO_NOTIFICATIONS = [
  {
    id: '1',
    type: 'enrollment',
    title: 'New Student Enrolled',
    message: 'Priya Sharma has enrolled in your "Beginner Yoga Essentials" course.',
    read: false,
    createdAt: new Date(Date.now() - 15 * 60 * 1000), // 15 min ago
  },
  {
    id: '2',
    type: 'payment',
    title: 'Payment Received',
    message: '₹1,499 received for "Advanced Vinyasa Flow" course enrollment.',
    read: false,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
  },
  {
    id: '3',
    type: 'reminder',
    title: 'Live Class Reminder',
    message: 'Your "Morning Surya Namaskar" session starts in 30 minutes.',
    read: true,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
  },
  {
    id: '4',
    type: 'announcement',
    title: 'Platform Update',
    message: 'New AI-powered pose detection improvements are now live! Try a practice session.',
    read: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
  },
  {
    id: '5',
    type: 'certificate',
    title: 'Certificate Earned 🎉',
    message: 'Congratulations! You earned a certificate for completing "Pranayama Mastery".',
    read: true,
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
  },
];

const NotificationsScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState(DEMO_NOTIFICATIONS);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // In production, re-fetch from notificationService here
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleMarkAsRead = useCallback((notificationId) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
  }, []);

  const handleMarkAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const getTimeAgo = (date) => {
    try {
      return formatDistanceToNow(date, { addSuffix: true });
    } catch {
      return '';
    }
  };

  const renderNotificationItem = ({ item, index }) => {
    const iconConfig = TYPE_ICONS[item.type] || TYPE_ICONS.announcement;
    const itemAnim = new Animated.Value(0);

    // Stagger entrance animation
    Animated.timing(itemAnim, {
      toValue: 1,
      duration: 400,
      delay: index * 80,
      useNativeDriver: true,
    }).start();

    return (
      <Animated.View
        style={{
          opacity: itemAnim,
          transform: [
            {
              translateY: itemAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        }}
      >
        <TouchableOpacity
          style={[styles.notificationCard, !item.read && styles.unreadCard]}
          activeOpacity={0.7}
          onPress={() => handleMarkAsRead(item.id)}
        >
          {/* Unread dot */}
          {!item.read && <View style={styles.unreadDot} />}

          {/* Type icon */}
          <View style={[styles.iconContainer, { backgroundColor: iconConfig.color + '18' }]}>
            <Ionicons name={iconConfig.name} size={22} color={iconConfig.color} />
          </View>

          {/* Content */}
          <View style={styles.notificationContent}>
            <View style={styles.notificationHeader}>
              <Text
                style={[styles.notificationTitle, !item.read && styles.unreadTitle]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={styles.timeAgo}>{getTimeAgo(item.createdAt)}</Text>
            </View>
            <Text style={styles.notificationMessage} numberOfLines={2}>
              {item.message}
            </Text>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Ionicons name="notifications-off-outline" size={64} color={COLORS.textMuted} />
      </View>
      <Text style={styles.emptyTitle}>No notifications yet</Text>
      <Text style={styles.emptySubtext}>
        When you receive notifications, they'll appear here.
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient
        colors={[COLORS.background, COLORS.backgroundLight]}
        style={styles.gradient}
      >
        <Animated.View
          style={[
            styles.content,
            { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </View>
            {unreadCount > 0 ? (
              <TouchableOpacity onPress={handleMarkAllAsRead} style={styles.markAllBtn}>
                <Text style={styles.markAllText}>Mark all read</Text>
              </TouchableOpacity>
            ) : (
              <View style={{ width: 80 }} />
            )}
          </View>

          {/* Notifications List */}
          <FlatList
            data={notifications}
            renderItem={renderNotificationItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={COLORS.primary}
                colors={[COLORS.primary]}
              />
            }
          />
        </Animated.View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 60,
    paddingBottom: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xl,
    ...FONTS.bold,
  },
  badge: {
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.round,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
    paddingHorizontal: 6,
  },
  badgeText: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.xs,
    ...FONTS.bold,
  },
  markAllBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  markAllText: {
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.semiBold,
  },
  // List
  listContent: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: 100,
  },
  // Notification Card
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    position: 'relative',
  },
  unreadCard: {
    borderColor: 'rgba(108, 99, 255, 0.3)',
    backgroundColor: 'rgba(108, 99, 255, 0.06)',
  },
  unreadDot: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
    marginTop: 2,
  },
  notificationContent: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  notificationTitle: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.md,
    ...FONTS.medium,
    flex: 1,
    marginRight: SPACING.sm,
  },
  unreadTitle: {
    color: COLORS.textPrimary,
    ...FONTS.semiBold,
  },
  timeAgo: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.xs,
    ...FONTS.regular,
    marginTop: 2,
  },
  notificationMessage: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    lineHeight: 18,
  },
  // Empty State
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 120,
    paddingHorizontal: SPACING.xl,
  },
  emptyIconWrap: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONT_SIZES.lg,
    ...FONTS.semiBold,
    marginBottom: SPACING.sm,
  },
  emptySubtext: {
    color: COLORS.textMuted,
    fontSize: FONT_SIZES.md,
    ...FONTS.regular,
    textAlign: 'center',
    lineHeight: 22,
  },
});

export default NotificationsScreen;
