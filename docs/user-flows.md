# Fluxos de Usuário (User Flows)

Este documento descreve os fluxos operacionais completos da aplicação de videoconferência baseada no Zoom.

---

## 1. Fluxo de Criação e Ingresso na Reunião

```mermaid
flowchart TD
    A[Acesso à Home / Landing] --> B{Criar Sala ou Entrar?}
    B -->|Criar Nova Sala| C[Gera ID único de Sala aleatório]
    B -->|Entrar com Código| D[Digita ID ou acessa via Link direto ?room=ID]
    C --> E[Tela de Espera / Waiting Room]
    D --> E
    E --> F[Permissão de Câmera e Microfone solicitada]
    F --> G[Ajuste de Nome e Periféricos no Preview]
    G --> H[Clique em 'Entrar na Reunião']
    H --> I[Backend gera JWT Token LiveKit autenticado]
    I --> J[Cliente conecta via WebRTC à sala LiveKit]
    J --> K[Interface MeetingRoom carregada]
```

---

## 2. Fluxo em Reunião (In-Meeting Lifecycle)

```mermaid
flowchart TD
    M[Participante conectado na sala] --> O1[Alternar Microfone]
    M --> O2[Alternar Câmera]
    M --> O3[Compartilhar Tela]
    M --> O4[Abrir Bate-papo]
    M --> O5[Abrir Lista de Participantes]
    M --> O6[Trocar Dispositivo de Áudio/Vídeo]
    M --> O7[Encerrar / Sair da Reunião]

    O1 -->|Toggle Mic| P1[LocalAudioTrack ativa/muta e notifica peer]
    O2 -->|Toggle Cam| P2[LocalVideoTrack ativa/desliga e alterna para Avatar]
    O3 -->|Toggle Share| P3[getDisplayMedia publica ScreenShareTrack e ajusta grid]
    O4 -->|Chat| P4[Abre gaveta lateral direita; publica dados via DataChannel]
    O5 -->|Participantes| P5[Abre gaveta lateral direita com lista de peers e status]
    O6 -->|Menu Device| P6[SwitchDevice no LiveKit sem desconectar chamada]
    O7 -->|Sair/Encerrar| P7[Desconecta tracks, fecha peer connections, retorna à Home]
```

---

## 3. Fluxo de Mídia e Sinalização WebRTC (LiveKit Architecture)

```mermaid
sequenceDiagram
    autonumber
    actor Alice as Usuário A (Anfitrião)
    actor Bob as Usuário B (Participante)
    participant ClientA as Frontend Alice
    participant ClientB as Frontend Bob
    participant API as Backend (Node.js API)
    participant LK as LiveKit Server (SFU WebRTC)

    Alice->>API: POST /api/rooms (Cria sala "standup-101")
    API-->>Alice: { roomId: "standup-101" }
    Alice->>API: POST /api/token { roomId: "standup-101", identity: "Alice", isHost: true }
    API-->>Alice: { token: "jwt_token_alice" }
    Alice->>LK: Conecta WebSocket ws://localhost:7880 com Token
    LK-->>Alice: Conectado (Alice entra na sala)
    Alice->>LK: Publica Track de Áudio e Track de Vídeo

    Bob->>API: POST /api/token { roomId: "standup-101", identity: "Bob" }
    API-->>Bob: { token: "jwt_token_bob" }
    Bob->>LK: Conecta WebSocket com Token
    LK-->>Bob: Conectado
    LK->>ClientA: Evento: ParticipantConnected (Bob)
    LK->>ClientB: Evento: ParticipantConnected (Alice) + Subscrição de Tracks de Alice
    Bob->>LK: Publica Áudio e Vídeo de Bob
    LK->>ClientA: Subscrição de Tracks de Bob
    Note over ClientA,ClientB: Áudio e Vídeo fluindo com baixa latência via SFU
```

---

## 4. Tratamento de Exceções e Reconexão

- **Queda de Conexão (Network Blip)**:
  - O LiveKit dispara o evento `RoomEvent.Reconnecting`.
  - A interface exibe no cabeçalho um alerta em amarelo com spinner: `Reconectando à reunião...`.
  - Todos os estados locais de mute/unmute são preservados.
  - Ao restabelecer (`RoomEvent.Reconnected`), o alerta some e as tracks são revalidadas.
  - Se a reconexão falhar após 15 segundos, o status transita para `Disconnected` e exibe opção de tentar novamente ou retornar ao início.
- **Permissão de Câmera/Microfone Negada**:
  - A interface captura o erro `NotAllowedError` e inicializa o usuário no modo "somente ouvinte", exibindo um toast instruindo a liberar as permissões no navegador.
