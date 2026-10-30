import React, { useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { X, Search, MicOff, UserPlus, Check, UserX, Clock } from 'lucide-react-native';
import { ParticipantInfo, WaitingParticipant } from '../../types';
import { ZoomTheme } from '../../styles/theme';
import { ParticipantItem } from './ParticipantItem';

interface ParticipantsPanelProps {
  participants: ParticipantInfo[];
  waitingQueue?: WaitingParticipant[];
  isHost: boolean;
  onClose: () => void;
  onMuteAll?: () => void;
  onOpenInviteModal?: () => void;
  onAdmitGuest?: (guestId: string) => void;
  onAdmitAll?: () => void;
  onRejectGuest?: (guestId: string) => void;
  onToggleMuteParticipant?: (identity: string) => void;
  onToggleCoHost?: (identity: string) => void;
  onRenameParticipant?: (identity: string, newName: string) => void;
  onSendToWaitingRoom?: (identity: string) => void;
  onRemoveParticipant?: (identity: string) => void;
  isMobile?: boolean;
}

export const ParticipantsPanel: React.FC<ParticipantsPanelProps> = ({
  participants,
  waitingQueue = [],
  isHost,
  onClose,
  onMuteAll,
  onOpenInviteModal,
  onAdmitGuest,
  onAdmitAll,
  onRejectGuest,
  onToggleMuteParticipant,
  onToggleCoHost,
  onRenameParticipant,
  onSendToWaitingRoom,
  onRemoveParticipant,
  isMobile = false,
}) => {
  const [search, setSearch] = useState('');

  const filtered = participants.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View
      style={[styles.container, isMobile && styles.containerMobile]}
      accessibilityRole="complementary"
      accessibilityLabel="Painel de Participantes"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Participantes ({participants.length})</Text>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          accessibilityLabel="Fechar painel"
          activeOpacity={0.7}
        >
          <X size={18} color={ZoomTheme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Search size={16} color={ZoomTheme.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Pesquisar participante..."
          placeholderTextColor={ZoomTheme.colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {/* Waiting Room Queue Section for Host */}
        {isHost && waitingQueue.length > 0 && (
          <View style={styles.waitingSection}>
            <View style={styles.waitingHeader}>
              <View style={styles.waitingTitleRow}>
                <Clock size={14} color={ZoomTheme.colors.warningYellow} />
                <Text style={styles.waitingTitle}>
                  Sala de Espera ({waitingQueue.length})
                </Text>
              </View>
              {onAdmitAll && (
                <TouchableOpacity style={styles.admitAllBtn} onPress={onAdmitAll}>
                  <Text style={styles.admitAllBtnText}>Admitir todos</Text>
                </TouchableOpacity>
              )}
            </View>

            {waitingQueue.map((guest) => (
              <View key={guest.id} style={styles.waitingGuestRow}>
                <Text style={styles.waitingGuestName}>{guest.name}</Text>
                <View style={styles.waitingGuestActions}>
                  {onAdmitGuest && (
                    <TouchableOpacity
                      style={styles.admitBtn}
                      onPress={() => onAdmitGuest(guest.id)}
                      accessibilityLabel="Admitir participante"
                    >
                      <Check size={13} color="#FFF" />
                      <Text style={styles.actionBtnText}>Admitir</Text>
                    </TouchableOpacity>
                  )}
                  {onRejectGuest && (
                    <TouchableOpacity
                      style={styles.rejectBtn}
                      onPress={() => onRejectGuest(guest.id)}
                      accessibilityLabel="Remover da sala de espera"
                    >
                      <UserX size={13} color={ZoomTheme.colors.dangerRed} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {filtered.map((p) => (
          <ParticipantItem
            key={p.identity}
            participant={p}
            isHostUser={isHost}
            onToggleMuteParticipant={onToggleMuteParticipant}
            onToggleCoHost={onToggleCoHost}
            onRenameParticipant={onRenameParticipant}
            onSendToWaitingRoom={onSendToWaitingRoom}
            onRemoveParticipant={onRemoveParticipant}
          />
        ))}
      </ScrollView>

      {/* Footer Controls */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.inviteBtn}
          onPress={onOpenInviteModal}
          activeOpacity={0.7}
          accessibilityLabel="Convidar participantes"
        >
          <UserPlus size={15} color={ZoomTheme.colors.textPrimary} />
          <Text style={styles.inviteBtnText}>Convidar</Text>
        </TouchableOpacity>

        {isHost && (
          <TouchableOpacity
            style={styles.muteAllBtn}
            onPress={onMuteAll}
            activeOpacity={0.7}
            accessibilityLabel="Desativar som de todos"
          >
            <MicOff size={15} color={ZoomTheme.colors.textPrimary} />
            <Text style={styles.muteAllText}>Desativar som de todos</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: ZoomTheme.layout.panelWidth,
    backgroundColor: ZoomTheme.colors.panelBg,
    borderLeftWidth: 1,
    borderLeftColor: ZoomTheme.colors.borderSubtle,
    height: '100%',
    flexDirection: 'column',
    zIndex: 20,
  },
  containerMobile: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    zIndex: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ZoomTheme.spacing.lg,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: ZoomTheme.colors.borderSubtle,
    backgroundColor: ZoomTheme.colors.dockBg,
  },
  title: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: ZoomTheme.typography.subtitle,
    fontWeight: '600',
  },
  closeBtn: {
    padding: 6,
    borderRadius: ZoomTheme.borderRadius.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ZoomTheme.colors.inputBg,
    marginHorizontal: ZoomTheme.spacing.md,
    marginVertical: 10,
    paddingHorizontal: 12,
    borderRadius: ZoomTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: ZoomTheme.colors.textPrimary,
    paddingVertical: 8,
    fontSize: ZoomTheme.typography.bodySmall,
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 16,
  },
  waitingSection: {
    backgroundColor: 'rgba(255, 165, 2, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 165, 2, 0.2)',
    padding: 10,
    gap: 8,
  },
  waitingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  waitingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waitingTitle: {
    color: ZoomTheme.colors.warningYellow,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  admitAllBtn: {
    backgroundColor: ZoomTheme.colors.zoomBlue,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  admitAllBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  waitingGuestRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ZoomTheme.colors.cardBg,
    padding: 8,
    borderRadius: 4,
  },
  waitingGuestName: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  waitingGuestActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  admitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ZoomTheme.colors.zoomBlue,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  rejectBtn: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(224, 40, 40, 0.1)',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    gap: 8,
    padding: ZoomTheme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: ZoomTheme.colors.borderSubtle,
    backgroundColor: ZoomTheme.colors.dockBg,
  },
  inviteBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 9,
    borderRadius: ZoomTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
  },
  inviteBtnText: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: ZoomTheme.typography.button,
    fontWeight: '600',
  },
  muteAllBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingVertical: 9,
    borderRadius: ZoomTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
  },
  muteAllText: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: ZoomTheme.typography.button,
    fontWeight: '600',
  },
});
