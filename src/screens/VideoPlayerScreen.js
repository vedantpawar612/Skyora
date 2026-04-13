// Video Player Screen - Full-screen video playback with controls
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, StatusBar,
  Dimensions, Animated, ActivityIndicator,
} from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONTS, SPACING } from '../config/theme';
import GradientButton from '../components/GradientButton';
import { formatDuration } from '../utils/helpers';

const { width, height } = Dimensions.get('window');

const VideoPlayerScreen = ({ route, navigation }) => {
  const { pose } = route.params;
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeout = useRef(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    return () => {
      if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    };
  }, []);

  const toggleControls = () => {
    if (showControls) {
      hideControls();
    } else {
      setShowControls(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
      autoHideControls();
    }
  };

  const hideControls = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setShowControls(false));
  };

  const autoHideControls = () => {
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    controlsTimeout.current = setTimeout(() => {
      if (status.isPlaying) hideControls();
    }, 3000);
  };

  const togglePlayPause = async () => {
    if (!videoRef.current) return;
    if (status.isPlaying) {
      await videoRef.current.pauseAsync();
    } else {
      await videoRef.current.playAsync();
      autoHideControls();
    }
  };

  const seekBy = async (seconds) => {
    if (!videoRef.current || !status.durationMillis) return;
    const newPosition = Math.max(0, Math.min(
      (status.positionMillis || 0) + seconds * 1000,
      status.durationMillis
    ));
    await videoRef.current.setPositionAsync(newPosition);
  };

  const progress = status.durationMillis
    ? (status.positionMillis || 0) / status.durationMillis
    : 0;

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <TouchableOpacity
        activeOpacity={1}
        onPress={toggleControls}
        style={styles.videoContainer}
      >
        <Video
          ref={videoRef}
          source={{ uri: pose.videoUrl }}
          style={styles.video}
          resizeMode={ResizeMode.CONTAIN}
          shouldPlay
          isLooping={false}
          onPlaybackStatusUpdate={(s) => {
            setStatus(s);
            if (s.isLoaded) setIsLoading(false);
          }}
          onLoad={() => setIsLoading(false)}
        />

        {/* Loading indicator */}
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading video...</Text>
          </View>
        )}

        {/* Controls overlay */}
        {showControls && (
          <Animated.View style={[styles.controlsOverlay, { opacity: fadeAnim }]}>
            {/* Top bar */}
            <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent']} style={styles.topGradient}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeBtn}>
                <Ionicons name="arrow-back" size={24} color="#FFF" />
              </TouchableOpacity>
              <View style={styles.topInfo}>
                <Text style={styles.videoTitle}>{pose.name}</Text>
                <Text style={styles.videoSubtitle}>{pose.sanskritName}</Text>
              </View>
              <View style={{ width: 40 }} />
            </LinearGradient>

            {/* Center controls */}
            <View style={styles.centerControls}>
              <TouchableOpacity onPress={() => seekBy(-10)} style={styles.seekBtn}>
                <Ionicons name="play-back" size={28} color="rgba(255,255,255,0.8)" />
                <Text style={styles.seekText}>10s</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={togglePlayPause} style={styles.playPauseBtn}>
                <LinearGradient colors={COLORS.gradientPrimary} style={styles.playPauseGradient}>
                  <Ionicons
                    name={status.isPlaying ? 'pause' : 'play'}
                    size={36}
                    color="#FFF"
                    style={status.isPlaying ? {} : { marginLeft: 4 }}
                  />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => seekBy(10)} style={styles.seekBtn}>
                <Ionicons name="play-forward" size={28} color="rgba(255,255,255,0.8)" />
                <Text style={styles.seekText}>10s</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom bar */}
            <LinearGradient colors={['transparent', 'rgba(0,0,0,0.8)']} style={styles.bottomGradient}>
              {/* Progress bar */}
              <View style={styles.progressContainer}>
                <Text style={styles.timeText}>
                  {formatDuration(Math.floor((status.positionMillis || 0) / 1000))}
                </Text>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                  <View style={[styles.progressDot, { left: `${progress * 100}%` }]} />
                </View>
                <Text style={styles.timeText}>
                  {formatDuration(Math.floor((status.durationMillis || 0) / 1000))}
                </Text>
              </View>

              {/* Start practice button */}
              <GradientButton
                title="Start AI Practice"
                onPress={() => navigation.replace('CameraSession', { pose })}
                size="medium"
                icon={<Ionicons name="camera" size={18} color="#FFF" />}
                style={styles.practiceBtn}
              />
            </LinearGradient>
          </Animated.View>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  video: {
    width,
    height,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
    marginTop: SPACING.sm,
  },
  controlsOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
  },
  topGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  topInfo: {
    flex: 1,
    alignItems: 'center',
  },
  videoTitle: {
    color: '#FFF',
    fontSize: FONT_SIZES.lg,
    ...FONTS.bold,
  },
  videoSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FONT_SIZES.sm,
    ...FONTS.regular,
  },
  centerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xxl,
  },
  seekBtn: {
    alignItems: 'center',
  },
  seekText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: FONT_SIZES.xs,
    ...FONTS.medium,
    marginTop: 2,
  },
  playPauseBtn: {},
  playPauseGradient: {
    width: 72, height: 72, borderRadius: 36,
    alignItems: 'center', justifyContent: 'center',
  },
  bottomGradient: {
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  timeText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: FONT_SIZES.xs,
    ...FONTS.medium,
    fontVariant: ['tabular-nums'],
    minWidth: 36,
  },
  progressBar: {
    flex: 1,
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressDot: {
    position: 'absolute',
    top: -4,
    width: 11,
    height: 11,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
    marginLeft: -5,
  },
  practiceBtn: {
    alignSelf: 'center',
  },
});

export default VideoPlayerScreen;
