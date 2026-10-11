/**
 * mockInterviewer.js
 * Server-side AI logic for InternAI Mock Interview feature.
 * GEMINI_API_KEY never exposed to the browser.
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';
const MODELS_TO_TRY = ['gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-1.5-flash'];

function safeParseJSON(text) {
  const cleaned = text
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim();
  return JSON.parse(cleaned);
}

async function callGemini(prompt) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY not configured on server.');
  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY, { apiVersion: 'v1' });
  let lastErr;
  for (const modelId of MODELS_TO_TRY) {
    try {
      const model = genAI.getGenerativeModel({ model: modelId });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (err) {
      lastErr = err;
      console.warn('[mockInterviewer] Model', modelId, 'failed:', err.message);
    }
  }
  throw lastErr || new Error('All Gemini model attempts failed.');
}

function buildStudentContext(userProfile) {
  if (!userProfile) return 'Student profile not available.';
  const parts = [];
  if (userProfile.name) parts.push('Name: ' + userProfile.name);
  if (userProfile.college) parts.push('College: ' + userProfile.college);
  if (userProfile.degree) parts.push('Degree: ' + userProfile.degree);
  if (userProfile.year) parts.push('Year: ' + userProfile.year);
  if (userProfile.cgpa) parts.push('CGPA: ' + userProfile.cgpa);
  const skills = userProfile.skills || (userProfile.resumeMetadata && userProfile.resumeMetadata.extractedSkills) || [];
  if (skills.length) parts.push('Skills: ' + skills.join(', '));
  const projects = userProfile.projects || (userProfile.resumeMetadata && userProfile.resumeMetadata.extractedProjects) || [];
  if (projects.length) {
    const projStr = projects
      .map(function(p) { return typeof p === 'string' ? p : ((p.name || p.title || '') + (p.description ? ': ' + p.description : '')); })
      .filter(Boolean)
      .join(' | ');
    if (projStr) parts.push('Projects: ' + projStr);
  }
  const certs = userProfile.certifications || (userProfile.resumeMetadata && userProfile.resumeMetadata.extractedCertifications) || [];
  if (certs.length) {
    const certStr = certs.map(function(c) { return typeof c === 'string' ? c : (c.name || ''); }).filter(Boolean).join(', ');
    if (certStr) parts.push('Certifications: ' + certStr);
  }
  if (userProfile.github) parts.push('GitHub: ' + userProfile.github);
  if (userProfile.linkedin) parts.push('LinkedIn: ' + userProfile.linkedin);
  if (userProfile.bio) parts.push('Bio: ' + userProfile.bio);
  return parts.length ? parts.join('\n') : 'No detailed profile available.';
}

export async function generateInterviewQuestion(ctx) {
  const application = ctx.application || {};
  const userProfile = ctx.userProfile || {};
  const previousQuestions = ctx.previousQuestions || [];
  const currentAnswers = ctx.currentAnswers || [];
  const questionNumber = ctx.questionNumber || 1;
  const totalQuestions = ctx.totalQuestions || 10;
  const difficulty = ctx.difficulty || 'medium';
  const lastEvaluation = ctx.lastEvaluation || null;

  const studentCtx = buildStudentContext(userProfile);
  const prevQList = previousQuestions.length
    ? previousQuestions.map(function(q, i) { return (i + 1) + '. ' + q; }).join('\n')
    : 'None';
  const lastQA = currentAnswers.length > 0
    ? currentAnswers.slice(-2).map(function(qa) { return 'Q: ' + qa.question + '\nA: ' + qa.answer; }).join('\n\n')
    : 'No answers yet.';
  const evalHint = lastEvaluation
    ? 'Last answer score: ' + lastEvaluation.score + '/10. Strengths: ' + (lastEvaluation.strengths || []).join(', ') + '. Needs improvement: ' + (lastEvaluation.improvements || []).join(', ') + '.'
    : '';

  let categoryHint = '';
  if (questionNumber === 1) {
    categoryHint = 'Start with an introduction/ice-breaker (e.g., "Tell me about yourself").';
  } else if (questionNumber === 2) {
    categoryHint = 'Ask about motivation/interest in this specific company and role (HR/behavioral).';
  } else if (questionNumber <= 4) {
    categoryHint = 'Ask a resume-based or project-specific question tailored to the student background.';
  } else if (questionNumber <= 7) {
    categoryHint = 'Ask a technical question relevant to the required skills for this role.';
  } else if (questionNumber === 8) {
    categoryHint = 'Ask a problem-solving or situational question.';
  } else {
    categoryHint = 'Ask a role-specific or behavioral/communication question.';
  }

  const prompt = [
    'You are an experienced professional interviewer at ' + (application.company || 'a top company') + ' conducting a realistic internship interview.',
    '',
    '== INTERNSHIP DETAILS ==',
    'Company: ' + (application.company || 'N/A'),
    'Position: ' + (application.role || application.position || 'N/A'),
    'Location: ' + (application.location || 'N/A'),
    'Job Description / Notes: ' + (application.notes || application.jobDescription || application.description || 'Standard internship role'),
    'Required Skills: ' + (application.requiredSkills || application.skills || 'As applicable to role'),
    'Application Status: ' + (application.column || application.status || 'Applied'),
    '',
    '== STUDENT PROFILE ==',
    studentCtx,
    '',
    '== QUESTIONS ALREADY ASKED (DO NOT repeat or paraphrase) ==',
    prevQList,
    '',
    '== LAST 2 Q&A PAIRS ==',
    lastQA,
    evalHint ? '\n== PERFORMANCE CONTEXT ==\n' + evalHint : '',
    '',
    '== INSTRUCTIONS ==',
    'This is question ' + questionNumber + ' of ' + totalQuestions + '.',
    'Current difficulty: ' + difficulty,
    categoryHint,
    'Generate exactly ONE personalized question for THIS student and THIS internship.',
    'Use the student\'s actual skills, projects, and background.',
    'If the last answer mentioned something interesting, consider a follow-up.',
    'Do NOT ask multiple questions. Do NOT repeat any previous question.',
    'Do NOT reveal the evaluation criteria.',
    'Adjust difficulty: if last score < 5, make it slightly easier; if > 8, make it harder.',
    '',
    'Return ONLY valid JSON (no markdown):',
    '{',
    '  "question": "<The exact interview question — one question only>",',
    '  "category": "<introduction|hr_behavioral|resume_based|project_based|technical|job_specific|problem_solving|situational|communication|role_specific|follow_up>",',
    '  "difficulty": "<easy|medium|hard>",',
    '  "reason": "<1 sentence why this question is relevant for this student and role>",',
    '  "skill": "<primary skill/topic assessed, or empty string>"',
    '}'
  ].join('\n');

  const raw = await callGemini(prompt);
  const parsed = safeParseJSON(raw);
  if (!parsed.question || typeof parsed.question !== 'string') {
    throw new Error('AI returned invalid question format.');
  }
  return {
    question: parsed.question.trim(),
    category: parsed.category || 'technical',
    difficulty: parsed.difficulty || difficulty,
    reason: parsed.reason || '',
    skill: parsed.skill || '',
  };
}

export async function evaluateAnswer(ctx) {
  const question = ctx.question || '';
  const answer = ctx.answer || '';
  const category = ctx.category || 'technical';
  const application = ctx.application || {};
  const userProfile = ctx.userProfile || {};

  const studentCtx = buildStudentContext(userProfile);
  const isTechnical = ['technical', 'problem_solving', 'job_specific', 'role_specific'].includes(category);
  const technicalPlaceholder = isTechnical ? '7' : 'null';

  const prompt = [
    'You are an expert interviewer evaluating a student interview answer.',
    '',
    '== INTERNSHIP CONTEXT ==',
    'Company: ' + (application.company || 'N/A'),
    'Position: ' + (application.role || application.position || 'N/A'),
    'Required Skills: ' + (application.requiredSkills || application.skills || 'As applicable to role'),
    '',
    '== STUDENT PROFILE ==',
    studentCtx,
    '',
    '== QUESTION ==',
    'Category: ' + category,
    'Question: "' + question + '"',
    '',
    '== STUDENT\'S ANSWER ==',
    '"' + answer + '"',
    '',
    '== EVALUATION INSTRUCTIONS ==',
    '1. Score each dimension from 0-10.',
    '2. For intro/behavioral questions, technicalAccuracy should be null or low.',
    '3. "strengths": 2-3 specific positives from THIS answer.',
    '4. "improvements": 2-3 specific actionable improvements.',
    '5. "missingPoints": key points NOT mentioned.',
    '6. "shouldFollowUp": true if answer introduced an interesting topic.',
    '7. Be honest — students need accurate feedback.',
    '',
    'Return ONLY valid JSON:',
    '{',
    '  "score": 7,',
    '  "relevance": 8,',
    '  "technicalAccuracy": ' + technicalPlaceholder + ',',
    '  "clarity": 7,',
    '  "completeness": 6,',
    '  "strengths": ["<strength 1>", "<strength 2>"],',
    '  "improvements": ["<improvement 1>", "<improvement 2>"],',
    '  "missingPoints": ["<missing point>"],',
    '  "shouldFollowUp": false,',
    '  "followUpTopic": ""',
    '}'
  ].join('\n');

  const raw = await callGemini(prompt);
  let parsed;
  try {
    parsed = safeParseJSON(raw);
  } catch {
    return {
      score: 5, relevance: 5, technicalAccuracy: isTechnical ? 5 : null,
      clarity: 5, completeness: 5,
      strengths: ['Answer submitted'],
      improvements: ['Could not evaluate automatically'],
      missingPoints: [], shouldFollowUp: false, followUpTopic: '',
    };
  }
  return {
    score: Number(parsed.score) || 5,
    relevance: Number(parsed.relevance) || 5,
    technicalAccuracy: (parsed.technicalAccuracy !== null && parsed.technicalAccuracy !== undefined)
      ? Number(parsed.technicalAccuracy) : null,
    clarity: Number(parsed.clarity) || 5,
    completeness: Number(parsed.completeness) || 5,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
    missingPoints: Array.isArray(parsed.missingPoints) ? parsed.missingPoints : [],
    shouldFollowUp: Boolean(parsed.shouldFollowUp),
    followUpTopic: parsed.followUpTopic || '',
  };
}

export async function generateFinalReport(ctx) {
  const application = ctx.application || {};
  const userProfile = ctx.userProfile || {};
  const questionsAnswered = ctx.questionsAnswered || [];

  const studentCtx = buildStudentContext(userProfile);
  const qaStr = questionsAnswered.map(function(qa, i) {
    const score = qa.evaluation && qa.evaluation.score != null ? qa.evaluation.score : 'N/A';
    return 'Q' + (i + 1) + ' [' + (qa.category || 'general') + ']: ' + qa.question + '\nAnswer: ' + qa.answer + '\nScore: ' + score + '/10';
  }).join('\n\n');

  const avgScore = questionsAnswered.length > 0
    ? Math.round(
        questionsAnswered.reduce(function(sum, qa) { return sum + ((qa.evaluation && qa.evaluation.score) || 0); }, 0)
        / questionsAnswered.length * 10
      )
    : 50;

  const prompt = [
    'You are generating a final interview performance report for a student.',
    '',
    '== INTERNSHIP ==',
    'Company: ' + (application.company || 'N/A'),
    'Position: ' + (application.role || application.position || 'N/A'),
    '',
    '== STUDENT ==',
    studentCtx,
    '',
    '== INTERVIEW Q&A WITH SCORES ==',
    qaStr,
    '',
    '== TASK ==',
    'Generate a detailed, personalized final report. Reference actual questions and answers.',
    '',
    'Return ONLY valid JSON (no markdown):',
    '{',
    '  "overallScore": <0-100>,',
    '  "communication": <0-100>,',
    '  "technicalKnowledge": <0-100>,',
    '  "relevance": <0-100>,',
    '  "problemSolving": <0-100>,',
    '  "clarity": <0-100>,',
    '  "completeness": <0-100>,',
    '  "strengths": ["<specific strength>", "..."],',
    '  "areasToImprove": ["<specific actionable advice>", "..."],',
    '  "weakQuestions": [{"question": "<q>", "issue": "<issue>", "modelAnswer": "<model answer>"}],',
    '  "recommendedTopics": ["<topic to study>", "..."],',
    '  "overallFeedback": "<2-3 paragraph personalized assessment>"',
    '}'
  ].join('\n');

  const raw = await callGemini(prompt);
  let parsed;
  try {
    parsed = safeParseJSON(raw);
  } catch {
    return {
      overallScore: avgScore, communication: 60, technicalKnowledge: 60,
      relevance: 60, problemSolving: 60, clarity: 60, completeness: 60,
      strengths: ['Completed the full interview session'],
      areasToImprove: ['Review the question feedback above'],
      weakQuestions: [], recommendedTopics: ['Continue practicing'],
      overallFeedback: 'Good effort completing the interview session.',
    };
  }
  return {
    overallScore: Number(parsed.overallScore) || avgScore,
    communication: Number(parsed.communication) || 60,
    technicalKnowledge: Number(parsed.technicalKnowledge) || 60,
    relevance: Number(parsed.relevance) || 60,
    problemSolving: Number(parsed.problemSolving) || 60,
    clarity: Number(parsed.clarity) || 60,
    completeness: Number(parsed.completeness) || 60,
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    areasToImprove: Array.isArray(parsed.areasToImprove) ? parsed.areasToImprove : [],
    weakQuestions: Array.isArray(parsed.weakQuestions) ? parsed.weakQuestions : [],
    recommendedTopics: Array.isArray(parsed.recommendedTopics) ? parsed.recommendedTopics : [],
    overallFeedback: parsed.overallFeedback || '',
  };
}
