import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CopilotPanel } from '../components/panels/CopilotPanel';
import { CopilotService } from '../services/copilotService';
import { ParticipantInfo } from '../types';

describe('IA Copilot da Reunião (Resumo & Ata)', () => {
  const mockParticipants: ParticipantInfo[] = [
    {
      identity: 'p1',
      name: 'Arthur Anfitrião',
      isLocal: true,
      isHost: true,
      isSpeaking: false,
      isAudioEnabled: true,
      isVideoEnabled: true,
      isScreenSharing: false,
    },
    {
      identity: 'p2',
      name: 'Natan H.',
      isLocal: false,
      isHost: false,
      isSpeaking: true,
      isAudioEnabled: true,
      isVideoEnabled: true,
      isScreenSharing: false,
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('CopilotService deve retornar resumo executivo estruturado via fallback se backend offline', async () => {
    const summary = await CopilotService.fetchSummary({
      topic: 'Planejamento Q4',
      participants: mockParticipants,
      transcripts: [],
      chat_messages: [],
    });

    expect(summary.topic).toBe('Planejamento Q4');
    expect(summary.executive_summary).toContain('Planejamento Q4');
    expect(summary.key_points.length).toBeGreaterThan(0);
    expect(summary.main_decisions.length).toBeGreaterThan(0);
  });

  it('CopilotService deve gerar Ata Formal completa com seções numeradas', async () => {
    const minutes = await CopilotService.fetchMinutes({
      topic: 'Alinhamento Semanal',
      participants: mockParticipants,
      transcripts: [],
      chat_messages: [],
    });

    expect(minutes.title).toContain('Alinhamento Semanal');
    expect(minutes.host).toBe('Arthur Anfitrião');
    expect(minutes.formatted_document).toContain('# ATA DA REUNIÃO');
    expect(minutes.formatted_document).toContain('1. PARTICIPANTES PRESENTES');
    expect(minutes.formatted_document).toContain('5. ENCERRAMENTO');
  });

  it('CopilotPanel deve renderizar o cabeçalho e alternar entre abas', async () => {
    render(
      <CopilotPanel
        topic="Sprint Review"
        participants={mockParticipants}
        chatMessages={[]}
        transcripts={[]}
        onClose={vi.fn()}
      />
    );

    // Header title
    expect(screen.getByText('IA Copilot')).toBeDefined();

    // Default tab is Resumo
    expect(screen.getByText('Resumo')).toBeDefined();
    expect(screen.getByText('Ata')).toBeDefined();
    expect(screen.getByText('Perguntar')).toBeDefined();

    // Click on Ata tab
    fireEvent.click(screen.getByText('Ata'));
    await waitFor(() => {
      expect(screen.getByText('Copiar Ata')).toBeDefined();
    });

    // Click on Tarefas tab
    const tarefasTab = screen.getByText(/Tarefas/i);
    fireEvent.click(tarefasTab);
    await waitFor(() => {
      expect(screen.getByText('Progresso das Ações')).toBeDefined();
    });

    // Click on Perguntar tab
    fireEvent.click(screen.getByText('Perguntar'));
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Pergunte qualquer coisa sobre a reunião...')).toBeDefined();
    });
  });
});
