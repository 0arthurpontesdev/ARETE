import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileText, Download } from 'lucide-react-native';
import { ChatMessageData } from '../../types';
import { ZoomTheme } from '../../styles/theme';

interface ChatMessageProps {
  message: ChatMessageData;
}

export const ChatMessage = React.memo<ChatMessageProps>(({ message }) => {
  return (
    <View style={[styles.container, message.isLocal ? styles.localContainer : styles.remoteContainer]}>
      <View style={styles.messageWithAvatarRow}>
        {/* Avatar */}
        {message.senderAvatar ? (
          <img
            src={message.senderAvatar}
            alt={message.senderName}
            style={{ width: 28, height: 28, borderRadius: 14, marginRight: 8, marginTop: 2 }}
          />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{message.senderName[0]}</Text>
          </View>
        )}

        <View style={styles.contentCol}>
          <View style={styles.header}>
            <Text style={[styles.sender, message.isLocal && styles.localSender]}>
              {message.senderName} {message.isLocal ? '(Você)' : ''}
              {message.isPrivate && (
                <Text style={styles.privateTag}>
                  {' '}
                  (Privado {message.recipientName ? `para ${message.recipientName}` : ''})
                </Text>
              )}
            </Text>
            <Text style={styles.time}>{message.timestamp}</Text>
          </View>

          <View
            style={[
              styles.bubble,
              message.isLocal ? styles.localBubble : styles.remoteBubble,
              message.isPrivate && styles.privateBubble,
            ]}
          >
            {message.text ? <Text style={styles.messageText}>{message.text}</Text> : null}

            {/* Anexo de Arquivo */}
            {message.attachmentName && (
              <View style={styles.attachmentBox}>
                <View style={styles.pdfIconBadge}>
                  <Text style={styles.pdfBadgeText}>
                    {message.attachmentName.split('.').pop()?.toUpperCase() || 'FILE'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {message.attachmentName}
                  </Text>
                  {message.attachmentSize && (
                    <Text style={styles.attachmentSize}>{message.attachmentSize}</Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.downloadIconBtn}
                  activeOpacity={0.7}
                  onPress={() => {
                    if (message.attachmentUrl && typeof window !== 'undefined') {
                      const a = document.createElement('a');
                      a.href = message.attachmentUrl;
                      a.download = message.attachmentName || 'download';
                      a.target = '_blank';
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                    }
                  }}
                  accessibilityLabel={`Baixar arquivo ${message.attachmentName}`}
                >
                  <Download size={15} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            )}

            {/* Reações e Respostas se houver */}
            {(message.reactions || message.replyCount) && (
              <View style={styles.reactionsRow}>
                {message.reactions?.map((r, i) => (
                  <View key={i} style={styles.reactionPill}>
                    <Text style={styles.reactionEmoji}>{r.emoji}</Text>
                    {r.count > 1 && <Text style={styles.reactionCount}>{r.count}</Text>}
                  </View>
                ))}
                {message.replyCount && message.replyCount > 0 && (
                  <Text style={styles.replyCountText}>{message.replyCount} resposta</Text>
                )}
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
    paddingHorizontal: ZoomTheme.spacing.md,
  },
  localContainer: {
    alignItems: 'flex-end',
  },
  remoteContainer: {
    alignItems: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  sender: {
    fontSize: ZoomTheme.typography.caption,
    color: ZoomTheme.colors.textSecondary,
    fontWeight: '600',
  },
  localSender: {
    color: ZoomTheme.colors.zoomBlue,
  },
  privateTag: {
    color: ZoomTheme.colors.dangerRed,
    fontWeight: '700',
  },
  time: {
    fontSize: 10,
    color: ZoomTheme.colors.textMuted,
  },
  bubble: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: ZoomTheme.borderRadius.md,
    maxWidth: '85%',
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    gap: 6,
  },
  localBubble: {
    backgroundColor: '#0E72ED',
    borderBottomRightRadius: 2,
  },
  remoteBubble: {
    backgroundColor: ZoomTheme.colors.inputBg,
    borderBottomLeftRadius: 2,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
  },
  privateBubble: {
    borderColor: ZoomTheme.colors.dangerRed,
    borderWidth: 1,
  },
  messageText: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: ZoomTheme.typography.body,
    lineHeight: 19,
  },
  attachmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    padding: 8,
    borderRadius: 6,
    marginTop: 4,
  },
  attachmentName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  attachmentSize: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 10,
  },
  downloadIconBtn: {
    padding: 4,
  },
  messageWithAvatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    maxWidth: '100%',
  },
  avatarFallback: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  contentCol: {
    flex: 1,
  },
  pdfIconBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 4,
  },
  pdfBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  reactionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  reactionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '600',
  },
  replyCountText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
});
