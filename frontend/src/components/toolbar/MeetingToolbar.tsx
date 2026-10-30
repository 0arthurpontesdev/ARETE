import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import {
  Users,
  MessageSquare,
  Settings,
  LogOut,
  PhoneOff,
  Shield,
  Smile,
  BarChart2,
  Circle,
  LayoutGrid,
  Edit3,
  Sparkles,
} from 'lucide-react-native';
import { ZoomTheme } from '../../styles/theme';
import { MicrophoneButton } from './MicrophoneButton';
import { CameraButton } from './CameraButton';
import { ScreenShareButton } from './ScreenShareButton';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { ActivePanel, RecordingStatus } from '../../types';

interface MeetingToolbarProps {
  isMuted: boolean;
  isVideoOff: boolean;
  isSharing: boolean;
  participantCount: number;
  unreadChatCount: number;
  isHost: boolean;
  activePanel: ActivePanel;
  recordingStatus?: RecordingStatus;
  isAnnotationActive?: boolean;
  onToggleMic: () => void;
  onToggleCam: () => void;
  onToggleShare: () => void;
  onToggleParticipants: () => void;
  onToggleChat: () => void;
  onToggleSettings: () => void;
  onToggleSecurity?: () => void;
  onToggleReactions?: () => void;
  onTogglePolls?: () => void;
  onToggleRecording?: () => void;
  onToggleBreakout?: () => void;
  onToggleAnnotations?: () => void;
  onToggleCopilot?: () => void;
  onOpenAudioDevices: () => void;
  onOpenVideoDevices: () => void;
  onLeaveMeeting: () => void;
  onEndMeetingForEveryone?: () => void;
}

