import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Room,
  RoomEvent,
  VideoPresets,
  Track,
  RemoteParticipant,
  LocalParticipant,
  Participant,
  ConnectionState,
  ConnectionQuality,
  DataPacket_Kind,
} from 'livekit-client';
import { ParticipantInfo, ChatMessageData, MeetingPreferences } from '../types/index';
import { getBackgroundDetails } from '../utils/mediaEffects';
import { getAudioConstraints } from '../utils/audioEffects';

interface UseLiveKitRoomProps {
  wsUrl: string;
  token: string;
  autoConnect?: boolean;
  initialMicOn?: boolean;
  initialCamOn?: boolean;
  onNotification?: (msg: string) => void;
  onDataReceived?: (data: any, participant?: RemoteParticipant) => void;
}

export function useLiveKitRoom({
  wsUrl,
  token,
  autoConnect = true,
  initialMicOn = true,
  initialCamOn = true,
  onNotification,
  onDataReceived,
}: UseLiveKitRoomProps) {
  const roomRef = useRef<Room | null>(null);
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.Disconnected);
  const [isMicEnabled, setIsMicEnabled] = useState(initialMicOn);
  const [isCamEnabled, setIsCamEnabled] = useState(initialCamOn);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participants, setParticipants] = useState<ParticipantInfo[]>([]);
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [screenShareTrack, setScreenShareTrack] = useState<Track | null>(null);

  // Mapeia participante para ParticipantInfo
  const mapParticipant = (p: Participant, isLocal: boolean): ParticipantInfo => {
    let quality: 'excellent' | 'good' | 'poor' | 'unknown' = 'unknown';
    if (p.connectionQuality === ConnectionQuality.Excellent) quality = 'excellent';
    else if (p.connectionQuality === ConnectionQuality.Good) quality = 'good';
    else if (p.connectionQuality === ConnectionQuality.Poor) quality = 'poor';

    return {
      identity: p.identity,
      name: p.name || p.identity,
      isLocal,
      isHost: Boolean(p.permissions?.canPublish && p.permissions?.hidden === false), // ou metadata
      isSpeaking: p.isSpeaking,
      isAudioEnabled: p.isMicrophoneEnabled,
      isVideoEnabled: p.isCameraEnabled,
      isScreenSharing: p.isScreenShareEnabled,
      audioLevel: p.audioLevel,
      connectionQuality: quality,
    };
  };

  const updateParticipantsList = useCallback((room: Room) => {
    const list: ParticipantInfo[] = [];
    if (room.localParticipant) {
      list.push(mapParticipant(room.localParticipant, true));
    }
    room.remoteParticipants.forEach((p) => {
      list.push(mapParticipant(p, false));
    });
    setParticipants(list);
  }, []);

  // Conectar à sala
  const connect = useCallback(async () => {
    if (!token || !wsUrl) return;

    if (roomRef.current) {
      roomRef.current.disconnect();
    }

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: VideoPresets.h720.resolution,
      },
    });

    roomRef.current = room;

    // Registra Eventos
    room
      .on(RoomEvent.ConnectionStateChanged, (state) => {
        setConnectionState(state);
      })
      .on(RoomEvent.Connected, async () => {
        updateParticipantsList(room);
        try {
          if (initialMicOn) {
            await room.localParticipant.setMicrophoneEnabled(true);
            setIsMicEnabled(true);
          } else {
            await room.localParticipant.setMicrophoneEnabled(false);
            setIsMicEnabled(false);
          }
          if (initialCamOn) {
            await room.localParticipant.setCameraEnabled(true);
            setIsCamEnabled(true);
          } else {
            await room.localParticipant.setCameraEnabled(false);
            setIsCamEnabled(false);
          }
        } catch (err) {
          console.warn('Erro ao inicializar tracks locais:', err);
        }
      })
      .on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
        onNotification?.(`${participant.name || participant.identity} entrou na reunião`);
        updateParticipantsList(room);
      })
      .on(RoomEvent.ParticipantDisconnected, (participant: RemoteParticipant) => {
        onNotification?.(`${participant.name || participant.identity} saiu da reunião`);
        updateParticipantsList(room);
      })
      .on(RoomEvent.TrackMuted, () => updateParticipantsList(room))
      .on(RoomEvent.TrackUnmuted, () => updateParticipantsList(room))
      .on(RoomEvent.TrackPublished, () => updateParticipantsList(room))
      .on(RoomEvent.TrackUnpublished, () => updateParticipantsList(room))
      .on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
        if (speakers.length > 0) {
          setActiveSpeakerId(speakers[0].identity);
        } else {
          setActiveSpeakerId(null);
        }
        updateParticipantsList(room);
      })
      .on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio) {
          try {
            track.attach();
          } catch (e) {
            console.warn('Erro ao anexar áudio remoto:', e);
          }
        }
        if (track.source === Track.Source.ScreenShare) {
          setScreenShareTrack(track);
        }
        updateParticipantsList(room);
      })
      .on(RoomEvent.TrackUnsubscribed, (track) => {
        try {
          track.detach();
        } catch (e) {
          // ignore
        }
        if (track.source === Track.Source.ScreenShare) {
          setScreenShareTrack(null);
        }
        updateParticipantsList(room);
      })
      .on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
        try {
          const str = new TextDecoder().decode(payload);
          const data = JSON.parse(str);
          if (onDataReceived) {
            onDataReceived(data, participant);
          }
          if (data.type === 'chat') {
            const newMsg: ChatMessageData = {
              id: `${Date.now()}-${Math.random()}`,
              senderIdentity: participant?.identity || 'Desconhecido',
              senderName: participant?.name || participant?.identity || 'Convidado',
              text: data.text,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              isLocal: false,
            };
            setMessages((prev) => [...prev, newMsg]);
          }
        } catch (err) {
          console.error('Erro ao processar DataChannel:', err);
        }
      });

    try {
      await room.connect(wsUrl, token);
    } catch (err) {
      console.error('Erro ao conectar na sala LiveKit:', err);
      setConnectionState(ConnectionState.Disconnected);
    }
  }, [wsUrl, token, initialMicOn, initialCamOn, onNotification, updateParticipantsList]);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }
    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
    };
  }, [autoConnect, connect]);

  // Ações de Mídia
  const toggleMicrophone = async () => {
    if (!roomRef.current?.localParticipant) return;
    const newState = !isMicEnabled;
    await roomRef.current.localParticipant.setMicrophoneEnabled(newState);
    setIsMicEnabled(newState);
    updateParticipantsList(roomRef.current);
  };

  const toggleCamera = async () => {
    if (!roomRef.current?.localParticipant) return;
    const newState = !isCamEnabled;
    await roomRef.current.localParticipant.setCameraEnabled(newState);
    setIsCamEnabled(newState);
    updateParticipantsList(roomRef.current);
  };

  const toggleScreenShare = async () => {
    if (!roomRef.current?.localParticipant) return;
    const newState = !isScreenSharing;
    try {
      await roomRef.current.localParticipant.setScreenShareEnabled(newState);
      setIsScreenSharing(newState);
      updateParticipantsList(roomRef.current);
    } catch (err) {
      console.warn('Erro ao alternar compartilhamento de tela:', err);
      setIsScreenSharing(false);
    }
  };

  const switchAudioDevice = async (deviceId: string) => {
    if (roomRef.current) {
      await roomRef.current.switchActiveDevice('audioinput', deviceId);
    }
  };

  const switchVideoDevice = async (deviceId: string) => {
    if (roomRef.current) {
      await roomRef.current.switchActiveDevice('videoinput', deviceId);
    }
  };

  const sendMessage = async (text: string) => {
    if (!roomRef.current?.localParticipant || !text.trim()) return;
    const payload = JSON.stringify({ type: 'chat', text: text.trim() });
    const encoder = new TextEncoder();
    const data = encoder.encode(payload);

    await roomRef.current.localParticipant.publishData(data, { reliable: true });

    const localMsg: ChatMessageData = {
      id: `${Date.now()}-${Math.random()}`,
      senderIdentity: roomRef.current.localParticipant.identity,
      senderName: roomRef.current.localParticipant.name || 'Você',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isLocal: true,
    };
    setMessages((prev) => [...prev, localMsg]);
  };

  const publishData = useCallback(async (payload: any, reliable = true) => {
    if (!roomRef.current?.localParticipant) return;
    try {
      const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const data = new TextEncoder().encode(str);
      await roomRef.current.localParticipant.publishData(data, { reliable });
    } catch (err) {
      console.warn('Erro ao publicar dados via DataChannel:', err);
    }
  }, []);

  const applyVideoPreferences = async (prefs: Partial<MeetingPreferences>) => {
    if (!roomRef.current?.localParticipant) return;
    try {
      const cameraPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.Camera);
      const videoTrack = cameraPub?.videoTrack;

      if (videoTrack) {
        // 1. Resolution change
        if (prefs.hdVideo !== undefined) {
          const targetRes = prefs.hdVideo ? VideoPresets.h1080.resolution : VideoPresets.h720.resolution;
          try {
            await (videoTrack as any).restartTrack?.({ resolution: targetRes });
          } catch (e) {
            console.warn('Erro ao atualizar resolução:', e);
          }
        }

        // 2. LiveKit TrackProcessor integration (BackgroundBlur / VirtualBackground)
        if (prefs.virtualBackground !== undefined) {
          try {
            // @ts-ignore
            const processors = typeof window !== 'undefined' ? require('@livekit/track-processors') : null;
            if (processors?.BackgroundProcessor?.isSupported) {
              if (prefs.virtualBackground === 'none') {
                await (videoTrack as any).stopProcessor?.();
              } else if (prefs.virtualBackground === 'blur_low') {
                const blur = processors.BackgroundBlur(8);
                await (videoTrack as any).setProcessor?.(blur);
              } else if (prefs.virtualBackground === 'blur_high') {
                const blur = processors.BackgroundBlur(20);
                await (videoTrack as any).setProcessor?.(blur);
              } else {
                const details = getBackgroundDetails(prefs.virtualBackground);
                if (details.imageUrl) {
                  const vb = processors.VirtualBackground(details.imageUrl);
                  await (videoTrack as any).setProcessor?.(vb);
                }
              }
            }
          } catch (procErr) {
            console.warn('Track processor LiveKit não aplicado:', procErr);
          }
        }
      }
    } catch (err) {
      console.warn('Erro ao aplicar preferências de vídeo:', err);
    }
  };

  const applyAudioPreferences = async (prefs: Partial<MeetingPreferences>) => {
    if (!roomRef.current?.localParticipant) return;
    try {
      const micPub = roomRef.current.localParticipant.getTrackPublication(Track.Source.Microphone);
      const audioTrack = micPub?.audioTrack;
      if (audioTrack && audioTrack.mediaStreamTrack) {
        const constraints = getAudioConstraints(prefs.noiseSuppression, prefs.originalSound);
        await audioTrack.mediaStreamTrack.applyConstraints(constraints);
      }
    } catch (err) {
      console.warn('Erro ao aplicar preferências de áudio:', err);
    }
  };

  const disconnect = useCallback(() => {
    if (roomRef.current) {
      try {
        roomRef.current.localParticipant?.trackPublications.forEach((pub: any) => {
          pub.track?.stop();
        });
        roomRef.current.disconnect();
      } catch (err) {
        console.warn('Erro ao desconectar sala:', err);
      }
      setConnectionState(ConnectionState.Disconnected);
    }
  }, []);

  return {
    room: roomRef.current,
    connectionState,
    isMicEnabled,
    isCamEnabled,
    isScreenSharing,
    participants,
    activeSpeakerId,
    messages,
    screenShareTrack,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    switchAudioDevice,
    switchVideoDevice,
    sendMessage,
    publishData,
    applyVideoPreferences,
    applyAudioPreferences,
    disconnect,
    reconnect: connect,
  };
}
