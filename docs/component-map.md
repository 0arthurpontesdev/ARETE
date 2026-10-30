# Mapeamento de Componentes (Component Map) — Fase 3

Este documento detalha o mapeamento arquitetural entre a interface do Zoom e a implementação modular em React Native Web / TypeScript.

## Matriz de Componentes

| Nome do Componente | Responsabilidade Principal | Props Principais | Estados Internos | Dependências WebRTC / LiveKit |
| :--- | :--- | :--- | :--- | :--- |
| `MeetingRoom` | Orquestrador principal da sala, conexão com o LiveKit, atalhos de teclado (Alt+A, Alt+V, Alt+S, Alt+H, Alt+U, Esc), orquestração de áudio/vídeo, modais e painéis | `roomId: string`, `userName: string`, `isHost: boolean`, `initialMicOn: boolean`, `initialCamOn: boolean`, `onLeave: () => void` | `activePanel`, `viewMode`, `isRecording`, `isAnnotating`, `activeModal`, `securitySettings`, `waitingParticipants`, `polls`, `breakoutRooms`, `handRaised`, `activeReaction` | `Room`, `RoomEvent`, `TrackPublication`, `MediaRecorder` |
| `MeetingHeader` | Barra superior com identificação da sala, indicador REC pulsante, botão de alternar visão (Galeria/Orador), botão Painel Admin e tela cheia | `roomName: string`, `isGalleryView: boolean`, `isRecording?: boolean`, `onToggleView: () => void`, `onToggleFullscreen: () => void`, `onOpenAdmin?: () => void` | `isFullscreen: boolean` | N/A |
| `VideoGrid` | Layout dinâmico de tiles em grade inteligente (1, 2, 3–4, 5–9, >9 com paginação Zoom) e suporte a ScreenShare com anotações | `participants: ParticipantInfo[]`, `room?: Room`, `activeSpeakerId?: string`, `screenShareTrack?: Track`, `isGalleryView: boolean`, `isAnnotating?: boolean`, `onCloseAnnotation?: () => void` | `pinnedId: string \| null`, `currentPage: number` | `Room.localParticipant`, `Room.remoteParticipants` |
| `VideoTile` | Renderização do feed de vídeo WebRTC (com espelhamento local, desfoque e filtros), avatar com iniciais coloridas, indicador sonoro, glow de orador, badge de mão levantada, emoji flutuante e ações de hover (Pin/Mais) | `participantInfo: ParticipantInfo`, `livekitParticipant?: Participant`, `isSpeakerView?: boolean`, `onPin?: () => void`, `isPinned?: boolean`, `handRaised?: boolean`, `floatingEmoji?: string \| null`, `videoFilter?: string`, `backgroundBlur?: 'none' \| 'light' \| 'heavy'` | `isHovered: boolean`, `videoRef` | `Track.Source.Camera`, `cameraPub.track.attach/detach` |
| `ScreenAnnotationCanvas` | Camada de anotação transparente sobre a tela compartilhada com suporte a caneta, marca-texto, carimbos (estrela, check, seta), borracha, paleta de cores, espessuras, desfazer e limpar | `isActive: boolean`, `onClose: () => void` | `tool ('pen' \| 'highlighter' \| 'stamp' \| 'eraser')`, `color`, `lineWidth`, `stampType`, `paths`, `stamps` | Canvas 2D API |
| `MeetingToolbar` | Barra de ferramentas inferior com controles ergonômicos em grupos: Mídia, Segurança, Colaboração (Participantes, Chat, Compartilhar, Gravar, Reações, Enquetes, Salas Simultâneas), Configurações e Saída | `isMuted: boolean`, `isVideoOff: boolean`, `isSharing: boolean`, `isRecording: boolean`, `participantCount: number`, `unreadChatCount: number`, `isHost: boolean`, `activePanel`, `handlers...` | `hoveredButton: string \| null` | N/A (Consome handlers) |
| `MicrophoneButton` | Botão duplo (toggle mute + seta para seleção de hardware) com tooltips e feedback hover/active | `isMuted: boolean`, `onToggle: () => void`, `onOpenDevices?: () => void`, `isMobile?: boolean` | `isHovered: boolean`, `isArrowHovered: boolean` | Consome `toggleMicrophone` |
| `CameraButton` | Botão duplo (toggle câmera + seta para seleção de webcam) com tooltips e feedback hover/active | `isVideoOff: boolean`, `onToggle: () => void`, `onOpenDevices?: () => void`, `isMobile?: boolean` | `isHovered: boolean`, `isArrowHovered: boolean` | Consome `toggleCamera` |
| `ScreenShareButton` | Botão com destaque visual em verde `#23D160` para iniciar ou vermelho para interromper apresentação de tela | `isSharing: boolean`, `onToggle: () => void`, `isMobile?: boolean` | `isHovered: boolean` | Consome `toggleScreenShare` |
| `SecurityMenu` | Popover de segurança do anfitrião estilo Zoom (trancar reunião, habilitar sala de espera, ocultar fotos de perfil, travar compartilhamento, chat, renomear e reativar som) | `isOpen: boolean`, `settings: SecuritySettings`, `onUpdateSetting: (key, value) => void`, `onClose: () => void` | N/A | Sincronizado via LiveKit Data Channel |
| `InviteModal` | Modal de convite estilo Zoom com cópia de URL direta, ID da reunião, senha e texto completo formatado do convite | `isOpen: boolean`, `roomId: string`, `onClose: () => void` | `copied: boolean` | `navigator.clipboard` |
| `ReactionsPopover` | Menu popover de reações com botão de alternância de Levantar/Abaixar a mão e botões de emojis flutuantes (👍, 👏, ❤️, 😂, 😮, 🎉) | `isOpen: boolean`, `handRaised: boolean`, `onToggleHand: () => void`, `onSelectEmoji: (emoji: string) => void`, `onClose: () => void` | N/A | Sincronizado via LiveKit Data Channel |
| `PollsModal` | Modal de gerenciamento e votação de enquetes ao vivo (criação de perguntas com múltipla escolha/resposta única, lançamento, contagem e porcentagens em tempo real) | `isOpen: boolean`, `isHost: boolean`, `polls: Poll[]`, `onCreatePoll: (poll) => void`, `onVote: (pollId, optionIndex) => void`, `onEndPoll: (pollId) => void`, `onClose: () => void` | `newQuestion: string`, `newOptions: string[]`, `activePollTab` | Sincronizado via LiveKit Data Channel |
| `BreakoutRoomsModal` | Modal de gerenciamento de Salas Simultâneas (Breakout Rooms) com criação de até 100 salas, distribuição automática/manual, transmissão geral e encerramento com contagem | `isOpen: boolean`, `rooms: BreakoutRoom[]`, `participants: ParticipantInfo[]`, `onCreateRooms: (count, mode) => void`, `onOpenRooms: () => void`, `onCloseRooms: () => void`, `onBroadcast: (msg) => void`, `onClose: () => void` | `roomCount: number`, `assignMode: 'auto' \| 'manual'`, `broadcastMsg: string` | Sincronizado via LiveKit Data Channel |
| `RecordingMenu` | Menu popover com opções de Gravação no Computador (local via `MediaRecorder` com download de `.webm`) e Gravação na Nuvem (simulada/SFU com indicador REC pulsante) | `isOpen: boolean`, `isRecording: boolean`, `recordingType?: 'local' \| 'cloud'`, `onStartLocal: () => void`, `onStartCloud: () => void`, `onStopRecording: () => void`, `onClose: () => void` | N/A | `MediaRecorder` API |
| `ParticipantsPanel` | Gaveta retrátil lateral / overlay com fila de Sala de Espera (Admitir/Rejeitar), busca em tempo real, contagem, avatares, botão Convidar e ação do host "Desativar som de todos" | `participants: ParticipantInfo[]`, `waitingParticipants?: WaitingParticipant[]`, `isHost: boolean`, `onClose: () => void`, `onMuteAll?: () => void`, `onInvite?: () => void`, `onAdmit?: (id) => void`, `onReject?: (id) => void`, `onAdmitAll?: () => void`, `isMobile?: boolean` | `search: string`, `selectedParticipant: ParticipantInfo \| null` | `ParticipantInfo[]` |
| `ParticipantItem` | Linha detalhada com nome, tags `(Você)`, `Anfitrião` e `Co-anfitrião`, ícones de status de mídia e menu de contexto (Tornar co-host, Renomear, Mover para espera, Remover) | `participant: ParticipantInfo`, `isHost?: boolean`, `onRename?: (id, name) => void`, `onMakeCoHost?: (id) => void`, `onMoveToWaiting?: (id) => void`, `onRemove?: (id) => void` | `showContextMenu: boolean` | `participant.isAudioEnabled`, `participant.isVideoEnabled` |
| `ChatPanel` | Painel lateral de bate-papo em tempo real com seletor de destinatário ("Todos na reunião" ou privado para participante específico), anexo de arquivo e scroll automático | `messages: ChatMessageData[]`, `participants: ParticipantInfo[]`, `onSendMessage: (text: string, recipientId?: string) => void`, `onSendFile?: (file: File) => void`, `onClose: () => void`, `isMobile?: boolean` | `inputText: string`, `selectedRecipient: ParticipantInfo \| null`, `isSendHovered: boolean` | `room.localParticipant.publishData` |
| `ChatMessage` | Item individual de mensagem com autor, etiqueta `(Privado)` quando direta, horário, balão estilizado e renderização de arquivo anexo com botão de download | `message: ChatMessageData` | N/A | N/A |
| `MeetingSettings` | Modal completo estilo Zoom com 5 abas laterais: Geral, Vídeo, Áudio, Fundos & Filtros, Gravação & Acessibilidade | `devices: DeviceList`, `preferences: MeetingPreferences`, `onUpdatePreferences: (prefs) => void`, `onSelectAudioInput`, `onSelectVideoInput`, `onClose` | `activeTab: 'general' \| 'video' \| 'audio' \| 'background' \| 'accessibility'` | `navigator.mediaDevices.enumerateDevices` |
| `DeviceSelector` | Menu contextual de popover para troca a quente de câmera e microfone diretamente da toolbar | `title: string`, `devices: MediaDeviceInfo[]`, `selectedId: string`, `onSelect: (id: string) => void`, `onClose: () => void` | N/A | `navigator.mediaDevices` |
| `AdminDashboard` | Portal Administrativo e de Gestão completo com 4 abas: Clipes (estilo Loom com webcam em bolha e gravação assíncrona), Agendador (estilo Calendly com link público `/schedule/{slug}` e slots), Contas & Licenças (planos, membros e cotas) e Relatórios (presença e exportação CSV) | `isOpen: boolean`, `onClose: () => void`, `onStartMeetingNow?: (roomId: string) => void` | `activeTab: 'loom' \| 'calendly' \| 'account' \| 'reports'`, `isRecordingLoom`, `loomClips`, `scheduleBookings` | `MediaRecorder` API, localStorage |
| `WaitingRoom` | Tela de pré-reunião com pré-visualização de câmera ao vivo, botões rápidos de mic/cam, menu colapsável de dispositivos, acesso ao Portal de Gestão (Admin) e abas Nova Reunião / Entrar | `initialRoomId?: string`, `onJoinMeeting: (params) => void`, `onCreateMeeting: (params) => void`, `onOpenAdmin?: () => void` | `userName: string`, `roomId: string`, `micOn: boolean`, `camOn: boolean`, `activeTab: 'create' \| 'join'`, `showDeviceConfig: boolean`, `permissionError: string \| null` | `navigator.mediaDevices.getUserMedia` |

