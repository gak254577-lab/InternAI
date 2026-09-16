import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export default function MockInterviewPage() {
  const { mockInterview, submitInterviewAnswer, navigate } = useApp();
  const [timer, setTimer] = useState(mockInterview.timerSeconds || 525);
  const [isPaused, setIsPaused] = useState(false);
  const [userAnswer, setUserAnswer] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  // Live Timer
  useEffect(() => {
    if (isPaused || sessionCompleted) return;
    const interval = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused, sessionCompleted]);

  const formatTimer = (totalSeconds) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerSubmit = (e) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;
    submitInterviewAnswer(userAnswer);
    setUserAnswer('');
    setIsRecording(false);
  };

  const simulateSpeech = () => {
    setIsRecording(true);
    setTimeout(() => {
      setUserAnswer(
        "To isolate high-frequency WebSocket updates from the main React hierarchy, we use useSyncExternalStore with a standalone event buffer. We subscribe directly to the WebSocket channel and batch updates using startTransition so urgent user keystrokes aren't blocked by financial stream deltas."
      );
      setIsRecording(false);
    }, 1500);
  };

  return (
    <div className="p-space-md lg:p-space-lg max-w-7xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-red-500 animate-ping"></div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 block">
              Live Mock Session Active
            </span>
            <h1 className="font-headline-sm text-base font-bold text-primary">
              {mockInterview.currentRole}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Timer Display */}
          <div className="px-4 py-2 rounded-xl bg-surface-container-low border border-surface-container-high font-code text-sm font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[16px] text-secondary">timer</span>
            <span>{formatTimer(timer)}</span>
          </div>

          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className="p-2 rounded-xl border border-surface-container-high hover:bg-surface-container-low text-on-surface-variant transition-colors"
            title={isPaused ? 'Resume Timer' : 'Pause Timer'}
          >
            <span className="material-symbols-outlined text-[20px]">
              {isPaused ? 'play_arrow' : 'pause'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSessionCompleted(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors shadow-sm"
          >
            End Session
          </button>
        </div>
      </div>

      {/* Main Grid: Stream & Dialogue (8 cols) + Real-Time Evaluation (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column (8 cols): Video/Audio simulator + Question Card + Response Box */}
        <div className="lg:col-span-8 space-y-6">
          {/* Question Card */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-secondary shadow-md space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                Question {mockInterview.questionNumber} of {mockInterview.totalQuestions} • Architecture &amp; State
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold">
                Technical Round
              </span>
            </div>

            <h2 className="font-headline-sm text-lg font-bold text-primary leading-snug">
              {mockInterview.currentQuestion.prompt}
            </h2>

            <div className="pt-2">
              <span className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1">
                Key Assessment Criteria Expected:
              </span>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-on-surface-variant">
                {mockInterview.currentQuestion.idealPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="material-symbols-outlined text-[14px] text-secondary mt-0.5">
                      check_circle
                    </span>
                    <span className="line-clamp-2">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Video Stream & Waveform Simulator */}
          <div className="relative rounded-2xl bg-primary-container overflow-hidden h-64 border border-surface-container-high flex flex-col justify-between p-4 text-white shadow-inner">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-black/40 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                Webcam &amp; Audio Stream Synced
              </span>
              <span className="text-xs text-white/70 font-code">1080p • 60 FPS</span>
            </div>

            {/* Centered Avatar */}
            <div className="flex flex-col items-center justify-center">
              <div className="relative">
                <img
                  alt="Student preview"
                  src="/images/student_avatar.png"
                  className="w-20 h-20 rounded-full object-cover ring-4 ring-secondary/40 shadow-xl"
                  onError={(e) => {
                    e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
                  }}
                />
                {isRecording && (
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-red-500 border-2 border-primary flex items-center justify-center animate-bounce">
                    <span className="material-symbols-outlined text-[14px] text-white">mic</span>
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-white mt-2">Aanya Sharma (Candidate)</p>
            </div>

            {/* Audio Waveform visualization */}
            <div className="flex items-center justify-center gap-1.5 h-6">
              {[40, 70, 90, 60, 100, 45, 80, 50, 95, 30, 85, 60, 40].map((h, i) => (
                <div
                  key={i}
                  className="w-1 bg-secondary rounded-full transition-all duration-150"
                  style={{ height: isRecording ? `${h}%` : '20%' }}
                ></div>
              ))}
            </div>
          </div>

          {/* Student Response Input */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Your Answer / Speech Transcript
              </span>
              <button
                type="button"
                onClick={simulateSpeech}
                className="text-xs font-bold text-secondary flex items-center gap-1 hover:underline"
              >
                <span className="material-symbols-outlined text-[16px]">record_voice_over</span>
                <span>{isRecording ? 'Listening...' : 'Simulate Voice Speech'}</span>
              </button>
            </div>

            <form onSubmit={handleAnswerSubmit} className="space-y-3">
              <textarea
                rows={3}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your technical response here, or click 'Simulate Voice Speech' to test speech-to-text..."
                className="w-full p-3.5 rounded-xl bg-surface border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-secondary leading-relaxed"
              ></textarea>

              <div className="flex justify-end gap-2.5">
                <button
                  type="submit"
                  disabled={!userAnswer.trim()}
                  className="px-5 py-2.5 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-1.5"
                >
                  <span>Submit Answer for AI Grading</span>
                  <span className="material-symbols-outlined text-[16px]">send</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Transcript Dialogue Stream */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-3">
            <h3 className="font-title-md font-bold text-primary">
              Session Conversation Log
            </h3>
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {mockInterview.transcriptLog.map((entry, idx) => {
                const isAI = entry.speaker === 'ai_interviewer';
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-xs ${
                      isAI
                        ? 'bg-surface-container-low text-primary border border-surface-container-high'
                        : 'bg-secondary/10 text-on-surface border border-secondary/20 ml-6'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-[11px] text-secondary">
                        {isAI ? '🤖 AI Interviewer' : '👤 Candidate (Aanya)'}
                      </span>
                      <span className="text-[10px] text-outline">{entry.timestamp}</span>
                    </div>
                    <p className="leading-relaxed">{entry.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Real-Time AI Evaluation Gauges */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-5">
            <h3 className="font-headline-sm text-base font-bold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-secondary">analytics</span>
              Live AI Metric Gauges
            </h3>

            {/* Gauges */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Technical Accuracy</span>
                  <span className="text-secondary font-bold">
                    {mockInterview.realtimeEvaluation.technicalAccuracy}%
                  </span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-secondary h-full rounded-full transition-all duration-500"
                    style={{ width: `${mockInterview.realtimeEvaluation.technicalAccuracy}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Communication Clarity</span>
                  <span className="text-emerald-600 font-bold">
                    {mockInterview.realtimeEvaluation.clarityScore}%
                  </span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${mockInterview.realtimeEvaluation.clarityScore}%` }}
                  ></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>System Architecture Depth</span>
                  <span className="text-purple-600 font-bold">
                    {mockInterview.realtimeEvaluation.architectureDepth}%
                  </span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-purple-500 h-full rounded-full transition-all duration-500"
                    style={{ width: `${mockInterview.realtimeEvaluation.architectureDepth}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {/* Feedback items */}
            <div className="pt-3 border-t border-surface-container-high space-y-2">
              <span className="text-[11px] font-bold text-primary uppercase tracking-wider block">
                Instant Evaluator Feedback
              </span>
              {mockInterview.realtimeEvaluation.feedbackNotes.map((note, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-on-surface-variant p-2 rounded-lg bg-surface-container-low">
                  <span className="material-symbols-outlined text-[16px] text-secondary mt-0.5 flex-shrink-0">
                    lightbulb
                  </span>
                  <span className="leading-snug">{note}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => navigate('preparation-roadmap')}
              className="w-full py-2.5 rounded-xl border border-secondary text-secondary text-xs font-bold hover:bg-secondary hover:text-on-secondary transition-all"
            >
              Review Related Roadmap Sprint
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