export const MeetingToolbar: React.FC<MeetingToolbarProps> = ({
  isMuted,
  isVideoOff,
  isSharing,
  participantCount,
  unreadChatCount,
  isHost,
  activePanel,
  recordingStatus = 'idle',
  isAnnotationActive = false,
  onToggleMic,
  onToggleCam,
  onToggleShare,
  onToggleParticipants,
  onToggleChat,
  onToggleSettings,
  onToggleSecurity,
  onToggleReactions,
  onTogglePolls,
  onToggleRecording,
  onToggleBreakout,
  onToggleAnnotations,
  onToggleCopilot,
  onOpenAudioDevices,
  onOpenVideoDevices,
  onLeaveMeeting,
  onEndMeetingForEveryone,
}) => {
  const { isMobile } = useResponsiveLayout();
  const [hoveredButton, setHoveredButton] = useState<string | null>(null);

  const isRecording = recordingStatus !== 'idle';

  return (
    <View
      style={[styles.toolbarContainer, isMobile && styles.toolbarContainerMobile]}
      accessibilityRole="toolbar"
      accessibilityLabel="Controles da Reunião"
    >
      {/* Grupo Esquerdo: Mídia (Áudio e Vídeo) */}
      <View style={styles.leftGroup}>
        <MicrophoneButton
          isMuted={isMuted}
          onToggle={onToggleMic}
          onOpenDevices={onOpenAudioDevices}
          isMobile={isMobile}
        />
        <CameraButton
          isVideoOff={isVideoOff}
          onToggle={onToggleCam}
          onOpenDevices={onOpenVideoDevices}
          isMobile={isMobile}
        />
      </View>

      {!isMobile && <View style={styles.groupDivider} />}

      {/* Grupo Central: Interações & Colaboração */}
      <View style={[styles.centerGroup, isMobile && styles.centerGroupMobile]}>
        {/* Segurança (Host) */}
        {isHost && onToggleSecurity && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              isMobile && styles.actionButtonMobile,
              activePanel === 'security' && styles.activeActionButton,
              hoveredButton === 'security' && styles.hoverActionButton,
            ]}
            onPress={onToggleSecurity}
            activeOpacity={0.7}
            accessibilityLabel="Segurança da reunião"
            // @ts-ignore
            title="Segurança"
            onMouseEnter={() => setHoveredButton('security')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <Shield
              size={20}
              color={activePanel === 'security' ? ZoomTheme.colors.zoomBlue : ZoomTheme.colors.textPrimary}
            />
            {!isMobile && <Text style={styles.actionLabel}>Segurança</Text>}
          </TouchableOpacity>
        )}

        {/* Participantes */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            isMobile && styles.actionButtonMobile,
            activePanel === 'participants' && styles.activeActionButton,
            hoveredButton === 'participants' && styles.hoverActionButton,
          ]}
          onPress={onToggleParticipants}
          activeOpacity={0.7}
          accessibilityLabel={`Participantes, ${participantCount} pessoas`}
          // @ts-ignore
          title="Participantes (Alt+U)"
          onMouseEnter={() => setHoveredButton('participants')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <View style={styles.iconWithBadge}>
            <Users
              size={20}
              color={
                activePanel === 'participants'
                  ? ZoomTheme.colors.zoomBlue
                  : ZoomTheme.colors.textPrimary
              }
            />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{participantCount}</Text>
            </View>
          </View>
          {!isMobile && <Text style={styles.actionLabel}>Participantes</Text>}
        </TouchableOpacity>

        {/* Bate-papo */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            isMobile && styles.actionButtonMobile,
            activePanel === 'chat' && styles.activeActionButton,
            hoveredButton === 'chat' && styles.hoverActionButton,
          ]}
          onPress={onToggleChat}
          activeOpacity={0.7}
          accessibilityLabel="Bate-papo da reunião"
          // @ts-ignore
          title="Bate-papo (Alt+H)"
          onMouseEnter={() => setHoveredButton('chat')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <View style={styles.iconWithBadge}>
            <MessageSquare
              size={20}
              color={
                activePanel === 'chat'
                  ? ZoomTheme.colors.zoomBlue
                  : ZoomTheme.colors.textPrimary
              }
            />
            {unreadChatCount > 0 && (
              <View style={[styles.badge, styles.unreadBadge]}>
                <Text style={styles.badgeText}>{unreadChatCount}</Text>
              </View>
            )}
          </View>
          {!isMobile && <Text style={styles.actionLabel}>Bate-papo</Text>}
        </TouchableOpacity>

        {/* Compartilhar Tela */}
        <ScreenShareButton isSharing={isSharing} onToggle={onToggleShare} isMobile={isMobile} />

        {/* Anotações (quando compartilhando ou assistindo) */}
        {isSharing && onToggleAnnotations && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              isMobile && styles.actionButtonMobile,
              isAnnotationActive && styles.activeActionButton,
              hoveredButton === 'annotations' && styles.hoverActionButton,
            ]}
            onPress={onToggleAnnotations}
            activeOpacity={0.7}
            accessibilityLabel="Anotações na tela compartilhada"
            // @ts-ignore
            title="Anotar na tela"
            onMouseEnter={() => setHoveredButton('annotations')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <Edit3
              size={20}
              color={isAnnotationActive ? ZoomTheme.colors.successGreen : ZoomTheme.colors.textPrimary}
            />
            {!isMobile && <Text style={styles.actionLabel}>Anotar</Text>}
          </TouchableOpacity>
        )}

        {/* Gravar (Record) */}
        {onToggleRecording && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              isMobile && styles.actionButtonMobile,
              isRecording && styles.recordingActiveBtn,
              hoveredButton === 'record' && styles.hoverActionButton,
            ]}
            onPress={onToggleRecording}
            activeOpacity={0.7}
            accessibilityLabel="Opções de gravação"
            // @ts-ignore
            title="Gravar reunião"
            onMouseEnter={() => setHoveredButton('record')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <Circle
              size={18}
              color={isRecording ? ZoomTheme.colors.dangerRed : ZoomTheme.colors.textPrimary}
              fill={isRecording ? ZoomTheme.colors.dangerRed : 'none'}
            />
            {!isMobile && (
              <Text style={[styles.actionLabel, isRecording && styles.recordingActiveText]}>
                {isRecording ? 'Gravando' : 'Gravar'}
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Reações (Levantar mão e emojis) */}
        {onToggleReactions && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              isMobile && styles.actionButtonMobile,
              hoveredButton === 'reactions' && styles.hoverActionButton,
            ]}
            onPress={onToggleReactions}
            activeOpacity={0.7}
            accessibilityLabel="Reações e emojis"
            // @ts-ignore
            title="Reações"
            onMouseEnter={() => setHoveredButton('reactions')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <Smile size={20} color={ZoomTheme.colors.textPrimary} />
            {!isMobile && <Text style={styles.actionLabel}>Reações</Text>}
          </TouchableOpacity>
        )}

        {/* Enquetes (Polls) */}
        {onTogglePolls && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              isMobile && styles.actionButtonMobile,
              activePanel === 'polls' && styles.activeActionButton,
              hoveredButton === 'polls' && styles.hoverActionButton,
            ]}
            onPress={onTogglePolls}
            activeOpacity={0.7}
            accessibilityLabel="Enquetes ao vivo"
            // @ts-ignore
            title="Enquetes"
            onMouseEnter={() => setHoveredButton('polls')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <BarChart2
              size={20}
              color={activePanel === 'polls' ? ZoomTheme.colors.zoomBlue : ZoomTheme.colors.textPrimary}
            />
            {!isMobile && <Text style={styles.actionLabel}>Enquetes</Text>}
          </TouchableOpacity>
        )}

        {/* Salas Simultâneas (Host) */}
        {isHost && onToggleBreakout && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              isMobile && styles.actionButtonMobile,
              activePanel === 'breakout' && styles.activeActionButton,
              hoveredButton === 'breakout' && styles.hoverActionButton,
            ]}
            onPress={onToggleBreakout}
            activeOpacity={0.7}
            accessibilityLabel="Salas Simultâneas"
            // @ts-ignore
            title="Salas Simultâneas"
            onMouseEnter={() => setHoveredButton('breakout')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <LayoutGrid
              size={20}
              color={activePanel === 'breakout' ? ZoomTheme.colors.zoomBlue : ZoomTheme.colors.textPrimary}
            />
            {!isMobile && <Text style={styles.actionLabel}>Salas</Text>}
          </TouchableOpacity>
        )}

        {/* IA Copilot (Resumo & Ata) */}
        {onToggleCopilot && (
          <TouchableOpacity
            style={[
              styles.actionButton,
              styles.copilotActionButton,
              isMobile && styles.actionButtonMobile,
              activePanel === 'copilot' && styles.activeActionButton,
              hoveredButton === 'copilot' && styles.hoverActionButton,
            ]}
            onPress={onToggleCopilot}
            activeOpacity={0.7}
            accessibilityLabel="IA Copilot (Resumo Automático e Ata)"
            // @ts-ignore
            title="IA Copilot"
            onMouseEnter={() => setHoveredButton('copilot')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <View style={styles.iconWithBadge}>
              <Sparkles
                size={20}
                color={
                  activePanel === 'copilot'
                    ? '#A78BFA'
                    : '#C4B5FD'
                }
              />
              <View style={[styles.badge, styles.aiBadge]}>
                <Text style={styles.aiBadgeText}>IA</Text>
              </View>
            </View>
            {!isMobile && (
              <Text
                style={[
                  styles.actionLabel,
                  activePanel === 'copilot' && { color: '#A78BFA', fontWeight: '700' },
                ]}
              >
                Copilot
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Configurações */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            isMobile && styles.actionButtonMobile,
            activePanel === 'settings' && styles.activeActionButton,
            hoveredButton === 'settings' && styles.hoverActionButton,
          ]}
          onPress={onToggleSettings}
          activeOpacity={0.7}
          accessibilityLabel="Configurações da reunião"
          // @ts-ignore
          title="Configurações da reunião"
          onMouseEnter={() => setHoveredButton('settings')}
          onMouseLeave={() => setHoveredButton(null)}
        >
          <Settings
            size={20}
            color={
              activePanel === 'settings'
                ? ZoomTheme.colors.zoomBlue
                : ZoomTheme.colors.textPrimary
            }
          />
          {!isMobile && <Text style={styles.actionLabel}>Ajustes</Text>}
        </TouchableOpacity>
      </View>

      {!isMobile && <View style={styles.groupDivider} />}

      {/* Grupo Direito: Sair / Encerrar */}
      <View style={styles.rightGroup}>
        {isHost && onEndMeetingForEveryone ? (
          <TouchableOpacity
            style={[
              styles.endMeetingButton,
              isMobile && styles.endMeetingButtonMobile,
              hoveredButton === 'end' && styles.endMeetingButtonHover,
            ]}
            onPress={onEndMeetingForEveryone}
            activeOpacity={0.8}
            accessibilityLabel="Encerrar reunião para todos"
            // @ts-ignore
            title="Encerrar reunião para todos"
            onMouseEnter={() => setHoveredButton('end')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <PhoneOff size={16} color="#FFFFFF" />
            {!isMobile && <Text style={styles.endMeetingText}>Encerrar</Text>}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.leaveMeetingButton,
              isMobile && styles.leaveMeetingButtonMobile,
              hoveredButton === 'leave' && styles.leaveMeetingButtonHover,
            ]}
            onPress={onLeaveMeeting}
            activeOpacity={0.8}
            accessibilityLabel="Sair da reunião"
            // @ts-ignore
            title="Sair da reunião"
            onMouseEnter={() => setHoveredButton('leave')}
            onMouseLeave={() => setHoveredButton(null)}
          >
            <LogOut size={16} color="#FFFFFF" />
            {!isMobile && <Text style={styles.endMeetingText}>Sair</Text>}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  toolbarContainer: {
    height: ZoomTheme.layout.toolbarHeight,
    backgroundColor: ZoomTheme.colors.dockBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ZoomTheme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: ZoomTheme.colors.borderSubtle,
    zIndex: 10,
  },
  toolbarContainerMobile: {
    paddingHorizontal: 8,
    height: ZoomTheme.layout.toolbarHeightMobile,
  },
  leftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  groupDivider: {
    width: 1,
    height: 32,
    backgroundColor: ZoomTheme.colors.borderSubtle,
    marginHorizontal: 6,
  },
  centerGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  centerGroupMobile: {
    gap: 2,
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: ZoomTheme.borderRadius.md,
    height: 54,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  actionButtonMobile: {
    paddingHorizontal: 4,
    height: 48,
  },
  hoverActionButton: {
    backgroundColor: ZoomTheme.colors.hoverBg,
    borderColor: ZoomTheme.colors.borderSubtle,
  },
  activeActionButton: {
    backgroundColor: 'rgba(14, 114, 237, 0.15)',
    borderColor: 'rgba(14, 114, 237, 0.3)',
  },
  recordingActiveBtn: {
    backgroundColor: 'rgba(224, 40, 40, 0.15)',
    borderColor: 'rgba(224, 40, 40, 0.3)',
  },
  recordingActiveText: {
    color: ZoomTheme.colors.dangerRed,
    fontWeight: '700',
  },
  actionLabel: {
    fontSize: ZoomTheme.typography.caption,
    color: ZoomTheme.colors.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  iconWithBadge: {
    position: 'relative',
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
    minWidth: 16,
    alignItems: 'center',
  },
  unreadBadge: {
    backgroundColor: ZoomTheme.colors.dangerRed,
  },
  aiBadge: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 3,
    minWidth: 14,
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '800',
  },
  copilotActionButton: {
    // subtle violet tint on hover/active
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  endMeetingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ZoomTheme.colors.dangerRed,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: ZoomTheme.borderRadius.sm,
    shadowColor: ZoomTheme.colors.dangerRed,
    shadowOpacity: 0.35,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  endMeetingButtonHover: {
    backgroundColor: ZoomTheme.colors.dangerRedHover,
    shadowOpacity: 0.55,
  },
  endMeetingButtonMobile: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  leaveMeetingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: ZoomTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  leaveMeetingButtonHover: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  leaveMeetingButtonMobile: {
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  endMeetingText: {
    color: '#FFFFFF',
    fontSize: ZoomTheme.typography.button,
    fontWeight: '600',
  },
});
