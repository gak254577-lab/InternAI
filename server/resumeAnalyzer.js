import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mammoth from 'mammoth';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

function getFreshApiKey() {
  for (const filename of ['.env.local', '.env']) {
    try {
      const fullPath = path.resolve(process.cwd(), filename);
      if (fs.existsSync(fullPath)) {
        const parsed = dotenv.parse(fs.readFileSync(fullPath, 'utf8'));
        const key = parsed.GEMINI_API_KEY || parsed.VITE_GEMINI_API_KEY;
        if (key && !key.startsWith('your_') && !key.includes('placeholder')) {
          return key.trim();
        }
      }
    } catch (_) {}
  }
  return process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
}

let pdfParse = null;
try {
  const require = createRequire(import.meta.url);
  pdfParse = require('pdf-parse');
} catch (e) {
  console.warn('[resumeAnalyzer] pdf-parse unavailable, falling back to native Gemini PDF reader');
}

/**
 * Extract raw text from an uploaded file buffer based on MIME type or extension.
 * Supports PDF, DOCX, and TXT.
 *
 * @param {Buffer} buffer - File buffer
 * @param {string} originalname - Original file name
 * @param {string} mimetype - File MIME type
 * @returns {Promise<string>} Extracted text
 */
export async function extractResumeText(buffer, originalname = '', mimetype = '') {
  const ext = originalname.split('.').pop().toLowerCase();

  // 1. Plain Text (.txt)
  if (mimetype === 'text/plain' || ext === 'txt') {
    return buffer.toString('utf-8');
  }

  // 2. Microsoft Word (.docx)
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return (result.value || '').trim();
  }

  // 3. PDF (.pdf)
  if (mimetype === 'application/pdf' || ext === 'pdf') {
    try {
      if (typeof pdfParse === 'function') {
        const data = await pdfParse(buffer);
        const text = (data.text || '').trim();
        if (text.length >= 30) return text;
      } else if (pdfParse?.PDFParse) {
        const parser = new pdfParse.PDFParse({ data: buffer });
        const result = await parser.getText();
        if (typeof parser.destroy === 'function') {
          await parser.destroy();
        }
        const text = (result?.text || '').trim();
        if (text.length >= 30) return text;
      } else if (typeof pdfParse?.default === 'function') {
        const data = await pdfParse.default(buffer);
        const text = (data.text || '').trim();
        if (text.length >= 30) return text;
      }
    } catch (pdfErr) {
      console.warn('[resumeAnalyzer] Local PDF parser notice (falling back to Gemini native PDF reader):', pdfErr.message);
    }
    // Return empty so analyzeResumeWithGemini will send the PDF buffer directly to Gemini
    return '';
  }

  // Fallback: try utf-8 string
  return buffer.toString('utf-8');
}

/**
 * Deterministically calculates the ATS score from the 7 weighted components:
 * - Keywords: 30%
 * - Job Match: 25%
 * - Structure: 15%
 * - Skills: 10%
 * - Projects: 10%
 * - Education: 5%
 * - Formatting: 5%
 * Total: 100%
 */
export function calculateATSScore(breakdown) {
  const clamp = (val) => Math.max(0, Math.min(100, Number(val) || 0));

  const keywordsScore = clamp(breakdown?.keywords?.score);
  const jobMatchScore = clamp(breakdown?.jobMatch?.score);
  const structureScore = clamp(breakdown?.structure?.score);
  const skillsScore = clamp(breakdown?.skills?.score);
  const projectsScore = clamp(breakdown?.projects?.score);
  const educationScore = clamp(breakdown?.education?.score);
  const formattingScore = clamp(breakdown?.formatting?.score);

  const calculated = Math.round(
    keywordsScore * 0.30 +
    jobMatchScore * 0.25 +
    structureScore * 0.15 +
    skillsScore * 0.10 +
    projectsScore * 0.10 +
    educationScore * 0.05 +
    formattingScore * 0.05
  );

  return Math.max(10, Math.min(100, calculated));
}

/**
 * Analyzes resume text using Gemini 2.5 Flash and returns structured ATS analysis.
 *
 * @param {string} resumeText - Extracted text from candidate's resume
 * @param {string[]} [targetRoles=[]] - Candidate's target internship roles
 * @param {Buffer} [fileBuffer=null] - Optional raw file buffer for multimodal PDF analysis
 * @param {string} [mimeType=''] - Optional MIME type of the uploaded file
 * @returns {Promise<object>} Structured analysis result
 */
