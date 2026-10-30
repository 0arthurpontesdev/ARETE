# Engenharia Reversa do Zoom & MVP de Videoconferência

MVP de videoconferência de alta fidelidade visual e funcional, inspirado na arquitetura de UI/UX do **Zoom**, desenvolvido com **React Native**, **React Native Web**, **Expo**, **Node.js com TypeScript** e infraestrutura WebRTC distribuída via **LiveKit SFU**.

---

## 🚀 Arquitetura Geral

```
                    ┌───────────────────────────┐
                    │    Cliente A (Navegador)  │
                    │   React Native Web + Expo │
                    └─────────────┬─────────────┘
                                  │ WebRTC (SRTP/DTLS)
                                  ▼
┌──────────────────┐        ┌───────────────────────────┐        ┌──────────────────┐
│   Backend Node   │◄───────┤    LiveKit Server (SFU)   ├───────►│    Cliente B     │
│  (Porta 4000)    │  gRPC  │      (Porta 7880)         │ WebRTC │   (Navegador)    │
│  Tokens JWT &    │        │  Audio / Vídeo / Data     │        │                  │
│  Gestão de Salas │        └───────────────────────────┘        └──────────────────┘
└──────────────────┘
```

1. **Frontend**:
   - Desenvolvido em **React Native** e **React Native Web** com **Expo** e **TypeScript**.
   - Reproduz fielmente os padrões de interface do Zoom: Barra de ferramentas inferior com botões duplos (split-buttons), orador ativo com moldura iluminada verde, fallback com avatar circular determinístico, carrossel de miniaturas, gavetas retráteis para participantes e bate-papo, popovers de troca a quente de periféricos e tela de pré-reunião (*Waiting Room*).
2. **Backend**:
   - Desenvolvido em **Node.js** com **TypeScript** e **Express**.
   - Integração com `livekit-server-sdk` para validação e emissão de `AccessToken` JWT criptografados, gerenciamento de permissões de anfitrião (`roomAdmin`) e orquestração de salas (`RoomServiceClient`).
3. **Infraestrutura WebRTC**:
   - Servidor **LiveKit** nativo local (binário Windows x64 incluído em `livekit/livekit-server.exe`) ou LiveKit Cloud.
   - Suporte completo a canais de mídia (VP8/H.264, Opus HD) e DataChannels confiáveis para chat de baixíssima latência.

---

## 📁 Estrutura do Repositório

