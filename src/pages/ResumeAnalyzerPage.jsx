import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function ResumeAnalyzerPage() {
  const { resumeAnalysis, analyzeNewResume, studentProfile } = useApp();
  const [selectedRole, setSelectedRole] = useState('razorpay');
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file.name);
    }
  };

  const processFile = (fileName) => {
    setIsProcessing(true);
    setTimeout(() => {
      analyzeNewResume(fileName);
      setIsProcessing(false);
    }, 1200);
  };

  return (
    <div className="p-space-md lg:p-space-lg max-w-7xl mx-auto space-y-6">
      {/* Page Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-primary">
            AI Resume Analyzer
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Automated ATS parsing, quantified impact scoring, and tailored keyword gap detection.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all cursor-pointer shadow-sm">
            <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
            <span>{isProcessing ? 'Analyzing...' : 'Upload New Resume'}</span>
            <input
              type="file"
              accept=".pdf,.docx,.txt"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>
        </div>
      </div>

      {/* Main Grid: Upload & Analysis (8 cols) + Score Gauge & Matcher (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column (8 cols): Upload Area + Extracted Profile + Recommendations */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active File Banner */}
          <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <span className="material-symbols-outlined text-[24px]">picture_as_pdf</span>
              </div>
              <div>
                <h4 className="font-bold text-sm text-primary">{resumeAnalysis.fileName}</h4>
                <p className="text-xs text-on-surface-variant">Parsed on {resumeAnalysis.uploadDate}</p>
              </div>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              ATS Optimized
            </span>
          </div>

          {/* Actionable Recommendations Diff Blocks */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <h3 className="font-headline-sm text-lg font-bold text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-[20px] text-secondary">tips_and_updates</span>
                AI Actionable Bullet Recommendations
              </h3>
              <span className="text-xs font-bold text-secondary">
                {resumeAnalysis.recommendations.length} Suggestions
              </span>
            </div>

            <div className="space-y-4">
              {resumeAnalysis.recommendations.map((rec, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-primary">{rec.title}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {rec.impact}
                    </span>
                  </div>

                  {/* Current vs Suggested */}
                  <div className="space-y-1.5 text-xs">
                    <div className="p-2.5 rounded-lg bg-rose-50/70 border border-rose-200/60 text-rose-900 flex items-start gap-2">
                      <span className="font-bold text-[10px] uppercase text-rose-700 mt-0.5">Current:</span>
                      <span className="line-through">{rec.current}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200/60 text-emerald-900 flex items-start gap-2">
                      <span className="font-bold text-[10px] uppercase text-emerald-700 mt-0.5">Suggested:</span>
                      <span className="font-medium">{rec.suggested}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Extracted Profile Breakdown */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-4">
            <h3 className="font-headline-sm text-lg font-bold text-primary">
              Extracted Profile Breakdown
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-surface-container-low space-y-2">
                <span className="font-bold text-primary block uppercase tracking-wider text-[10px]">
                  Detected Skills (12)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {resumeAnalysis.parsedData.extractedSkills.map((s, idx) => (
                    <span key={idx} className="px-2 py-1 rounded bg-surface-container-lowest text-primary font-medium border border-outline-variant/30">
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-surface-container-low space-y-2">
                <span className="font-bold text-rose-700 block uppercase tracking-wider text-[10px]">
                  Missing Target Keywords (5)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {resumeAnalysis.parsedData.missingKeywordsForTargetRole.map((s, idx) => (
                    <span key={idx} className="px-2 py-1 rounded bg-rose-50 text-rose-800 font-medium border border-rose-200">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): ATS Score Dial & Role Matcher */}
        <div className="lg:col-span-4 space-y-6">
          {/* ATS Score Card */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm text-center">
            <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">
              ATS Compatibility Score
            </span>

            <div className="my-5 flex items-center justify-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
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
                    strokeDasharray={`${resumeAnalysis.atsScore}, 100`}
                    strokeLinecap="round"
                    strokeWidth="3.5"
                  />
                </svg>
                <span className="absolute font-display text-3xl font-black text-primary">
                  {resumeAnalysis.atsScore}%
                </span>
              </div>
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              Your resume outperforms <strong>91%</strong> of applicants in structural readability and quantified impact.
            </p>

            <button
              type="button"
              onClick={() => alert('Exporting full 4-page PDF Optimization audit...')}
              className="w-full mt-4 py-2.5 rounded-xl bg-surface-container-lowest border border-secondary text-secondary text-xs font-bold hover:bg-secondary hover:text-on-secondary transition-all shadow-sm flex items-center justify-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>Export Optimization Report</span>
            </button>
          </div>

          {/* Target Role Matcher */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-3">
            <h3 className="font-title-md font-bold text-primary">
              Target Role Compatibility
            </h3>

            <div className="space-y-3 pt-1">
              {[
                { company: 'Razorpay', role: 'SDE Intern', score: 94 },
                { company: 'Swiggy', role: 'Frontend Intern', score: 92 },
                { company: 'Cred', role: 'Backend Platform', score: 88 },
                { company: 'Google', role: 'SWE Summer Intern', score: 85 }
              ].map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-surface-container-low flex items-center justify-between">
                  <div>
                    <span className="font-bold text-xs text-primary block">{item.company}</span>
                    <span className="text-[11px] text-on-surface-variant">{item.role}</span>
                  </div>
                  <span className="px-2 py-1 rounded-md bg-surface-container-lowest text-secondary font-bold text-xs border border-secondary/30">
                    {item.score}% Match
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
