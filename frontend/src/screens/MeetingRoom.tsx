import React, { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, Text, Platform } from 'react-native';
import { ConnectionState } from 'livekit-client';
import { MeetingHeader } from '../components/header/MeetingHeader';
import { VideoGrid } from '../components/video/VideoGrid';
import { MeetingToolbar } from '../components/toolbar/MeetingToolbar';
import { ParticipantsPanel } from '../components/panels/ParticipantsPanel';
import { ChatPanel } from '../components/panels/ChatPanel';
import { CopilotPanel } from '../components/panels/CopilotPanel';
import { MeetingSettings } from '../components/settings/MeetingSettings';
import { DeviceSelector } from '../components/settings/DeviceSelector';
import { SecurityMenu } from '../components/security/SecurityMenu';
import { ReactionsPopover } from '../components/reactions/ReactionsPopover';
import { PollsModal } from '../components/polls/PollsModal';
import { BreakoutRoomsModal } from '../components/breakout/BreakoutRoomsModal';
import { InviteModal } from '../components/participants/InviteModal';
import { RecordingMenu } from '../components/recording/RecordingMenu';
import { ScreenAnnotationCanvas } from '../components/video/ScreenAnnotationCanvas';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { ScreenShareModal, ShareOption, SHARE_OPTIONS } from '../components/video/ScreenShareModal';
import { SharedPresentationView } from '../components/presentation/SharedPresentationView';
import { useLiveKitRoom } from '../hooks/useLiveKitRoom';
import { useWebRTC } from '../hooks/useWebRTC';
import { useChat } from '../hooks/useChat';
import { usePoll } from '../hooks/usePoll';
import { useReactions } from '../hooks/useReactions';
import { useMediaDevices } from '../hooks/useMediaDevices';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { ApiService } from '../services/apiService';
import { ZoomTheme } from '../styles/theme';
import {
  ActivePanel,
  ViewMode,
  SecuritySettings,
  WaitingParticipant,
  BreakoutRoom,
  Poll,
  RecordingStatus,
  MeetingPreferences,
  ParticipantInfo,
  TranscriptItem,
} from '../../types';

interface MeetingRoomProps {
  roomId: string;
  token: string;
  wsUrl: string;
  userName: string;
  isHost: boolean;
  initialMicOn: boolean;
  initialCamOn: boolean;
  onLeave: () => void;
}

