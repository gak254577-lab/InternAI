import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function PreparationRoadmapPage() {
  const { roadmap, toggleRoadmapTask, recalculateRoadmap, studentProfile, navigate } = useApp();
  const [activeTab, setActiveTab] = useState('timeline');
  const [copiedCode, setCopiedCode] = useState(false);
  const [recalculatedSuccess, setRecalculatedSuccess] = useState(false);

  const activeMilestone = roadmap[1] || roadmap[0];

  const handleRecalculate = () => {
    recalculateRoadmap();
    setRecalculatedSuccess(true);
    setTimeout(() => setRecalculatedSuccess(false), 3000);
  };

  const copySandboxCode = () => {
    if (activeMilestone?.sandboxSnippet) {
      navigator.clipboard.writeText(activeMilestone.sandboxSnippet);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  return (
    <div className="p-space-md lg:p-space-lg max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-xs font-semibold uppercase tracking-wider mb-2">
            <span className="material-symbols-outlined text-[14px]">psychology</span>
            Custom Tailored for Razorpay &amp; Google SDE
          </div>
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-primary">
            AI Preparation Roadmap
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Dynamic milestone sprint structured around your verified coursework and target internship skill gaps.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleRecalculate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-container text-on-primary text-xs font-semibold hover:bg-primary transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">
              neurology
            </span>
            <span>{recalculatedSuccess ? 'Roadmap Recalculated!' : 'Recalculate Roadmap'}</span>
          </button>
          <button
            type="button"
            onClick={() => alert('Study notes exported to Markdown format!')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">download_for_offline</span>
            <span>Export Notes</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Roadmap Timeline (8 cols) + AI Progress & Resources (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column (8 cols): Milestones */}
        <div className="lg:col-span-8 space-y-6">
          <div className="space-y-4">
            {roadmap.map((m) => {
              const isCompleted = m.status === 'completed';
              const isInProgress = m.status === 'in_progress';
              return (
                <div
                  key={m.id}
                  className={`p-6 rounded-2xl bg-surface-container-lowest border transition-all ${
                    isInProgress
                      ? 'border-secondary shadow-md ring-1 ring-secondary/20'
                      : 'border-surface-container-high'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-surface-container-high">
                    <div className="flex items-center gap-2.5">
                      <span
                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800'
                            : isInProgress
                            ? 'bg-secondary text-on-secondary'
                            : 'bg-surface-container text-on-surface-variant'
                        }`}
                      >
                        W{m.weekNumber}
                      </span>
                      <h3 className="font-title-md font-bold text-primary text-base">{m.title}</h3>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-on-surface-variant font-medium">
                        {m.estimatedHours}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : isInProgress
                            ? 'bg-blue-50 text-secondary border border-blue-200'
                            : 'bg-surface-container text-outline'
                        }`}
                      >
                        {isCompleted ? 'Completed' : isInProgress ? 'In Progress' : 'Upcoming'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-on-surface-variant mt-3 leading-relaxed">
                    {m.description}
                  </p>

                  {/* Task checklist */}
                  <div className="mt-4 space-y-2">
                    {m.tasks.map((task) => (
                      <div
                        key={task.id}
                        onClick={() => toggleRoadmapTask(m.id, task.id)}
                        className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low/60 hover:bg-surface-container-low cursor-pointer transition-colors"
                      >
                        <span
                          className={`w-5 h-5 rounded flex items-center justify-center border text-xs flex-shrink-0 ${
                            task.completed
                              ? 'bg-secondary text-on-secondary border-secondary'
                              : 'border-outline-variant bg-surface-container-lowest'
                          }`}
                        >
                          {task.completed && <span className="material-symbols-outlined text-[14px]">check</span>}
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            task.completed ? 'line-through text-on-surface-variant' : 'text-on-surface'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Code Sandbox Preview for Active Sprint */}
                  {isInProgress && m.sandboxSnippet && (
                    <div className="mt-5 pt-4 border-t border-surface-container-high">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px] text-secondary">terminal</span>
                          Interactive Architecture Snippet (Cache-Aside with Distributed Lock)
                        </span>
                        <button
                          type="button"
                          onClick={copySandboxCode}
                          className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1"
                        >
                          <span className="material-symbols-outlined text-[14px]">content_copy</span>
                          {copiedCode ? 'Copied!' : 'Copy Code'}
                        </button>
                      </div>
                      <pre className="p-4 rounded-xl bg-primary text-white font-code text-[11px] overflow-x-auto leading-relaxed">
                        <code>{m.sandboxSnippet}</code>
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column (4 cols): Diagnostics & Resources */}
        <div className="lg:col-span-4 space-y-6">
          {/* Readiness Card */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm text-center">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              Overall Preparation Readiness
            </span>
            <div className="my-4 flex items-center justify-center">
              <div className="relative w-28 h-28 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-surface-container-highest"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3.5"
                  />
                  <path
                    className="text-secondary"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="currentColor"
                    strokeDasharray={`${studentProfile.readinessScore}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <span className="absolute font-display text-2xl font-black text-primary">
                  {studentProfile.readinessScore}%
                </span>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Completing Week 2 will increase your shortlist odds for <strong>Razorpay</strong> and <strong>Zepto</strong> to 96%.
            </p>

            <button
              type="button"
              onClick={() => navigate('mock-interview')}
              className="w-full mt-4 py-2.5 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">mic</span>
              <span>Test Knowledge in Mock Interview</span>
            </button>
          </div>

          {/* Curated Resources */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-3">
            <h3 className="font-title-md font-bold text-primary">
              Curated Study References
            </h3>
            <div className="space-y-2.5 text-xs">
              <a
                href="https://redis.io/docs/manual/patterns/distributed-locks/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors group"
              >
                <div>
                  <span className="font-semibold text-primary block group-hover:text-secondary">
                    Redis Redlock Algorithm
                  </span>
                  <span className="text-[11px] text-on-surface-variant">Distributed Mutex Invalidation</span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-secondary">
                  open_in_new
                </span>
              </a>

              <a
                href="https://github.com/donnemartin/system-design-primer"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors group"
              >
                <div>
                  <span className="font-semibold text-primary block group-hover:text-secondary">
                    System Design Primer
                  </span>
                  <span className="text-[11px] text-on-surface-variant">Caching, CDN &amp; Load Balancing</span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-secondary">
                  open_in_new
                </span>
              </a>

              <a
                href="https://react.dev/reference/react/useSyncExternalStore"
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low hover:bg-surface-container transition-colors group"
              >
                <div>
                  <span className="font-semibold text-primary block group-hover:text-secondary">
                    React Concurrent Deep-Dive
                  </span>
                  <span className="text-[11px] text-on-surface-variant">useSyncExternalStore Architecture</span>
                </div>
                <span className="material-symbols-outlined text-[16px] text-outline group-hover:text-secondary">
                  open_in_new
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
