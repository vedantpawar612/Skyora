// AI Yoga Trainer - Main App Entry
// Navigation setup with auth flow and bottom tabs
import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

// Config
import { COLORS, FONTS, FONT_SIZES, BORDER_RADIUS, SPACING } from './src/config/theme';

// Screens
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/auth/LoginScreen';
import SignupScreen from './src/screens/auth/SignupScreen';
import ForgotPasswordScreen from './src/screens/auth/ForgotPasswordScreen';
import HomeScreen from './src/screens/HomeScreen';
import PoseLibraryScreen from './src/screens/PoseLibraryScreen';
import PoseDetailScreen from './src/screens/PoseDetailScreen';
import VideoPlayerScreen from './src/screens/VideoPlayerScreen';
import CameraSessionScreen from './src/screens/CameraSessionScreen';
import ProgressScreen from './src/screens/ProgressScreen';
import PranayamListScreen from './src/screens/PranayamListScreen';
import BreathingSessionScreen from './src/screens/BreathingSessionScreen';

// Services
import authService from './src/services/authService';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Custom tab bar with glassmorphic design
const CustomTabBar = ({ state, descriptors, navigation }) => {
  return (
    <View style={tabStyles.container}>
      <View style={tabStyles.tabBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;

          const getIcon = (name, focused) => {
            let iconName;
            switch (name) {
              case 'Home':
                iconName = focused ? 'home' : 'home-outline';
                break;
              case 'Library':
                iconName = focused ? 'grid' : 'grid-outline';
                break;
              case 'Pranayam':
                iconName = focused ? 'leaf' : 'leaf-outline';
                break;
              case 'Progress':
                iconName = focused ? 'stats-chart' : 'stats-chart-outline';
                break;
              default:
                iconName = 'ellipse';
            }
            return iconName;
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
                  {route.name}
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

// Bottom Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Library" component={PoseLibraryScreen} />
      <Tab.Screen name="Pranayam" component={PranayamListScreen} />
      <Tab.Screen name="Progress" component={ProgressScreen} />
    </Tab.Navigator>
  );
};

// Auth Stack
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
};

// Main Stack (authenticated)
const MainStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: COLORS.background },
      }}
    >
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen name="PoseDetail" component={PoseDetailScreen} />
      <Stack.Screen
        name="VideoPlayer"
        component={VideoPlayerScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="CameraSession"
        component={CameraSessionScreen}
        options={{ animation: 'fade' }}
      />
      <Stack.Screen
        name="BreathingSession"
        component={BreathingSessionScreen}
        options={{ animation: 'fade' }}
      />
    </Stack.Navigator>
  );
};

// Root App
export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  // Show splash screen
  if (showSplash) {
    return (
      <>
        <StatusBar style="light" />
        <SplashScreen onFinish={() => setShowSplash(false)} />
      </>
    );
  }

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

  return (
    <>
      <StatusBar style="light" />
      <NavigationContainer theme={navigationTheme}>
        {isAuthenticated ? <MainStack /> : <AuthStack />}
      </NavigationContainer>
    </>
  );
}
