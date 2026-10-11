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
        userProfile: userProfile || {},
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
      <div className="p-space-md lg:p-space-lg max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-primary">Mock Interview</h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Select an internship application to start a personalized AI interview.
          </p>
        </div>

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
                    className="w-full py-2.5 rounded-xl bg-secondary text-on-secondary font-bold text-xs hover:bg-secondary-container transition-all flex items-center justify-center gap-2 shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[16px]">mic</span>
                    Practice Interview
                  </button>
                </div>
              );
            })}
          </div>
        )}
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
            <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[24px] text-secondary">mic</span>
            </div>
            <div>
              <h1 className="font-display text-xl font-extrabold text-primary">
                Interview for {application?.role}
              </h1>
              <p className="text-sm text-on-surface-variant mt-0.5">
                {application?.company}
                {application?.location ? ` • ${application.location}` : ''}
              </p>
            </div>
          </div>

          {/* What to expect */}
          <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high space-y-2">
            <h3 className="text-xs font-bold text-primary uppercase tracking-wider">What to Expect</h3>
            <ul className="space-y-1.5 text-xs text-on-surface-variant">
              {[
                'AI generates questions personalized to this internship and your profile',
                'Questions cover: Introduction → HR → Projects → Technical → Behavioral',
                'Answer by voice (microphone) or text — your choice',
                'AI evaluates each answer and adapts difficulty',
                'Full performance report at the end',
                'New question set each session — no repeats from past attempts',
              ].map((point, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-[14px] text-secondary mt-0.5 flex-shrink-0">check_circle</span>
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