```
ARETÉ/
├── docs/                        # Documentação da Engenharia Reversa
│   ├── specs.md                 # Especificações detalhadas da UI e DOM do Zoom
│   ├── component-map.md         # Mapeamento de componentes e props
│   ├── design-system.md         # Design System, cores, tipografia e tokens
│   ├── user-flows.md            # Fluxos de usuário e diagramas de sinalização
│   ├── audit-report.md          # Relatório da Fase 2: Auditoria Técnica e Validação
│   ├── ui-ux-report.md          # Relatório da Fase 3: Refinamento Visual e Design System
│   └── screenshots/             # Evidências visuais multi-dispositivo capturadas via Playwright
│
├── livekit/                     # Servidor WebRTC LiveKit Standalone
│   ├── livekit-server.exe       # Binário executável do LiveKit para Windows
│   └── livekit.yaml             # Configuração de portas WebRTC e chaves de API
│
├── backend-python/              # Serviço IA Copilot (Python/Flask + Gemini)
│   ├── src/
│   │   ├── config.py            # Portas e credenciais Gemini
│   │   ├── services/
│   │   │   └── ai_copilot_service.py # Geração de Resumo, Ata Formal, Tarefas e Q&A
│   │   ├── routes/
│   │   │   └── copilot_routes.py# Endpoints REST (/api/copilot/...)
│   │   └── app.py               # Inicialização Flask (Porta 5001)
│   ├── tests/
│   │   └── test_copilot.py      # Testes unitários com pytest
│   ├── requirements.txt         # Dependências (google-genai, flask, flask-cors)
│   └── venv/                    # Ambiente virtual isolado
│
├── server/                      # Backend Node.js / Express / TypeScript
│   ├── src/
│   │   ├── config.ts            # Variáveis de ambiente e portas
│   │   ├── services/
│   │   │   └── livekitService.ts# Geração de tokens JWT e controle de salas
│   │   ├── routes/
│   │   │   └── roomRoutes.ts    # Endpoints REST (/api/rooms, /api/token, etc.)
│   │   ├── index.ts             # Inicialização do Express
│   │   └── index.test.ts        # Testes automatizados da API
│   ├── .env                     # Variáveis locais
│   ├── .env.example             # Exemplo de configuração
│   └── tsconfig.json
│
├── frontend/                    # Frontend React Native / React Native Web / Expo
│   ├── src/
│   │   ├── types/               # Tipagens TypeScript completas
│   │   ├── styles/theme.ts      # Tokens de design do Zoom
│   │   ├── services/apiService.ts# Cliente HTTP para a API Node.js
│   │   ├── hooks/               # useLiveKitRoom, useMediaDevices, useResponsiveLayout
│   │   ├── components/
│   │   │   ├── header/MeetingHeader.tsx
│   │   │   ├── video/VideoGrid.tsx, VideoTile.tsx, ScreenShareView.tsx
│   │   │   ├── toolbar/MeetingToolbar.tsx, MicrophoneButton.tsx, CameraButton.tsx, ScreenShareButton.tsx
│   │   │   ├── panels/ParticipantsPanel.tsx, ParticipantItem.tsx, ChatPanel.tsx, ChatMessage.tsx
│   │   │   ├── settings/MeetingSettings.tsx, DeviceSelector.tsx
│   │   │   ├── common/AudioLevelIndicator.tsx, ConnectionStatus.tsx
│   │   │   └── waiting/WaitingRoom.tsx
│   │   └── screens/MeetingRoom.tsx
│   ├── e2e/                     # Testes ponta a ponta com Playwright
│   ├── vitest.config.ts         # Configuração de testes unitários
│   └── App.tsx                  # Ponto de entrada da aplicação
│
├── start-all.ps1                # Script para iniciar todo o ecossistema (LiveKit + Node + Python + Expo)
├── start-livekit.bat            # Inicializa LiveKit (Porta 7880)
├── start-backend.bat            # Inicializa Backend Node (Porta 4000)
├── start-copilot.bat            # Inicializa IA Copilot Python (Porta 5001)
└── start-frontend.bat           # Inicializa Frontend Expo (Porta 8081)
```

---

## 🛠️ Instalação e Execução

### Pré-requisitos
- Node.js 18+ (testado no Node.js v24)
- Portas disponíveis: `7880` (LiveKit), `4000` (Backend API), `8081` (Frontend Expo Web)

### 1. Inicialização Rápida (Todos os Serviços)
No PowerShell, execute na raiz do projeto:
```powershell
.\start-all.ps1
```
Este script abre janelas dedicadas para o LiveKit Server, o Backend e o Frontend.

---

### 2. Inicialização Manual Passo a Passo

#### Passo 1: Iniciar o Servidor WebRTC LiveKit
```powershell
cd livekit
.\livekit-server.exe --config livekit.yaml
```
*O servidor estará ouvindo em `ws://127.0.0.1:7880`.*

#### Passo 2: Iniciar o Backend
Em outro terminal:
```powershell
cd server
npm install
npm run dev
```
*A API REST estará rodando em `http://localhost:4000`.*

#### Passo 3: Iniciar o Frontend
Em um terceiro terminal:
```powershell
cd frontend
npm install
npm run web
```
*O aplicativo web estará disponível em `http://localhost:8081`.*

---

## ✨ Funcionalidades Implementadas

### 1. Controles da Sala de Reunião (Core WebRTC)
- **Áudio & Vídeo**: Seleção e alternância a quente de microfone/câmera, teste de equipamento, espelhamento, supressão de ruído e 'Áudio Original para Músicos'.
- **Segurança do Anfitrião**: Menu de segurança para trancar reunião, habilitar/desabilitar sala de espera, ocultar fotos de perfil e controlar permissões de compartilhamento, chat, renomear e reativar microfone.
- **Participantes & Sala de Espera**: Fila de admissão com ações individuais ou "Admitir Todos", botão oficial de convite estilo Zoom (link direto, ID e texto completo), silenciar todos (*Mute All*), renomear participantes, conceder cargo de Co-anfitrião (*Co-Host*) e expulsar.
- **Chat Expandido**: Mensagens públicas para toda a sala e conversas diretas privadas com etiqueta `(Privado)`, envio e download de arquivos anexos.
- **Compartilhamento com Anotações**: Transmissão de tela inteira/janela com camada interativa de anotações sobrepostas (caneta, marca-texto, carimbos, borracha, cores, desfazer e limpar).
- **Salas Simultâneas (*Breakout Rooms*)**: Criação de até 100 subsalas com distribuição automática ou manual, transmissão de mensagens globais (*broadcast*) e encerramento com contagem.
- **Interatividade & Reações**: Criação e votação ao vivo em enquetes (*Polls*) com cálculo dinâmico de porcentagens; botão "Levantar a mão" (ícone ✋ no card de vídeo) e reações flutuantes com emojis (👍, 👏, ❤️, 😂, 😮, 🎉).
- **Gravação**: Gravação local direta no navegador via `MediaRecorder` com download do arquivo `.webm` e gravação em nuvem com indicador pulsante `● REC`.

