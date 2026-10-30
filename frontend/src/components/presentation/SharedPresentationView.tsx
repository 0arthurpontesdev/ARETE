import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Users,
  Share,
  Pause,
  Play,
  Edit3,
  MousePointer,
  MoreHorizontal,
  Square,
  Home,
  LayoutDashboard,
  FolderKanban,
  CheckSquare,
  Clock,
  LogOut,
  Search,
  Globe,
  Lock,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Plus,
  MessageCircle,
  Check,
  FileText,
  Folder,
  Sliders,
  Presentation,
  Maximize2,
  Minimize2,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
  FolderOpen,
  HardDrive,
  Monitor,
  PenTool,
  Highlighter,
  Eraser,
  Square as SquareIcon,
  Circle as CircleIcon,
  Type,
  FileSpreadsheet,
} from 'lucide-react-native';
import { ZoomTheme } from '../../styles/theme';
import { ParticipantInfo } from '../../types';
import { ShareOption } from '../video/ScreenShareModal';

interface SharedPresentationViewProps {
  stream?: MediaStream | null;
  shareOption?: ShareOption | null;
  isMuted?: boolean;
  isVideoOff?: boolean;
  onToggleMic?: () => void;
  onToggleCam?: () => void;
  onStopSharing: () => void;
  onNewShare?: () => void;
  onToggleAnnotation?: () => void;
  isAnnotationActive?: boolean;
  participants: ParticipantInfo[];
}

