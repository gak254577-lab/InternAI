import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { checkEligibility } from '../utils/eligibility';

export default function InternshipDetailsPage() {
  const { selectedInternship, bookmarks, toggleBookmark, addApplication, navigate, applications, studentProfile } = useApp();
  const { userProfile } = useAuth();
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const job = selectedInternship;
  const isSaved = bookmarks.includes(job.id);
  const alreadyApplied = applications.some((a) => a.internshipId === job.id);

  // Prefer the real Firestore profile; fall back to the mock profile if it isn't loaded.
  const profile = userProfile || studentProfile;
  const eligibility = useMemo(() => checkEligibility(profile, job || {}), [profile, job]);

  if (!job) {
    return (
      <div className="p-space-md lg:p-space-lg max-w-3xl mx-auto text-center py-20">
        <span className="material-symbols-outlined text-5xl text-outline mb-3">search_off</span>
        <h2 className="font-headline-sm text-lg font-bold text-primary">No internship selected</h2>
        <p className="text-sm text-on-surface-variant mt-1 mb-6">
          Head back to the explorer and pick an internship to view its details.
        </p>
        <button
          type="button"
          onClick={() => navigate('explore-internships')}
          className="px-5 py-2.5 rounded-xl bg-secondary text-on-secondary text-sm font-bold hover:bg-secondary-container transition-all shadow-sm"
        >
          Browse Internships
        </button>
      </div>
    );
  }

  const handleApply = () => {
    if (!alreadyApplied) {
      addApplication({
        internshipId: job.id,
        company: job.company,
        role: job.title,
        status: 'applied',
        location: job.location,
        stipend: `₹${job.stipend.toLocaleString()}/mo`,
        nextEvent: 'Application Submitted • Awaiting Recruiter Review',
        notes: `Applied through InternAI with 1-click tailored resume. AI Match Score: ${job.matchScore}%.`,
        column: 'applied'
      });
    }
    setAppliedSuccess(true);
    setTimeout(() => {
      navigate('my-applications');
    }, 1200);
  };

  return (
    <div className="p-space-md lg:p-space-lg max-w-7xl mx-auto space-y-space-lg">
      {/* Back button breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('explore-internships')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-secondary hover:underline"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Back to All Internships</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => toggleBookmark(job.id)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-xs font-semibold text-on-surface hover:text-secondary hover:border-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">
              {isSaved ? 'bookmark' : 'bookmark_border'}
            </span>
            <span>{isSaved ? 'Saved Role' : 'Save Role'}</span>
          </button>
          <button
            type="button"
            onClick={() => alert(`Internship link copied: ${window.location.href}`)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-surface-container-high bg-surface-container-lowest text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">ios_share</span>
            <span>Export Spec</span>
          </button>
        </div>
      </div>

      {/* Role Hero Card */}
      <div className="p-6 lg:p-8 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-start gap-5">
          <div className={`w-16 h-16 rounded-2xl ${job.logoBg} flex-shrink-0 flex items-center justify-center font-extrabold text-3xl shadow-sm`}>
            {job.logoText}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-primary">
                {job.title}
              </h1>
              <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                {job.matchScore}% Match
              </span>
            </div>
            <p className="text-sm font-semibold text-on-surface mt-1">
              {job.company} • <span className="text-on-surface-variant font-normal">{job.team}</span>
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-on-surface-variant mt-2 font-medium">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-secondary">location_on</span>
                {job.location}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
                {job.roleType} ({job.duration})
              </span>
              <span className="flex items-center gap-1 font-bold text-primary">
                <span className="material-symbols-outlined text-[16px] text-secondary">payments</span>
                ₹{job.stipend.toLocaleString()}/month
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col gap-2.5 items-stretch md:items-end">
          <button
            type="button"
            disabled={alreadyApplied || appliedSuccess}
            onClick={handleApply}
            className={`px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${alreadyApplied || appliedSuccess
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-secondary text-on-secondary hover:bg-secondary-container hover:shadow-lg transform hover:-translate-y-0.5'
              }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {alreadyApplied || appliedSuccess ? 'check_circle' : 'rocket_launch'}
            </span>
            <span>
              {appliedSuccess
                ? 'Added to Applications Pipeline!'
                : alreadyApplied
                  ? 'Application Submitted'
                  : 'Apply with Tailored Resume'}
            </span>
          </button>
          <span className="text-[11px] text-outline text-center md:text-right">
            Closes on {job.deadline} • {job.applicantsCount} student applicants
          </span>
        </div>
      </div>

      {/* Two-Column Detail View: Specs (8) + AI Match Diagnostic (4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column (8 cols): Description & Requirements */}
        <div className="lg:col-span-8 space-y-6">
          {/* About Section */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high space-y-4">
            <h2 className="font-headline-sm text-lg font-bold text-primary">
              About the Role &amp; Team
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {job.description}
            </p>
          </div>

          {/* Responsibilities */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high space-y-4">
            <h2 className="font-headline-sm text-lg font-bold text-primary">
              Key Responsibilities
            </h2>
            <ul className="space-y-2.5 text-sm text-on-surface-variant">
              {job.responsibilities.map((resp, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-[18px] text-secondary flex-shrink-0 mt-0.5">
                    check_small
                  </span>
                  <span>{resp}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Tech Stack Chips */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high space-y-4">
            <h2 className="font-headline-sm text-lg font-bold text-primary">
              Primary Tech Stack &amp; Tools
            </h2>
            <div className="flex flex-wrap gap-2">
              {job.tags.map((t, idx) => (
                <div key={idx} className="px-3 py-1.5 rounded-lg bg-surface-container text-xs font-semibold text-primary">
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): AI Match & Criteria Breakdown */}
        <div className="lg:col-span-4 space-y-6">
          {/* Eligibility Check Card */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <span className="text-xs font-bold uppercase tracking-wider text-primary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">fact_check</span>
                Eligibility Check
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${eligibility.overallEligible
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}
              >
                {eligibility.overallEligible ? 'Eligible' : 'Check Requirements'}
              </span>
            </div>

            <div className="space-y-2">
              {eligibility.checks.map((check, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-container-low text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`material-symbols-outlined text-[16px] flex-shrink-0 ${check.passed ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                    >
                      {check.passed ? 'check_circle' : 'cancel'}
                    </span>
                    <span className="font-medium text-on-surface truncate" title={check.detail}>
                      {check.label}
                    </span>
                  </div>
                  <span className={`font-bold flex-shrink-0 ${check.passed ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {check.passed ? '✅' : '❌'}
                  </span>
                </div>
              ))}
            </div>

            <p
              className={`text-xs font-semibold leading-relaxed p-3 rounded-xl ${eligibility.overallEligible
                  ? 'bg-emerald-50 text-emerald-700'
                  : 'bg-amber-50 text-amber-700'
                }`}
            >
              {eligibility.verdict}
            </p>

            <p className="text-[10px] text-outline leading-relaxed">
              This check is based on the requirements listed by the internship provider. The final eligibility decision always belongs to the provider.
            </p>
          </div>

          {/* Overall Match Diagnostic Card */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px]">auto_awesome</span>
                AI Match Breakdown
              </span>
              <span className="text-2xl font-black text-secondary">{job.matchScore}%</span>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              {job.matchReason}
            </p>

            {/* Prerequisites Checklist */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-primary uppercase tracking-wider block">
                Requirements Checklist
              </span>
              {job.prerequisites.map((req, idx) => {
                const isMatched = req.status === 'matched';
                const isPartial = req.status === 'partial';
                return (
                  <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-surface-container-low text-xs">
                    <span
                      className={`material-symbols-outlined text-[18px] flex-shrink-0 ${isMatched
                          ? 'text-emerald-600'
                          : isPartial
                            ? 'text-amber-600'
                            : 'text-rose-600'
                        }`}
                    >
                      {isMatched ? 'check_circle' : isPartial ? 'change_circle' : 'cancel'}
                    </span>
                    <div>
                      <span className="font-medium text-on-surface leading-tight block">{req.name}</span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider mt-0.5 inline-block ${isMatched
                            ? 'text-emerald-700'
                            : isPartial
                              ? 'text-amber-700'
                              : 'text-rose-700'
                          }`}
                      >
                        {isMatched ? 'Verified Match' : isPartial ? 'Partial Match' : 'Skill Gap'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* AI Action Plan recommendation */}
            <div className="p-4 rounded-xl bg-gradient-to-br from-secondary/10 to-transparent border border-secondary/20">
              <span className="text-xs font-bold text-secondary flex items-center gap-1 mb-1">
                <span className="material-symbols-outlined text-[16px]">psychology</span>
                Actionable Recommendation
              </span>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Before your technical interview round with {job.company}, complete the <strong>Redis &amp; Distributed Caching</strong> milestone in your roadmap to bridge the only missing requirement.
              </p>
              <button
                type="button"
                onClick={() => navigate('preparation-roadmap')}
                className="mt-3 text-xs font-bold text-secondary hover:underline flex items-center gap-1"
              >
                Go to Preparation Roadmap <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
