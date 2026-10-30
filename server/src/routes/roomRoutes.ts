import { Router, Request, Response } from 'express';
import { livekitService } from '../services/livekitService.js';
import { config } from '../config.js';

export const roomRouter = Router();

// Gera identificador aleatório legível no estilo Zoom
function generateRoomCode(): string {
  const part1 = Math.floor(100 + Math.random() * 900);
  const part2 = Math.floor(100 + Math.random() * 900);
  const part3 = Math.floor(1000 + Math.random() * 9000);
  return `${part1}-${part2}-${part3}`;
}

// 1. Criar Sala (POST /api/rooms)
roomRouter.post('/rooms', (req: Request, res: Response) => {
  try {
    const { customRoomId } = req.body || {};
    let roomId = generateRoomCode();

    if (customRoomId && typeof customRoomId === 'string' && customRoomId.trim().length > 0) {
      const sanitized = customRoomId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 64);
      if (sanitized.length >= 3) {
        roomId = sanitized;
      }
    }

    res.status(201).json({
      success: true,
      roomId,
      wsUrl: config.livekit.wsUrl,
      createdAt: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. Obter Token de Acesso (POST /api/token)
roomRouter.post('/token', async (req: Request, res: Response) => {
  try {
    const { roomId, identity, name, isHost = false } = req.body || {};

    if (!roomId || typeof roomId !== 'string' || roomId.trim().length < 3) {
      return res.status(400).json({
        success: false,
        error: 'roomId é obrigatório e deve ter no mínimo 3 caracteres.',
      });
    }

    if (!identity || typeof identity !== 'string' || identity.trim().length < 1) {
      return res.status(400).json({
        success: false,
        error: 'identity é obrigatório.',
      });
    }

    // Sanitização de entradas
    const cleanRoomId = roomId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 64);
    const cleanIdentity = identity.trim().slice(0, 64);
    const cleanName = typeof name === 'string' && name.trim().length > 0
      ? name.trim().slice(0, 64)
      : cleanIdentity;

    const token = await livekitService.generateToken({
      roomId: cleanRoomId,
      identity: cleanIdentity,
      name: cleanName,
      isHost: Boolean(isHost),
    });

    res.json({
      success: true,
      token,
      wsUrl: config.livekit.wsUrl,
      roomId: cleanRoomId,
      identity: cleanIdentity,
      name: cleanName,
      isHost: Boolean(isHost),
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Listar Participantes da Sala (GET /api/rooms/:roomId/participants)
roomRouter.get('/rooms/:roomId/participants', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const cleanRoomId = roomId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');
    const participants = await livekitService.listParticipants(cleanRoomId);
    res.json({ success: true, roomId: cleanRoomId, participants });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. Encerrar Reunião (DELETE /api/rooms/:roomId) - Protegido contra BOLA (Broken Object Level Authorization)
roomRouter.delete('/rooms/:roomId', async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;
    const cleanRoomId = roomId.trim().toLowerCase().replace(/[^a-z0-9_-]/g, '');

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Autorização necessária para encerrar a reunião.',
      });
    }

    const token = authHeader.split(' ')[1];
    const claims = await livekitService.verifyToken(token);

    if (!claims || !claims.video) {
      return res.status(403).json({
        success: false,
        error: 'Token inválido ou expirado.',
      });
    }

    const hasAdminAccess = claims.video.roomAdmin === true && claims.video.room === cleanRoomId;
    if (!hasAdminAccess) {
      return res.status(403).json({
        success: false,
        error: 'Apenas o anfitrião autenticado desta sala tem permissão para encerrá-la.',
      });
    }

    await livekitService.deleteRoom(cleanRoomId);
    res.json({
      success: true,
      message: `Reunião ${cleanRoomId} encerrada com sucesso pelo anfitrião.`,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
