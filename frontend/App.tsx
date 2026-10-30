import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { WaitingRoom } from './src/components/waiting/WaitingRoom';
import { MeetingRoom } from './src/screens/MeetingRoom';
import { ApiService } from './src/services/apiService';
import { ZoomTheme } from './src/styles/theme';
import { injectGlobalWebStyles } from './src/styles/globalWebStyles';

injectGlobalWebStyles();

interface ActiveMeeting {
  roomId: string;
  token: string;
  wsUrl: string;
  userName: string;
  isHost: boolean;
  micOn: boolean;
  camOn: boolean;
}

export default function App() {
  const [meeting, setMeeting] = useState<ActiveMeeting | null>(null);
  const [initialRoomId, setInitialRoomId] = useState<string>(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      return urlParams.get('room') || '';
    }
    return '';
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const roomParam = urlParams.get('room');
      if (roomParam) {
        setInitialRoomId(roomParam);
      }
    }
  }, []);

  const handleStartMeeting = async ({
    roomId,
    userName,
    isHost,
    micOn,
    camOn,
  }: {
    roomId: string;
    userName: string;
    isHost: boolean;
    micOn: boolean;
    camOn: boolean;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const identity = `${userName.toLowerCase().replace(/\s+/g, '-')}-${Math.floor(1000 + Math.random() * 9000)}`;

      const tokenData = await ApiService.getMeetingToken({
        roomId,
        identity,
        name: userName,
        isHost,
      });

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const newUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;
        window.history.replaceState({ path: newUrl }, '', newUrl);
      }

      setMeeting({
        roomId: tokenData.roomId,
        token: tokenData.token,
        wsUrl: tokenData.wsUrl,
        userName,
        isHost,
        micOn,
        camOn,
      });
    } catch (err: any) {
      console.error('Falha ao ingressar na reunião:', err);
      setErrorMessage(err.message || 'Erro ao conectar à conferência');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateMeeting = async ({
    userName,
    micOn,
    camOn,
  }: {
    userName: string;
    micOn: boolean;
    camOn: boolean;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const created = await ApiService.createRoom();
      await handleStartMeeting({
        roomId: created.roomId,
        userName,
        isHost: true,
        micOn,
        camOn,
      });
    } catch (err: any) {
      console.error('Falha ao criar reunião:', err);
      setErrorMessage(err.message || 'Erro ao criar sala de reunião');
      setIsLoading(false);
    }
  };

  const handleLeaveMeeting = () => {
    setMeeting(null);
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.history.replaceState({}, '', window.location.pathname);
    }
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={ZoomTheme.colors.zoomBlue} />
          <Text style={styles.loadingText}>Conectando aos servidores de videoconferência...</Text>
        </View>
      )}

      {errorMessage && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}

      {meeting ? (
        <MeetingRoom
          roomId={meeting.roomId}
          token={meeting.token}
          wsUrl={meeting.wsUrl}
          userName={meeting.userName}
          isHost={meeting.isHost}
          initialMicOn={meeting.micOn}
          initialCamOn={meeting.camOn}
          onLeave={handleLeaveMeeting}
        />
      ) : (
        <WaitingRoom
          initialRoomId={initialRoomId}
          onJoinMeeting={handleStartMeeting}
          onCreateMeeting={handleCreateMeeting}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: ZoomTheme.colors.stageBg,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18, 20, 24, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    gap: 12,
  },
  loadingText: {
    color: ZoomTheme.colors.textPrimary,
    fontSize: ZoomTheme.typography.body,
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: ZoomTheme.colors.dangerRed,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: ZoomTheme.typography.body,
    fontWeight: '600',
  },
});
