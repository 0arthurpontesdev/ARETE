import { useState, useCallback, useEffect } from 'react';
import { Poll, PollOption } from '../types';

export interface UsePollProps {
  localIdentity: string;
  localName: string;
  isHost: boolean;
  publishData?: (payload: any, reliable?: boolean) => Promise<void>;
  onNotification?: (msg: string) => void;
}

export function usePoll({
  localIdentity,
  localName,
  isHost,
  publishData,
  onNotification,
}: UsePollProps) {
  const [polls, setPolls] = useState<Poll[]>([]);
  const [activePoll, setActivePoll] = useState<Poll | null>(null);

  useEffect(() => {
    const currentActive = polls.find((p) => p.isActive) || null;
    setActivePoll(currentActive);
  }, [polls]);

  const [localVotedPolls, setLocalVotedPolls] = useState<Set<string>>(new Set());

  // Tratar eventos de DataChannel para enquetes
  const handleIncomingData = useCallback(
    (data: any) => {
      if (!data || typeof data !== 'object') return;

      if (data.type === 'poll_create' && data.poll) {
        const incomingPoll: Poll = data.poll;
        setPolls((prev) => {
          if (prev.some((p) => p.id === incomingPoll.id)) return prev;
          return [incomingPoll, ...prev];
        });
        onNotification?.(`Nova enquete aberta: "${incomingPoll.question}"`);
      } else if (data.type === 'poll_vote') {
        const { pollId, optionId, voterIdentity } = data;
        setPolls((prev) =>
          prev.map((poll) => {
            if (poll.id !== pollId) return poll;
            const alreadyVoted = (poll.votedIdentities || []).includes(voterIdentity);
            if (alreadyVoted) return poll;

            return {
              ...poll,
              totalVotes: poll.totalVotes + 1,
              votedIdentities: [...(poll.votedIdentities || []), voterIdentity],
              options: poll.options.map((opt) =>
                opt.id === optionId
                  ? {
                      ...opt,
                      votes: opt.votes + 1,
                      voters: [...(opt.voters || []), voterIdentity],
                    }
                  : opt
              ),
            };
          })
        );
      } else if (data.type === 'poll_end') {
        const { pollId } = data;
        setPolls((prev) =>
          prev.map((p) => (p.id === pollId ? { ...p, isActive: false } : p))
        );
        onNotification?.('Enquete encerrada pelo anfitrião.');
      }
    },
    [onNotification]
  );

  // Criar Enquete
  const createPoll = useCallback(
    async (question: string, optionsText: string[], isMultipleChoice = false) => {
      if (!question.trim() || optionsText.length < 2) return;

      const newPoll: Poll = {
        id: `poll-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        question: question.trim(),
        options: optionsText.map((text, idx) => ({
          id: `opt-${idx}-${Date.now()}`,
          text: text.trim(),
          votes: 0,
          voters: [],
        })),
        creatorIdentity: localIdentity,
        creatorName: localName,
        isMultipleChoice,
        isActive: true,
        totalVotes: 0,
        votedIdentities: [],
      };

      setPolls((prev) => [newPoll, ...prev]);

      if (publishData) {
        await publishData({
          type: 'poll_create',
          poll: newPoll,
        });
      }

      onNotification?.('Nova enquete criada e transmitida com sucesso!');
    },
    [localIdentity, localName, publishData, onNotification]
  );

  // Votar em Enquete
  const vote = useCallback(
    async (pollId: string, optionId: string) => {
      const poll = polls.find((p) => p.id === pollId);
      if (!poll) return;

      if (!poll.isActive) {
        onNotification?.('Esta enquete já foi encerrada.');
        return;
      }

      const hasVoted =
        localVotedPolls.has(pollId) || (poll.votedIdentities || []).includes(localIdentity);

      if (hasVoted) {
        onNotification?.('Você já votou nesta enquete.');
        return;
      }

      // Marcar voto local
      setLocalVotedPolls((prev) => new Set(prev).add(pollId));

      setPolls((prev) =>
        prev.map((p) => {
          if (p.id !== pollId) return p;
          return {
            ...p,
            totalVotes: p.totalVotes + 1,
            votedIdentities: [...(p.votedIdentities || []), localIdentity],
            options: p.options.map((opt) =>
              opt.id === optionId
                ? {
                    ...opt,
                    votes: opt.votes + 1,
                    voters: [...(opt.voters || []), localIdentity],
                  }
                : opt
            ),
          };
        })
      );

      if (publishData) {
        await publishData({
          type: 'poll_vote',
          pollId,
          optionId,
          voterIdentity: localIdentity,
        });
      }

      onNotification?.('Voto registrado com sucesso!');
    },
    [localIdentity, localVotedPolls, polls, publishData, onNotification]
  );

  // Encerrar Enquete (Host)
  const endPoll = useCallback(
    async (pollId: string) => {
      setPolls((prev) =>
        prev.map((p) => (p.id === pollId ? { ...p, isActive: false } : p))
      );

      if (publishData) {
        await publishData({
          type: 'poll_end',
          pollId,
        });
      }

      onNotification?.('Enquete encerrada.');
    },
    [publishData, onNotification]
  );

  return {
    polls,
    activePoll,
    localVotedPolls,
    createPoll,
    vote,
    endPoll,
    handleIncomingData,
  };
}
