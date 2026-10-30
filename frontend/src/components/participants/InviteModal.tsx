import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { X, Copy, Check, Mail, Link as LinkIcon, Shield } from 'lucide-react-native';
import { ZoomTheme } from '../../styles/theme';

interface InviteModalProps {
  roomId: string;
  onClose: () => void;
}

export const InviteModal: React.FC<InviteModalProps> = ({ roomId, onClose }) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedInvitation, setCopiedInvitation] = useState(false);

  const meetingUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${window.location.pathname}?room=${roomId}`
    : `https://zoom.local/?room=${roomId}`;

  const fullInvitationText = `Arthur está convidando você para uma reunião Zoom agendada.\n\nTópico: Reunião de Videoconferência\nID da Reunião: ${roomId}\n\nEntrar na Reunião Zoom:\n${meetingUrl}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(meetingUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleCopyInvitation = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(fullInvitationText);
      setCopiedInvitation(true);
      setTimeout(() => setCopiedInvitation(false), 2500);
    }
  };

  return (
    <View style={styles.overlay} accessibilityRole="dialog" accessibilityLabel="Convidar participantes">
      <View style={styles.modalCard}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Convidar pessoas para participar</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fechar convite">
            <X size={18} color={ZoomTheme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.body}>
          <View style={styles.infoRow}>
            <Shield size={16} color={ZoomTheme.colors.zoomBlue} />
            <Text style={styles.infoText}>
              Qualquer pessoa com o link ou ID poderá ingressar nesta reunião.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Link de Ingresso Direto</Text>
            <View style={styles.linkInputRow}>
              <TextInput
                style={styles.linkInput}
                value={meetingUrl}
                editable={false}
              />
              <TouchableOpacity
                style={[styles.copyBtn, copiedLink && styles.copyBtnSuccess]}
                onPress={handleCopyLink}
                activeOpacity={0.8}
              >
                {copiedLink ? <Check size={16} color="#FFF" /> : <Copy size={16} color="#FFF" />}
                <Text style={styles.copyBtnText}>{copiedLink ? 'Copiado!' : 'Copiar'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.roomDetailsCard}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>ID da Reunião:</Text>
              <Text style={styles.detailValue}>{roomId}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Criptografia:</Text>
              <Text style={styles.detailValue}>LiveKit DTLS-SRTP</Text>
            </View>
          </View>
        </View>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.invitationBtn}
            onPress={handleCopyInvitation}
            activeOpacity={0.8}
          >
            {copiedInvitation ? <Check size={16} color="#FFF" /> : <Mail size={16} color="#FFF" />}
            <Text style={styles.invitationBtnText}>
              {copiedInvitation ? 'Convite Completo Copiado!' : 'Copiar Convite'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.closeModalBtn} onPress={onClose}>
            <Text style={styles.closeModalBtnText}>Fechar</Text>
          </TouchableOpacity>
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
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: ZoomTheme.colors.panelBg,
    borderRadius: ZoomTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },
  header: {
    height: 52,
    backgroundColor: ZoomTheme.colors.dockBg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: ZoomTheme.colors.borderSubtle,
  },
  title: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: ZoomTheme.typography.subtitle,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  body: {
    padding: 20,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(14, 114, 237, 0.08)',
    padding: 10,
    borderRadius: ZoomTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: 'rgba(14, 114, 237, 0.2)',
  },
  infoText: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: ZoomTheme.typography.caption,
    flex: 1,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: ZoomTheme.typography.bodySmall,
    fontWeight: '500',
  },
  linkInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  linkInput: {
    flex: 1,
    backgroundColor: ZoomTheme.colors.inputBg,
    color: ZoomTheme.colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: ZoomTheme.borderRadius.sm,
    fontSize: 13,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ZoomTheme.colors.zoomBlue,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: ZoomTheme.borderRadius.sm,
  },
  copyBtnSuccess: {
    backgroundColor: ZoomTheme.colors.successGreen,
  },
  copyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  roomDetailsCard: {
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: ZoomTheme.borderRadius.sm,
    padding: 14,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    gap: 8,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 13,
  },
  detailValue: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: ZoomTheme.colors.borderSubtle,
    backgroundColor: ZoomTheme.colors.dockBg,
  },
  invitationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: ZoomTheme.borderRadius.sm,
  },
  invitationBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  closeModalBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  closeModalBtnText: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 13,
  },
});
