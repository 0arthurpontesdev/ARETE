import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Track } from 'livekit-client';
import { ZoomTheme } from '../../styles/theme';

interface ScreenShareViewProps {
  track: Track;
}

export const ScreenShareView: React.FC<ScreenShareViewProps> = ({ track }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current) {
      track.attach(videoRef.current);
    }
    return () => {
      if (Platform.OS === 'web' && videoRef.current) {
        track.detach(videoRef.current);
      }
    };
  }, [track]);

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' && (
        <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <video
            ref={videoRef as any}
            autoPlay
            playsInline
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              backgroundColor: '#000000',
            }}
          />
        </div>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: ZoomTheme.layout.tileRadius,
    overflow: 'hidden',
  },
});
