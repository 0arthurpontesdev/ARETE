import { test, expect } from '@playwright/test';

test.describe('E2E: Videoconferência estilo Zoom (Host + Convidado)', () => {
  test('Deve renderizar a tela de espera (WaitingRoom) com sucesso', async ({ page }) => {
    await page.goto('http://localhost:8081');
    await expect(page.getByText('Zoom Videoconferência')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Seu Nome de Exibição')).toBeVisible();
    await expect(page.getByText('Iniciar Reunião (Anfitrião)')).toBeVisible();
  });

  test('Dois participantes entram na mesma reunião e trocam mensagens no chat', async ({ browser }) => {
    test.setTimeout(60000);

    // 1. Sessão 1: Anfitrião (Alice)
    const hostContext = await browser.newContext({
      permissions: ['camera', 'microphone'],
    });
    const hostPage = await hostContext.newPage();
    await hostPage.goto('http://localhost:8081');

    await hostPage.getByPlaceholder('Digite seu nome').fill('Alice Host');
    await hostPage.getByText('Iniciar Reunião (Anfitrião)').click();

    // Alice deve entrar na sala de reunião
    await expect(hostPage.getByText(/Sala:/)).toBeVisible({ timeout: 20000 });
    const roomTitleText = await hostPage.getByText(/Sala:/).innerText();
    const roomId = roomTitleText.replace('Sala:', '').trim();
    expect(roomId.length).toBeGreaterThan(0);

    // 2. Sessão 2: Convidado (Bob) em contexto independente
    const guestContext = await browser.newContext({
      permissions: ['camera', 'microphone'],
    });
    const guestPage = await guestContext.newPage();
    await guestPage.goto(`http://localhost:8081/?room=${roomId}`);

    // Garante que está na aba 'Entrar em Reunião'
    await guestPage.getByText('Entrar em Reunião').click();
    await guestPage.getByPlaceholder('Digite seu nome').fill('Bob Guest');
    await guestPage.getByText('Entrar na Reunião').click();

    // Bob deve estar conectado na sala
    await expect(guestPage.getByText(`Sala: ${roomId}`)).toBeVisible({ timeout: 20000 });

    // 3. Teste de Bate-papo: Bob abre o chat e envia uma mensagem
    await guestPage.getByText('Bate-papo').click();
    await guestPage.getByPlaceholder('Digite uma mensagem...').fill('Olá Alice, tudo bem?');
    await guestPage.getByLabel('Enviar mensagem').click();

    // 4. Alice abre o chat e vê a mensagem de Bob
    await hostPage.getByText('Bate-papo').click();
    await expect(hostPage.getByText('Olá Alice, tudo bem?')).toBeVisible({ timeout: 15000 });

    // 5. Teste de Controles: Alice muta e desmuta o microfone
    await hostPage.getByLabel('Desativar microfone').click();
    await expect(hostPage.getByText('Ativar som')).toBeVisible();
    await hostPage.getByLabel('Ativar microfone').click();
    await expect(hostPage.getByText('Desativar som')).toBeVisible();

    // Limpeza
    await hostContext.close();
    await guestContext.close();
  });
});
