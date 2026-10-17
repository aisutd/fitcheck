import 'dotenv/config';
import crypto from 'node:crypto';

import express from 'express';
import multer from 'multer';

import { analyzeWithGemini } from './gemini.js';
import { acceptedImageTypes, isValidImage } from './imageValidation.js';

const app = express();
const port = Number(process.env.PORT ?? 8787);
const model = process.env.GEMINI_MODEL ?? 'gemini-3.8-flash';
const allowedOrigins = new Set(
  (process.env.ALLOWED_ORIGINS ?? 'http://localhost:8081,http://localhost:8086')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
);
const requestWindows = new Map();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 0 },
  fileFilter: (_request, file, callback) => {
    callback(null, acceptedImageTypes.includes(file.mimetype));
  },
});

app.disable('x-powered-by');
app.use((request, response, next) => {
  const origin = request.get('origin');
  if (origin && allowedOrigins.has(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
    response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  }
  if (request.method === 'OPTIONS') return response.sendStatus(origin && allowedOrigins.has(origin) ? 204 : 403);
  if (origin && !allowedOrigins.has(origin)) return response.status(403).json({ error: 'Origin is not allowed.' });
  next();
});

app.use((request, response, next) => {
  const key = request.ip;
  const now = Date.now();
  const active = (requestWindows.get(key) ?? []).filter((timestamp) => now - timestamp < 10 * 60_000);
  if (active.length >= 20) return response.status(429).json({ error: 'Too many analysis requests. Try again later.' });
  active.push(now);
  requestWindows.set(key, active);
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

app.get('/health', (_request, response) => {
  response.json({ ok: true, model, configured: Boolean(process.env.GEMINI_API_KEY) });
});

app.post('/api/bias/analyze', upload.single('image'), async (request, response) => {
  const requestId = crypto.randomUUID();
  try {
    if (!process.env.GEMINI_API_KEY) {
      return response.status(503).json({ error: 'AI analysis is not configured.', requestId });
    }
    if (!request.file) return response.status(400).json({ error: 'A JPG, PNG, or WebP image is required.', requestId });
    if (!isValidImage(request.file.buffer, request.file.mimetype)) {
      return response.status(400).json({ error: 'The uploaded file does not match its image type.', requestId });
    }

    const analysis = await analyzeWithGemini({
      apiKey: process.env.GEMINI_API_KEY,
      imageBuffer: request.file.buffer,
      mimeType: request.file.mimetype,
      model,
    });

    response.json({
      ...analysis,
      analysisId: requestId,
      model,
      analyzedAt: new Date().toISOString(),
      evidenceScope: 'single_image',
    });
  } catch (error) {
    console.error('Bias analysis failed', requestId, error);
    response.status(502).json({ error: 'The AI analysis could not be completed.', requestId });
  }
});

app.use((error, _request, response, _next) => {
  if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
    return response.status(413).json({ error: 'The image must be 8 MB or smaller.' });
  }
  console.error(error);
  response.status(400).json({ error: 'The upload could not be processed.' });
});

app.listen(port, '0.0.0.0', () => {
  console.log(`FitCheck AI API listening on port ${port} with ${model}.`);
});
