import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { Mic, MicOff, Pin, MoreHorizontal, Hand } from 'lucide-react-native';
import { Participant, Track } from 'livekit-client';
import { ParticipantInfo, MeetingPreferences, FloatingReaction } from '../../types';
import { ZoomTheme } from '../../styles/theme';
import { AudioLevelIndicator } from '../common/AudioLevelIndicator';
import { getBackgroundDetails, computeCombinedVideoFilter } from '../../utils/mediaEffects';

interface VideoTileProps {
  participantInfo: ParticipantInfo;
  livekitParticipant?: Participant;
  isSpeakerView?: boolean;
  onPin?: () => void;
  isPinned?: boolean;
  preferences?: Partial<MeetingPreferences>;
  reactions?: FloatingReaction[];
}

function getAvatarColor(name: string): string {
  const colors = [
    '#0E72ED', // Zoom Blue
    '#8E44AD', // Purple
    '#27AE60', // Emerald Green
    '#D35400', // Rust Orange
    '#16A085', // Teal
    '#2C3E50', // Dark Slate
    '#E67E22', // Amber
    '#2980B9', // Ocean Blue
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export const VideoTile = React.memo<VideoTileProps>(({
  participantInfo,
  livekitParticipant,
  isSpeakerView = false,
  onPin,
  isPinned = false,
  preferences,
  reactions = [],
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (Platform.OS !== 'web' || !livekitParticipant) return;

    const cameraPub = livekitParticipant.getTrackPublication(Track.Source.Camera);

    if (cameraPub && cameraPub.track && participantInfo.isVideoEnabled) {
      if (videoRef.current) {
        cameraPub.track.attach(videoRef.current);
      }
    }

    return () => {
      if (cameraPub?.track && videoRef.current) {
        cameraPub.track.detach(videoRef.current);
      }
    };
  }, [livekitParticipant, participantInfo.isVideoEnabled]);

  const initials = getInitials(participantInfo.name);
  const avatarBg = getAvatarColor(participantInfo.name);

  // Compute CSS mirror, filters, and virtual background
  const isMirrored = participantInfo.isLocal ? (preferences?.mirrorVideo ?? true) : false;
  const mirrorTransform = isMirrored ? 'scaleX(-1)' : 'none';

  const bgDetails = participantInfo.isLocal
    ? getBackgroundDetails(preferences?.virtualBackground || 'none')
    : { id: 'none', label: 'Nenhum', type: 'none' as const, icon: '' };

  const videoFilterStyle = participantInfo.isLocal && preferences
    ? computeCombinedVideoFilter({
        filterId: preferences.videoFilter,
        lowLightAdjustment: preferences.lowLightAdjustment,
        smoothSkin: preferences.smoothSkin,
      })
    : 'none';

  const hasImageBackground = bgDetails.type === 'image' && Boolean(bgDetails.imageUrl);
  const hasBlurBackground = bgDetails.type === 'blur';

  return (
    <View
      style={[
        styles.tileContainer,
        participantInfo.isSpeaking && styles.speakingBorder,
        isSpeakerView && styles.speakerViewContainer,
      ]}
      // @ts-ignore
      accessibilityRole="region"
      accessibilityLabel={`Vídeo de ${participantInfo.name}`}
      // @ts-ignore - mouse events on web
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* 1. WebRTC Video Element or Virtual Background */}
      {Platform.OS === 'web' && participantInfo.isVideoEnabled && !participantInfo.avatarUrl && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: '#000000',
          }}
        >
          {/* Virtual Background Image */}
          {hasImageBackground && bgDetails.imageUrl && (
            <img
              src={bgDetails.imageUrl}
              alt={bgDetails.label}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                zIndex: 1,
              }}
            />
          )}

          {/* Virtual Background Blur Layer */}
          {hasBlurBackground && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                overflow: 'hidden',
                zIndex: 1,
                backdropFilter: `blur(${bgDetails.blurRadius || 12}px)`,
                backgroundColor: 'rgba(20, 20, 25, 0.4)',
              }}
            />
          )}

          {/* Foreground Video Subject */}
          <video
            ref={videoRef as any}
            autoPlay
            playsInline
            muted={participantInfo.isLocal}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: mirrorTransform,
              filter: videoFilterStyle,
              zIndex: 2,
              WebkitMaskImage:
                hasImageBackground || hasBlurBackground
                  ? 'radial-gradient(ellipse 65% 82% at 50% 50%, black 50%, rgba(0,0,0,0.65) 75%, transparent 100%)'
                  : 'none',
              maskImage:
                hasImageBackground || hasBlurBackground
                  ? 'radial-gradient(ellipse 65% 82% at 50% 50%, black 50%, rgba(0,0,0,0.65) 75%, transparent 100%)'
                  : 'none',
              transition: 'filter 0.25s ease, transform 0.2s ease',
            }}
          />
        </div>
      )}

      {/* 2. Photo Portrait Feed (quando foto de alta fidelidade fornecida) */}
      {participantInfo.avatarUrl && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            overflow: 'hidden',
          }}
        >
          <img
            src={participantInfo.avatarUrl}
            alt={participantInfo.name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              filter: participantInfo.isLocal ? videoFilterStyle : 'none',
              transform: participantInfo.isLocal ? 'scaleX(-1)' : 'none',
            }}
          />
        </div>
      )}

      {/* 3. Video Off Avatar Fallback (Iniciais) */}
      {!participantInfo.isVideoEnabled && !participantInfo.avatarUrl && (
        <View style={styles.avatarContainer}>
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: avatarBg },
              isSpeakerView && styles.avatarCircleLarge,
            ]}
          >
            <Text style={[styles.avatarText, isSpeakerView && styles.avatarTextLarge]}>
              {initials}
            </Text>
          </View>
        </View>
      )}

      {/* 3. Hand Raised Badge */}
      {participantInfo.isHandRaised && (
        <View style={styles.handRaisedBadge}>
          <Hand size={14} color="#000000" />
          <Text style={styles.handRaisedText}>Mão Levantada</Text>
        </View>
      )}

      {/* 4. Active Floating Emoji Reaction (Animado com keyframes estilo Zoom) */}
      {Platform.OS === 'web' && reactions && reactions.length > 0 && (
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            left: '50%',
            transform: 'translateX(-50%)',
            pointerEvents: 'none',
            zIndex: 10,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
          }}
        >
          {reactions.map((r) => (
            <div
              key={r.id}
              style={{
                fontSize: '36px',
                animation: 'zoomFloatUp 3s cubic-bezier(0.2, 0.8, 0.2, 1) forwards',
                filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.6))',
              }}
            >
              {r.emoji}
            </div>
          ))}
        </div>
      )}

      {participantInfo.activeReaction && (!reactions || reactions.length === 0) && (
        <View style={styles.floatingEmoji}>
          <Text style={styles.floatingEmojiText}>{participantInfo.activeReaction}</Text>
        </View>
      )}

      {/* 5. Top Right Actions (Pin & More) visible on hover */}
      {(isHovered || isPinned) && (
        <View style={styles.topRightControls}>
          {onPin && (
            <TouchableOpacity
              style={[styles.tileActionBtn, isPinned && styles.tileActionBtnActive]}
              onPress={onPin}
              accessibilityLabel="Fixar vídeo"
            >
              <Pin size={13} color="#FFFFFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.tileActionBtn}
            accessibilityLabel="Opções do participante"
          >
            <MoreHorizontal size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* 6. Bottom Participant Info Pill */}
      <View style={styles.bottomPill}>
        {participantInfo.isAudioEnabled ? (
          <View style={styles.micActiveContainer}>
            <Mic size={13} color={ZoomTheme.colors.textPrimary} />
            <AudioLevelIndicator
              level={participantInfo.audioLevel}
              isMuted={!participantInfo.isAudioEnabled}
            />
          </View>
        ) : (
          <View style={styles.micMutedBadge}>
            <MicOff size={13} color={ZoomTheme.colors.dangerRed} />
          </View>
        )}
        <Text style={styles.participantName} numberOfLines={1}>
          {participantInfo.name}
          {participantInfo.isLocal ? ' (Você)' : ''}
          {participantInfo.isHost ? ' (Anfitrião)' : ''}
          {participantInfo.isCoHost ? ' (Co-anfitrião)' : ''}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  tileContainer: {
    flex: 1,
    backgroundColor: ZoomTheme.colors.tileBg,
    borderRadius: ZoomTheme.layout.tileRadius,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.04)',
    minHeight: 180,
  },
  speakingBorder: {
    borderColor: '#22c55e',
    borderWidth: 3,
    shadowColor: '#22c55e',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 6,
  },
  speakerViewContainer: {
    width: '100%',
    height: '100%',
  },
  avatarContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  avatarCircleLarge: {
    width: 130,
    height: 130,
    borderRadius: 65,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  avatarTextLarge: {
    fontSize: 48,
  },
  handRaisedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: ZoomTheme.colors.warningYellow,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 5,
  },
  handRaisedText: {
    color: '#000000',
    fontSize: 10,
    fontWeight: '700',
  },
  floatingEmoji: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 6,
  },
  floatingEmojiText: {
    fontSize: 24,
  },
  topRightControls: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    gap: 6,
    zIndex: 4,
  },
  tileActionBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  tileActionBtnActive: {
    backgroundColor: ZoomTheme.colors.zoomBlue,
  },
  bottomPill: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.68)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 6,
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 3,
  },
  micActiveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  micMutedBadge: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  participantName: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
});
