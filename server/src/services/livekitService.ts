import { AccessToken, RoomServiceClient, TokenVerifier } from 'livekit-server-sdk';
import { config } from '../config.js';

export interface CreateTokenParams {
  roomId: string;
  identity: string;
  name?: string;
  isHost?: boolean;
}

export class LiveKitService {
  private roomService: RoomServiceClient;
  private tokenVerifier: TokenVerifier;

  constructor() {
    const httpUrl = config.livekit.wsUrl.replace(/^ws/, 'http');
    this.roomService = new RoomServiceClient(
      httpUrl,
      config.livekit.apiKey,
      config.livekit.apiSecret
    );
    this.tokenVerifier = new TokenVerifier(
      config.livekit.apiKey,
      config.livekit.apiSecret
    );
  }

  async generateToken(params: CreateTokenParams): Promise<string> {
    const { roomId, identity, name, isHost = false } = params;

    const token = new AccessToken(config.livekit.apiKey, config.livekit.apiSecret, {
      identity,
      name: name || identity,
      ttl: '4h',
    });

    token.addGrant({
      roomJoin: true,
      room: roomId,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: isHost,
      roomRecord: isHost,
    });

    return await token.toJwt();
  }

  async verifyToken(token: string) {
    try {
      return await this.tokenVerifier.verify(token);
    } catch (error) {
      console.warn('[LiveKitService] Token inválido ou expirado:', error);
      return null;
    }
  }

  async listParticipants(roomId: string) {
    try {
      return await this.roomService.listParticipants(roomId);
    } catch (error) {
      console.warn(`[LiveKitService] Sala ${roomId} ainda não ativa ou vazia:`, error);
      return [];
    }
  }

  async deleteRoom(roomId: string) {
    return await this.roomService.deleteRoom(roomId);
  }
}

export const livekitService = new LiveKitService();