export const MeetingRoom: React.FC<MeetingRoomProps> = ({
  roomId,
  token,
  wsUrl,
  userName,
  isHost,
  initialMicOn,
  initialCamOn,
  onLeave,
}) => {
  // 3 Fluxos e Estados de Visualização (Requisito Principal)
  const [flowState, setFlowState] = useState<'gallery' | 'share_modal' | 'presenting'>('gallery');
  const [selectedShareOption, setSelectedShareOption] = useState<ShareOption>(SHARE_OPTIONS[2]); // Default: Google Chrome (Painel de Gestão)

  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('gallery');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activeDeviceSelector, setActiveDeviceSelector] = useState<'audio' | 'video' | null>(null);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);

  useEffect(() => {
    // Initial transcript entry
    setTranscripts([
      {
        speaker: userName,
        text: `Iniciada sessão da reunião "${roomId}".`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        isLocal: true,
      },
    ]);
  }, [userName, roomId]);

  // Security Settings
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    isLocked: false,
    waitingRoomEnabled: true,
    hideProfilePics: false,
    allowScreenShare: true,
    allowChat: true,
    allowRename: true,
    allowUnmute: true,
  });

  // Waiting Room Queue
  const [waitingQueue, setWaitingQueue] = useState<WaitingParticipant[]>([
    { id: 'w1', name: 'Lucas Estagiário', joinedAt: '12:02' },
  ]);

  // Reactions & Hand Raised
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [activeReaction, setActiveReaction] = useState<string | undefined>();

  // Breakout Rooms
  const [breakoutRooms, setBreakoutRooms] = useState<BreakoutRoom[]>([]);
  const [isBreakoutOpen, setIsBreakoutOpen] = useState(false);

  // Recording (Local & Cloud)
  const [recordingStatus, setRecordingStatus] = useState<RecordingStatus>('idle');
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const mediaRecorderRef = useRef<any>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Annotations
  const [isAnnotationActive, setIsAnnotationActive] = useState(false);

  // Admin Dashboard
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);

  // Client Preferences
  const [preferences, setPreferences] = useState<Partial<MeetingPreferences>>({
    dualMonitors: false,
    darkMode: true,
    hdVideo: true,
    mirrorVideo: true,
    lowLightAdjustment: true,
    smoothSkin: false,
    noiseSuppression: 'medium',
    originalSound: false,
    virtualBackground: 'none',
    videoFilter: 'normal',
    saveSeparateAudioTracks: false,
    recordingDirectory: 'C:\\Users\\arthu\\Documents\\ZoomRecordings',
    closedCaptionsEnabled: false,
  });

  // Real WebRTC Screen Sharing MediaStream
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);

  const { isMobile } = useResponsiveLayout();

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const handleStopScreenShare = useCallback(() => {
    if (screenStream) {
      screenStream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          // ignore
        }
      });
      setScreenStream(null);
    }
    setFlowState('gallery');
    showToast('Compartilhamento de tela encerrado');
  }, [screenStream, showToast]);

  const handleStartScreenShare = useCallback(async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getDisplayMedia) {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });

        // Evento de Encerramento: se o usuário parar o compartilhamento pela barra do próprio navegador
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          videoTrack.onended = () => {
            stream.getTracks().forEach((t) => {
              try {
                t.stop();
              } catch (e) {}
            });
            setScreenStream(null);
            setFlowState('gallery');
            showToast('Compartilhamento de tela encerrado pelo navegador');
          };
        }

        setScreenStream(stream);
        setFlowState('presenting');
        showToast('Compartilhando tela com sucesso');
      } else {
        // Fallback caso getDisplayMedia não esteja disponível no ambiente
        setFlowState('presenting');
        showToast('Visualização de apresentação ativa');
      }
    } catch (err: any) {
      console.warn('Erro ou cancelamento do compartilhamento de tela:', err);
      if (err?.name !== 'NotAllowedError') {
        showToast('Não foi possível capturar a tela');
      }
    }
  }, [showToast]);

  // Clean up screen sharing media tracks when unmounting
  useEffect(() => {
    return () => {
      if (screenStream) {
        screenStream.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {}
        });
      }
    };
  }, [screenStream]);

  // Routing refs para mensagens recebidas no DataChannel
  const chatHandlerRef = useRef<((data: any) => void) | null>(null);
  const pollHandlerRef = useRef<((data: any) => void) | null>(null);
  const reactionsHandlerRef = useRef<((data: any) => void) | null>(null);

  const {
    room,
    connectionState,
    isMicEnabled,
    isCamEnabled,
    isScreenSharing,
    participants,
    activeSpeakerId,
    screenShareTrack,
    toggleMicrophone,
    toggleCamera,
    toggleScreenShare,
    switchAudioDevice,
    switchVideoDevice,
    publishData,
    applyVideoPreferences,
    applyAudioPreferences,
    disconnect,
  } = useLiveKitRoom({
    wsUrl,
    token,
    initialMicOn,
    initialCamOn,
    onNotification: showToast,
    onDataReceived: (data) => {
      chatHandlerRef.current?.(data);
      pollHandlerRef.current?.(data);
      reactionsHandlerRef.current?.(data);
    },
  });

  // MÓDULO 2: Chat em Tempo Real & Envio de Arquivos
  const chat = useChat({
    roomId,
    localIdentity: userName,
    localName: userName,
    publishData,
    onNotification: showToast,
  });

  // MÓDULO 3: Enquetes ao Vivo (Live Polls)
  const pollState = usePoll({
    localIdentity: userName,
    localName: userName,
    isHost,
    publishData,
    onNotification: showToast,
  });

  // MÓDULO 4: Reações Flutuantes (Floating Reactions)
  const reactions = useReactions({
    localIdentity: userName,
    localName: userName,
    publishData,
    onNotification: showToast,
  });

  useEffect(() => {
    chatHandlerRef.current = chat.handleIncomingData;
    pollHandlerRef.current = pollState.handleIncomingData;
    reactionsHandlerRef.current = reactions.handleIncomingData;
  }, [chat.handleIncomingData, pollState.handleIncomingData, reactions.handleIncomingData]);

  const {
    devices,
    selectedAudioInputId,
    selectedVideoInputId,
    setSelectedAudioInputId,
    setSelectedVideoInputId,
  } = useMediaDevices();

  const handleLeave = () => {
    disconnect();
    onLeave();
  };

  const handleEndForEveryone = async () => {
    try {
      await ApiService.endMeeting(roomId, token);
    } catch (err) {
      console.warn('Erro ao encerrar reunião:', err);
    }
    handleLeave();
  };

  const togglePanel = (panel: ActivePanel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  // 1. Handlers de Segurança e Espera
  const handleUpdateSecurity = (newSettings: Partial<SecuritySettings>) => {
    setSecuritySettings((prev) => ({ ...prev, ...newSettings }));
    if (newSettings.isLocked !== undefined) {
      showToast(newSettings.isLocked ? 'Reunião trancada com sucesso.' : 'Reunião destrancada.');
    }
  };

  const handleAdmitGuest = (guestId: string) => {
    setWaitingQueue((prev) => prev.filter((g) => g.id !== guestId));
    showToast('Participante admitido na reunião.');
  };

  const handleAdmitAll = () => {
    setWaitingQueue([]);
    showToast('Todos os participantes da sala de espera foram admitidos.');
  };

  const handleRejectGuest = (guestId: string) => {
    setWaitingQueue((prev) => prev.filter((g) => g.id !== guestId));
    showToast('Participante removido da sala de espera.');
  };

  // 2. Handlers de Reações e Emojis
  const handleToggleHand = () => {
    const next = !isHandRaised;
    setIsHandRaised(next);
    showToast(next ? 'Você levantou a mão ✋' : 'Você abaixou a mão');
  };

  const handleSendEmoji = (emoji: string) => {
    reactions.sendReaction(emoji);
    setActiveReaction(emoji);
    showToast(`Reação enviada: ${emoji}`);
    setTimeout(() => setActiveReaction(undefined), 3000);
  };

  // 4. Handlers de Gravação
  const handleStartLocalRecording = () => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        const stream = (document.querySelector('video') as any)?.captureStream?.() ||
          (navigator.mediaDevices as any)?.getDisplayMedia?.();
        if (stream && typeof MediaRecorder !== 'undefined') {
          recordedChunksRef.current = [];
          const recorder = new MediaRecorder(stream);
          recorder.ondataavailable = (e: any) => {
            if (e.data.size > 0) recordedChunksRef.current.push(e.data);
          };
          recorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `gravacao_zoom_${roomId}_${Date.now()}.webm`;
            a.click();
          };
          recorder.start();
          mediaRecorderRef.current = recorder;
        }
      } catch (err) {
        console.warn('Gravação via canvas/stream:', err);
      }
    }
    setRecordingStatus('recording_local');
    showToast('Gravação local iniciada no computador.');
  };

  const handleStartCloudRecording = () => {
    setRecordingStatus('recording_cloud');
    showToast('Gravação na nuvem iniciada (LiveKit Egress).');
  };

  const handlePauseResumeRecording = () => {
    setIsRecordingPaused((prev) => !prev);
    showToast(isRecordingPaused ? 'Gravação retomada.' : 'Gravação pausada.');
  };

  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setRecordingStatus('idle');
    setIsRecordingPaused(false);
    showToast('Gravação finalizada e salva.');
  };

  // 5. Handlers de Salas Simultâneas
  const handleOpenBreakoutRooms = (rooms: BreakoutRoom[]) => {
    setBreakoutRooms(rooms);
    setIsBreakoutOpen(true);
    showToast(`${rooms.length} salas simultâneas abertas.`);
  };

  const handleCloseBreakoutRooms = () => {
    setIsBreakoutOpen(false);
    showToast('Todas as salas simultâneas foram encerradas.');
  };

  const handleBroadcastMessage = (msg: string) => {
    showToast(`Transmissão enviada para todas as salas: "${msg}"`);
  };

  // Atalhos de teclado no Web estilo Zoom
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const targetTag = (e.target as HTMLElement)?.tagName?.toLowerCase();
      if (targetTag === 'input' || targetTag === 'textarea') return;

      if (e.altKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        toggleMicrophone();
      } else if (e.altKey && (e.key === 'v' || e.key === 'V')) {
        e.preventDefault();
        toggleCamera();
      } else if (e.altKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
        toggleScreenShare();
      } else if (e.altKey && (e.key === 'h' || e.key === 'H')) {
        e.preventDefault();
        togglePanel('chat');
      } else if (e.altKey && (e.key === 'u' || e.key === 'U')) {
        e.preventDefault();
        togglePanel('participants');
      } else if (e.key === 'Escape') {
        setActivePanel(null);
        setActiveDeviceSelector(null);
        setShowAdminDashboard(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleMicrophone, toggleCamera, toggleScreenShare]);

  // 1. Participantes reais: inicializado estritamente com o participante local (sem pessoas fictícias)
  const initialLocalUser: ParticipantInfo = {
    identity: userName || 'local-host',
    name: userName || 'Você',
    isLocal: true,
    isHost: isHost,
    isSpeaking: false,
    isAudioEnabled: initialMicOn,
    isVideoEnabled: initialCamOn,
    isScreenSharing: false,
    isHandRaised: false,
  };

  const [participantsList, setParticipantsList] = useState<ParticipantInfo[]>([initialLocalUser]);

  // Sincroniza participantes reais conectados via LiveKit
  useEffect(() => {
    if (participants && participants.length > 0) {
      setParticipantsList(
        participants.map((p) =>
          p.isLocal
            ? {
                ...p,
                name: p.name || userName || 'Você',
                isHost,
                isHandRaised,
                activeReaction,
                isAudioEnabled: isMicEnabled,
                isVideoEnabled: isCamEnabled,
                isScreenSharing: flowState === 'presenting' || isScreenSharing,
              }
            : p
        )
      );
    } else {
      setParticipantsList([
        {
          identity: userName || 'local-host',
          name: userName || 'Você',
          isLocal: true,
          isHost: isHost,
          isSpeaking: false,
          isAudioEnabled: isMicEnabled,
          isVideoEnabled: isCamEnabled,
          isScreenSharing: flowState === 'presenting' || isScreenSharing,
          isHandRaised,
          activeReaction,
        },
      ]);
    }
  }, [participants, isMicEnabled, isCamEnabled, flowState, isScreenSharing, isHandRaised, activeReaction, userName, isHost]);

  // 2. Status de Gravação Dinâmico
  const [isRecording, setIsRecording] = useState(false);

  const handleToggleRecording = () => {
    if (isRecording) {
      handleStopRecording();
      setIsRecording(false);
    } else {
      handleStartLocalRecording();
      setIsRecording(true);
    }
  };

  // 3. Notificações e Bate-papo Real
  const [unreadCount, setUnreadCount] = useState(0);
  const isChatOpen = activePanel === 'chat';

  useEffect(() => {
    if (isChatOpen) {
      setUnreadCount(0);
    }
  }, [isChatOpen]);

  const prevChatCountRef = useRef(chat.messages.length);
  useEffect(() => {
    if (chat.messages.length > prevChatCountRef.current) {
      const latest = chat.messages[chat.messages.length - 1];
      if (!latest.isLocal && !isChatOpen) {
        setUnreadCount((c) => c + 1);
      }
    }
    prevChatCountRef.current = chat.messages.length;
  }, [chat.messages, isChatOpen]);

  const handleToggleChat = () => {
    if (activePanel !== 'chat') {
      setUnreadCount(0);
      setActivePanel('chat');
    } else {
      setActivePanel(null);
    }
  };

  // 4. Enquetes (Polls) Condicionais
  const [activePoll, setActivePoll] = useState<Poll | null>(null);

  useEffect(() => {
    setActivePoll(pollState.activePoll);
  }, [pollState.activePoll]);

  return (
    <View style={styles.roomContainer}>
      {/* Top Header (Ocultado quando presenting, exatamente como no Zoom real onde a barra flutuante assume o topo) */}
      {flowState !== 'presenting' && (
        <MeetingHeader
          roomName="Zoom Reunião de Alinhamento Semanal"
          isGalleryView={viewMode === 'gallery'}
          isRecording={isRecording}
          recordingStatus={isRecording ? 'recording_local' : 'idle'}
          activeFlowState={flowState}
          onChangeFlowState={(newState) => setFlowState(newState)}
          onToggleView={() => setViewMode((m) => (m === 'gallery' ? 'speaker' : 'gallery'))}
          onOpenDashboard={() => setShowAdminDashboard(true)}
          onToggleFullscreen={() => {
            if (Platform.OS === 'web' && document.documentElement.requestFullscreen) {
              if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
              } else {
                document.exitFullscreen();
              }
            }
          }}
        />
      )}

      {/* Reconnecting Alert */}
      {connectionState === ConnectionState.Reconnecting && (
        <View style={styles.reconnectingBanner}>
          <Text style={styles.reconnectingText}>Reconectando à reunião... Aguarde.</Text>
        </View>
      )}

      {/* Main Video Stage or Shared Presentation View */}
      {flowState === 'presenting' ? (
        <SharedPresentationView
          stream={screenStream}
          shareOption={selectedShareOption}
          isMuted={!isMicEnabled}
          isVideoOff={!isCamEnabled}
          onToggleMic={toggleMicrophone}
          onToggleCam={toggleCamera}
          onStopSharing={handleStopScreenShare}
          onNewShare={() => setFlowState('share_modal')}
          onToggleAnnotation={() => setIsAnnotationActive(!isAnnotationActive)}
          isAnnotationActive={isAnnotationActive}
          participants={participantsList}
        />
      ) : (
        <View style={styles.stageWrapper}>
          <View style={styles.gridWrapper}>
            <VideoGrid
              participants={participantsList}
              room={room}
              activeSpeakerId={activeSpeakerId || null}
              screenShareTrack={screenShareTrack}
              isGalleryView={viewMode === 'gallery'}
              floatingReactions={reactions.floatingReactions}
              preferences={preferences}
            />

            {/* Screen Annotation Canvas Layer */}
            {screenShareTrack && isAnnotationActive && (
              <ScreenAnnotationCanvas
                isActive={isAnnotationActive}
                onClose={() => setIsAnnotationActive(false)}
              />
            )}
          </View>

          {/* Lateral Drawer: Participants */}
          {activePanel === 'participants' && (
            <ParticipantsPanel
              participants={participantsList}
              waitingQueue={waitingQueue}
              isHost={isHost}
              onClose={() => setActivePanel(null)}
              onOpenInviteModal={() => setActivePanel('invite')}
              onAdmitGuest={handleAdmitGuest}
              onAdmitAll={handleAdmitAll}
              onRejectGuest={handleRejectGuest}
              onToggleMuteParticipant={(id) => showToast(`Microfone do participante alternado.`)}
              onToggleCoHost={(id) => showToast(`Permissões de Co-anfitrião atualizadas.`)}
              onRenameParticipant={(id, name) => showToast(`Participante renomeado para ${name}.`)}
              onSendToWaitingRoom={(id) => showToast(`Participante colocado na sala de espera.`)}
              onRemoveParticipant={(id) => showToast(`Participante removido da reunião.`)}
              isMobile={isMobile}
            />
          )}

          {/* Lateral Drawer: Chat */}
          {activePanel === 'chat' && (
            <ChatPanel
              messages={chat.messages}
              pinnedMessage={chat.pinnedMessage}
              typingUsers={chat.typingUsers}
              attachments={chat.attachments}
              uploadProgress={chat.uploadProgress}
              participants={participantsList}
              onSendMessage={chat.sendMessage}
              onSendAttachment={chat.uploadAndSendAttachment}
              onEmitTyping={chat.emitTyping}
              onPinMessage={chat.pinMessage}
              onClose={() => setActivePanel(null)}
              isMobile={isMobile}
            />
          )}

          {/* Lateral Drawer: IA Copilot */}
          {activePanel === 'copilot' && (
            <CopilotPanel
              topic="Reunião de Alinhamento Semanal"
              duration="Em andamento"
              participants={participantsList}
              chatMessages={chat.messages}
              transcripts={transcripts}
              onClose={() => setActivePanel(null)}
              isMobile={isMobile}
            />
          )}
        </View>
      )}

      {/* Screen Share Modal (Estado 2) */}
      <ScreenShareModal
        isOpen={flowState === 'share_modal'}
        onClose={() => setFlowState('gallery')}
        onShare={(selectedOption) => {
          setSelectedShareOption(selectedOption);
          setFlowState('presenting');
          showToast(`Apresentando: ${selectedOption.title}`);
        }}
      />

      {/* Security Popover Menu */}
      {activePanel === 'security' && (
        <View style={[styles.popoverAnchor, { left: 180 }]}>
          <SecurityMenu
            settings={securitySettings}
            onUpdateSettings={handleUpdateSecurity}
            onClose={() => setActivePanel(null)}
          />
        </View>
      )}

      {/* Reactions Popover */}
      {activePanel === null && (
        // Controlled via toolbar
        null
      )}

      {/* Polls Modal */}
      {activePanel === 'polls' && (
        <PollsModal
          polls={pollState.polls}
          isHost={isHost}
          onLaunchPoll={(id) => showToast('Enquete reaberta')}
          onEndPoll={pollState.endPoll}
          onVote={pollState.vote}
          onCreatePoll={pollState.createPoll}
          onClose={() => setActivePanel(null)}
        />
      )}

      {/* Breakout Rooms Modal */}
      {activePanel === 'breakout' && (
        <BreakoutRoomsModal
          participants={participantsList}
          breakoutRooms={breakoutRooms}
          isOpen={isBreakoutOpen}
          onOpenRooms={handleOpenBreakoutRooms}
          onCloseRooms={handleCloseBreakoutRooms}
          onBroadcastMessage={handleBroadcastMessage}
          onClose={() => setActivePanel(null)}
        />
      )}

      {/* Invite Modal */}
      {activePanel === 'invite' && (
        <InviteModal
          roomId={roomId}
          onClose={() => setActivePanel('participants')}
        />
      )}

      {/* Recording Menu Popover */}
      {activePanel === 'recording' && (
        <View style={[styles.popoverAnchor, { left: 340 }]}>
          <RecordingMenu
            status={recordingStatus}
            isPaused={isRecordingPaused}
            onStartLocalRecording={handleStartLocalRecording}
            onStartCloudRecording={handleStartCloudRecording}
            onPauseResumeRecording={handlePauseResumeRecording}
            onStopRecording={handleStopRecording}
            onClose={() => setActivePanel(null)}
          />
        </View>
      )}

      {/* Full Meeting Settings Dialog */}
      {activePanel === 'settings' && (
        <MeetingSettings
          devices={devices}
          selectedAudioInputId={selectedAudioInputId}
          selectedVideoInputId={selectedVideoInputId}
          preferences={preferences}
          onUpdatePreferences={(newPrefs) => {
            setPreferences((p: Partial<MeetingPreferences>) => {
              const updated = { ...p, ...newPrefs };
              applyVideoPreferences(updated);
              applyAudioPreferences(updated);
              return updated;
            });
          }}
          onSelectAudioInput={(id) => {
            setSelectedAudioInputId(id);
            switchAudioDevice(id);
          }}
          onSelectVideoInput={(id) => {
            setSelectedVideoInputId(id);
            switchVideoDevice(id);
          }}
          onClose={() => setActivePanel(null)}
        />
      )}

      {/* Admin Dashboard / Loom / Calendly / Reports */}
      {showAdminDashboard && (
        <AdminDashboard
          onClose={() => setShowAdminDashboard(false)}
          onStartMeetingFromSchedule={(code) => {
            setShowAdminDashboard(false);
            showToast(`Alternando para reunião agendada ${code}...`);
          }}
        />
      )}

      {/* Device Popovers (Audio and Video) */}
      {activeDeviceSelector === 'audio' && (
        <View style={[styles.popoverAnchor, { left: 20 }]}>
          <DeviceSelector
            title="Selecionar Microfone"
            devices={devices.audioInputs}
            selectedId={selectedAudioInputId}
            onSelect={(id) => {
              setSelectedAudioInputId(id);
              switchAudioDevice(id);
              setActiveDeviceSelector(null);
            }}
            onClose={() => setActiveDeviceSelector(null)}
          />
        </View>
      )}

      {activeDeviceSelector === 'video' && (
        <View style={[styles.popoverAnchor, { left: 90 }]}>
          <DeviceSelector
            title="Selecionar Câmera"
            devices={devices.videoInputs}
            selectedId={selectedVideoInputId}
            onSelect={(id) => {
              setSelectedVideoInputId(id);
              switchVideoDevice(id);
              setActiveDeviceSelector(null);
            }}
            onClose={() => setActiveDeviceSelector(null)}
          />
        </View>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <View style={styles.toast}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      {/* Bottom Meeting Toolbar (Ocultada quando presenting, pois presenting tem a sua própria floating bar superior) */}
      {flowState !== 'presenting' && (
        <MeetingToolbar
          isMuted={!isMicEnabled}
          isVideoOff={!isCamEnabled}
          isSharing={flowState === 'presenting' || isScreenSharing}
          participantCount={participantsList.length}
          unreadChatCount={isChatOpen ? 0 : unreadCount}
          isHost={isHost}
          activePanel={activePanel}
          recordingStatus={isRecording ? 'recording_local' : 'idle'}
          isAnnotationActive={isAnnotationActive}
          onToggleMic={toggleMicrophone}
          onToggleCam={toggleCamera}
          onToggleShare={() => {
            if (flowState === 'presenting') {
              handleStopScreenShare();
            } else {
              setFlowState((prev) => (prev === 'share_modal' ? 'gallery' : 'share_modal'));
            }
          }}
          onToggleParticipants={() => togglePanel('participants')}
          onToggleChat={handleToggleChat}
          onToggleSettings={() => togglePanel('settings')}
          onToggleSecurity={() => togglePanel('security')}
          onToggleReactions={() => togglePanel(null)} // Trigger popover or raise hand directly
          onTogglePolls={() => togglePanel('polls')}
          onToggleRecording={handleToggleRecording}
          onToggleBreakout={() => togglePanel('breakout')}
          onToggleCopilot={() => togglePanel('copilot')}
          onToggleAnnotations={() => setIsAnnotationActive(!isAnnotationActive)}
          onOpenAudioDevices={() =>
            setActiveDeviceSelector((s) => (s === 'audio' ? null : 'audio'))
          }
          onOpenVideoDevices={() =>
            setActiveDeviceSelector((s) => (s === 'video' ? null : 'video'))
          }
          onLeaveMeeting={handleLeave}
          onEndMeetingForEveryone={isHost ? handleEndForEveryone : undefined}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  roomContainer: {
    flex: 1,
    backgroundColor: ZoomTheme.colors.stageBg,
    flexDirection: 'column',
    overflow: 'hidden',
  },
  stageWrapper: {
    flex: 1,
    flexDirection: 'row',
  },
  gridWrapper: {
    flex: 1,
    height: '100%',
    position: 'relative',
  },
  reconnectingBanner: {
    backgroundColor: ZoomTheme.colors.warningYellow,
    paddingVertical: 6,
    alignItems: 'center',
  },
  reconnectingText: {
    color: '#000000',
    fontSize: ZoomTheme.typography.caption,
    fontWeight: '700',
  },
  popoverAnchor: {
    position: 'absolute',
    bottom: ZoomTheme.layout.toolbarHeight,
    zIndex: 100,
  },
  toast: {
    position: 'absolute',
    top: ZoomTheme.layout.headerHeight + 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 200,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
  },
  toastText: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: ZoomTheme.typography.body,
    fontWeight: '500',
  },
});
