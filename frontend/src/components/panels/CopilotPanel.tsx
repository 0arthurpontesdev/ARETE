import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import {
  X,
  Sparkles,
  FileText,
  FileCheck,
  CheckSquare,
  Bot,
  RefreshCw,
  Copy,
  Check,
  Download,
  Send,
  User,
  Clock,
  Calendar,
  AlertCircle,
  HelpCircle,
  ChevronRight,
  ListTodo,
} from 'lucide-react-native';
import {
  ActionItem,
  ChatMessageData,
  CopilotQAMessage,
  CopilotSummary,
  MeetingMinutes,
  ParticipantInfo,
  TranscriptItem,
} from '../../types';
import { ZoomTheme } from '../../styles/theme';
import { CopilotService, MeetingContextPayload } from '../../services/copilotService';

interface CopilotPanelProps {
  topic?: string;
  duration?: string;
  participants: ParticipantInfo[];
  chatMessages: ChatMessageData[];
  transcripts?: TranscriptItem[];
  onClose: () => void;
  isMobile?: boolean;
}

type CopilotTab = 'summary' | 'minutes' | 'actions' | 'ask';

export const CopilotPanel: React.FC<CopilotPanelProps> = ({
  topic = 'Reunião de Alinhamento Semanal',
  duration = 'Em andamento',
  participants,
  chatMessages,
  transcripts = [],
  onClose,
  isMobile = false,
}) => {
  const [activeTab, setActiveTab] = useState<CopilotTab>('summary');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [copilotStatus, setCopilotStatus] = useState<{ online: boolean; gemini: boolean }>({
    online: true,
    gemini: false,
  });

  // Data states
  const [summary, setSummary] = useState<CopilotSummary | null>(null);
  const [minutes, setMinutes] = useState<MeetingMinutes | null>(null);
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [qaMessages, setQaMessages] = useState<CopilotQAMessage[]>([
    {
      id: 'qa-welcome',
      sender: 'copilot',
      text: 'Olá! Sou o Copilot de IA da Reunião. Posso resumir tópicos, listar decisões, esclarecer o que foi falado ou gerar atas completas. O que você gostaria de saber?',
      timestamp: 'Agora',
    },
  ]);
  const [questionInput, setQuestionInput] = useState<string>('');
  const [isAnswering, setIsAnswering] = useState<boolean>(false);

  const qaScrollRef = useRef<ScrollView>(null);

  // Check health on mount
  useEffect(() => {
    CopilotService.checkHealth().then((status) => {
      setCopilotStatus(status);
    });
  }, []);

  const getMeetingPayload = (): MeetingContextPayload => ({
    topic,
    duration,
    participants,
    transcripts,
    chat_messages: chatMessages,
  });

  // Load initial summary and minutes
  const loadData = async (force: boolean = false) => {
    if (isLoading) return;
    setIsLoading(true);
    const payload = getMeetingPayload();

    try {
      const [sumRes, minRes, actRes] = await Promise.all([
        CopilotService.fetchSummary(payload),
        CopilotService.fetchMinutes(payload),
        CopilotService.fetchActionItems(payload),
      ]);
      setSummary(sumRes);
      setMinutes(minRes);
      setActions(actRes);
    } catch (err) {
      console.error('Error loading Copilot data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Copy Minutes to Clipboard
  const handleCopyMinutes = () => {
    if (!minutes?.formatted_document) return;

    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(minutes.formatted_document);
    }
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Download Minutes as .txt / .md
  const handleDownloadMinutes = () => {
    if (!minutes?.formatted_document) return;

    const content = minutes.formatted_document;
    const filename = `Ata_Reuniao_${new Date().toISOString().slice(0, 10)}.md`;

    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const element = document.createElement('a');
      const file = new Blob([content], { type: 'text/markdown;charset=utf-8' });
      element.href = URL.createObjectURL(file);
      element.download = filename;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  // Toggle Action item completed
  const handleToggleAction = (id: string) => {
    setActions((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'completed' ? 'pending' : 'completed' }
          : item
      )
    );
  };

  // Send question to Q&A
  const handleSendQuestion = async (presetQuestion?: string) => {
    const q = presetQuestion || questionInput;
    if (!q.trim() || isAnswering) return;

    const userMsg: CopilotQAMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q.trim(),
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setQaMessages((prev) => [...prev, userMsg]);
    if (!presetQuestion) setQuestionInput('');
    setIsAnswering(true);

    try {
      const res = await CopilotService.askQuestion(getMeetingPayload(), q.trim());
      const botMsg: CopilotQAMessage = {
        id: `bot-${Date.now()}`,
        sender: 'copilot',
        text: res.answer,
        citations: res.citations,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setQaMessages((prev) => [...prev, botMsg]);
    } catch {
      const errBotMsg: CopilotQAMessage = {
        id: `bot-${Date.now()}`,
        sender: 'copilot',
        text: 'Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      setQaMessages((prev) => [...prev, errBotMsg]);
    } finally {
      setIsAnswering(false);
      setTimeout(() => qaScrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const completedCount = actions.filter((a) => a.status === 'completed').length;

  return (
    <View style={[styles.container, isMobile && styles.mobileContainer]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <View style={styles.sparkleBadge}>
            <Sparkles size={16} color="#A78BFA" />
          </View>
          <View>
            <Text style={styles.headerTitle}>IA Copilot</Text>
            <View style={styles.statusRow}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: copilotStatus.gemini ? '#10B981' : '#F59E0B' },
                ]}
              />
              <Text style={styles.headerSubtitle}>
                {copilotStatus.gemini ? 'Gemini 2.5 Flash Ativo' : 'Motor Analítico Ativo'}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => loadData(true)}
            disabled={isLoading}
            accessibilityLabel="Atualizar IA"
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#A1A5AB" />
            ) : (
              <RefreshCw size={15} color="#A1A5AB" />
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={18} color="#A1A5AB" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'summary' && styles.tabButtonActive]}
          onPress={() => setActiveTab('summary')}
        >
          <FileText
            size={14}
            color={activeTab === 'summary' ? '#FFFFFF' : '#A1A5AB'}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'summary' && styles.tabTextActive]}>
            Resumo
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'minutes' && styles.tabButtonActive]}
          onPress={() => setActiveTab('minutes')}
        >
          <FileCheck
            size={14}
            color={activeTab === 'minutes' ? '#FFFFFF' : '#A1A5AB'}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'minutes' && styles.tabTextActive]}>
            Ata
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'actions' && styles.tabButtonActive]}
          onPress={() => setActiveTab('actions')}
        >
          <CheckSquare
            size={14}
            color={activeTab === 'actions' ? '#FFFFFF' : '#A1A5AB'}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'actions' && styles.tabTextActive]}>
            Tarefas ({actions.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'ask' && styles.tabButtonActive]}
          onPress={() => setActiveTab('ask')}
        >
          <Bot
            size={14}
            color={activeTab === 'ask' ? '#FFFFFF' : '#A1A5AB'}
            style={styles.tabIcon}
          />
          <Text style={[styles.tabText, activeTab === 'ask' && styles.tabTextActive]}>
            Perguntar
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        {/* ================= TAB 1: RESUMO ================= */}
        {activeTab === 'summary' && (
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Meta info card */}
            <View style={styles.metaCard}>
              <View style={styles.metaRow}>
                <Calendar size={13} color="#A1A5AB" />
                <Text style={styles.metaText}>{topic}</Text>
              </View>
              <View style={styles.metaRow}>
                <Clock size={13} color="#A1A5AB" />
                <Text style={styles.metaText}>{duration}</Text>
                <View style={styles.metaDot} />
                <User size={13} color="#A1A5AB" />
                <Text style={styles.metaText}>{participants.length} participantes</Text>
              </View>
            </View>

            {/* Executive summary block */}
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <Sparkles size={15} color="#A78BFA" />
                <Text style={styles.sectionTitle}>Resumo Executivo</Text>
              </View>
              <Text style={styles.bodyText}>
                {summary?.executive_summary ||
                  'Analisando falas e mensagens da reunião para consolidar o resumo executivo...'}
              </Text>
            </View>

            {/* Key discussion points */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionTitle}>Pontos Discutidos</Text>
              {(summary?.key_points || []).map((point, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <View style={styles.bulletDot} />
                  <Text style={styles.bulletText}>{point}</Text>
                </View>
              ))}
            </View>

            {/* Main Decisions */}
            <View style={styles.sectionCard}>
              <Text style={[styles.sectionTitle, { color: '#34D399' }]}>
                Decisões do Encontro
              </Text>
              {(summary?.main_decisions || []).map((decision, idx) => (
                <View key={idx} style={styles.bulletRow}>
                  <View style={[styles.bulletDot, { backgroundColor: '#10B981' }]} />
                  <Text style={styles.bulletText}>{decision}</Text>
                </View>
              ))}
            </View>

            {/* Sentiment & Engagement pill */}
            <View style={styles.tagsRow}>
              <View style={styles.tagPill}>
                <Text style={styles.tagLabel}>Tom:</Text>
                <Text style={styles.tagValue}>{summary?.sentiment || 'Produtivo'}</Text>
              </View>
              <View style={styles.tagPill}>
                <Text style={styles.tagLabel}>Engajamento:</Text>
                <Text style={styles.tagValue}>{summary?.engagement_level || 'Alto'}</Text>
              </View>
            </View>
            <View style={{ height: 24 }} />
          </ScrollView>
        )}

        {/* ================= TAB 2: ATA DA REUNIÃO ================= */}
        {activeTab === 'minutes' && (
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Minutes Top Action Bar */}
            <View style={styles.minutesActionBar}>
              <TouchableOpacity
                style={[styles.actionBtn, isCopied && styles.actionBtnSuccess]}
                onPress={handleCopyMinutes}
              >
                {isCopied ? (
                  <>
                    <Check size={14} color="#10B981" />
                    <Text style={[styles.actionBtnText, { color: '#10B981' }]}>Copiado!</Text>
                  </>
                ) : (
                  <>
                    <Copy size={14} color="#FFFFFF" />
                    <Text style={styles.actionBtnText}>Copiar Ata</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionBtn} onPress={handleDownloadMinutes}>
                <Download size={14} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Baixar (.md)</Text>
              </TouchableOpacity>
            </View>

            {/* Formatted Minutes Document View */}
            <View style={styles.minutesPaper}>
              <Text style={styles.minutesTitle}>
                {minutes?.title?.toUpperCase() || `ATA DA REUNIÃO — ${topic.toUpperCase()}`}
              </Text>
              <Text style={styles.minutesSubtitle}>
                Data: {minutes?.date || '30 de Outubro de 2026'} • Início: {minutes?.start_time || '14:00'} • Duração: {minutes?.duration || duration}
              </Text>
              <Text style={styles.minutesHost}>
                Presidente / Anfitrião: {minutes?.host || 'Arthur'}
              </Text>

              <View style={styles.minutesDivider} />

              <Text style={styles.minutesHeading}>1. Presentes</Text>
              {(minutes?.attendees || []).map((att, idx) => (
                <Text key={idx} style={styles.minutesText}>
                  • {att}
                </Text>
              ))}

              <Text style={styles.minutesHeading}>2. Pauta e Objetivos</Text>
              {(minutes?.agenda || []).map((item, idx) => (
                <Text key={idx} style={styles.minutesText}>
                  {idx + 1}. {item}
                </Text>
              ))}

              <Text style={styles.minutesHeading}>3. Síntese das Discussões</Text>
              {(minutes?.discussions || []).map((disc, idx) => (
                <Text key={idx} style={styles.minutesText}>
                  • {disc}
                </Text>
              ))}

              <Text style={styles.minutesHeading}>4. Deliberações e Decisões</Text>
              {(minutes?.decisions || []).map((dec, idx) => (
                <Text key={idx} style={[styles.minutesText, { color: '#E2E8F0' }]}>
                  • {dec}
                </Text>
              ))}

              <Text style={styles.minutesHeading}>5. Plano de Ação</Text>
              {(minutes?.action_items || []).map((act, idx) => (
                <View key={idx} style={styles.minuteActionItem}>
                  <Text style={styles.minuteActionTask}>
                    [{act.priority}] {act.task}
                  </Text>
                  <Text style={styles.minuteActionSub}>
                    Responsável: {act.assignee} | Prazo: {act.deadline}
                  </Text>
                </View>
              ))}

              <Text style={styles.minutesHeading}>6. Encerramento</Text>
              <Text style={styles.minutesText}>
                {minutes?.closing_statement ||
                  'Nada mais havendo a tratar, a reunião foi formalmente encerrada, sendo lavrada a presente ata.'}
              </Text>
            </View>
            <View style={{ height: 24 }} />
          </ScrollView>
        )}

        {/* ================= TAB 3: TAREFAS ================= */}
        {activeTab === 'actions' && (
          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Progress Bar */}
            <View style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <Text style={styles.progressTitle}>Progresso das Ações</Text>
                <Text style={styles.progressCount}>
                  {completedCount} de {actions.length} concluídas
                </Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${actions.length > 0 ? (completedCount / actions.length) * 100 : 0}%`,
                    },
                  ]}
                />
              </View>
            </View>

            {/* Action items list */}
            {actions.map((item) => {
              const isDone = item.status === 'completed';
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.actionCard, isDone && styles.actionCardDone]}
                  onPress={() => handleToggleAction(item.id)}
                  activeOpacity={0.7}
                >
                  <View style={styles.actionCheckbox}>
                    {isDone ? (
                      <Check size={16} color="#10B981" />
                    ) : (
                      <View style={styles.emptyCheckbox} />
                    )}
                  </View>

                  <View style={styles.actionContent}>
                    <Text style={[styles.actionTaskText, isDone && styles.actionTaskTextDone]}>
                      {item.task}
                    </Text>
                    <View style={styles.actionMetaRow}>
                      <View style={styles.assigneeBadge}>
                        <User size={11} color="#A1A5AB" />
                        <Text style={styles.assigneeText}>{item.assignee}</Text>
                      </View>
                      <View
                        style={[
                          styles.priorityBadge,
                          item.priority === 'Alta' && styles.priorityHigh,
                          item.priority === 'Média' && styles.priorityMedium,
                          item.priority === 'Baixa' && styles.priorityLow,
                        ]}
                      >
                        <Text style={styles.priorityText}>{item.priority}</Text>
                      </View>
                      <Text style={styles.deadlinText}>Prazo: {item.deadline}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
            <View style={{ height: 24 }} />
          </ScrollView>
        )}

        {/* ================= TAB 4: PERGUNTE À IA ================= */}
        {activeTab === 'ask' && (
          <View style={styles.qaContainer}>
            {/* Quick Suggestions Chips */}
            <View style={styles.quickChipsRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {[
                  'Quais decisões foram tomadas?',
                  'Quem ficou com quais tarefas?',
                  'Qual é o tema principal da reunião?',
                ].map((chip, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.quickChip}
                    onPress={() => handleSendQuestion(chip)}
                  >
                    <Text style={styles.quickChipText}>{chip}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Messages Chat */}
            <ScrollView
              ref={qaScrollRef}
              style={styles.qaMessageList}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 10 }}
            >
              {qaMessages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.qaBubble,
                    msg.sender === 'user' ? styles.qaBubbleUser : styles.qaBubbleBot,
                  ]}
                >
                  <View style={styles.qaBubbleHeader}>
                    {msg.sender === 'copilot' ? (
                      <View style={styles.botIconSmall}>
                        <Sparkles size={12} color="#A78BFA" />
                      </View>
                    ) : (
                      <View style={styles.userIconSmall}>
                        <User size={12} color="#93C5FD" />
                      </View>
                    )}
                    <Text style={styles.qaBubbleSender}>
                      {msg.sender === 'copilot' ? 'Copilot IA' : 'Você'}
                    </Text>
                    <Text style={styles.qaBubbleTime}>{msg.timestamp}</Text>
                  </View>

                  <Text style={styles.qaBubbleText}>{msg.text}</Text>

                  {/* Citations if any */}
                  {msg.citations && msg.citations.length > 0 && (
                    <View style={styles.citationsBox}>
                      <Text style={styles.citationsLabel}>Citação de referência:</Text>
                      {msg.citations.map((cite, cIdx) => (
                        <Text key={cIdx} style={styles.citationText}>
                          {cite}
                        </Text>
                      ))}
                    </View>
                  )}
                </View>
              ))}

              {isAnswering && (
                <View style={[styles.qaBubble, styles.qaBubbleBot]}>
                  <View style={styles.typingRow}>
                    <ActivityIndicator size="small" color="#A78BFA" />
                    <Text style={styles.typingText}>Copilot analisando reunião...</Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Input Bar */}
            <View style={styles.qaInputRow}>
              <TextInput
                style={styles.qaTextInput}
                placeholder="Pergunte qualquer coisa sobre a reunião..."
                placeholderTextColor="#6E737C"
                value={questionInput}
                onChangeText={setQuestionInput}
                onSubmitEditing={() => handleSendQuestion()}
                returnKeyType="send"
              />
              <TouchableOpacity
                style={[
                  styles.qaSendBtn,
                  (!questionInput.trim() || isAnswering) && styles.qaSendBtnDisabled,
                ]}
                onPress={() => handleSendQuestion()}
                disabled={!questionInput.trim() || isAnswering}
              >
                <Send size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 360,
    backgroundColor: ZoomTheme.colors.panelBg,
    borderLeftWidth: 1,
    borderLeftColor: ZoomTheme.colors.borderSubtle,
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    zIndex: 20,
  },
  mobileContainer: {
    width: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: ZoomTheme.colors.panelBgHeader,
    borderBottomWidth: 1,
    borderBottomColor: ZoomTheme.colors.borderSubtle,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sparkleBadge: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: 'rgba(167, 139, 250, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ZoomTheme.colors.textPrimary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: ZoomTheme.colors.textSecondary,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: ZoomTheme.colors.hoverBg,
  },
  closeButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: ZoomTheme.colors.hoverBg,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: '#16191D',
    borderBottomWidth: 1,
    borderBottomColor: ZoomTheme.colors.borderSubtle,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: '#272B32',
  },
  tabIcon: {
    marginRight: 4,
  },
  tabText: {
    fontSize: 11,
    fontWeight: '500',
    color: ZoomTheme.colors.textSecondary,
  },
  tabTextActive: {
    color: ZoomTheme.colors.textPrimary,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    backgroundColor: ZoomTheme.colors.stageBg,
  },
  scrollArea: {
    flex: 1,
    padding: 14,
  },
  metaCard: {
    backgroundColor: '#1A1D22',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    gap: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#6E737C',
  },
  metaText: {
    fontSize: 12,
    color: '#D1D5DB',
  },
  sectionCard: {
    backgroundColor: '#1A1D22',
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F3F4F6',
    marginBottom: 6,
  },
  bodyText: {
    fontSize: 12.5,
    lineHeight: 19,
    color: '#D1D5DB',
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 6,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#60A5FA',
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: '#CBD5E1',
  },
  tagsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  tagPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#1F242C',
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tagLabel: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  tagValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  minutesActionBar: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#272B32',
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  actionBtnSuccess: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  minutesPaper: {
    backgroundColor: '#181A1F',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  minutesTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  minutesSubtitle: {
    fontSize: 11,
    color: '#9CA3AF',
    marginTop: 4,
  },
  minutesHost: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#60A5FA',
    marginTop: 4,
  },
  minutesDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 12,
  },
  minutesHeading: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#E5E7EB',
    marginTop: 10,
    marginBottom: 6,
  },
  minutesText: {
    fontSize: 12,
    lineHeight: 18,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  minuteActionItem: {
    backgroundColor: '#21252C',
    padding: 8,
    borderRadius: 6,
    marginVertical: 4,
  },
  minuteActionTask: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F3F4F6',
  },
  minuteActionSub: {
    fontSize: 10.5,
    color: '#9CA3AF',
    marginTop: 2,
  },
  progressCard: {
    backgroundColor: '#1A1D22',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  progressCount: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#2E333D',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  actionCard: {
    flexDirection: 'row',
    backgroundColor: '#1A1D22',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    alignItems: 'flex-start',
    gap: 10,
  },
  actionCardDone: {
    opacity: 0.6,
    backgroundColor: '#16181C',
  },
  actionCheckbox: {
    marginTop: 2,
  },
  emptyCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#6B7280',
  },
  actionContent: {
    flex: 1,
  },
  actionTaskText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#F3F4F6',
    lineHeight: 18,
  },
  actionTaskTextDone: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  actionMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  assigneeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#262A32',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  assigneeText: {
    fontSize: 10.5,
    color: '#D1D5DB',
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#374151',
  },
  priorityHigh: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  priorityMedium: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
  },
  priorityLow: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#E5E7EB',
  },
  deadlinText: {
    fontSize: 10.5,
    color: '#9CA3AF',
  },
  qaContainer: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  quickChipsRow: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  quickChip: {
    backgroundColor: '#22262E',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  quickChipText: {
    fontSize: 11,
    color: '#D1D5DB',
  },
  qaMessageList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  qaBubble: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
  qaBubbleBot: {
    backgroundColor: '#1E222A',
    borderWidth: 1,
    borderColor: 'rgba(167, 139, 250, 0.2)',
  },
  qaBubbleUser: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
    alignSelf: 'flex-end',
    width: '90%',
  },
  qaBubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  botIconSmall: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: 'rgba(167, 139, 250, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userIconSmall: {
    width: 18,
    height: 18,
    borderRadius: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qaBubbleSender: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#E2E8F0',
  },
  qaBubbleTime: {
    fontSize: 10,
    color: '#6B7280',
    marginLeft: 'auto',
  },
  qaBubbleText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#F1F5F9',
  },
  citationsBox: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  citationsLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 2,
  },
  citationText: {
    fontSize: 11,
    color: '#A78BFA',
    fontStyle: 'italic',
  },
  typingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typingText: {
    fontSize: 11.5,
    color: '#A78BFA',
    fontStyle: 'italic',
  },
  qaInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#16191D',
    borderTopWidth: 1,
    borderTopColor: ZoomTheme.colors.borderSubtle,
    gap: 8,
  },
  qaTextInput: {
    flex: 1,
    height: 38,
    backgroundColor: '#262A32',
    borderRadius: 6,
    paddingHorizontal: 12,
    color: '#FFFFFF',
    fontSize: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  qaSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 6,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qaSendBtnDisabled: {
    opacity: 0.4,
  },
});
