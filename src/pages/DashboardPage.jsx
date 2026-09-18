import React from 'react';
import { useApp } from '../context/AppContext';

export default function DashboardPage() {
  const {
    studentProfile,
    internships,
    applications,
    bookmarks,
    toggleBookmark,
    navigate,
    roadmap,
    toggleRoadmapTask
  } = useApp();

  const activeAppsCount = applications.filter((a) => a.column !== 'saved').length;
  const interviewCount = applications.filter((a) => a.column === 'interview').length;
  const currentSprint = roadmap[1] || roadmap[0];

  return (
    <div className="p-space-md lg:p-space-lg max-w-7xl mx-auto space-y-space-lg">
      {/* Top Banner & Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-primary flex items-center gap-2">
            Good morning, {studentProfile.name.split(' ')[0]} <span className="text-2xl">👋</span>
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant mt-1">
            {studentProfile.degree} • {studentProfile.college}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('profile')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-surface-container-lowest border border-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">tune</span>
            <span>Preferences</span>
          </button>

          <button
            type="button"
            onClick={() => navigate('roadmap')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary-container text-on-primary text-xs font-semibold hover:bg-primary transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">bolt</span>
            <span>Refresh AI Matches</span>
          </button>
        </div>
      </div>

      {/* 4 Stat KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Applications */}
        <div
          onClick={() => navigate('my-applications')}
          className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high hover:border-secondary hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Active Apps</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-secondary flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">send</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-primary">{activeAppsCount}</span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">{activeAppsCount === 0 ? 'No active applications yet' : `${activeAppsCount} application${activeAppsCount > 1 ? 's' : ''} in pipeline`}</p>
        </div>

        {/* Card 2: AI Readiness */}
        <div
          onClick={() => navigate('roadmap')}
          className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high hover:border-secondary hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">AI Readiness</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-secondary">{studentProfile.readinessScore}%</span>
            <span className="text-xs text-emerald-600 font-semibold">Tier 1 Target</span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">Based on verified coursework &amp; projects</p>
        </div>

        {/* Card 3: Interviews Scheduled */}
        <div
          onClick={() => navigate('my-applications')}
          className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high hover:border-secondary hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Interviews</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">videocam</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-primary">{interviewCount}</span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">{interviewCount === 0 ? 'No interviews scheduled' : `${interviewCount} interview${interviewCount > 1 ? 's' : ''} scheduled`}</p>
        </div>

        {/* Card 4: Prep Streak */}
        <div
          onClick={() => navigate('roadmap')}
          className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high hover:border-secondary hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Daily Streak</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">local_fire_department</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-primary">{studentProfile.streak || 0} Days</span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">Complete today's task to keep your streak going</p>
        </div>
      </div>

      {/* Main Grid: Recommended Feed (Col 8) + Sidebar Widgets (Col 4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg">
        {/* Left Column (8 cols): Top Matches + Current Sprint */}
        <div className="lg:col-span-8 space-y-space-lg">
          {/* Active Roadmap Sprint Progress Card */}
          {currentSprint && (
            <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
                <div className="flex items-center gap-2.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-secondary animate-pulse"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                    Active Study Sprint • Week {currentSprint.weekNumber}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('preparation-roadmap')}
                  className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1"
                >
                  Full Roadmap <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>

              <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <h3 className="font-headline-sm text-lg font-bold text-primary">{currentSprint.title}</h3>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-xl leading-relaxed">
                    {currentSprint.description}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs text-on-surface-variant font-medium">Sprint Completion</span>
                  <span className="text-2xl font-bold text-secondary">{currentSprint.completionPct}%</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-surface-container h-2 rounded-full mt-4 overflow-hidden">
                <div
                  className="bg-secondary h-full rounded-full transition-all duration-300"
                  style={{ width: `${currentSprint.completionPct}%` }}
                ></div>
              </div>

              {/* Checklist */}
              <div className="mt-4 space-y-2">
                {currentSprint.tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleRoadmapTask(currentSprint.id, task.id)}
                    className="flex items-center gap-3 p-2.5 rounded-lg bg-surface-container-low/50 hover:bg-surface-container-low cursor-pointer transition-colors"
                  >
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center border text-xs ${
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
            </div>
          )}

          {/* Recommended Internships Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-headline-sm text-lg font-bold text-primary">
                Recommended Internships
              </h2>
              <button
                type="button"
                onClick={() => navigate('explore-internships')}
                className="text-xs font-semibold text-secondary hover:underline flex items-center gap-1"
              >
                Browse All ({internships.length}) <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>

            <div className="space-y-3">
              {internships.slice(0, 4).map((job) => {
                const isSaved = bookmarks.includes(job.id);
                return (
                  <div
                    key={job.id}
                    className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high hover:border-secondary hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${job.logoBg} flex-shrink-0 flex items-center justify-center font-bold text-xl`}>
                        {job.logoText}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3
                            onClick={() => navigate('internship-details', job.id)}
                            className="font-title-md font-bold text-primary hover:text-secondary cursor-pointer"
                          >
                            {job.title}
                          </h3>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-200">
                            {job.matchScore}% Match
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant mt-0.5 font-medium">
                          {job.company} • {job.location} • {job.duration}
                        </p>
                        <p className="text-xs text-on-surface-variant mt-1 line-clamp-1">
                          {job.matchReason}
                        </p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {job.tags.slice(0, 4).map((t, idx) => (
                            <span key={idx} className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-[10px] font-medium">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 pt-3 sm:pt-0 border-surface-container-high">
                      <div className="text-left sm:text-right">
                        <span className="text-[10px] text-on-surface-variant block uppercase font-semibold">Stipend</span>
                        <span className="text-sm font-bold text-primary">₹{(job.stipend || 12000).toLocaleString('en-IN')}/mo</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleBookmark(job.id)}
                          aria-label="Bookmark internship"
                          className="p-2 rounded-lg border border-surface-container-high text-on-surface-variant hover:text-secondary hover:border-secondary transition-colors"
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {isSaved ? 'bookmark' : 'bookmark_border'}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('internship-details', job.id)}
                          className="px-3.5 py-1.5 rounded-lg bg-secondary text-on-secondary text-xs font-semibold hover:bg-secondary-container transition-colors"
                        >
                          Details &amp; Apply
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Deadlines + Quick Tools */}
        <div className="lg:col-span-4 space-y-space-lg">
          {/* Upcoming Deadlines & Interviews */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <h3 className="font-title-md font-bold text-primary">Deadlines &amp; Events</h3>
              <span className="text-xs font-bold text-secondary cursor-pointer" onClick={() => navigate('my-applications')}>
                View Board
              </span>
            </div>

            <div className="divide-y divide-surface-container-high mt-3">
              {applications.slice(0, 4).map((app) => (
                <div key={app.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-primary">{app.company}</p>
                      <p className="text-[11px] text-on-surface-variant">{app.role}</p>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-semibold uppercase">
                      {app.column}
                    </span>
                  </div>
                  <p className="text-xs text-secondary font-medium mt-1.5 flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px]">event</span>
                    {app.nextEvent}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Preparation Tools Widget */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-primary-container to-primary text-on-primary shadow-sm">
            <h3 className="font-headline-sm text-base font-bold text-white">AI Practice Room</h3>
            <p className="text-xs text-on-primary-container mt-1">
              Practice mock interviews with AI feedback tailored to your target roles and skill set.
            </p>

            <button
              type="button"
              onClick={() => navigate('mock-interview')}
              className="w-full mt-4 py-2.5 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">mic</span>
              <span>Launch Mock Interview</span>
            </button>
          </div>

          {/* Resume Quick Stats */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-title-md font-bold text-primary">Resume ATS Health</h4>
                <p className="text-xs text-on-surface-variant mt-0.5">Upload your resume to get started</p>
              </div>
              <span className="text-2xl font-extrabold text-secondary">—</span>
            </div>

            <div className="mt-3 p-2.5 rounded-lg bg-surface-container-low text-xs text-on-surface-variant">
              <span className="font-semibold text-primary block mb-0.5">Get Started:</span>
              Upload your resume on the Resume Analyzer page to receive AI-powered ATS feedback.
            </div>

            <button
              type="button"
              onClick={() => navigate('resume-analyzer')}
              className="w-full mt-3 py-2 rounded-lg border border-secondary text-secondary text-xs font-semibold hover:bg-secondary hover:text-on-secondary transition-colors"
            >
              Analyze &amp; Optimize
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
