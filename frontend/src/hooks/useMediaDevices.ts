import { useState, useEffect, useCallback } from 'react';

export interface DeviceList {
  audioInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
}

export function useMediaDevices() {
  const [devices, setDevices] = useState<DeviceList>({
    audioInputs: [],
    audioOutputs: [],
    videoInputs: [],
  });
  const [selectedAudioInputId, setSelectedAudioInputId] = useState<string>('');
  const [selectedVideoInputId, setSelectedVideoInputId] = useState<string>('');

  const enumerate = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return;
    }

    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = allDevices.filter((d) => d.kind === 'audioinput');
      const audioOutputs = allDevices.filter((d) => d.kind === 'audiooutput');
      const videoInputs = allDevices.filter((d) => d.kind === 'videoinput');

      setDevices({ audioInputs, audioOutputs, videoInputs });

      if (audioInputs.length > 0 && !selectedAudioInputId) {
        setSelectedAudioInputId(audioInputs[0].deviceId);
      }
      if (videoInputs.length > 0 && !selectedVideoInputId) {
        setSelectedVideoInputId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Erro ao enumerar dispositivos de mídia:', err);
    }
  }, [selectedAudioInputId, selectedVideoInputId]);

  useEffect(() => {
    enumerate();
    navigator.mediaDevices?.addEventListener('devicechange', enumerate);
    return () => {
      navigator.mediaDevices?.removeEventListener('devicechange', enumerate);
    };
  }, [enumerate]);

  return {
    devices,
    selectedAudioInputId,
    selectedVideoInputId,
    setSelectedAudioInputId,
    setSelectedVideoInputId,
    refreshDevices: enumerate,
  };
}
