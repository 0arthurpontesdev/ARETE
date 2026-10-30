import express from 'express';
import cors from 'cors';
import path from 'path';
import { config } from './config.js';
import { roomRouter } from './routes/roomRoutes.js';
import { uploadRouter } from './routes/uploadRoutes.js';

export const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());

// Servir arquivos estáticos de uploads
const uploadsDir = path.resolve('public/uploads');
app.use('/uploads', express.static(uploadsDir));

// Rota de Healthcheck
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'zoom-videoconference-backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    livekitConfig: {
      wsUrl: config.livekit.wsUrl,
      apiKeyConfigured: !!config.livekit.apiKey,
    },
  });
});

// Rotas da API de Salas, Tokens e Uploads
app.use('/api', roomRouter);
app.use('/api', uploadRouter);

// Inicialização do Servidor
if (process.env.NODE_ENV !== 'test') {
  app.listen(config.port, () => {
    console.log(`[Backend] Servidor rodando na porta ${config.port}`);
    console.log(`[Backend] Conexão LiveKit configurada para: ${config.livekit.wsUrl}`);
  });
}
