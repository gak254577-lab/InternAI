import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import multer from 'multer'
import { extractResumeText, analyzeResumeWithGemini } from './server/resumeAnalyzer.js'
import { generateInterviewQuestion, evaluateAnswer, generateFinalReport } from './server/mockInterviewer.js'

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

/**
 * Mock Interview API plugin — adds three secure JSON endpoints:
 *   POST /api/mock-interview/generate-question
 *   POST /api/mock-interview/evaluate-answer
 *   POST /api/mock-interview/final-report
 *
 * Gemini API key stays server-side only.
 */
function mockInterviewPlugin() {
  function readBody(req) {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', (chunk) => { data += chunk; });
      req.on('end', () => {
        try { resolve(JSON.parse(data || '{}')); }
        catch { resolve({}); }
      });
      req.on('error', reject);
    });
  }

  function jsonResponse(res, statusCode, payload) {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
  }

  return {
    name: 'mock-interview-api',
    configureServer(server) {
      server.middlewares.use('/api/mock-interview', async (req, res) => {
        const url = req.url || '';

        if (req.method !== 'POST') {
          return jsonResponse(res, 405, { error: 'Method Not Allowed' });
        }

        try {
          const body = await readBody(req);

          if (url.includes('generate-question')) {
            const result = await generateInterviewQuestion(body);
            return jsonResponse(res, 200, { success: true, ...result });
          }

          if (url.includes('evaluate-answer')) {
            const result = await evaluateAnswer(body);
            return jsonResponse(res, 200, { success: true, ...result });
          }

          if (url.includes('final-report')) {
            const result = await generateFinalReport(body);
            return jsonResponse(res, 200, { success: true, ...result });
          }

          return jsonResponse(res, 404, { error: 'Unknown mock-interview endpoint' });
        } catch (err) {
          console.error('[API /api/mock-interview error]:', err);
          return jsonResponse(res, 500, { error: err.message || 'Mock interview API error' });
        }
      });
    }
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), resumeAnalyzerPlugin(), mockInterviewPlugin()],
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
