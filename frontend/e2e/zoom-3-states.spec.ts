import { test, expect } from '@playwright/test';

const SCREENSHOT_DIR = '../docs/screenshots';

test.describe('Validação dos 3 Estados de Videoconferência (Zoom/Teams Dark Mode)', () => {
  test('Deve renderizar e validar exatamente os 3 estados da requisição com dados reais', async ({ page }) => {
    // Configurar viewport desktop Full HD 1920x1080
    await page.setViewportSize({ width: 1920, height: 1080 });

    // 1. Ingressar na reunião a partir da tela inicial
    await page.goto('http://localhost:8081');
    await page.getByPlaceholder('Digite seu nome').fill('Arthur (Engenheiro)');
    await page.getByText('Iniciar Reunião (Anfitrião)').click();

    // Esperar entrar na sala
    await expect(page.getByText(/Sala:/)).toBeVisible({ timeout: 20000 });
    await page.waitForTimeout(1500);

    // ==========================================
    // ESTADO 1: GRADE DE VÍDEO PRINCIPAL (GALLERY VIEW)
    // ==========================================
    // Verificar Cabeçalho: Título e Seletor
    await expect(page.getByText(/Sala:/)).toBeVisible();
    await expect(page.getByText(/Visualizar/)).toBeVisible();

    // Status de gravação dinâmico: inicialmente NÃO está gravando
    await expect(page.getByText('Gravando')).not.toBeVisible();

    // Testar alternância do botão "Gravar"
    await page.getByRole('button', { name: /Gravar/ }).click();
    await page.waitForTimeout(500);
    await expect(page.getByText('Gravando')).toBeVisible();

    // Verificar Participante Real Local (apenas eu/anfitrião na grade de vídeos)
    await expect(page.getByText(/Arthur \(Engenheiro\)/).first()).toBeVisible();

    // Verificar Toolbar Inferior: Mic, Cam, Segurança, Participantes (iniciando em 1), Chat sem badge estático
    await expect(page.getByRole('button', { name: 'Compartilhar tela' })).toBeVisible();
    await expect(page.getByText('Encerrar')).toBeVisible();
    await expect(page.getByLabel(/Participantes, 1 pessoas/)).toBeVisible();

    // Capturar Screenshot Estado 1
    await page.screenshot({ path: `${SCREENSHOT_DIR}/estado_1_gallery_view.png` });

    // ==========================================
    // ESTADO 2: MODAL DE COMPARTILHAMENTO DE TELA CUSTOMIZADO
    // ==========================================
    // Clicar no botão verde "Compartilhar tela" da barra inferior
    await page.getByRole('button', { name: 'Compartilhar tela' }).click();
    await page.waitForTimeout(800);

    // Verificar Modal Exclusivo: Título, Abas e as 6 Opções Interativas
    await expect(page.getByText('Compartilhar tela, janela ou aplicativo')).toBeVisible();
    await expect(page.getByText('Básico')).toBeVisible();
    await expect(page.getByText('Avançado')).toBeVisible();
    await expect(page.getByText('Arquivos').first()).toBeVisible();

    await expect(page.getByText('Tela 1')).toBeVisible();
    await expect(page.getByText('Quadro Branco')).toBeVisible();
    await expect(page.getByText('Google Chrome (Painel de Gestão)')).toBeVisible();
    await expect(page.getByText('Explorador de Arquivos')).toBeVisible();
    await expect(page.getByText('Apresentação PowerPoint')).toBeVisible();
    await expect(page.getByText('Apresentação PDF')).toBeVisible();

    // Selecionar o card "Google Chrome (Painel de Gestão)"
    await page.getByText('Google Chrome (Painel de Gestão)').click();
    await page.waitForTimeout(400);

    // Verificar Checkboxes e botões do Rodapé
    await expect(page.getByText('Compartilhar som do computador')).toBeVisible();
    await expect(page.getByText('Otimizar para clipe de vídeo')).toBeVisible();
    await expect(page.getByText('Cancelar')).toBeVisible();
    await expect(page.getByText('Compartilhar').first()).toBeVisible();

    // Capturar Screenshot Estado 2
    await page.screenshot({ path: `${SCREENSHOT_DIR}/estado_2_modal_compartilhamento_chat.png` });

    // ==========================================
    // ESTADO 3: MODO DE APRESENTAÇÃO / TELA COMPARTILHADA REAL
    // ==========================================
    // Clicar no botão azul "Compartilhar" do modal
    await page.getByLabel('Confirmar Compartilhamento').click();
    await page.waitForTimeout(1000);

    // Verificar Barra Flutuante Customizada no Topo (Dark mode e z-index 9999)
    await expect(page.getByText('Você está compartilhando a tela')).toBeVisible();
    await expect(page.getByText('Interromper Compartilhamento')).toBeVisible();

    // Verificar Menu Compacto Flutuante com Participantes dinâmico
    await expect(page.getByText(/Desmutar|Silenciar/)).toBeVisible();
    await expect(page.getByText(/Iniciar Vídeo|Interromper Vídeo/)).toBeVisible();
    await expect(page.getByText('Participantes 1')).toBeVisible();
    await expect(page.getByText('Novo Compartilhamento')).toBeVisible();
    await expect(page.getByText('Pausar Compartilhamento')).toBeVisible();
    await expect(page.getByText('Anotar').first()).toBeVisible();

    // Verificar Conteúdo Central Correspondente: Painel de Gestão (Dashboard & Kanban)
    await expect(page.getByText('Painel de gestao').first()).toBeVisible();
    await expect(page.getByText('To-Do')).toBeVisible();
    await expect(page.getByText('In Progress').first()).toBeVisible();

    // Verificar Sidecar de Vídeos no canto direito com webcam real
    await expect(page.getByText(/Arthur \(Engenheiro\)/).first()).toBeVisible();

    // Capturar Screenshot Estado 3
    await page.screenshot({ path: `${SCREENSHOT_DIR}/estado_3_compartilhamento_ativo_sidecar.png` });

    // Voltar para Galeria ao clicar em "Interromper Compartilhamento"
    await page.getByText('Interromper Compartilhamento').click();
    await page.waitForTimeout(800);
    await expect(page.getByRole('button', { name: 'Compartilhar tela' })).toBeVisible();
  });
});
