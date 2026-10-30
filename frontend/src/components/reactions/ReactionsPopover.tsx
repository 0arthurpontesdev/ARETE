import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Hand, X } from 'lucide-react-native';
import { ZoomTheme } from '../../styles/theme';

interface ReactionsPopoverProps {
  isHandRaised: boolean;
  onToggleHand: () => void;
  onSendEmoji: (emoji: string) => void;
  onClose: () => void;
}

const EMOJIS = ['👍', '👏', '❤️', '😂', '😮', '🎉'];

export const ReactionsPopover: React.FC<ReactionsPopoverProps> = ({
  isHandRaised,
  onToggleHand,
  onSendEmoji,
  onClose,
}) => {
  return (
    <View style={styles.popover} accessibilityRole="menu" accessibilityLabel="Reações e emojis">
      <View style={styles.header}>
        <Text style={styles.title}>Reações</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fechar reações">
          <X size={14} color={ZoomTheme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Raise Hand Button */}
      <TouchableOpacity
        style={[styles.raiseHandBtn, isHandRaised && styles.raiseHandBtnActive]}
        onPress={() => {
          onToggleHand();
          onClose();
        }}
        activeOpacity={0.8}
        accessibilityLabel={isHandRaised ? 'Abaixar a mão' : 'Levantar a mão'}
      >
        <Hand
          size={18}
          color={isHandRaised ? '#000000' : ZoomTheme.colors.warningYellow}
        />
        <Text style={[styles.raiseHandText, isHandRaised && styles.raiseHandTextActive]}>
          {isHandRaised ? 'Abaixar a Mão' : 'Levantar a Mão'}
        </Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      {/* Emoji Grid */}
      <View style={styles.emojiRow}>
        {EMOJIS.map((emoji) => (
          <TouchableOpacity
            key={emoji}
            style={styles.emojiBtn}
            onPress={() => {
              onSendEmoji(emoji);
              onClose();
            }}
            activeOpacity={0.7}
            accessibilityLabel={`Enviar reação ${emoji}`}
          >
            <Text style={styles.emojiChar}>{emoji}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  popover: {
    position: 'absolute',
    bottom: ZoomTheme.layout.toolbarHeight + 10,
    backgroundColor: ZoomTheme.colors.panelBg,
    borderRadius: ZoomTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    width: 250,
    padding: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 150,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: ZoomTheme.colors.borderSubtle,
    marginBottom: 8,
  },
  title: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: ZoomTheme.typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: 2,
  },
  raiseHandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 165, 2, 0.12)',
    paddingVertical: 10,
    borderRadius: ZoomTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 165, 2, 0.3)',
  },
  raiseHandBtnActive: {
    backgroundColor: ZoomTheme.colors.warningYellow,
  },
  raiseHandText: {
    color: ZoomTheme.colors.warningYellow,
    fontSize: ZoomTheme.typography.button,
    fontWeight: '700',
  },
  raiseHandTextActive: {
    color: '#000000',
  },
  divider: {
    height: 1,
    backgroundColor: ZoomTheme.colors.borderSubtle,
    marginVertical: 8,
  },
  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  emojiBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  emojiChar: {
    fontSize: 20,
  },
});
