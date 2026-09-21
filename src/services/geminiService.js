/**
 * geminiService.js (Client-side)
 *
 * Communicates with the secure backend endpoint `/api/analyze-resume`.
 * GEMINI_API_KEY is kept strictly on the backend for security.
 *
 * Flow:
 * Resume Upload (PDF/DOCX/TXT) -> Backend Text Extraction -> Gemini 2.5 Flash -> Structured ATS Analysis
 */

/**
 * Uploads a resume file (PDF, DOCX, or TXT) to the backend for text extraction
 * and Gemini 2.5 Flash ATS analysis.
 *
 * @param {File} file - Uploaded File object
 * @param {string[]} [targetRoles=[]] - Candidate's target roles
 * @returns {Promise<object>} Structured analysis data from backend
 */
export async function uploadAndAnalyzeResume(file, targetRoles = []) {
  if (!file) {
    throw new Error('Please select a resume file to analyze.');
  }

  const allowedExtensions = ['.pdf', '.docx', '.txt'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();
  if (!allowedExtensions.includes(ext)) {
    throw new Error('Unsupported file format. Please upload a PDF, DOCX, or TXT file.');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size exceeds the 10 MB limit. Please upload a smaller file.');
  }

  const formData = new FormData();
  formData.append('resume', file);
  if (targetRoles && targetRoles.length > 0) {
    formData.append('targetRoles', JSON.stringify(targetRoles));
  }

  const response = await fetch('/api/analyze-resume', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg =
      data.error ||
      (response.status === 429
        ? 'Gemini API quota exceeded. Please wait a moment and try again.'
        : `Analysis failed with status ${response.status}`);
    const err = new Error(errorMsg);
    err.status = response.status;
    throw err;
  }

  return data;
}

/**
 * Backward-compatible helper for analyzing resume.
 * Accepts either a File object or pre-extracted text.
 */
export async function analyzeResumeWithGemini(fileOrText, targetRoles = []) {
  if (fileOrText instanceof File) {
    return uploadAndAnalyzeResume(fileOrText, targetRoles);
  }

  // If text is passed directly, create a text file blob and send
  const blob = new Blob([fileOrText], { type: 'text/plain' });
  const file = new File([blob], 'resume.txt', { type: 'text/plain' });
  return uploadAndAnalyzeResume(file, targetRoles);
}

/**
 * Client-side text preview helper (optional, for instant local preview if needed).
 */
export async function extractTextFromFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result || '');
    reader.onerror = reject;
    reader.readAsText(file);
  });
}
