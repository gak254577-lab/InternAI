import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { checkEligibility } from '../utils/eligibility';

// ─── "Did You Apply?" Confirmation Modal ─────────────────────────────────────
function ApplyConfirmationModal({ job, onYes, onNo, onLater, onClose }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="relative w-full max-w-md rounded-2xl shadow-2xl border border-surface-container-high p-6 space-y-5"
        style={{ background: 'var(--color-surface-container-lowest, #fff)' }}
      >
        {/* Close X */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant transition-colors"
          aria-label="Dismiss"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Icon + heading */}
        <div className="flex flex-col items-center text-center gap-3 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-secondary/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-secondary">help_outline</span>
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-primary leading-tight">
              Did you submit your application?
            </h2>
            <p className="text-xs text-on-surface-variant mt-1">
              You visited <strong>{job?.company || 'the company'}</strong>'s external site.
              Let us know so we can track your progress.
            </p>
          </div>
        </div>

        {/* Job summary pill */}
        {job && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-container border border-surface-container-high">
            <div className={`w-10 h-10 rounded-xl ${job.logoBg} flex items-center justify-center font-extrabold text-lg flex-shrink-0`}>
              {job.logoText}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-on-surface truncate">{job.title}</p>
              <p className="text-xs text-on-surface-variant truncate">{job.company} · {job.location}</p>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onYes}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">check_circle</span>
            Yes, I applied! ✅
          </button>
          <button
            type="button"
            onClick={onLater}
            className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-secondary text-secondary font-bold text-sm hover:bg-secondary/10 transition-all"
          >
            <span className="material-symbols-outlined text-[18px]">schedule</span>
            I'll apply later
          </button>
          <button
            type="button"
            onClick={onNo}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-on-surface-variant text-sm font-medium hover:bg-surface-container transition-all"
          >
            <span className="material-symbols-outlined text-[16px]">cancel</span>
            No, I didn't apply
          </button>
        </div>

        <p className="text-center text-[10px] text-outline leading-relaxed">
          Your tracking data is stored locally and helps you manage your application pipeline.
        </p>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

export default function InternshipDetailsPage() {
  const { selectedInternship, bookmarks, toggleBookmark, addApplication, navigate, applications, studentProfile } = useApp();
  const { userProfile } = useAuth();
  const [appliedSuccess, setAppliedSuccess] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const pendingExternalApply = useRef(false);

  const job = selectedInternship;
  const isSaved = bookmarks.includes(job?.id);
  const alreadyApplied = applications.some((a) => a.internshipId === job?.id);

  // Prefer the real Firestore profile; fall back to the mock profile if it isn't loaded.
  const profile = userProfile || studentProfile;
  const eligibility = useMemo(() => checkEligibility(profile, job || {}), [profile, job]);

  // ── Return-from-external-site detection ──────────────────────────────────
  // NOTE: window.open() keeps the original tab 'visible', so visibilitychange
  // does NOT fire. window 'focus' fires reliably when the user tabs back.
  const fallbackTimerRef = useRef(null);

  const triggerModal = useCallback(() => {
    if (!pendingExternalApply.current) return;
    pendingExternalApply.current = false;
    if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    // Small delay so the page paint settles before the modal pops in
    setTimeout(() => setShowApplyModal(true), 350);
  }, []);

  useEffect(() => {
    window.addEventListener('focus', triggerModal);
    return () => {
      window.removeEventListener('focus', triggerModal);
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
    };
  }, [triggerModal]);
  // ─────────────────────────────────────────────────────────────────────────

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

  /**
   * Opens the external apply URL in a new tab and arms the
   * visibility-change listener so we can prompt the user on return.
   */
  const handleExternalApply = () => {
    const externalUrl = job?.applyUrl || job?.url || job?.externalUrl ||
      (job?.source === 'linkedin'
        ? `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent((job.title || '') + ' ' + (job.company || ''))}`
        : `https://internshala.com/internships/${encodeURIComponent(job?.title || 'software')}`);

    // Arm the listener BEFORE opening the tab
    pendingExternalApply.current = true;
    window.open(externalUrl, '_blank', 'noopener,noreferrer');

    // Fallback: if the user doesn't switch tabs but closes the new one directly,
    // show the modal after 10 seconds anyway.
    fallbackTimerRef.current = setTimeout(() => {
      if (pendingExternalApply.current) triggerModal();
    }, 10000);
  };

  /** Called when user confirms "Yes, I applied" from the modal */
  const handleConfirmApplied = () => {
    setShowApplyModal(false);
    if (!alreadyApplied) {
      addApplication({
        internshipId: job.id,
        company: job.company,
        role: job.title,
        status: 'applied',
        location: job.location,
        stipend: job.stipend ? `₹${job.stipend.toLocaleString()}/mo` : '',
        nextEvent: 'Application Submitted • Awaiting Recruiter Review',
        notes: `Applied externally via ${job.source === 'linkedin' ? 'LinkedIn' : 'external site'}. AI Match Score: ${job.matchScore ?? '—'}%.`,
        column: 'applied',
        appliedExternally: true,
      });
    }
    setAppliedSuccess(true);
    setTimeout(() => navigate('my-applications'), 1200);
  };

  /** Called when user says "I'll apply later" */
  const handleApplyLater = () => {
    setShowApplyModal(false);
    if (!alreadyApplied) {
      addApplication({
        internshipId: job.id,
        company: job.company,
        role: job.title,
        status: 'pending',
        location: job.location,
        stipend: job.stipend ? `₹${job.stipend.toLocaleString()}/mo` : '',
        nextEvent: 'Pending — Application not yet submitted',
        notes: `Visited external site but did not apply yet. AI Match Score: ${job.matchScore ?? '—'}%.`,
        column: 'applied',
        appliedExternally: false,
      });
    }
  };

  /** Called when user says "No, I didn't apply" — just dismiss */
  const handleDidNotApply = () => {
    setShowApplyModal(false);
  };

  return (
    <div className="p-space-md lg:p-space-lg max-w-7xl mx-auto space-y-space-lg">
      {/* ── "Did You Apply?" Modal ── */}
      {showApplyModal && (
        <ApplyConfirmationModal
          job={job}
          onYes={handleConfirmApplied}
          onNo={handleDidNotApply}
          onLater={handleApplyLater}
          onClose={handleDidNotApply}
        />
      )}
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
          {/* External Apply button — opens LinkedIn/Internshala in new tab */}
          <button
            type="button"
            disabled={appliedSuccess}
            onClick={alreadyApplied ? undefined : handleExternalApply}
            className={`px-6 py-3 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              alreadyApplied || appliedSuccess
                ? 'bg-emerald-600 text-white cursor-default'
                : 'bg-secondary text-on-secondary hover:bg-secondary-container hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {alreadyApplied || appliedSuccess ? 'check_circle' : 'open_in_new'}
            </span>
            <span>
              {appliedSuccess
                ? 'Added to Applications Pipeline!'
                : alreadyApplied
                  ? 'Application Submitted'
                  : 'Apply on External Site'}
            </span>
          </button>
          {!alreadyApplied && !appliedSuccess && (
            <p className="text-[10px] text-outline text-center md:text-right leading-relaxed">
              <span className="material-symbols-outlined text-[12px] align-middle mr-0.5">info</span>
              Opens LinkedIn / Internshala. We'll ask if you applied when you return.
            </p>
          )}
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