export const SharedPresentationView: React.FC<SharedPresentationViewProps> = ({
  stream,
  shareOption,
  isMuted: propIsMuted,
  isVideoOff: propIsVideoOff,
  onToggleMic,
  onToggleCam,
  onStopSharing,
  onNewShare,
  onToggleAnnotation,
  isAnnotationActive = false,
  participants,
}) => {
  const [internalMuted, setInternalMuted] = useState(true);
  const [internalVideoOff, setInternalVideoOff] = useState(false);
  const isMuted = propIsMuted !== undefined ? propIsMuted : internalMuted;
  const isVideoOff = propIsVideoOff !== undefined ? propIsVideoOff : internalVideoOff;
  const [isPaused, setIsPaused] = useState(false);
  const [activeNav, setActiveNav] = useState('dashboard');
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const bindVideoRef = (el: HTMLVideoElement | null) => {
    videoRef.current = el;
    if (el && stream) {
      el.srcObject = stream;
      el.play().catch((err) => {
        console.warn('Erro ao reproduzir stream:', err);
      });
    }
  };

  useEffect(() => {
    if (Platform.OS === 'web' && videoRef.current) {
      if (stream) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn('Erro ao reproduzir stream compartilhado:', err);
        });
      } else {
        videoRef.current.srcObject = null;
      }
    }
  }, [stream]);

  // Tasks mock para Kanban do Painel de Gestão
  const [kanbanTasks, setKanbanTasks] = useState([
    {
      id: 'k1',
      col: 'todo',
      title: 'Evalulzar como como rodos de projetos',
      tags: [{ text: 'Consertillamento', color: '#38BDF8' }, { text: 'In Progress', color: '#FBBF24' }],
      date: '18.04/Ich - 2023',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face',
      done: false,
    },
    {
      id: 'k2',
      col: 'todo',
      title: 'Conimoa compariria a projeto em compartria',
      tags: [],
      date: '22.02/feb - 2023',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop&crop=face',
      done: false,
    },
    {
      id: 'k3',
      col: 'progress',
      title: 'Evalulzar como concertilhmentos do projeto',
      tags: [{ text: 'In Progress', color: '#38BDF8' }],
      date: '08.09/Mai - 2023',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
      done: true,
    },
    {
      id: 'k4',
      col: 'progress',
      title: 'Evalulcar como roo parameturo de projetos',
      tags: [{ text: 'Swocertilhamento', color: '#38BDF8' }],
      date: '11.08/Nov - 2023',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
      done: true,
    },
  ]);

  // Participantes reais do Sidecar (apenas usuários conectados)
  const sidecarParticipants: ParticipantInfo[] = participants && participants.length > 0 ? participants : [];

  const activeOptionId = shareOption?.id || 'chrome-dashboard';

  return (
    <View style={styles.container}>
      {/* 1. BARRA FLUTUANTE DE CONTROLE CUSTOMIZADA (FIXA NO TOPO: fixed top-4 left-1/2 -translate-x-1/2) */}
      <View
        // @ts-ignore
        style={[
          styles.topFloatingWrapper,
          Platform.OS === 'web' && ({
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
          } as any),
        ]}
      >
        {/* Badge Superior: Indicador verde "● Você está compartilhando a tela" lado a lado com botão vermelho */}
        <View style={styles.bannerRow}>
          <View style={styles.statusPill}>
            <View style={styles.greenLiveDot} />
            <Text style={styles.statusPillText}>Você está compartilhando a tela</Text>
          </View>

          <TouchableOpacity
            style={styles.stopShareBtn}
            onPress={onStopSharing}
            activeOpacity={0.8}
            accessibilityLabel="Interromper Compartilhamento"
          >
            <Square size={11} color="#FFFFFF" fill="#FFFFFF" />
            <Text style={styles.stopShareText}>Interromper Compartilhamento</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Compacto Flutuante: Container escuro translúcido com os botões solicitados */}
        <View style={styles.floatingToolbar}>
          {/* Desmutar */}
          <TouchableOpacity
            style={styles.toolbarItem}
            onPress={onToggleMic ? onToggleMic : () => setInternalMuted(!internalMuted)}
            activeOpacity={0.7}
          >
            {isMuted ? (
              <MicOff size={15} color={ZoomTheme.colors.dangerRed} />
            ) : (
              <Mic size={15} color="#FFFFFF" />
            )}
            <Text style={styles.toolbarItemText}>{isMuted ? 'Desmutar' : 'Silenciar'}</Text>
          </TouchableOpacity>

          {/* Iniciar Vídeo */}
          <TouchableOpacity
            style={styles.toolbarItem}
            onPress={onToggleCam ? onToggleCam : () => setInternalVideoOff(!internalVideoOff)}
            activeOpacity={0.7}
          >
            {isVideoOff ? (
              <VideoOff size={15} color={ZoomTheme.colors.dangerRed} />
            ) : (
              <Video size={15} color="#FFFFFF" />
            )}
            <Text style={styles.toolbarItemText}>
              {isVideoOff ? 'Iniciar Vídeo' : 'Interromper Vídeo'}
            </Text>
          </TouchableOpacity>

          {/* Participantes Dinâmico */}
          <TouchableOpacity style={styles.toolbarItem} activeOpacity={0.7}>
            <Users size={15} color="#FFFFFF" />
            <Text style={styles.toolbarItemText}>Participantes {sidecarParticipants.length || 1}</Text>
          </TouchableOpacity>

          {/* Novo Compartilhamento (Verde) */}
          <TouchableOpacity
            style={[styles.toolbarItem, styles.toolbarItemHighlight]}
            onPress={onNewShare}
            activeOpacity={0.7}
          >
            <Share size={15} color="#22C55E" />
            <Text style={[styles.toolbarItemText, { color: '#22C55E', fontWeight: '600' }]}>
              Novo Compartilhamento
            </Text>
          </TouchableOpacity>

          {/* Pausar Compartilhamento */}
          <TouchableOpacity
            style={styles.toolbarItem}
            onPress={() => setIsPaused(!isPaused)}
            activeOpacity={0.7}
          >
            <Pause size={15} color="#FFFFFF" />
            <Text style={styles.toolbarItemText}>
              {isPaused ? 'Retomar' : 'Pausar Compartilhamento'}
            </Text>
          </TouchableOpacity>

          {/* Anotar */}
          <TouchableOpacity
            style={[styles.toolbarItem, isAnnotationActive && styles.toolbarItemActive]}
            onPress={onToggleAnnotation}
            activeOpacity={0.7}
          >
            <Edit3 size={15} color={isAnnotationActive ? '#22C55E' : '#FFFFFF'} />
            <Text style={[styles.toolbarItemText, isAnnotationActive && { color: '#22C55E' }]}>
              Anotar
            </Text>
          </TouchableOpacity>

          {/* Controle Remoto */}
          <TouchableOpacity style={styles.toolbarItem} activeOpacity={0.7}>
            <MousePointer size={15} color="#FFFFFF" />
            <Text style={styles.toolbarItemText}>Controle Remoto</Text>
          </TouchableOpacity>

          {/* Mais */}
          <TouchableOpacity style={styles.toolbarItem} activeOpacity={0.7}>
            <MoreHorizontal size={15} color="#FFFFFF" />
            <Text style={styles.toolbarItemText}>Mais</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. ÁREA CENTRAL: CONTEÚDO CORRESPONDENTE À OPÇÃO SELECIONADA */}
      <View style={styles.mainStageWrapper}>
        {/* OPÇÃO: Vídeo WebRTC Real (se stream presente) ou Tela 1 */}
        {stream ? (
          <View style={styles.videoStageContainer}>
            {Platform.OS === 'web' && (
              <video
                ref={bindVideoRef}
                data-testid="shared-screen-video"
                aria-label="Vídeo da tela compartilhada"
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  backgroundColor: '#000000',
                }}
              />
            )}
          </View>
        ) : activeOptionId === 'whiteboard' ? (
          /* OPÇÃO: QUADRO BRANCO */
          <View style={styles.whiteboardWindow}>
            {/* Header do Quadro Branco */}
            <View style={styles.whiteboardHeader}>
              <View style={styles.wbHeaderLeft}>
                <Edit3 size={16} color="#0E72ED" />
                <Text style={styles.wbTitle}>Quadro Branco Interativo - Colaboração em Tempo Real</Text>
              </View>
              <View style={styles.wbHeaderRight}>
                <View style={styles.wbPageBadge}>
                  <Text style={styles.wbPageText}>Página 1 de 1</Text>
                </View>
              </View>
            </View>

            {/* Canvas do Quadro Branco com Toolbar Lateral e Notas */}
            <View style={styles.whiteboardCanvas}>
              {/* Barra de Ferramentas de Desenho */}
              <View style={styles.wbToolbar}>
                <TouchableOpacity style={[styles.wbToolBtn, styles.wbToolBtnActive]}>
                  <PenTool size={16} color="#2563EB" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.wbToolBtn}>
                  <Highlighter size={16} color="#475569" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.wbToolBtn}>
                  <SquareIcon size={16} color="#475569" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.wbToolBtn}>
                  <CircleIcon size={16} color="#475569" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.wbToolBtn}>
                  <Type size={16} color="#475569" />
                </TouchableOpacity>
                <TouchableOpacity style={styles.wbToolBtn}>
                  <Eraser size={16} color="#475569" />
                </TouchableOpacity>
                <View style={styles.wbToolDivider} />
                <View style={[styles.wbColorDot, { backgroundColor: '#2563EB' }]} />
                <View style={[styles.wbColorDot, { backgroundColor: '#10B981' }]} />
                <View style={[styles.wbColorDot, { backgroundColor: '#EF4444' }]} />
                <View style={[styles.wbColorDot, { backgroundColor: '#F59E0B' }]} />
              </View>

              {/* Notas Autoadesivas (Post-its) */}
              <View style={styles.stickyNotesContainer}>
                <View style={[styles.stickyNote, { backgroundColor: '#FEF08A' }]}>
                  <Text style={styles.stickyTitle}>📌 Planejamento Sprint</Text>
                  <Text style={styles.stickyBody}>
                    • Engenharia Reversa Zoom UI{'\n'}
                    • Componentes Dark Mode{'\n'}
                    • Validação E2E com Playwright
                  </Text>
                  <Text style={styles.stickyFooter}>Natan H. • 10:30</Text>
                </View>

                <View style={[styles.stickyNote, { backgroundColor: '#BAE6FD', marginTop: 40 }]}>
                  <Text style={styles.stickyTitle}>🚀 Arquitetura WebRTC</Text>
                  <Text style={styles.stickyBody}>
                    • SFU LiveKit v1.8{'\n'}
                    • Multi-stream Audio & Video{'\n'}
                    • Active Speaker Detection
                  </Text>
                  <Text style={styles.stickyFooter}>Arthur • 10:45</Text>
                </View>

                <View style={[styles.stickyNote, { backgroundColor: '#BBF7D0', marginTop: 80 }]}>
                  <Text style={styles.stickyTitle}>✅ Status do MVP</Text>
                  <Text style={styles.stickyBody}>
                    • 100% dos testes aprovados{'\n'}
                    • Modal de seleção integrado{'\n'}
                    • Barra flutuante ativa
                  </Text>
                  <Text style={styles.stickyFooter}>Equipe • 11:00</Text>
                </View>
              </View>
            </View>
          </View>
        ) : activeOptionId === 'powerpoint' ? (
          /* OPÇÃO: APRESENTAÇÃO POWERPOINT */
          <View style={styles.powerpointWindow}>
            <View style={styles.pptHeader}>
              <Presentation size={16} color="#D24726" />
              <Text style={styles.pptTitle}>Microsoft PowerPoint - Apresentacao_Estrategica_2026.pptx</Text>
            </View>

            <View style={styles.pptBody}>
              {/* Miniaturas de Slides na Esquerda */}
              <View style={styles.pptSlidesNav}>
                <View style={[styles.pptSlideThumb, styles.pptSlideThumbActive]}>
                  <Text style={styles.pptSlideNum}>1</Text>
                  <View style={styles.pptThumbMiniContent} />
                </View>
                <View style={styles.pptSlideThumb}>
                  <Text style={styles.pptSlideNum}>2</Text>
                  <View style={styles.pptThumbMiniContent} />
                </View>
                <View style={styles.pptSlideThumb}>
                  <Text style={styles.pptSlideNum}>3</Text>
                  <View style={styles.pptThumbMiniContent} />
                </View>
              </View>

              {/* Slide Principal Central */}
              <View style={styles.pptMainSlide}>
                <Text style={styles.pptSlideHeading}>Visão Geral de Desempenho e Arquitetura</Text>
                <Text style={styles.pptSlideSub}>Videoconferência Escalável com SFU LiveKit</Text>

                <View style={styles.pptMetricsRow}>
                  <View style={styles.pptMetricCard}>
                    <Text style={styles.pptMetricVal}>99.98%</Text>
                    <Text style={styles.pptMetricLbl}>Disponibilidade de Conexão</Text>
                  </View>
                  <View style={styles.pptMetricCard}>
                    <Text style={styles.pptMetricVal}>50 ms</Text>
                    <Text style={styles.pptMetricLbl}>Latência Média Global</Text>
                  </View>
                  <View style={styles.pptMetricCard}>
                    <Text style={styles.pptMetricVal}>100+</Text>
                    <Text style={styles.pptMetricLbl}>Salas Simultâneas</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        ) : activeOptionId === 'pdf-doc' ? (
          /* OPÇÃO: APRESENTAÇÃO PDF */
          <View style={styles.pdfWindow}>
            <View style={styles.pdfHeader}>
              <View style={styles.pdfHeaderLeft}>
                <FileText size={16} color="#E02828" />
                <Text style={styles.pdfTitle}>Relatorio_Executivo_Trimestral.pdf</Text>
              </View>
              <View style={styles.pdfHeaderRight}>
                <ZoomIn size={14} color="#64748B" />
                <Text style={styles.pdfZoomText}>100%</Text>
                <ZoomOut size={14} color="#64748B" />
                <Download size={14} color="#64748B" />
                <Printer size={14} color="#64748B" />
              </View>
            </View>

            <ScrollView style={styles.pdfPageScroll} contentContainerStyle={styles.pdfPageContainer}>
              <View style={styles.pdfSheet}>
                <Text style={styles.pdfDocTitle}>RELATÓRIO DE ENGENHARIA DE SOFTWARE</Text>
                <Text style={styles.pdfDocMeta}>Data: 30 de Outubro de 2026 | Versão 2.4</Text>
                <View style={styles.pdfDivider} />
                <Text style={styles.pdfSectionHeading}>1. Sumário Executivo</Text>
                <Text style={styles.pdfParagraph}>
                  Este documento detalha o desenvolvimento do MVP de videoconferência com base nas diretrizes visuais e comportamentais do Zoom, com suporte a streaming WebRTC, detecção ativa de orador e barra de ferramentas flutuante de controle para compartilhamento de tela.
                </Text>
                <Text style={styles.pdfSectionHeading}>2. Indicadores de Teste</Text>
                <View style={styles.pdfTable}>
                  <View style={styles.pdfTableRowHeader}>
                    <Text style={styles.pdfTableCellHeader}>Módulo</Text>
                    <Text style={styles.pdfTableCellHeader}>Status</Text>
                    <Text style={styles.pdfTableCellHeader}>Cobertura</Text>
                  </View>
                  <View style={styles.pdfTableRow}>
                    <Text style={styles.pdfTableCell}>LiveKit Backend</Text>
                    <Text style={[styles.pdfTableCell, { color: '#16A34A' }]}>Aprovado</Text>
                    <Text style={styles.pdfTableCell}>100%</Text>
                  </View>
                  <View style={styles.pdfTableRow}>
                    <Text style={styles.pdfTableCell}>Frontend Vitest</Text>
                    <Text style={[styles.pdfTableCell, { color: '#16A34A' }]}>Aprovado</Text>
                    <Text style={styles.pdfTableCell}>100%</Text>
                  </View>
                  <View style={styles.pdfTableRow}>
                    <Text style={styles.pdfTableCell}>Playwright E2E</Text>
                    <Text style={[styles.pdfTableCell, { color: '#16A34A' }]}>Aprovado</Text>
                    <Text style={styles.pdfTableCell}>100%</Text>
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        ) : activeOptionId === 'explorer' ? (
          /* OPÇÃO: EXPLORADOR DE ARQUIVOS */
          <View style={styles.explorerWindow}>
            <View style={styles.explorerHeader}>
              <FolderOpen size={16} color="#F59E0B" />
              <Text style={styles.explorerTitle}>Explorador de Arquivos - C:\Projetos\ARETE</Text>
            </View>

            <View style={styles.explorerBody}>
              <View style={styles.explorerSidebar}>
                <View style={styles.explorerSideItem}>
                  <HardDrive size={14} color="#94A3B8" />
                  <Text style={styles.explorerSideText}>Este Computador</Text>
                </View>
                <View style={[styles.explorerSideItem, styles.explorerSideItemActive]}>
                  <Folder size={14} color="#F59E0B" />
                  <Text style={styles.explorerSideText}>Documentos</Text>
                </View>
                <View style={styles.explorerSideItem}>
                  <Folder size={14} color="#F59E0B" />
                  <Text style={styles.explorerSideText}>Downloads</Text>
                </View>
              </View>

              <View style={styles.explorerGrid}>
                <View style={styles.explorerFolderCard}>
                  <Folder size={32} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.explorerFileName}>frontend</Text>
                </View>
                <View style={styles.explorerFolderCard}>
                  <Folder size={32} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.explorerFileName}>server</Text>
                </View>
                <View style={styles.explorerFolderCard}>
                  <Folder size={32} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.explorerFileName}>docs</Text>
                </View>
                <View style={styles.explorerFolderCard}>
                  <FileText size={32} color="#3B82F6" />
                  <Text style={styles.explorerFileName}>specs.md</Text>
                </View>
                <View style={styles.explorerFolderCard}>
                  <FileText size={32} color="#3B82F6" />
                  <Text style={styles.explorerFileName}>README.md</Text>
                </View>
                <View style={styles.explorerFolderCard}>
                  <FileSpreadsheet size={32} color="#10B981" />
                  <Text style={styles.explorerFileName}>package.json</Text>
                </View>
              </View>
            </View>
          </View>
        ) : activeOptionId === 'screen-1' ? (
          /* OPÇÃO: TELA 1 (DESKTOP) */
          <View style={styles.desktopWindow}>
            {Platform.OS === 'web' && (
              <video
                ref={bindVideoRef}
                data-testid="shared-screen-video"
                aria-label="Vídeo da tela compartilhada"
                autoPlay
                playsInline
                muted
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  backgroundColor: '#0F1216',
                }}
              />
            )}
          </View>
        ) : (
          /* OPÇÃO PADRÃO: GOOGLE CHROME (PAINEL DE GESTÃO) */
          <View style={styles.browserWindow}>
            {/* Barra de Abas do Navegador */}
            <View style={styles.browserTabs}>
              <View style={styles.activeTabItem}>
                <View style={styles.faviconDot} />
                <Text style={styles.activeTabText}>Painel de gestao</Text>
                <Text style={styles.tabCloseX}>×</Text>
              </View>
              <View style={styles.newTabBtn}>
                <Plus size={12} color="#64748B" />
              </View>
            </View>

            {/* Barra de Endereço URL */}
            <View style={styles.browserAddressBar}>
              <View style={styles.navIcons}>
                <ChevronLeft size={14} color="#94A3B8" />
                <ChevronRight size={14} color="#CBD5E1" />
                <RotateCw size={12} color="#94A3B8" />
              </View>
              <View style={styles.urlInputBox}>
                <Lock size={12} color="#16A34A" />
                <Text style={styles.urlText}>www.paineldegestao.com.br</Text>
              </View>
            </View>

            {/* Conteúdo da Aplicação Web: Painel de Gestão */}
            <View style={styles.appViewport}>
              {/* Sidebar do Aplicativo */}
              <View style={styles.appSidebar}>
                <View style={styles.appBrandRow}>
                  <View style={styles.appBrandIcon}>
                    <View style={[styles.barSlice, { backgroundColor: '#38BDF8', height: 12 }]} />
                    <View style={[styles.barSlice, { backgroundColor: '#34D399', height: 16 }]} />
                    <View style={[styles.barSlice, { backgroundColor: '#FBBF24', height: 10 }]} />
                  </View>
                  <Text style={styles.appBrandName}>Painel de gestao</Text>
                </View>

                <View style={styles.sidebarMenuList}>
                  <TouchableOpacity
                    style={[styles.menuItem, activeNav === 'home' && styles.menuItemActive]}
                    onPress={() => setActiveNav('home')}
                  >
                    <Home size={15} color={activeNav === 'home' ? '#3B82F6' : '#94A3B8'} />
                    <Text style={[styles.menuItemText, activeNav === 'home' && styles.menuItemTextActive]}>
                      Home
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.menuItem, activeNav === 'dashboard' && styles.menuItemActive]}
                    onPress={() => setActiveNav('dashboard')}
                  >
                    <LayoutDashboard size={15} color={activeNav === 'dashboard' ? '#3B82F6' : '#94A3B8'} />
                    <Text style={[styles.menuItemText, activeNav === 'dashboard' && styles.menuItemTextActive]}>
                      Dashboard
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuItem}>
                    <MessageCircle size={15} color="#94A3B8" />
                    <Text style={styles.menuItemText}>Management</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuItem}>
                    <FolderKanban size={15} color="#94A3B8" />
                    <Text style={styles.menuItemText}>Projetos</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuItem}>
                    <CheckSquare size={15} color="#94A3B8" />
                    <Text style={styles.menuItemText}>Tarefas</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuItem}>
                    <Clock size={15} color="#94A3B8" />
                    <Text style={styles.menuItemText}>Projetos</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuItem}>
                    <LogOut size={15} color="#94A3B8" />
                    <Text style={styles.menuItemText}>Sair</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.sidebarFooter}>
                  <Globe size={12} color="#64748B" />
                  <Text style={styles.sidebarFooterText}>paineldegestao.com</Text>
                </View>
              </View>

              {/* Conteúdo Central do Dashboard */}
              <ScrollView style={styles.appContent} showsVerticalScrollIndicator={false}>
                {/* 4 Cards com Gráficos Donut no Topo */}
                <View style={styles.chartsGrid}>
                  {/* Card 1: Gráficos Roxo */}
                  <View style={[styles.chartCard, { backgroundColor: '#6366F1' }]}>
                    <Text style={styles.chartCardTitle}>Gráficos</Text>
                    <View style={styles.donutCenterWrap}>
                      <View style={[styles.donutOuter, { borderColor: '#A5B4FC' }]}>
                        <View style={[styles.donutInner, { borderColor: '#F43F5E' }]} />
                      </View>
                    </View>
                  </View>

                  {/* Card 2: Gráficos Laranja */}
                  <View style={[styles.chartCard, { backgroundColor: '#FBBF24' }]}>
                    <Text style={[styles.chartCardTitle, { color: '#78350F' }]}>Gráficos</Text>
                    <View style={styles.donutCenterWrap}>
                      <View style={[styles.donutOuter, { borderColor: '#FEF3C7' }]}>
                        <View style={[styles.donutInner, { borderColor: '#EF4444' }]} />
                      </View>
                    </View>
                  </View>

                  {/* Card 3: Projeto Emada */}
                  <View style={[styles.chartCard, { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0' }]}>
                    <Text style={[styles.chartCardTitle, { color: '#0F172A' }]}>Projeto emada</Text>
                    <View style={styles.donutCenterWrap}>
                      <View style={[styles.donutOuter, { borderColor: '#06B6D4' }]}>
                        <View style={[styles.donutInner, { borderColor: '#F43F5E' }]} />
                      </View>
                    </View>
                  </View>

                  {/* Card 4: Companitor */}
                  <View style={[styles.chartCard, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0' }]}>
                    <Text style={[styles.chartCardTitle, { color: '#0F172A' }]}>Companitor</Text>
                    <View style={styles.donutCenterWrap}>
                      <View style={[styles.donutOuter, { borderColor: '#3B82F6' }]}>
                        <View style={[styles.donutInner, { borderColor: '#E2E8F0' }]} />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Quadro Kanban de Tarefas */}
                <View style={styles.kanbanBoard}>
                  {/* Coluna 1: To-Do */}
                  <View style={styles.kanbanColumn}>
                    <Text style={styles.columnTitle}>To-Do</Text>

                    {kanbanTasks
                      .filter((t) => t.col === 'todo')
                      .map((task) => (
                        <View key={task.id} style={styles.kanbanCard}>
                          <View style={styles.cardHeaderRow}>
                            <TouchableOpacity
                              style={styles.checkboxRound}
                              onPress={() => {
                                setKanbanTasks((prev) =>
                                  prev.map((item) =>
                                    item.id === task.id ? { ...item, done: !item.done } : item
                                  )
                                );
                              }}
                            >
                              {task.done && <Check size={10} color="#3B82F6" />}
                            </TouchableOpacity>
                            <Text style={styles.cardTitle}>{task.title}</Text>
                          </View>

                          <View style={styles.tagsRow}>
                            {task.tags.map((tag, idx) => (
                              <View
                                key={idx}
                                style={[styles.pillTag, { backgroundColor: `${tag.color}22` }]}
                              >
                                <Text style={[styles.pillTagText, { color: tag.color }]}>
                                  {tag.text}
                                </Text>
                              </View>
                            ))}
                          </View>

                          <View style={styles.cardFooterRow}>
                            <Text style={styles.cardDate}>🕒 {task.date}</Text>
                            <img
                              src={task.avatar}
                              alt="avatar"
                              style={{ width: 22, height: 22, borderRadius: 11 }}
                            />
                          </View>
                        </View>
                      ))}
                  </View>

                  {/* Coluna 2: In Progress */}
                  <View style={styles.kanbanColumn}>
                    <Text style={styles.columnTitle}>In Progress</Text>

                    <View style={styles.kanbanCard}>
                      <View style={styles.cardHeaderRow}>
                        <View style={[styles.checkboxRound, { backgroundColor: '#10B981', borderColor: '#10B981' }]}>
                          <Check size={10} color="#FFFFFF" strokeWidth={3} />
                        </View>
                        <Text style={styles.cardTitle}>Evalulzar como concertilhmentos do projeto</Text>
                      </View>
                      <View style={styles.tagsRow}>
                        <View style={[styles.pillTag, { backgroundColor: '#CCFBF1' }]}>
                          <Text style={[styles.pillTagText, { color: '#0F766E' }]}>In Progress</Text>
                        </View>
                      </View>
                      <View style={styles.cardFooterRow}>
                        <Text style={styles.cardDate}>🕒 08.09/Mai - 2023</Text>
                        <img
                          src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face"
                          alt="avatar"
                          style={{ width: 22, height: 22, borderRadius: 11 }}
                        />
                      </View>
                    </View>

                    <View style={styles.kanbanCard}>
                      <View style={styles.cardHeaderRow}>
                        <View style={[styles.checkboxRound, { backgroundColor: '#A16207', borderColor: '#A16207' }]}>
                          <Check size={10} color="#FFFFFF" strokeWidth={3} />
                        </View>
                        <Text style={styles.cardTitle}>Evalulcar como roo parameturo de projetos</Text>
                      </View>
                      <View style={styles.tagsRow}>
                        <View style={[styles.pillTag, { backgroundColor: '#E0F2FE' }]}>
                          <Text style={[styles.pillTagText, { color: '#0284C7' }]}>Swocertilhamento</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Coluna 3: Anotar */}
                  <View style={styles.kanbanColumn}>
                    <Text style={styles.columnTitle}>Anotar</Text>

                    <View style={styles.kanbanCard}>
                      <View style={styles.cardHeaderRow}>
                        <View style={styles.checkboxRound} />
                        <Text style={styles.cardTitle}>Rablica woa docum...</Text>
                      </View>
                      <View style={styles.addCardPlus}>
                        <Plus size={16} color="#94A3B8" />
                      </View>
                    </View>
                  </View>
                </View>

                {/* Rodapé Informativo do Dashboard */}
                <View style={styles.dashboardFooterMeta}>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Categoria</Text>
                    <Text style={styles.metaVal}>Dashboard</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Elemento</Text>
                    <Text style={styles.metaVal}>Painel de gestao</Text>
                  </View>
                  <View style={styles.metaCol}>
                    <Text style={styles.metaLabel}>Conceito</Text>
                    <Text style={styles.metaVal}>Process</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>
        )}

        {/* 3. SIDECAR DE VÍDEOS VERTICAL (NO CANTO DIREITO: MINIATURAS DAS WEBCAMS) */}
        <View style={styles.sidecarContainer}>
          {sidecarParticipants.map((part) => (
            <View
              key={part.identity}
              style={[
                styles.sidecarTile,
                part.isSpeaking && styles.sidecarTileSpeaking,
              ]}
            >
              {/* Foto da Webcam ou Avatar de Iniciais */}
              {part.avatarUrl ? (
                <img
                  src={part.avatarUrl}
                  alt={part.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                  }}
                />
              ) : (
                <View
                  style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#1E293B',
                    justifyContent: 'center',
                    alignItems: 'center',
                  }}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 22,
                      backgroundColor: '#0E72ED',
                      justifyContent: 'center',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ color: '#FFFFFF', fontSize: 16, fontWeight: '700' }}>
                      {part.name.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>
                </View>
              )}

              {/* Pílula de Nome e Mic */}
              <View style={styles.sidecarNamePill}>
                {part.isAudioEnabled ? (
                  <Mic size={11} color="#FFFFFF" />
                ) : (
                  <MicOff size={11} color={ZoomTheme.colors.dangerRed} />
                )}
                <Text style={styles.sidecarNameText} numberOfLines={1}>
                  {part.name}
                </Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121417',
    position: 'relative',
    overflow: 'hidden',
  },
  topFloatingWrapper: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    top: 16,
    left: '50%',
    alignItems: 'center',
    zIndex: 9999,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22C55E',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 4,
    gap: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  greenLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
  },
  statusPillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  stopShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
    gap: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  stopShareText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  floatingToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 29, 33, 0.95)',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 6,
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000000',
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  toolbarItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingHorizontal: 4,
  },
  toolbarItemHighlight: {
    backgroundColor: 'rgba(34, 197, 94, 0.12)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
  },
  toolbarItemActive: {
    backgroundColor: 'rgba(34, 197, 94, 0.18)',
    borderRadius: 4,
  },
  toolbarItemText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '500',
  },
  mainStageWrapper: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: 8,
    paddingBottom: 8,
    gap: 10,
  },
  videoStageContainer: {
    flex: 1,
    backgroundColor: '#000000',
    borderRadius: 8,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  desktopWindow: {
    flex: 1,
    backgroundColor: '#0F1216',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  browserWindow: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.4,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
    display: 'flex',
    flexDirection: 'column',
  },
  browserTabs: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingTop: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  activeTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    gap: 8,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#E2E8F0',
  },
  faviconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  activeTabText: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '500',
  },
  tabCloseX: {
    color: '#94A3B8',
    fontSize: 12,
    marginLeft: 4,
  },
  newTabBtn: {
    padding: 6,
  },
  browserAddressBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 12,
  },
  navIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  urlInputBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  urlText: {
    color: '#334155',
    fontSize: 12,
  },
  appViewport: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
  },
  appSidebar: {
    width: 170,
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
  },
  appBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  appBrandIcon: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  barSlice: {
    width: 4,
    borderRadius: 1,
  },
  appBrandName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  sidebarMenuList: {
    flex: 1,
    gap: 2,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 8,
    borderRadius: 6,
    gap: 10,
  },
  menuItemActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
  },
  menuItemText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '500',
  },
  menuItemTextActive: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  sidebarFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 6,
  },
  sidebarFooterText: {
    color: '#64748B',
    fontSize: 10,
  },
  appContent: {
    flex: 1,
    padding: 16,
  },
  chartsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  chartCard: {
    flex: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  chartCardTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  donutCenterWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  donutOuter: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 5,
  },
  kanbanBoard: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 20,
  },
  kanbanColumn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    padding: 10,
    gap: 8,
  },
  columnTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 4,
  },
  kanbanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 6,
    padding: 10,
    gap: 6,
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkboxRound: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  cardTitle: {
    flex: 1,
    color: '#1E293B',
    fontSize: 11,
    fontWeight: '500',
    lineHeight: 15,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 4,
    flexWrap: 'wrap',
  },
  pillTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pillTagText: {
    fontSize: 9,
    fontWeight: '600',
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cardDate: {
    color: '#64748B',
    fontSize: 10,
  },
  addCardPlus: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dashboardFooterMeta: {
    flexDirection: 'row',
    gap: 24,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  metaCol: {
    flexDirection: 'column',
  },
  metaLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '500',
  },
  metaVal: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '600',
  },
  // QUADRO BRANCO STYLES
  whiteboardWindow: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  whiteboardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  wbHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  wbTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '600',
  },
  wbHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wbPageBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  wbPageText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '500',
  },
  whiteboardCanvas: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    padding: 16,
  },
  wbToolbar: {
    width: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 6,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  wbToolBtn: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wbToolBtnActive: {
    backgroundColor: '#EFF6FF',
  },
  wbToolDivider: {
    width: '80%',
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  wbColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  stickyNotesContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 20,
    paddingLeft: 24,
    alignItems: 'flex-start',
  },
  stickyNote: {
    width: 190,
    padding: 14,
    borderRadius: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    gap: 8,
  },
  stickyTitle: {
    color: '#1E293B',
    fontSize: 12,
    fontWeight: '700',
  },
  stickyBody: {
    color: '#334155',
    fontSize: 11,
    lineHeight: 16,
  },
  stickyFooter: {
    color: '#64748B',
    fontSize: 10,
    marginTop: 6,
  },
  // POWERPOINT STYLES
  powerpointWindow: {
    flex: 1,
    backgroundColor: '#261F1D',
    borderRadius: 8,
    overflow: 'hidden',
  },
  pptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#382D2A',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  pptTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  pptBody: {
    flex: 1,
    flexDirection: 'row',
  },
  pptSlidesNav: {
    width: 110,
    backgroundColor: '#1E1816',
    padding: 10,
    gap: 8,
  },
  pptSlideThumb: {
    width: '100%',
    height: 60,
    backgroundColor: '#2E2522',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 4,
    justifyContent: 'space-between',
  },
  pptSlideThumbActive: {
    borderColor: '#D24726',
    borderWidth: 2,
  },
  pptSlideNum: {
    color: '#94A3B8',
    fontSize: 9,
  },
  pptThumbMiniContent: {
    width: '80%',
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 2,
  },
  pptMainSlide: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 8,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  pptSlideHeading: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  pptSlideSub: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
  },
  pptMetricsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
  },
  pptMetricCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: 150,
  },
  pptMetricVal: {
    color: '#D24726',
    fontSize: 20,
    fontWeight: '800',
  },
  pptMetricLbl: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  // PDF STYLES
  pdfWindow: {
    flex: 1,
    backgroundColor: '#323639',
    borderRadius: 8,
    overflow: 'hidden',
  },
  pdfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#202124',
  },
  pdfHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pdfTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  pdfHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  pdfZoomText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  pdfPageScroll: {
    flex: 1,
  },
  pdfPageContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  pdfSheet: {
    width: '85%',
    maxWidth: 720,
    backgroundColor: '#FFFFFF',
    padding: 32,
    borderRadius: 4,
    shadowColor: '#000000',
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  pdfDocTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  pdfDocMeta: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  pdfDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  pdfSectionHeading: {
    color: '#1E293B',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  pdfParagraph: {
    color: '#334155',
    fontSize: 12,
    lineHeight: 18,
  },
  pdfTable: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 4,
    marginTop: 10,
    overflow: 'hidden',
  },
  pdfTableRowHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  pdfTableCellHeader: {
    flex: 1,
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },
  pdfTableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  pdfTableCell: {
    flex: 1,
    color: '#334155',
    fontSize: 11,
  },
  // EXPLORER STYLES
  explorerWindow: {
    flex: 1,
    backgroundColor: '#191919',
    borderRadius: 8,
    overflow: 'hidden',
  },
  explorerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#202020',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2D2D2D',
  },
  explorerTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '500',
  },
  explorerBody: {
    flex: 1,
    flexDirection: 'row',
  },
  explorerSidebar: {
    width: 160,
    backgroundColor: '#202020',
    padding: 10,
    gap: 6,
  },
  explorerSideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 4,
    gap: 8,
  },
  explorerSideItemActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  explorerSideText: {
    color: '#E2E8F0',
    fontSize: 11,
  },
  explorerGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    gap: 16,
  },
  explorerFolderCard: {
    width: 90,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    gap: 6,
  },
  explorerFileName: {
    color: '#CBD5E1',
    fontSize: 11,
    textAlign: 'center',
  },
  // SIDECAR STYLES
  sidecarContainer: {
    width: 170,
    flexDirection: 'column',
    gap: 8,
    justifyContent: 'flex-start',
  },
  sidecarTile: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#1A1D21',
    borderRadius: 6,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  sidecarTileSpeaking: {
    borderColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOpacity: 0.8,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  sidecarNamePill: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 3,
    gap: 4,
    maxWidth: '90%',
  },
  sidecarNameText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '500',
  },
});
