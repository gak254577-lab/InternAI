/**
 * MockInterviewPage.jsx
 *
 * Full AI-powered mock interview connected to My Applications.
 * - Loads application data from selectedApplicationId
 * - Generates personalized questions via Gemini (server-side)
 * - TTS voice question playback (Web Speech API)
 * - STT voice OR text answering
 * - Per-answer evaluation (compact, non-intrusive)
 * - Final performance report
 * - Interview history persisted to localStorage (Firestore-ready)
 * - Zero hardcoded questions or student data
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { generateQuestion, evaluateAnswer, generateFinalReport } from '../services/mockInterviewService';

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_TOTAL_QUESTIONS = 10;
const HISTORY_KEY = 'internai_interview_history';

const CATEGORY_LABELS = {
  introduction: 'Introduction',
  hr_behavioral: 'HR / Behavioral',
  resume_based: 'Resume-Based',
  project_based: 'Project-Based',
  technical: 'Technical',
  job_specific: 'Job-Specific',
  problem_solving: 'Problem Solving',
  situational: 'Situational',
  communication: 'Communication',
  role_specific: 'Role-Specific',
  follow_up: 'Follow-Up',
};

const CATEGORY_COLOR = {
  introduction: 'bg-blue-100 text-blue-800',
  hr_behavioral: 'bg-purple-100 text-purple-800',
  resume_based: 'bg-amber-100 text-amber-800',
  project_based: 'bg-emerald-100 text-emerald-800',
  technical: 'bg-rose-100 text-rose-800',
  job_specific: 'bg-orange-100 text-orange-800',
  problem_solving: 'bg-cyan-100 text-cyan-800',
  situational: 'bg-teal-100 text-teal-800',
  communication: 'bg-lime-100 text-lime-800',
  role_specific: 'bg-indigo-100 text-indigo-800',
  follow_up: 'bg-pink-100 text-pink-800',
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInterviewHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '{}'); }
  catch { return {}; }
}

function saveInterviewHistory(userId, applicationId, record) {
  const history = getInterviewHistory();
  const key = `${userId}_${applicationId}`;
  if (!history[key]) history[key] = [];
  history[key].unshift(record);
  // Keep last 10 attempts per application
  history[key] = history[key].slice(0, 10);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function getPreviousQuestions(userId, applicationId) {
  const history = getInterviewHistory();
  const key = `${userId}_${applicationId}`;
  const attempts = history[key] || [];
  const all = [];
  for (const attempt of attempts) {
    for (const q of attempt.questions || []) {
      if (q && !all.includes(q)) all.push(q);
    }
  }
  return all;
}

function formatTimer(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function ScoreBar({ label, value, max = 100, color = 'bg-secondary' }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-xs font-semibold mb-1">
        <span className="text-on-surface-variant">{label}</span>
        <span className="text-primary font-bold">{value}<span className="text-on-surface-variant font-normal">/{max}</span></span>
      </div>
      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
        <div
          className={`${color} h-full rounded-full transition-all duration-700`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MockInterviewPage() {
  const { applications, selectedApplicationId, setSelectedApplicationId, navigate } = useApp();
  const { currentUser, userProfile } = useAuth();

  // Interview session phases: 'select' | 'setup' | 'active' | 'report'
  const [phase, setPhase] = useState('select');
  const [totalQuestions, setTotalQuestions] = useState(DEFAULT_TOTAL_QUESTIONS);
  // Interview mode: 'basic' | 'live'
  const [interviewMode, setInterviewMode] = useState('basic');
  // FAQ accordion open index
  const [openFaq, setOpenFaq] = useState(null);
  // Active domain tab index for the 5-questions-per-domain section
  const [activeDomain, setActiveDomain] = useState(0);

  // Live Interview domain scroll & focus state
  const [selectedLiveDomain, setSelectedLiveDomain] = useState(null);
  const [liveDomainView, setLiveDomainView] = useState('scroll'); // 'scroll' | 'carousel'
  const [liveDomainFilter, setLiveDomainFilter] = useState('all');
  const [expandedLiveDomain, setExpandedLiveDomain] = useState(null);
  const liveCarouselRef = useRef(null);
  // Faculty selection: { [domainKey]: facultyName }
  const [selectedFaculty, setSelectedFaculty] = useState({});

  // Application being interviewed for
  const [application, setApplication] = useState(null);

  // Session state
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [timer, setTimer] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [currentQ, setCurrentQ] = useState(null); // { question, category, difficulty, reason, skill }
  const [questionsAnswered, setQuestionsAnswered] = useState([]); // [{question, answer, category, evaluation}]
  const [previousQuestions, setPreviousQuestions] = useState([]); // from past sessions
  const [currentDifficulty, setCurrentDifficulty] = useState('medium');
  const [lastEvaluation, setLastEvaluation] = useState(null);

  // UI loading states
  const [isGeneratingQuestion, setIsGeneratingQuestion] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [apiError, setApiError] = useState(null);

  // Answer state
  const [answerMode, setAnswerMode] = useState('text'); // 'text' | 'voice'
  const [userAnswer, setUserAnswer] = useState('');
  const [voiceState, setVoiceState] = useState('idle'); // 'idle'|'listening'|'processing'|'done'
  const [lastAnswerResult, setLastAnswerResult] = useState(null); // mini feedback after submit

  // TTS state
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  const [sttSupported, setSttSupported] = useState(false);

  // Final report
  const [finalReport, setFinalReport] = useState(null);
  const [showWeakQuestion, setShowWeakQuestion] = useState(null);

  // Refs
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);
  const answerBoxRef = useRef(null);
  const dialogueEndRef = useRef(null);

  // ── Check browser capabilities ──────────────────────────────────────────────
  useEffect(() => {
    setTtsSupported('speechSynthesis' in window);
    setSttSupported('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }, []);

  // ── Auto-load application if navigated from My Applications ────────────────
  useEffect(() => {
    if (selectedApplicationId && applications.length > 0) {
      const app = applications.find((a) => a.id === selectedApplicationId);
      if (app) {
        setApplication(app);
        setPhase('setup');
      }
    }
  }, [selectedApplicationId, applications]);

  // ── Timer ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'active' || isPaused) {
      clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => setTimer((t) => t + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, [phase, isPaused]);

  // ── Scroll conversation log ────────────────────────────────────────────────
  useEffect(() => {
    if (dialogueEndRef.current) {
      dialogueEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [questionsAnswered, currentQ]);

  // ── TTS: speak a text string ───────────────────────────────────────────────
  const speakText = useCallback((text) => {
    if (!ttsSupported || !text) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 0.95;
    utt.pitch = 1;
    utt.onstart = () => setIsSpeaking(true);
    utt.onend = () => setIsSpeaking(false);
    utt.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utt);
  }, [ttsSupported]);

  const stopSpeaking = useCallback(() => {
    if (ttsSupported) window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, [ttsSupported]);

  // ── Generate the next question ─────────────────────────────────────────────
  const generateNextQuestion = useCallback(async (qNum, answeredSoFar, prevQs, difficulty, lastEval) => {
    setIsGeneratingQuestion(true);
    setApiError(null);
    setUserAnswer('');
    setLastAnswerResult(null);
    setVoiceState('idle');
    try {
      const allAskedQuestions = [
        ...prevQs,
        ...answeredSoFar.map((qa) => qa.question),
      ];
      const ctx = {
        application: application || {},
        userProfile: {
          ...(userProfile || {}),
          focusDomain: selectedLiveDomain || (userProfile?.interests && userProfile.interests[0]) || null,
        },
        previousQuestions: allAskedQuestions,
        currentAnswers: answeredSoFar.slice(-3).map((qa) => ({ question: qa.question, answer: qa.answer })),
        questionNumber: qNum,
        totalQuestions,
        difficulty,
        lastEvaluation: lastEval,
      };
      const result = await generateQuestion(ctx);
      setCurrentQ(result);
      setIsGeneratingQuestion(false);
      // Auto-speak the question
      setTimeout(() => speakText(result.question), 400);
    } catch (err) {
      setApiError(err.message || 'Failed to generate question. Please check your connection.');
      setIsGeneratingQuestion(false);
    }
  }, [application, userProfile, totalQuestions, speakText]);

  // ── Start interview ────────────────────────────────────────────────────────
  const startInterview = useCallback(async () => {
    if (!application) return;
    const uid = currentUser?.uid || 'local';
    const prevQs = getPreviousQuestions(uid, application.id);
    setPreviousQuestions(prevQs);
    setQuestionsAnswered([]);
    setTimer(0);
    setCurrentDifficulty('medium');
    setLastEvaluation(null);
    setFinalReport(null);
    setPhase('active');
    setQuestionNumber(1);
    await generateNextQuestion(1, [], prevQs, 'medium', null);
  }, [application, currentUser, generateNextQuestion]);

  // ── Submit answer ──────────────────────────────────────────────────────────
  const handleSubmitAnswer = useCallback(async () => {
    if (!userAnswer.trim() || !currentQ) return;
    stopSpeaking();

    setIsEvaluating(true);
    setApiError(null);
    let evaluation = null;
    try {
      const evalCtx = {
        question: currentQ.question,
        answer: userAnswer.trim(),
        category: currentQ.category,
        application: application || {},
        userProfile: userProfile || {},
      };
      evaluation = await evaluateAnswer(evalCtx);
      setLastAnswerResult(evaluation);
      setLastEvaluation(evaluation);

      // Adapt difficulty
      let newDifficulty = currentDifficulty;
      if (evaluation.score >= 8) newDifficulty = 'hard';
      else if (evaluation.score <= 4) newDifficulty = 'easy';
      else newDifficulty = 'medium';
      setCurrentDifficulty(newDifficulty);
    } catch (err) {
      console.warn('[MockInterview] Evaluation failed:', err.message);
      evaluation = null;
    } finally {
      setIsEvaluating(false);
    }

    // Save Q&A
    const newEntry = {
      question: currentQ.question,
      answer: userAnswer.trim(),
      category: currentQ.category,
      difficulty: currentQ.difficulty,
      skill: currentQ.skill,
      evaluation,
    };
    const updatedAnswered = [...questionsAnswered, newEntry];
    setQuestionsAnswered(updatedAnswered);

    const nextQNum = questionNumber + 1;

    // Check if interview is complete
    if (nextQNum > totalQuestions) {
      // Generate final report
      setPhase('report');
      setIsGeneratingReport(true);
      try {
        const report = await generateFinalReport({
          application: application || {},
          userProfile: userProfile || {},
          questionsAnswered: updatedAnswered,
        });
        setFinalReport(report);

        // Save to history
        const uid = currentUser?.uid || 'local';
        saveInterviewHistory(uid, application.id, {
          sessionId,
          date: new Date().toISOString(),
          applicationId: application.id,
          company: application.company,
          role: application.role,
          totalQuestions,
          overallScore: report.overallScore,
          questions: updatedAnswered.map((qa) => qa.question),
          questionsAnswered: updatedAnswered,
          report,
        });
      } catch (err) {
        setApiError('Failed to generate final report: ' + (err.message || 'Unknown error'));
      } finally {
        setIsGeneratingReport(false);
      }
      return;
    }

    // Generate next question
    setQuestionNumber(nextQNum);
    await generateNextQuestion(nextQNum, updatedAnswered, previousQuestions, currentDifficulty, evaluation);
  }, [
    userAnswer, currentQ, application, userProfile, questionsAnswered,
    questionNumber, totalQuestions, previousQuestions, currentDifficulty,
    currentUser, sessionId, stopSpeaking, generateNextQuestion,
  ]);

  // ── Voice recording ────────────────────────────────────────────────────────
  const startVoiceRecording = useCallback(() => {
    if (!sttSupported) return;
    const SRClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SRClass();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.continuous = false;

    recognition.onstart = () => setVoiceState('listening');
    recognition.onaudioend = () => setVoiceState('processing');

    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setUserAnswer((prev) => {
        const combined = (prev ? prev + ' ' + transcript : transcript).trim();
        return combined;
      });
    };

    recognition.onend = () => {
      setVoiceState('done');
      recognitionRef.current = null;
    };

    recognition.onerror = (event) => {
      console.warn('[STT] Error:', event.error);
      setVoiceState('idle');
      if (event.error === 'not-allowed') {
        setApiError('Microphone permission denied. Please allow microphone access or use text input.');
      } else if (event.error !== 'aborted') {
        setApiError('Speech recognition error. Please use text input instead.');
      }
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err) {
      setVoiceState('idle');
      setApiError('Could not start microphone. Please use text input.');
    }
  }, [sttSupported]);

  const stopVoiceRecording = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  // ── Retry on error ─────────────────────────────────────────────────────────
  const retryQuestion = useCallback(async () => {
    setApiError(null);
    await generateNextQuestion(questionNumber, questionsAnswered, previousQuestions, currentDifficulty, lastEvaluation);
  }, [questionNumber, questionsAnswered, previousQuestions, currentDifficulty, lastEvaluation, generateNextQuestion]);

  // ── Interview history panel ────────────────────────────────────────────────
  function getAppHistory() {
    if (!application || !currentUser) return [];
    const uid = currentUser.uid || 'local';
    const history = getInterviewHistory();
    return history[`${uid}_${application.id}`] || [];
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: SELECT APPLICATION
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'select') {
    return (
      <div className="p-space-md lg:p-space-lg max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-primary">Mock Interview</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Choose your interview mode, then select an application to begin.
          </p>
        </div>

        {/* ── Interview Mode Selector ── */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider">Select Interview Mode</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Basic Mode Card */}
            <button
              type="button"
              onClick={() => setInterviewMode('basic')}
              className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 group ${
                interviewMode === 'basic'
                  ? 'border-secondary bg-secondary/8 shadow-md'
                  : 'border-surface-container-high bg-surface-container-lowest hover:border-secondary/50 hover:shadow-sm'
              }`}
            >
              {interviewMode === 'basic' && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-on-secondary">check</span>
                </span>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  interviewMode === 'basic' ? 'bg-secondary text-on-secondary' : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  <span className="material-symbols-outlined text-[22px]">edit_note</span>
                </div>
                <div>
                  <h3 className={`font-bold text-base ${ interviewMode === 'basic' ? 'text-secondary' : 'text-primary' }`}>Basic</h3>
                  <p className="text-[11px] text-on-surface-variant">Relaxed text-based practice</p>
                </div>
              </div>
              <ul className="space-y-1.5">
                {[
                  'Answer questions by typing',
                  'No time pressure — go at your pace',
                  'AI feedback after each answer',
                  'Great for beginners & first-timers',
                ].map((pt, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-[13px] text-emerald-500 mt-0.5 flex-shrink-0">check_circle</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </button>

            {/* Live Interview Card */}
            <button
              type="button"
              onClick={() => setInterviewMode('live')}
              className={`relative p-5 rounded-2xl border-2 text-left transition-all duration-200 group ${
                interviewMode === 'live'
                  ? 'border-purple-500 bg-purple-500/8 shadow-md'
                  : 'border-surface-container-high bg-surface-container-lowest hover:border-purple-400/50 hover:shadow-sm'
              }`}
            >
              {interviewMode === 'live' && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-purple-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[14px] text-white">check</span>
                </span>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  interviewMode === 'live' ? 'bg-purple-500 text-white' : 'bg-surface-container-high text-on-surface-variant'
                }`}>
                  <span className="material-symbols-outlined text-[22px]">videocam</span>
                </div>
                <div>
                  <h3 className={`font-bold text-base ${ interviewMode === 'live' ? 'text-purple-600' : 'text-primary' }`}>Live Interview</h3>
                  <p className="text-[11px] text-on-surface-variant">Real interview simulation</p>
                </div>
              </div>
              <ul className="space-y-1.5">
                {[
                  'Voice input with live speech recognition',
                  'AI reads questions aloud (TTS)',
                  'Adaptive difficulty based on performance',
                  'Simulates a real interview environment',
                ].map((pt, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-on-surface-variant">
                    <span className="material-symbols-outlined text-[13px] text-purple-500 mt-0.5 flex-shrink-0">check_circle</span>
                    {pt}
                  </li>
                ))}
              </ul>
              <div className="mt-3 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold uppercase tracking-wide">
                <span className="material-symbols-outlined text-[11px]">mic</span>
                Requires Microphone
              </div>
            </button>

          </div>
        </div>

        {/* ── Live Interview Domain Section (Live mode only) ── */}
        {interviewMode === 'live' && (() => {
          const userInterests = userProfile?.interests || [];
          const LIVE_DOMAINS = [
            {
              key: 'Full Stack Developer',
              label: 'Full Stack Developer',
              icon: 'layers',
              gradient: 'from-blue-500 to-indigo-600',
              bg: 'bg-blue-50',
              border: 'border-blue-200',
              iconBg: 'bg-blue-100 text-blue-600',
              badge: 'bg-blue-100 text-blue-700',
              topics: ['SSR vs CSR', 'React Lifecycle & Hooks', 'SQL vs NoSQL', 'JWT & Auth Flow', 'CORS & Security'],
              sampleVoiceQ: 'How would you architect a full-stack system that handles authenticated real-time updates without overloading the database?',
              voiceTip: 'Structure your answer: Client state → WebSocket / SSE connection → Backend auth middleware → DB write & cache invalidation.',
            },
            {
              key: 'Machine Learning / AI',
              label: 'Machine Learning / AI',
              icon: 'psychology',
              gradient: 'from-violet-500 to-purple-600',
              bg: 'bg-violet-50',
              border: 'border-violet-200',
              iconBg: 'bg-violet-100 text-violet-600',
              badge: 'bg-violet-100 text-violet-700',
              topics: ['Supervised vs Unsupervised', 'Overfitting & Regularisation', 'Gradient Descent & Optimizers', 'CNN & Transformer Architecture', 'Hyperparameter Tuning'],
              sampleVoiceQ: 'When your model achieves 99% accuracy on training data but drops to 68% on the validation set, what steps do you take to diagnose and solve this?',
              voiceTip: 'Address high variance / overfitting directly: regularisation (L1/L2), dropout, data augmentation, early stopping, and cross-validation.',
            },
            {
              key: 'Backend / Systems',
              label: 'Backend / Systems',
              icon: 'storage',
              gradient: 'from-cyan-500 to-teal-600',
              bg: 'bg-cyan-50',
              border: 'border-cyan-200',
              iconBg: 'bg-cyan-100 text-cyan-600',
              badge: 'bg-cyan-100 text-cyan-700',
              topics: ['Async Programming & I/O', 'RESTful API Architecture', 'Database Indexing & Queries', 'CAP Theorem & Distributed Data', 'Connection Pooling & Caching'],
              sampleVoiceQ: 'Explain how database connection pooling works and why it is critical for high-concurrency microservices.',
              voiceTip: 'Explain connection handshake overhead, maximum pool size trade-offs, and how pooling avoids DB connection starvation.',
            },
            {
              key: 'Frontend / UI Engineering',
              label: 'Frontend / UI Engineering',
              icon: 'desktop_windows',
              gradient: 'from-pink-500 to-rose-600',
              bg: 'bg-pink-50',
              border: 'border-pink-200',
              iconBg: 'bg-pink-100 text-pink-600',
              badge: 'bg-pink-100 text-pink-700',
              topics: ['CSS Units & Layout (Flex/Grid)', 'Browser Rendering Pipeline', 'Virtual DOM & Reconciliation', 'CSS Specificity Rules', 'Web Accessibility (a11y)'],
              sampleVoiceQ: 'Walk me through the browser rendering engine from receiving HTML bytes to pixels painted on the display.',
              voiceTip: 'Detail: HTML parser → DOM, CSS parser → CSSOM, Render Tree, Reflow (Layout), Repaint, and GPU Compositing.',
            },
            {
              key: 'Data Analyst',
              label: 'Data Analyst',
              icon: 'bar_chart',
              gradient: 'from-amber-500 to-orange-500',
              bg: 'bg-amber-50',
              border: 'border-amber-200',
              iconBg: 'bg-amber-100 text-amber-600',
              badge: 'bg-amber-100 text-amber-700',
              topics: ['Analyst vs Data Scientist', 'EDA & Data Profiling', 'Mean / Median / Mode Distribution', 'Outlier Treatment & Imputation', 'SQL Window Functions & Dashboards'],
              sampleVoiceQ: 'If a critical sales column has 25% missing values, how would you determine whether to drop, impute, or flag them?',
              voiceTip: 'Explain checking MCAR vs MAR vs MNAR, business context analysis, mean/median vs model-based imputation, and sensitivity checks.',
            },
            {
              key: 'Data Scientist',
              label: 'Data Scientist',
              icon: 'science',
              gradient: 'from-emerald-500 to-green-600',
              bg: 'bg-emerald-50',
              border: 'border-emerald-200',
              iconBg: 'bg-emerald-100 text-emerald-600',
              badge: 'bg-emerald-100 text-emerald-700',
              topics: ['Correlation vs Causation', 'Missing Data Techniques', 'Bias-Variance Tradeoff', 'Feature Engineering & Scaling', 'Decision Trees vs Random Forest'],
              sampleVoiceQ: 'For an imbalanced fraud detection problem where fraudulent cases are 0.5%, why is accuracy misleading and what evaluation metrics would you rely on?',
              voiceTip: 'Highlight precision, recall, PR-AUC, F1-score, cost-sensitive matrix, and techniques like SMOTE or class weighting.',
            },
            {
              key: 'Cyber Security',
              label: 'Cyber Security',
              icon: 'security',
              gradient: 'from-red-500 to-rose-600',
              bg: 'bg-red-50',
              border: 'border-red-200',
              iconBg: 'bg-red-100 text-red-600',
              badge: 'bg-red-100 text-red-700',
              topics: ['Symmetric vs Asymmetric Crypto', 'OWASP Top 10 Vulnerabilities', 'SQL Injection Mitigation', 'Authentication vs Authorization', 'HTTPS, TLS & Certificates'],
              sampleVoiceQ: 'How does SQL injection occur under the hood and what defense-in-depth measures completely prevent it?',
              voiceTip: 'Explain untrusted user input concatenated into query strings, parameterized queries / prepared statements, ORMs, and least-privilege DB roles.',
            },
            {
              key: 'Cloud Computing',
              label: 'Cloud Computing',
              icon: 'cloud',
              gradient: 'from-sky-500 to-blue-600',
              bg: 'bg-sky-50',
              border: 'border-sky-200',
              iconBg: 'bg-sky-100 text-sky-600',
              badge: 'bg-sky-100 text-sky-700',
              topics: ['Containers vs Virtual Machines', 'CI/CD Automated Pipelines', 'Infrastructure as Code (Terraform)', 'AWS S3, EC2, & Serverless Lambda', 'Cloud Monitoring & Auto-scaling'],
              sampleVoiceQ: 'What are the architectural trade-offs between deploying on serverless functions like AWS Lambda versus containerized microservices in ECS or Kubernetes?',
              voiceTip: 'Compare cold starts, execution time limits, vendor lock-in, cost scaling at steady load vs spikes, and operational complexity.',
            },
          ];

          // Faculty data keyed by domain key
          const DOMAIN_FACULTY = {
            'Full Stack Developer': [
              { name: 'Prof. Arjun Mehta', title: 'Sr. Full Stack Engineer', exp: '12 yrs', img: '/images/faculty_fullstack.jpg', rating: 4.9, reviews: 138 },
              { name: 'Dr. Priya Nair', title: 'Web Architecture Expert', exp: '9 yrs', img: '/images/faculty_ml_ai.jpg', rating: 4.8, reviews: 102 },
            ],
            'Machine Learning / AI': [
              { name: 'Dr. Ananya Sharma', title: 'AI Research Scientist', exp: '10 yrs', img: '/images/faculty_ml_ai.jpg', rating: 4.9, reviews: 176 },
              { name: 'Prof. Rahul Das', title: 'Deep Learning Specialist', exp: '8 yrs', img: '/images/faculty_fullstack.jpg', rating: 4.7, reviews: 91 },
            ],
            'Backend / Systems': [
              { name: 'Prof. Suresh Rao', title: 'Systems & DB Architect', exp: '18 yrs', img: '/images/faculty_backend.jpg', rating: 4.9, reviews: 205 },
              { name: 'Dr. Kiran Joshi', title: 'Distributed Systems Lead', exp: '14 yrs', img: '/images/faculty_cybersecurity.jpg', rating: 4.8, reviews: 143 },
            ],
            'Frontend / UI Engineering': [
              { name: 'Dr. Meera Pillai', title: 'UI/UX Engineering Lead', exp: '11 yrs', img: '/images/faculty_frontend.jpg', rating: 4.8, reviews: 119 },
              { name: 'Prof. Divya Kapoor', title: 'React & CSS Expert', exp: '7 yrs', img: '/images/faculty_data_scientist.jpg', rating: 4.7, reviews: 87 },
            ],
            'Data Analyst': [
              { name: 'Prof. Vikram Patel', title: 'Senior Data Analyst', exp: '13 yrs', img: '/images/faculty_data_analyst.jpg', rating: 4.8, reviews: 161 },
              { name: 'Dr. Shalini Gupta', title: 'Business Intelligence Expert', exp: '10 yrs', img: '/images/faculty_frontend.jpg', rating: 4.7, reviews: 98 },
            ],
            'Data Scientist': [
              { name: 'Dr. Lakshmi Iyer', title: 'Chief Data Scientist', exp: '15 yrs', img: '/images/faculty_data_scientist.jpg', rating: 4.9, reviews: 214 },
              { name: 'Prof. Aditya Bose', title: 'ML & Statistics Expert', exp: '11 yrs', img: '/images/faculty_data_analyst.jpg', rating: 4.8, reviews: 130 },
            ],
            'Cyber Security': [
              { name: 'Prof. Nikhil Verma', title: 'Ethical Hacking Expert', exp: '16 yrs', img: '/images/faculty_cybersecurity.jpg', rating: 4.9, reviews: 189 },
              { name: 'Dr. Ashwin Kumar', title: 'Network Security Analyst', exp: '12 yrs', img: '/images/faculty_backend.jpg', rating: 4.8, reviews: 147 },
            ],
            'Cloud Computing': [
              { name: 'Prof. Rohan Singh', title: 'Cloud Solutions Architect', exp: '10 yrs', img: '/images/faculty_backend.jpg', rating: 4.8, reviews: 123 },
              { name: 'Dr. Varun Menon', title: 'AWS & DevOps Specialist', exp: '9 yrs', img: '/images/faculty_data_analyst.jpg', rating: 4.7, reviews: 94 },
            ],
          };

          const filteredDomains = liveDomainFilter === 'all'
            ? LIVE_DOMAINS
            : LIVE_DOMAINS.filter((d) => d.key === liveDomainFilter);

          const scrollCarousel = (direction) => {
            if (liveCarouselRef.current) {
              const scrollAmount = direction === 'left' ? -260 : 260;
              liveCarouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
            }
          };

          return (
            <div className="space-y-4 rounded-2xl border-2 border-purple-200 bg-purple-50/40 p-4 shadow-sm">
              {/* Header and Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[20px] text-purple-600">record_voice_over</span>
                    <h2 className="text-sm font-extrabold text-on-surface uppercase tracking-wider">
                      Live Interview Domains
                    </h2>
                    <span className="px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold">
                      Live AI Voice
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    Scroll down or choose your domain. The AI will ask personalized live questions with voice & audio.
                  </p>
                </div>

                {/* Right controls: Dropdown + View Switch */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Dropdown selector */}
                  <div className="relative">
                    <select
                      value={liveDomainFilter}
                      onChange={(e) => setLiveDomainFilter(e.target.value)}
                      aria-label="Filter or select domain"
                      className="text-[11px] font-semibold bg-white border border-purple-200 text-purple-900 rounded-xl px-3 py-1.5 pr-7 shadow-xs focus:outline-none focus:ring-2 focus:ring-purple-400 cursor-pointer appearance-none"
                    >
                      <option value="all">🌐 All Domains (8)</option>
                      {LIVE_DOMAINS.map((d) => (
                        <option key={d.key} value={d.key}>
                          {d.label} {userInterests.includes(d.key) ? '★' : ''}
                        </option>
                      ))}
                    </select>
                    <span className="material-symbols-outlined text-[16px] text-purple-600 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none">
                      arrow_drop_down
                    </span>
                  </div>

                  {/* View mode toggle */}
                  <div className="inline-flex rounded-xl bg-purple-100 p-0.5 border border-purple-200">
                    <button
                      type="button"
                      onClick={() => setLiveDomainView('scroll')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        liveDomainView === 'scroll'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-purple-700 hover:bg-purple-200/50'
                      }`}
                      title="Scroll Down View"
                    >
                      <span className="material-symbols-outlined text-[13px]">arrow_downward</span>
                      Scroll Down
                    </button>
                    <button
                      type="button"
                      onClick={() => setLiveDomainView('carousel')}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        liveDomainView === 'carousel'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-purple-700 hover:bg-purple-200/50'
                      }`}
                      title="Horizontal Carousel"
                    >
                      <span className="material-symbols-outlined text-[13px]">view_carousel</span>
                      Carousel
                    </button>
                  </div>
                </div>
              </div>

              {/* ── View 1: Vertical Scroll-Down Section ── */}
              {liveDomainView === 'scroll' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-purple-700 px-1 font-semibold">
                    <span className="flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">south</span>
                      Scroll down to browse all domains ({filteredDomains.length} available)
                    </span>
                    {userInterests.length > 0 && (
                      <span className="text-[10px] text-purple-600">
                        ★ = Matches your profile
                      </span>
                    )}
                  </div>

                  {/* Scrollable container with vertical scroll */}
                  <div
                    className="max-h-[460px] overflow-y-auto pr-2 space-y-3 scroll-smooth rounded-xl border border-purple-200/70 bg-white/70 p-3 shadow-inner"
                    style={{ scrollbarWidth: 'thin', scrollbarColor: '#c084fc #f3e8ff' }}
                  >
                    {filteredDomains.map((d) => {
                      const isMatched = userInterests.includes(d.key);

                      return (
                        <div
                          key={d.key}
                          className={`rounded-2xl border-2 transition-all duration-200 overflow-hidden bg-white ${
                            isMatched
                              ? 'border-purple-300 shadow-sm hover:border-purple-400'
                              : `${d.border} hover:shadow-md`
                          }`}
                        >
                          {/* Card top banner */}
                          <div className={`p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b ${d.bg} border-purple-100`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl ${d.iconBg} flex items-center justify-center flex-shrink-0 shadow-xs`}>
                                <span className="material-symbols-outlined text-[22px]">{d.icon}</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="text-xs font-extrabold text-on-surface">{d.label}</h3>
                                  {isMatched && (
                                    <span className="flex items-center gap-0.5 px-2 py-0.5 rounded-full bg-purple-600 text-white text-[9px] font-bold uppercase tracking-wide">
                                      <span className="material-symbols-outlined text-[10px]">auto_awesome</span>
                                      Your Domain
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-on-surface-variant mt-0.5">
                                  5 AI Live Audio Questions • Voice Evaluation & Report
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Topics chips */}
                          <div className="px-3.5 py-2.5 bg-white space-y-1.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] font-bold uppercase text-on-surface-variant">
                                Core Topics:
                              </span>
                              {d.topics.map((topic, ti) => (
                                <span
                                  key={ti}
                                  className="px-2 py-0.5 rounded-md bg-surface-container-low text-[10px] font-medium text-on-surface border border-surface-container-high"
                                >
                                  {topic}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* ── Faculty Selection Panel ── */}
                          {(() => {
                            const facultyList = DOMAIN_FACULTY[d.key] || [];
                            const chosenFaculty = selectedFaculty[d.key];
                            return (
                              <div className={`mx-3.5 mb-3 rounded-xl border p-3 space-y-2 ${d.bg} ${d.border}`}>
                                <div className="flex items-center gap-1.5 mb-1">
                                  <span className="material-symbols-outlined text-[15px] text-purple-600">school</span>
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-on-surface">
                                    Choose Your Interviewer Faculty
                                  </span>
                                  {chosenFaculty && (
                                    <span className="ml-auto px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold uppercase tracking-wide flex items-center gap-0.5">
                                      <span className="material-symbols-outlined text-[10px]">check_circle</span>
                                      Selected
                                    </span>
                                  )}
                                </div>
                                <div className="flex gap-2.5 flex-wrap">
                                  {facultyList.map((fac, fi) => {
                                    const isChosen = chosenFaculty === fac.name;
                                    return (
                                      <button
                                        key={fi}
                                        type="button"
                                        onClick={() =>
                                          setSelectedFaculty((prev) => ({
                                            ...prev,
                                            [d.key]: isChosen ? null : fac.name,
                                          }))
                                        }
                                        className={`flex items-center gap-2.5 p-2 rounded-xl border-2 transition-all duration-150 text-left w-full sm:w-auto flex-1 min-w-[180px] ${
                                          isChosen
                                            ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-300 shadow-md'
                                            : 'border-white bg-white hover:border-purple-300 hover:shadow-sm shadow-xs'
                                        }`}
                                      >
                                        {/* Faculty Photo */}
                                        <div className={`relative flex-shrink-0 w-12 h-12 rounded-full overflow-hidden border-2 ${isChosen ? 'border-emerald-400' : 'border-gray-200'}`}>
                                          <img
                                            src={fac.img}
                                            alt={fac.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = '/images/student_avatar.png'; }}
                                          />
                                          {isChosen && (
                                            <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                                              <span className="material-symbols-outlined text-[18px] text-emerald-600 drop-shadow">check_circle</span>
                                            </div>
                                          )}
                                        </div>
                                        {/* Faculty Info */}
                                        <div className="flex-1 min-w-0">
                                          <p className={`text-[11px] font-extrabold truncate ${isChosen ? 'text-emerald-800' : 'text-on-surface'}`}>
                                            {fac.name}
                                          </p>
                                          <p className="text-[10px] text-on-surface-variant truncate">{fac.title}</p>
                                          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                            <span className="flex items-center gap-0.5 text-[10px] text-amber-600 font-semibold">
                                              <span className="material-symbols-outlined text-[11px]">star</span>
                                              {fac.rating}
                                            </span>
                                            <span className="text-[9px] text-on-surface-variant">({fac.reviews} reviews)</span>
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">{fac.exp}</span>
                                          </div>
                                        </div>
                                        {isChosen && (
                                          <span className="material-symbols-outlined text-[18px] text-emerald-500 flex-shrink-0">
                                            how_to_reg
                                          </span>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                                {chosenFaculty && (
                                  <p className="text-[10px] text-emerald-700 font-semibold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-[12px]">info</span>
                                    <strong>{chosenFaculty}</strong> will conduct your live interview for this domain.
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ── View 2: Horizontal Carousel with Left/Right arrows ── */}
              {liveDomainView === 'carousel' && (
                <div className="relative">
                  {/* Left scroll arrow */}
                  <button
                    type="button"
                    onClick={() => scrollCarousel('left')}
                    aria-label="Scroll left"
                    className="absolute -left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-purple-200 flex items-center justify-center text-purple-700 hover:bg-purple-50 transition-transform active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_left</span>
                  </button>

                  {/* Right scroll arrow */}
                  <button
                    type="button"
                    onClick={() => scrollCarousel('right')}
                    aria-label="Scroll right"
                    className="absolute -right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md border border-purple-200 flex items-center justify-center text-purple-700 hover:bg-purple-50 transition-transform active:scale-95"
                  >
                    <span className="material-symbols-outlined text-[20px]">chevron_right</span>
                  </button>

                  <div
                    ref={liveCarouselRef}
                    className="flex gap-3 overflow-x-auto pb-2 px-1 snap-x snap-mandatory scroll-smooth"
                    style={{ scrollbarWidth: 'thin' }}
                  >
                    {filteredDomains.map((d) => {
                      const isMatched = userInterests.includes(d.key);

                      return (
                        <div
                          key={d.key}
                          className={`flex-shrink-0 w-52 rounded-2xl border-2 overflow-hidden snap-start transition-all duration-200 flex flex-col justify-between ${
                            isMatched
                              ? 'border-purple-400 shadow-md ring-2 ring-purple-200'
                              : `${d.border} shadow-sm`
                          }`}
                        >
                          <div className={`bg-gradient-to-br ${d.gradient} px-4 pt-4 pb-3 relative`}>
                            {isMatched && (
                              <span className="absolute top-2 right-2 flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/20 text-white text-[9px] font-bold uppercase tracking-wide backdrop-blur-sm">
                                <span className="material-symbols-outlined text-[10px]">auto_awesome</span>
                                Your Domain
                              </span>
                            )}
                            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center mb-2">
                              <span className="material-symbols-outlined text-[20px] text-white">{d.icon}</span>
                            </div>
                            <h3 className="text-white text-xs font-extrabold leading-tight">{d.label}</h3>
                            <p className="text-white/80 text-[10px] mt-0.5">5 Live AI questions</p>
                          </div>

                          <div className={`p-3 ${d.bg} flex-1 space-y-1.5`}>
                            <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant mb-1">
                              Topics covered
                            </p>
                            {d.topics.map((t, ti) => (
                              <div key={ti} className="flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-on-surface-variant/40 flex-shrink-0" />
                                <span className="text-[10px] text-on-surface-variant leading-tight">{t}</span>
                              </div>
                            ))}
                          </div>

                          {/* Faculty row in carousel */}
                          {(() => {
                            const facultyList = DOMAIN_FACULTY[d.key] || [];
                            const chosenFaculty = selectedFaculty[d.key];
                            return (
                              <div className="px-2.5 pt-2 pb-2.5 bg-white border-t border-purple-100">
                                <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant mb-1.5 flex items-center gap-1">
                                  <span className="material-symbols-outlined text-[11px] text-purple-500">school</span>
                                  Faculty
                                </p>
                                <div className="flex gap-2 mb-1">
                                  {facultyList.map((fac, fi) => {
                                    const isChosen = chosenFaculty === fac.name;
                                    return (
                                      <button
                                        key={fi}
                                        type="button"
                                        title={fac.name}
                                        onClick={() =>
                                          setSelectedFaculty((prev) => ({
                                            ...prev,
                                            [d.key]: isChosen ? null : fac.name,
                                          }))
                                        }
                                        className={`flex flex-col items-center gap-0.5 transition-all duration-150 ${isChosen ? 'scale-105' : 'opacity-70 hover:opacity-100'}`}
                                      >
                                        <div className={`w-9 h-9 rounded-full overflow-hidden border-2 ${isChosen ? 'border-emerald-500 ring-2 ring-emerald-300' : 'border-gray-200'}`}>
                                          <img
                                            src={fac.img}
                                            alt={fac.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => { e.target.src = '/images/student_avatar.png'; }}
                                          />
                                        </div>
                                        <span className={`text-[8px] font-semibold leading-tight text-center max-w-[40px] truncate ${isChosen ? 'text-emerald-700' : 'text-on-surface-variant'}`}>
                                          {fac.name.split(' ').slice(-1)[0]}
                                        </span>
                                      </button>
                                    );
                                  })}
                                </div>
                                {chosenFaculty && (
                                  <p className="text-[8px] text-emerald-700 font-semibold truncate">
                                    ✓ {chosenFaculty}
                                  </p>
                                )}
                              </div>
                            );
                          })()}
                        </div>

                      );
                    })}
                  </div>
                </div>
              )}

              {/* Informational Footer */}
              <div className="flex items-center gap-1.5 text-[11px] text-purple-800/80 pt-1">
                <span className="material-symbols-outlined text-[14px] text-purple-600">info</span>
                <span>
                  Voice Live Interview: The AI will ask role-tailored technical questions and evaluate your spoken answers in real-time.
                  {userInterests.length > 0 && (
                    <span className="font-semibold text-purple-700">
                      {' '}Registered: {userInterests.slice(0, 2).join(', ')}.
                    </span>
                  )}
                </span>
              </div>
            </div>
          );
        })()}

        {/* ── 5 Questions Per Domain (Basic mode only) ── */}
        {interviewMode === 'basic' && (() => {
          const DOMAINS = [
            {
              label: 'HR / Behavioral',
              icon: 'groups',
              tabActive: 'bg-purple-500 text-white shadow-sm',
              tabIdle: 'border border-purple-200 text-purple-600 hover:bg-purple-50',
              headerBg: 'bg-purple-50 border-purple-100',
              tipBg: 'bg-purple-50 border-purple-100',
              badgeColor: 'bg-purple-100 text-purple-700',
              iconColor: 'text-purple-500',
              questions: [
                { q: 'Tell me about yourself.', tip: 'Use the Present–Past–Future formula: who you are now → what experiences got you here → why you want this role. Keep it under 90 seconds and tailor it to the JD.' },
                { q: 'What is your greatest strength?', tip: 'Pick a strength directly relevant to the role and back it with a specific example using the STAR method. Quantify the impact if possible.' },
                { q: 'What is your greatest weakness?', tip: 'Choose a real but non-critical weakness. Show self-awareness and describe the concrete steps you are taking to improve it. Avoid clichés like "I work too hard."' },
                { q: 'Where do you see yourself in 5 years?', tip: 'Align your answer with growth in the field. Show ambition but also that this internship is a genuine stepping stone toward your goals.' },
                { q: 'Why should we hire you over other candidates?', tip: 'Combine your unique skills + relevant experience + enthusiasm for this specific role. Be confident and back claims with specific facts or achievements.' },
              ],
            },
            (() => {
              // ── Technical questions matched to the user's career interests ──
              const TECH_QS_BY_INTEREST = {
                'Full Stack Developer': [
                  { q: 'Explain the difference between server-side rendering (SSR) and client-side rendering (CSR).', tip: 'SSR sends fully rendered HTML from the server — better for SEO and initial load. CSR renders in the browser using JS — better for interactive SPAs. Mention Next.js as an SSR/hybrid example.' },
                  { q: 'How does the React component lifecycle work?', tip: 'Cover mounting (constructor → render → componentDidMount), updating (re-render on state/props change), and unmounting. With hooks: useState/useEffect replace class lifecycle methods.' },
                  { q: 'What is the difference between SQL and NoSQL databases?', tip: 'SQL is relational, schema-based, ACID-compliant (e.g., PostgreSQL). NoSQL is schema-flexible, horizontally scalable (e.g., MongoDB). Choose based on data structure and consistency requirements.' },
                  { q: 'How do you handle authentication in a full stack app?', tip: 'Describe JWT or session-based auth: login → server issues token → client stores it (localStorage/cookie) → sends it with every request → server validates. Mention HTTPS and token refresh strategies.' },
                  { q: 'What is CORS and how do you fix it?', tip: 'CORS is a browser security policy blocking cross-origin requests. Fix by adding appropriate Access-Control-Allow-Origin headers on the server, or using a proxy in development. Never use wildcard (*) in production with credentials.' },
                ],
                'Backend / Systems': [
                  { q: 'What is the difference between synchronous and asynchronous programming?', tip: 'Sync blocks execution until a task completes. Async (callbacks, Promises, async/await) lets other code run while waiting for I/O. Critical for scalable backend services handling concurrent requests.' },
                  { q: 'How would you design a REST API for a social media application?', tip: 'Cover resources (users, posts, comments), HTTP verbs (GET/POST/PUT/DELETE), versioning (/v1/), pagination (cursor or offset), status codes, and authentication. Mention OpenAPI/Swagger for docs.' },
                  { q: 'What are database indexes and when should you use them?', tip: 'Indexes speed up read queries by creating a sorted data structure on a column. Use them on frequently queried/join/sort columns. Avoid over-indexing — they slow down writes and consume storage.' },
                  { q: 'Explain the CAP theorem in distributed systems.', tip: 'CAP: Consistency (all nodes see same data), Availability (every request gets a response), Partition Tolerance (system works despite network failures). You can only guarantee 2 of 3 simultaneously.' },
                  { q: 'What is connection pooling and why is it important?', tip: 'Connection pooling reuses a set of pre-established DB connections instead of creating new ones per request. This drastically reduces latency and resource overhead in high-concurrency backends.' },
                ],
                'Frontend / UI Engineering': [
                  { q: 'What is the difference between em, rem, vw, and px in CSS?', tip: 'px is absolute. em is relative to parent font-size. rem is relative to root font-size (preferred for accessibility). vw/vh are viewport percentages — useful for fluid layouts.' },
                  { q: 'How does the browser rendering pipeline work?', tip: 'HTML → DOM, CSS → CSSOM → Render Tree → Layout → Paint → Composite. Explain reflow (layout change) vs repaint (visual change). Minimise reflows for performance.' },
                  { q: 'What is the virtual DOM and how does React use it?', tip: 'The virtual DOM is an in-memory representation of the real DOM. React diffs the new virtual DOM against the previous one (reconciliation) and only updates what changed in the real DOM — minimising expensive DOM operations.' },
                  { q: 'Explain CSS specificity and how conflicts are resolved.', tip: 'Specificity order: inline styles > ID selectors > class/attribute/pseudo-class > element selectors. The browser picks the most specific rule. !important overrides all (use sparingly).' },
                  { q: 'What is accessibility (a11y) and how do you implement it?', tip: 'Accessibility ensures your UI is usable by people with disabilities. Use semantic HTML, ARIA roles, sufficient colour contrast, keyboard navigation, and screen-reader-friendly alt text and labels.' },
                ],
                'Machine Learning / AI': [
                  { q: 'What is the difference between supervised and unsupervised learning?', tip: 'Supervised: model trained on labelled data to predict outputs (e.g., classification, regression). Unsupervised: model finds patterns in unlabelled data (e.g., clustering, dimensionality reduction).' },
                  { q: 'Explain overfitting and how you prevent it.', tip: 'Overfitting: model memorises training data and performs poorly on unseen data. Prevention: more data, regularisation (L1/L2), dropout, early stopping, cross-validation, and simpler models.' },
                  { q: 'What is gradient descent and why is it used?', tip: 'Gradient descent minimises the loss function by iteratively adjusting weights in the direction opposite to the gradient. Variants: batch, mini-batch, stochastic (SGD). Learning rate controls step size.' },
                  { q: 'What is the difference between a parameter and a hyperparameter?', tip: 'Parameters (weights, biases) are learned from data during training. Hyperparameters (learning rate, epochs, layers) are set before training. Hyperparameter tuning (grid search, random search) optimises model performance.' },
                  { q: 'How does a convolutional neural network (CNN) work?', tip: 'CNNs apply learnable filters (kernels) that slide over the input to detect features (edges, textures). Followed by pooling layers for spatial downsampling, then fully connected layers for classification.' },
                ],
                'Cloud Computing': [
                  { q: 'What is the difference between a container and a virtual machine?', tip: 'VMs virtualise hardware and run a full OS. Containers share the host OS kernel and are lightweight. Docker containers start in seconds vs minutes for VMs. Kubernetes orchestrates containers at scale.' },
                  { q: 'Explain the concept of CI/CD pipelines.', tip: 'CI (Continuous Integration): automatically build and test code on every commit. CD (Continuous Delivery/Deployment): automatically deploy passing builds to staging or production. Tools: GitHub Actions, Jenkins, GitLab CI.' },
                  { q: 'What is Infrastructure as Code (IaC) and why use it?', tip: 'IaC manages infrastructure through code (Terraform, CloudFormation) instead of manual configuration. Benefits: version control, reproducibility, automated provisioning, and drift detection.' },
                  { q: 'What are the key differences between AWS S3, EC2, and Lambda?', tip: 'S3: object storage (files, images). EC2: virtual servers (full control over compute). Lambda: serverless functions that run on-demand — no server management, pay per invocation.' },
                  { q: 'How do you monitor a production application?', tip: 'Use metrics (CPU, memory, error rate via Prometheus/CloudWatch), logs (ELK stack, CloudWatch Logs), and traces (distributed tracing via Jaeger/X-Ray). Set up alerts on SLOs (latency, error rate thresholds).' },
                ],
                'Data Scientist': [
                  { q: 'What is the difference between correlation and causation?', tip: 'Correlation measures how two variables move together. Causation means one variable directly causes the other. Correlation does not imply causation — always check for confounding variables and use experiments or causal inference.' },
                  { q: 'How do you handle missing data in a dataset?', tip: 'Options: remove rows/columns (if small %), impute with mean/median/mode, use model-based imputation (KNN, MICE), or flag as a separate category. Choice depends on missingness type (MCAR, MAR, MNAR).' },
                  { q: 'Explain the bias-variance tradeoff.', tip: 'Bias: error from wrong assumptions (underfitting). Variance: error from sensitivity to training data (overfitting). The goal is to find the sweet spot — a model that generalises well. Regularisation and cross-validation help.' },
                  { q: 'What is feature engineering and why does it matter?', tip: 'Feature engineering transforms raw data into meaningful inputs for models — encoding categoricals, normalising numerics, creating interaction terms, handling outliers. Often has more impact than model choice.' },
                  { q: 'What is the difference between a decision tree and a random forest?', tip: 'A decision tree makes splits greedily and is prone to overfitting. A random forest builds many trees on random subsets of data and features, then aggregates predictions — reducing variance while keeping low bias.' },
                ],
                'Data Analyst': [
                  { q: 'What is the difference between a data analyst and a data scientist?', tip: 'A data analyst focuses on interpreting existing data to answer business questions (SQL, Excel, dashboards). A data scientist builds predictive models and applies ML. Both require strong analytical thinking.' },
                  { q: 'Explain the steps of a typical data analysis project.', tip: 'Define the question → Collect data → Clean & explore (EDA) → Analyse & visualise → Derive insights → Communicate findings. Each step has specific tools and pitfalls to discuss.' },
                  { q: 'What is the difference between mean, median, and mode and when do you use each?', tip: 'Mean: average (sensitive to outliers). Median: middle value (robust to outliers, use for skewed data). Mode: most frequent value (use for categorical data). Always choose based on data distribution.' },
                  { q: 'How do you handle outliers in a dataset?', tip: 'First, understand if they are real or data errors. Options: remove (if erroneous), cap/floor (Winsorisation), transform (log scale), or use robust models. Justify your choice based on the business context.' },
                  { q: 'What tools and SQL skills do you use for data analysis?', tip: 'Mention SQL (JOINs, GROUP BY, window functions like ROW_NUMBER, RANK), Python/pandas for manipulation, and visualisation tools (Tableau, Power BI, Matplotlib). Show comfort with end-to-end analysis workflows.' },
                ],
                'Cyber Security': [
                  { q: 'What is the difference between symmetric and asymmetric encryption?', tip: 'Symmetric: same key for encrypt and decrypt (fast) — e.g., AES. Asymmetric: public key encrypts, private key decrypts (slower, but no key-sharing problem) — e.g., RSA, used in TLS handshakes.' },
                  { q: 'Explain the OWASP Top 10 vulnerabilities.', tip: 'Key ones: Injection (SQL/XSS), Broken Authentication, Sensitive Data Exposure, Broken Access Control, Security Misconfiguration, Insecure Deserialization, Using Components with Known Vulnerabilities. Know the top 3 in depth.' },
                  { q: 'What is a SQL injection attack and how do you prevent it?', tip: 'SQL injection inserts malicious SQL into input fields to manipulate the DB. Prevention: use parameterised queries/prepared statements, ORMs, input validation, and least-privilege DB accounts. Never concatenate raw user input into SQL.' },
                  { q: 'What is the difference between authentication and authorisation?', tip: 'Authentication: verifying who you are (login). Authorisation: verifying what you are allowed to do (permissions/roles). Both are distinct steps — never skip authorisation checks even for authenticated users.' },
                  { q: 'How does HTTPS work and what does TLS do?', tip: 'TLS (Transport Layer Security) encrypts data in transit. During the TLS handshake, the server sends its certificate, client verifies it, they agree on a cipher suite and exchange session keys. All subsequent data is encrypted.' },
                ],
              };

              // Match user interests to the question bank
              const userInterests = userProfile?.interests || [];
              const matchedInterest = userInterests.find(i => TECH_QS_BY_INTEREST[i]);
              const techLabel = matchedInterest
                ? `Technical — ${matchedInterest}`
                : 'Technical (General)';
              const techQuestions = matchedInterest
                ? TECH_QS_BY_INTEREST[matchedInterest]
                : [
                    { q: 'Explain a project you built and the tech stack you used.', tip: 'Structure: Problem → Tech choices & why → Your role → Challenges → Outcome. Quantify impact where possible (e.g., "reduced API latency by 35%").' },
                    { q: 'What is the difference between REST and GraphQL?', tip: 'REST uses fixed endpoints and returns full resource objects. GraphQL uses a single endpoint and lets clients request exactly what they need, reducing over-fetching.' },
                    { q: 'Explain OOP concepts with a real-world example.', tip: 'Cover the four pillars: Encapsulation, Abstraction, Inheritance, Polymorphism. Use a concrete class example like a Vehicle or Animal hierarchy.' },
                    { q: 'How does the internet work when you type a URL?', tip: 'Walk through: DNS resolution → TCP/IP connection → HTTP request → Server processing → HTTP response → Browser rendering. Mentioning HTTPS/TLS shows extra depth.' },
                    { q: 'What is the time complexity of binary search and why?', tip: 'O(log n) — each step halves the search space. Compare with linear search O(n). Mention that binary search requires a sorted array to work.' },
                  ];

              return {
                label: techLabel,
                icon: 'code',
                tabActive: 'bg-cyan-500 text-white shadow-sm',
                tabIdle: 'border border-cyan-200 text-cyan-600 hover:bg-cyan-50',
                headerBg: 'bg-cyan-50 border-cyan-100',
                tipBg: 'bg-cyan-50 border-cyan-100',
                badgeColor: 'bg-cyan-100 text-cyan-700',
                iconColor: 'text-cyan-600',
                questions: techQuestions,
                matchedInterest,
              };
            })(),
            {
              label: 'Situational',
              icon: 'psychology',
              tabActive: 'bg-orange-500 text-white shadow-sm',
              tabIdle: 'border border-orange-200 text-orange-600 hover:bg-orange-50',
              headerBg: 'bg-orange-50 border-orange-100',
              tipBg: 'bg-orange-50 border-orange-100',
              badgeColor: 'bg-orange-100 text-orange-700',
              iconColor: 'text-orange-500',
              questions: [
                { q: 'How do you handle tight deadlines or multiple tasks at once?', tip: 'Describe your prioritization framework (e.g., urgency vs. importance). Give a real example of juggling tasks and the result. Mention productivity tools you use.' },
                { q: "What would you do if you disagreed with your manager's decision?", tip: "Show professionalism: understand the rationale first, express your perspective respectfully with data, then commit to the team's direction. Avoid seeming combative." },
                { q: 'If you realized mid-project that you were on the wrong track, what would you do?', tip: 'Acknowledge it early, communicate transparently, reassess requirements with the team, and propose a corrective plan. Emphasize learning fast and pivoting quickly.' },
                { q: 'How would you handle receiving harsh critical feedback?', tip: 'Thank the person, ask clarifying questions, separate emotion from facts, and create an action plan. Show that feedback is fuel for growth, not a personal attack.' },
                { q: 'Describe how you would onboard yourself to a new codebase quickly.', tip: 'Read README/docs, explore folder structure, run the project locally, trace a feature end-to-end. Ask senior devs targeted questions rather than vague ones.' },
              ],
            },
            {
              label: 'Project-Based',
              icon: 'rocket_launch',
              tabActive: 'bg-emerald-500 text-white shadow-sm',
              tabIdle: 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50',
              headerBg: 'bg-emerald-50 border-emerald-100',
              tipBg: 'bg-emerald-50 border-emerald-100',
              badgeColor: 'bg-emerald-100 text-emerald-700',
              iconColor: 'text-emerald-600',
              questions: [
                { q: 'Walk me through your most challenging project.', tip: "Use STAR: the challenge, your specific contribution, blockers faced, and the measurable outcome. Focus on your own actions, not just the team's collective work." },
                { q: 'What would you do differently if you rebuilt this project today?', tip: 'Demonstrate growth mindset. Mention architectural improvements, better testing, or different tech choices — and explain why. Shows you reflect on and learn from your work.' },
                { q: 'How did you decide on the tech stack for your project?', tip: "Discuss evaluation criteria: team familiarity, performance needs, ecosystem maturity, deployment constraints. Avoid 'I just used it because it's popular.'" },
                { q: 'How did you handle version control and collaboration in your project?', tip: "Explain your Git workflow (feature branches, PRs, code reviews). Describe how you resolved merge conflicts or reviewed teammates' code constructively." },
                { q: 'How did you test and ensure the quality of your project?', tip: "Mention unit tests, integration tests, or manual QA. If you didn't test much, be honest and describe what you would add now and the reasoning behind each." },
              ],
            },
            {
              label: 'Communication',
              icon: 'forum',
              tabActive: 'bg-rose-500 text-white shadow-sm',
              tabIdle: 'border border-rose-200 text-rose-600 hover:bg-rose-50',
              headerBg: 'bg-rose-50 border-rose-100',
              tipBg: 'bg-rose-50 border-rose-100',
              badgeColor: 'bg-rose-100 text-rose-700',
              iconColor: 'text-rose-500',
              questions: [
                { q: 'Describe a time you explained a complex technical concept to a non-technical person.', tip: 'Show empathy-first communication: use analogies, avoid jargon, and check for understanding. Mention the context and what the outcome of that conversation was.' },
                { q: 'Tell me about a time you led or contributed to a team presentation.', tip: 'Cover preparation, how you structured content for the audience, your delivery role, and feedback received. Highlight collaboration and adaptability under pressure.' },
                { q: 'How do you keep stakeholders updated on your progress?', tip: 'Mention async tools (Slack, email, weekly standups, status docs) and proactive communication — share blockers early, not at the last moment.' },
                { q: 'Have you ever had to deliver bad news to a team or client? How did you handle it?', tip: 'Be honest, own the situation, present facts clearly, and offer solutions not just problems. Follow up after. Avoid blame-shifting or minimising the issue.' },
                { q: 'How do you ensure you fully understand requirements before starting work?', tip: 'Ask clarifying questions, paraphrase requirements back to confirm, define edge cases upfront, and align on acceptance criteria before writing a single line of code.' },
              ],
            },
          ];
          const dom = DOMAINS[activeDomain];
          return (
            <div className="space-y-4">
              {/* Section header */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="material-symbols-outlined text-[16px] text-secondary">library_books</span>
                <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider">5 Questions Per Domain</h2>
                <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-[10px] font-bold">Basic Mode</span>
                {DOMAINS[1]?.matchedInterest && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
                    <span className="material-symbols-outlined text-[11px]">auto_awesome</span>
                    Personalised for you
                  </span>
                )}
              </div>
              <p className="text-[11px] text-on-surface-variant">
                Select a domain below, then click any question to reveal the answer strategy.
                {DOMAINS[1]?.matchedInterest && (
                  <span className="text-emerald-600 font-semibold"> Technical questions are personalised to your <span className="underline">{DOMAINS[1].matchedInterest}</span> interest.</span>
                )}
              </p>

              {/* Domain tab pills */}
              <div className="flex gap-2 flex-wrap">
                {DOMAINS.map((d, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => { setActiveDomain(i); setOpenFaq(null); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                      activeDomain === i ? d.tabActive : d.tabIdle
                    }`}
                  >
                    <span className="material-symbols-outlined text-[13px]">{d.icon}</span>
                    {d.label}
                    {i === 1 && d.matchedInterest && (
                      <span className="material-symbols-outlined text-[11px] opacity-80">auto_awesome</span>
                    )}
                  </button>
                ))}
              </div>

              {/* Questions panel */}
              <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest overflow-hidden">
                {/* Panel header */}
                <div className={`px-4 py-3 flex items-center gap-2 border-b ${dom.headerBg}`}>
                  <span className={`material-symbols-outlined text-[18px] ${dom.iconColor}`}>{dom.icon}</span>
                  <span className={`text-xs font-extrabold ${dom.iconColor}`}>{dom.label}</span>
                  {dom.matchedInterest && (
                    <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-bold uppercase tracking-wide">
                      <span className="material-symbols-outlined text-[10px]">auto_awesome</span>
                      Matched to your profile
                    </span>
                  )}
                  <span className={`ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold ${dom.badgeColor}`}>5 Questions</span>
                </div>
                {/* Q list */}
                <div className="divide-y divide-surface-container-high">
                  {dom.questions.map((item, qi) => (
                    <div key={qi}>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(openFaq === qi ? null : qi)}
                        className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-surface-container-low transition-colors"
                      >
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 text-[11px] font-extrabold ${dom.badgeColor}`}>
                          {qi + 1}
                        </span>
                        <span className="flex-1 text-xs font-semibold text-on-surface">{item.q}</span>
                        <span className={`material-symbols-outlined text-[18px] text-on-surface-variant flex-shrink-0 transition-transform duration-200 ${
                          openFaq === qi ? 'rotate-180' : ''
                        }`}>expand_more</span>
                      </button>
                      {openFaq === qi && (
                        <div className={`mx-4 mb-3 rounded-xl px-3 py-3 border ${dom.tipBg}`}>
                          <div className="flex gap-2">
                            <span className={`material-symbols-outlined text-[15px] ${dom.iconColor} mt-0.5 flex-shrink-0`}>lightbulb</span>
                            <p className="text-[11px] text-on-surface-variant leading-relaxed">{item.tip}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })()}


        {/* ── Applications List ── */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-on-surface uppercase tracking-wider">Select Application</h2>

          {applications.length === 0 ? (
            <div className="p-12 rounded-2xl bg-surface-container-lowest border border-surface-container-high text-center space-y-4">
              <span className="material-symbols-outlined text-[48px] text-outline">send</span>
              <h2 className="font-bold text-lg text-primary">No Applications Yet</h2>
              <p className="text-sm text-on-surface-variant max-w-md mx-auto">
                Add internship applications to My Applications first, then come back to practice interviews for each one.
              </p>
              <button
                type="button"
                onClick={() => navigate('my-applications')}
                className="px-5 py-2.5 rounded-xl bg-secondary text-on-secondary font-bold text-sm hover:bg-secondary-container transition-all shadow-sm"
              >
                Go to My Applications
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {applications.map((app) => {
                const history = getInterviewHistory()[`${(currentUser?.uid || 'local')}_${app.id}`] || [];
                const lastAttempt = history[0];
                return (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm hover:border-secondary hover:shadow-md transition-all space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-base text-primary leading-snug">{app.company}</h3>
                        <p className="text-xs text-on-surface-variant font-medium mt-0.5">{app.role}</p>
                        {app.location && (
                          <p className="text-[11px] text-outline mt-0.5 flex items-center gap-1">
                            <span className="material-symbols-outlined text-[13px]">location_on</span>
                            {app.location}
                          </p>
                        )}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${app.column === 'offer' ? 'bg-emerald-100 text-emerald-800' : app.column === 'interview' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'}`}>
                        {app.column || app.status || 'Applied'}
                      </span>
                    </div>

                    {lastAttempt && (
                      <div className="p-2 rounded-lg bg-surface-container-low text-[11px] text-on-surface-variant flex items-center gap-2">
                        <span className="material-symbols-outlined text-[14px] text-secondary">history</span>
                        Last attempt: Score {lastAttempt.overallScore}/100 •{' '}
                        {new Date(lastAttempt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                        {history.length > 1 && ` • ${history.length} attempts`}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setApplication(app);
                        setSelectedApplicationId(app.id);
                        setPhase('setup');
                      }}
                      className={`w-full py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 shadow-sm ${
                        interviewMode === 'live'
                          ? 'bg-purple-500 text-white hover:bg-purple-600'
                          : 'bg-secondary text-on-secondary hover:bg-secondary-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{interviewMode === 'live' ? 'videocam' : 'edit_note'}</span>
                      {interviewMode === 'live' ? 'Start Live Interview' : 'Start Basic Practice'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: SETUP
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'setup') {
    const history = application
      ? (getInterviewHistory()[`${(currentUser?.uid || 'local')}_${application.id}`] || [])
      : [];

    return (
      <div className="p-space-md lg:p-space-lg max-w-3xl mx-auto space-y-6">
        <button
          type="button"
          onClick={() => { setPhase('select'); setApplication(null); setSelectedApplicationId(null); }}
          className="flex items-center gap-1 text-secondary text-xs font-bold hover:underline"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          Back to Applications
        </button>

        <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-5">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
              interviewMode === 'live' ? 'bg-purple-500/10' : 'bg-secondary/10'
            }`}>
              <span className={`material-symbols-outlined text-[24px] ${
                interviewMode === 'live' ? 'text-purple-500' : 'text-secondary'
              }`}>{interviewMode === 'live' ? 'videocam' : 'edit_note'}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="font-display text-xl font-extrabold text-primary">
                  Interview for {application?.role}
                </h1>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                  interviewMode === 'live' ? 'bg-purple-100 text-purple-700' : 'bg-secondary/10 text-secondary'
                }`}>
                  {interviewMode === 'live' ? '🎙 Live Interview' : '✏️ Basic'}
                </span>
              </div>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {application?.company}
                {application?.location ? ` • ${application.location}` : ''}
              </p>
            </div>
          </div>

          {/* What to expect */}
          <div className={`p-4 rounded-xl border space-y-2 ${
            interviewMode === 'live' ? 'bg-purple-50 border-purple-200' : 'bg-surface-container-low border-surface-container-high'
          }`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider ${
              interviewMode === 'live' ? 'text-purple-700' : 'text-primary'
            }`}>What to Expect — {interviewMode === 'live' ? 'Live Interview' : 'Basic Mode'}</h3>
            <ul className="space-y-1.5 text-xs text-on-surface-variant">
              {(interviewMode === 'live' ? [
                'AI generates questions personalized to this internship and your profile',
                'Questions cover: Introduction → HR → Projects → Technical → Behavioral',
                'AI reads each question aloud using text-to-speech',
                'Answer by voice — your speech is transcribed in real-time',
                'Difficulty adapts based on your performance score',
                'Full performance report at the end with detailed feedback',
              ] : [
                'AI generates questions personalized to this internship and your profile',
                'Questions cover: Introduction → HR → Projects → Technical → Behavioral',
                'Answer by typing in the text box at your own pace',
                'AI evaluates each answer and gives instant feedback',
                'Full performance report at the end',
                'New question set each session — no repeats from past attempts',
              ]).map((point, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className={`material-symbols-outlined text-[14px] mt-0.5 flex-shrink-0 ${
                    interviewMode === 'live' ? 'text-purple-500' : 'text-secondary'
                  }`}>check_circle</span>
                  {point}
                </li>
              ))}
            </ul>
          </div>

          {/* Student profile preview */}
          {userProfile && (userProfile.name || (userProfile.skills && userProfile.skills.length > 0)) && (
            <div className="p-4 rounded-xl bg-secondary/5 border border-secondary/20 space-y-2">
              <h3 className="text-xs font-bold text-secondary uppercase tracking-wider">Your Profile (used for personalization)</h3>
              <div className="text-xs text-on-surface-variant space-y-1">
                {userProfile.name && <p><span className="font-semibold">Name:</span> {userProfile.name}</p>}
                {userProfile.college && <p><span className="font-semibold">College:</span> {userProfile.college}</p>}
                {(userProfile.skills || []).length > 0 && (
                  <p><span className="font-semibold">Skills:</span> {(userProfile.skills || []).slice(0, 8).join(', ')}{(userProfile.skills || []).length > 8 ? '...' : ''}</p>
                )}
                {(userProfile.projects || []).length > 0 && (
                  <p><span className="font-semibold">Projects:</span> {(userProfile.projects || []).slice(0, 3).map((p) => typeof p === 'string' ? p : (p.name || p.title || '')).filter(Boolean).join(', ')}</p>
                )}
              </div>
              <p className="text-[10px] text-outline">
                Update your profile for more personalized questions.
              </p>
            </div>
          )}

          {/* Interview length picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider block">Interview Length</label>
            <div className="flex gap-2">
              {[5, 10, 15].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setTotalQuestions(n)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                    totalQuestions === n
                      ? 'bg-secondary text-on-secondary border-secondary shadow-sm'
                      : 'border-surface-container-high text-on-surface-variant hover:border-secondary hover:text-secondary'
                  }`}
                >
                  {n} Questions
                  <span className="block text-[10px] font-normal opacity-75 mt-0.5">
                    ~{n * 3} min
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Past attempts */}
          {history.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-on-surface uppercase tracking-wider">Past Attempts</h3>
              <div className="space-y-2">
                {history.slice(0, 3).map((attempt, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-primary">Attempt {history.length - idx}</span>
                      <span className="text-[11px] text-on-surface-variant ml-2">
                        {new Date(attempt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      attempt.overallScore >= 80 ? 'bg-emerald-100 text-emerald-800' :
                      attempt.overallScore >= 60 ? 'bg-amber-100 text-amber-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      Score: {attempt.overallScore}/100
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={startInterview}
            className="w-full py-3 rounded-xl bg-secondary text-on-secondary font-bold text-sm hover:bg-secondary-container transition-all flex items-center justify-center gap-2 shadow-md"
          >
            <span className="material-symbols-outlined text-[20px]">play_arrow</span>
            Start Interview
          </button>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: FINAL REPORT
  // ════════════════════════════════════════════════════════════════════════════
  if (phase === 'report') {
    const history = application
      ? (getInterviewHistory()[`${(currentUser?.uid || 'local')}_${application.id}`] || [])
      : [];
    const latestAttempt = history[0];

    return (
      <div className="p-space-md lg:p-space-lg max-w-4xl mx-auto space-y-6">
        {isGeneratingReport ? (
          <div className="p-16 rounded-2xl bg-surface-container-lowest border border-surface-container-high text-center space-y-4">
            <span className="material-symbols-outlined text-[48px] text-secondary animate-spin">progress_activity</span>
            <h2 className="font-bold text-xl text-primary">Generating Your Report...</h2>
            <p className="text-sm text-on-surface-variant">AI is analyzing your {questionsAnswered.length} answers. This may take a moment.</p>
          </div>
        ) : finalReport ? (
          <>
            {/* Header */}
            <div className="p-6 rounded-2xl bg-gradient-to-r from-primary to-secondary text-white shadow-lg space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">Interview Complete</span>
                  <h1 className="font-display text-2xl font-extrabold mt-1">{application?.company} — {application?.role}</h1>
                  <p className="text-sm text-white/80 mt-0.5">
                    {latestAttempt && new Date(latestAttempt.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    {' • '}{questionsAnswered.length} questions • {formatTimer(timer)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-bold uppercase tracking-widest text-white/70 block">Overall Score</span>
                  <span className="text-5xl font-extrabold">{finalReport.overallScore}</span>
                  <span className="text-lg text-white/70">/100</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-4">
                <h2 className="font-bold text-base text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-secondary">analytics</span>
                  Performance Breakdown
                </h2>
                <div className="space-y-3">
                  <ScoreBar label="Communication" value={finalReport.communication} color="bg-blue-500" />
                  <ScoreBar label="Technical Knowledge" value={finalReport.technicalKnowledge} color="bg-purple-500" />
                  <ScoreBar label="Relevance" value={finalReport.relevance} color="bg-emerald-500" />
                  <ScoreBar label="Problem Solving" value={finalReport.problemSolving} color="bg-amber-500" />
                  <ScoreBar label="Clarity" value={finalReport.clarity} color="bg-cyan-500" />
                  <ScoreBar label="Completeness" value={finalReport.completeness} color="bg-pink-500" />
                </div>
              </div>

              {/* Strengths & Improvements */}
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 shadow-sm space-y-3">
                  <h2 className="font-bold text-sm text-emerald-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">thumb_up</span>
                    Strengths
                  </h2>
                  <ul className="space-y-2">
                    {(finalReport.strengths || []).map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-emerald-800">
                        <span className="material-symbols-outlined text-[14px] mt-0.5 flex-shrink-0">check_circle</span>
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200 shadow-sm space-y-3">
                  <h2 className="font-bold text-sm text-amber-800 flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px]">trending_up</span>
                    Areas to Improve
                  </h2>
                  <ul className="space-y-2">
                    {(finalReport.areasToImprove || []).map((a, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-amber-800">
                        <span className="material-symbols-outlined text-[14px] mt-0.5 flex-shrink-0">arrow_upward</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Overall Feedback */}
            {finalReport.overallFeedback && (
              <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-2">
                <h2 className="font-bold text-sm text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-secondary">chat</span>
                  Interviewer's Feedback
                </h2>
                <p className="text-xs text-on-surface-variant leading-relaxed whitespace-pre-line">{finalReport.overallFeedback}</p>
              </div>
            )}

            {/* Weak Questions with Model Answers */}
            {(finalReport.weakQuestions || []).length > 0 && (
              <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 shadow-sm space-y-4">
                <h2 className="font-bold text-sm text-rose-800 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">quiz</span>
                  Questions Needing More Practice
                </h2>
                <div className="space-y-3">
                  {(finalReport.weakQuestions || []).map((wq, i) => (
                    <div key={i} className="p-4 rounded-xl bg-white border border-rose-200 space-y-2">
                      <p className="text-xs font-bold text-rose-800">{wq.question}</p>
                      <p className="text-[11px] text-rose-600">{wq.issue}</p>
                      <button
                        type="button"
                        onClick={() => setShowWeakQuestion(showWeakQuestion === i ? null : i)}
                        className="text-[10px] font-bold text-secondary hover:underline flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[12px]">
                          {showWeakQuestion === i ? 'expand_less' : 'expand_more'}
                        </span>
                        {showWeakQuestion === i ? 'Hide' : 'See'} Model Answer
                      </button>
                      {showWeakQuestion === i && (
                        <div className="mt-2 p-3 rounded-lg bg-surface-container-low text-[11px] text-on-surface-variant leading-relaxed border border-surface-container-high">
                          {wq.modelAnswer}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Topics */}
            {(finalReport.recommendedTopics || []).length > 0 && (
              <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-3">
                <h2 className="font-bold text-sm text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-secondary">school</span>
                  Recommended Topics to Study
                </h2>
                <div className="flex flex-wrap gap-2">
                  {(finalReport.recommendedTopics || []).map((topic, i) => (
                    <span key={i} className="px-3 py-1.5 rounded-full bg-secondary/10 text-secondary text-xs font-semibold border border-secondary/20">
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Q&A Review */}
            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-3">
              <h2 className="font-bold text-sm text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-secondary">list_alt</span>
                Full Q&A Review
              </h2>
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {questionsAnswered.map((qa, i) => (
                  <div key={i} className="p-3 rounded-xl border border-surface-container-high space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-secondary text-on-secondary text-[10px] font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${CATEGORY_COLOR[qa.category] || 'bg-gray-100 text-gray-700'}`}>
                        {CATEGORY_LABELS[qa.category] || qa.category}
                      </span>
                      {qa.evaluation && (
                        <span className={`ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                          qa.evaluation.score >= 7 ? 'bg-emerald-100 text-emerald-800' :
                          qa.evaluation.score >= 5 ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {qa.evaluation.score}/10
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-primary">{qa.question}</p>
                    <p className="text-[11px] text-on-surface-variant leading-relaxed">{qa.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => {
                  setPhase('setup');
                  setQuestionsAnswered([]);
                  setCurrentQ(null);
                  setTimer(0);
                  setFinalReport(null);
                  setLastAnswerResult(null);
                  setApiError(null);
                }}
                className="flex-1 py-3 rounded-xl bg-secondary text-on-secondary font-bold text-sm hover:bg-secondary-container transition-all flex items-center justify-center gap-2 shadow-sm"
              >
                <span className="material-symbols-outlined text-[18px]">replay</span>
                Practice Again (New Questions)
              </button>
              <button
                type="button"
                onClick={() => navigate('my-applications')}
                className="flex-1 py-3 rounded-xl border border-surface-container-high text-on-surface font-bold text-sm hover:bg-surface-container-low transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Back to Applications
              </button>
            </div>
          </>
        ) : (
          <div className="p-12 rounded-2xl bg-surface-container-lowest border border-surface-container-high text-center space-y-4">
            <span className="material-symbols-outlined text-[48px] text-outline">error_outline</span>
            <h2 className="font-bold text-lg text-primary">Could Not Generate Report</h2>
            <p className="text-sm text-on-surface-variant">{apiError || 'Something went wrong generating the final report.'}</p>
            <button
              type="button"
              onClick={() => {
                setPhase('setup');
                setApiError(null);
              }}
              className="px-5 py-2.5 rounded-xl bg-secondary text-on-secondary font-bold text-sm hover:bg-secondary-container transition-all"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // PHASE: ACTIVE INTERVIEW
  // ════════════════════════════════════════════════════════════════════════════
  const progressPct = Math.round(((questionNumber - 1) / totalQuestions) * 100);

  return (
    <div className="p-space-md lg:p-space-lg max-w-7xl mx-auto space-y-6">

      {/* ── Top Header Bar ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-ping flex-shrink-0" />
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">Live Mock Session</span>
            <h1 className="font-headline-sm text-base font-bold text-primary leading-tight">
              {application?.company} — {application?.role}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Progress */}
          <div className="flex items-center gap-2 text-xs text-on-surface-variant">
            <span>Q{questionNumber}/{totalQuestions}</span>
            <div className="w-20 bg-surface-container h-1.5 rounded-full overflow-hidden">
              <div className="bg-secondary h-full rounded-full transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          {/* Timer */}
          <div className="px-4 py-2 rounded-xl bg-surface-container-low border border-surface-container-high font-code text-sm font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-secondary">timer</span>
            {formatTimer(timer)}
          </div>

          <button
            type="button"
            onClick={() => { stopSpeaking(); setIsPaused(!isPaused); }}
            className="p-2 rounded-xl border border-surface-container-high hover:bg-surface-container-low text-on-surface-variant transition-colors"
            title={isPaused ? 'Resume' : 'Pause'}
          >
            <span className="material-symbols-outlined text-[20px]">{isPaused ? 'play_arrow' : 'pause'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              stopSpeaking();
              if (window.confirm('End interview and see results so far?')) {
                setPhase('report');
                setIsGeneratingReport(true);
                generateFinalReport({
                  application: application || {},
                  userProfile: userProfile || {},
                  questionsAnswered,
                }).then((report) => {
                  setFinalReport(report);
                  const uid = currentUser?.uid || 'local';
                  saveInterviewHistory(uid, application.id, {
                    sessionId, date: new Date().toISOString(),
                    applicationId: application.id,
                    company: application.company, role: application.role,
                    totalQuestions: questionsAnswered.length,
                    overallScore: report.overallScore,
                    questions: questionsAnswered.map((qa) => qa.question),
                    questionsAnswered, report,
                  });
                }).catch((err) => setApiError(err.message)).finally(() => setIsGeneratingReport(false));
              }
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm"
          >
            End Session
          </button>
        </div>
      </div>

      {/* ── Main Grid ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── Left: Question + Answer ────────────────────────────────────── */}
        <div className="lg:col-span-8 space-y-5">

          {/* Question Card */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-secondary shadow-md space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                  Question {questionNumber} of {totalQuestions}
                </span>
                {currentQ?.category && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${CATEGORY_COLOR[currentQ.category] || 'bg-gray-100 text-gray-700'}`}>
                    {CATEGORY_LABELS[currentQ.category] || currentQ.category}
                  </span>
                )}
                {currentQ?.difficulty && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    currentQ.difficulty === 'easy' ? 'bg-emerald-100 text-emerald-800' :
                    currentQ.difficulty === 'hard' ? 'bg-rose-100 text-rose-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {currentQ.difficulty}
                  </span>
                )}
              </div>

              {/* TTS controls */}
              {ttsSupported && currentQ && (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => isSpeaking ? stopSpeaking() : speakText(currentQ.question)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                      isSpeaking ? 'bg-secondary text-on-secondary' : 'border border-secondary text-secondary hover:bg-secondary/5'
                    }`}
                    title={isSpeaking ? 'Stop speaking' : 'Replay question'}
                  >
                    <span className="material-symbols-outlined text-[14px]">{isSpeaking ? 'stop' : 'volume_up'}</span>
                    {isSpeaking ? 'Stop' : 'Replay'}
                  </button>
                </div>
              )}
            </div>

            {isGeneratingQuestion ? (
              <div className="flex items-center gap-3 py-4">
                <span className="material-symbols-outlined text-[24px] text-secondary animate-spin">progress_activity</span>
                <span className="text-sm text-on-surface-variant">AI is preparing your next question…</span>
              </div>
            ) : currentQ ? (
              <h2 className="font-headline-sm text-lg font-bold text-primary leading-snug">
                {currentQ.question}
              </h2>
            ) : apiError ? (
              <div className="space-y-2">
                <p className="text-sm text-error">{apiError}</p>
                <button
                  type="button"
                  onClick={retryQuestion}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all"
                >
                  Retry
                </button>
              </div>
            ) : null}

            {currentQ?.skill && (
              <p className="text-[11px] text-on-surface-variant">
                <span className="font-semibold">Assesses:</span> {currentQ.skill}
              </p>
            )}
          </div>

          {/* Mini Evaluation Feedback (after submit, non-intrusive) */}
          {lastAnswerResult && !isEvaluating && (
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex items-start gap-3 animate-pulse-once">
              <span className="material-symbols-outlined text-[20px] text-secondary mt-0.5 flex-shrink-0">check_circle</span>
              <div className="text-xs text-on-surface-variant space-y-1 flex-1">
                <p className="font-bold text-primary">
                  Answer recorded — Score: {lastAnswerResult.score}/10
                </p>
                {(lastAnswerResult.strengths || []).length > 0 && (
                  <p className="text-emerald-700">✓ {lastAnswerResult.strengths[0]}</p>
                )}
                {(lastAnswerResult.improvements || []).length > 0 && (
                  <p className="text-amber-700">↑ {lastAnswerResult.improvements[0]}</p>
                )}
              </div>
            </div>
          )}

          {isEvaluating && (
            <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high flex items-center gap-3">
              <span className="material-symbols-outlined text-[20px] text-secondary animate-spin flex-shrink-0">progress_activity</span>
              <span className="text-xs text-on-surface-variant">AI is evaluating your answer…</span>
            </div>
          )}

          {/* ── Answer Section ──────────────────────────────────────────── */}
          {currentQ && !isGeneratingQuestion && (
            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Your Answer</span>
                {/* Answer mode toggle */}
                <div className="flex rounded-lg bg-surface-container-lowest border border-surface-container-high p-0.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => { setAnswerMode('text'); stopVoiceRecording(); setVoiceState('idle'); }}
                    className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition-colors ${
                      answerMode === 'text' ? 'bg-secondary text-on-secondary' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[12px]">keyboard</span>
                    Text
                  </button>
                  <button
                    type="button"
                    onClick={() => { setAnswerMode('voice'); }}
                    disabled={!sttSupported}
                    className={`px-2.5 py-1 rounded-md font-bold flex items-center gap-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                      answerMode === 'voice' ? 'bg-secondary text-on-secondary' : 'text-on-surface-variant hover:text-on-surface'
                    }`}
                    title={!sttSupported ? 'Speech recognition not supported in this browser' : ''}
                  >
                    <span className="material-symbols-outlined text-[12px]">mic</span>
                    Voice
                  </button>
                </div>
              </div>

              {/* Voice Controls */}
              {answerMode === 'voice' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-3">
                    {voiceState === 'idle' && (
                      <button
                        type="button"
                        onClick={startVoiceRecording}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-secondary text-on-secondary font-bold text-sm hover:bg-secondary-container transition-all shadow-sm"
                      >
                        <span className="material-symbols-outlined text-[20px]">mic</span>
                        Start Speaking
                      </button>
                    )}
                    {voiceState === 'listening' && (
                      <button
                        type="button"
                        onClick={stopVoiceRecording}
                        className="flex items-center gap-2 px-5 py-3 rounded-xl bg-red-600 text-white font-bold text-sm hover:bg-red-700 transition-all shadow-sm animate-pulse"
                      >
                        <span className="material-symbols-outlined text-[20px]">stop</span>
                        Stop Recording
                      </button>
                    )}
                    {voiceState === 'processing' && (
                      <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[20px] text-secondary animate-spin">progress_activity</span>
                        Processing speech…
                      </div>
                    )}
                    {voiceState === 'done' && (
                      <button
                        type="button"
                        onClick={() => { setVoiceState('idle'); setUserAnswer(''); }}
                        className="text-xs text-outline hover:text-on-surface flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[14px]">refresh</span>
                        Record Again
                      </button>
                    )}
                  </div>

                  {voiceState === 'listening' && (
                    <div className="flex items-center justify-center gap-1 h-8">
                      {[40, 65, 80, 55, 90, 40, 75, 50, 85, 35, 70].map((h, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-red-500 rounded-full transition-all duration-150 animate-pulse"
                          style={{ height: `${h}%`, animationDelay: `${i * 0.1}s` }}
                        />
                      ))}
                    </div>
                  )}

                  {!sttSupported && (
                    <p className="text-xs text-amber-700 bg-amber-50 p-2 rounded-lg">
                      Speech recognition is not supported in your browser. Please use text input.
                    </p>
                  )}
                </div>
              )}

              {/* Transcript / Text area */}
              <textarea
                ref={answerBoxRef}
                rows={4}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder={
                  answerMode === 'voice'
                    ? 'Your spoken answer will appear here. You can edit before submitting…'
                    : 'Type your answer here…'
                }
                className="w-full p-3.5 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-secondary leading-relaxed resize-none"
                disabled={isEvaluating || isGeneratingQuestion}
              />

              {/* Submit */}
              <div className="flex items-center justify-between gap-3">
                {apiError && (
                  <p className="text-xs text-error flex-1">{apiError}</p>
                )}
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={!userAnswer.trim() || isEvaluating || isGeneratingQuestion}
                  className="ml-auto px-5 py-2.5 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5"
                >
                  {isEvaluating ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                      Evaluating…
                    </>
                  ) : (
                    <>
                      Submit Answer
                      <span className="material-symbols-outlined text-[16px]">send</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Conversation Log */}
          {questionsAnswered.length > 0 && (
            <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-3">
              <h3 className="font-title-md font-bold text-primary text-sm">Session Log</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {questionsAnswered.map((qa, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="p-3 rounded-xl bg-surface-container-low border border-surface-container-high text-xs text-primary">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-secondary">🤖 AI Interviewer</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${CATEGORY_COLOR[qa.category] || 'bg-gray-100 text-gray-700'}`}>
                          {CATEGORY_LABELS[qa.category] || qa.category}
                        </span>
                      </div>
                      {qa.question}
                    </div>
                    <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/20 text-xs text-on-surface ml-6">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-secondary">👤 You</span>
                        {qa.evaluation && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                            qa.evaluation.score >= 7 ? 'bg-emerald-100 text-emerald-800' :
                            qa.evaluation.score >= 5 ? 'bg-amber-100 text-amber-800' :
                            'bg-rose-100 text-rose-800'
                          }`}>
                            {qa.evaluation.score}/10
                          </span>
                        )}
                      </div>
                      {qa.answer}
                    </div>
                  </div>
                ))}
                <div ref={dialogueEndRef} />
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Live Metrics ────────────────────────────────────────── */}
        <div className="lg:col-span-4 space-y-5">
          {/* Live Score Gauges */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-secondary">analytics</span>
              Live Performance
            </h3>

            {questionsAnswered.length === 0 ? (
              <p className="text-xs text-on-surface-variant">Answer questions to see live scores here.</p>
            ) : (
              <div className="space-y-3">
                {(() => {
                  const scored = questionsAnswered.filter((qa) => qa.evaluation);
                  const avg = (field) => scored.length
                    ? Math.round(scored.reduce((sum, qa) => sum + (qa.evaluation[field] || 0), 0) / scored.length)
                    : 0;
                  return (
                    <>
                      <ScoreBar label="Technical Accuracy" value={avg('technicalAccuracy') * 10} color="bg-secondary" />
                      <ScoreBar label="Clarity" value={avg('clarity') * 10} color="bg-emerald-500" />
                      <ScoreBar label="Completeness" value={avg('completeness') * 10} color="bg-purple-500" />
                      <ScoreBar label="Relevance" value={avg('relevance') * 10} color="bg-amber-500" />
                      <div className="pt-2 border-t border-surface-container-high">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-bold text-primary">Overall Avg</span>
                          <span className="font-extrabold text-secondary">
                            {Math.round(scored.reduce((sum, qa) => sum + (qa.evaluation?.score || 0), 0) / scored.length * 10)}/100
                          </span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            {lastAnswerResult && (lastAnswerResult.strengths || []).length > 0 && (
              <div className="pt-2 border-t border-surface-container-high space-y-2">
                <span className="text-[10px] font-bold text-primary uppercase tracking-wider block">
                  Last Answer Feedback
                </span>
                {(lastAnswerResult.strengths || []).slice(0, 2).map((note, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-emerald-700 p-2 rounded-lg bg-emerald-50">
                    <span className="material-symbols-outlined text-[14px] mt-0.5 flex-shrink-0">thumb_up</span>
                    <span className="leading-snug">{note}</span>
                  </div>
                ))}
                {(lastAnswerResult.improvements || []).slice(0, 1).map((note, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-amber-700 p-2 rounded-lg bg-amber-50">
                    <span className="material-symbols-outlined text-[14px] mt-0.5 flex-shrink-0">lightbulb</span>
                    <span className="leading-snug">{note}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Application Info */}
          {application && (
            <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-2">
              <h3 className="font-bold text-xs text-primary uppercase tracking-wider">Interviewing For</h3>
              <div className="text-xs text-on-surface-variant space-y-1">
                <p className="font-semibold text-primary">{application.company}</p>
                <p>{application.role}</p>
                {application.location && <p className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">location_on</span>{application.location}</p>}
                {application.stipend && <p className="flex items-center gap-1"><span className="material-symbols-outlined text-[12px]">payments</span>{application.stipend}</p>}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="p-4 rounded-2xl bg-secondary/5 border border-secondary/20 space-y-2">
            <h3 className="font-bold text-xs text-secondary uppercase tracking-wider">Interview Tips</h3>
            <ul className="space-y-1.5 text-[11px] text-on-surface-variant">
              {[
                'Use the STAR method for behavioral questions',
                'Mention specific technologies you used in projects',
                'Think aloud to show problem-solving approach',
                'Ask for clarification if a question is unclear',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-1.5">
                  <span className="material-symbols-outlined text-[12px] text-secondary mt-0.5 flex-shrink-0">tips_and_updates</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
