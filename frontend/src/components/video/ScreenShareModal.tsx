import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Platform,
} from 'react-native';
import {
  X,
  Search,
  Monitor,
  SlidersHorizontal,
  Folder,
  Check,
  ChevronDown,
  Layers,
  Edit2,
  FileText,
  Chrome,
  Presentation,
  Volume2,
  Video,
} from 'lucide-react-native';
import { ZoomTheme } from '../../styles/theme';

export interface ShareOption {
  id: string;
  title: string;
  category: 'basic' | 'advanced' | 'files';
  type: 'screen' | 'whiteboard' | 'app' | 'file';
  badgeIcon?: string;
  badgeColor?: string;
  previewType: 'conference' | 'whiteboard' | 'dashboard' | 'explorer' | 'powerpoint' | 'pdf';
}

interface ScreenShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: (selectedOption: ShareOption) => void;
}

export const SHARE_OPTIONS: ShareOption[] = [
  {
    id: 'screen-1',
    title: 'Tela 1',
    category: 'basic',
    type: 'screen',
    badgeIcon: 'chrome',
    previewType: 'conference',
  },
  {
    id: 'whiteboard',
    title: 'Quadro Branco',
    category: 'basic',
    type: 'whiteboard',
    badgeColor: '#0E72ED',
    previewType: 'whiteboard',
  },
  {
    id: 'chrome-dashboard',
    title: 'Google Chrome (Painel de Gestão)',
    category: 'basic',
    type: 'app',
    badgeIcon: 'chrome',
    previewType: 'dashboard',
  },
  {
    id: 'explorer',
    title: 'Explorador de Arquivos',
    category: 'basic',
    type: 'app',
    previewType: 'explorer',
  },
  {
    id: 'powerpoint',
    title: 'Apresentação PowerPoint',
    category: 'basic',
    type: 'app',
    badgeColor: '#D24726',
    previewType: 'powerpoint',
  },
  {
    id: 'pdf-doc',
    title: 'Apresentação PDF',
    category: 'basic',
    type: 'file',
    badgeColor: '#E02828',
    previewType: 'pdf',
  },
  // Opções da Aba Avançado
  {
    id: 'portion-screen',
    title: 'Parte da Tela',
    category: 'advanced',
    type: 'screen',
    previewType: 'conference',
  },
  {
    id: 'computer-audio',
    title: 'Apenas Áudio do Computador',
    category: 'advanced',
    type: 'app',
    previewType: 'dashboard',
  },
  // Opções da Aba Arquivos
  {
    id: 'google-drive',
    title: 'Google Drive',
    category: 'files',
    type: 'file',
    previewType: 'pdf',
  },
  {
    id: 'onedrive-files',
    title: 'OneDrive / Nuvem',
    category: 'files',
    type: 'file',
    previewType: 'explorer',
  },
];

