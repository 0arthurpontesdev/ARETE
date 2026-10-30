# Especificação Técnica de Engenharia Reversa: Zoom Web Client & MVP de Videoconferência (Fase 3)

## 1. Visão Geral da Interface

O Zoom Web Client (`app.zoom.us/wc`) opera como uma Single-Page Application (SPA) em tela cheia (`100vw`, `100vh`), otimizada para mínima distração e alta fidelidade visual no consumo de mídia WebRTC.
A interface é estruturada em quatro camadas principais de visualização:
1. **Camada Superior (Header / Top Bar)**: Barra translúcida com identificação da sala (`Room ID`), alternador dinâmico de visualização (*Speaker View* vs *Gallery View*) e botão de tela cheia nativo (`requestFullscreen`).
2. **Camada Central (Viewport de Mídia / Video Stage)**: Área elástica dinâmica que renderiza os participantes em grade (*Gallery View*) com cálculo adaptativo de colunas/linhas, proporção 16:9 estrita, ou em destaque (*Active Speaker View* ou *Pinned View*) com foco no orador ativo e carrossel de miniaturas.
3. **Camada Inferior (Meeting Toolbar / Dock)**: Barra fixa ao rodapé (`bottom: 0`, altura 72px em desktop e 62px em mobile), contendo todos os controles operacionais divididos em três grupos lógicos por divisores verticais sutis: Mídia (Microfone, Câmera com seletores de setinha ^ para popup de periféricos), Colaboração (Participantes com badge numérico, Bate-papo com badge de não lidas, Compartilhamento de Tela verde `#23D160`, Ajustes) e Botão de Encerrar/Sair (vermelho de alerta `#E02828`).
4. **Camada Lateral / Overlays (Side Panels & Modals)**: Painéis retráteis (`drawer` à direita com 360px de largura em desktop e overlay 100% em mobile) para Participantes e Chat, além de modal centralizado de configurações de áudio/vídeo (`MeetingSettings`) e seletores flutuantes (`DeviceSelector`).

---

## 2. Árvore DOM dos Componentes Principais

```html
<div id="root" class="zoom-app-container theme-dark">
  <div class="meeting-client-viewport" role="main" aria-label="Ambiente de Videoconferência">
    
    <!-- Top Header -->
    <header class="meeting-header" role="banner">
      <div class="header-left">
        <span class="meeting-title" title="Sala: test-room">Sala: test-room</span>
      </div>
      <div class="header-right">
        <button class="btn-view-toggle" aria-label="Alternar modo de exibição">
          <svg class="icon-grid" />
          <span>Orador / Galeria</span>
        </button>
        <button class="btn-fullscreen" aria-label="Alternar tela cheia">
          <svg class="icon-maximize" />
        </button>
      </div>
    </header>

    <!-- Main Viewport (Video Stage) -->
    <div class="meeting-stage-wrapper">
      <div class="video-grid-container" data-participant-count="2">
        
        <!-- Video Tile: Participante 1 (Local) -->
        <article class="video-tile is-speaking is-local" id="tile-local" role="region" aria-label="Vídeo de Arthur (Você)">
          <div class="video-wrapper">
            <video class="media-stream active" autoplay playsinline muted style="transform: scaleX(-1);"></video>
          </div>
          <div class="tile-top-actions">
            <button class="btn-tile-pin" aria-label="Fixar vídeo"></button>
            <button class="btn-tile-more" aria-label="Opções do participante"></button>
          </div>
          <div class="tile-bottom-pill">
            <div class="audio-indicator is-unmuted">
              <svg class="icon-mic" />
              <div class="audio-level-indicator" />
            </div>
            <span class="participant-name">Arthur (Você) (Anfitrião)</span>
          </div>
        </article>

        <!-- Video Tile: Participante 2 (Remoto) -->
        <article class="video-tile is-remote" id="tile-guest" role="region" aria-label="Vídeo de Beatriz">
          <div class="video-wrapper">
            <video class="media-stream active" autoplay playsinline></video>
          </div>
          <div class="tile-bottom-pill">
            <div class="audio-indicator is-muted">
              <svg class="icon-mic-off" />
            </div>
            <span class="participant-name">Beatriz</span>
          </div>
        </article>
      </div>

      <!-- Side Drawer (Chat / Participantes) -->
      <aside class="side-panel chat-panel" role="complementary" aria-label="Painel de Chat">
        <div class="panel-header">
          <h3>Bate-papo da reunião</h3>
          <button class="btn-close" aria-label="Fechar chat">✕</button>
        </div>
        <div class="message-list-scroll">
          <div class="chat-message local">
            <span class="sender">Arthur (Você)</span>
            <div class="bubble">Olá a todos!</div>
          </div>
        </div>
        <div class="panel-input-container">
          <div class="recipient-tag">Para: Todos na reunião</div>
          <input type="text" placeholder="Digite uma mensagem..." />
          <button class="btn-send" aria-label="Enviar mensagem"></button>
        </div>
      </aside>
    </div>

    <!-- Bottom Toolbar -->
    <nav class="meeting-toolbar" role="toolbar" aria-label="Controles da Reunião">
      <div class="left-group">
        <div class="btn-split-media" title="Desativar microfone (Alt+A)">
          <button class="btn-media-toggle" aria-label="Desativar microfone">
            <svg class="icon-mic" />
            <span>Desativar som</span>
          </button>
          <button class="btn-media-chevron" aria-label="Opções de microfone">▲</button>
        </div>
        <div class="btn-split-media" title="Interromper vídeo (Alt+V)">
          <button class="btn-media-toggle" aria-label="Interromper vídeo">
            <svg class="icon-video" />
            <span>Interromper</span>
          </button>
          <button class="btn-media-chevron" aria-label="Opções de câmera">▲</button>
        </div>
      </div>

      <div class="group-divider"></div>

      <div class="center-group">
        <button class="btn-action" aria-label="Participantes, 2 pessoas" title="Participantes (Alt+U)">
          <svg class="icon-users" />
          <span class="badge">2</span>
          <span>Participantes</span>
        </button>
        <button class="btn-action" aria-label="Bate-papo da reunião" title="Bate-papo (Alt+H)">
          <svg class="icon-message" />
          <span>Bate-papo</span>
        </button>
        <button class="btn-action btn-share-screen" aria-label="Compartilhar tela" title="Compartilhar tela (Alt+S)">
          <svg class="icon-share" />
          <span>Compartilhar</span>
        </button>
        <button class="btn-action" aria-label="Configurações da reunião">
          <svg class="icon-settings" />
          <span>Ajustes</span>
        </button>
      </div>

      <div class="group-divider"></div>

      <div class="right-group">
        <button class="btn-end-meeting" aria-label="Encerrar reunião para todos">
          <svg class="icon-phone-off" />
          <span>Encerrar</span>
        </button>
      </div>
    </nav>
  </div>
</div>
```

