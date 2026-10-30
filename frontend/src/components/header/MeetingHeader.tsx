import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  ShieldCheck,
  Grid,
  User,
  Maximize2,
  Copy,
  Check,
  Circle,
  LayoutDashboard,
} from 'lucide-react-native';
import { ZoomTheme } from '../../styles/theme';
import { ConnectionStatus } from '../common/ConnectionStatus';
import { RecordingStatus } from '../../types';

interface MeetingHeaderProps {
  roomName: string;
  isGalleryView: boolean;
  isRecording?: boolean;
  recordingStatus?: RecordingStatus;
  recordingDuration?: number;
  isRecordingPaused?: boolean;
  activeFlowState?: 'gallery' | 'share_modal' | 'presenting';
  onChangeFlowState?: (newState: 'gallery' | 'share_modal' | 'presenting') => void;
  onToggleView: () => void;
  onToggleFullscreen?: () => void;
  onOpenDashboard?: () => void;
  connectionQuality?: 'excellent' | 'good' | 'poor' | 'unknown';
}

export const MeetingHeader: React.FC<MeetingHeaderProps> = ({
  roomName,
  isGalleryView,
  isRecording = false,
  recordingStatus = 'idle',
  recordingDuration = 0,
  isRecordingPaused = false,
  activeFlowState,
  onChangeFlowState,
  onToggleView,
  onToggleFullscreen,
  onOpenDashboard,
  connectionQuality = 'excellent',
}) => {
  const [seconds, setSeconds] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyRoomCode = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(roomName);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <View style={styles.headerContainer}>
      {/* 1. Topo Esquerdo: Título da Reunião e Indicador Gravando */}
      <View style={styles.leftGroup}>
        <View style={styles.securityBadge}>
          <ShieldCheck size={16} color="#22C55E" />
        </View>

        <TouchableOpacity style={styles.roomInfoBtn} onPress={copyRoomCode} activeOpacity={0.7}>
          <Text style={styles.roomTitle}>Sala: {roomName || 'Zoom Reunião de Alinhamento Semanal'}</Text>
        </TouchableOpacity>

        {/* Indicador de Status "Gravando" com ponto vermelho pulsante (Dinâmico) */}
        {(isRecording || recordingStatus === 'recording_local' || recordingStatus === 'recording_cloud') && (
          <View style={[styles.recBadge, isRecordingPaused && styles.recBadgePaused]}>
            <View style={[styles.pulsingRedDot, isRecordingPaused && styles.pausedDot]} />
            <Text style={[styles.recText, isRecordingPaused && styles.pausedRecText]}>
              {isRecordingPaused ? 'Pausado' : 'REC'} {recordingDuration ? formatTimer(recordingDuration) : ''}
            </Text>
          </View>
        )}
      </View>

      {/* 2. Topo Direito: Seletor de Visualização e Botões */}
      <View style={styles.rightGroup}>
        {onOpenDashboard && (
          <TouchableOpacity
            style={styles.dashboardBtn}
            onPress={onOpenDashboard}
            accessibilityLabel="Abrir Painel Administrativo"
          >
            <LayoutDashboard size={14} color="#38BDF8" />
            <Text style={styles.dashboardBtnText}>Painel Admin</Text>
          </TouchableOpacity>
        )}

        {/* Botão de Alternar Visualização no estilo Zoom */}
        <TouchableOpacity
          style={styles.viewToggleBtn}
          onPress={onToggleView}
          accessibilityLabel="Alternar modo de exibição"
        >
          <Grid size={15} color={ZoomTheme.colors.textPrimary} />
          <Text style={styles.viewToggleText}>Visualizar {isGalleryView ? '• Orador' : '• Galeria'}</Text>
        </TouchableOpacity>

        {onToggleFullscreen && (
          <TouchableOpacity
            style={styles.fullscreenBtn}
            onPress={onToggleFullscreen}
            accessibilityLabel="Tela cheia"
          >
            <Maximize2 size={15} color={ZoomTheme.colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    height: ZoomTheme.layout.headerHeight,
    backgroundColor: '#1A1D21',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ZoomTheme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 1100,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  securityBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomInfoBtn: {
    paddingVertical: 4,
  },
  roomTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(224, 40, 40, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(224, 40, 40, 0.3)',
    marginLeft: 4,
  },
  recBadgePaused: {
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  pulsingRedDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#EF4444',
  },
  pausedDot: {
    backgroundColor: '#F59E0B',
  },
  recText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  pausedRecText: {
    color: '#F59E0B',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.25)',
  },
  dashboardBtnText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
  },
  viewToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  viewToggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  fullscreenBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});
