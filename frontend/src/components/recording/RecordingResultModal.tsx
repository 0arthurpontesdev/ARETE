import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import {
  CheckCircle,
  Download,
  Share2,
  X,
  Play,
  Film,
  Music,
  HardDrive,
  Cloud,
  Check,
} from 'lucide-react-native';
import { ZoomTheme } from '../../styles/theme';
import { RecordingResult } from '../../utils/recordingService';

interface RecordingResultModalProps {
  result: RecordingResult;
  onClose: () => void;
  onShowToast?: (msg: string) => void;
}

export const RecordingResultModal: React.FC<RecordingResultModalProps> = ({
  result,
  onClose,
  onShowToast,
}) => {
  const [copied, setCopied] = useState(false);

  const formatDuration = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')} min`;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownloadAgain = () => {
    if (typeof document === 'undefined') return;
    const a = document.createElement('a');
    a.href = result.url;
    a.download = result.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast?.('Download iniciado novamente.');
  };

  const handleDownloadSeparateAudio = () => {
    if (!result.separateAudioUrl || typeof document === 'undefined') return;
    const a = document.createElement('a');
    a.href = result.separateAudioUrl;
    a.download = result.separateAudioFilename || 'audio_reuniao.webm';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onShowToast?.('Download da faixa de áudio iniciado.');
  };

  const handleCopyCloudLink = () => {
    if (!result.cloudUrl || typeof navigator === 'undefined') return;
    navigator.clipboard.writeText(result.cloudUrl);
    setCopied(true);
    onShowToast?.('Link da gravação copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <View style={styles.overlay}>
      <View style={styles.modalCard}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <CheckCircle size={20} color="#22C55E" />
            <Text style={styles.headerTitle}>Gravação Concluída com Sucesso</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fechar">
            <X size={18} color={ZoomTheme.colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Video Preview */}
        {Platform.OS === 'web' && (
          <View style={styles.videoPlayerContainer}>
            <video
              src={result.url}
              controls
              style={{
                width: '100%',
                height: 220,
                backgroundColor: '#000000',
                borderRadius: 6,
                outline: 'none',
              }}
            />
          </View>
        )}

        {/* Metadata Details Card */}
        <View style={styles.detailsCard}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Arquivo:</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {result.filename}
            </Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Duração:</Text>
            <Text style={styles.metaValueHighlight}>{formatDuration(result.durationSeconds)}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Tamanho:</Text>
            <Text style={styles.metaValue}>{formatFileSize(result.sizeBytes)}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Formato:</Text>
            <Text style={styles.metaValue}>{result.mimeType.split(';')[0]}</Text>
          </View>

          {result.cloudUrl && (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Status Nuvem:</Text>
              <Text style={[styles.metaValue, { color: '#38BDF8' }]}>Disponível no servidor</Text>
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.downloadBtn} onPress={handleDownloadAgain}>
            <Download size={15} color="#FFF" />
            <Text style={styles.downloadBtnText}>Baixar Novamente</Text>
          </TouchableOpacity>

          {result.separateAudioUrl && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleDownloadSeparateAudio}>
              <Music size={15} color={ZoomTheme.colors.textPrimary} />
              <Text style={styles.secondaryBtnText}>Faixa de Áudio</Text>
            </TouchableOpacity>
          )}

          {result.cloudUrl && (
            <TouchableOpacity style={styles.secondaryBtn} onPress={handleCopyCloudLink}>
              {copied ? <Check size={15} color="#22C55E" /> : <Share2 size={15} color={ZoomTheme.colors.textPrimary} />}
              <Text style={styles.secondaryBtnText}>{copied ? 'Copiado!' : 'Copiar Link'}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.closeActionBtn} onPress={onClose}>
            <Text style={styles.closeActionBtnText}>Concluir</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  modalCard: {
    width: 580,
    maxWidth: '92%',
    backgroundColor: ZoomTheme.colors.stageBgDarker,
    borderRadius: ZoomTheme.borderRadius.lg,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    overflow: 'hidden',
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.6,
    shadowRadius: 24,
    elevation: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: ZoomTheme.colors.borderSubtle,
    paddingBottom: 12,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  videoPlayerContainer: {
    width: '100%',
    height: 220,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    backgroundColor: '#000',
  },
  detailsCard: {
    backgroundColor: ZoomTheme.colors.cardBg,
    borderRadius: ZoomTheme.borderRadius.md,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    padding: 14,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaLabel: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  metaValue: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 12,
    maxWidth: '70%',
  },
  metaValueHighlight: {
    color: '#22C55E',
    fontSize: 12,
    fontWeight: '700',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: ZoomTheme.colors.zoomBlue,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: ZoomTheme.borderRadius.sm,
  },
  downloadBtnText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: ZoomTheme.borderRadius.sm,
  },
  secondaryBtnText: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: 12,
    fontWeight: '500',
  },
  closeActionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: ZoomTheme.borderRadius.sm,
    borderWidth: 1,
    borderColor: ZoomTheme.colors.borderSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeActionBtnText: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
});
