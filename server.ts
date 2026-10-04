import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import departmentsHandler from './api/faculty/departments.js';
import loginHandler from './api/faculty/login.js';
import studentsHandler from './api/faculty/students.js';
import updateHandler from './api/faculty/update.js';
import deleteHandler from './api/faculty/delete.js';
import exportHandler from './api/faculty/export.js';
import submitHandler from './api/students/submit.js';
import sendHandler from './api/otp/send.js';
import verifyHandler from './api/otp/verify.js';
import statusHandler from './api/status.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
app.use(express.json());
app.all('/api/faculty/departments', (req, res) => { Promise.resolve(departmentsHandler(req, res)).catch(() => res.status(500).json({success:false, message:'An unexpected server error occurred.'})); });
app.all('/api/faculty/login', (req, res) => { Promise.resolve(loginHandler(req, res)).catch(() => res.status(500).json({success:false, message:'An unexpected server error occurred.'})); });
app.all('/api/faculty/students', (req, res) => { Promise.resolve(studentsHandler(req, res)).catch(() => res.status(500).json({success:false, message:'An unexpected server error occurred.'})); });
app.all('/api/faculty/update', (req, res) => { Promise.resolve(updateHandler(req, res)).catch(() => res.status(500).json({success:false, message:'An unexpected server error occurred.'})); });
app.all('/api/faculty/delete', (req, res) => { Promise.resolve(deleteHandler(req, res)).catch(() => res.status(500).json({success:false, message:'An unexpected server error occurred.'})); });
app.all('/api/faculty/export', (req, res) => { Promise.resolve(exportHandler(req, res)).catch(() => res.status(500).json({success:false, message:'An unexpected server error occurred.'})); });
app.all('/api/students/submit', (req, res) => { Promise.resolve(submitHandler(req, res)).catch(() => res.status(500).json({success:false, message:'An unexpected server error occurred.'})); });
app.all('/api/otp/send', (req, res) => { Promise.resolve(sendHandler(req, res)).catch(() => res.status(500).json({success:false, message:'An unexpected server error occurred.'})); });
app.all('/api/otp/verify', (req, res) => { Promise.resolve(verifyHandler(req, res)).catch(() => res.status(500).json({success:false, message:'An unexpected server error occurred.'})); });
app.all('/api/status', (req, res) => { Promise.resolve(statusHandler(req, res)).catch(() => res.status(500).json({success:false, message:'An unexpected server error occurred.'})); });

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on port ${PORT} (${isProduction ? 'production' : 'development'})`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
