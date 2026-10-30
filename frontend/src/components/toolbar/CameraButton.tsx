import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Video, VideoOff, ChevronUp } from 'lucide-react-native';
import { ZoomTheme } from '../../styles/theme';

interface CameraButtonProps {
  isVideoOff: boolean;
  onToggle: () => void;
  onOpenDevices?: () => void;
  isMobile?: boolean;
}

export const CameraButton: React.FC<CameraButtonProps> = ({
  isVideoOff,
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
        isVideoOff && styles.containerVideoOff,
      ]}
      // @ts-ignore
      title={isVideoOff ? 'Iniciar vídeo (Alt+V)' : 'Interromper vídeo (Alt+V)'}
    >
      <TouchableOpacity
        style={[styles.mainButton, isMobile && styles.mainButtonMobile]}
        onPress={onToggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={isVideoOff ? 'Iniciar vídeo' : 'Interromper vídeo'}
        // @ts-ignore
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <View style={styles.iconWrapper}>
          {isVideoOff ? (
            <VideoOff size={20} color={ZoomTheme.colors.dangerRed} />
          ) : (
            <Video size={20} color={ZoomTheme.colors.textPrimary} />
          )}
        </View>
        {!isMobile && (
          <Text style={[styles.label, isVideoOff && styles.labelOff]}>
            {isVideoOff ? 'Iniciar vídeo' : 'Interromper'}
          </Text>
        )}
      </TouchableOpacity>

      {onOpenDevices && !isMobile && (
        <TouchableOpacity
          style={[styles.arrowButton, isArrowHovered && styles.arrowButtonHover]}
          onPress={onOpenDevices}
          activeOpacity={0.7}
          accessibilityLabel="Opções de câmera"
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
  containerVideoOff: {
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
  labelOff: {
    color: ZoomTheme.colors.dangerRed,
    fontWeight: '600',
  },
});
