import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { ZoomTheme } from '../../styles/theme';

interface ConnectionStatusProps {
  quality?: 'excellent' | 'good' | 'poor' | 'unknown';
  showLabel?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  quality = 'excellent',
  showLabel = false,
}) => {
  const getColor = () => {
    switch (quality) {
      case 'excellent':
        return ZoomTheme.colors.successGreen;
      case 'good':
        return ZoomTheme.colors.warningYellow;
      case 'poor':
        return ZoomTheme.colors.dangerRed;
      default:
        return ZoomTheme.colors.textMuted;
    }
  };

  const getBars = () => {
    switch (quality) {
      case 'excellent':
        return 4;
      case 'good':
        return 3;
      case 'poor':
        return 1;
      default:
        return 2;
    }
  };

  const activeBars = getBars();

  return (
    <View style={styles.container}>
      <View style={styles.barsContainer}>
        {[1, 2, 3, 4].map((bar) => {
          const isActive = bar <= activeBars;
          return (
            <View
              key={bar}
              style={[
                styles.bar,
                {
                  height: 4 + bar * 2.5,
                  backgroundColor: isActive ? getColor() : 'rgba(255, 255, 255, 0.2)',
                },
              ]}
            />
          );
        })}
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: getColor() }]}>
          {quality === 'excellent' ? 'Excelente' : quality === 'good' ? 'Boa' : 'Instável'}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 16,
    gap: 2,
  },
  bar: {
    width: 3,
    borderRadius: 1,
  },
  label: {
    fontSize: ZoomTheme.typography.caption,
    fontWeight: '500',
    marginLeft: 4,
  },
});