### 2. Menu de Configurações (5 Abas)
- **Geral**: Suporte a dois monitores e alternância de temas (Escuro / Claro).
- **Vídeo**: Resolução HD, espelhamento, correção para pouca luz e suavização de pele.
- **Áudio**: Supressão de ruído com 3 níveis e modo 'Áudio Original'.
- **Fundos & Filtros**: Desfoque de fundo (Leve e Intenso), fundos virtuais fotográficos e filtros de imagem (Sépia, P&B, Quente, Frio).
- **Gravação & Acessibilidade**: Localização de arquivos, gravação multifaixa, Closed Captions ao vivo e atalhos de teclado.

### 3. Portal de Gestão Administrativa & Ferramentas Assíncronas
- **Clipes Assíncronos (Estilo Loom)**: Gravação de tela combinada com bolha de webcam sobreposta, biblioteca de vídeos gravados e geração de link compartilhável.
- **Agendador de Reuniões (Estilo Calendly)**: Página pública `/schedule/{slug}` para reserva de horários (slots de 15, 30 ou 60 minutos) com botão de ingresso instantâneo na sala.
- **Gestão de Contas & Licenças**: Controle de licenças ativas, adição de membros, atribuição de funções (Admin / Membro) e gerenciamento de domínios corporativos.
- **Relatórios & Auditoria**: Painel de uso com lista de presença, horário de entrada/saída, tempo de permanência e botão de exportação para CSV.

---

## 🧪 Testes Automatizados

### Testes do Backend (Vitest)
Validação de geração de JWT, integridade dos grants de anfitrião/participante e permissões de conferência:
```powershell
cd server
npm test
```

### Testes de Componentes do Frontend (Vitest + JSDOM)
Validação de comportamentos do MicrophoneButton, CameraButton, ScreenShareButton, MeetingHeader, ParticipantsPanel, ChatPanel e VideoTile:
```powershell
cd frontend
npm test
```

### Testes Ponta a Ponta (E2E) & Auditoria Visual (Playwright)
Simulação de múltiplos participantes reais e captura de evidências visuais:
```powershell
cd frontend
npm run test:e2e
npx playwright test e2e/visual-audit.spec.ts
```

---

## 👥 Como Testar uma Reunião com 2 Participantes

1. Abra o navegador em `http://localhost:8081`.
2. No primeiro navegador (ou janela normal):
   - Digite o nome: `Arthur (Anfitrião)`.
   - Clique em **"Iniciar Reunião (Anfitrião)"**.
   - Você ingressará na sala. O ID da sala é gerado automaticamente (ex: `123-456-7890`) e a URL do navegador é atualizada para `http://localhost:8081/?room=123-456-7890`.
3. No segundo navegador (ou janela anônima):
   - Abra a URL com o parâmetro da sala: `http://localhost:8081/?room=123-456-7890` (ou insira o código manualmente na aba "Entrar em Reunião").
   - Digite o nome: `Convidado Especial`.
   - Clique em **"Entrar na Reunião"**.
4. **Verificação de Áudio, Vídeo e Chat**:
   - Ambos os participantes verão a grade de vídeos atualizada instantaneamente (layout 2x1).
   - Abra o painel de **Bate-papo** em qualquer um dos participantes e envie uma mensagem; ela aparecerá instantaneamente para o outro participante via WebRTC DataChannel.
   - Teste ligar/desligar microfone e câmera; a interface atualizará o estado de ambos em tempo real.
