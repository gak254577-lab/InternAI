import React from 'react';

/**
 * ApplyConfirmationModal
 * 
 * Pops up when the user returns to the InternAI tab after visiting
 * an external internship application link (e.g., LinkedIn, Adzuna, or company career portal).
 */
export default function ApplyConfirmationModal({
  job,
  onConfirmApplied,
  onSaveForLater,
  onDismiss,
  onViewApplications,
}) {
  if (!job) return null;

  const logoText = job.logoText || (job.company ? job.company.slice(0, 2).toUpperCase() : 'IN');
  const logoBg = job.logoBg || 'bg-blue-600 text-white';

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(6px)' }}
      role="dialog"
      aria-modal="true"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-2xl p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Dismiss"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>

        {/* Icon & Heading */}
        <div className="flex flex-col items-center text-center gap-3 pt-1">
          <div className="w-14 h-14 rounded-2xl bg-secondary/15 flex items-center justify-center ring-4 ring-secondary/10">
            <span className="material-symbols-outlined text-3xl text-secondary">
              help_outline
            </span>
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-on-surface leading-tight">
              Did you apply for this internship?
            </h2>
            <p className="text-xs text-on-surface-variant mt-1.5 leading-relaxed">
              We noticed you visited the application page for{' '}
              <strong className="text-on-surface">{job.company || 'this role'}</strong>.
              Keep your tracking pipeline up-to-date!
            </p>
          </div>
        </div>

        {/* Internship Summary Card */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-surface-container-low border border-surface-container">
          <div
            className={`w-11 h-11 rounded-xl ${logoBg} flex items-center justify-center font-extrabold text-base flex-shrink-0 shadow-sm`}
          >
            {logoText}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-on-surface truncate">{job.title || 'Internship'}</p>
            <p className="text-xs text-on-surface-variant truncate">
              {job.company || 'Company'} · {job.location || 'Remote / India'}
            </p>
            {job.stipend && (
              <p className="text-[11px] font-semibold text-secondary mt-0.5">
                {typeof job.stipend === 'number' ? `₹${job.stipend.toLocaleString()}/mo` : job.stipend}
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-1">
          {/* Option 1: Yes, I applied */}
          <button
            type="button"
            onClick={onConfirmApplied}
            className="w-full py-3 px-4 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all shadow-md flex items-center justify-center gap-2 group"
          >
            <span className="material-symbols-outlined text-[18px] group-hover:scale-110 transition-transform">
              check_circle
            </span>
            <span>Yes, I Applied! Add to Applications</span>
          </button>

          {/* Option 2: Save for later */}
          <button
            type="button"
            onClick={onSaveForLater}
            className="w-full py-2.5 px-4 rounded-xl border border-surface-container-high bg-surface-container-low hover:bg-surface-container text-on-surface text-xs font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px] text-secondary">
              bookmark_add
            </span>
            <span>Not Yet, Save to Wishlist</span>
          </button>

          {/* Option 3: Didn't apply */}
          <button
            type="button"
            onClick={onDismiss}
            className="w-full py-2 text-center text-xs text-on-surface-variant hover:text-on-surface font-medium transition-colors"
          >
            Didn't apply, dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