---

## Hierarquia de Composição no React Native Web

```
<App>
  ├── <WaitingRoom> (Estado Prévio)
  │     ├── <BrandHeader /> (Logotipo + Botão "Painel de Gestão")
  │     ├── <CameraPreviewBox>
  │     │     ├── <video (Live Stream)>
  │     │     ├── <AvatarFallback />
  │     │     └── <FloatingPillControls (Mic, Cam, DeviceSettings)>
  │     ├── <DeviceDropdownCard (Colapsável)>
  │     ├── <TabHeader (Nova Reunião / Entrar)>
  │     └── <FormInputs (Nome, RoomId, Botão Primário)>
  │
  ├── <AdminDashboard> (Portal Administrativo - Modal Fullscreen)
  │     ├── <SidebarNav> (Clipes Loom, Agendador Calendly, Gestão de Contas, Relatórios)
  │     ├── <TabLoomClips> (Gravação assíncrona com Bubble Webcam, Biblioteca e Links)
  │     ├── <TabCalendlyScheduler> (Link público, Configuração de Slots, Agendamentos)
  │     ├── <TabAccountManagement> (Plano, Licenças, Usuários, Domínios)
  │     └── <TabReports> (Métricas de Reuniões, Lista de Presença com Horários, Exportação CSV)
  │
  └── <MeetingRoom> (Estado Conectado)
        ├── <MeetingHeader /> (Room ID, Indicador ● REC, Alternar Visão, Painel Admin, Fullscreen)
        ├── <ReconnectingBanner (Condicional)>
        │
        ├── <StageWrapper>
        │     ├── <GridWrapper>
        │     │     └── <VideoGrid>
        │     │           ├── <PaginationBar (se >9 participantes)>
        │     │           ├── <ScreenAnnotationCanvas (Sobreposição de Anotação na Tela Compartilhada)>
        │     │           ├── <VideoTile (Local com Espelhamento, Blur e Filtros de Vídeo)>
        │     │           │     ├── <video HTML5>
        │     │           │     ├── <AvatarFallback (Iniciais)>
        │     │           │     ├── <HandRaisedBadge (✋ Mão Levantada)>
        │     │           │     ├── <FloatingEmojiOverlay (Reação Animada)>
        │     │           │     ├── <TopRightHoverActions (Pin, Opções)>
        │     │           │     └── <BottomPill (Nome + Status Co-host + Mic + AudioLevel)>
        │     │           └── <VideoTile (Remoto 1..N)>
        │     │
        │     ├── <ParticipantsPanel (Lateral Desktop / Overlay Mobile)>
        │     │     ├── <WaitingRoomQueue (Fila de Admissão/Rejeição do Anfitrião)>
        │     │     ├── <SearchBar />
        │     │     ├── <ParticipantList> -> <ParticipantItem (com Menus de Co-host, Renomear, Remover)>
        │     │     └── <PanelFooterButtons (Convidar, Desativar Som de Todos)>
        │     │
        │     └── <ChatPanel (Lateral Desktop / Overlay Mobile)>
        │           ├── <RecipientSelector ("Todos na reunião" vs Participante Específico / Privado)>
        │           ├── <MessageList> -> <ChatMessage (com Badge "Privado" e Anexos de Arquivo)>
        │           └── <ChatInputRow (UploadButton, TextInput, SendButton)>
        │
        ├── <SecurityMenu (Popover do Anfitrião)>
        ├── <InviteModal (Link direto, ID, Senha e Texto Formatado)>
        ├── <ReactionsPopover (Levantar Mão e Emojis Animados)>
        ├── <PollsModal (Criação, Votação e Resultados ao Vivo)>
        ├── <BreakoutRoomsModal (Criação de N Salas, Modo Auto/Manual, Broadcast e Fechamento)>
        ├── <RecordingMenu (Gravação Local .webm e Nuvem com REC)>
        │
        ├── <MeetingSettings (Modal Centralizado em 5 Abas)>
        │     ├── <SidebarTabs (Geral, Vídeo, Áudio, Fundos & Filtros, Gravação & Acessibilidade)>
        │     └── <TabContent (Dispositivos, HD, Áudio Original, Supressão de Ruído, Blur, Closed Captions, Atalhos)>
        │
        ├── <DeviceSelectorPopover (Flutuante sobre Toolbar)>
        │
        └── <MeetingToolbar>
              ├── <LeftGroup (Mídia)>
              │     ├── <MicrophoneButton (Toggle + Chevron)>
              │     └── <CameraButton (Toggle + Chevron)>
              │
              ├── <CenterGroup (Colaboração)>
              │     ├── <SecurityToggleButton (Host)>
              │     ├── <ParticipantsToggleButton (Badge count)>
              │     ├── <ChatToggleButton (Badge unread)>
              │     ├── <ScreenShareButton (Highlight verde/vermelho)>
              │     ├── <AnnotationToggleButton (Disponível quando compartilhando)>
              │     ├── <RecordingToggleButton (Menu Local / Nuvem)>
              │     ├── <ReactionsToggleButton (Mão levantada / Emojis)>
              │     ├── <PollsToggleButton (Enquetes)>
              │     ├── <BreakoutRoomsToggleButton (Salas Simultâneas)>
              │     └── <SettingsToggleButton />
              │
              └── <RightGroup (Saída)>
                    └── <EndMeetingButton / LeaveMeetingButton (Alerta vermelho)>
```
