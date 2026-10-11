/**
 * mockInterviewService.js (Client-side)
 *
 * Communicates with the secure backend mock interview endpoints.
 * GEMINI_API_KEY is kept strictly on the backend.
 *
 * Endpoints:
 *   POST /api/mock-interview/generate-question
 *   POST /api/mock-interview/evaluate-answer
 *   POST /api/mock-interview/final-report
 */

const BASE = '/api/mock-interview';

async function postJSON(endpoint, body) {
  const res = await fetch(`${BASE}/${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed with status ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return data;
}

/**
 * Generate the next interview question.
 *
 * @param {object} ctx - { application, userProfile, previousQuestions, currentAnswers,
 *                         questionNumber, totalQuestions, difficulty, lastEvaluation }
 * @returns {Promise<{question, category, difficulty, reason, skill}>}
 */
export async function generateQuestion(ctx) {
  return postJSON('generate-question', ctx);
}

/**
 * Evaluate a student's answer.
 *
 * @param {object} ctx - { question, answer, category, application, userProfile }
 * @returns {Promise<{score, relevance, technicalAccuracy, clarity, completeness, strengths, improvements, missingPoints, shouldFollowUp, followUpTopic}>}
 */
export async function evaluateAnswer(ctx) {
  return postJSON('evaluate-answer', ctx);
}

/**
 * Generate the final interview report.
 *
 * @param {object} ctx - { application, userProfile, questionsAnswered }
 * @returns {Promise<object>}
 */
export async function generateFinalReport(ctx) {
  return postJSON('final-report', ctx);
}
