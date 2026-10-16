import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function DashboardPage() {
  const { userProfile, currentUser } = useAuth();
  const {
    studentProfile,
    internships,
    applications,
    bookmarks,
    toggleBookmark,
    navigate,
    roadmap,
    toggleRoadmapTask,
    resumeAnalysis
  } = useApp();

  const profile = userProfile || studentProfile;
  const displayName = profile.name || currentUser?.displayName || 'Student Candidate';
  const firstName = displayName.split(' ')[0] || 'Student';
  const isProfileIncomplete = !profile.college || !profile.skills || profile.skills.length === 0;

  // 1. Applied Internships Count
  const appliedAppsCount = applications.filter((a) => a.column === 'applied' || a.column !== 'saved').length;
  const interviewCount = applications.filter((a) => a.column === 'interview').length;
  const currentSprint = roadmap[1] || roadmap[0];

  // 2. Current Resume ATS Score
  const atsScore =
    (resumeAnalysis && typeof resumeAnalysis.atsScore === 'number' && resumeAnalysis.atsScore > 0)
      ? resumeAnalysis.atsScore
      : (userProfile?.resumeMetadata?.atsScore ?? studentProfile?.resumeMetadata?.atsScore ?? 0);

  // 3. Avg Proficiency of Skill Progress
  const rawSkills = userProfile?.skills?.length
    ? userProfile.skills
    : (studentProfile?.skills || []);
  const normalizedSkills = rawSkills.map((s, idx) => {
    if (typeof s === 'string') {
      return { id: `skill-${idx}`, name: s.trim(), level: 65 };
    }
    return {
      id: s?.id || `skill-${idx}`,
      name: s?.name || String(s),
      level: typeof s?.level === 'number' ? s.level : 65
    };
  });
  const avgProficiency = normalizedSkills.length > 0
    ? Math.round(normalizedSkills.reduce((acc, s) => acc + s.level, 0) / normalizedSkills.length)
    : 0;

  return (
    <div className="p-space-md lg:p-space-lg max-w-7xl mx-auto space-y-space-lg">
      {/* Top Banner & Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-primary flex items-center gap-2">
            Good morning, {firstName} <span className="text-2xl">👋</span>
          </h1>
          <p className="font-body-md text-sm text-on-surface-variant mt-1">
            {profile.degree || 'Engineering Student'} {profile.college ? `• ${profile.college}` : ''}
          </p>
        </div>
      </div>

      {/* Onboarding Prompt Banner for New / Incomplete Users */}
      {isProfileIncomplete && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-500/10 via-teal-500/10 to-transparent border border-secondary/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-secondary/15 text-secondary flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[24px]">school</span>
            </div>
            <div>
              <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                <span>Complete Your Student Profile</span>
                <span className="text-[10px] uppercase tracking-wider bg-secondary/20 text-secondary px-2 py-0.5 rounded-full font-bold">
                  Recommended
                </span>
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Fill in your college, degree, and skills to unlock 95%+ accurate AI-matched internships and personalized roadmap.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('onboarding')}
            className="px-5 py-2.5 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all flex items-center justify-center gap-1.5 shadow-md flex-shrink-0"
          >
            <span>Fill Profile Now</span>
            <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
          </button>
        </div>
      )}

      {/* 4 Stat KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Apps (Applied Internships) */}
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
            <span className="font-display text-3xl font-bold text-primary">{appliedAppsCount}</span>
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {appliedAppsCount === 0 ? 'No applied internships yet' : `${appliedAppsCount} internship${appliedAppsCount > 1 ? 's' : ''} applied`}
          </p>
        </div>

        {/* Card 2: Resume ATS Score */}
        <div
          onClick={() => navigate('resume-analyzer')}
          className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high hover:border-secondary hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Resume ATS Score</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">fact_check</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-secondary">
              {atsScore > 0 ? `${atsScore}%` : '0%'}
            </span>
            {atsScore >= 75 ? (
              <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                Strong ATS
              </span>
            ) : atsScore > 0 ? (
              <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                Needs Work
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider font-bold bg-surface-container text-outline px-2 py-0.5 rounded-full border border-outline-variant/40">
                Not Scanned
              </span>
            )}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {atsScore > 0 ? 'Current ATS keyword match score' : 'Upload resume in AI Analyzer to score'}
          </p>
        </div>

        {/* Card 3: Interviews Scheduled */}
        <div
          onClick={() => navigate('mock-interview')}
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

        {/* Card 4: Avg Skill Proficiency */}
        <div
          onClick={() => navigate('skill-progress')}
          className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high hover:border-secondary hover:shadow-md transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">Avg Proficiency</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <span className="material-symbols-outlined text-[18px]">trending_up</span>
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="font-display text-3xl font-bold text-primary">
              {avgProficiency}%
            </span>
            {avgProficiency >= 75 ? (
              <span className="text-[10px] uppercase tracking-wider font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                Advanced
              </span>
            ) : avgProficiency >= 50 ? (
              <span className="text-[10px] uppercase tracking-wider font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                Intermediate
              </span>
            ) : avgProficiency > 0 ? (
              <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full border border-amber-200">
                Beginner
              </span>
            ) : (
              <span className="text-[10px] uppercase tracking-wider font-bold bg-surface-container text-outline px-2 py-0.5 rounded-full border border-outline-variant/40">
                No Skills
              </span>
            )}
          </div>
          <p className="text-[11px] text-on-surface-variant mt-1">
            {normalizedSkills.length > 0
              ? `Skill progress across ${normalizedSkills.length} tracked skill${normalizedSkills.length > 1 ? 's' : ''}`
              : 'Add skills in Skill Progress to track'}
          </p>
        </div>
      </div>

      {/* Main Content Feed (Full Width) */}
      <div className="space-y-space-lg">
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

            {internships.length === 0 ? (
              <div className="p-8 rounded-2xl border-2 border-dashed border-outline-variant/40 flex flex-col items-center gap-3 text-center">
                <span className="material-symbols-outlined text-[36px] text-secondary/50">work_outline</span>
                <div>
                  <p className="font-bold text-sm text-primary">No internships loaded yet</p>
                  <p className="text-xs text-on-surface-variant mt-1">Go to Explore Internships to fetch live listings from Adzuna &amp; LinkedIn.</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('explore-internships')}
                  className="px-4 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:opacity-90 transition-all"
                >
                  Explore Internships
                </button>
              </div>
            ) : (
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
            )}
          </div>
        </div>
      </div>
  );
}
