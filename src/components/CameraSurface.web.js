// CameraSurface (web) - owns a getUserMedia-backed <video> element and exposes
// it via onVideoReady so the MediaPipe pose engine can read frames from it.
// expo-camera's web CameraView hides its video element, so we manage our own.
import React, { useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

const VIDEO_STYLE = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  // Mirror the preview like a selfie camera; overlays mirror in their own projection
  transform: 'scaleX(-1)',
};

const CameraSurface = ({ facing = 'front', onVideoReady, onError, children }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const callbacksRef = useRef({ onVideoReady, onError });
  callbacksRef.current = { onVideoReady, onError };

  useEffect(() => {
    let cancelled = false;
    const video = videoRef.current;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: facing === 'front' ? 'user' : 'environment',
          },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play().catch(() => {});
          callbacksRef.current.onVideoReady?.(video, {
            width: video.videoWidth,
            height: video.videoHeight,
            aspect: video.videoWidth / (video.videoHeight || 1),
          });
        };
      } catch (err) {
        if (!cancelled) callbacksRef.current.onError?.(err?.name || 'CameraError');
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (video) video.srcObject = null;
    };
  }, [facing]);

  return (
    <View style={StyleSheet.absoluteFill}>
      <video ref={videoRef} autoPlay playsInline muted style={VIDEO_STYLE} />
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {children}
      </View>
    </View>
  );
};

export default CameraSurface;
