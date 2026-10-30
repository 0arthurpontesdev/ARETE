import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  MoreHorizontal,
  Hand,
  ShieldCheck,
  UserX,
  UserCheck,
  Edit2,
} from 'lucide-react-native';
import { ParticipantInfo } from '../../types';
import { ZoomTheme } from '../../styles/theme';

interface ParticipantItemProps {
  participant: ParticipantInfo;
  isHostUser?: boolean;
  onToggleMuteParticipant?: (identity: string) => void;
  onToggleCoHost?: (identity: string) => void;
  onRenameParticipant?: (identity: string, newName: string) => void;
  onSendToWaitingRoom?: (identity: string) => void;
  onRemoveParticipant?: (identity: string) => void;
}

function getAvatarColor(name: string): string {
  const colors = [
    '#0E72ED',
    '#8E44AD',
    '#27AE60',
    '#D35400',
    '#16A085',
    '#2C3E50',
    '#E67E22',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export const ParticipantItem = React.memo<ParticipantItemProps>(({
  participant,
  isHostUser = false,
  onToggleMuteParticipant,
  onToggleCoHost,
  onRenameParticipant,
  onSendToWaitingRoom,
  onRemoveParticipant,
}) => {
  const [showMenu, setShowMenu] = useState(false);

  const initials = participant.name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  const avatarBg = getAvatarColor(participant.name);

  return (
    <View style={styles.wrapper}>
      <View style={styles.itemContainer}>
        <View style={styles.leftContent}>
          <View style={[styles.avatar, { backgroundColor: avatarBg }]}>
            <Text style={styles.avatarText}>{initials || 'U'}</Text>
          </View>
          <View style={styles.nameContainer}>
            <Text style={styles.nameText} numberOfLines={1}>
              {participant.name}
              {participant.isLocal ? ' (Você)' : ''}
            </Text>
            {participant.isHost && <Text style={styles.hostBadge}>Anfitrião</Text>}
            {participant.isCoHost && <Text style={styles.coHostBadge}>Co-anfitrião</Text>}
            {participant.isHandRaised && (
              <View style={styles.handBadge}>
                <Hand size={12} color="#000000" />
              </View>
            )}
          </View>
        </View>

        <View style={styles.rightContent}>
          <TouchableOpacity
            style={styles.mediaIconBtn}
            onPress={() => onToggleMuteParticipant && onToggleMuteParticipant(participant.identity)}
            disabled={!isHostUser && !participant.isLocal}
          >
            {participant.isAudioEnabled ? (
              <Mic size={16} color={ZoomTheme.colors.textPrimary} />
            ) : (
              <MicOff size={16} color={ZoomTheme.colors.dangerRed} />
            )}
          </TouchableOpacity>

          <View style={styles.mediaIconWrapper}>
            {participant.isVideoEnabled ? (
              <Video size={16} color={ZoomTheme.colors.textPrimary} />
            ) : (
              <VideoOff size={16} color={ZoomTheme.colors.dangerRed} />
            )}
          </View>

          {isHostUser && !participant.isLocal && (
            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => setShowMenu(!showMenu)}
              accessibilityLabel="Mais opções do participante"
            >
              <MoreHorizontal size={16} color={ZoomTheme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Host Action Popover */}
      {showMenu && (
        <View style={styles.contextMenu}>
          <TouchableOpacity
            style={styles.contextMenuItem}
            onPress={() => {
              if (onToggleCoHost) onToggleCoHost(participant.identity);
              setShowMenu(false);
            }}
          >
            <ShieldCheck size={14} color={ZoomTheme.colors.zoomBlue} />
            <Text style={styles.contextMenuText}>
              {participant.isCoHost ? 'Remover permissão de Co-anfitrião' : 'Tornar Co-anfitrião'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contextMenuItem}
            onPress={() => {
              const newName = prompt('Novo nome para o participante:', participant.name);
              if (newName && onRenameParticipant) {
                onRenameParticipant(participant.identity, newName.trim());
              }
              setShowMenu(false);
            }}
          >
            <Edit2 size={14} color={ZoomTheme.colors.textSecondary} />
            <Text style={styles.contextMenuText}>Renomear participante</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contextMenuItem}
            onPress={() => {
              if (onSendToWaitingRoom) onSendToWaitingRoom(participant.identity);
              setShowMenu(false);
            }}
          >
            <UserCheck size={14} color={ZoomTheme.colors.warningYellow} />
            <Text style={styles.contextMenuText}>Colocar na Sala de Espera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.contextMenuItem}
            onPress={() => {
              if (onRemoveParticipant) onRemoveParticipant(participant.identity);
              setShowMenu(false);
            }}
          >
            <UserX size={14} color={ZoomTheme.colors.dangerRed} />
            <Text style={[styles.contextMenuText, { color: ZoomTheme.colors.dangerRed }]}>
              Remover da Reunião
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    borderBottomWidth: 1,
    borderBottomColor: ZoomTheme.colors.borderSubtle,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: ZoomTheme.spacing.lg,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  nameText: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: ZoomTheme.typography.body,
    fontWeight: '500',
  },
  hostBadge: {
    color: ZoomTheme.colors.zoomBlue,
    fontSize: ZoomTheme.typography.caption,
    backgroundColor: 'rgba(14, 114, 237, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  coHostBadge: {
    color: ZoomTheme.colors.successGreen,
    fontSize: ZoomTheme.typography.caption,
    backgroundColor: 'rgba(35, 209, 96, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  handBadge: {
    backgroundColor: ZoomTheme.colors.warningYellow,
    padding: 3,
    borderRadius: 8,
  },
  rightContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  mediaIconWrapper: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mediaIconBtn: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreBtn: {
    padding: 4,
    borderRadius: 4,
  },
  contextMenu: {
    backgroundColor: ZoomTheme.colors.cardBg,
    padding: 6,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    gap: 4,
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  contextMenuText: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 12,
  },
});
