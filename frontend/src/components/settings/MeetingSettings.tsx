import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Platform } from 'react-native';
import {
  X,
  Mic,
  Video,
  Volume2,
  Shield,
  Check,
  Info,
  Sparkles,
  Image as ImageIcon,
  HardDrive,
  Keyboard,
  Sun,
  Moon,
  Tv,
  Subtitles,
  Upload,
  Play,
  Square,
  Sparkle,
} from 'lucide-react-native';
import { ZoomTheme } from '../../styles/theme';
import { DeviceList } from '../../hooks/useMediaDevices';
import { MeetingPreferences } from '../../types';
import {
  BACKGROUND_OPTIONS,
  FILTER_OPTIONS,
  getBackgroundDetails,
  computeCombinedVideoFilter,
} from '../../utils/mediaEffects';
import {
  playSpeakerTestChime,
  getAudioConstraints,
  AudioMeter,
} from '../../utils/audioEffects';
import { VirtualVideoRenderer } from '../video/VirtualVideoRenderer';

interface MeetingSettingsProps {
  devices: DeviceList;
  selectedAudioInputId: string;
  selectedVideoInputId: string;
  preferences?: Partial<MeetingPreferences>;
  onUpdatePreferences?: (prefs: Partial<MeetingPreferences>) => void;
  onSelectAudioInput: (id: string) => void;
  onSelectVideoInput: (id: string) => void;
  onClose: () => void;
}

