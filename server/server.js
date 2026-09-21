import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { extractResumeText, analyzeResumeWithGemini } from './resumeAnalyzer.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Configure Multer for file uploads (10 MB max, memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'InternAI Resume Analyzer Backend' });
});

// Resume analysis endpoint
app.post('/api/analyze-resume', upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No resume file uploaded. Please select a file.' });
  }

  try {
    // 1. Text extraction using suitable PDF/DOCX/TXT libraries
    const resumeText = await extractResumeText(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // 2. Parse target roles
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

    // 3. Gemini 2.5 Flash analysis & ATS score calculation
    const analysis = await analyzeResumeWithGemini(resumeText, targetRoles);

    res.json({
      success: true,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      ...analysis,
    });
  } catch (err) {
    console.error('[server] Error analyzing resume:', err);
    const status = err.status || 500;
    res.status(status).json({
      error: err.message || 'Failed to analyze resume.',
    });
  }
});

// Serve frontend in production
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[InternAI Backend] Server listening on port ${PORT}`);
});
