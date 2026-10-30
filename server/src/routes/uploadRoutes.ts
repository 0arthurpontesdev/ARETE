import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

export const uploadRouter = Router();

// Ensure upload directory exists
const uploadsDir = path.resolve('public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Memory tracking of uploaded files per room for convenience
export interface StoredAttachment {
  id: string;
  name: string;
  url: string;
  sizeBytes: number;
  mimeType: string;
  uploadedAt: string;
  roomId?: string;
  senderId?: string;
  senderName?: string;
}

const roomAttachments: Map<string, StoredAttachment[]> = new Map();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueId = crypto.randomUUID();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 32);
    cb(null, `${uniqueId}-${cleanBase}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
  },
});

uploadRouter.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'Nenhum arquivo enviado.' });
    }

    const { roomId, senderId, senderName } = req.body || {};
    const fileUrl = `/uploads/${req.file.filename}`;
    const attachment: StoredAttachment = {
      id: crypto.randomUUID(),
      name: req.file.originalname,
      url: fileUrl,
      sizeBytes: req.file.size,
      mimeType: req.file.mimetype || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
      roomId: roomId || undefined,
      senderId: senderId || undefined,
      senderName: senderName || undefined,
    };

    if (roomId) {
      const existing = roomAttachments.get(roomId) || [];
      existing.push(attachment);
      roomAttachments.set(roomId, existing);
    }

    res.status(201).json({
      success: true,
      file: attachment,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

uploadRouter.get('/rooms/:roomId/attachments', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const attachments = roomAttachments.get(roomId) || [];
  res.json({ success: true, roomId, attachments });
});
