import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { extractResumeText, analyzeResumeWithGemini } from './resumeAnalyzer.js';
import { generateInterviewQuestion, evaluateAnswer, generateFinalReport } from './mockInterviewer.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Configure Multer for file uploads (10 MB max, memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'InternAI Backend' });
});

// Resume analysis endpoint
app.post('/api/analyze-resume', upload.single('resume'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No resume file uploaded. Please select a file.' });
  }

  try {
    const resumeText = await extractResumeText(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

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

// ── Mock Interview API Endpoints ──────────────────────────────────────────────

/**
 * POST /api/mock-interview/generate-question
 * Body: { application, userProfile, previousQuestions, currentAnswers, questionNumber, totalQuestions, difficulty, lastEvaluation }
 */
app.post('/api/mock-interview/generate-question', async (req, res) => {
  try {
    const result = await generateInterviewQuestion(req.body || {});
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[server] generate-question error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate interview question.' });
  }
});

/**
 * POST /api/mock-interview/evaluate-answer
 * Body: { question, answer, category, application, userProfile }
 */
app.post('/api/mock-interview/evaluate-answer', async (req, res) => {
  try {
    const result = await evaluateAnswer(req.body || {});
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[server] evaluate-answer error:', err);
    res.status(500).json({ error: err.message || 'Failed to evaluate answer.' });
  }
});

/**
 * POST /api/mock-interview/final-report
 * Body: { application, userProfile, questionsAnswered }
 */
app.post('/api/mock-interview/final-report', async (req, res) => {
  try {
    const result = await generateFinalReport(req.body || {});
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[server] final-report error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate final report.' });
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