---

## 3. Comportamento Adaptativo da Grade de Vídeos (VideoGrid)

| Qtd. Participantes | Arranjo da Grade | Proporção por Célula | Comportamento em Mobile |
|---|---|---|---|
| **1 participante** | Centralizado, max 1280x720 | 16:9 | Ocupa largura máxima da viewport |
| **2 participantes** | 2 colunas x 1 linha (50% / 50%) | 16:9 preenchendo viewport | 1 coluna x 2 linhas (empilhados no modo retrato) |
| **3 a 4 participantes** | Grade 2x2 simétrica (49% x 49%) | 16:9 simétrico | Grade 1x3 ou 2x2 compacta |
| **5 a 9 participantes** | Grade 3x2 ou 3x3 responsiva | 16:9 fluida | Rolagem vertical fluida |
| **>9 participantes** | Paginação no topo (`Página X de Y`) com setas | 16:9 (máx 9 por página) | Paginação com rolagem suave |

---

## 4. Atalhos de Teclado Suportados

Para acelerar a produtividade e garantir acessibilidade no desktop, o cliente responde aos seguintes atalhos:

- `Alt + A`: Alternar Microfone (Ativar / Desativar som).
- `Alt + V`: Alternar Câmera (Iniciar / Interromper vídeo).
- `Alt + S`: Alternar Compartilhamento de Tela.
- `Alt + H`: Abrir / Fechar Painel de Bate-papo.
- `Alt + U`: Abrir / Fechar Painel de Participantes.
- `Escape`: Fechar modais de configurações ou popovers de seleção de dispositivos.
- `:focus-visible`: Navegação por teclado com anel de foco azul `#0E72ED` visível em todos os botões e links.

---

## 5. Módulos Avançados de Videoconferência e Gestão

### 5.1 Menu de Segurança do Anfitrião (`SecurityMenu`)
- **Trancar Reunião**: Impede o ingresso de novos participantes mesmo com o link.
- **Habilitar Sala de Espera**: Redireciona ingressantes para a fila de moderação do anfitrião.
- **Ocultar Fotos de Perfil**: Substitui avatares personalizados por iniciais padronizadas para privacidade.
- **Permissões de Participantes**: Permite ou bloqueia Compartilhamento de Tela, Envio de Mensagens de Chat, Renomear a si mesmo e Reativar o próprio microfone.

