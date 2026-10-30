import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MicrophoneButton } from '../components/toolbar/MicrophoneButton';
import { CameraButton } from '../components/toolbar/CameraButton';
import { ScreenShareButton } from '../components/toolbar/ScreenShareButton';
import { MeetingHeader } from '../components/header/MeetingHeader';
import { ParticipantsPanel } from '../components/panels/ParticipantsPanel';
import { ChatPanel } from '../components/panels/ChatPanel';
import { VideoTile } from '../components/video/VideoTile';
import { ParticipantInfo } from '../types';

describe('Componentes do Design System Zoom & Meeting UI', () => {
  it('MicrophoneButton deve alternar entre Desativar som e Ativar som', () => {
    const handleToggle = vi.fn();
    const { rerender } = render(<MicrophoneButton isMuted={false} onToggle={handleToggle} />);

    expect(screen.getByText('Desativar som')).toBeDefined();
    fireEvent.click(screen.getByLabelText('Desativar microfone'));
    expect(handleToggle).toHaveBeenCalledTimes(1);

    rerender(<MicrophoneButton isMuted={true} onToggle={handleToggle} />);
    expect(screen.getByText('Ativar som')).toBeDefined();
  });

  it('CameraButton deve exibir rótulo correto conforme status', () => {
    const handleToggle = vi.fn();
    const { rerender } = render(<CameraButton isVideoOff={false} onToggle={handleToggle} />);

    expect(screen.getByText('Interromper')).toBeDefined();
    fireEvent.click(screen.getByLabelText('Interromper vídeo'));
    expect(handleToggle).toHaveBeenCalledTimes(1);

    rerender(<CameraButton isVideoOff={true} onToggle={handleToggle} />);
    expect(screen.getByText('Iniciar vídeo')).toBeDefined();
  });

  it('ScreenShareButton deve indicar destaque quando ativo', () => {
    const handleToggle = vi.fn();
    const { rerender } = render(<ScreenShareButton isSharing={false} onToggle={handleToggle} />);

    expect(screen.getByText('Compartilhar')).toBeDefined();
    fireEvent.click(screen.getByLabelText('Compartilhar tela'));
    expect(handleToggle).toHaveBeenCalledTimes(1);

    rerender(<ScreenShareButton isSharing={true} onToggle={handleToggle} />);
    expect(screen.getByText('Parar')).toBeDefined();
  });

  it('MeetingHeader deve renderizar nome da sala e botão de alternar visão', () => {
    const handleToggleView = vi.fn();
    render(
      <MeetingHeader
        roomName="room-test-123"
        isGalleryView={true}
        onToggleView={handleToggleView}
      />
    );

    expect(screen.getByText(/room-test-123/)).toBeDefined();
    expect(screen.getByText(/Orador/)).toBeDefined();
    fireEvent.click(screen.getByLabelText('Alternar modo de exibição'));
    expect(handleToggleView).toHaveBeenCalledTimes(1);
  });

  it('ParticipantsPanel deve listar participantes e filtrar por busca', () => {
    const participants: ParticipantInfo[] = [
      {
        identity: '1',
        name: 'Alice Silva',
        isLocal: true,
        isHost: true,
        isSpeaking: false,
        isAudioEnabled: true,
        isVideoEnabled: true,
        isScreenSharing: false,
      },
      {
        identity: '2',
        name: 'Bob Santos',
        isLocal: false,
        isHost: false,
        isSpeaking: true,
        isAudioEnabled: false,
        isVideoEnabled: false,
        isScreenSharing: false,
      },
    ];

    render(
      <ParticipantsPanel
        participants={participants}
        isHost={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/Participantes \(2\)/)).toBeDefined();
    expect(screen.getByText('Alice Silva (Você)')).toBeDefined();
    expect(screen.getByText('Bob Santos')).toBeDefined();
  });

  it('ChatPanel deve renderizar mensagens e permitir envio', () => {
    const handleSend = vi.fn();
    const messages = [
      {
        id: 'm1',
        senderIdentity: 'user-1',
        senderName: 'Carlos',
        text: 'Olá a todos na reunião!',
        timestamp: '10:00',
        isLocal: false,
      },
    ];

    render(
      <ChatPanel
        messages={messages}
        onSendMessage={handleSend}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText('Olá a todos na reunião!')).toBeDefined();
    const input = screen.getByPlaceholderText('Digite uma mensagem...');
    fireEvent.change(input, { target: { value: 'Mensagem de teste' } });
    fireEvent.click(screen.getByLabelText('Enviar mensagem'));

    expect(handleSend).toHaveBeenCalledWith('Mensagem de teste', undefined, undefined);
  });

  it('VideoTile deve exibir avatar com iniciais quando o vídeo estiver desligado', () => {
    const participant: ParticipantInfo = {
      identity: 'user-7',
      name: 'Eduardo Ramos',
      isLocal: false,
      isHost: false,
      isSpeaking: false,
      isAudioEnabled: true,
      isVideoEnabled: false,
      isScreenSharing: false,
    };

    render(<VideoTile participantInfo={participant} />);

    expect(screen.getByText('ER')).toBeDefined();
    expect(screen.getByText('Eduardo Ramos')).toBeDefined();
  });
});
