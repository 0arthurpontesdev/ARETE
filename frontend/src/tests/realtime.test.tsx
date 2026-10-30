import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useChat } from '../hooks/useChat';
import { usePoll } from '../hooks/usePoll';
import { useReactions } from '../hooks/useReactions';

describe('MÓDULOS 1-4: WebRTC, Chat Realtime, Live Polls & Floating Reactions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // MÓDULO 2: Chat em Tempo Real, Anexos, Fixação e Digitação
  describe('Módulo 2: useChat', () => {
    it('deve enviar mensagem de texto e publicar via DataChannel', async () => {
      const publishDataMock = vi.fn();
      const { result } = renderHook(() =>
        useChat({
          roomId: 'room-101',
          localIdentity: 'user-arthur',
          localName: 'Arthur Host',
          publishData: publishDataMock,
        })
      );

      await act(async () => {
        await result.current.sendMessage('Olá a todos da conferência!');
      });

      expect(result.current.messages.length).toBe(1);
      expect(result.current.messages[0].text).toBe('Olá a todos da conferência!');
      expect(result.current.messages[0].senderName).toBe('Arthur Host');
      expect(result.current.messages[0].isLocal).toBe(true);

      expect(publishDataMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'chat_message',
          message: expect.objectContaining({
            text: 'Olá a todos da conferência!',
          }),
        })
      );
    });

    it('deve registrar e exibir usuário digitando com auto-limpeza em 3s', () => {
      const { result } = renderHook(() =>
        useChat({
          roomId: 'room-101',
          localIdentity: 'user-arthur',
          localName: 'Arthur Host',
        })
      );

      act(() => {
        result.current.handleIncomingData({
          type: 'chat_typing',
          identity: 'user-mona',
          name: 'Mona Mulha',
          isTyping: true,
        });
      });

      expect(result.current.typingUsers).toContain('Mona Mulha');

      act(() => {
        vi.advanceTimersByTime(3100);
      });

      expect(result.current.typingUsers).not.toContain('Mona Mulha');
    });

    it('deve fixar mensagem de anúncio no banner superior', async () => {
      const publishDataMock = vi.fn();
      const { result } = renderHook(() =>
        useChat({
          roomId: 'room-101',
          localIdentity: 'user-natan',
          localName: 'Natan H.',
          publishData: publishDataMock,
        })
      );

      await act(async () => {
        await result.current.pinMessage('msg-001', 'Link do documento do projeto: https://docs.google.com');
      });

      expect(result.current.pinnedMessage?.pinnedText).toContain('Link do documento');
      expect(result.current.pinnedMessage?.pinnedBy).toBe('Natan H.');
      expect(publishDataMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'chat_pin',
          messageId: 'msg-001',
        })
      );
    });
  });

  // MÓDULO 3: Enquetes ao Vivo (Live Polls)
  describe('Módulo 3: usePoll', () => {
    it('deve inicializar com lista vazia de enquetes e activePoll nulo', () => {
      const { result } = renderHook(() =>
        usePoll({
          localIdentity: 'user-arthur',
          localName: 'Arthur Host',
          isHost: true,
        })
      );

      expect(result.current.polls.length).toBe(0);
      expect(result.current.activePoll).toBeNull();
    });

    it('deve criar nova enquete e transmiti-la para a sala', async () => {
      const publishDataMock = vi.fn();
      const { result } = renderHook(() =>
        usePoll({
          localIdentity: 'user-arthur',
          localName: 'Arthur Host',
          isHost: true,
          publishData: publishDataMock,
        })
      );

      await act(async () => {
        await result.current.createPoll('Qual o melhor dia para a demo?', [
          'Segunda-feira',
          'Quarta-feira',
          'Sexta-feira',
        ]);
      });

      expect(result.current.polls.length).toBe(1);
      const created = result.current.polls[0];
      expect(created.question).toBe('Qual o melhor dia para a demo?');
      expect(created.options.length).toBe(3);
      expect(created.isActive).toBe(true);

      expect(publishDataMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'poll_create',
          poll: expect.objectContaining({
            question: 'Qual o melhor dia para a demo?',
          }),
        })
      );
    });

    it('deve permitir votar e impedir voto duplicado do mesmo usuário', async () => {
      const publishDataMock = vi.fn();
      const { result } = renderHook(() =>
        usePoll({
          localIdentity: 'user-lucas',
          localName: 'Lucas Convidado',
          isHost: false,
          publishData: publishDataMock,
        })
      );

      // Simula enquete ativa recebida via DataChannel
      act(() => {
        result.current.handleIncomingData({
          type: 'poll_create',
          poll: {
            id: 'poll-test-1',
            question: 'Qual horário da daily?',
            options: [
              { id: 'opt-9am', text: '09:00', votes: 0, voters: [] },
              { id: 'opt-10am', text: '10:00', votes: 0, voters: [] },
            ],
            isActive: true,
            totalVotes: 0,
            votedIdentities: [],
          },
        });
      });

      expect(result.current.polls.length).toBe(1);
      const pollId = 'poll-test-1';
      const optionId = 'opt-9am';

      // Primeiro voto
      await act(async () => {
        await result.current.vote(pollId, optionId);
      });

      const updatedPoll = result.current.polls.find((p) => p.id === pollId);
      expect(updatedPoll?.options[0].votes).toBe(1);
      expect(result.current.localVotedPolls.has(pollId)).toBe(true);

      // Segundo voto na mesma enquete (tentativa de voto duplicado)
      await act(async () => {
        await result.current.vote(pollId, optionId);
      });

      // O contador de votos não deve aumentar
      const afterDuplicate = result.current.polls.find((p) => p.id === pollId);
      expect(afterDuplicate?.options[0].votes).toBe(1);
    });

    it('deve encerrar a enquete como anfitrião', async () => {
      const publishDataMock = vi.fn();
      const { result } = renderHook(() =>
        usePoll({
          localIdentity: 'user-host',
          localName: 'Arthur Host',
          isHost: true,
          publishData: publishDataMock,
        })
      );

      await act(async () => {
        await result.current.createPoll('Encerramento teste?', ['Opção A', 'Opção B']);
      });

      const pollId = result.current.polls[0].id;

      await act(async () => {
        await result.current.endPoll(pollId);
      });

      const closedPoll = result.current.polls.find((p) => p.id === pollId);
      expect(closedPoll?.isActive).toBe(false);
      expect(publishDataMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'poll_end',
          pollId,
        })
      );
    });
  });

  // MÓDULO 4: Reações Flutuantes (Floating Reactions)
  describe('Módulo 4: useReactions', () => {
    it('deve enviar reação flutuante e expirar após 3 segundos', async () => {
      const publishDataMock = vi.fn();
      const { result } = renderHook(() =>
        useReactions({
          localIdentity: 'user-arthur',
          localName: 'Arthur Host',
          publishData: publishDataMock,
        })
      );

      await act(async () => {
        await result.current.sendReaction('🎉');
      });

      expect(result.current.floatingReactions.length).toBe(1);
      expect(result.current.floatingReactions[0].emoji).toBe('🎉');
      expect(result.current.floatingReactions[0].senderIdentity).toBe('user-arthur');

      expect(publishDataMock).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'reaction_floating',
          reaction: expect.objectContaining({
            emoji: '🎉',
          }),
        }),
        false
      );

      // Avançar o tempo em 3 segundos (3000ms)
      act(() => {
        vi.advanceTimersByTime(3100);
      });

      // Reação deve ter expirado e sido removida
      expect(result.current.floatingReactions.length).toBe(0);
    });
  });
});
