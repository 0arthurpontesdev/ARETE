import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Shield,
  Lock,
  Unlock,
  Users,
  EyeOff,
  Share,
  MessageSquare,
  Edit2,
  Mic,
  X,
  Check,
} from 'lucide-react-native';
import { ZoomTheme } from '../../styles/theme';
import { SecuritySettings } from '../../types';

interface SecurityMenuProps {
  settings: SecuritySettings;
  onUpdateSettings: (newSettings: Partial<SecuritySettings>) => void;
  onClose: () => void;
}

export const SecurityMenu: React.FC<SecurityMenuProps> = ({
  settings,
  onUpdateSettings,
  onClose,
}) => {
  return (
    <View style={styles.popover} accessibilityRole="menu" accessibilityLabel="Menu de Segurança">
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <Shield size={16} color={ZoomTheme.colors.zoomBlue} />
          <Text style={styles.title}>Segurança da Reunião</Text>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fechar segurança">
          <X size={14} color={ZoomTheme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Controles da Sala</Text>

        {/* Trancar Reunião */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => onUpdateSettings({ isLocked: !settings.isLocked })}
          activeOpacity={0.7}
        >
          <View style={styles.checkSlot}>
            {settings.isLocked && <Check size={14} color={ZoomTheme.colors.zoomBlue} />}
          </View>
          <View style={styles.itemIcon}>
            {settings.isLocked ? (
              <Lock size={15} color={ZoomTheme.colors.dangerRed} />
            ) : (
              <Unlock size={15} color={ZoomTheme.colors.textSecondary} />
            )}
          </View>
          <Text style={[styles.itemText, settings.isLocked && styles.itemTextDanger]}>
            {settings.isLocked ? 'Reunião Trancada' : 'Trancar Reunião'}
          </Text>
        </TouchableOpacity>

        {/* Habilitar Sala de Espera */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => onUpdateSettings({ waitingRoomEnabled: !settings.waitingRoomEnabled })}
          activeOpacity={0.7}
        >
          <View style={styles.checkSlot}>
            {settings.waitingRoomEnabled && <Check size={14} color={ZoomTheme.colors.zoomBlue} />}
          </View>
          <View style={styles.itemIcon}>
            <Users size={15} color={ZoomTheme.colors.textSecondary} />
          </View>
          <Text style={styles.itemText}>Habilitar Sala de Espera</Text>
        </TouchableOpacity>

        {/* Ocultar Fotos de Perfil */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => onUpdateSettings({ hideProfilePics: !settings.hideProfilePics })}
          activeOpacity={0.7}
        >
          <View style={styles.checkSlot}>
            {settings.hideProfilePics && <Check size={14} color={ZoomTheme.colors.zoomBlue} />}
          </View>
          <View style={styles.itemIcon}>
            <EyeOff size={15} color={ZoomTheme.colors.textSecondary} />
          </View>
          <Text style={styles.itemText}>Ocultar fotos de perfil</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.divider} />

      <View style={styles.section}>
        <Text style={styles.sectionHeader}>Permitir que os participantes:</Text>

        {/* Compartilhar Tela */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => onUpdateSettings({ allowScreenShare: !settings.allowScreenShare })}
          activeOpacity={0.7}
        >
          <View style={styles.checkSlot}>
            {settings.allowScreenShare && <Check size={14} color={ZoomTheme.colors.zoomBlue} />}
          </View>
          <View style={styles.itemIcon}>
            <Share size={15} color={ZoomTheme.colors.textSecondary} />
          </View>
          <Text style={styles.itemText}>Compartilhar tela</Text>
        </TouchableOpacity>

        {/* Bate-papo */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => onUpdateSettings({ allowChat: !settings.allowChat })}
          activeOpacity={0.7}
        >
          <View style={styles.checkSlot}>
            {settings.allowChat && <Check size={14} color={ZoomTheme.colors.zoomBlue} />}
          </View>
          <View style={styles.itemIcon}>
            <MessageSquare size={15} color={ZoomTheme.colors.textSecondary} />
          </View>
          <Text style={styles.itemText}>Bate-papo</Text>
        </TouchableOpacity>

        {/* Renomear-se */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => onUpdateSettings({ allowRename: !settings.allowRename })}
          activeOpacity={0.7}
        >
          <View style={styles.checkSlot}>
            {settings.allowRename && <Check size={14} color={ZoomTheme.colors.zoomBlue} />}
          </View>
          <View style={styles.itemIcon}>
            <Edit2 size={15} color={ZoomTheme.colors.textSecondary} />
          </View>
          <Text style={styles.itemText}>Renomear a si mesmos</Text>
        </TouchableOpacity>

        {/* Reativar o próprio som */}
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => onUpdateSettings({ allowUnmute: !settings.allowUnmute })}
          activeOpacity={0.7}
        >
          <View style={styles.checkSlot}>
            {settings.allowUnmute && <Check size={14} color={ZoomTheme.colors.zoomBlue} />}
          </View>
          <View style={styles.itemIcon}>
            <Mic size={15} color={ZoomTheme.colors.textSecondary} />
          </View>
          <Text style={styles.itemText}>Reativar o próprio som</Text>
        </TouchableOpacity>
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
    width: 290,
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
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: ZoomTheme.colors.borderSubtle,
    marginBottom: 6,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: ZoomTheme.typography.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  closeBtn: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  section: {
    gap: 2,
  },
  sectionHeader: {
    color: ZoomTheme.colors.textMuted,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 4,
    marginBottom: 2,
    paddingHorizontal: 6,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingHorizontal: 6,
    borderRadius: ZoomTheme.borderRadius.sm,
    gap: 8,
  },
  checkSlot: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIcon: {
    width: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: ZoomTheme.typography.bodySmall,
    flex: 1,
  },
  itemTextDanger: {
    color: ZoomTheme.colors.dangerRed,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: ZoomTheme.colors.borderSubtle,
    marginVertical: 6,
  },
});
