import multer from 'multer';
import { extractResumeText, analyzeResumeWithGemini } from '../server/resumeAnalyzer.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
}).single('resume');

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    await runMiddleware(req, res, upload);
  } catch (err) {
    console.error('[API analyze-resume] Multer error:', err);
    return res.status(400).json({ error: err.message || 'File upload failed' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'No resume file uploaded. Please select a file.' });
  }

  try {
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

    // 1. Attempt text extraction from file buffer
    const resumeText = await extractResumeText(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );

    // 2. Perform Gemini analysis (with raw buffer fallback for PDFs)
    const analysis = await analyzeResumeWithGemini(
      resumeText,
      targetRoles,
      req.file.buffer,
      req.file.mimetype
    );

    return res.status(200).json({
      success: true,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      ...analysis,
    });
  } catch (err) {
    console.error('[API analyze-resume] Analysis error:', err);
    const status = err.status || 500;
    return res.status(status).json({
      error: err.message || 'Failed to analyze resume.',
    });
  }
}

export const config = {
  api: {
    bodyParser: false,
    maxDuration: 60,
  },
};
