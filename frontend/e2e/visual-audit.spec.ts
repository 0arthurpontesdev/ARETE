import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = path.resolve(__dirname, '../../docs/screenshots');

test.describe('Auditoria Visual: Screenshots Multi-Dispositivo & Componentes Zoom', () => {
  test('1. Captura da WaitingRoom em Desktop 1920x1080', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('http://localhost:8081');
    await expect(page.getByText('Zoom Videoconferência')).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/01_waiting_room_desktop_1920x1080.png`, fullPage: true });
  });

  test('2. Captura da WaitingRoom em Desktop 1366x768', async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto('http://localhost:8081');
    await expect(page.getByText('Zoom Videoconferência')).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/02_waiting_room_desktop_1366x768.png`, fullPage: true });
  });

  test('3. Captura da WaitingRoom em Tablet (768x1024)', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('http://localhost:8081');
    await expect(page.getByText('Zoom Videoconferência')).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/03_waiting_room_tablet_768x1024.png`, fullPage: true });
  });

  test('4. Captura da WaitingRoom em Mobile (390x844)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('http://localhost:8081');
    await expect(page.getByText('Zoom Videoconferência')).toBeVisible({ timeout: 15000 });
    await page.screenshot({ path: `${SCREENSHOT_DIR}/04_waiting_room_mobile_390x844.png`, fullPage: true });
  });

  test('5. Captura da Reunião com 2 Participantes + Chat + Participantes em Desktop 1920x1080', async ({ browser }) => {
    // 1. Host (Arthur)
    const hostContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      permissions: ['camera', 'microphone'],
    });
    const hostPage = await hostContext.newPage();
    await hostPage.goto('http://localhost:8081');

    await hostPage.getByPlaceholder('Digite seu nome').fill('Arthur Host');
    await hostPage.getByText('Iniciar Reunião (Anfitrião)').click();
    await expect(hostPage.getByText(/Sala:/)).toBeVisible({ timeout: 20000 });

    const roomTitleText = await hostPage.getByText(/Sala:/).innerText();
    const roomId = roomTitleText.replace('Sala:', '').trim();

    // 2. Convidado (Beatriz)
    const guestContext = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
      permissions: ['camera', 'microphone'],
    });
    const guestPage = await guestContext.newPage();
    await guestPage.goto(`http://localhost:8081/?room=${roomId}`);
    await guestPage.getByText('Entrar em Reunião').click();
    await guestPage.getByPlaceholder('Digite seu nome').fill('Beatriz Convidada');
    await guestPage.getByText('Entrar na Reunião').click();
    await expect(guestPage.getByText(`Sala: ${roomId}`)).toBeVisible({ timeout: 20000 });

    // Screenshot da Grade com 2 Participantes (Desktop)
    await hostPage.waitForTimeout(1000);
    await hostPage.screenshot({ path: `${SCREENSHOT_DIR}/05_meeting_2_participants_desktop.png` });

    // Abre Painel de Bate-Papo
    await hostPage.getByText('Bate-papo').click();
    await guestPage.getByText('Bate-papo').click();
    await guestPage.getByPlaceholder('Digite uma mensagem...').fill('Olá Arthur, excelente qualidade de vídeo e áudio!');
    await guestPage.getByLabel('Enviar mensagem').click();

    await expect(hostPage.getByText('Olá Arthur, excelente qualidade de vídeo e áudio!')).toBeVisible({ timeout: 10000 });
    await hostPage.screenshot({ path: `${SCREENSHOT_DIR}/06_meeting_chat_panel_open.png` });

    // Abre Painel de Participantes
    await hostPage.getByText('Participantes').click();
    await hostPage.screenshot({ path: `${SCREENSHOT_DIR}/07_meeting_participants_panel_open.png` });

    // Abre Modal de Configurações
    await hostPage.getByText('Ajustes').click();
    await hostPage.screenshot({ path: `${SCREENSHOT_DIR}/08_meeting_settings_modal.png` });

    // Limpeza
    await hostContext.close();
    await guestContext.close();
  });

  test('6. Captura da Reunião em Mobile (390x844)', async ({ browser }) => {
    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      permissions: ['camera', 'microphone'],
    });
    const mobilePage = await mobileContext.newPage();
    await mobilePage.goto('http://localhost:8081');

    await mobilePage.getByPlaceholder('Digite seu nome').fill('Mobile User');
    await mobilePage.getByText('Iniciar Reunião (Anfitrião)').click();
    await expect(mobilePage.getByText(/Sala:/)).toBeVisible({ timeout: 20000 });

    await mobilePage.waitForTimeout(1000);
    await mobilePage.screenshot({ path: `${SCREENSHOT_DIR}/09_meeting_room_mobile_390x844.png` });

    await mobileContext.close();
  });
});