### 5.2 Gestão de Participantes e Sala de Espera (`ParticipantsPanel` / `ParticipantItem`)
- **Fila de Admissão**: Visualização dedicada dos participantes aguardando, com botões para Admitir individualmente, Rejeitar ou Admitir Todos com um clique.
- **Menu de Contexto de Participante**: Promover a Co-anfitrião (*Co-Host*), Renomear participante em tempo real, Enviar de volta para a Sala de Espera ou Remover da reunião.
- **Desativar Som de Todos (*Mute All*)**: Ação instantânea do anfitrião para silenciar todo o público.
- **Modal de Convites (`InviteModal`)**: Cópia rápida de link direto, ID da sala, senha e template oficial de convite para WhatsApp/E-mail.

### 5.3 Bate-papo Expandido e Transferência de Arquivos (`ChatPanel`)
- **Mensagens Privadas 1:1**: Seletor de destinatário com opção "Todos na reunião" ou participante específico, marcando balões com a tag visual `(Privado)`.
- **Anexos de Arquivos**: Suporte a envio de documentos, imagens e PDFs com indicador de tamanho e botão de download direto na conversa.

### 5.4 Compartilhamento com Anotações Interativas (`ScreenAnnotationCanvas`)
- Camada transparente de desenho sobreposta ao vídeo de compartilhamento de tela com `pointerEvents="box-none"`.
- Barra de ferramentas ergonômica: Caneta de traço fino, Marca-texto translúcido (50% de opacidade), Carimbos rápidos (⭐ Estrela, ✔ Check, ➜ Seta), Borracha, Seletor de 5 cores e 3 espessuras, Desfazer (*Undo*) e Limpar tudo.

### 5.5 Salas Simultâneas / Breakout Rooms (`BreakoutRoomsModal`)
- Divisão dos participantes em até 100 subsalas.
- Atribuição automática (balanceamento equilibrado) ou manual por parte do anfitrião.
- Transmissão de avisos gerais (*Broadcast Message*) para todas as salas em tempo real.
- Fechamento com contagem regressiva de segurança.

### 5.6 Interatividade: Enquetes e Reações (`PollsModal` & `ReactionsPopover`)
- **Enquetes (Polls)**: Criação de perguntas com múltipla escolha ou resposta única, lançamento em tempo real para os participantes, votação com apuração imediata e exibição gráfica de porcentagens e votos.
- **Reações ao Vivo**: Botão de alternância "Levantar a mão" (com ícone ✋ no card do participante) e botões de emojis rápidos (👍, 👏, ❤️, 😂, 😮, 🎉) com animação flutuante sobre o feed de vídeo.

### 5.7 Gravação Local e em Nuvem (`RecordingMenu`)
- **Gravação Local**: Captura nativa via `MediaRecorder` API dos streams de áudio e vídeo da tela, com download imediato do arquivo `.webm` para a máquina do usuário sem sobrecarga no servidor.
- **Gravação em Nuvem**: Simulação integrada com indicador pulsante `● REC` no cabeçalho superior e registro no painel de relatórios.

### 5.8 Menu de Configurações Expandido em 5 Abas (`MeetingSettings`)
- **Geral**: Suporte a múltiplos monitores e alternância de tema Escuro / Claro.
- **Vídeo**: Resolução HD, espelhamento de webcam, ajuste inteligente para ambientes com pouca luz e filtro de suavização de pele.
- **Áudio**: Supressão de ruído de fundo (Baixa, Média, Alta) e modo de 'Áudio Original para Músicos' (desativa cancelamento de eco agressivo e preserva fidelidade estéreo).
- **Fundos & Filtros**: Desfoque de fundo (Leve / Intenso), fundos virtuais fotográficos e filtros de imagem em tempo real (Sépia, Preto & Branco, Quente, Frio).
- **Gravação & Acessibilidade**: Definição de diretório de gravação, gravação de faixas de áudio separadas, Closed Captions (legendas ao vivo) e guia completo de atalhos de teclado.

### 5.9 Portal Administrativo e Ferramentas Assíncronas (`AdminDashboard`)
- **Clipes Assíncronos (Estilo Loom)**: Gravador de tela com bolha de webcam sobreposta no canto inferior, pré-visualização imediata, biblioteca persistida no `localStorage` e geração de link compartilhável `/clips/{id}`.
- **Agendador Público (Estilo Calendly)**: Página pública `/schedule/{slug}` para reserva de reuniões, configuração de slots de horários de 15, 30 ou 60 minutos e botão para iniciar/ingressar imediatamente na reunião agendada.
- **Gestão de Contas e Licenças**: Painel com cotas de licenças atribuídas vs disponíveis, adição de novos membros, papéis de acesso (Admin / Membro) e gerenciamento de domínios corporativos autorizados.
- **Relatórios e Auditoria**: Relatório de métricas de reuniões realizadas, lista de presença detalhada com horário de entrada/saída e permanência total em minutos, e exportação completa para planilha CSV.
