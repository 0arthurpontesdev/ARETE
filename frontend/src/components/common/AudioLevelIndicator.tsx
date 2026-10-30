import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ZoomTheme } from '../../styles/theme';

interface AudioLevelIndicatorProps {
  level?: number;
  isMuted: boolean;
}

export const AudioLevelIndicator: React.FC<AudioLevelIndicatorProps> = ({ level = 0, isMuted }) => {
  if (isMuted) return null;
  const barHeight = Math.min(100, Math.max(10, Math.round(level * 100)));

  return (
    <View style={styles.container}>
      <View style={[styles.bar, { height: `${barHeight}%` }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 4,
    height: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    marginLeft: 4,
  },
  bar: {
    width: '100%',
    backgroundColor: ZoomTheme.colors.successGreen,
    borderRadius: 2,
  },
});
