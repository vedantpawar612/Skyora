// CameraSurface (native) - thin wrapper around expo-camera's CameraView.
// The web fork (CameraSurface.web.js) owns its own getUserMedia <video> so the
// pose engine can read frames; this native version keeps the existing behavior.
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { CameraView } from 'expo-camera';

const CameraSurface = ({ facing = 'front', onVideoReady, onError, children }) => {
  useEffect(() => {
    // No frame access on native (demo engine doesn't need the video element)
    onVideoReady?.(null, { width: 0, height: 0, aspect: 1 });
  }, []);

  return (
    <CameraView style={StyleSheet.absoluteFill} facing={facing}>
      <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
        {children}
      </View>
    </CameraView>
  );
};

export default CameraSurface;
