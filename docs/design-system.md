# Design System Centralizado: Zoom UI & Videoconferência (Fase 3)

## 1. Princípios de Design e Usabilidade

1. **Foco Máximo no Conteúdo Humano**: A interface de videoconferência atua em segundo plano. Os docks, painéis e molduras mantêm tonalidades escuras (`#121418`, `#1A1D21`) de baixo reflexo, garantindo que os fluxos de vídeo (câmeras) e apresentações de tela recebam o foco total da visão do participante.
2. **Clareza de Estado de Mídia sem Ambiguidade**: O usuário nunca deve ter dúvidas sobre o estado da sua câmera ou microfone. O padrão de semáforo da interface usa vermelho (`#E02828`) com ícone barrado para mudo/desligado e tons neutros/verdes com medidor animado de amplitude (`AudioLevelIndicator`) para áudio ativo.
3. **Ergonomia e Zoneamento dos Controles (Padrão Zoom)**:
   - **Zona Esquerda**: Controles vitais de hardware de mídia (Microfone, Câmera e seletores de dispositivo por chevron).
   - **Zona Central**: Ferramentas de colaboração e engajamento (Participantes, Bate-papo, Compartilhamento de Tela em verde `#23D160` e Ajustes).
   - **Zona Direita**: Ação de término ou saída destacada em vermelho Zoom (`Encerrar` para o anfitrião, `Sair` para convidados).
4. **Resiliência e Geometria Adaptativa**: A grade de vídeos preserva a proporção 16:9 dinâmica, adaptando colunas e linhas conforme a quantidade de participantes (1, 2, 3–4, 5–9, >9) e suportando abertura e fechamento de painéis laterais sem distorções.

---

## 2. Tokens de Design Centralizados (`ZoomTheme`)

### Paleta de Cores

| Token | Valor Hex/RGBA | Aplicação |
|---|---|---|
| `stageBg` | `#121418` | Fundo principal da sala de reunião |
| `stageBgDarker` | `#0B0C0E` | Backdrop de telas de apresentação |
| `dockBg` | `#1A1D21` | Barra de controles inferior e cabeçalhos |
| `tileBg` | `#24272C` | Cartão de vídeo (câmera desligada / moldura) |
| `tileBgHover` | `#2A2E34` | Estado hover sobre o tile de vídeo |
| `panelBg` | `#1F2227` | Fundo de painéis laterais e cartões |
| `inputBg` | `#2B2F36` | Campos de formulário e inputs de mensagem |
| `zoomBlue` | `#0E72ED` | Cor primária oficial da marca Zoom |
| `zoomBlueHover` | `#005CE6` | Hover em botões primários |
| `zoomBlueLight` | `rgba(14, 114, 237, 0.15)` | Destaques sutis e balões de chat locais |
| `dangerRed` | `#E02828` | Botão encerrar, microfone mudo, câmera desligada |
| `dangerRedHover` | `#C61C1C` | Hover do botão de encerramento |
| `dangerRedBg` | `rgba(224, 40, 40, 0.15)` | Fundo de status mudo e compartilhamento ativo |
| `successGreen` | `#23D160` | Compartilhamento de tela e orador ativo |
| `warningYellow` | `#FFA502` | Avisos e banners de reconexão |
| `textPrimary` | `#FFFFFF` | Títulos e textos de alto contraste |
| `textSecondary` | `#A1A5AB` | Legendas, subtítulos e labels dos botões |
| `textMuted` | `#6E737C` | Informações secundárias e placeholders |
| `borderSubtle` | `rgba(255, 255, 255, 0.08)` | Bordas finas de separadores e tiles |
| `borderMedium` | `rgba(255, 255, 255, 0.16)` | Contornos de botões ativos |

### Tipografia

