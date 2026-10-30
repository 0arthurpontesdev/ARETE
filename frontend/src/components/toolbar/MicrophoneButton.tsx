import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Mic, MicOff, ChevronUp } from 'lucide-react-native';
import { ZoomTheme } from '../../styles/theme';

interface MicrophoneButtonProps {
  isMuted: boolean;
  onToggle: () => void;
  onOpenDevices?: () => void;
  isMobile?: boolean;
}

export const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({
  isMuted,
  onToggle,
  onOpenDevices,
  isMobile = false,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isArrowHovered, setIsArrowHovered] = useState(false);

  return (
    <View
      style={[
        styles.container,
        isHovered && styles.containerHover,
        isMuted && styles.containerMuted,
      ]}
      // @ts-ignore
      title={isMuted ? 'Ativar microfone (Alt+A)' : 'Desativar microfone (Alt+A)'}
    >
      <TouchableOpacity
        style={[styles.mainButton, isMobile && styles.mainButtonMobile]}
        onPress={onToggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={isMuted ? 'Ativar microfone' : 'Desativar microfone'}
        // @ts-ignore
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <View style={styles.iconWrapper}>
          {isMuted ? (
            <MicOff size={20} color={ZoomTheme.colors.dangerRed} />
          ) : (
            <Mic size={20} color={ZoomTheme.colors.textPrimary} />
          )}
        </View>
        {!isMobile && (
          <Text style={[styles.label, isMuted && styles.labelMuted]}>
            {isMuted ? 'Ativar som' : 'Desativar som'}
          </Text>
        )}
      </TouchableOpacity>

      {onOpenDevices && !isMobile && (
        <TouchableOpacity
          style={[styles.arrowButton, isArrowHovered && styles.arrowButtonHover]}
          onPress={onOpenDevices}
          activeOpacity={0.7}
          accessibilityLabel="Opções de microfone"
          // @ts-ignore
          onMouseEnter={() => setIsArrowHovered(true)}
          onMouseLeave={() => setIsArrowHovered(false)}
        >
          <ChevronUp size={14} color={ZoomTheme.colors.textSecondary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: ZoomTheme.borderRadius.md,
    paddingHorizontal: 2,
    height: 54,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  containerHover: {
    backgroundColor: ZoomTheme.colors.hoverBg,
    borderColor: ZoomTheme.colors.borderSubtle,
  },
  containerMuted: {
    backgroundColor: 'rgba(224, 40, 40, 0.08)',
  },
  mainButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    height: '100%',
  },
  mainButtonMobile: {
    paddingHorizontal: 4,
  },
  iconWrapper: {
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowButton: {
    padding: 6,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginRight: 2,
  },
  arrowButtonHover: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  label: {
    fontSize: ZoomTheme.typography.caption,
    color: ZoomTheme.colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  labelMuted: {
    color: ZoomTheme.colors.dangerRed,
    fontWeight: '600',
  },
});
