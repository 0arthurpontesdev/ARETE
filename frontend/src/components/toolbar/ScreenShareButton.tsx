import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Share, Square } from 'lucide-react-native';
import { ZoomTheme } from '../../styles/theme';

interface ScreenShareButtonProps {
  isSharing: boolean;
  onToggle: () => void;
  isMobile?: boolean;
}

export const ScreenShareButton: React.FC<ScreenShareButtonProps> = ({
  isSharing,
  onToggle,
  isMobile = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isSharing ? styles.sharingContainer : isHovered && styles.containerHover,
        isMobile && styles.containerMobile,
      ]}
      onPress={onToggle}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={isSharing ? 'Parar compartilhamento' : 'Compartilhar tela'}
      // @ts-ignore
      title={isSharing ? 'Parar compartilhamento de tela (Alt+S)' : 'Compartilhar tela (Alt+S)'}
      // @ts-ignore
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <View style={styles.iconWrapper}>
        {isSharing ? (
          <Square size={20} color={ZoomTheme.colors.dangerRed} />
        ) : (
          <Share size={20} color={ZoomTheme.colors.successGreen} />
        )}
      </View>
      {!isMobile && (
        <Text style={[styles.label, !isSharing && styles.labelHighlight]}>
          {isSharing ? 'Parar' : 'Compartilhar'}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: ZoomTheme.borderRadius.md,
    height: 54,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  containerMobile: {
    paddingHorizontal: 6,
    height: 48,
  },
  containerHover: {
    backgroundColor: ZoomTheme.colors.hoverBg,
    borderColor: ZoomTheme.colors.borderSubtle,
  },
  sharingContainer: {
    backgroundColor: ZoomTheme.colors.dangerRedBg,
    borderColor: 'rgba(224, 40, 40, 0.3)',
  },
  iconWrapper: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    fontSize: ZoomTheme.typography.caption,
    color: ZoomTheme.colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  labelHighlight: {
    color: ZoomTheme.colors.successGreen,
    fontWeight: '600',
  },
});
