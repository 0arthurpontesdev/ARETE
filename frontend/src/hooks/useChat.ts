import { useState, useCallback, useRef, useEffect } from 'react';
import { ChatMessageData, ChatAttachment, PinnedMessageInfo } from '../types';

export interface UseChatProps {
  roomId: string;
  localIdentity: string;
  localName: string;
  publishData?: (payload: any, reliable?: boolean) => Promise<void>;
  backendUrl?: string;
  onNotification?: (msg: string) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function useChat({
  roomId,
  localIdentity,
  localName,
  publishData,
  backendUrl = 'http://localhost:4000',
  onNotification,
}: UseChatProps) {
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const [pinnedMessage, setPinnedMessage] = useState<PinnedMessageInfo | null>(null);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const typingTimeoutsRef = useRef<Map<string, any>>(new Map());

  // Tratar eventos de dados recebidos no DataChannel
  const handleIncomingData = useCallback((data: any) => {
    if (!data || typeof data !== 'object') return;

    if (data.type === 'chat_message' && data.message) {
      const incoming: ChatMessageData = {
        ...data.message,
        isLocal: false,
      };
      setMessages((prev) => {
        if (prev.some((m) => m.id === incoming.id)) return prev;
        return [...prev, incoming];
      });

      if (incoming.attachment) {
        setAttachments((prev) => {
          if (prev.some((a) => a.id === incoming.attachment!.id)) return prev;
          return [...prev, incoming.attachment!];
        });
      }
    } else if (data.type === 'chat_typing') {
      const { identity, name, isTyping } = data;
      if (identity === localIdentity) return;

      if (isTyping) {
        setTypingUsers((prev) => (prev.includes(name) ? prev : [...prev, name]));

        // Limpar digitação automaticamente após 3 segundos
        const existingTimer = typingTimeoutsRef.current.get(identity);
        if (existingTimer) clearTimeout(existingTimer);

        const newTimer = setTimeout(() => {
          setTypingUsers((prev) => prev.filter((u) => u !== name));
          typingTimeoutsRef.current.delete(identity);
        }, 3000);
        typingTimeoutsRef.current.set(identity, newTimer);
      } else {
        setTypingUsers((prev) => prev.filter((u) => u !== name));
        const existingTimer = typingTimeoutsRef.current.get(identity);
        if (existingTimer) {
          clearTimeout(existingTimer);
          typingTimeoutsRef.current.delete(identity);
        }
      }
    } else if (data.type === 'chat_pin') {
      setPinnedMessage({
        messageId: data.messageId,
        pinnedBy: data.pinnedBy,
        pinnedText: data.pinnedText,
        linkUrl: data.linkUrl,
      });
      onNotification?.(`Nova mensagem fixada por ${data.pinnedBy}`);
    }
  }, [localIdentity, onNotification]);

  // Enviar Mensagem de Texto
  const sendMessage = useCallback(
    async (text: string, recipientIdentity?: string, replyTo?: { id: string; text: string }) => {
      if (!text.trim()) return;

      const newMsg: ChatMessageData = {
        id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        senderIdentity: localIdentity,
        senderName: localName,
        text: text.trim(),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLocal: true,
        isPrivate: Boolean(recipientIdentity),
        recipientIdentity,
        replyToId: replyTo?.id,
        replyToText: replyTo?.text,
      };

      setMessages((prev) => [...prev, newMsg]);

      if (publishData) {
        await publishData({
          type: 'chat_message',
          message: newMsg,
        });
      }
    },
    [localIdentity, localName, publishData]
  );

  // Emitir Digitação
  const emitTyping = useCallback(
    async (isTyping: boolean) => {
      if (publishData) {
        await publishData(
          {
            type: 'chat_typing',
            identity: localIdentity,
            name: localName,
            isTyping,
          },
          false // Não confiável/lossy para evitar overhead
        );
      }
    },
    [localIdentity, localName, publishData]
  );

  // Fixar Mensagem
  const pinMessage = useCallback(
    async (messageId: string, pinnedText: string, linkUrl?: string) => {
      const pinInfo: PinnedMessageInfo = {
        messageId,
        pinnedBy: localName,
        pinnedText,
        linkUrl,
      };
      setPinnedMessage(pinInfo);

      if (publishData) {
        await publishData({
          type: 'chat_pin',
          ...pinInfo,
        });
      }
      onNotification?.('Mensagem fixada no topo');
    },
    [localName, publishData, onNotification]
  );

  // Upload Real e Envio de Anexo
  const uploadAndSendAttachment = useCallback(
    (file: File, recipientIdentity?: string): Promise<void> => {
      return new Promise((resolve, reject) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('roomId', roomId);
        formData.append('senderId', localIdentity);
        formData.append('senderName', localName);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `${backendUrl}/api/upload`);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const percent = Math.round((event.loaded / event.total) * 100);
            setUploadProgress(percent);
          }
        };

        xhr.onload = async () => {
          setUploadProgress(null);
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              if (res.success && res.file) {
                const uploadedFile = res.file;
                const fileDownloadUrl = uploadedFile.url.startsWith('http')
                  ? uploadedFile.url
                  : `${backendUrl}${uploadedFile.url}`;

                const attachment: ChatAttachment = {
                  id: uploadedFile.id,
                  name: uploadedFile.name,
                  url: fileDownloadUrl,
                  sizeBytes: uploadedFile.sizeBytes,
                  sizeFormatted: formatFileSize(uploadedFile.sizeBytes),
                  mimeType: uploadedFile.mimeType,
                  uploadedAt: uploadedFile.uploadedAt,
                  senderIdentity: localIdentity,
                  senderName: localName,
                };

                const msgWithAttachment: ChatMessageData = {
                  id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
                  senderIdentity: localIdentity,
                  senderName: localName,
                  text: '',
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  isLocal: true,
                  isPrivate: Boolean(recipientIdentity),
                  recipientIdentity,
                  attachmentName: attachment.name,
                  attachmentUrl: attachment.url,
                  attachmentSize: attachment.sizeFormatted,
                  attachment,
                };

                setMessages((prev) => [...prev, msgWithAttachment]);
                setAttachments((prev) => [...prev, attachment]);

                if (publishData) {
                  await publishData({
                    type: 'chat_message',
                    message: msgWithAttachment,
                  });
                }

                onNotification?.(`Arquivo "${attachment.name}" enviado com sucesso!`);
                resolve();
              } else {
                reject(new Error(res.error || 'Erro ao fazer upload do arquivo'));
              }
            } catch (e) {
              reject(e);
            }
          } else {
            reject(new Error(`Falha no upload: status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          setUploadProgress(null);
          reject(new Error('Falha de rede ao tentar enviar o arquivo.'));
        };

        xhr.send(formData);
      });
    },
    [backendUrl, localIdentity, localName, publishData, roomId, onNotification]
  );

  return {
    messages,
    pinnedMessage,
    typingUsers,
    attachments,
    uploadProgress,
    sendMessage,
    emitTyping,
    pinMessage,
    uploadAndSendAttachment,
    handleIncomingData,
  };
}