export const ScreenShareModal: React.FC<ScreenShareModalProps> = ({
  isOpen,
  onClose,
  onShare,
}) => {
  const [selectedId, setSelectedId] = useState<string>('screen-1');
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced' | 'files'>('basic');
  const [searchQuery, setSearchQuery] = useState('');
  const [shareSound, setShareSound] = useState(true);
  const [optimizeVideo, setOptimizeVideo] = useState(true);
  const [showZoomWindows, setShowZoomWindows] = useState(false);

  if (!isOpen) return null;

  const filteredOptions = SHARE_OPTIONS.filter((opt) => {
    const matchesTab = opt.category === activeTab;
    const matchesSearch = opt.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const handleConfirmShare = () => {
    const selected = SHARE_OPTIONS.find((o) => o.id === selectedId) || SHARE_OPTIONS[0];
    onShare(selected);
  };

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalCard}>
        {/* 1. Header do Modal */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Compartilhar tela, janela ou aplicativo</Text>

          <View style={styles.headerRight}>
            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Search size={14} color={ZoomTheme.colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar janela..."
                placeholderTextColor={ZoomTheme.colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {/* Botão Fechar */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityLabel="Fechar janela de compartilhamento"
            >
              <X size={18} color={ZoomTheme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Abas Segmentadas */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'basic' && styles.tabButtonActive]}
            onPress={() => setActiveTab('basic')}
            activeOpacity={0.8}
          >
            <Monitor size={15} color={activeTab === 'basic' ? '#FFFFFF' : ZoomTheme.colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'basic' && styles.tabTextActive]}>
              Básico
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'advanced' && styles.tabButtonActive]}
            onPress={() => setActiveTab('advanced')}
            activeOpacity={0.8}
          >
            <SlidersHorizontal size={15} color={activeTab === 'advanced' ? '#FFFFFF' : ZoomTheme.colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'advanced' && styles.tabTextActive]}>
              Avançado
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'files' && styles.tabButtonActive]}
            onPress={() => setActiveTab('files')}
            activeOpacity={0.8}
          >
            <Folder size={15} color={activeTab === 'files' ? '#FFFFFF' : ZoomTheme.colors.textMuted} />
            <Text style={[styles.tabText, activeTab === 'files' && styles.tabTextActive]}>
              Arquivos
            </Text>
          </TouchableOpacity>
        </View>

        {/* 3. Grade de Opções de Compartilhamento */}
        <ScrollView style={styles.gridScroll} contentContainerStyle={styles.gridContainer}>
          {filteredOptions.map((option) => {
            const isSelected = selectedId === option.id;

            return (
              <TouchableOpacity
                key={option.id}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => setSelectedId(option.id)}
                activeOpacity={0.85}
              >
                {/* Checkmark no canto superior direito quando selecionado */}
                {isSelected && (
                  <View style={styles.selectedCheckBadge}>
                    <Check size={12} color="#FFFFFF" strokeWidth={3} />
                  </View>
                )}

                {/* Ícone no canto superior esquerdo */}
                <View style={styles.cardHeaderIcon}>
                  {option.badgeIcon === 'chrome' ? (
                    <View style={styles.chromeLogoCircle}>
                      <View style={styles.chromeInnerRed} />
                      <View style={styles.chromeInnerYellow} />
                      <View style={styles.chromeInnerGreen} />
                      <View style={styles.chromeCenterBlue} />
                    </View>
                  ) : option.type === 'whiteboard' ? (
                    <Edit2 size={14} color="#0E72ED" />
                  ) : option.type === 'file' ? (
                    <FileText size={14} color="#E02828" />
                  ) : (
                    <Presentation size={14} color="#D24726" />
                  )}
                </View>

                {/* Preview Visual Mock */}
                <View style={styles.previewBox}>
                  {option.previewType === 'conference' && (
                    <View style={styles.mockConferenceGrid}>
                      <View style={styles.mockMiniTile} />
                      <View style={styles.mockMiniTile} />
                      <View style={styles.mockMiniTile} />
                      <View style={styles.mockMiniTile} />
                      <View style={styles.mockMiniTile} />
                      <View style={styles.mockMiniTile} />
                    </View>
                  )}

                  {option.previewType === 'whiteboard' && (
                    <View style={styles.mockWhiteboard}>
                      <View style={styles.mockFigureLeft} />
                      <View style={styles.mockBoardChart} />
                      <View style={styles.mockFigureRight} />
                    </View>
                  )}

                  {option.previewType === 'dashboard' && (
                    <View style={styles.mockDashboard}>
                      <View style={styles.mockDonutChart1} />
                      <View style={styles.mockDonutChart2} />
                      <View style={styles.mockKanbanRow}>
                        <View style={styles.mockKanbanCard} />
                        <View style={styles.mockKanbanCard} />
                      </View>
                    </View>
                  )}

                  {option.previewType === 'explorer' && (
                    <View style={styles.mockExplorer}>
                      <View style={styles.mockFolderRow}>
                        <View style={styles.mockFolder} />
                        <View style={styles.mockFolder} />
                        <View style={styles.mockFolder} />
                      </View>
                      <View style={styles.mockFileRow}>
                        <View style={styles.mockFile} />
                        <View style={styles.mockFile} />
                      </View>
                    </View>
                  )}

                  {option.previewType === 'powerpoint' && (
                    <View style={styles.mockPowerPoint}>
                      <View style={styles.mockSlideRow}>
                        <View style={styles.mockSlide} />
                        <View style={styles.mockSlide} />
                      </View>
                      <View style={styles.mockSlideRow}>
                        <View style={styles.mockSlide} />
                        <View style={styles.mockSlide} />
                      </View>
                    </View>
                  )}

                  {option.previewType === 'pdf' && (
                    <View style={styles.mockPdf}>
                      <View style={styles.mockPdfHeader} />
                      <View style={styles.mockPdfLine} />
                      <View style={styles.mockPdfLine} />
                      <View style={styles.mockPdfLineShort} />
                    </View>
                  )}
                </View>

                {/* Rótulo inferior do Card */}
                <View
                  style={[
                    styles.cardTitleBar,
                    isSelected && styles.cardTitleBarSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.cardTitleText,
                      isSelected && styles.cardTitleTextSelected,
                    ]}
                    numberOfLines={1}
                  >
                    {option.title}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* 4. Rodapé com Checkboxes de Configuração e Botões */}
        <View style={styles.modalFooter}>
          <View style={styles.footerOptions}>
            {/* Checkbox: Som do Computador */}
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={styles.checkboxTouch}
                onPress={() => setShareSound(!shareSound)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkboxSquare, shareSound && styles.checkboxActive]}>
                  {shareSound && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={styles.checkboxLabel}>Compartilhar som do computador</Text>
              </TouchableOpacity>

              <View style={styles.dropdownBadge}>
                <Text style={styles.dropdownText}>Som do sistema (Padrão)</Text>
                <ChevronDown size={12} color={ZoomTheme.colors.textMuted} />
              </View>
            </View>

            {/* Checkbox: Otimizar para clipe de vídeo */}
            <View style={styles.checkboxRow}>
              <TouchableOpacity
                style={styles.checkboxTouch}
                onPress={() => setOptimizeVideo(!optimizeVideo)}
                activeOpacity={0.8}
              >
                <View style={[styles.checkboxSquare, optimizeVideo && styles.checkboxActive]}>
                  {optimizeVideo && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
                </View>
                <Text style={styles.checkboxLabel}>Otimizar para clipe de vídeo</Text>
              </TouchableOpacity>

              <View style={styles.dropdownBadge}>
                <Text style={styles.dropdownText}>Suave (30 fps)</Text>
                <ChevronDown size={12} color={ZoomTheme.colors.textMuted} />
              </View>
            </View>

            {/* Checkbox: Janelas do Zoom */}
            <TouchableOpacity
              style={styles.checkboxTouch}
              onPress={() => setShowZoomWindows(!showZoomWindows)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkboxSquare, showZoomWindows && styles.checkboxActive]}>
                {showZoomWindows && <Check size={11} color="#FFFFFF" strokeWidth={3} />}
              </View>
              <Text style={styles.checkboxLabel}>Mostrar janelas do Zoom/Conferência</Text>
            </TouchableOpacity>
          </View>

          {/* Botões de Ação */}
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text style={styles.cancelBtnText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleConfirmShare}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="Confirmar Compartilhamento"
            >
              <Text style={styles.shareBtnText}>Compartilhar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    position: (Platform.OS === 'web' ? 'fixed' : 'absolute') as any,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10, 12, 16, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 720,
    backgroundColor: '#1E2228',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000000',
    shadowOpacity: 0.6,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14171B',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    height: 30,
    width: 160,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    padding: 0,
    outlineStyle: 'none' as any,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#15181D',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 8,
    padding: 3,
    gap: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 6,
    gap: 8,
  },
  tabButtonActive: {
    backgroundColor: '#2A303A',
  },
  tabText: {
    color: ZoomTheme.colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  gridScroll: {
    maxHeight: 330,
    paddingHorizontal: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
    paddingBottom: 16,
  },
  optionCard: {
    width: '31.2%',
    backgroundColor: '#15181D',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    overflow: 'hidden',
    position: 'relative',
    height: 132,
    justifyContent: 'space-between',
  },
  optionCardSelected: {
    borderColor: '#2563EB',
    backgroundColor: '#182133',
    shadowColor: '#2563EB',
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 2 },
  },
  selectedCheckBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  cardHeaderIcon: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 9,
  },
  chromeLogoCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FFFFFF',
    position: 'relative',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chromeInnerRed: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: '#EA4335',
  },
  chromeInnerYellow: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '50%',
    height: '50%',
    backgroundColor: '#FBBC05',
  },
  chromeInnerGreen: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '50%',
    height: '50%',
    backgroundColor: '#34A853',
  },
  chromeCenterBlue: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4285F4',
    zIndex: 2,
  },
  previewBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
  },
  mockConferenceGrid: {
    width: '80%',
    height: 54,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 3,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F1216',
    borderRadius: 4,
    padding: 3,
  },
  mockMiniTile: {
    width: '30%',
    height: 22,
    backgroundColor: '#2A303A',
    borderRadius: 2,
  },
  mockWhiteboard: {
    width: '80%',
    height: 54,
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 4,
  },
  mockFigureLeft: {
    width: 14,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#3B82F6',
  },
  mockBoardChart: {
    width: 32,
    height: 32,
    borderWidth: 1,
    borderColor: '#94A3B8',
    borderRadius: 3,
    backgroundColor: '#F8FAFC',
  },
  mockFigureRight: {
    width: 14,
    height: 26,
    borderRadius: 7,
    backgroundColor: '#F59E0B',
  },
  mockDashboard: {
    width: '85%',
    height: 56,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    padding: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mockDonutChart1: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 4,
    borderColor: '#8B5CF6',
  },
  mockDonutChart2: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 4,
    borderColor: '#10B981',
  },
  mockKanbanRow: {
    flex: 1,
    flexDirection: 'column',
    gap: 3,
  },
  mockKanbanCard: {
    height: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mockExplorer: {
    width: '85%',
    height: 56,
    backgroundColor: '#1E232A',
    borderRadius: 4,
    padding: 4,
    justifyContent: 'center',
    gap: 4,
  },
  mockFolderRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  mockFolder: {
    width: 18,
    height: 14,
    backgroundColor: '#F59E0B',
    borderRadius: 2,
  },
  mockFileRow: {
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
  },
  mockFile: {
    width: 14,
    height: 18,
    backgroundColor: '#94A3B8',
    borderRadius: 2,
  },
  mockPowerPoint: {
    width: '85%',
    height: 56,
    backgroundColor: '#261F1D',
    borderRadius: 4,
    padding: 4,
    gap: 4,
  },
  mockSlideRow: {
    flexDirection: 'row',
    gap: 4,
    justifyContent: 'center',
  },
  mockSlide: {
    width: 32,
    height: 20,
    backgroundColor: '#4A3B32',
    borderWidth: 1,
    borderColor: '#D24726',
    borderRadius: 2,
  },
  mockPdf: {
    width: '70%',
    height: 56,
    backgroundColor: '#262A32',
    borderRadius: 4,
    padding: 6,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  mockPdfHeader: {
    height: 6,
    width: '40%',
    backgroundColor: '#EF4444',
    borderRadius: 1,
  },
  mockPdfLine: {
    height: 4,
    width: '100%',
    backgroundColor: '#64748B',
    borderRadius: 1,
  },
  mockPdfLineShort: {
    height: 4,
    width: '70%',
    backgroundColor: '#64748B',
    borderRadius: 1,
  },
  cardTitleBar: {
    backgroundColor: '#1A1D22',
    paddingVertical: 6,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  cardTitleBarSelected: {
    backgroundColor: '#2563EB',
  },
  cardTitleText: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  cardTitleTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#15181D',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  footerOptions: {
    flexDirection: 'column',
    gap: 6,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkboxSquare: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    backgroundColor: '#1B1E23',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkboxLabel: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '400',
  },
  dropdownBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#22262E',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  dropdownText: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 11,
  },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#2A2F37',
  },
  cancelBtnText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '500',
  },
  shareBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#2563EB',
    shadowColor: '#2563EB',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  shareBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
});
