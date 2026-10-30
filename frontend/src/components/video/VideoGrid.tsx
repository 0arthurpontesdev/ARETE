import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react-native';
import { Room, Track } from 'livekit-client';
import { ParticipantInfo, MeetingPreferences, FloatingReaction } from '../../types';
import { VideoTile } from './VideoTile';
import { ScreenShareView } from './ScreenShareView';
import { useResponsiveLayout } from '../../hooks/useResponsiveLayout';
import { ZoomTheme } from '../../styles/theme';

interface VideoGridProps {
  participants: ParticipantInfo[];
  room?: Room | null;
  activeSpeakerId?: string | null;
  screenShareTrack?: Track | null;
  isGalleryView: boolean;
  floatingReactions?: FloatingReaction[];
  preferences?: Partial<MeetingPreferences>;
}

const PARTICIPANTS_PER_PAGE = 16;

export const VideoGrid: React.FC<VideoGridProps> = ({
  participants,
  room,
  activeSpeakerId,
  screenShareTrack,
  isGalleryView,
  floatingReactions = [],
  preferences,
}) => {
  const { calculateGrid, isMobile, height, width } = useResponsiveLayout();
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  const getLivekitParticipant = (info: ParticipantInfo) => {
    if (!room) return undefined;
    if (info.isLocal) return room.localParticipant;
    return room.remoteParticipants.get(info.identity);
  };

  const handleTogglePin = (identity: string) => {
    setPinnedId((prev) => (prev === identity ? null : identity));
  };

  const getReactionsFor = (identity: string) => {
    return floatingReactions.filter((r) => r.senderIdentity === identity);
  };

  // 0. Caso especial: Nenhum participante
  if (!participants || participants.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyCard}>
          <Users size={48} color={ZoomTheme.colors.textMuted} />
          <Text style={styles.emptyTitle}>Aguardando participantes...</Text>
          <Text style={styles.emptySubtitle}>
            Compartilhe o código da reunião para convidar outras pessoas.
          </Text>
        </View>
      </View>
    );
  }

  // 1. Modo Apresentação de Tela (Screen Share)
  if (screenShareTrack) {
    return (
      <View style={styles.container}>
        <View style={styles.screenShareStage}>
          <ScreenShareView track={screenShareTrack} />
        </View>
        <ScrollView
          horizontal
          style={styles.thumbnailStrip}
          contentContainerStyle={styles.thumbnailStripContent}
          showsHorizontalScrollIndicator={false}
        >
          {participants.map((p) => (
            <View key={p.identity} style={styles.thumbnailItem}>
              <VideoTile
                participantInfo={p}
                livekitParticipant={getLivekitParticipant(p)}
                onPin={() => handleTogglePin(p.identity)}
                isPinned={pinnedId === p.identity}
                reactions={getReactionsFor(p.identity)}
                preferences={p.isLocal ? preferences : undefined}
              />
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  // 2. Participante Fixado (Pinned View)
  if (pinnedId) {
    const pinnedParticipant = participants.find((p) => p.identity === pinnedId);
    if (pinnedParticipant) {
      const others = participants.filter((p) => p.identity !== pinnedId);
      return (
        <View style={styles.container}>
          {others.length > 0 && (
            <ScrollView
              horizontal
              style={styles.thumbnailStrip}
              contentContainerStyle={styles.thumbnailStripContent}
              showsHorizontalScrollIndicator={false}
            >
              {others.map((p) => (
                <View key={p.identity} style={styles.thumbnailItem}>
                  <VideoTile
                    participantInfo={p}
                    livekitParticipant={getLivekitParticipant(p)}
                    onPin={() => handleTogglePin(p.identity)}
                    isPinned={false}
                    reactions={getReactionsFor(p.identity)}
                    preferences={p.isLocal ? preferences : undefined}
                  />
                </View>
              ))}
            </ScrollView>
          )}
          <View style={styles.speakerMainStage}>
            <VideoTile
              participantInfo={pinnedParticipant}
              livekitParticipant={getLivekitParticipant(pinnedParticipant)}
              isSpeakerView
              onPin={() => handleTogglePin(pinnedParticipant.identity)}
              isPinned={true}
              reactions={getReactionsFor(pinnedParticipant.identity)}
              preferences={pinnedParticipant.isLocal ? preferences : undefined}
            />
          </View>
        </View>
      );
    }
  }

  // 3. Modo Orador (Speaker View)
  if (!isGalleryView && participants.length > 1) {
    const speaker = participants.find((p) => p.identity === activeSpeakerId) || participants[0];
    const others = participants.filter((p) => p.identity !== speaker.identity);

    return (
      <View style={styles.container}>
        <ScrollView
          horizontal
          style={styles.thumbnailStrip}
          contentContainerStyle={styles.thumbnailStripContent}
          showsHorizontalScrollIndicator={false}
        >
          {others.map((p) => (
            <View key={p.identity} style={styles.thumbnailItem}>
              <VideoTile
                participantInfo={p}
                livekitParticipant={getLivekitParticipant(p)}
                onPin={() => handleTogglePin(p.identity)}
                reactions={getReactionsFor(p.identity)}
                preferences={p.isLocal ? preferences : undefined}
              />
            </View>
          ))}
        </ScrollView>
        <View style={styles.speakerMainStage}>
          <VideoTile
            participantInfo={speaker}
            livekitParticipant={getLivekitParticipant(speaker)}
            isSpeakerView
            onPin={() => handleTogglePin(speaker.identity)}
            reactions={getReactionsFor(speaker.identity)}
            preferences={speaker.isLocal ? preferences : undefined}
          />
        </View>
      </View>
    );
  }

  // 4. Caso 1: 1 único participante na sala
  if (participants.length === 1) {
    const single = participants[0];
    return (
      <View style={styles.singleParticipantContainer}>
        <View style={styles.singleTileWrapper}>
          <VideoTile
            participantInfo={single}
            livekitParticipant={getLivekitParticipant(single)}
            onPin={() => handleTogglePin(single.identity)}
            reactions={getReactionsFor(single.identity)}
            preferences={single.isLocal ? preferences : undefined}
          />
        </View>
      </View>
    );
  }

  // 5. Caso 2: Exatamente 2 participantes
  if (participants.length === 2) {
    const isPortrait = isMobile && height > width;
    return (
      <View style={[styles.twoParticipantsContainer, isPortrait ? styles.flexCol : styles.flexRow]}>
        {participants.map((p) => (
          <View key={p.identity} style={styles.twoTileSlot}>
            <VideoTile
              participantInfo={p}
              livekitParticipant={getLivekitParticipant(p)}
              onPin={() => handleTogglePin(p.identity)}
              reactions={getReactionsFor(p.identity)}
              preferences={p.isLocal ? preferences : undefined}
            />
          </View>
        ))}
      </View>
    );
  }

  // 6. Caso 3: 3 ou 4 participantes (Grade 2x2 balanceada)
  if (participants.length <= 4) {
    return (
      <View style={styles.quadContainer}>
        {participants.map((p) => (
          <View key={p.identity} style={styles.quadCell}>
            <VideoTile
              participantInfo={p}
              livekitParticipant={getLivekitParticipant(p)}
              onPin={() => handleTogglePin(p.identity)}
              reactions={getReactionsFor(p.identity)}
              preferences={p.isLocal ? preferences : undefined}
            />
          </View>
        ))}
      </View>
    );
  }

  // 7. Caso 4: 5 a 16 participantes (Grade até 4x4 balanceada)
  if (participants.length <= 16) {
    const { columns } = calculateGrid(participants.length);
    const colWidth = `${Math.floor(100 / columns) - 1.2}%` as any;

    return (
      <View style={styles.galleryContainer}>
        {participants.map((p) => (
          <View
            key={p.identity}
            style={[
              styles.gridCell,
              {
                width: colWidth,
                minWidth: isMobile ? '100%' : '23%',
                aspectRatio: 16 / 9,
              },
            ]}
          >
            <VideoTile
              participantInfo={p}
              livekitParticipant={getLivekitParticipant(p)}
              onPin={() => handleTogglePin(p.identity)}
              reactions={getReactionsFor(p.identity)}
              preferences={p.isLocal ? preferences : undefined}
            />
          </View>
        ))}
      </View>
    );
  }

  // 8. Caso 5: Mais de 9 participantes (Grade com Paginação Zoom Style)
  const totalPages = Math.ceil(participants.length / PARTICIPANTS_PER_PAGE);
  const safePage = Math.min(currentPage, totalPages - 1);
  const paginatedParticipants = participants.slice(
    safePage * PARTICIPANTS_PER_PAGE,
    (safePage + 1) * PARTICIPANTS_PER_PAGE
  );

  return (
    <View style={styles.paginatedContainer}>
      {/* Paginação Superior Estilo Zoom */}
      <View style={styles.paginationBar}>
        <TouchableOpacity
          style={[styles.pageNavBtn, safePage === 0 && styles.pageNavBtnDisabled]}
          onPress={() => setCurrentPage((p) => Math.max(0, p - 1))}
          disabled={safePage === 0}
          accessibilityLabel="Página anterior de vídeos"
        >
          <ChevronLeft size={16} color={safePage === 0 ? ZoomTheme.colors.textMuted : '#FFF'} />
        </TouchableOpacity>

        <Text style={styles.pageIndicatorText}>
          Página {safePage + 1} de {totalPages} ({participants.length} participantes)
        </Text>

        <TouchableOpacity
          style={[styles.pageNavBtn, safePage >= totalPages - 1 && styles.pageNavBtnDisabled]}
          onPress={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={safePage >= totalPages - 1}
          accessibilityLabel="Próxima página de vídeos"
        >
          <ChevronRight
            size={16}
            color={safePage >= totalPages - 1 ? ZoomTheme.colors.textMuted : '#FFF'}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.galleryContainer}>
        {paginatedParticipants.map((p) => (
          <View
            key={p.identity}
            style={[
              styles.gridCell,
              {
                width: '32%',
                minWidth: isMobile ? '100%' : '30%',
              },
            ]}
          >
            <VideoTile
              participantInfo={p}
              livekitParticipant={getLivekitParticipant(p)}
              onPin={() => handleTogglePin(p.identity)}
              reactions={getReactionsFor(p.identity)}
              preferences={p.isLocal ? preferences : undefined}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    padding: 8,
    gap: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyCard: {
    backgroundColor: ZoomTheme.colors.tileBg,
    borderRadius: ZoomTheme.borderRadius.lg,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    maxWidth: 400,
  },
  emptyTitle: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: ZoomTheme.typography.title,
    fontWeight: '600',
  },
  emptySubtitle: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: ZoomTheme.typography.bodySmall,
    textAlign: 'center',
  },
  singleParticipantContainer: {
    flex: 1,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  singleTileWrapper: {
    width: '100%',
    height: '100%',
    maxWidth: ZoomTheme.layout.maxVideoWidth,
    maxHeight: ZoomTheme.layout.maxVideoHeight,
    aspectRatio: 16 / 9,
  },
  twoParticipantsContainer: {
    flex: 1,
    padding: 8,
    gap: 8,
  },
  flexRow: {
    flexDirection: 'row',
  },
  flexCol: {
    flexDirection: 'column',
  },
  twoTileSlot: {
    flex: 1,
    height: '100%',
    minHeight: 180,
  },
  quadContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quadCell: {
    width: '49%',
    height: '49%',
    aspectRatio: 16 / 9,
  },
  galleryContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    alignContent: 'center',
    padding: 8,
    gap: 8,
  },
  gridCell: {
    flexGrow: 1,
    aspectRatio: 16 / 9,
    maxHeight: '100%',
  },
  paginatedContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  paginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  pageNavBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  pageNavBtnDisabled: {
    opacity: 0.3,
  },
  pageIndicatorText: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: ZoomTheme.typography.caption,
    fontWeight: '500',
  },
  screenShareStage: {
    flex: 1,
    width: '100%',
    borderRadius: 8,
    overflow: 'hidden',
  },
  speakerMainStage: {
    flex: 1,
    width: '100%',
  },
  thumbnailStrip: {
    maxHeight: 120,
    flexGrow: 0,
  },
  thumbnailStripContent: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  thumbnailItem: {
    width: 160,
    height: 100,
  },
});
