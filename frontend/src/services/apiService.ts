const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:4000';

export interface CreateRoomResponse {
  success: boolean;
  roomId: string;
  wsUrl: string;
}

export interface GetTokenResponse {
  success: boolean;
  token: string;
  wsUrl: string;
  roomId: string;
  identity: string;
  name: string;
  isHost: boolean;
}

export class ApiService {
  static async createRoom(customRoomId?: string): Promise<CreateRoomResponse> {
    const res = await fetch(`${API_URL}/api/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ customRoomId }),
    });
    if (!res.ok) {
      throw new Error(`Falha ao criar sala: ${res.statusText}`);
    }
    return await res.json();
  }

  static async getMeetingToken(params: {
    roomId: string;
    identity: string;
    name: string;
    isHost?: boolean;
  }): Promise<GetTokenResponse> {
    const res = await fetch(`${API_URL}/api/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Erro ao obter token da sala: ${res.statusText}`);
    }
    return await res.json();
  }

  static async endMeeting(roomId: string, hostToken?: string): Promise<void> {
    const headers: Record<string, string> = {};
    if (hostToken) {
      headers['Authorization'] = `Bearer ${hostToken}`;
    }

    const res = await fetch(`${API_URL}/api/rooms/${roomId}`, {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Falha ao encerrar a reunião`);
    }
  }
}
