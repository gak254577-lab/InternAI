import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import multer from 'multer'
import { extractResumeText, analyzeResumeWithGemini } from './server/resumeAnalyzer.js'

function resumeAnalyzerPlugin() {
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
  }).single('resume');

  return {
    name: 'resume-analyzer-api',
    configureServer(server) {
      server.middlewares.use('/api/analyze-resume', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        upload(req, res, async (err) => {
          if (err) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message || 'File upload error' }));
            return;
          }

          if (!req.file) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'No resume file uploaded. Please select a file.' }));
            return;
          }

          try {
            // 1. Text extraction using suitable PDF/DOCX/TXT libraries
            const resumeText = await extractResumeText(
              req.file.buffer,
              req.file.originalname,
              req.file.mimetype
            );

            // 2. Parse target roles if provided
            let targetRoles = [];
            if (req.body?.targetRoles) {
              try {
                targetRoles = typeof req.body.targetRoles === 'string'
                  ? JSON.parse(req.body.targetRoles)
                  : req.body.targetRoles;
              } catch {
                targetRoles = [String(req.body.targetRoles)];
              }
            }

            // 3. Gemini Flash analysis & ATS score calculation
            const analysis = await analyzeResumeWithGemini(resumeText, targetRoles);

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              success: true,
              fileName: req.file.originalname,
              fileSize: req.file.size,
              ...analysis
            }));
          } catch (analysisErr) {
            console.error('[API /api/analyze-resume error]:', analysisErr);
            const status = analysisErr.status || 500;
            res.statusCode = status;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              error: analysisErr.message || 'Failed to analyze resume'
            }));
          }
        });
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), resumeAnalyzerPlugin()],
  server: {
    proxy: {
      // Proxy /api/adzuna/* → https://api.adzuna.com/v1/api/*
      // This bypasses CORS — the browser calls localhost, Vite forwards to Adzuna
      '/api/adzuna': {
        target: 'https://api.adzuna.com/v1/api',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/adzuna/, ''),
        secure: true,
      },
    },
  },
})

