// AI Yoga Trainer - Main App Entry
// Role-based navigation: Student tabs vs Teacher tabs
import React, { useState } from 'react';
import { View, StyleSheet, Animated, Platform, Text } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

// Config
import { COLORS, FONTS, FONT_SIZES, BORDER_RADIUS, SPACING } from './src/config/theme';
import { ROUTES } from './src/config/navigation';

// Contexts
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Auth Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import TeacherSignupScreen from './src/screens/auth/TeacherSignupScreen';

// Student Screens
import HomeScreen from './src/screens/HomeScreen';
import PoseLibraryScreen from './src/screens/PoseLibraryScreen';
import PoseDetailScreen from './src/screens/PoseDetailScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
import CameraSessionScreen from './src/screens/CameraSessionScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import PranayamListScreen from './src/screens/PranayamListScreen';
import BreathingSessionScreen from './src/screens/BreathingSessionScreen';
import StudentExploreScreen from './src/screens/student/StudentExploreScreen';
import StudentMyLearningScreen from './src/screens/student/StudentMyLearningScreen';
import StudentProfileScreen from './src/screens/student/StudentProfileScreen';

// Teacher Screens
import TeacherDashboardScreen from './src/screens/teacher/TeacherDashboardScreen';
import TeacherCoursesScreen from './src/screens/teacher/TeacherCoursesScreen';
import TeacherStudentsScreen from './src/screens/teacher/TeacherStudentsScreen';
import TeacherLiveClassesScreen from './src/screens/teacher/TeacherLiveClassesScreen';
import TeacherProfileScreen from './src/screens/teacher/TeacherProfileScreen';
import CreateCourseScreen from './src/screens/teacher/CreateCourseScreen';
import ScheduleClassScreen from './src/screens/teacher/ScheduleClassScreen';
import TeacherAttendanceScreen from './src/screens/teacher/TeacherAttendanceScreen';
import AIAssistantScreen from './src/screens/teacher/AIAssistantScreen';
import TeacherAnnouncementsScreen from './src/screens/teacher/TeacherAnnouncementsScreen';
import TeacherRevenueScreen from './src/screens/teacher/TeacherRevenueScreen';
import TeacherCertificatesScreen from './src/screens/teacher/TeacherCertificatesScreen';

// Student Detail Screens
import CourseDetailScreen from './src/screens/student/CourseDetailScreen';
import StudentLiveClassesScreen from './src/screens/student/StudentLiveClassesScreen';
import StudentCertificatesScreen from './src/screens/student/StudentCertificatesScreen';
import PaymentHistoryScreen from './src/screens/student/PaymentHistoryScreen';
import SessionResultScreen from './src/screens/SessionResultScreen';

// Shared Screens
import NotificationsScreen from './src/screens/shared/NotificationsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ============================================================
// Custom Tab Bar — shared glassmorphic design for both roles
// ============================================================
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={tabStyles.container}>
      <View style={tabStyles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label = options.tabBarLabel || route.name;

          const getIcon = (name, focused) => {
            const iconMap = {
              // Student tabs
              'Home': focused ? 'home' : 'home-outline',
              'Explore': focused ? 'compass' : 'compass-outline',
              'MyLearning': focused ? 'book' : 'book-outline',
              'Progress': focused ? 'stats-chart' : 'stats-chart-outline',
              'StudentProfile': focused ? 'person' : 'person-outline',
              // Teacher tabs
              'TeacherDashboard': focused ? 'grid' : 'grid-outline',
              'TeacherCourses': focused ? 'library' : 'library-outline',
              'TeacherStudents': focused ? 'people' : 'people-outline',
              'TeacherLiveClasses': focused ? 'videocam' : 'videocam-outline',
              'TeacherProfile': focused ? 'person' : 'person-outline',
              // Legacy tabs
              'Library': focused ? 'grid' : 'grid-outline',
              'Pranayam': focused ? 'leaf' : 'leaf-outline',
            };
            return iconMap[name] || 'ellipse';
          };

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <React.Fragment key={route.key}>
              <Animated.View style={tabStyles.tabItem}>
                <View
                  style={[
                    tabStyles.tabTouchable,
                    isFocused && tabStyles.tabTouchableActive,
                  ]}
                >
                  <Ionicons
                    name={getIcon(route.name, isFocused)}
                    size={22}
                    color={isFocused ? COLORS.primary : COLORS.textMuted}
                    onPress={onPress}
                  />
                  {isFocused && <View style={tabStyles.activeIndicator} />}
                </View>
                <Animated.Text
                  style={[
                    tabStyles.tabLabel,
                    isFocused && tabStyles.tabLabelActive,
                  ]}
                  onPress={onPress}
                >
                  {label}
                </Animated.Text>
              </Animated.View>
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
};

const tabStyles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    paddingHorizontal: SPACING.lg,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'rgba(16, 21, 46, 0.92)',
    borderRadius: BORDER_RADIUS.xl,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
  },
  tabTouchable: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 32,
    borderRadius: BORDER_RADIUS.md,
  },
  tabTouchableActive: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -2,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.primary,
  },
  tabLabel: {
    color: COLORS.textMuted,
    fontSize: 10,
    ...FONTS.medium,
    marginTop: 3,
  },
  tabLabelActive: {
    color: COLORS.primary,
  },
});