- **Família de Fontes**: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`
- **Escala de Tamanhos**:
  - `caption`: 11px (Labels de botões da barra, timestamps, badges)
  - `button`: 12px (Botão Sair, Encerrar, ações de formulário)
  - `bodySmall`: 13px (Texto auxiliar de dispositivos e opções)
  - `body`: 14px (Mensagens de chat, nomes nos tiles, inputs)
  - `subtitle`: 16px (Títulos de painéis e abas)
  - `title`: 18px (Cabeçalho de salas e modais)
  - `headline`: 22px (Títulos de cartões de boas-vindas)
  - `display`: 28px (Iniciais de avatar grande em orador ativo)
- **Pesos**:
  - `regular`: 400
  - `medium`: 500
  - `semiBold`: 600
  - `bold`: 700

### Espaçamento (8pt Grid System)

- `xxs`: 2px
- `xs`: 4px
- `sm`: 8px
- `md`: 12px
- `lg`: 16px
- `xl`: 24px
- `xxl`: 32px
- `xxxl`: 48px

### Raios de Borda (`borderRadius`)

- `none`: 0px
- `xs`: 4px (Badges de anfitrião, tags de status)
- `sm`: 6px (Botões da barra, inputs)
- `md`: 8px (Cartões de mensagem, seletores, botões primários)
- `lg`: 12px (Modal de configurações, card de sala de espera)
- `xl`: 16px (Contêineres de destaque)
- `round`: 9999px (Pills de controles flutuantes e avatares circulares)

### Sistema de Elevação e Sombras (`shadows`)

- `subtle`: `0 2px 4px rgba(0, 0, 0, 0.25)` — Mensagens de chat e menus flutuantes.
- `medium`: `0 4px 8px rgba(0, 0, 0, 0.35)` — Docks e popovers.
- `high`: `0 8px 16px rgba(0, 0, 0, 0.50)` — Modais e cartões principais.
- `speakingGlow`: `0 0 10px rgba(35, 209, 96, 0.80)` — Glow pulsante verde no participante que está falando.

---

## 3. Especificação dos Componentes

### 1. VideoTile
- **Proporção**: 16:9 (`aspectRatio: 16 / 9`) com preenchimento responsivo.
- **Vídeo Ativo**: Elemento `<video>` HTML5 / WebRTC com `objectFit: cover`. No participante local, aplica-se espelhamento (`transform: scaleX(-1)`).
- **Vídeo Inativo**: Avatar circular com iniciais e cor de fundo gerada deterministicamente a partir do nome (`getAvatarColor`), garantindo identidade visual estável.
- **Orador Ativo**: Borda verde `#23D160` viva e sombra verde difusa (`speakingGlow`).
- **Pill Inferior**: Pill translúcida (`rgba(0, 0, 0, 0.68)`) no canto inferior esquerdo com ícone de microfone/equalizador sonoro, nome completo e badges `(Você)` ou `(Anfitrião)`.
- **Ações de Hover**: Botão de fixar (Pin) e menu contextual no canto superior direito visíveis ao passar o cursor do mouse.

### 2. VideoGrid
- **1 participante**: Centralizado na tela com dimensões máximas de 1280x720 e proporção 16:9.
- **2 participantes**: Lado a lado em desktop/landscape preenchendo a largura de forma balanceada; empilhados verticalmente em smartphones no modo retrato.
- **3 a 4 participantes**: Grade 2x2 simétrica com 49% de largura/altura por célula.
- **5 a 9 participantes**: Grade fluida 3x2 ou 3x3 com cálculo dinâmico de colunas e linhas.
- **Mais de 9 participantes**: Paginação estilo Zoom no topo (`Página X de Y`) com setas de navegação anterior/próxima e limite de 9 participantes por tela para manter alta performance de renderização.

### 3. MeetingToolbar
- **Altura**: 72px (Desktop/Tablet) e 62px (Mobile).
- **Botões de Mídia com Seta**: `MicrophoneButton` e `CameraButton` contam com botão de ação principal (mute/toggle) e botão secundário com chevron para seleção direta de dispositivos.
- **Estados Visuais**:
  - `Normal`: Fundo transparente, ícone branco e rótulo secundário cinza.
  - `Hover`: Fundo `rgba(255, 255, 255, 0.08)` e contorno sutil.
  - `Active/Pressed`: Fundo azul sutil `rgba(14, 114, 237, 0.15)`.
  - `Muted/Desligado`: Ícone barrado em vermelho `#E02828`.
- **Botão Sair / Encerrar**: Distinto no canto direito. O anfitrião visualiza "Encerrar" em vermelho sólido com sombra suave; convidados visualizam "Sair" em botão translúcido de aviso.

### 4. WaitingRoom
- **Card Central Elevado**: Visual Zoom moderno de 500px de largura máxima com sombra profunda e borda fina.
- **Pré-visualização de Câmera**: Fluxo ao vivo em espelho com botões flutuantes para alternar mic e vídeo antes de ingressar.
- **Seletor Rápido de Dispositivos**: Menu dropdown colapsável para alternar microfone e câmera antes da reunião.
- **Abas Alternáveis**: "Nova Reunião" e "Entrar em Reunião" com indicador azul ativo.

### 5. Painéis Laterais (Chat, Participantes, Ajustes)
- **Abertura**: Deslizam na lateral direita com 360px de largura sem distorcer o aspect ratio dos vídeos na grade.
- **Mobile**: Assumem ocupação de 100% da tela em overlay/drawer acima da barra de controles.
- **Chat**: Mensagens locais em azul Zoom (`#0E72ED`), mensagens remotas em cinza escuro (`#2B2F36`), input com foco azul e botão de envio circular.
- **Participantes**: Busca rápida por nome com filtragem instantânea, contadores no cabeçalho e botão do anfitrião para desativar som de todos.
