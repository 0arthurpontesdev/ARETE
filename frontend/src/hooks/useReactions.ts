import { useState, useCallback, useRef } from 'react';
import { FloatingReaction } from '../types';

export interface UseReactionsProps {
  localIdentity: string;
  localName: string;
  publishData?: (payload: any, reliable?: boolean) => Promise<void>;
  onNotification?: (msg: string) => void;
}

export function useReactions({
  localIdentity,
  localName,
  publishData,
  onNotification,
}: UseReactionsProps) {
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const timersRef = useRef<Map<string, any>>(new Map());

  const addReactionWithExpiration = useCallback((reaction: FloatingReaction) => {
    setFloatingReactions((prev) => [...prev, reaction]);

    // Expira automaticamente após 3 segundos (3000ms) conforme requisito do Módulo 4
    const timer = setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== reaction.id));
      timersRef.current.delete(reaction.id);
    }, 3000);

    timersRef.current.set(reaction.id, timer);
  }, []);

  const handleIncomingData = useCallback(
    (data: any) => {
      if (!data || typeof data !== 'object') return;

      if (data.type === 'reaction_floating' && data.reaction) {
        addReactionWithExpiration(data.reaction);
      }
    },
    [addReactionWithExpiration]
  );

  const sendReaction = useCallback(
    async (emoji: string) => {
      const reaction: FloatingReaction = {
        id: `react-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        senderIdentity: localIdentity,
        senderName: localName,
        emoji,
        timestamp: Date.now(),
      };

      addReactionWithExpiration(reaction);

      if (publishData) {
        await publishData(
          {
            type: 'reaction_floating',
            reaction,
          },
          false // lossy para fluidez em tempo real
        );
      }
    },
    [addReactionWithExpiration, localIdentity, localName, publishData]
  );

  return {
    floatingReactions,
    sendReaction,
    handleIncomingData,
  };
}