export async function analyzeResumeWithGemini(
  resumeText = '',
  targetRoles = [],
  fileBuffer = null,
  mimeType = ''
) {
  const apiKey = getFreshApiKey();
  if (!apiKey) {
    throw new Error(
      'GEMINI_API_KEY is not configured on the server. Please add GEMINI_API_KEY to your Vercel Environment Variables.'
    );
  }

  const cleanedText = (resumeText || '').trim();
  const isPdf =
    mimeType === 'application/pdf' ||
    (fileBuffer && fileBuffer.length > 4 && fileBuffer.slice(0, 4).toString() === '%PDF');

  if (cleanedText.length < 50 && (!fileBuffer || !isPdf)) {
    throw new Error(
      'The uploaded document contains too little readable text to analyze. Please ensure your resume is not empty or corrupted.'
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey, { apiVersion: 'v1' });

  const modelsToTry = [
    'gemini-2.5-flash',
    'gemini-3.5-flash',
    'gemini-2.5-flash-lite',
  ];

  const targetRoleStr =
    targetRoles && targetRoles.length > 0
      ? targetRoles.join(', ')
      : 'Software Engineering / Tech Intern';

  const prompt = `
You are an ATS and career-advisory assistant analyzing a student's resume for an internship application platform.

${
  cleanedText.length >= 50
    ? `Resume text (raw extracted text from document):
"""
${cleanedText.slice(0, 10000)}
"""`
    : `Please read and analyze the attached resume document directly.`
}

Target internship:
- Role: ${targetRoleStr}

Your task: extract structured information from this resume, perform a 7-factor ATS evaluation with calibrated scoring, detect contact links, and provide specific improvement feedback.

Strict Rules:
1. Only extract what is actually present in the text — never invent skills, projects, or experience the resume doesn't mention.
2. "summary" must be a factual, neutral 2-3 sentence recap of the candidate's background (education + top skills + focus area) — descriptive, not evaluative.
3. Detect technical keywords/skills even if not under a "Skills" heading (e.g. mentioned inside project descriptions).
4. "missingInformation" should only flag genuinely absent standard resume elements (e.g. no contact info, no education section, no dates, no GitHub profile) — not stylistic opinions.
5. "improvements" should be specific and actionable, referencing what's actually in the resume (e.g. "Your 'Library Management System' project has no mention of the tech stack used" — not generic advice like "add more detail").
6. "recommendations": provide 3 to 5 realistic, high-impact bullet point rewrites directly referencing content from the resume.
7. "contactInfoDetected": accurately flag boolean presence of email, phone, linkedin, and github in the resume text.
8. If target role is provided, include a "matchAgainstRole" section comparing resume content to requirements.
9. Keep tone constructive — this is shown directly to a student, not a recruiter.
10. Calibrated Scoring:
    - Fresh student resume with few projects/skills: 45-65
    - Solid resume with 2-3 projects and good skills: 70-84
    - Exceptional ATS-optimized resume: 85-95

Return ONLY valid JSON, no markdown formatting, no commentary, in exactly this shape:
{
  "summary": "<Factual, neutral 2-3 sentence recap of candidate background>",
  "candidateInfo": {
    "name": "<Extracted candidate name or 'Candidate'>",
    "targetRole": "${targetRoleStr}",
    "experienceLevel": "<Student | Entry-level | Experienced>",
    "educationSummary": "<Degree, Major, College/University if mentioned>"
  },
  "contactInfoDetected": {
    "email": false,
    "phone": false,
    "linkedin": false,
    "github": false
  },
  "scoreBreakdown": {
    "keywords": {
      "score": 0,
      "feedback": "<Specific feedback on relevant technical keywords, industry terms, and density>"
    },
    "jobMatch": {
      "score": 0,
      "feedback": "<Feedback on how well the resume aligns with target role expectations>"
    },
    "structure": {
      "score": 0,
      "feedback": "<Feedback on section headers, logical flow (Contact, Education, Skills, Projects, Experience)>"
    },
    "skills": {
      "score": 0,
      "feedback": "<Feedback on technical skills variety, modern frameworks, tools, and languages>"
    },
    "projects": {
      "score": 0,
      "feedback": "<Feedback on project descriptions, complexity, and quantified impact>"
    },
    "education": {
      "score": 0,
      "feedback": "<Feedback on academic details, degree, graduation year, and coursework/CGPA if listed>"
    },
    "formatting": {
      "score": 0,
      "feedback": "<Feedback on ATS-friendly formatting, bullet point consistency, and clean layout>"
    }
  },
  "parsedData": {
    "extractedSkills": ["<skill1>", "<skill2>"],
    "missingKeywordsForTargetRole": ["<keyword1>", "<keyword2>"]
  },
  "extractedEducation": [
    { "degree": "<degree>", "institution": "<college/institution>", "year": "<year>" }
  ],
  "extractedProjects": [
    { "title": "<project title>", "description": "<description>", "techStack": ["<tech1>", "<tech2>"] }
  ],
  "extractedCertifications": ["<certification>"],
  "missingInformation": ["<genuinely missing standard resume element>"],
  "improvements": ["<actionable improvement referencing actual resume text>"],
  "recommendations": [
    {
      "title": "<Concise recommendation title>",
      "category": "<Keywords | Projects | Formatting | Skills | Structure>",
      "impact": "<High Impact | Medium Impact | Low Impact>",
      "current": "<Current weak line or missing aspect from resume>",
      "suggested": "<High-impact rewrite with strong action verbs and quantified metrics>"
    }
  ],
  "matchAgainstRole": {
    "matchedRequirements": ["<requirement from role found in resume>"],
    "missingRequirements": ["<requirement from role missing in resume>"],
    "matchPercentage": 0
  }
}
`;

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[resumeAnalyzer] Attempting analysis with model: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0,
        },
      });

      const payload =
        isPdf && fileBuffer
          ? [
              {
                inlineData: {
                  data: fileBuffer.toString('base64'),
                  mimeType: 'application/pdf',
                },
              },
              prompt,
            ]
          : prompt;

      const result = await model.generateContent(payload);
      const responseText = result.response.text();

      const parsed = JSON.parse(responseText);

      // Calculate overall ATS score using the required weights:
      // Keywords 30%, Job Match 25%, Structure 15%, Skills 10%, Projects 10%, Education 5%, Formatting 5%
      const calculatedScore = calculateATSScore(parsed.scoreBreakdown);

      // Attach weights to score breakdown for UI rendering
      const scoreBreakdownWithWeights = {
        keywords: { ...parsed.scoreBreakdown?.keywords, weight: 30 },
        jobMatch: { ...parsed.scoreBreakdown?.jobMatch, weight: 25 },
        structure: { ...parsed.scoreBreakdown?.structure, weight: 15 },
        skills: { ...parsed.scoreBreakdown?.skills, weight: 10 },
        projects: { ...parsed.scoreBreakdown?.projects, weight: 10 },
        education: { ...parsed.scoreBreakdown?.education, weight: 5 },
        formatting: { ...parsed.scoreBreakdown?.formatting, weight: 5 },
      };

      console.log(`[resumeAnalyzer] ✅ Analysis successfully completed with model: ${modelName}`);

      return {
        atsScore: calculatedScore,
        atsScoreReason: parsed.summary || 'ATS evaluation completed based on 7-factor weighted analysis.',
        candidateInfo: parsed.candidateInfo || {},
        scoreBreakdown: scoreBreakdownWithWeights,
        parsedData: {
          extractedSkills: parsed.parsedData?.extractedSkills || parsed.extractedSkills || [],
          missingKeywordsForTargetRole: parsed.parsedData?.missingKeywordsForTargetRole || [],
        },
        contactInfoDetected: parsed.contactInfoDetected || {
          email: false,
          phone: false,
          linkedin: false,
          github: false,
        },
        extractedEducation: parsed.extractedEducation || [],
        extractedProjects: parsed.extractedProjects || [],
        extractedCertifications: parsed.extractedCertifications || [],
        missingInformation: parsed.missingInformation || [],
        improvements: parsed.improvements || [],
        recommendations: parsed.recommendations || [],
        matchAgainstRole: parsed.matchAgainstRole || null,
      };
    } catch (err) {
      console.warn(`[resumeAnalyzer] Model ${modelName} returned error: ${err.message}`);
      lastError = err;

      // If 503 (high demand), 500, 404, or 429 occurs, try the next model
      const isRetryable =
        err.status === 503 ||
        err.status === 500 ||
        err.status === 404 ||
        err.status === 429 ||
        err.message?.includes('503') ||
        err.message?.includes('Service Unavailable') ||
        err.message?.includes('high demand') ||
        err.message?.includes('not found') ||
        err.message?.includes('no longer available') ||
        err.message?.includes('RESOURCE_EXHAUSTED') ||
        err.message?.includes('429');

      if (isRetryable) {
        // Small delay to allow spikes to settle
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }

      // For any other unexpected error, attempt next model before giving up
      continue;
    }
  }

  const isHighDemand =
    lastError?.message?.includes('503') ||
    lastError?.message?.includes('high demand') ||
    lastError?.status === 503;

  const isQuota =
    lastError?.message?.includes('429') ||
    lastError?.message?.includes('RESOURCE_EXHAUSTED') ||
    lastError?.status === 429;

  const friendlyMsg = isHighDemand
    ? 'Google Gemini servers are experiencing temporary high demand. Please try uploading again in a few seconds.'
    : isQuota
    ? 'Gemini API rate limit exceeded (HTTP 429). Please wait 30 seconds and try again.'
    : (lastError?.message || 'Failed to analyze resume. Please try again.');

  const finalErr = new Error(friendlyMsg);
  finalErr.status = lastError?.status || 500;
  throw finalErr;
}
