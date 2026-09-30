import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import apiRouter from './routes/api.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp({ clientOrigin, logging = true } = {}) {
  const app = express();

  app.use(cors(clientOrigin ? { origin: clientOrigin.split(',') } : undefined));
  app.use(express.json({ limit: '2mb' }));
  if (logging) app.use(morgan('dev'));

  app.use('/api', apiRouter);
  app.use('/api', (req, res) => res.status(404).json({ success: false, error: 'Not found' }));

  // In production, serve the built React client from the same origin.
  const clientDist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res) => res.sendFile(path.join(clientDist, 'index.html')));
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || (err.name === 'ValidationError' ? 400 : 500);
    if (status >= 500) console.error(err);
    res.status(status).json({ success: false, error: err.message || 'Internal server error' });
  });

  return app;
}
