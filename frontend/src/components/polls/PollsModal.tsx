import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, ScrollView } from 'react-native';
import { X, Plus, BarChart2, CheckCircle2, Play, Square, Award } from 'lucide-react-native';
import { ZoomTheme } from '../../styles/theme';
import { Poll } from '../../types';

interface PollsModalProps {
  polls: Poll[];
  isHost: boolean;
  onLaunchPoll: (pollId: string) => void;
  onEndPoll: (pollId: string) => void;
  onVote: (pollId: string, optionId: string) => void;
  onCreatePoll: (question: string, options: string[]) => void;
  onClose: () => void;
}

export const PollsModal: React.FC<PollsModalProps> = ({
  polls,
  isHost,
  onLaunchPoll,
  onEndPoll,
  onVote,
  onCreatePoll,
  onClose,
}) => {
  const [isCreating, setIsCreating] = useState(polls.length === 0 && isHost);
  const [newQuestion, setNewQuestion] = useState('');
  const [newOptions, setNewOptions] = useState<string[]>(['', '']);
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({});

  const handleAddOption = () => {
    if (newOptions.length < 6) {
      setNewOptions([...newOptions, '']);
    }
  };

  const handleUpdateOption = (index: number, val: string) => {
    const updated = [...newOptions];
    updated[index] = val;
    setNewOptions(updated);
  };

  const handleSavePoll = () => {
    const validOptions = newOptions.filter((o) => o.trim().length > 0);
    if (!newQuestion.trim() || validOptions.length < 2) return;
    onCreatePoll(newQuestion.trim(), validOptions);
    setNewQuestion('');
    setNewOptions(['', '']);
    setIsCreating(false);
  };

  return (
    <View style={styles.overlay} accessibilityRole="dialog" accessibilityLabel="Enquetes da Reunião">
      <View style={styles.modalCard}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <BarChart2 size={18} color={ZoomTheme.colors.zoomBlue} />
            <Text style={styles.title}>Enquetes ao Vivo</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fechar enquetes">
            <X size={18} color={ZoomTheme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Body */}
        <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
          {isCreating ? (
            <View style={styles.createForm}>
              <Text style={styles.formTitle}>Criar Nova Enquete</Text>
              
              <Text style={styles.label}>Pergunta da Enquete</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Qual o formato ideal para as reuniões diárias?"
                placeholderTextColor={ZoomTheme.colors.textMuted}
                value={newQuestion}
                onChangeText={setNewQuestion}
              />

              <Text style={styles.label}>Opções de Resposta</Text>
              {newOptions.map((opt, idx) => (
                <TextInput
                  key={idx}
                  style={styles.input}
                  placeholder={`Opção ${idx + 1}`}
                  placeholderTextColor={ZoomTheme.colors.textMuted}
                  value={opt}
                  onChangeText={(val) => handleUpdateOption(idx, val)}
                />
              ))}

              {newOptions.length < 6 && (
                <TouchableOpacity style={styles.addOptionBtn} onPress={handleAddOption}>
                  <Plus size={14} color={ZoomTheme.colors.zoomBlue} />
                  <Text style={styles.addOptionText}>Adicionar Opção</Text>
                </TouchableOpacity>
              )}

              <View style={styles.formButtonsRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsCreating(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancelar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.primaryBtn,
                    (!newQuestion.trim() || newOptions.filter((o) => o.trim()).length < 2) &&
                      styles.primaryBtnDisabled,
                  ]}
                  onPress={handleSavePoll}
                  disabled={!newQuestion.trim() || newOptions.filter((o) => o.trim()).length < 2}
                >
                  <Text style={styles.primaryBtnText}>Salvar Enquete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.pollList}>
              {polls.length === 0 ? (
                <View style={styles.emptyState}>
                  <BarChart2 size={40} color={ZoomTheme.colors.textMuted} />
                  <Text style={styles.emptyText}>Nenhuma enquete ativa no momento.</Text>
                  {isHost && (
                    <TouchableOpacity
                      style={styles.primaryBtn}
                      onPress={() => setIsCreating(true)}
                    >
                      <Plus size={16} color="#FFF" />
                      <Text style={styles.primaryBtnText}>Criar Primeira Enquete</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                polls.map((poll) => {
                  const hasVoted = Boolean(selectedVotes[poll.id]);
                  return (
                    <View key={poll.id} style={styles.pollCard}>
                      <View style={styles.pollHeader}>
                        <Text style={styles.pollQuestion}>{poll.question}</Text>
                        <View
                          style={[
                            styles.statusBadge,
                            poll.isActive ? styles.statusActive : styles.statusEnded,
                          ]}
                        >
                          <Text style={styles.statusText}>
                            {poll.isActive ? 'AO VIVO' : 'ENCERRADA'}
                          </Text>
                        </View>
                      </View>

                      {/* Options List */}
                      <View style={styles.optionsList}>
                        {poll.options.map((opt) => {
                          const percentage =
                            poll.totalVotes > 0
                              ? Math.round((opt.votes / poll.totalVotes) * 100)
                              : 0;
                          const isSelected = selectedVotes[poll.id] === opt.id;

                          return (
                            <TouchableOpacity
                              key={opt.id}
                              style={[
                                styles.optionRow,
                                isSelected && styles.optionRowSelected,
                              ]}
                              onPress={() => {
                                if (poll.isActive && !hasVoted) {
                                  setSelectedVotes({ ...selectedVotes, [poll.id]: opt.id });
                                  onVote(poll.id, opt.id);
                                }
                              }}
                              disabled={!poll.isActive || hasVoted}
                              activeOpacity={0.7}
                            >
                              {/* Background percentage fill */}
                              <View
                                style={[
                                  styles.progressFill,
                                  { width: `${percentage}%` },
                                  isSelected && styles.progressFillSelected,
                                ]}
                              />
                              <View style={styles.optionContent}>
                                <Text style={styles.optionText}>{opt.text}</Text>
                                <Text style={styles.percentageText}>
                                  {percentage}% ({opt.votes})
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Host Actions */}
                      {isHost && (
                        <View style={styles.pollCardActions}>
                          {poll.isActive ? (
                            <TouchableOpacity
                              style={styles.endPollBtn}
                              onPress={() => onEndPoll(poll.id)}
                            >
                              <Square size={14} color="#FFF" />
                              <Text style={styles.endPollText}>Encerrar Enquete</Text>
                            </TouchableOpacity>
                          ) : (
                            <TouchableOpacity
                              style={styles.launchPollBtn}
                              onPress={() => onLaunchPoll(poll.id)}
                            >
                              <Play size={14} color="#FFF" />
                              <Text style={styles.launchPollText}>Reabrir Enquete</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </View>
          )}
        </ScrollView>

        {/* Footer */}
        {!isCreating && isHost && polls.length > 0 && (
          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.newPollBtn}
              onPress={() => setIsCreating(true)}
            >
              <Plus size={16} color={ZoomTheme.colors.zoomBlue} />
              <Text style={styles.newPollText}>Nova Enquete</Text>
            </TouchableOpacity>
          </View>
        )}
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
    backgroundColor: ZoomTheme.colors.modalBackdrop,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 560,
    maxHeight: '85%',
    backgroundColor: ZoomTheme.colors.panelBg,
    borderRadius: ZoomTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
  },
  header: {
    height: 52,
    backgroundColor: ZoomTheme.colors.dockBg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: ZoomTheme.colors.borderSubtle,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: ZoomTheme.typography.subtitle,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 20,
  },
  createForm: {
    gap: 12,
  },
  formTitle: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: ZoomTheme.typography.title,
    fontWeight: '600',
    marginBottom: 4,
  },
  label: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: ZoomTheme.typography.bodySmall,
    fontWeight: '500',
  },
  input: {
    backgroundColor: ZoomTheme.colors.inputBg,
    color: ZoomTheme.colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: ZoomTheme.borderRadius.sm,
    fontSize: 13,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
  },
  addOptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  addOptionText: {
    color: ZoomTheme.colors.zoomBlue,
    fontSize: 13,
    fontWeight: '600',
  },
  formButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  cancelBtnText: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 13,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ZoomTheme.colors.zoomBlue,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: ZoomTheme.borderRadius.sm,
  },
  primaryBtnDisabled: {
    backgroundColor: ZoomTheme.colors.disabledBg,
    opacity: 0.5,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  pollList: {
    gap: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 14,
  },
  emptyText: {
    color: ZoomTheme.colors.textMuted,
    fontSize: 14,
  },
  pollCard: {
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: ZoomTheme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    gap: 12,
  },
  pollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  pollQuestion: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: 'rgba(35, 209, 96, 0.15)',
  },
  statusEnded: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    color: ZoomTheme.colors.successGreen,
  },
  optionsList: {
    gap: 8,
  },
  optionRow: {
    position: 'relative',
    backgroundColor: ZoomTheme.colors.inputBg,
    borderRadius: ZoomTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    overflow: 'hidden',
  },
  optionRowSelected: {
    borderColor: ZoomTheme.colors.zoomBlue,
  },
  progressFill: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  progressFillSelected: {
    backgroundColor: 'rgba(14, 114, 237, 0.25)',
  },
  optionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    zIndex: 2,
  },
  optionText: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  percentageText: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  pollCardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: ZoomTheme.colors.borderSubtle,
    paddingTop: 10,
  },
  endPollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ZoomTheme.colors.dangerRed,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  endPollText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  launchPollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ZoomTheme.colors.zoomBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  launchPollText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: ZoomTheme.colors.borderSubtle,
    backgroundColor: ZoomTheme.colors.dockBg,
    alignItems: 'center',
  },
  newPollBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  newPollText: {
    color: ZoomTheme.colors.zoomBlue,
    fontSize: 13,
    fontWeight: '600',
  },
});