export const MeetingSettings: React.FC<MeetingSettingsProps> = ({
  devices,
  selectedAudioInputId,
  selectedVideoInputId,
  preferences,
  onUpdatePreferences,
  onSelectAudioInput,
  onSelectVideoInput,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'audio' | 'video' | 'background' | 'general' | 'recording'>('audio');

  // Local state initialized with preferences or Zoom defaults
  const [hdVideo, setHdVideo] = useState(preferences?.hdVideo ?? true);
  const [mirrorVideo, setMirrorVideo] = useState(preferences?.mirrorVideo ?? true);
  const [lowLight, setLowLight] = useState(preferences?.lowLightAdjustment ?? true);
  const [smoothSkin, setSmoothSkin] = useState(preferences?.smoothSkin ?? false);
  const [noiseSuppression, setNoiseSuppression] = useState<'low' | 'medium' | 'high'>(
    preferences?.noiseSuppression ?? 'medium'
  );
  const [originalSound, setOriginalSound] = useState(preferences?.originalSound ?? false);
  const [selectedBg, setSelectedBg] = useState(preferences?.virtualBackground ?? 'none');
  const [selectedFilter, setSelectedFilter] = useState(preferences?.videoFilter ?? 'normal');
  const [customBgUrl, setCustomBgUrl] = useState<string | undefined>(undefined);
  const [dualMonitors, setDualMonitors] = useState(preferences?.dualMonitors ?? false);
  const [darkMode, setDarkMode] = useState(preferences?.darkMode ?? true);
  const [closedCaptions, setClosedCaptions] = useState(preferences?.closedCaptionsEnabled ?? false);
  const [recordingDir, setRecordingDir] = useState(
    preferences?.recordingDirectory ?? 'C:\\Users\\arthu\\Documents\\ZoomRecordings'
  );
  const [saveSeparateTracks, setSaveSeparateTracks] = useState(
    preferences?.saveSeparateAudioTracks ?? false
  );

  // Live preview stream for settings
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [micLevel, setMicLevel] = useState<number>(0);
  const [isTestingMic, setIsTestingMic] = useState(false);
  const [isTestingSpeaker, setIsTestingSpeaker] = useState(false);
  const [micTestStatus, setMicTestStatus] = useState<string>('');

  const audioMeterRef = useRef<AudioMeter | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUpdate = (updates: Partial<MeetingPreferences>) => {
    if (onUpdatePreferences) {
      onUpdatePreferences(updates);
    }
  };

  // Preview Stream & Audio Meter initialization
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    let active = true;
    let stream: MediaStream | null = null;

    const startPreview = async () => {
      if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) return;
      try {
        const videoConstraints = selectedVideoInputId
          ? {
              deviceId: { exact: selectedVideoInputId },
              width: hdVideo ? { ideal: 1920 } : { ideal: 1280 },
              height: hdVideo ? { ideal: 1080 } : { ideal: 720 },
            }
          : {
              width: hdVideo ? { ideal: 1920 } : { ideal: 1280 },
              height: hdVideo ? { ideal: 1080 } : { ideal: 720 },
            };

        const audioConstraints = getAudioConstraints(noiseSuppression, originalSound, selectedAudioInputId);

        stream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: audioConstraints,
        });

        if (!active) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        setPreviewStream(stream);

        // Start Audio Meter
        if (stream.getAudioTracks().length > 0) {
          if (!audioMeterRef.current) {
            audioMeterRef.current = new AudioMeter((level) => {
              if (active) setMicLevel(level);
            });
          }
          audioMeterRef.current.start(stream);
        }
      } catch (err) {
        console.warn('Erro ao inicializar preview de mídia:', err);
      }
    };

    startPreview();

    return () => {
      active = false;
      if (audioMeterRef.current) {
        audioMeterRef.current.stop();
      }
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [selectedVideoInputId, selectedAudioInputId, hdVideo, noiseSuppression, originalSound]);

  // Audio: Test Speaker
  const handleTestSpeaker = async () => {
    if (isTestingSpeaker) return;
    setIsTestingSpeaker(true);
    await playSpeakerTestChime();
    setIsTestingSpeaker(false);
  };

  // Audio: Test Microphone (record 3s, then play back)
  const handleTestMicrophone = () => {
    if (isTestingMic) return;
    if (!previewStream || previewStream.getAudioTracks().length === 0) {
      setMicTestStatus('Microfone indisponível');
      setTimeout(() => setMicTestStatus(''), 2500);
      return;
    }

    try {
      setIsTestingMic(true);
      setMicTestStatus('Gravando... fale algo (3s)');
      audioChunksRef.current = [];

      const recorder = new MediaRecorder(previewStream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        setMicTestStatus('Reproduzindo áudio...');
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          setIsTestingMic(false);
          setMicTestStatus('Teste de voz concluído!');
          setTimeout(() => setMicTestStatus(''), 2500);
        };
        audio.play().catch(() => {
          setIsTestingMic(false);
          setMicTestStatus('');
        });
      };

      recorder.start();
      setTimeout(() => {
        if (recorder.state === 'recording') {
          recorder.stop();
        }
      }, 3000);
    } catch (e) {
      console.warn('Erro ao gravar teste de microfone:', e);
      setIsTestingMic(false);
      setMicTestStatus('');
    }
  };

  // Background: Handle custom background upload
  const handleCustomBackgroundUpload = (event: any) => {
    const file = event.target?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (result) {
          setCustomBgUrl(result);
          setSelectedBg(result);
          handleUpdate({ virtualBackground: result });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    // @ts-ignore
    <View style={styles.overlay} accessibilityRole="dialog" accessibilityLabel="Janela de Configurações">
      <View style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Configurações do Zoom</Text>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityLabel="Fechar configurações"
          >
            <X size={18} color={ZoomTheme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Body with Sidebar and Content */}
        <View style={styles.body}>
          {/* Sidebar */}
          <View style={styles.tabsSidebar}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'general' && styles.activeTabButton]}
              onPress={() => setActiveTab('general')}
            >
              <Tv size={16} color={activeTab === 'general' ? ZoomTheme.colors.zoomBlue : ZoomTheme.colors.textSecondary} />
              <Text style={[styles.tabText, activeTab === 'general' && styles.activeTabText]}>Geral</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'video' && styles.activeTabButton]}
              onPress={() => setActiveTab('video')}
            >
              <Video size={16} color={activeTab === 'video' ? ZoomTheme.colors.zoomBlue : ZoomTheme.colors.textSecondary} />
              <Text style={[styles.tabText, activeTab === 'video' && styles.activeTabText]}>Vídeo</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'audio' && styles.activeTabButton]}
              onPress={() => setActiveTab('audio')}
            >
              <Mic size={16} color={activeTab === 'audio' ? ZoomTheme.colors.zoomBlue : ZoomTheme.colors.textSecondary} />
              <Text style={[styles.tabText, activeTab === 'audio' && styles.activeTabText]}>Áudio</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'background' && styles.activeTabButton]}
              onPress={() => setActiveTab('background')}
            >
              <ImageIcon size={16} color={activeTab === 'background' ? ZoomTheme.colors.zoomBlue : ZoomTheme.colors.textSecondary} />
              <Text style={[styles.tabText, activeTab === 'background' && styles.activeTabText]}>Fundos e Efeitos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'recording' && styles.activeTabButton]}
              onPress={() => setActiveTab('recording')}
            >
              <HardDrive size={16} color={activeTab === 'recording' ? ZoomTheme.colors.zoomBlue : ZoomTheme.colors.textSecondary} />
              <Text style={[styles.tabText, activeTab === 'recording' && styles.activeTabText]}>Gravação e Atalhos</Text>
            </TouchableOpacity>
          </View>

          {/* Content Area */}
          <ScrollView style={styles.contentArea} contentContainerStyle={styles.contentAreaScroll}>
            {/* 1. GERAL */}
            {activeTab === 'general' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Configurações Gerais</Text>

                <View style={styles.settingToggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Usar dois monitores</Text>
                    <Text style={styles.toggleHelp}>Exibe a grade de participantes e a tela compartilhada em janelas separadas.</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.switchTrack, dualMonitors && styles.switchTrackActive]}
                    onPress={() => {
                      setDualMonitors(!dualMonitors);
                      handleUpdate({ dualMonitors: !dualMonitors });
                    }}
                  >
                    <View style={[styles.switchThumb, dualMonitors && styles.switchThumbActive]} />
                  </TouchableOpacity>
                </View>

                <View style={styles.settingToggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Tema Escuro da Interface</Text>
                    <Text style={styles.toggleHelp}>Modo escuro de alto contraste otimizado para conferências prolongadas.</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.switchTrack, darkMode && styles.switchTrackActive]}
                    onPress={() => {
                      setDarkMode(!darkMode);
                      handleUpdate({ darkMode: !darkMode });
                    }}
                  >
                    <View style={[styles.switchThumb, darkMode && styles.switchThumbActive]} />
                  </TouchableOpacity>
                </View>

                <View style={styles.infoBox}>
                  <Info size={16} color={ZoomTheme.colors.zoomBlue} />
                  <Text style={styles.infoBoxText}>
                    O cliente Zoom detecta automaticamente resolução de tela e proporções ideais de exibição.
                  </Text>
                </View>
              </View>
            )}

            {/* 2. VÍDEO */}
            {activeTab === 'video' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Visualização da Câmera</Text>

                {/* Live Camera Preview Box */}
                <View style={styles.previewContainer}>
                  <VirtualVideoRenderer
                    stream={previewStream}
                    virtualBackground={selectedBg}
                    videoFilter={selectedFilter}
                    lowLightAdjustment={lowLight}
                    smoothSkin={smoothSkin}
                    mirrorVideo={mirrorVideo}
                    customBackgroundUrl={customBgUrl}
                    isLocal={true}
                    width="100%"
                    height={210}
                    style={{ borderRadius: 8 }}
                  />
                  <View style={styles.previewBadgesRow}>
                    <View style={styles.previewLiveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.previewBadgeText}>Prévia ao Vivo</Text>
                    </View>
                    <View style={styles.previewResolutionBadge}>
                      <Text style={styles.previewBadgeText}>{hdVideo ? 'HD 1080p' : '720p'}</Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Câmera (Webcam)</Text>
                <View style={styles.deviceCardList}>
                  {devices.videoInputs.map((d, i) => {
                    const isSelected = d.deviceId === selectedVideoInputId;
                    return (
                      <TouchableOpacity
                        key={d.deviceId || `cam-${i}`}
                        style={[styles.deviceRow, isSelected && styles.selectedDeviceRow]}
                        onPress={() => onSelectVideoInput(d.deviceId)}
                      >
                        <Text style={[styles.deviceRowText, isSelected && styles.selectedDeviceText]}>
                          {d.label || `Câmera Integrada ${i + 1}`}
                        </Text>
                        {isSelected && <Check size={16} color={ZoomTheme.colors.zoomBlue} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.settingToggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Habilitar Vídeo HD (720p/1080p)</Text>
                    <Text style={styles.toggleHelp}>Transmite com máxima nitidez conforme disponibilidade de banda.</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.switchTrack, hdVideo && styles.switchTrackActive]}
                    onPress={() => {
                      setHdVideo(!hdVideo);
                      handleUpdate({ hdVideo: !hdVideo });
                    }}
                  >
                    <View style={[styles.switchThumb, hdVideo && styles.switchThumbActive]} />
                  </TouchableOpacity>
                </View>

                <View style={styles.settingToggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Espelhar Meu Vídeo</Text>
                    <Text style={styles.toggleHelp}>Inverte a visualização local como se você estivesse diante de um espelho.</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.switchTrack, mirrorVideo && styles.switchTrackActive]}
                    onPress={() => {
                      setMirrorVideo(!mirrorVideo);
                      handleUpdate({ mirrorVideo: !mirrorVideo });
                    }}
                  >
                    <View style={[styles.switchThumb, mirrorVideo && styles.switchThumbActive]} />
                  </TouchableOpacity>
                </View>

                <View style={styles.settingToggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Ajustar para Pouca Iluminação</Text>
                    <Text style={styles.toggleHelp}>Compensa sombras e ambientes com iluminação reduzida.</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.switchTrack, lowLight && styles.switchTrackActive]}
                    onPress={() => {
                      setLowLight(!lowLight);
                      handleUpdate({ lowLightAdjustment: !lowLight });
                    }}
                  >
                    <View style={[styles.switchThumb, lowLight && styles.switchThumbActive]} />
                  </TouchableOpacity>
                </View>

                <View style={styles.settingToggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Retoque de Aparência (Filtro de Pele)</Text>
                    <Text style={styles.toggleHelp}>Suavização facial inteligente em tempo real.</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.switchTrack, smoothSkin && styles.switchTrackActive]}
                    onPress={() => {
                      setSmoothSkin(!smoothSkin);
                      handleUpdate({ smoothSkin: !smoothSkin });
                    }}
                  >
                    <View style={[styles.switchThumb, smoothSkin && styles.switchThumbActive]} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 3. ÁUDIO */}
            {activeTab === 'audio' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Microfone</Text>
                <View style={styles.deviceCardList}>
                  {devices.audioInputs.map((d, i) => {
                    const isSelected = d.deviceId === selectedAudioInputId;
                    return (
                      <TouchableOpacity
                        key={d.deviceId || `mic-${i}`}
                        style={[styles.deviceRow, isSelected && styles.selectedDeviceRow]}
                        onPress={() => onSelectAudioInput(d.deviceId)}
                      >
                        <Text style={[styles.deviceRowText, isSelected && styles.selectedDeviceText]}>
                          {d.label || `Microfone Padrão ${i + 1}`}
                        </Text>
                        {isSelected && <Check size={16} color={ZoomTheme.colors.zoomBlue} />}
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Real-time Microphone Input Level Meter */}
                <View style={styles.audioMeterContainer}>
                  <View style={styles.audioMeterHeader}>
                    <Text style={styles.audioMeterLabel}>Nível de Entrada do Microfone:</Text>
                    <Text style={styles.audioMeterValue}>{micLevel}%</Text>
                  </View>
                  <View style={styles.audioMeterTrack}>
                    <View
                      style={[
                        styles.audioMeterFill,
                        {
                          width: `${Math.max(4, micLevel)}%`,
                          backgroundColor: micLevel > 80 ? '#E74C3C' : micLevel > 45 ? '#F39C12' : '#2ECC71',
                        },
                      ]}
                    />
                  </View>
                </View>

                {/* Audio Testing Buttons (Microphone & Speaker) */}
                <View style={styles.audioActionRow}>
                  <TouchableOpacity
                    style={[styles.audioTestButton, isTestingMic && styles.audioTestButtonActive]}
                    onPress={handleTestMicrophone}
                    disabled={isTestingMic}
                  >
                    <Mic size={15} color={isTestingMic ? '#E74C3C' : ZoomTheme.colors.zoomBlue} />
                    <Text style={styles.audioTestButtonText}>
                      {micTestStatus || (isTestingMic ? 'Gravando...' : 'Testar Microfone')}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.audioTestButton, isTestingSpeaker && styles.audioTestButtonActive]}
                    onPress={handleTestSpeaker}
                    disabled={isTestingSpeaker}
                  >
                    <Volume2 size={15} color={isTestingSpeaker ? ZoomTheme.colors.zoomBlue : ZoomTheme.colors.textPrimary} />
                    <Text style={styles.audioTestButtonText}>
                      {isTestingSpeaker ? 'Reproduzindo Som...' : 'Testar Alto-falante'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Supressão de Ruído de Fundo</Text>
                <View style={styles.radioOptionGroup}>
                  {(['low', 'medium', 'high'] as const).map((level) => (
                    <TouchableOpacity
                      key={level}
                      style={[styles.radioCard, noiseSuppression === level && styles.radioCardActive]}
                      onPress={() => {
                        setNoiseSuppression(level);
                        handleUpdate({ noiseSuppression: level });
                      }}
                    >
                      <Text style={[styles.radioCardText, noiseSuppression === level && styles.radioCardTextActive]}>
                        {level === 'low'
                          ? 'Baixa (Música / ambiente suave)'
                          : level === 'medium'
                          ? 'Automática / Padrão (Ideal)'
                          : 'Agressiva (Teclado e ruídos)'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.settingToggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Ativar Modo de Áudio Original para Músicos</Text>
                    <Text style={styles.toggleHelp}>Desativa o cancelamento de eco e processamento para fidelidade em estúdio.</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.switchTrack, originalSound && styles.switchTrackActive]}
                    onPress={() => {
                      setOriginalSound(!originalSound);
                      handleUpdate({ originalSound: !originalSound });
                    }}
                  >
                    <View style={[styles.switchThumb, originalSound && styles.switchThumbActive]} />
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* 4. FUNDOS E EFEITOS */}
            {activeTab === 'background' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Prévia com Fundo e Filtro</Text>

                {/* Live Preview Box with Virtual Background and Video Filter */}
                <View style={styles.previewContainer}>
                  <VirtualVideoRenderer
                    stream={previewStream}
                    virtualBackground={selectedBg}
                    videoFilter={selectedFilter}
                    lowLightAdjustment={lowLight}
                    smoothSkin={smoothSkin}
                    mirrorVideo={mirrorVideo}
                    customBackgroundUrl={customBgUrl}
                    isLocal={true}
                    width="100%"
                    height={210}
                    style={{ borderRadius: 8 }}
                  />
                  <View style={styles.previewBadgesRow}>
                    <View style={styles.previewLiveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.previewBadgeText}>Efeito Ativo em Tempo Real</Text>
                    </View>
                    <View style={styles.previewResolutionBadge}>
                      <Text style={styles.previewBadgeText}>
                        {getBackgroundDetails(selectedBg, customBgUrl).label}
                      </Text>
                    </View>
                  </View>
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 14 }]}>Fundos Virtuais</Text>
                <Text style={styles.sectionDesc}>
                  Selecione um fundo virtual ou aplique desfoque inteligente na sua câmera:
                </Text>

                <View style={styles.bgGrid}>
                  {BACKGROUND_OPTIONS.map((bg) => {
                    const isSelected = selectedBg === bg.id;
                    return (
                      <TouchableOpacity
                        key={bg.id}
                        style={[styles.bgTile, isSelected && styles.bgTileSelected]}
                        onPress={() => {
                          setSelectedBg(bg.id);
                          handleUpdate({ virtualBackground: bg.id });
                        }}
                      >
                        <Text style={styles.bgIcon}>{bg.icon}</Text>
                        <Text style={[styles.bgLabel, isSelected && styles.bgLabelSelected]} numberOfLines={1}>
                          {bg.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}

                  {/* Add Custom Background Image Upload */}
                  <TouchableOpacity
                    style={[styles.bgTile, selectedBg === customBgUrl && styles.bgTileSelected]}
                    onPress={() => {
                      if (Platform.OS === 'web' && fileInputRef.current) {
                        fileInputRef.current.click();
                      }
                    }}
                  >
                    <Upload size={20} color={ZoomTheme.colors.zoomBlue} />
                    <Text style={[styles.bgLabel, { color: ZoomTheme.colors.zoomBlue, marginTop: 4 }]} numberOfLines={1}>
                      + Enviar Foto
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Hidden HTML input for image upload */}
                {Platform.OS === 'web' && (
                  <input
                    ref={fileInputRef as any}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleCustomBackgroundUpload}
                  />
                )}

                <Text style={[styles.sectionTitle, { marginTop: 16 }]}>Filtros de Vídeo</Text>
                <Text style={styles.sectionDesc}>
                  Ajuste a temperatura e estilo cromático da sua transmissão:
                </Text>

                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
                  <View style={styles.filtersRow}>
                    {FILTER_OPTIONS.map((f) => {
                      const isSelected = selectedFilter === f.id;
                      return (
                        <TouchableOpacity
                          key={f.id}
                          style={[styles.filterPill, isSelected && styles.filterPillActive]}
                          onPress={() => {
                            setSelectedFilter(f.id);
                            handleUpdate({ videoFilter: f.id });
                          }}
                        >
                          <Text style={[styles.filterPillText, isSelected && styles.filterPillTextActive]}>
                            {f.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* 5. GRAVAÇÃO & ACESSIBILIDADE */}
            {activeTab === 'recording' && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Gravação Local</Text>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Diretório para Gravações Locais:</Text>
                  <TextInput
                    style={styles.textInput}
                    value={recordingDir}
                    onChangeText={(val) => {
                      setRecordingDir(val);
                      handleUpdate({ recordingDirectory: val });
                    }}
                  />
                </View>

                <View style={styles.settingToggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Gravar Faixas de Áudio Separadas</Text>
                    <Text style={styles.toggleHelp}>Salva um arquivo de áudio WAV/M4A separado para cada participante.</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.switchTrack, saveSeparateTracks && styles.switchTrackActive]}
                    onPress={() => {
                      setSaveSeparateTracks(!saveSeparateTracks);
                      handleUpdate({ saveSeparateAudioTracks: !saveSeparateTracks });
                    }}
                  >
                    <View style={[styles.switchThumb, saveSeparateTracks && styles.switchThumbActive]} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Acessibilidade e Legendas</Text>
                <View style={styles.settingToggleRow}>
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Legendas Ocultas Automáticas (Closed Captions)</Text>
                    <Text style={styles.toggleHelp}>Gera transcrição de fala em tempo real na parte inferior da tela.</Text>
                  </View>
                  <TouchableOpacity
                    style={[styles.switchTrack, closedCaptions && styles.switchTrackActive]}
                    onPress={() => {
                      setClosedCaptions(!closedCaptions);
                      handleUpdate({ closedCaptionsEnabled: !closedCaptions });
                    }}
                  >
                    <View style={[styles.switchThumb, closedCaptions && styles.switchThumbActive]} />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.sectionTitle, { marginTop: 12 }]}>Atalhos de Teclado</Text>
                <View style={styles.shortcutsTable}>
                  <View style={styles.shortcutRow}>
                    <Text style={styles.shortcutAction}>Ativar / Desativar Microfone</Text>
                    <Text style={styles.shortcutKey}>Alt + A</Text>
                  </View>
                  <View style={styles.shortcutRow}>
                    <Text style={styles.shortcutAction}>Iniciar / Interromper Vídeo</Text>
                    <Text style={styles.shortcutKey}>Alt + V</Text>
                  </View>
                  <View style={styles.shortcutRow}>
                    <Text style={styles.shortcutAction}>Compartilhar Tela</Text>
                    <Text style={styles.shortcutKey}>Alt + S</Text>
                  </View>
                  <View style={styles.shortcutRow}>
                    <Text style={styles.shortcutAction}>Abrir / Fechar Chat</Text>
                    <Text style={styles.shortcutKey}>Alt + H</Text>
                  </View>
                </View>
              </View>
            )}
          </ScrollView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  modalContainer: {
    width: 680,
    maxWidth: '92%',
    height: 580,
    maxHeight: '90%',
    backgroundColor: ZoomTheme.colors.stageBgDarker,
    borderRadius: ZoomTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: ZoomTheme.colors.borderSubtle,
    backgroundColor: ZoomTheme.colors.cardBg,
  },
  headerTitle: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: ZoomTheme.borderRadius.sm,
  },
  body: {
    flex: 1,
    flexDirection: 'row',
  },
  tabsSidebar: {
    width: 175,
    borderRightWidth: 1,
    borderRightColor: ZoomTheme.colors.borderSubtle,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingVertical: 12,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 10,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  activeTabButton: {
    backgroundColor: 'rgba(14, 114, 237, 0.1)',
    borderLeftColor: ZoomTheme.colors.zoomBlue,
  },
  tabText: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  activeTabText: {
    color: ZoomTheme.colors.zoomBlue,
    fontWeight: '700',
  },
  contentArea: {
    flex: 1,
  },
  contentAreaScroll: {
    padding: 20,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  sectionDesc: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 16,
  },
  previewContainer: {
    position: 'relative',
    height: 210,
    backgroundColor: '#0a0a0c',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    overflow: 'hidden',
  },
  previewBadgesRow: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    pointerEvents: 'none',
  },
  previewLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2ECC71',
  },
  previewResolutionBadge: {
    backgroundColor: 'rgba(14, 114, 237, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  previewBadgeText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: '600',
  },
  deviceCardList: {
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: ZoomTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    overflow: 'hidden',
  },
  deviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ZoomTheme.colors.borderSubtle,
  },
  selectedDeviceRow: {
    backgroundColor: 'rgba(14, 114, 237, 0.08)',
  },
  deviceRowText: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 12,
  },
  selectedDeviceText: {
    color: ZoomTheme.colors.zoomBlue,
    fontWeight: '600',
  },
  audioMeterContainer: {
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: ZoomTheme.borderRadius.sm,
    padding: 12,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    gap: 8,
  },
  audioMeterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  audioMeterLabel: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  audioMeterValue: {
    color: ZoomTheme.colors.zoomBlue,
    fontSize: 11,
    fontWeight: '700',
  },
  audioMeterTrack: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  audioMeterFill: {
    height: '100%',
    borderRadius: 4,
  },
  audioActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  audioTestButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    paddingHorizontal: 12,
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: ZoomTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
  },
  audioTestButtonActive: {
    borderColor: ZoomTheme.colors.zoomBlue,
    backgroundColor: 'rgba(14, 114, 237, 0.1)',
  },
  audioTestButtonText: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  settingToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: ZoomTheme.colors.borderSubtle,
  },
  toggleInfo: {
    flex: 1,
    paddingRight: 16,
  },
  toggleLabel: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2,
  },
  toggleHelp: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 11,
    lineHeight: 15,
  },
  switchTrack: {
    width: 38,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#39393D',
    padding: 2,
    justifyContent: 'center',
  },
  switchTrackActive: {
    backgroundColor: ZoomTheme.colors.zoomBlue,
  },
  switchThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: 0 }],
  },
  switchThumbActive: {
    transform: [{ translateX: 18 }],
  },
  radioOptionGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  radioCard: {
    flex: 1,
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: ZoomTheme.borderRadius.sm,
    padding: 10,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    alignItems: 'center',
  },
  radioCardActive: {
    borderColor: ZoomTheme.colors.zoomBlue,
    backgroundColor: 'rgba(14, 114, 237, 0.1)',
  },
  radioCardText: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
  },
  radioCardTextActive: {
    color: ZoomTheme.colors.zoomBlue,
    fontWeight: '600',
  },
  bgGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bgTile: {
    width: '31.5%',
    height: 72,
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: ZoomTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
  },
  bgTileSelected: {
    borderColor: ZoomTheme.colors.zoomBlue,
    borderWidth: 2,
    backgroundColor: 'rgba(14, 114, 237, 0.14)',
  },
  bgIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  bgLabel: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
  },
  bgLabelSelected: {
    color: ZoomTheme.colors.textPrimary,
    fontWeight: '700',
  },
  filtersScroll: {
    marginTop: 4,
  },
  filtersRow: {
    flexDirection: 'row',
    gap: 8,
    paddingBottom: 4,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  filterPillActive: {
    backgroundColor: ZoomTheme.colors.zoomBlue,
    borderColor: ZoomTheme.colors.zoomBlue,
  },
  filterPillText: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 11,
  },
  filterPillTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 12,
  },
  textInput: {
    backgroundColor: ZoomTheme.colors.inputBg,
    color: ZoomTheme.colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    fontSize: 12,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
  },
  shortcutsTable: {
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: ZoomTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    overflow: 'hidden',
  },
  shortcutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: ZoomTheme.colors.borderSubtle,
  },
  shortcutAction: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 12,
  },
  shortcutKey: {
    color: ZoomTheme.colors.zoomBlue,
    fontSize: 12,
    fontWeight: '600',
    backgroundColor: 'rgba(14, 114, 237, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(14, 114, 237, 0.08)',
    padding: 10,
    borderRadius: ZoomTheme.borderRadius.sm,
    marginTop: 8,
  },
  infoBoxText: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 11,
    flex: 1,
  },
});
