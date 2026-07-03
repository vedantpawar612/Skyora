// AI Assistant Screen — OpenAI-powered teacher assistant chat
import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, FlatList,
  Animated, StatusBar, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING, SHADOWS } from '../../config/theme';
import { useAuth } from '../../contexts/AuthContext';

const QUICK_ACTIONS = [
  { label: "Today's Attendance", icon: 'checkmark-circle', prompt: "Show me today's attendance summary" },
  { label: 'Revenue Summary', icon: 'cash', prompt: 'What is my revenue this month?' },
  { label: 'Student Report', icon: 'people', prompt: 'Give me a summary of student performance' },
  { label: 'Send Reminder', icon: 'notifications', prompt: 'Help me send a class reminder to all students' },
];

const DEMO_RESPONSES = {
  attendance: "📊 **Today's Attendance**\n\nMorning Yoga (8 AM): 12/15 present (80%)\nEvening Flow (6 PM): 8/10 present (80%)\n\nOverall: 20/25 students (80%)\n\n3 students have missed more than 3 classes this week. Would you like me to send them a reminder?",
  revenue: "💰 **Revenue Summary — This Month**\n\n• Course Sales: ₹24,500\n• Live Classes: ₹8,200\n• Total: ₹32,700\n\n📈 Up 15% from last month!\n\nTop earning course: Advanced Asanas (₹12,000)\nNew enrollments: 8 students",
  students: "👥 **Student Performance Summary**\n\n• Total Active Students: 42\n• Average Course Completion: 67%\n• Average Attendance: 82%\n\n🌟 Top Performers:\n1. Priya Sharma — 95% completion\n2. Arjun Patel — 92% completion\n3. Sneha Reddy — 88% completion\n\n⚠️ Needs Attention:\n• 5 students below 50% attendance",
  reminder: "📢 **Class Reminder Draft**\n\nTo: All registered students\nSubject: Upcoming Yoga Class Reminder\n\n\"Namaste! 🙏 Reminder for tomorrow's class at 8:00 AM. Please join on time. Link: [Meeting Link]\"\n\nShall I send this announcement to all your students?",
  default: "I'm your AI teaching assistant. I can help with:\n\n• 📊 Attendance tracking and reports\n• 💰 Revenue and payment analytics\n• 👥 Student performance insights\n• 📢 Sending announcements & reminders\n• 📚 Course management suggestions\n\nWhat would you like help with?",
};

const AIAssistantScreen = ({ navigation }) => {
  const { userProfile } = useAuth();
  const [messages, setMessages] = useState([
    {
      id: '0',
      role: 'assistant',
      content: `Hello ${userProfile?.name || 'Teacher'}! 👋\n\nI'm your AI teaching assistant. I can help you manage attendance, check revenue, analyze student performance, and send announcements.\n\nTry the quick actions below or type your question!`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
  }, []);

  const getAIResponse = (userMessage) => {
    const msg = userMessage.toLowerCase();
    if (msg.includes('attendance')) return DEMO_RESPONSES.attendance;
    if (msg.includes('revenue') || msg.includes('earning') || msg.includes('money')) return DEMO_RESPONSES.revenue;
    if (msg.includes('student') || msg.includes('performance') || msg.includes('report')) return DEMO_RESPONSES.students;
    if (msg.includes('remind') || msg.includes('send') || msg.includes('announce')) return DEMO_RESPONSES.reminder;
    return DEMO_RESPONSES.default;
  };

  const sendMessage = (text) => {
    if (!text.trim()) return;
    const userMsg = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = getAIResponse(text);
      const aiMsg = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1500);
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    return (
      <View style={[styles.msgRow, isUser && styles.msgRowUser]}>
        {!isUser && (
          <View style={styles.aiAvatar}>
            <Ionicons name="sparkles" size={16} color={COLORS.primary} />
          </View>
        )}
        <View style={[styles.msgBubble, isUser ? styles.userBubble : styles.aiBubble]}>
          <Text style={[styles.msgText, isUser && styles.userMsgText]}>{item.content}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <LinearGradient colors={[COLORS.background, COLORS.backgroundLight]} style={styles.gradient}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>AI Assistant</Text>
            <View style={styles.onlineDot} />
          </View>
          <View style={{ width: 40 }} />
        </View>

        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          showsVerticalScrollIndicator={false}
          ListFooterComponent={
            isTyping ? (
              <View style={styles.typingRow}>
                <View style={styles.aiAvatar}>
                  <Ionicons name="sparkles" size={16} color={COLORS.primary} />
                </View>
                <View style={styles.typingBubble}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                  <Text style={styles.typingText}>Thinking...</Text>
                </View>
              </View>
            ) : null
          }
        />

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <Animated.View style={[styles.quickRow, { opacity: fadeAnim }]}>
            {QUICK_ACTIONS.map((action, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => sendMessage(action.prompt)}
                style={styles.quickCard}
              >
                <Ionicons name={action.icon} size={18} color={COLORS.primary} />
                <Text style={styles.quickLabel}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}

        {/* Input */}
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.inputBar}>
            <TextInput
              style={styles.input}
              placeholder="Ask me anything..."
              placeholderTextColor={COLORS.textMuted}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || isTyping}
              style={[styles.sendBtn, (!input.trim() || isTyping) && { opacity: 0.5 }]}
            >
              <LinearGradient colors={COLORS.gradientPrimary} style={styles.sendGradient}>
                <Ionicons name="send" size={18} color="#FFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
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
    borderBottomWidth: 1, borderBottomColor: COLORS.surfaceBorder,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.backgroundCard,
    alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  headerCenter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { color: COLORS.textPrimary, fontSize: FONT_SIZES.lg, ...FONTS.bold },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success },
  messageList: { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, paddingBottom: 20 },
  msgRow: { flexDirection: 'row', marginBottom: SPACING.md, alignItems: 'flex-end' },
  msgRowUser: { justifyContent: 'flex-end' },
  aiAvatar: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primary + '20',
    alignItems: 'center', justifyContent: 'center', marginRight: 8,
  },
  msgBubble: { maxWidth: '78%', borderRadius: BORDER_RADIUS.lg, padding: SPACING.md },
  userBubble: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  aiBubble: {
    backgroundColor: COLORS.backgroundCard, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  msgText: { color: COLORS.textPrimary, fontSize: FONT_SIZES.md, lineHeight: 22 },
  userMsgText: { color: '#FFF' },
  typingRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  typingBubble: {
    flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.backgroundCard,
    borderRadius: BORDER_RADIUS.lg, padding: SPACING.md, borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  typingText: { color: COLORS.textMuted, fontSize: FONT_SIZES.sm },
  quickRow: {
    flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: SPACING.lg, gap: SPACING.sm, paddingBottom: SPACING.sm,
  },
  quickCard: {
    flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: COLORS.backgroundCard,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.round,
    borderWidth: 1, borderColor: COLORS.surfaceBorder,
  },
  quickLabel: { color: COLORS.textSecondary, fontSize: FONT_SIZES.sm, ...FONTS.medium },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm, paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    borderTopWidth: 1, borderTopColor: COLORS.surfaceBorder, backgroundColor: COLORS.background,
  },
  input: {
    flex: 1, backgroundColor: COLORS.backgroundCard, borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, color: COLORS.textPrimary,
    fontSize: FONT_SIZES.body, maxHeight: 100, borderWidth: 1, borderColor: COLORS.surfaceBorder, marginRight: SPACING.sm,
  },
  sendBtn: { borderRadius: 22, overflow: 'hidden' },
  sendGradient: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});

export default AIAssistantScreen;
