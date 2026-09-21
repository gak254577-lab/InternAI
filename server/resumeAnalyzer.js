import { createRequire } from 'module';
import { GoogleGenerativeAI } from '@google/generative-ai';
import mammoth from 'mammoth';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

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
        return (data.text || '').trim();
      } else if (pdfParse?.PDFParse) {
        const parser = new pdfParse.PDFParse({ data: buffer });
        const result = await parser.getText();
        if (typeof parser.destroy === 'function') {
          await parser.destroy();
        }
        return (result?.text || '').trim();
      } else if (typeof pdfParse?.default === 'function') {
        const data = await pdfParse.default(buffer);
        return (data.text || '').trim();
      }
    } catch (pdfErr) {
      console.warn('[resumeAnalyzer] PDF extraction error:', pdfErr.message);
      throw new Error(`Failed to extract text from PDF: ${pdfErr.message}`);
    }
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
 * @returns {Promise<object>} Structured analysis result
 */
export async function analyzeResumeWithGemini(resumeText, targetRoles = []) {
  if (!GEMINI_API_KEY) {
    throw new Error(
      'GEMINI_API_KEY is not configured on the server. Please check your .env file.'
    );
  }

  const cleanedText = (resumeText || '').trim();
  if (cleanedText.length < 50) {
    throw new Error(
      'The uploaded document contains too little text to analyze. Please ensure your resume is not an image-only scan and contains readable text.'
    );
  }

  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

  const modelsToTry = [
    'gemini-3.5-flash',
    'gemini-3.8-flash',
    'gemini-3.7-flash',
    'gemini-3.1-flash-lite',
    'gemini-3.6-flash',
    'gemini-2.5-flash',
  ];

  const rolesContext =
    targetRoles && targetRoles.length > 0
      ? `The candidate is targeting these roles: ${targetRoles.join(', ')}.`
      : 'The candidate is a college student / early career developer targeting tech internships (e.g. Software Engineering, Full Stack, Frontend, Backend, AI/ML, Data Science).';

  const prompt = `
You are an expert Applicant Tracking System (ATS) evaluator, technical recruiter, and career mentor specializing in tech internships in India and globally.

${rolesContext}

Evaluate the following candidate resume text and provide a comprehensive ATS score breakdown, candidate skills extraction, missing keywords, and actionable suggestions.

RESUME TEXT:
"""
${cleanedText.slice(0, 10000)}
"""

You MUST respond ONLY with a valid JSON object matching this exact schema:
{
  "summary": "<2-3 sentence executive summary of candidate strengths and ATS readiness>",
  "candidateInfo": {
    "name": "<Extracted candidate name or 'Candidate'>",
    "targetRole": "<Primary detected or targeted role>",
    "experienceLevel": "<Student | Entry-level | Experienced>",
    "educationSummary": "<Degree, Major, College/University if mentioned>"
  },
  "scoreBreakdown": {
    "keywords": {
      "score": <integer 0-100>,
      "feedback": "<Specific feedback on relevant technical keywords, industry terms, and density>"
    },
    "jobMatch": {
      "score": <integer 0-100>,
      "feedback": "<Feedback on how well the resume aligns with student tech internship expectations>"
    },
    "structure": {
      "score": <integer 0-100>,
      "feedback": "<Feedback on section headers, logical flow (Contact, Education, Skills, Projects, Experience)>"
    },
    "skills": {
      "score": <integer 0-100>,
      "feedback": "<Feedback on technical skills variety, modern frameworks, tools, and languages>"
    },
    "projects": {
      "score": <integer 0-100>,
      "feedback": "<Feedback on project descriptions, complexity, and quantified impact (e.g. users, latency, % improvements)>"
    },
    "education": {
      "score": <integer 0-100>,
      "feedback": "<Feedback on academic details, degree, graduation year, and coursework/CGPA if listed>"
    },
    "formatting": {
      "score": <integer 0-100>,
      "feedback": "<Feedback on ATS-friendly formatting, bullet point consistency, and absence of complex tables/graphics>"
    }
  },
  "parsedData": {
    "extractedSkills": [
      "<skill1>", "<skill2>", "<skill3>"
    ],
    "missingKeywordsForTargetRole": [
      "<keyword1>", "<keyword2>", "<keyword3>"
    ]
  },
  "recommendations": [
    {
      "title": "<Concise recommendation title>",
      "category": "<Keywords | Projects | Formatting | Skills | Structure>",
      "impact": "<High Impact | Medium Impact | Low Impact>",
      "current": "<Current weak line or missing aspect from resume>",
      "suggested": "<High-impact rewrite with strong action verbs and quantified metrics>"
    }
  ]
}

Evaluation Criteria:
1. extractedSkills: Extract 10-25 distinct skills found in the resume (programming languages, libraries, frameworks, cloud, databases, developer tools).
2. missingKeywordsForTargetRole: Extract 4-8 essential keywords/technologies for the candidate's target internship roles that are missing from their resume.
3. recommendations: Provide 3 to 5 realistic, high-impact bullet point rewrites directly referencing content from the resume.
4. Scores must be realistic:
   - Fresh student resume with few projects/skills: 45-65
   - Good resume with 2-3 projects and good skills: 70-84
   - Exceptional ATS-optimized resume: 85-95
`;

  let lastError = null;

  for (const modelName of modelsToTry) {
    try {
      console.log(`[resumeAnalyzer] Attempting analysis with model: ${modelName}`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

      const result = await model.generateContent(prompt);
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
          extractedSkills: parsed.parsedData?.extractedSkills || [],
          missingKeywordsForTargetRole: parsed.parsedData?.missingKeywordsForTargetRole || [],
        },
        recommendations: parsed.recommendations || [],
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