// ============================================================
// Student Tab Navigator
// ============================================================
const StudentTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name={ROUTES.HOME}
        component={HomeScreen}
        options={{ tabBarLabel: 'Home' }}
      />
      <Tab.Screen
        name={ROUTES.EXPLORE}
        component={StudentExploreScreen}
        options={{ tabBarLabel: 'Explore' }}
      />
      <Tab.Screen
        name={ROUTES.MY_LEARNING}
        component={StudentMyLearningScreen}
        options={{ tabBarLabel: 'Learn' }}
      />
      <Tab.Screen
        name={ROUTES.PROGRESS}
        component={ProgressScreen}
        options={{ tabBarLabel: 'Progress' }}
      />
      <Tab.Screen
        name={ROUTES.STUDENT_PROFILE}
        component={StudentProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// ============================================================
// Teacher Tab Navigator
// ============================================================
const TeacherTabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen
        name={ROUTES.TEACHER_DASHBOARD}
        component={TeacherDashboardScreen}
        options={{ tabBarLabel: 'Dashboard' }}
      />
      <Tab.Screen
        name={ROUTES.TEACHER_COURSES}
        component={TeacherCoursesScreen}
        options={{ tabBarLabel: 'Courses' }}
      />
      <Tab.Screen
        name={ROUTES.TEACHER_STUDENTS}
        component={TeacherStudentsScreen}
        options={{ tabBarLabel: 'Students' }}
      />
      <Tab.Screen
        name={ROUTES.TEACHER_LIVE_CLASSES}
        component={TeacherLiveClassesScreen}
        options={{ tabBarLabel: 'Live' }}
      />
      <Tab.Screen
        name={ROUTES.TEACHER_PROFILE}
        component={TeacherProfileScreen}
        options={{ tabBarLabel: 'Profile' }}
      />
    </Tab.Navigator>
  );
};

// ============================================================
// Auth Stack (unauthenticated users)
// ============================================================
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} />
      <Stack.Screen name={ROUTES.SIGNUP} component={SignupScreen} />
      <Stack.Screen name={ROUTES.TEACHER_SIGNUP} component={TeacherSignupScreen} />
      <Stack.Screen name={ROUTES.FORGOT_PASSWORD} component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

// ============================================================
// Student Stack (authenticated student)
// ============================================================
const StudentStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name={ROUTES.STUDENT_TABS} component={StudentTabNavigator} />
      <Stack.Screen name={ROUTES.LIBRARY} component={PoseLibraryScreen} />
      <Stack.Screen name={ROUTES.PRANAYAM} component={PranayamListScreen} />
      <Stack.Screen name={ROUTES.POSE_DETAIL} component={PoseDetailScreen} />
      <Stack.Screen
        name={ROUTES.VIDEO_PLAYER}
        component={VideoPlayerScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name={ROUTES.CAMERA_SESSION}
        component={CameraSessionScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name={ROUTES.SESSION_RESULT}
        component={SessionResultScreen}
        options={{ animation: 'slide_from_bottom' }}
      />
      <Stack.Screen name={ROUTES.BREATHING_SESSION} component={BreathingSessionScreen} options={{ animation: 'fade' }} />
      <Stack.Screen name={ROUTES.COURSE_DETAIL} component={CourseDetailScreen} />
      <Stack.Screen name={ROUTES.STUDENT_LIVE_CLASSES} component={StudentLiveClassesScreen} />
      <Stack.Screen name={ROUTES.STUDENT_CERTIFICATES} component={StudentCertificatesScreen} />
      <Stack.Screen name={ROUTES.PAYMENT_HISTORY} component={PaymentHistoryScreen} />
      <Stack.Screen name={ROUTES.NOTIFICATIONS} component={NotificationsScreen} />
    </Stack.Navigator>
  );
};

// ============================================================
// Teacher Stack (authenticated teacher)
// ============================================================
const TeacherStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name={ROUTES.TEACHER_TABS} component={TeacherTabNavigator} />
      <Stack.Screen name={ROUTES.CREATE_COURSE} component={CreateCourseScreen} />
      <Stack.Screen name={ROUTES.SCHEDULE_CLASS} component={ScheduleClassScreen} />
      <Stack.Screen name={ROUTES.TEACHER_ATTENDANCE} component={TeacherAttendanceScreen} />
      <Stack.Screen name={ROUTES.AI_ASSISTANT} component={AIAssistantScreen} />
      <Stack.Screen name={ROUTES.TEACHER_ANNOUNCEMENTS} component={TeacherAnnouncementsScreen} />
      <Stack.Screen name={ROUTES.TEACHER_REVENUE} component={TeacherRevenueScreen} />
      <Stack.Screen name={ROUTES.TEACHER_CERTIFICATES} component={TeacherCertificatesScreen} />
      <Stack.Screen name={ROUTES.NOTIFICATIONS} component={NotificationsScreen} />
    </Stack.Navigator>
  );
};

// ============================================================
// Navigation Router — picks the right stack based on auth + role
// ============================================================
const NavigationRouter = () => {
  const { isAuthenticated, isTeacher, loading } = useAuth();

  if (loading) {
    return null; // Splash screen handles loading
  }

  if (!isAuthenticated) {
    return <AuthStack />;
  }

  if (isTeacher) {
    return <TeacherStack />;
  }

  return <StudentStack />;
};

// ============================================================
// Root App
// ============================================================
export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  const navigationTheme = {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      primary: COLORS.primary,
      background: COLORS.background,
      card: COLORS.backgroundCard,
      text: COLORS.textPrimary,
      border: COLORS.surfaceBorder,
      notification: COLORS.accent,
    },
  };

  // Show splash screen
  if (showSplash) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      <AuthProvider>
        <NavigationContainer theme={navigationTheme}>
          <NavigationRouter />
        </NavigationContainer>
      </AuthProvider>
    </>
  );
}
