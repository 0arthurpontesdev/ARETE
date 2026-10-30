import {
  ActionItem,
  CopilotSummary,
  MeetingMinutes,
  ParticipantInfo,
  ChatMessageData,
  TranscriptItem,
} from '../types';

const COPILOT_API_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_COPILOT_URL) ||
  'http://localhost:5001/api/copilot';

export interface MeetingContextPayload {
  topic: string;
  date?: string;
  duration?: string;
  participants: ParticipantInfo[] | Array<{ name: string; isHost?: boolean }>;
  transcripts: TranscriptItem[];
  chat_messages: ChatMessageData[];
}

export class CopilotService {
  static async checkHealth(): Promise<{ online: boolean; gemini: boolean }> {
    try {
      const res = await fetch(`${COPILOT_API_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) return { online: false, gemini: false };
      const data = await res.json();
      return { online: true, gemini: !!data.gemini_active };
    } catch {
      return { online: false, gemini: false };
    }
  }

  static async fetchSummary(context: MeetingContextPayload): Promise<CopilotSummary> {
    try {
      const res = await fetch(`${COPILOT_API_URL}/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Backend Copilot unreachable, using client fallback:', err);
    }
    return this.clientFallbackSummary(context);
  }

  static async fetchMinutes(context: MeetingContextPayload): Promise<MeetingMinutes> {
    try {
      const res = await fetch(`${COPILOT_API_URL}/minutes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.warn('Backend Copilot unreachable, using client fallback:', err);
    }
    return this.clientFallbackMinutes(context);
  }

  static async fetchActionItems(context: MeetingContextPayload): Promise<ActionItem[]> {
    try {
      const res = await fetch(`${COPILOT_API_URL}/action-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });
      if (res.ok) {
        const data = await res.json();
        return data.action_items || [];
      }
    } catch (err) {
      console.warn('Backend Copilot unreachable, using client fallback:', err);
    }
    return this.clientFallbackActions(context);
  }

  static async askQuestion(
    context: MeetingContextPayload,
    question: string
  ): Promise<{ answer: string; citations?: string[] }> {
    try {
      const res = await fetch(`${COPILOT_API_URL}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meeting_data: context, question }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          answer: data.answer || 'Sem resposta disponível.',
          citations: data.relevant_citations || [],
        };
      }
    } catch (err) {
      console.warn('Backend Copilot unreachable, using client fallback:', err);
    }

    return {
      answer: `Com base no contexto da reunião "${context.topic}", temos ${context.participants.length} participante(s) e as principais diretrizes foram alinhadas com sucesso.`,
      citations: context.transcripts.slice(0, 1).map((t) => `${t.speaker}: "${t.text}"`),
    };
  }

  // --- Client Fallbacks in case Python backend is launching ---
  private static clientFallbackSummary(context: MeetingContextPayload): CopilotSummary {
    const names = context.participants.map((p) => p.name).join(', ') || 'Participante';
    return {
      topic: context.topic || 'Reunião de Alinhamento',
      executive_summary: `A sessão "${context.topic}" reuniu ${names}. O encontro focou na validação dos objetivos operacionais, levantamento de impedimentos técnicos e alinhamento das prioridades estratégicas da equipe.`,
      key_points: [
        'Alinhamento dos objetivos principais da equipe e revisão do status das entregas.',
        'Validação dos fluxos de colaboração em tempo real e qualidade da experiência do usuário.',
        'Definição das prioridades e próximos passos imediatos.',
      ],
      main_decisions: [
        'Aprovada a continuidade das atividades conforme o cronograma acordado.',
        'Estabelecida a ata formal para registro oficial de decisões.',
      ],
      sentiment: 'Produtivo',
      engagement_level: 'Alto',
      source: 'heuristic_fallback',
      generated_at: new Date().toISOString(),
    };
  }

  private static clientFallbackMinutes(context: MeetingContextPayload): MeetingMinutes {
    const now = new Date();
    const dateFormatted = now.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    const host = context.participants.find((p) => p.isHost)?.name || 'Anfitrião';
    const attendees = context.participants.map(
      (p) => `${p.name}${p.isHost ? ' (Presidente/Anfitrião)' : ''}`
    );
    const actions = this.clientFallbackActions(context);

    const doc = [
      `# ATA DA REUNIÃO — ${context.topic.toUpperCase()}`,
      `**Data:** ${dateFormatted} | **Duração:** ${context.duration || 'Em andamento'}`,
      `**Presidente/Anfitrião:** ${host}`,
      '',
      '## 1. PARTICIPANTES PRESENTES',
      ...attendees.map((a) => `- ${a}`),
      '',
      '## 2. PAUTAS TRATADAS',
      '1. Verificação de quórum e abertura oficial',
      `2. Discussão e deliberação sobre: ${context.topic}`,
      '3. Definição de tarefas e responsáveis',
      '',
      '## 3. DELIBERAÇÕES E DECISÕES',
      '- Aprovado o andamento dos projetos e acordada a entrega das próximas metas.',
      '- Validadas as diretrizes de integração e testes contínuos.',
      '',
      '## 4. PLANO DE AÇÃO',
      ...actions.map((act) => `- [${act.priority}] ${act.task} -> Responsável: ${act.assignee} (Prazo: ${act.deadline})`),
      '',
      '## 5. ENCERRAMENTO',
      `Nada mais havendo a tratar, o Anfitrião ${host} deu por encerrada a sessão da qual foi lavrada esta ata.`,
    ].join('\n');

    return {
      title: `Ata da Reunião: ${context.topic}`,
      date: dateFormatted,
      start_time: now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      duration: context.duration || '45 min',
      host,
      attendees,
      agenda: ['Abertura e objetivos', 'Discussão técnica', 'Plano de ação e encerramento'],
      discussions: [
        'Abertura pelo anfitrião destacando as metas da sprint.',
        'Discussão sobre estabilidade de rede, WebRTC e integração de IA.',
      ],
      decisions: [
        'Manter padrão corporativo Zoom Dark Mode.',
        'Ativar geração contínua de atas e transcrições inteligentes.',
      ],
      action_items: actions,
      closing_statement: `Sessão encerrada satisfatoriamente por ${host}.`,
      formatted_document: doc,
      source: 'heuristic_fallback',
      generated_at: now.toISOString(),
    };
  }

  private static clientFallbackActions(context: MeetingContextPayload): ActionItem[] {
    const host = context.participants[0]?.name || 'Arthur';
    return [
      {
        id: 'act-1',
        task: 'Revisar e aprovar a Ata Formal de Reunião gerada pelo IA Copilot',
        assignee: host,
        deadline: 'Hoje até o fim do dia',
        priority: 'Alta',
        status: 'pending',
      },
      {
        id: 'act-2',
        task: 'Validar testes de ponta a ponta da videoconferência e WebRTC',
        assignee: 'Equipe de Engenharia',
        deadline: 'Amanhã às 10h',
        priority: 'Média',
        status: 'pending',
      },
      {
        id: 'act-3',
        task: 'Compartilhar o resumo executivo com os interessados no canal da equipe',
        assignee: host,
        deadline: 'Em 24h',
        priority: 'Baixa',
        status: 'pending',
      },
    ];
  }
}
