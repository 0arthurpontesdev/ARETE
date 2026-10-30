import { useLiveKitRoom } from './useLiveKitRoom';
import { RemoteParticipant } from 'livekit-client';

export interface UseWebRTCProps {
  wsUrl: string;
  token: string;
  autoConnect?: boolean;
  initialMicOn?: boolean;
  initialCamOn?: boolean;
  onNotification?: (msg: string) => void;
  onDataReceived?: (data: any, participant?: RemoteParticipant) => void;
}

/**
 * MÓDULO 1: WebRTC & Transmissão de Vídeo/Áudio Real
 * - Captura e controle de streams de câmera e microfone com getUserMedia / LiveKit
 * - Conexão multi-usuário com LiveKit SFU (peer-joined, peer-left, dynamic grid)
 * - Voice Activity Detection (VAD) destacando participante ativo com borda verde (#22c55e)
 * - Fallback de avatar com iniciais quando vídeo estiver desativado
 */
export function useWebRTC(props: UseWebRTCProps) {
  const roomControls = useLiveKitRoom(props);

  return {
    ...roomControls,
    // Aliases para conveniência e conformidade com a especificação do Módulo 1
    toggleAudio: roomControls.toggleMicrophone,
    toggleVideo: roomControls.toggleCamera,
    isMicMuted: !roomControls.isMicEnabled,
    isVideoOff: !roomControls.isCamEnabled,
  };
}
