import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import {
  X,
  LayoutGrid,
  Plus,
  Play,
  Square,
  Users,
  Radio,
  Send,
  Trash2,
} from 'lucide-react-native';
import { ZoomTheme } from '../../styles/theme';
import { BreakoutRoom, ParticipantInfo } from '../../types';

interface BreakoutRoomsModalProps {
  participants: ParticipantInfo[];
  breakoutRooms: BreakoutRoom[];
  isOpen: boolean;
  onOpenRooms: (rooms: BreakoutRoom[]) => void;
  onCloseRooms: () => void;
  onBroadcastMessage: (msg: string) => void;
  onClose: () => void;
}

export const BreakoutRoomsModal: React.FC<BreakoutRoomsModalProps> = ({
  participants,
  breakoutRooms,
  isOpen: isRoomsOpen,
  onOpenRooms,
  onCloseRooms,
  onBroadcastMessage,
  onClose,
}) => {
  const [roomCount, setRoomCount] = useState(2);
  const [allocationMode, setAllocationMode] = useState<'auto' | 'manual'>('auto');
  const [configuredRooms, setConfiguredRooms] = useState<BreakoutRoom[]>(() => {
    if (breakoutRooms.length > 0) return breakoutRooms;
    return [
      { id: 'b1', name: 'Sala Simultânea 1', participantIdentities: [] },
      { id: 'b2', name: 'Sala Simultânea 2', participantIdentities: [] },
    ];
  });
  const [broadcastText, setBroadcastText] = useState('');

  const handleCreateRooms = () => {
    const remoteParticipants = participants.filter((p) => !p.isHost && !p.isLocal);
    const newRooms: BreakoutRoom[] = [];

    for (let i = 0; i < roomCount; i++) {
      newRooms.push({
        id: `room_${i + 1}`,
        name: `Sala Simultânea ${i + 1}`,
        participantIdentities: [],
      });
    }

    if (allocationMode === 'auto' && remoteParticipants.length > 0) {
      remoteParticipants.forEach((p, idx) => {
        const roomIdx = idx % roomCount;
        newRooms[roomIdx].participantIdentities.push(p.identity);
      });
    }

    setConfiguredRooms(newRooms);
  };

  const handleSendBroadcast = () => {
    if (!broadcastText.trim()) return;
    onBroadcastMessage(broadcastText.trim());
    setBroadcastText('');
  };

  return (
    <View style={styles.overlay} accessibilityRole="dialog" accessibilityLabel="Salas Simultâneas">
      <View style={styles.modalCard}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <LayoutGrid size={18} color={ZoomTheme.colors.zoomBlue} />
            <Text style={styles.title}>Salas Simultâneas (Breakout Rooms)</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fechar salas">
            <X size={18} color={ZoomTheme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {!isRoomsOpen ? (
            <View style={styles.setupSection}>
              <Text style={styles.setupSubtitle}>
                Dividir participantes em salas menores para discussões e dinâmicas em grupo.
              </Text>

              <View style={styles.roomCountRow}>
                <Text style={styles.label}>Criar</Text>
                <View style={styles.numberStepper}>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setRoomCount((c) => Math.max(2, c - 1))}
                  >
                    <Text style={styles.stepBtnText}>-</Text>
                  </TouchableOpacity>
                  <Text style={styles.stepNumber}>{roomCount}</Text>
                  <TouchableOpacity
                    style={styles.stepBtn}
                    onPress={() => setRoomCount((c) => Math.min(10, c + 1))}
                  >
                    <Text style={styles.stepBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.label}>salas simultâneas</Text>
              </View>

              <View style={styles.radioGroup}>
                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setAllocationMode('auto')}
                >
                  <View style={[styles.radioCircle, allocationMode === 'auto' && styles.radioActive]}>
                    {allocationMode === 'auto' && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.radioLabel}>Atribuir automaticamente aos participantes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.radioOption}
                  onPress={() => setAllocationMode('manual')}
                >
                  <View style={[styles.radioCircle, allocationMode === 'manual' && styles.radioActive]}>
                    {allocationMode === 'manual' && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.radioLabel}>Permitir que os participantes escolham a sala</Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.generateBtn} onPress={handleCreateRooms}>
                <Text style={styles.generateBtnText}>Gerar Distribuição de Salas</Text>
              </TouchableOpacity>

              {/* Preview das Salas */}
              <View style={styles.roomsPreviewList}>
                {configuredRooms.map((room) => (
                  <View key={room.id} style={styles.roomItem}>
                    <View style={styles.roomItemHeader}>
                      <Text style={styles.roomItemTitle}>{room.name}</Text>
                      <Text style={styles.roomItemCount}>
                        {room.participantIdentities.length} participantes
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          ) : (
            <View style={styles.activeSection}>
              <View style={styles.activeBanner}>
                <Radio size={16} color={ZoomTheme.colors.successGreen} />
                <Text style={styles.activeBannerText}>
                  Todas as salas simultâneas estão ativas no momento.
                </Text>
              </View>

              {/* Broadcast Tool */}
              <View style={styles.broadcastBox}>
                <Text style={styles.broadcastTitle}>Transmitir Mensagem para Todas as Salas</Text>
                <View style={styles.broadcastInputRow}>
                  <TextInput
                    style={styles.broadcastInput}
                    placeholder="Digite uma mensagem geral para todas as salas..."
                    placeholderTextColor={ZoomTheme.colors.textMuted}
                    value={broadcastText}
                    onChangeText={setBroadcastText}
                  />
                  <TouchableOpacity
                    style={styles.broadcastBtn}
                    onPress={handleSendBroadcast}
                    disabled={!broadcastText.trim()}
                  >
                    <Send size={15} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          {!isRoomsOpen ? (
            <TouchableOpacity
              style={styles.openAllBtn}
              onPress={() => onOpenRooms(configuredRooms)}
            >
              <Play size={16} color="#FFF" />
              <Text style={styles.openAllBtnText}>Abrir Todas as Salas</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.closeAllBtn} onPress={onCloseRooms}>
              <Square size={16} color="#FFF" />
              <Text style={styles.closeAllBtnText}>Fechar Todas as Salas</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: ZoomTheme.colors.modalBackdrop,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 580,
    maxHeight: '85%',
    backgroundColor: ZoomTheme.colors.panelBg,
    borderRadius: ZoomTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
  },
  header: {
    height: 52,
    backgroundColor: ZoomTheme.colors.dockBg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: ZoomTheme.colors.borderSubtle,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: ZoomTheme.typography.subtitle,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
  },
  setupSection: {
    gap: 16,
  },
  setupSubtitle: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  roomCountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: ZoomTheme.colors.cardBg,
    padding: 12,
    borderRadius: ZoomTheme.borderRadius.md,
  },
  label: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  numberStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ZoomTheme.colors.inputBg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
  },
  stepBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  stepBtnText: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  stepNumber: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    paddingHorizontal: 8,
  },
  radioGroup: {
    gap: 10,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: ZoomTheme.colors.textMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: ZoomTheme.colors.zoomBlue,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ZoomTheme.colors.zoomBlue,
  },
  radioLabel: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 13,
  },
  generateBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 10,
    borderRadius: ZoomTheme.borderRadius.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
  },
  generateBtnText: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  roomsPreviewList: {
    gap: 8,
  },
  roomItem: {
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: ZoomTheme.borderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
  },
  roomItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomItemTitle: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  roomItemCount: {
    color: ZoomTheme.colors.textMuted,
    fontSize: 12,
  },
  activeSection: {
    gap: 16,
  },
  activeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(35, 209, 96, 0.1)',
    padding: 12,
    borderRadius: ZoomTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(35, 209, 96, 0.25)',
  },
  activeBannerText: {
    color: ZoomTheme.colors.successGreen,
    fontSize: 13,
    fontWeight: '600',
  },
  broadcastBox: {
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: ZoomTheme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    gap: 10,
  },
  broadcastTitle: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  broadcastInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  broadcastInput: {
    flex: 1,
    backgroundColor: ZoomTheme.colors.inputBg,
    color: ZoomTheme.colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: ZoomTheme.borderRadius.sm,
    fontSize: 13,
  },
  broadcastBtn: {
    backgroundColor: ZoomTheme.colors.zoomBlue,
    padding: 10,
    borderRadius: ZoomTheme.borderRadius.sm,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: ZoomTheme.colors.borderSubtle,
    backgroundColor: ZoomTheme.colors.dockBg,
    alignItems: 'flex-end',
  },
  openAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ZoomTheme.colors.zoomBlue,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: ZoomTheme.borderRadius.sm,
  },
  openAllBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  closeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ZoomTheme.colors.dangerRed,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: ZoomTheme.borderRadius.sm,
  },
  closeAllBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
