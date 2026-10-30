import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, Platform } from 'react-native';
import {
  X,
  Send,
  Users,
  Paperclip,
  ChevronDown,
  Search,
  MoreHorizontal,
  Pin,
  Smile,
  Bold,
  Italic,
  Underline,
  FileText,
  MessageSquare,
  Folder,
  Download,
  CornerUpLeft,
} from 'lucide-react-native';
import { ChatMessageData, ParticipantInfo, ChatAttachment, PinnedMessageInfo } from '../../types';
import { ZoomTheme } from '../../styles/theme';
import { ChatMessage } from './ChatMessage';

interface ChatPanelProps {
  messages: ChatMessageData[];
  pinnedMessage?: PinnedMessageInfo | null;
  typingUsers?: string[];
  attachments?: ChatAttachment[];
  uploadProgress?: number | null;
  participants?: ParticipantInfo[];
  onSendMessage: (text: string, recipientIdentity?: string, replyTo?: { id: string; text: string }) => void;
  onSendAttachment?: (file: File, recipientIdentity?: string) => Promise<void>;
  onEmitTyping?: (isTyping: boolean) => void;
  onPinMessage?: (messageId: string, pinnedText: string, linkUrl?: string) => void;
  onClose: () => void;
  isMobile?: boolean;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  messages,
  pinnedMessage,
  typingUsers = [],
  attachments = [],
  uploadProgress = null,
  participants = [],
  onSendMessage,
  onSendAttachment,
  onEmitTyping,
  onPinMessage,
  onClose,
  isMobile = false,
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState<{ identity: string; name: string } | null>(null);
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false);
  const [isSendHovered, setIsSendHovered] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'chat' | 'files'>('chat');
  const [replyingTo, setReplyingTo] = useState<{ id: string; text: string; senderName: string } | null>(null);

  const scrollViewRef = useRef<ScrollView | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingDebounceRef = useRef<any>(null);

  const handleTextChange = (text: string) => {
    setInputText(text);

    if (onEmitTyping) {
      onEmitTyping(true);
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = setTimeout(() => {
        onEmitTyping(false);
      }, 1500);
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    if (onEmitTyping) {
      if (typingDebounceRef.current) clearTimeout(typingDebounceRef.current);
      onEmitTyping(false);
    }

    const replyData = replyingTo ? { id: replyingTo.id, text: replyingTo.text } : undefined;

    if (selectedRecipient) {
      onSendMessage(inputText.trim(), selectedRecipient.identity, replyData);
    } else {
      onSendMessage(inputText.trim(), undefined, replyData);
    }

    setInputText('');
    setReplyingTo(null);
  };

  const handlePaperclipClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onSendAttachment) {
      try {
        await onSendAttachment(file, selectedRecipient?.identity);
      } catch (err) {
        console.warn('Erro ao enviar arquivo:', err);
      }
    }
    // Limpa o input para permitir selecionar o mesmo arquivo novamente
    e.target.value = '';
  };

  return (
    <View
      style={[styles.container, isMobile && styles.containerMobile]}
      accessibilityRole="complementary"
      accessibilityLabel="Painel de Chat"
    >
      {/* Hidden File Input for Native WebRTC File Transfer */}
      {Platform.OS === 'web' && (
        <input
          ref={fileInputRef as any}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileInputChange as any}
        />
      )}

      {/* 1. Header do Chat */}
      <View style={styles.header}>
        <Text style={styles.title}>Chat da Reunião</Text>
        <View style={styles.headerRightActions}>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <Search size={16} color={ZoomTheme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
            <MoreHorizontal size={16} color={ZoomTheme.colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityLabel="Fechar chat"
            activeOpacity={0.7}
          >
            <X size={18} color={ZoomTheme.colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Sub-abas: Chat e Arquivos */}
      <View style={styles.subTabsRow}>
        <TouchableOpacity
          style={[styles.subTabItem, activeSubTab === 'chat' && styles.subTabItemActive]}
          onPress={() => setActiveSubTab('chat')}
          activeOpacity={0.8}
        >
          <MessageSquare size={13} color={activeSubTab === 'chat' ? '#FFFFFF' : '#94A3B8'} />
          <Text style={[styles.subTabText, activeSubTab === 'chat' && styles.subTabTextActive]}>
            Chat {messages.length > 0 ? `(${messages.length})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTabItem, activeSubTab === 'files' && styles.subTabItemActive]}
          onPress={() => setActiveSubTab('files')}
          activeOpacity={0.8}
        >
          <Folder size={13} color={activeSubTab === 'files' ? '#FFFFFF' : '#94A3B8'} />
          <Text style={[styles.subTabText, activeSubTab === 'files' && styles.subTabTextActive]}>
            Arquivos {attachments.length > 0 ? `(${attachments.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 3. Mensagem Fixada no Topo (Pinned Message) */}
      {pinnedMessage && (
        <View style={styles.pinnedBanner}>
          <Pin size={13} color="#F59E0B" />
          <View style={styles.pinnedContent}>
            <Text style={styles.pinnedAuthor}>Fixada por {pinnedMessage.pinnedBy}</Text>
            <Text style={styles.pinnedLink} numberOfLines={2}>
              {pinnedMessage.pinnedText}
            </Text>
          </View>
        </View>
      )}

      {/* Barra de Progresso de Upload */}
      {uploadProgress !== null && (
        <View style={styles.uploadProgressBanner}>
          <View style={styles.uploadProgressHeader}>
            <Text style={styles.uploadProgressTitle}>Enviando arquivo...</Text>
            <Text style={styles.uploadProgressPercent}>{uploadProgress}%</Text>
          </View>
          <View style={styles.uploadProgressBarTrack}>
            <View style={[styles.uploadProgressBarFill, { width: `${uploadProgress}%` }]} />
          </View>
        </View>
      )}

      {/* 4. Corpo do Painel: Aba Chat ou Aba Arquivos */}
      {activeSubTab === 'chat' ? (
        <ScrollView
          ref={scrollViewRef}
          style={styles.messageList}
          contentContainerStyle={styles.messageListContent}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyMessagesContainer}>
              <MessageSquare size={36} color={ZoomTheme.colors.textMuted} />
              <Text style={styles.emptyMessagesTitle}>Nenhuma mensagem ainda</Text>
              <Text style={styles.emptyMessagesSub}>
                Inicie o bate-papo enviando uma mensagem ou arquivo para os participantes da reunião.
              </Text>
            </View>
          ) : (
            messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))
          )}
        </ScrollView>
      ) : (
        /* Aba Arquivos da Sessão */
        <ScrollView style={styles.filesList} contentContainerStyle={styles.filesListContent}>
          {attachments.length === 0 ? (
            <View style={styles.emptyFilesContainer}>
              <Folder size={36} color={ZoomTheme.colors.textMuted} />
              <Text style={styles.emptyMessagesTitle}>Nenhum arquivo compartilhado</Text>
              <Text style={styles.emptyMessagesSub}>
                Arquivos enviados durante a reunião aparecerão aqui para download rápido.
              </Text>
            </View>
          ) : (
            attachments.map((att) => (
              <View key={att.id} style={styles.fileCard}>
                <View style={styles.fileIconBadge}>
                  <Text style={styles.fileBadgeText}>
                    {att.name.split('.').pop()?.toUpperCase() || 'FILE'}
                  </Text>
                </View>
                <View style={styles.fileMetaCol}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {att.name}
                  </Text>
                  <Text style={styles.fileSubText}>
                    {att.sizeFormatted || `${Math.round(att.sizeBytes / 1024)} KB`} • {att.senderName || 'Participante'}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.fileDownloadBtn}
                  onPress={() => {
                    if (att.url && typeof window !== 'undefined') {
                      const a = document.createElement('a');
                      a.href = att.url;
                      a.download = att.name;
                      a.target = '_blank';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }
                  }}
                  accessibilityLabel={`Baixar ${att.name}`}
                >
                  <Download size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* 5. Indicador de Digitação em Tempo Real */}
      {typingUsers.length > 0 && (
        <View style={styles.typingIndicatorRow}>
          <Text style={styles.typingIndicatorDots}>••• </Text>
          <Text style={styles.typingIndicatorText}>
            {typingUsers.length === 1
              ? `${typingUsers[0]} está digitando...`
              : `${typingUsers.join(', ')} estão digitando...`}
          </Text>
        </View>
      )}

      {/* Resposta Ativa */}
      {replyingTo && (
        <View style={styles.replyBanner}>
          <CornerUpLeft size={13} color="#38BDF8" />
          <View style={{ flex: 1 }}>
            <Text style={styles.replyTitle}>Respondendo a {replyingTo.senderName}:</Text>
            <Text style={styles.replyText} numberOfLines={1}>
              {replyingTo.text}
            </Text>
          </View>
          <TouchableOpacity onPress={() => setReplyingTo(null)}>
            <X size={14} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      )}

      {/* 6. Barra Inferior de Entrada & Formatação */}
      <View style={styles.inputContainer}>
        {/* Recipient Selector */}
        <View style={styles.recipientPill}>
          <Text style={styles.recipientLabel}>Para: </Text>
          <TouchableOpacity
            style={styles.recipientTag}
            onPress={() => setShowRecipientDropdown(!showRecipientDropdown)}
            activeOpacity={0.7}
          >
            <Text style={styles.recipientValue}>
              {selectedRecipient ? `${selectedRecipient.name} (Privado)` : 'Todos'}
            </Text>
            <ChevronDown size={12} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Dropdown Menu */}
        {showRecipientDropdown && (
          <View style={styles.recipientDropdown}>
            <TouchableOpacity
              style={styles.dropdownOption}
              onPress={() => {
                setSelectedRecipient(null);
                setShowRecipientDropdown(false);
              }}
            >
              <Text style={styles.dropdownOptionText}>Todos na reunião</Text>
            </TouchableOpacity>
            {participants
              .filter((p) => !p.isLocal)
              .map((p) => (
                <TouchableOpacity
                  key={p.identity}
                  style={styles.dropdownOption}
                  onPress={() => {
                    setSelectedRecipient({ identity: p.identity, name: p.name });
                    setShowRecipientDropdown(false);
                  }}
                >
                  <Text style={styles.dropdownOptionText}>{p.name} (Privado)</Text>
                </TouchableOpacity>
              ))}
          </View>
        )}

        {/* Barra de Formatação e Ações (B, I, U, Anexo, Emoji, Enviar) */}
        <View style={styles.formattingRow}>
          <View style={styles.formatIconsLeft}>
            <TouchableOpacity style={styles.formatIconBtn} activeOpacity={0.7}>
              <Bold size={14} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.formatIconBtn} activeOpacity={0.7}>
              <Italic size={14} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.formatIconBtn} activeOpacity={0.7}>
              <Underline size={14} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.formatIconBtn}
              onPress={handlePaperclipClick}
              activeOpacity={0.7}
              accessibilityLabel="Anexar arquivo"
            >
              <Paperclip size={14} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.formatIconBtn} activeOpacity={0.7}>
              <Smile size={14} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.sendBtn,
              !inputText.trim() && styles.sendBtnDisabled,
              isSendHovered && inputText.trim() ? styles.sendBtnHover : null,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
            accessibilityLabel="Enviar mensagem"
            activeOpacity={0.8}
            // @ts-ignore
            onMouseEnter={() => setIsSendHovered(true)}
            onMouseLeave={() => setIsSendHovered(false)}
          >
            <Send size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Input Text Area */}
        <TextInput
          style={styles.textInput}
          placeholder="Digite uma mensagem..."
          placeholderTextColor={ZoomTheme.colors.textMuted}
          value={inputText}
          onChangeText={handleTextChange}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: ZoomTheme.layout.panelWidth,
    backgroundColor: ZoomTheme.colors.panelBg,
    borderLeftWidth: 1,
    borderLeftColor: ZoomTheme.colors.borderSubtle,
    height: '100%',
    flexDirection: 'column',
    zIndex: 20,
  },
  containerMobile: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    zIndex: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ZoomTheme.spacing.lg,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: ZoomTheme.colors.borderSubtle,
    backgroundColor: ZoomTheme.colors.dockBg,
  },
  title: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: ZoomTheme.typography.subtitle,
    fontWeight: '600',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  closeBtn: {
    padding: 6,
    borderRadius: ZoomTheme.borderRadius.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  subTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#15181D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  subTabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    gap: 6,
  },
  subTabItemActive: {
    backgroundColor: '#2A303A',
  },
  subTabText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500',
  },
  subTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pinnedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  pinnedContent: {
    flex: 1,
  },
  pinnedAuthor: {
    color: '#F59E0B',
    fontSize: 11,
    fontWeight: '700',
  },
  pinnedLink: {
    color: '#E2E8F0',
    fontSize: 11,
    lineHeight: 14,
  },
  uploadProgressBanner: {
    backgroundColor: 'rgba(14, 114, 237, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(14, 114, 237, 0.3)',
    gap: 4,
  },
  uploadProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploadProgressTitle: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '600',
  },
  uploadProgressPercent: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  uploadProgressBarTrack: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  uploadProgressBarFill: {
    height: '100%',
    backgroundColor: ZoomTheme.colors.zoomBlue,
    borderRadius: 2,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    paddingVertical: 12,
    flexGrow: 1,
  },
  emptyMessagesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 10,
    marginTop: 60,
  },
  emptyMessagesTitle: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  emptyMessagesSub: {
    color: ZoomTheme.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  filesList: {
    flex: 1,
  },
  filesListContent: {
    padding: 12,
    gap: 8,
  },
  emptyFilesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    gap: 10,
    marginTop: 60,
  },
  fileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: 6,
    padding: 10,
    gap: 10,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
  },
  fileIconBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  fileBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  fileMetaCol: {
    flex: 1,
  },
  fileName: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  fileSubText: {
    color: ZoomTheme.colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  fileDownloadBtn: {
    backgroundColor: ZoomTheme.colors.zoomBlue,
    padding: 6,
    borderRadius: 4,
  },
  typingIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  typingIndicatorDots: {
    color: '#38BDF8',
    fontSize: 13,
    fontWeight: '800',
  },
  typingIndicatorText: {
    color: '#94A3B8',
    fontSize: 11,
    fontStyle: 'italic',
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#38BDF8',
    gap: 8,
  },
  replyTitle: {
    color: '#38BDF8',
    fontSize: 10,
    fontWeight: '700',
  },
  replyText: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 11,
  },
  inputContainer: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: ZoomTheme.colors.borderSubtle,
    backgroundColor: ZoomTheme.colors.dockBg,
    gap: 8,
    position: 'relative',
  },
  recipientPill: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recipientLabel: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: ZoomTheme.typography.caption,
  },
  recipientTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  recipientValue: {
    color: '#FFFFFF',
    fontSize: ZoomTheme.typography.caption,
    fontWeight: '500',
  },
  recipientDropdown: {
    position: 'absolute',
    bottom: 120,
    left: 12,
    right: 12,
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: ZoomTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    padding: 6,
    zIndex: 100,
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  dropdownOption: {
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  dropdownOptionText: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 12,
  },
  formattingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  formatIconsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  formatIconBtn: {
    padding: 4,
  },
  textInput: {
    backgroundColor: ZoomTheme.colors.inputBg,
    color: ZoomTheme.colors.textPrimary,
    borderRadius: ZoomTheme.borderRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: ZoomTheme.typography.body,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
  },
  sendBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: ZoomTheme.colors.zoomBlue,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: ZoomTheme.colors.zoomBlue,
    shadowOpacity: 0.4,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sendBtnHover: {
    backgroundColor: ZoomTheme.colors.zoomBlueHover,
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    shadowOpacity: 0,
    opacity: 0.4,
  },
});
