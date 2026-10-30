import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Check, X } from 'lucide-react-native';
import { ZoomTheme } from '../../styles/theme';

interface DeviceSelectorProps {
  title: string;
  devices: MediaDeviceInfo[];
  selectedId: string;
  onSelect: (deviceId: string) => void;
  onClose: () => void;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  title,
  devices,
  selectedId,
  onSelect,
  onClose,
}) => {
  return (
    <View style={styles.popover}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Fechar seletor">
          <X size={14} color={ZoomTheme.colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <View style={styles.deviceList}>
        {devices.length === 0 ? (
          <Text style={styles.noDevicesText}>Nenhum dispositivo encontrado</Text>
        ) : (
          devices.map((device, index) => {
            const isSelected = device.deviceId === selectedId;
            return (
              <TouchableOpacity
                key={device.deviceId || `dev-${index}`}
                style={[styles.deviceItem, isSelected && styles.selectedDeviceItem]}
                onPress={() => onSelect(device.deviceId)}
                activeOpacity={0.7}
              >
                <View style={styles.checkSlot}>
                  {isSelected && <Check size={14} color={ZoomTheme.colors.zoomBlue} />}
                </View>
                <Text style={[styles.deviceName, isSelected && styles.selectedDeviceName]} numberOfLines={1}>
                  {device.label || `Dispositivo ${index + 1}`}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
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
    zIndex: 100,
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
  title: {
    color: ZoomTheme.colors.textSecondary,
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
  deviceList: {
    gap: 2,
  },
  deviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: ZoomTheme.borderRadius.sm,
    gap: 8,
  },
  selectedDeviceItem: {
    backgroundColor: 'rgba(14, 114, 237, 0.12)',
  },
  checkSlot: {
    width: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deviceName: {
    color: ZoomTheme.colors.textSecondary,
    fontSize: ZoomTheme.typography.bodySmall,
    flex: 1,
  },
  selectedDeviceName: {
    color: ZoomTheme.colors.textPrimary,
    fontWeight: '600',
  },
  noDevicesText: {
    color: ZoomTheme.colors.textMuted,
    fontSize: ZoomTheme.typography.bodySmall,
    paddingVertical: 12,
    textAlign: 'center',
  },
});
