import { describe, it, expect } from 'vitest';
import { livekitService } from './services/livekitService.js';

describe('Backend API, LiveKit Token & Security Audit', () => {
  it('deve gerar token JWT válido com grants de conferência', async () => {
    const token = await livekitService.generateToken({
      roomId: 'test-room-101',
      identity: 'user-arthur',
      name: 'Arthur Host',
      isHost: true,
    });

    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    const parts = token.split('.');
    expect(parts.length).toBe(3);

    const payloadJson = Buffer.from(parts[1], 'base64').toString('utf-8');
    const payload = JSON.parse(payloadJson);

    expect(payload.sub).toBe('user-arthur');
    expect(payload.name).toBe('Arthur Host');
    expect(payload.video).toBeDefined();
    expect(payload.video.room).toBe('test-room-101');
    expect(payload.video.roomJoin).toBe(true);
    expect(payload.video.roomAdmin).toBe(true);
    expect(payload.video.canPublish).toBe(true);
    expect(payload.video.canSubscribe).toBe(true);
  });

  it('deve gerar token com permissões normais para participante comum', async () => {
    const token = await livekitService.generateToken({
      roomId: 'test-room-102',
      identity: 'guest-bob',
      name: 'Bob Guest',
      isHost: false,
    });

    const parts = token.split('.');
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));

    expect(payload.sub).toBe('guest-bob');
    expect(payload.video.room).toBe('test-room-102');
    expect(payload.video.roomAdmin).toBe(false);
  });

  it('deve validar e verificar tokens com TokenVerifier', async () => {
    const token = await livekitService.generateToken({
      roomId: 'audit-room-202',
      identity: 'host-carol',
      name: 'Carol Host',
      isHost: true,
    });

    const claims = await livekitService.verifyToken(token);
    expect(claims).toBeDefined();
    expect(claims?.sub).toBe('host-carol');
    expect(claims?.video?.room).toBe('audit-room-202');
    expect(claims?.video?.roomAdmin).toBe(true);
  });

  it('deve rejeitar tokens forjados ou corrompidos', async () => {
    const claims = await livekitService.verifyToken('token.invalido.forjado');
    expect(claims).toBeNull();
  });
});
