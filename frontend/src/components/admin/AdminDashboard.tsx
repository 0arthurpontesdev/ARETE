import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput } from 'react-native';
import {
  X,
  Video,
  Calendar,
  Users,
  FileText,
  CreditCard,
  Download,
  Plus,
  Play,
  Copy,
  Check,
  Clock,
  Sparkles,
  ExternalLink,
  Shield,
  Layers,
  Circle,
} from 'lucide-react-native';
import { ZoomTheme } from '../../styles/theme';
import {
  LoomClip,
  ScheduleBooking,
  OrganizationAccount,
  MeetingReportItem,
} from '../../types';

interface AdminDashboardProps {
  onClose: () => void;
  onStartMeetingFromSchedule?: (meetingId: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  onClose,
  onStartMeetingFromSchedule,
}) => {
  const [activeTab, setActiveTab] = useState<'loom' | 'calendly' | 'users' | 'reports'>('loom');
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // 1. Loom-like Clips State
  const [clips, setClips] = useState<LoomClip[]>([
    {
      id: 'clip_1',
      title: 'Atualização Semanal do Sprint #42',
      durationSeconds: 145,
      videoUrl: 'https://example.com/clips/sprint-42',
      createdAt: 'Hoje às 09:30',
    },
    {
      id: 'clip_2',
      title: 'Demonstração de Onboarding do Usuário',
      durationSeconds: 88,
      videoUrl: 'https://example.com/clips/onboarding-demo',
      createdAt: 'Ontem às 16:15',
    },
  ]);
  const [isLoomRecording, setIsLoomRecording] = useState(false);
  const [loomClipTitle, setLoomClipTitle] = useState('');

  // 2. Calendly-like Scheduler State
  const [bookings, setBookings] = useState<ScheduleBooking[]>([
    {
      id: 'bk_1',
      title: 'Alinhamento de Arquitetura WebRTC',
      hostName: 'Arthur Silva',
      hostEmail: 'arthur@empresa.com',
      date: '2026-11-02',
      startTime: '14:00',
      endTime: '14:45',
      durationMinutes: 45,
      guestName: 'Carlos Engenharia',
      guestEmail: 'carlos@partner.com',
      meetingCode: '839-294-1102',
    },
    {
      id: 'bk_2',
      title: 'Demonstração Comercial do Sistema',
      hostName: 'Arthur Silva',
      hostEmail: 'arthur@empresa.com',
      date: '2026-11-03',
      startTime: '10:00',
      endTime: '10:30',
      durationMinutes: 30,
      guestName: 'Mariana Diretoria',
      guestEmail: 'mariana@cliente.com',
      meetingCode: '492-104-9844',
    },
  ]);
  const [publicBookingSlug, setPublicBookingSlug] = useState('arthur-silva');

  // 3. User & License Management State
  const [account, setAccount] = useState<OrganizationAccount>({
    orgName: 'ARETÉ Enterprise Tech',
    plan: 'Enterprise',
    licensesUsed: 14,
    totalLicenses: 25,
    domain: 'arete.com.br',
    billingCycle: 'Anual',
    nextBillingDate: '15/12/2026',
  });
  const [usersList, setUsersList] = useState([
    { id: 'u1', name: 'Arthur Silva', email: 'arthur@arete.com.br', role: 'Proprietário (Admin)', license: 'Enterprise Host' },
    { id: 'u2', name: 'Beatriz Lima', email: 'beatriz@arete.com.br', role: 'Administrador', license: 'Enterprise Host' },
    { id: 'u3', name: 'Carlos Santos', email: 'carlos@arete.com.br', role: 'Membro', license: 'Standard' },
    { id: 'u4', name: 'Daniela Rocha', email: 'daniela@arete.com.br', role: 'Membro', license: 'Standard' },
  ]);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');

  // 4. Reports & Attendance State
  const [reports, setReports] = useState<MeetingReportItem[]>([
    {
      id: 'rep_1',
      meetingId: '839-294-1102',
      topic: 'Daily Standup & Arquitetura',
      startTime: '30/10/2026 09:00',
      duration: '38 minutos',
      participantCount: 5,
      pollCount: 1,
      attendees: [
        { name: 'Arthur Silva (Host)', email: 'arthur@arete.com.br', joinTime: '09:00', leaveTime: '09:38', duration: '38m' },
        { name: 'Beatriz Lima', email: 'beatriz@arete.com.br', joinTime: '09:01', leaveTime: '09:38', duration: '37m' },
        { name: 'Carlos Santos', email: 'carlos@arete.com.br', joinTime: '09:05', leaveTime: '09:35', duration: '30m' },
      ],
    },
    {
      id: 'rep_2',
      meetingId: '582-194-3942',
      topic: 'Revisão Trimestral de Metas',
      startTime: '28/10/2026 14:00',
      duration: '54 minutos',
      participantCount: 12,
      pollCount: 2,
      attendees: [
        { name: 'Arthur Silva', email: 'arthur@arete.com.br', joinTime: '14:00', leaveTime: '14:54', duration: '54m' },
      ],
    },
  ]);

  const handleCopy = (text: string, id: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedLink(id);
      setTimeout(() => setCopiedLink(null), 2500);
    }
  };

  const handleSimulateLoomRecording = () => {
    setIsLoomRecording(true);
    setTimeout(() => {
      setIsLoomRecording(false);
      const title = loomClipTitle.trim() || `Gravação Rápida #${clips.length + 1}`;
      const newClip: LoomClip = {
        id: `clip_${Date.now()}`,
        title,
        durationSeconds: 42,
        videoUrl: `https://zoom.local/clips/view/${Date.now()}`,
        createdAt: 'Agora mesmo',
      };
      setClips([newClip, ...clips]);
      setLoomClipTitle('');
    }, 2500);
  };

  const handleAddUser = () => {
    if (!newUserName.trim() || !newUserEmail.trim()) return;
    setUsersList([
      ...usersList,
      {
        id: `u_${Date.now()}`,
        name: newUserName.trim(),
        email: newUserEmail.trim(),
        role: 'Membro',
        license: 'Standard',
      },
    ]);
    setNewUserName('');
    setNewUserEmail('');
  };

  const handleExportCSV = (report: MeetingReportItem) => {
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      'Nome,Email,Hora de Entrada,Hora de Saída,Duração\n' +
      report.attendees
        .map((a) => `"${a.name}","${a.email}","${a.joinTime}","${a.leaveTime}","${a.duration}"`)
        .join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `presenca_reuniao_${report.meetingId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <View style={styles.overlay} accessibilityRole="dialog" accessibilityLabel="Portal de Gestão Zoom">
      <View style={styles.dashboardContainer}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <View style={styles.brandIconBox}>
              <Layers size={18} color="#FFF" />
            </View>
            <View>
              <Text style={styles.headerTitle}>Painel Administrativo & Gestão Zoom</Text>
              <Text style={styles.headerSubtitle}>
                {account.orgName} • Plano {account.plan}
              </Text>
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fechar painel">
            <X size={18} color={ZoomTheme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Navigation Sidebar & Content */}
        <View style={styles.mainLayout}>
          {/* Sidebar Tabs */}
          <View style={styles.sidebar}>
            <TouchableOpacity
              style={[styles.sidebarTab, activeTab === 'loom' && styles.sidebarTabActive]}
              onPress={() => setActiveTab('loom')}
            >
              <Video size={16} color={activeTab === 'loom' ? ZoomTheme.colors.zoomBlue : ZoomTheme.colors.textSecondary} />
              <Text style={[styles.sidebarTabText, activeTab === 'loom' && styles.sidebarTabTextActive]}>
                Clipes (Loom-like)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sidebarTab, activeTab === 'calendly' && styles.sidebarTabActive]}
              onPress={() => setActiveTab('calendly')}
            >
              <Calendar size={16} color={activeTab === 'calendly' ? ZoomTheme.colors.zoomBlue : ZoomTheme.colors.textSecondary} />
              <Text style={[styles.sidebarTabText, activeTab === 'calendly' && styles.sidebarTabTextActive]}>
                Agendador (Calendly)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sidebarTab, activeTab === 'users' && styles.sidebarTabActive]}
              onPress={() => setActiveTab('users')}
            >
              <Users size={16} color={activeTab === 'users' ? ZoomTheme.colors.zoomBlue : ZoomTheme.colors.textSecondary} />
              <Text style={[styles.sidebarTabText, activeTab === 'users' && styles.sidebarTabTextActive]}>
                Contas e Licenças
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sidebarTab, activeTab === 'reports' && styles.sidebarTabActive]}
              onPress={() => setActiveTab('reports')}
            >
              <FileText size={16} color={activeTab === 'reports' ? ZoomTheme.colors.zoomBlue : ZoomTheme.colors.textSecondary} />
              <Text style={[styles.sidebarTabText, activeTab === 'reports' && styles.sidebarTabTextActive]}>
                Relatórios e Presença
              </Text>
            </TouchableOpacity>
          </View>

          {/* Tab Content */}
          <ScrollView style={styles.contentPane} contentContainerStyle={styles.contentPaneScroll}>
            {/* 1. Loom-like Clips */}
            {activeTab === 'loom' && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Clipes Curtos Assíncronos</Text>
                    <Text style={styles.sectionDesc}>
                      Grave mensagens de vídeo com tela e bolha de webcam para comunicação assíncrona ágil.
                    </Text>
                  </View>
                </View>

                {/* Recorder Box */}
                <View style={styles.recorderCard}>
                  <View style={styles.recorderLeft}>
                    <View style={styles.cameraBubblePreview}>
                      <Video size={24} color="#FFF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.recorderCardTitle}>Novo Clipe de Tela + Câmera</Text>
                      <TextInput
                        style={styles.clipTitleInput}
                        placeholder="Dê um título ao clipe (ex: Instruções do Projeto)..."
                        placeholderTextColor={ZoomTheme.colors.textMuted}
                        value={loomClipTitle}
                        onChangeText={setLoomClipTitle}
                      />
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.startRecordBtn, isLoomRecording && styles.startRecordBtnActive]}
                    onPress={handleSimulateLoomRecording}
                    disabled={isLoomRecording}
                  >
                    <Circle size={14} color="#FFF" fill="#FFF" />
                    <Text style={styles.startRecordBtnText}>
                      {isLoomRecording ? 'Gravando Clipe...' : 'Gravar Clipe'}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Clips Library */}
                <Text style={styles.subSectionTitle}>Biblioteca de Clipes Gravados</Text>
                <View style={styles.clipsGrid}>
                  {clips.map((clip) => (
                    <View key={clip.id} style={styles.clipCard}>
                      <View style={styles.clipThumb}>
                        <Play size={24} color="#FFF" />
                        <Text style={styles.clipDuration}>
                          {Math.floor(clip.durationSeconds / 60)}:
                          {(clip.durationSeconds % 60).toString().padStart(2, '0')}
                        </Text>
                      </View>
                      <View style={styles.clipInfo}>
                        <Text style={styles.clipName} numberOfLines={1}>{clip.title}</Text>
                        <Text style={styles.clipDate}>{clip.createdAt}</Text>
                        <View style={styles.clipActions}>
                          <TouchableOpacity
                            style={styles.clipActionBtn}
                            onPress={() => handleCopy(clip.videoUrl, clip.id)}
                          >
                            {copiedLink === clip.id ? (
                              <Check size={13} color={ZoomTheme.colors.successGreen} />
                            ) : (
                              <Copy size={13} color={ZoomTheme.colors.textSecondary} />
                            )}
                            <Text style={styles.clipActionText}>
                              {copiedLink === clip.id ? 'Copiado!' : 'Copiar Link'}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 2. Calendly-like Scheduler */}
            {activeTab === 'calendly' && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Agendador Público de Reuniões</Text>
                    <Text style={styles.sectionDesc}>
                      Compartilhe seu link de agendamento para permitir que clientes e colegas marquem reuniões diretamente no seu Zoom.
                    </Text>
                  </View>
                </View>

                {/* Public Link Card */}
                <View style={styles.publicLinkCard}>
                  <Text style={styles.publicLinkLabel}>Seu Link de Agendamento:</Text>
                  <View style={styles.publicLinkRow}>
                    <Text style={styles.publicLinkText}>
                      https://zoom.local/schedule/{publicBookingSlug}
                    </Text>
                    <TouchableOpacity
                      style={styles.copySmallBtn}
                      onPress={() =>
                        handleCopy(`https://zoom.local/schedule/${publicBookingSlug}`, 'booking-url')
                      }
                    >
                      {copiedLink === 'booking-url' ? (
                        <Check size={14} color="#FFF" />
                      ) : (
                        <Copy size={14} color="#FFF" />
                      )}
                      <Text style={styles.copySmallText}>
                        {copiedLink === 'booking-url' ? 'Copiado' : 'Copiar Link'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Booked Meetings List */}
                <Text style={styles.subSectionTitle}>Próximas Reuniões Agendadas</Text>
                <View style={styles.bookingsList}>
                  {bookings.map((b) => (
                    <View key={b.id} style={styles.bookingCard}>
                      <View style={styles.bookingLeft}>
                        <Text style={styles.bookingTitle}>{b.title}</Text>
                        <View style={styles.bookingMetaRow}>
                          <Clock size={13} color={ZoomTheme.colors.textMuted} />
                          <Text style={styles.bookingMeta}>
                            {b.date} • {b.startTime} às {b.endTime} ({b.durationMinutes} min)
                          </Text>
                        </View>
                        <Text style={styles.bookingGuest}>
                          Participante: {b.guestName} ({b.guestEmail})
                        </Text>
                      </View>
                      <View style={styles.bookingRight}>
                        <Text style={styles.bookingCode}>Sala: {b.meetingCode}</Text>
                        {onStartMeetingFromSchedule && (
                          <TouchableOpacity
                            style={styles.startScheduledBtn}
                            onPress={() => onStartMeetingFromSchedule(b.meetingCode)}
                          >
                            <Play size={13} color="#FFF" />
                            <Text style={styles.startScheduledBtnText}>Iniciar</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 3. Account and Licenses */}
            {activeTab === 'users' && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Gestão de Contas e Licenças</Text>
                    <Text style={styles.sectionDesc}>
                      Administre o plano corporativo, alocação de licenças e membros da organização.
                    </Text>
                  </View>
                </View>

                {/* Plan Stats Overview */}
                <View style={styles.planStatsGrid}>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Plano Ativo</Text>
                    <Text style={styles.statValue}>{account.plan}</Text>
                    <Text style={styles.statSub}>Faturamento {account.billingCycle}</Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Licenças em Uso</Text>
                    <Text style={styles.statValue}>
                      {account.licensesUsed} / {account.totalLicenses}
                    </Text>
                    <Text style={styles.statSub}>
                      {account.totalLicenses - account.licensesUsed} licenças disponíveis
                    </Text>
                  </View>
                  <View style={styles.statBox}>
                    <Text style={styles.statLabel}>Domínio Verificado</Text>
                    <Text style={styles.statValue}>{account.domain}</Text>
                    <Text style={styles.statSub}>SSO Ativo</Text>
                  </View>
                </View>

                {/* Add User Bar */}
                <View style={styles.addUserCard}>
                  <Text style={styles.addUserTitle}>Adicionar Novo Membro</Text>
                  <View style={styles.addUserRow}>
                    <TextInput
                      style={styles.addUserInput}
                      placeholder="Nome completo..."
                      placeholderTextColor={ZoomTheme.colors.textMuted}
                      value={newUserName}
                      onChangeText={setNewUserName}
                    />
                    <TextInput
                      style={styles.addUserInput}
                      placeholder="Email corporativo..."
                      placeholderTextColor={ZoomTheme.colors.textMuted}
                      value={newUserEmail}
                      onChangeText={setNewUserEmail}
                    />
                    <TouchableOpacity style={styles.addUserBtn} onPress={handleAddUser}>
                      <Plus size={16} color="#FFF" />
                      <Text style={styles.addUserBtnText}>Convidar</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Members Table */}
                <Text style={styles.subSectionTitle}>Membros da Organização ({usersList.length})</Text>
                <View style={styles.tableCard}>
                  {usersList.map((u, i) => (
                    <View key={u.id} style={[styles.tableRow, i > 0 && styles.tableRowBorder]}>
                      <View style={{ flex: 1.5 }}>
                        <Text style={styles.userName}>{u.name}</Text>
                        <Text style={styles.userEmail}>{u.email}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.userRole}>{u.role}</Text>
                      </View>
                      <View style={{ flex: 1, alignItems: 'flex-end' }}>
                        <View style={styles.licenseBadge}>
                          <Text style={styles.licenseBadgeText}>{u.license}</Text>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* 4. Reports & Attendance */}
            {activeTab === 'reports' && (
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <View>
                    <Text style={styles.sectionTitle}>Relatórios de Uso e Presença</Text>
                    <Text style={styles.sectionDesc}>
                      Consulte o histórico de reuniões realizadas, dados de presença dos participantes e exporte relatórios em CSV.
                    </Text>
                  </View>
                </View>

                <View style={styles.reportsList}>
                  {reports.map((rep) => (
                    <View key={rep.id} style={styles.reportCard}>
                      <View style={styles.reportHeader}>
                        <View>
                          <Text style={styles.reportTopic}>{rep.topic}</Text>
                          <Text style={styles.reportMeta}>
                            ID: {rep.meetingId} • Início: {rep.startTime} • Duração: {rep.duration}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={styles.exportBtn}
                          onPress={() => handleExportCSV(rep)}
                        >
                          <Download size={14} color="#FFF" />
                          <Text style={styles.exportBtnText}>Exportar CSV</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Attendance sub-table */}
                      <View style={styles.attendanceTable}>
                        <View style={styles.attendanceHeader}>
                          <Text style={[styles.attendanceHeadCol, { flex: 2 }]}>Participante</Text>
                          <Text style={[styles.attendanceHeadCol, { flex: 1 }]}>Entrada</Text>
                          <Text style={[styles.attendanceHeadCol, { flex: 1 }]}>Saída</Text>
                          <Text style={[styles.attendanceHeadCol, { flex: 1, textAlign: 'right' }]}>
                            Permanência
                          </Text>
                        </View>
                        {rep.attendees.map((att, idx) => (
                          <View key={idx} style={styles.attendanceRow}>
                            <View style={{ flex: 2 }}>
                              <Text style={styles.attName}>{att.name}</Text>
                              <Text style={styles.attEmail}>{att.email}</Text>
                            </View>
                            <Text style={[styles.attCol, { flex: 1 }]}>{att.joinTime}</Text>
                            <Text style={[styles.attCol, { flex: 1 }]}>{att.leaveTime}</Text>
                            <Text style={[styles.attCol, { flex: 1, textAlign: 'right', fontWeight: '600' }]}>
                              {att.duration}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
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
    backgroundColor: ZoomTheme.colors.modalBackdrop,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: 20,
  },
  dashboardContainer: {
    width: '100%',
    maxWidth: 960,
    height: '90%',
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
    height: 60,
    backgroundColor: ZoomTheme.colors.dockBg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: ZoomTheme.colors.borderSubtle,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: ZoomTheme.colors.zoomBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: ZoomTheme.colors.textMuted,
    fontSize: 11,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  sidebar: {
    width: 210,
    backgroundColor: ZoomTheme.colors.dockBg,
    borderRightWidth: 1,
    borderRightColor: ZoomTheme.colors.borderSubtle,
    paddingVertical: 12,
  },
  sidebarTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sidebarTabActive: {
    backgroundColor: 'rgba(14, 114, 237, 0.12)',
    borderLeftWidth: 3,
    borderLeftColor: ZoomTheme.colors.zoomBlue,
  },
  sidebarTabText: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  sidebarTabTextActive: {
    color: ZoomTheme.colors.zoomBlue,
    fontWeight: '600',
  },
  contentPane: {
    flex: 1,
  },
  contentPaneScroll: {
    padding: 24,
  },
  section: {
    gap: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sectionTitle: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  sectionDesc: {
    color: ZoomTheme.colors.textMuted,
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  subSectionTitle: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  recorderCard: {
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: ZoomTheme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  recorderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  cameraBubblePreview: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: ZoomTheme.colors.zoomBlue,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  recorderCardTitle: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  clipTitleInput: {
    backgroundColor: ZoomTheme.colors.inputBg,
    color: ZoomTheme.colors.textPrimary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    fontSize: 12,
  },
  startRecordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: ZoomTheme.colors.dangerRed,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: ZoomTheme.borderRadius.sm,
  },
  startRecordBtnActive: {
    backgroundColor: ZoomTheme.colors.warningYellow,
  },
  startRecordBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
  },
  clipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  clipCard: {
    width: '48%',
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: ZoomTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    overflow: 'hidden',
  },
  clipThumb: {
    height: 110,
    backgroundColor: '#0A0C0E',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  clipDuration: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    color: '#FFF',
    fontSize: 11,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  clipInfo: {
    padding: 12,
    gap: 4,
  },
  clipName: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  clipDate: {
    color: ZoomTheme.colors.textMuted,
    fontSize: 11,
  },
  clipActions: {
    marginTop: 8,
    flexDirection: 'row',
  },
  clipActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 4,
  },
  clipActionText: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  publicLinkCard: {
    backgroundColor: 'rgba(14, 114, 237, 0.08)',
    borderRadius: ZoomTheme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(14, 114, 237, 0.25)',
    gap: 8,
  },
  publicLinkLabel: {
    color: ZoomTheme.colors.zoomBlue,
    fontSize: 12,
    fontWeight: '600',
  },
  publicLinkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  publicLinkText: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  copySmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ZoomTheme.colors.zoomBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  copySmallText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  bookingsList: {
    gap: 12,
  },
  bookingCard: {
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: ZoomTheme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingLeft: {
    gap: 4,
  },
  bookingTitle: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  bookingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingMeta: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 12,
  },
  bookingGuest: {
    color: ZoomTheme.colors.textMuted,
    fontSize: 12,
  },
  bookingRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  bookingCode: {
    color: ZoomTheme.colors.zoomBlue,
    fontSize: 12,
    fontWeight: '600',
  },
  startScheduledBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ZoomTheme.colors.zoomBlue,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 4,
  },
  startScheduledBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planStatsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: ZoomTheme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    gap: 4,
  },
  statLabel: {
    color: ZoomTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statValue: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  statSub: {
    color: ZoomTheme.colors.zoomBlue,
    fontSize: 11,
  },
  addUserCard: {
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: ZoomTheme.borderRadius.md,
    padding: 14,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    gap: 10,
  },
  addUserTitle: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  addUserRow: {
    flexDirection: 'row',
    gap: 8,
  },
  addUserInput: {
    flex: 1,
    backgroundColor: ZoomTheme.colors.inputBg,
    color: ZoomTheme.colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    fontSize: 12,
  },
  addUserBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ZoomTheme.colors.zoomBlue,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  addUserBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tableCard: {
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: ZoomTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  tableRowBorder: {
    borderTopWidth: 1,
    borderTopColor: ZoomTheme.colors.borderSubtle,
  },
  userName: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  userEmail: {
    color: ZoomTheme.colors.textMuted,
    fontSize: 12,
  },
  userRole: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 12,
  },
  licenseBadge: {
    backgroundColor: 'rgba(14, 114, 237, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  licenseBadgeText: {
    color: ZoomTheme.colors.zoomBlue,
    fontSize: 11,
    fontWeight: '600',
  },
  reportsList: {
    gap: 16,
  },
  reportCard: {
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: ZoomTheme.borderRadius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    gap: 14,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportTopic: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  reportMeta: {
    color: ZoomTheme.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ZoomTheme.colors.zoomBlue,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  exportBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  attendanceTable: {
    borderTopWidth: 1,
    borderTopColor: ZoomTheme.colors.borderSubtle,
    paddingTop: 8,
    gap: 6,
  },
  attendanceHeader: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  attendanceHeadCol: {
    color: ZoomTheme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  attName: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  attEmail: {
    color: ZoomTheme.colors.textMuted,
    fontSize: 11,
  },
  attCol: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 12,
  },
});
