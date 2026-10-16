import multer from 'multer';
import { extractResumeText, analyzeResumeWithGemini } from '../server/resumeAnalyzer.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
}).single('resume');

function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

function readBody(req) {
  if (req.body && typeof req.body === 'object') return Promise.resolve(req.body);
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

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    let fileBuffer = null;
    let fileName = '';
    let mimeType = '';
    let targetRoles = [];

    const contentType = req.headers['content-type'] || '';

    if (contentType.includes('application/json')) {
      const body = await readBody(req);
      if (!body.fileData) {
        return res.status(400).json({ error: 'No resume file data provided.' });
      }
      fileBuffer = Buffer.from(body.fileData, 'base64');
      fileName = body.fileName || 'resume.pdf';
      mimeType = body.fileType || (fileName.endsWith('.pdf') ? 'application/pdf' : 'text/plain');
      targetRoles = Array.isArray(body.targetRoles) ? body.targetRoles : [];
    } else {
      await runMiddleware(req, res, upload);
      if (!req.file) {
        return res.status(400).json({ error: 'No resume file uploaded. Please select a file.' });
      }
      fileBuffer = req.file.buffer;
      fileName = req.file.originalname;
      mimeType = req.file.mimetype;
      if (req.body?.targetRoles) {
        try {
          targetRoles = typeof req.body.targetRoles === 'string'
            ? JSON.parse(req.body.targetRoles)
            : req.body.targetRoles;
        } catch {
          targetRoles = [String(req.body.targetRoles)];
        }
      }
    }

    const resumeText = await extractResumeText(fileBuffer, fileName, mimeType);
    const analysis = await analyzeResumeWithGemini(resumeText, targetRoles, fileBuffer, mimeType);

    return res.status(200).json({
      success: true,
      fileName,
      fileSize: fileBuffer.length,
      ...analysis,
    });
  } catch (err) {
    console.error('[API analyze-resume error]:', err);
    const status = err.status || 500;
    return res.status(status).json({
      error: err.message || 'Failed to analyze resume.',
    });
  }
}

export const config = {
  maxDuration: 60,
};
