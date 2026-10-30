import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Circle, HardDrive, Cloud, Square, Pause, Play, X } from 'lucide-react-native';
import { ZoomTheme } from '../../styles/theme';
import { RecordingStatus } from '../../types';

interface RecordingMenuProps {
  status: RecordingStatus;
  isPaused: boolean;
  onStartLocalRecording: () => void;
  onStartCloudRecording: () => void;
  onPauseResumeRecording: () => void;
  onStopRecording: () => void;
  onClose: () => void;
}

export const RecordingMenu: React.FC<RecordingMenuProps> = ({
  status,
  isPaused,
  onStartLocalRecording,
  onStartCloudRecording,
  onPauseResumeRecording,
  onStopRecording,
  onClose,
}) => {
  const isRecording = status !== 'idle';

  return (
    <View style={styles.popover} accessibilityRole="menu" accessibilityLabel="Opções de gravação">
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Circle
            size={14}
            color={isRecording ? ZoomTheme.colors.dangerRed : ZoomTheme.colors.textSecondary}
            fill={isRecording ? ZoomTheme.colors.dangerRed : 'none'}
          />
          <Text style={styles.title}>
            {isRecording
              ? status === 'recording_cloud'
                ? 'Gravando na Nuvem'
                : 'Gravando Localmente'
              : 'Gravar Reunião'}
          </Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fechar gravação">
          <X size={14} color={ZoomTheme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {!isRecording ? (
        <View style={styles.menuItems}>
          <TouchableOpacity
            style={styles.optionBtn}
            onPress={() => {
              onStartLocalRecording();
              onClose();
            }}
            activeOpacity={0.7}
          >
            <HardDrive size={18} color={ZoomTheme.colors.textPrimary} />
            <View style={styles.optionTextCol}>
              <Text style={styles.optionTitle}>Gravar neste computador</Text>
              <Text style={styles.optionSubtitle}>Salva o vídeo em MP4/WebM no seu disco</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionBtn}
            onPress={() => {
              onStartCloudRecording();
              onClose();
            }}
            activeOpacity={0.7}
          >
            <Cloud size={18} color={ZoomTheme.colors.zoomBlue} />
            <View style={styles.optionTextCol}>
              <Text style={styles.optionTitle}>Gravar na nuvem</Text>
              <Text style={styles.optionSubtitle}>Disponível para download após a reunião</Text>
            </View>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.activeRecordingSection}>
          <View style={styles.statusIndicatorRow}>
            <View style={styles.pulsingDot} />
            <Text style={styles.activeStatusText}>
              {isPaused ? 'Gravação Pausada' : 'Gravação em Andamento...'}
            </Text>
          </View>

          <View style={styles.recordingControlsRow}>
            <TouchableOpacity
              style={styles.controlActionBtn}
              onPress={onPauseResumeRecording}
            >
              {isPaused ? <Play size={16} color="#FFF" /> : <Pause size={16} color="#FFF" />}
              <Text style={styles.controlActionText}>{isPaused ? 'Continuar' : 'Pausar'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlActionBtn, styles.stopBtn]}
              onPress={() => {
                onStopRecording();
                onClose();
              }}
            >
              <Square size={16} color="#FFF" />
              <Text style={styles.controlActionText}>Parar</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  popover: {
    position: 'absolute',
    bottom: ZoomTheme.layout.toolbarHeight + 10,
    backgroundColor: ZoomTheme.colors.panelBg,
    borderRadius: ZoomTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    width: 290,
    padding: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: ZoomTheme.colors.borderSubtle,
    marginBottom: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: ZoomTheme.typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: 2,
  },
  menuItems: {
    gap: 4,
  },
  optionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: ZoomTheme.borderRadius.sm,
    gap: 12,
  },
  optionTextCol: {
    flex: 1,
  },
  optionTitle: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: ZoomTheme.typography.bodySmall,
    fontWeight: '600',
  },
  optionSubtitle: {
    color: ZoomTheme.colors.textMuted,
    fontSize: ZoomTheme.typography.caption,
    marginTop: 2,
  },
  activeRecordingSection: {
    paddingVertical: 8,
    gap: 12,
  },
  statusIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(224, 40, 40, 0.1)',
    padding: 8,
    borderRadius: 6,
  },
  pulsingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: ZoomTheme.colors.dangerRed,
  },
  activeStatusText: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  recordingControlsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  controlActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 8,
    borderRadius: ZoomTheme.borderRadius.sm,
  },
  stopBtn: {
    backgroundColor: ZoomTheme.colors.dangerRed,
  },
  controlActionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
