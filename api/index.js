import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { extractResumeText, analyzeResumeWithGemini } from '../server/resumeAnalyzer.js';
import { generateInterviewQuestion, evaluateAnswer, generateFinalReport } from '../server/mockInterviewer.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configure Multer for file uploads (10 MB max, memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// Health check
app.get(['/api/health', '/health', '/api', '/'], (req, res) => {
  res.json({ status: 'ok', service: 'InternAI Vercel Serverless Backend' });
});

// Resume analysis endpoint
app.post(['/api/analyze-resume', '/analyze-resume'], upload.single('resume'), async (req, res) => {
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
    console.error('[Vercel API] Error analyzing resume:', err);
    const status = err.status || 500;
    res.status(status).json({
      error: err.message || 'Failed to analyze resume.',
    });
  }
});

// Mock interview endpoints
app.post(['/api/mock-interview/generate-question', '/mock-interview/generate-question'], async (req, res) => {
  try {
    const result = await generateInterviewQuestion(req.body || {});
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Vercel API] generate-question error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate interview question.' });
  }
});

app.post(['/api/mock-interview/evaluate-answer', '/mock-interview/evaluate-answer'], async (req, res) => {
  try {
    const result = await evaluateAnswer(req.body || {});
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Vercel API] evaluate-answer error:', err);
    res.status(500).json({ error: err.message || 'Failed to evaluate answer.' });
  }
});

app.post(['/api/mock-interview/final-report', '/mock-interview/final-report'], async (req, res) => {
  try {
    const result = await generateFinalReport(req.body || {});
    res.json({ success: true, ...result });
  } catch (err) {
    console.error('[Vercel API] final-report error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate final report.' });
  }
});

export const config = {
  api: {
    bodyParser: false,
  },
};

export default app;
