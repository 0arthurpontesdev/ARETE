import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Video as VideoIcon,
  PlusCircle,
  ArrowRight,
  Settings,
  ChevronDown,
  Volume2,
  AlertCircle,
  LayoutDashboard,
} from 'lucide-react-native';
import { ZoomTheme } from '../../styles/theme';
import { useMediaDevices } from '../../hooks/useMediaDevices';
import { AdminDashboard } from '../admin/AdminDashboard';

interface WaitingRoomProps {
  initialRoomId?: string;
  onJoinMeeting: (params: { roomId: string; userName: string; isHost: boolean; micOn: boolean; camOn: boolean }) => void;
  onCreateMeeting: (params: { userName: string; micOn: boolean; camOn: boolean }) => void;
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({
  initialRoomId = '',
  onJoinMeeting,
  onCreateMeeting,
}) => {
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState(initialRoomId);
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [activeTab, setActiveTab] = useState<'create' | 'join'>(initialRoomId ? 'join' : 'create');
  const [showDeviceConfig, setShowDeviceConfig] = useState(false);
  const [showAdminDashboard, setShowAdminDashboard] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const {
    devices,
    selectedAudioInputId,
    selectedVideoInputId,
    setSelectedAudioInputId,
    setSelectedVideoInputId,
  } = useMediaDevices();

  useEffect(() => {
    if (initialRoomId) {
      setRoomId(initialRoomId);
      setActiveTab('join');
    }
  }, [initialRoomId]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    setPermissionError(null);

    if (Platform.OS === 'web' && camOn) {
      const constraints: MediaStreamConstraints = {
        video: selectedVideoInputId ? { deviceId: { exact: selectedVideoInputId } } : true,
        audio: false,
      };

      navigator.mediaDevices
        ?.getUserMedia(constraints)
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          console.warn('Permissão de vídeo não concedida no preview:', err);
          setPermissionError('Permissão da câmera necessária para pré-visualização.');
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [camOn, selectedVideoInputId]);

  const handleJoin = () => {
    if (!userName.trim() || !roomId.trim()) return;
    onJoinMeeting({
      roomId: roomId.trim(),
      userName: userName.trim(),
      isHost: false,
      micOn,
      camOn,
    });
  };

  const handleCreate = () => {
    if (!userName.trim()) return;
    onCreateMeeting({
      userName: userName.trim(),
      micOn,
      camOn,
    });
  };

  const initials = userName.trim()
    ? userName
        .trim()
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'EU';

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Brand Header */}
        <View style={styles.logoRow}>
          <View style={styles.brandIconWrapper}>
            <VideoIcon size={24} color="#FFFFFF" />
          </View>
          <View>
            <Text style={styles.brandText}>Zoom Videoconferência</Text>
            <Text style={styles.brandSubtitle}>Comunicação em Tempo Real com LiveKit WebRTC</Text>
          </View>
        </View>

        {/* Camera Preview Box */}
        <View style={styles.previewBox}>
          {Platform.OS === 'web' && camOn && !permissionError && (
            <video
              ref={videoRef as any}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
              }}
            />
          )}

          {(!camOn || permissionError) && (
            <View style={styles.camOffPlaceholder}>
              {permissionError ? (
                <>
                  <AlertCircle size={36} color={ZoomTheme.colors.warningYellow} />
                  <Text style={styles.warningText}>{permissionError}</Text>
                </>
              ) : (
                <>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{initials}</Text>
                  </View>
                  <Text style={styles.camOffText}>Câmera Desligada</Text>
                </>
              )}
            </View>
          )}

          {/* Floating Pill Controls over Preview */}
          <View style={styles.previewControlsOverlay}>
            <TouchableOpacity
              style={[styles.mediaPillBtn, !micOn && styles.mediaPillBtnOff]}
              onPress={() => setMicOn(!micOn)}
              accessibilityLabel={micOn ? 'Desativar microfone no teste' : 'Ativar microfone no teste'}
            >
              {micOn ? <Mic size={16} color="#FFFFFF" /> : <MicOff size={16} color="#FFFFFF" />}
              <Text style={styles.mediaPillBtnText}>{micOn ? 'Microfone Ativo' : 'Mudo'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mediaPillBtn, !camOn && styles.mediaPillBtnOff]}
              onPress={() => setCamOn(!camOn)}
              accessibilityLabel={camOn ? 'Desativar câmera no teste' : 'Ativar câmera no teste'}
            >
              {camOn ? <Video size={16} color="#FFFFFF" /> : <VideoOff size={16} color="#FFFFFF" />}
              <Text style={styles.mediaPillBtnText}>{camOn ? 'Vídeo Ativo' : 'Sem Vídeo'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mediaPillBtn, showDeviceConfig && styles.mediaPillBtnActive]}
              onPress={() => setShowDeviceConfig(!showDeviceConfig)}
              accessibilityLabel="Configurar dispositivos de áudio e vídeo"
            >
              <Settings size={15} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Device Selector Accordion */}
        {showDeviceConfig && (
          <View style={styles.devicesDropdownCard}>
            <Text style={styles.deviceCardTitle}>Dispositivos Pré-selecionados</Text>
            
            <View style={styles.deviceRow}>
              <Mic size={14} color={ZoomTheme.colors.textSecondary} />
              <Text style={styles.deviceLabel}>Microfone:</Text>
              <select
                value={selectedAudioInputId}
                onChange={(e) => setSelectedAudioInputId(e.target.value)}
                style={selectStyle}
              >
                {devices.audioInputs.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Microfone (${d.deviceId.slice(0, 5)})`}
                  </option>
                ))}
              </select>
            </View>

            <View style={styles.deviceRow}>
              <Video size={14} color={ZoomTheme.colors.textSecondary} />
              <Text style={styles.deviceLabel}>Câmera:</Text>
              <select
                value={selectedVideoInputId}
                onChange={(e) => setSelectedVideoInputId(e.target.value)}
                style={selectStyle}
              >
                {devices.videoInputs.map((d) => (
                  <option key={d.deviceId} value={d.deviceId}>
                    {d.label || `Câmera (${d.deviceId.slice(0, 5)})`}
                  </option>
                ))}
              </select>
            </View>
          </View>
        )}

        {/* Modern Tab Bar */}
        <View style={styles.tabHeader}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'create' && styles.activeTabBtn]}
            onPress={() => setActiveTab('create')}
            accessibilityLabel="Aba Nova Reunião"
          >
            <PlusCircle
              size={16}
              color={activeTab === 'create' ? ZoomTheme.colors.zoomBlue : ZoomTheme.colors.textSecondary}
            />
            <Text style={[styles.tabBtnText, activeTab === 'create' && styles.activeTabBtnText]}>
              Nova Reunião
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'join' && styles.activeTabBtn]}
            onPress={() => setActiveTab('join')}
            accessibilityLabel="Aba Entrar em Reunião"
          >
            <ArrowRight
              size={16}
              color={activeTab === 'join' ? ZoomTheme.colors.zoomBlue : ZoomTheme.colors.textSecondary}
            />
            <Text style={[styles.tabBtnText, activeTab === 'join' && styles.activeTabBtnText]}>
              Entrar em Reunião
            </Text>
          </TouchableOpacity>
        </View>

        {/* Input Form */}
        <View style={styles.form}>
          <Text style={styles.inputLabel}>Seu Nome de Exibição</Text>
          <TextInput
            style={styles.input}
            placeholder="Digite seu nome (ex: Arthur Silva)"
            placeholderTextColor={ZoomTheme.colors.textMuted}
            value={userName}
            onChangeText={setUserName}
            onSubmitEditing={activeTab === 'create' ? handleCreate : undefined}
            autoFocus
          />

          {activeTab === 'join' && (
            <>
              <Text style={styles.inputLabel}>ID ou Código da Reunião</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 582-194-3942 ou standup-team"
                placeholderTextColor={ZoomTheme.colors.textMuted}
                value={roomId}
                onChangeText={setRoomId}
                onSubmitEditing={handleJoin}
              />
            </>
          )}

          {activeTab === 'create' ? (
            <TouchableOpacity
              style={[styles.primaryBtn, !userName.trim() && styles.primaryBtnDisabled]}
              onPress={handleCreate}
              disabled={!userName.trim()}
              accessibilityRole="button"
              accessibilityLabel="Iniciar Reunião (Anfitrião)"
              activeOpacity={0.85}
            >
              <VideoIcon size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Iniciar Reunião (Anfitrião)</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.primaryBtn, (!userName.trim() || !roomId.trim()) && styles.primaryBtnDisabled]}
              onPress={handleJoin}
              disabled={!userName.trim() || !roomId.trim()}
              accessibilityRole="button"
              accessibilityLabel="Entrar na Reunião"
              activeOpacity={0.85}
            >
              <ArrowRight size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Entrar na Reunião</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Security & Encryption Footer Note */}
        <View style={styles.footerNoteRow}>
          <Text style={styles.footerNoteText}>
            Sessão protegida por tokens criptografados e conexão segura WebRTC.
          </Text>
          <TouchableOpacity
            style={styles.adminDashboardBtn}
            onPress={() => setShowAdminDashboard(true)}
            accessibilityLabel="Abrir Portal de Gestão"
          >
            <LayoutDashboard size={14} color={ZoomTheme.colors.zoomBlue} />
            <Text style={styles.adminDashboardBtnText}>
              Acessar Painel de Gestão (Clipes Loom, Agendador & Relatórios)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Admin Dashboard Modal */}
      {showAdminDashboard && (
        <AdminDashboard
          onClose={() => setShowAdminDashboard(false)}
          onStartMeetingFromSchedule={(scheduledCode) => {
            setShowAdminDashboard(false);
            setRoomId(scheduledCode);
            setActiveTab('join');
          }}
        />
      )}
    </View>
  );
};

const selectStyle: React.CSSProperties = {
  flex: 1,
  backgroundColor: ZoomTheme.colors.inputBg,
  color: ZoomTheme.colors.textPrimary,
  border: `1px solid ${ZoomTheme.colors.borderSubtle}`,
  borderRadius: 4,
  padding: '4px 8px',
  fontSize: 12,
  outline: 'none',
  cursor: 'pointer',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ZoomTheme.colors.stageBg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: ZoomTheme.colors.panelBg,
    borderRadius: ZoomTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    padding: 24,
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  brandIconWrapper: {
    backgroundColor: ZoomTheme.colors.zoomBlue,
    padding: 10,
    borderRadius: ZoomTheme.borderRadius.md,
    shadowColor: ZoomTheme.colors.zoomBlue,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  brandText: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: ZoomTheme.typography.title,
    fontWeight: ZoomTheme.typography.weights.bold,
  },
  brandSubtitle: {
    color: ZoomTheme.colors.textMuted,
    fontSize: ZoomTheme.typography.caption,
    marginTop: 2,
  },
  previewBox: {
    width: '100%',
    height: 230,
    backgroundColor: ZoomTheme.colors.tileBg,
    borderRadius: ZoomTheme.borderRadius.md,
    overflow: 'hidden',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
  },
  camOffPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: ZoomTheme.colors.zoomBlue,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  camOffText: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: ZoomTheme.typography.bodySmall,
  },
  warningText: {
    color: ZoomTheme.colors.warningYellow,
    fontSize: ZoomTheme.typography.bodySmall,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  previewControlsOverlay: {
    position: 'absolute',
    bottom: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mediaPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  mediaPillBtnOff: {
    backgroundColor: ZoomTheme.colors.dangerRed,
  },
  mediaPillBtnActive: {
    backgroundColor: ZoomTheme.colors.zoomBlue,
  },
  mediaPillBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  devicesDropdownCard: {
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: ZoomTheme.borderRadius.sm,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    gap: 8,
  },
  deviceCardTitle: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deviceLabel: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 12,
    width: 68,
  },
  tabHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: ZoomTheme.colors.borderSubtle,
    marginBottom: 18,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabBtn: {
    borderBottomColor: ZoomTheme.colors.zoomBlue,
  },
  tabBtnText: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: ZoomTheme.typography.body,
    fontWeight: '500',
  },
  activeTabBtnText: {
    color: ZoomTheme.colors.zoomBlue,
    fontWeight: '700',
  },
  form: {
    gap: 12,
  },
  inputLabel: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: ZoomTheme.typography.bodySmall,
    fontWeight: '500',
  },
  input: {
    backgroundColor: ZoomTheme.colors.inputBg,
    color: ZoomTheme.colors.textPrimary,
    borderRadius: ZoomTheme.borderRadius.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: ZoomTheme.typography.body,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
  },
  primaryBtn: {
    backgroundColor: ZoomTheme.colors.zoomBlue,
    borderRadius: ZoomTheme.borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    shadowColor: ZoomTheme.colors.zoomBlue,
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  primaryBtnDisabled: {
    backgroundColor: ZoomTheme.colors.disabledBg,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    shadowOpacity: 0,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: ZoomTheme.typography.body,
    fontWeight: '700',
  },
  footerNoteRow: {
    marginTop: 18,
    alignItems: 'center',
    gap: 10,
  },
  footerNoteText: {
    color: ZoomTheme.colors.textMuted,
    fontSize: ZoomTheme.typography.caption,
    textAlign: 'center',
  },
  adminDashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(14, 114, 237, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(14, 114, 237, 0.2)',
  },
  adminDashboardBtnText: {
    color: ZoomTheme.colors.zoomBlue,
    fontSize: 11,
    fontWeight: '600',
  },
});
