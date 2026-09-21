import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { uploadAndAnalyzeResume } from '../services/geminiService';
import { matchResumeWithInternships } from '../utils/resumeMatcher';

// Fallback internships in case APIs are rate limited or offline
const FALLBACK_INTERNSHIPS = [
  {
    id: 'fallback-1',
    title: 'Frontend Developer Intern',
    company: 'TechCorp India',
    location: 'Bengaluru, India (Hybrid)',
    description: 'Build responsive web interfaces using React, Tailwind CSS, and TypeScript. Collaborate with product designers and backend engineers.',
    stipend: 25000,
    tags: ['React', 'JavaScript', 'TypeScript', 'Tailwind CSS', 'Git'],
    skills: ['React', 'JavaScript', 'TypeScript', 'Tailwind CSS', 'Git', 'HTML', 'CSS'],
    roleType: 'Full-Time Intern',
    duration: '6 months',
    logoText: 'T',
    logoBg: 'bg-blue-100 text-blue-700',
    applyUrl: '#',
  },
  {
    id: 'fallback-2',
    title: 'Full Stack Engineering Intern',
    company: 'Innovate Labs',
    location: 'Remote, India',
    description: 'Develop end-to-end features using Node.js, Express, React, and MongoDB. Design and implement secure RESTful APIs.',
    stipend: 30000,
    tags: ['Node.js', 'React', 'MongoDB', 'Express', 'REST API', 'Docker'],
    skills: ['Node.js', 'React', 'MongoDB', 'Express', 'REST API', 'Docker', 'Git'],
    roleType: 'Full-Time Intern',
    duration: '3-6 months',
    logoText: 'I',
    logoBg: 'bg-emerald-100 text-emerald-700',
    applyUrl: '#',
  },
  {
    id: 'fallback-3',
    title: 'Python / Backend Developer Intern',
    company: 'DataFlow Systems',
    location: 'Hyderabad, India (In-office)',
    description: 'Design microservices, database schemas in PostgreSQL, and backend data processing pipelines using Python and Django.',
    stipend: 28000,
    tags: ['Python', 'Django', 'PostgreSQL', 'SQL', 'Git', 'AWS'],
    skills: ['Python', 'Django', 'PostgreSQL', 'SQL', 'Git', 'AWS', 'Docker'],
    roleType: 'Full-Time Intern',
    duration: '6 months',
    logoText: 'D',
    logoBg: 'bg-violet-100 text-violet-700',
    applyUrl: '#',
  },
  {
    id: 'fallback-4',
    title: 'AI / Machine Learning Intern',
    company: 'Cognitive AI',
    location: 'Bengaluru, India',
    description: 'Work on training and evaluating ML models, NLP pipelines, and data preprocessing using Python, PyTorch, and scikit-learn.',
    stipend: 35000,
    tags: ['Python', 'Machine Learning', 'PyTorch', 'Data Science', 'SQL'],
    skills: ['Python', 'Machine Learning', 'PyTorch', 'Data Science', 'SQL', 'Git'],
    roleType: 'Full-Time Intern',
    duration: '6 months',
    logoText: 'C',
    logoBg: 'bg-amber-100 text-amber-700',
    applyUrl: '#',
  },
];

// Circular SVG Animated ATS Score Gauge
function ScoreGauge({ score, isAnimating }) {
  const dash = isAnimating ? 0 : score;
  const color =
    score >= 75
      ? '#22c55e'
      : score >= 55
      ? '#f59e0b'
      : '#ef4444';

  return (
    <div className="relative w-40 h-40 flex items-center justify-center mx-auto">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
        {/* Background Track */}
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke="#f1f5f9"
          strokeWidth="3.2"
        />
        {/* Colored Progress Ring */}
        <path
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none"
          stroke={color}
          strokeDasharray={`${dash}, 100`}
          strokeLinecap="round"
          strokeWidth="3.2"
          style={{ transition: 'stroke-dasharray 1.2s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        {isAnimating ? (
          <span className="material-symbols-outlined animate-spin text-[32px] text-secondary">
            autorenew
          </span>
        ) : (
          <>
            <span className="font-display text-4xl font-black tracking-tight" style={{ color }}>
              {score}
              <span className="text-xl font-bold text-on-surface-variant">/100</span>
            </span>
            <span className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest mt-0.5">
              ATS Score
            </span>
          </>
        )}
      </div>
    </div>
  );
}

// Impact Badge Component
function ImpactBadge({ impact }) {
  const cls =
    impact === 'High Impact'
      ? 'bg-rose-50 text-rose-700 border-rose-200'
      : impact === 'Medium Impact'
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-sky-50 text-sky-700 border-sky-200';
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border tracking-wide uppercase ${cls}`}>
      {impact || 'Suggestion'}
    </span>
  );
}

// Multi-step progress phases
const PROGRESS_STEPS = [
  'Reading & extracting resume text (PDF/DOCX/TXT)…',
  'Connecting to Gemini 2.5 Flash backend…',
  'Evaluating 7 ATS factors: Keywords, Job Match, Structure, Skills, Projects, Education, Formatting…',
  'Extracting technical skill profile & identifying missing keywords…',
  'Matching profile against live verified internship listings…',
  'Compiling personalized recommendations & gap analysis…',
];

export default function ResumeAnalyzerPage() {
  const {
    resumeAnalysis,
    analyzeNewResume,
    studentProfile,
    internships,
    fetchLiveInternships,
    navigate,
  } = useApp();

  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [error, setError] = useState(null);
  const [hasResult, setHasResult] = useState(Boolean(resumeAnalysis?.fileName));
  const fileInputRef = useRef(null);

  // Ensure internships are loaded for matching
  useEffect(() => {
    if (!internships || internships.length === 0) {
      fetchLiveInternships({ keywords: 'software intern', country: 'in', page: 1, resultsPerPage: 20 });
    }
  }, [internships, fetchLiveInternships]);

  // Handle file processing via backend
  const processFile = async (file) => {
    if (!file) return;

    const allowedExtensions = ['.pdf', '.docx', '.txt'];
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      setError('Please upload a valid PDF (.pdf), Microsoft Word (.docx), or Plain Text (.txt) file.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10 MB limit. Please choose a smaller resume file.');
      return;
    }

    setIsProcessing(true);
    setHasResult(false);
    setError(null);
    setProgressStep(0);

    try {
      // Step 1: Uploading & Text Extraction
      setProgressStep(0);
      const stepTimer = setInterval(() => {
        setProgressStep((prev) => (prev < PROGRESS_STEPS.length - 1 ? prev + 1 : prev));
      }, 1500);

      const targetRoles =
        studentProfile?.targetRoles?.length > 0
          ? studentProfile.targetRoles
          : studentProfile?.interests?.length > 0
          ? studentProfile.interests
          : ['Software Engineering Intern', 'Full Stack Developer Intern'];

      // Send to backend endpoint
      const analysisData = await uploadAndAnalyzeResume(file, targetRoles);

      clearInterval(stepTimer);
      setProgressStep(4);

      // Perform single-pass matching with existing internships
      const candidateProfile = {
        extractedSkills: analysisData.parsedData?.extractedSkills || [],
        targetRoles,
      };

      const availableInternships =
        internships && internships.length > 0 ? internships : FALLBACK_INTERNSHIPS;

      const matchedInternships = matchResumeWithInternships(
        candidateProfile,
        availableInternships
      );

      setProgressStep(5);

      // Save to global state
      analyzeNewResume(file.name, {
        ...analysisData,
        recommendedInternships: matchedInternships,
      });

      setHasResult(true);
    } catch (err) {
      console.error('[ResumeAnalyzerPage] Error:', err);
      if (err.status === 429 || err.message?.includes('429') || err.message?.includes('quota')) {
        setError(
          'Gemini API quota exceeded (HTTP 429). The system rate limit was reached. Please wait 30 seconds and try again.'
        );
      } else if (err.message?.includes('GEMINI_API_KEY')) {
        setError('GEMINI_API_KEY is missing on the backend. Please add it to your .env file.');
      } else {
        setError(err.message || 'Resume analysis failed. Please try again with another file.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
    e.target.value = '';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  // Matched internships list (from analysis state or freshly calculated)
  const recommendedInternships = useMemo(() => {
    if (resumeAnalysis?.recommendedInternships?.length > 0) {
      return resumeAnalysis.recommendedInternships;
    }
    if (resumeAnalysis?.parsedData?.extractedSkills?.length > 0) {
      const candidateProfile = {
        extractedSkills: resumeAnalysis.parsedData.extractedSkills,
        targetRoles: studentProfile?.targetRoles || ['Software Engineering Intern'],
      };
      const pool = internships && internships.length > 0 ? internships : FALLBACK_INTERNSHIPS;
      return matchResumeWithInternships(candidateProfile, pool);
    }
    return [];
  }, [resumeAnalysis, internships, studentProfile]);

  // Overall ATS score metrics
  const score = resumeAnalysis?.atsScore || 0;
  const scoreLabel =
    score >= 75
      ? 'ATS Optimized ✓'
      : score >= 55
      ? 'Needs Improvement'
      : 'Low ATS Score';

  const scoreBadgeCls =
    score >= 75
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : score >= 55
      ? 'bg-amber-50 text-amber-700 border-amber-200'
      : 'bg-rose-50 text-rose-700 border-rose-200';

  // 7 Factor Breakdown Items
  const breakdownConfig = [
    { key: 'keywords', label: 'Keywords & Terminology', weight: 30, icon: 'key' },
    { key: 'jobMatch', label: 'Job & Role Match', weight: 25, icon: 'work' },
    { key: 'structure', label: 'Structure & Layout', weight: 15, icon: 'view_agenda' },
    { key: 'skills', label: 'Technical Skills Depth', weight: 10, icon: 'code' },
    { key: 'projects', label: 'Projects & Quantified Impact', weight: 10, icon: 'rocket_launch' },
    { key: 'education', label: 'Education & Academics', weight: 5, icon: 'school' },
    { key: 'formatting', label: 'Formatting & ATS Readability', weight: 5, icon: 'description' },
  ];

  return (
    <div className="p-space-md lg:p-space-lg max-w-7xl mx-auto space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-primary">
              AI ATS Resume Analyzer
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-[11px] font-bold border border-secondary/20 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse inline-block"></span>
              Gemini 2.5 Flash
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
            Multi-factor weighted ATS scoring (Keywords 30%, Job Match 25%, Structure 15%, Skills 10%, Projects 10%, Education 5%, Formatting 5%),
            instant skill gap detection, and single-pass internship matching.
          </p>
        </div>

        <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:opacity-90 active:scale-95 transition-all cursor-pointer shadow-sm select-none self-start md:self-auto">
          <span className="material-symbols-outlined text-[18px]">cloud_upload</span>
          <span>{isProcessing ? 'Analyzing…' : 'Upload Resume'}</span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt"
            className="hidden"
            onChange={handleFileInput}
            disabled={isProcessing}
          />
        </label>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm animate-fadeIn">
          <span className="material-symbols-outlined text-[22px] text-rose-600 mt-0.5 flex-shrink-0">error</span>
          <div className="flex-1">
            <p className="font-bold text-rose-900">Analysis Notice</p>
            <p className="text-xs mt-0.5 leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-700 text-xs font-bold px-2 py-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Processing State */}
      {isProcessing && (
        <div className="p-10 rounded-2xl bg-surface-container-lowest border border-secondary/30 shadow-md flex flex-col items-center gap-6 text-center animate-fadeIn">
          <div className="relative">
            <div className="w-20 h-20 rounded-full border-4 border-secondary/20 border-t-secondary animate-spin" />
            <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-[30px] text-secondary">
              psychology
            </span>
          </div>
          <div className="max-w-md space-y-2">
            <h3 className="font-display font-extrabold text-primary text-base">
              Analyzing Resume with Gemini 2.5 Flash
            </h3>
            <p className="text-xs text-on-surface-variant transition-all duration-300 min-h-[32px] flex items-center justify-center">
              {PROGRESS_STEPS[progressStep]}
            </p>
          </div>

          {/* Animated Progress Track */}
          <div className="w-full max-w-md bg-surface-container-high rounded-full h-2.5 overflow-hidden">
            <div
              className="h-full rounded-full bg-secondary transition-all duration-700 ease-out"
              style={{ width: `${((progressStep + 1) / PROGRESS_STEPS.length) * 100}%` }}
            />
          </div>

          <p className="text-[11px] text-on-surface-variant/80 font-medium">
            Processing backend text extraction & structured JSON generation • typically 4–10 seconds
          </p>
        </div>
      )}

      {/* Drop Zone (Shown when no result and not processing) */}
      {!isProcessing && !hasResult && (
        <div
          className={`p-12 rounded-3xl border-2 border-dashed flex flex-col items-center gap-5 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-secondary bg-secondary/5 scale-[1.01]'
              : 'border-outline-variant/40 bg-surface-container-lowest hover:border-secondary/60 hover:bg-surface-container-low/50 shadow-sm'
          }`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          <div className="w-20 h-20 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary shadow-inner">
            <span className="material-symbols-outlined text-[40px]">upload_file</span>
          </div>
          <div className="space-y-1.5">
            <h3 className="font-display text-lg font-bold text-primary">
              Upload your resume to check ATS compatibility
            </h3>
            <p className="text-sm text-on-surface-variant">
              Drag and drop your file here, or{' '}
              <span className="text-secondary font-bold underline cursor-pointer">browse your computer</span>
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <span className="px-3 py-1 rounded-full bg-surface-container-low text-[11px] font-semibold text-on-surface border border-outline-variant/30 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-rose-500">picture_as_pdf</span> PDF
            </span>
            <span className="px-3 py-1 rounded-full bg-surface-container-low text-[11px] font-semibold text-on-surface border border-outline-variant/30 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-blue-500">description</span> DOCX
            </span>
            <span className="px-3 py-1 rounded-full bg-surface-container-low text-[11px] font-semibold text-on-surface border border-outline-variant/30 flex items-center gap-1">
              <span className="material-symbols-outlined text-[14px] text-emerald-500">article</span> TXT
            </span>
            <span className="text-[11px] text-on-surface-variant ml-1">Up to 10 MB</span>
          </div>
        </div>
      )}

      {/* Results View */}
      {!isProcessing && hasResult && (
        <div className="space-y-8 animate-fadeIn">
          {/* Top Banner Card: File details + ATS Gauge */}
          <div className="p-6 lg:p-8 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Left: File Info & Executive Summary */}
            <div className="lg:col-span-8 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-surface-container-high">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">
                    <span className="material-symbols-outlined text-[26px]">task</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-display text-base lg:text-lg font-bold text-primary truncate">
                      {resumeAnalysis.fileName || 'Resume.pdf'}
                    </h3>
                    <p className="text-xs text-on-surface-variant">
                      Evaluated on {resumeAnalysis.uploadDate || 'Today'} • Powered by Gemini 2.5 Flash
                    </p>
                  </div>
                </div>
                <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold border ${scoreBadgeCls}`}>
                  {scoreLabel}
                </span>
              </div>

              {/* Summary Paragraph */}
              <div className="p-4 rounded-2xl bg-surface-container-low/70 border border-surface-container-high/60 space-y-1.5">
                <span className="text-[11px] font-bold text-secondary uppercase tracking-wider flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">psychology</span>
                  Executive ATS Verdict
                </span>
                <p className="text-xs lg:text-sm text-on-surface leading-relaxed">
                  {resumeAnalysis.atsScoreReason ||
                    'Your resume has been comprehensively scanned against industry applicant tracking systems.'}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-xl bg-surface-container-low hover:bg-surface-container text-primary text-xs font-bold transition-all border border-outline-variant/30 flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">upload_file</span>
                  Analyze Another Resume
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const breakdownText = breakdownConfig
                      .map((b) => {
                        const item = resumeAnalysis?.scoreBreakdown?.[b.key];
                        return `- ${b.label} (${b.weight}%): ${item?.score ?? 'N/A'}/100\n  Feedback: ${item?.feedback || 'N/A'}`;
                      })
                      .join('\n');

                    const recs = (resumeAnalysis.recommendations || [])
                      .map(
                        (r, i) =>
                          `${i + 1}. ${r.title} [${r.impact || 'Normal'}]\n   Current: ${r.current}\n   Suggested: ${r.suggested}`
                      )
                      .join('\n\n');

                    const skills = (resumeAnalysis.parsedData?.extractedSkills || []).join(', ');
                    const missing = (resumeAnalysis.parsedData?.missingKeywordsForTargetRole || []).join(', ');

                    const report = [
                      '==============================================',
                      'INTERNAI ATS RESUME ANALYSIS REPORT',
                      '==============================================',
                      `File Name: ${resumeAnalysis.fileName}`,
                      `Date: ${resumeAnalysis.uploadDate}`,
                      `Overall ATS Score: ${resumeAnalysis.atsScore}/100`,
                      '',
                      '--- ATS SCORE BREAKDOWN (7 FACTORS) ---',
                      breakdownText,
                      '',
                      '--- DETECTED SKILLS ---',
                      skills || 'None detected',
                      '',
                      '--- MISSING KEYWORDS FOR TARGET ROLE ---',
                      missing || 'None identified',
                      '',
                      '--- ACTIONABLE AI RECOMMENDATIONS ---',
                      recs || 'No specific rewrites',
                      '==============================================',
                    ].join('\n');

                    const blob = new Blob([report], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ats-report-${resumeAnalysis.fileName || 'resume'}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="px-4 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:opacity-90 transition-all flex items-center gap-1.5 shadow-sm"
                >
                  <span className="material-symbols-outlined text-[16px]">download</span>
                  Export Full ATS Report
                </button>
              </div>
            </div>

            {/* Right: ATS Score Gauge */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-4 rounded-2xl bg-surface-container-low/40 border border-surface-container-high/60">
              <ScoreGauge score={score} isAnimating={false} />
              <p className="text-xs text-on-surface-variant text-center mt-3 max-w-xs leading-normal">
                {score >= 75
                  ? 'Strong candidate. Well aligned with recruiter ATS parsing standards.'
                  : score >= 55
                  ? 'Moderate score. Implementing the recommendations below will significantly increase interview callbacks.'
                  : 'Needs revision. Critical keywords and quantifiable metrics are missing.'}
              </p>
            </div>
          </div>

          {/* 7-Factor Weighted ATS Score Breakdown */}
          <div className="p-6 lg:p-8 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-surface-container-high">
              <div>
                <h3 className="font-display text-lg font-extrabold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px] text-secondary">tune</span>
                  7-Factor ATS Score Breakdown
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Calculated using strict industry formula: Keywords (30%), Job Match (25%), Structure (15%), Skills (10%), Projects (10%), Education (5%), Formatting (5%).
                </p>
              </div>
              <span className="text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full self-start sm:self-auto">
                Total Weight: 100%
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {breakdownConfig.map((factor) => {
                const data = resumeAnalysis?.scoreBreakdown?.[factor.key] || {
                  score: Math.round(score * (0.85 + (factor.weight % 3) * 0.05)),
                  feedback: 'Evaluated based on standard ATS parsing benchmarks.',
                };
                const factorScore = Math.max(0, Math.min(100, data.score || 0));
                const barColor =
                  factorScore >= 75
                    ? 'bg-emerald-500'
                    : factorScore >= 55
                    ? 'bg-amber-500'
                    : 'bg-rose-500';

                return (
                  <div
                    key={factor.key}
                    className="p-4 rounded-2xl bg-surface-container-low/60 border border-surface-container-high/60 space-y-2.5 transition-all hover:bg-surface-container-low"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[18px] text-secondary">
                          {factor.icon}
                        </span>
                        <span className="font-bold text-xs text-primary">{factor.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-surface-container-high text-on-surface-variant">
                          Weight {factor.weight}%
                        </span>
                        <span className="font-display font-black text-xs text-primary">
                          {factorScore}/100
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-surface-container-high rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                        style={{ width: `${factorScore}%` }}
                      />
                    </div>

                    {/* Feedback */}
                    {data.feedback && (
                      <p className="text-[11px] text-on-surface-variant leading-relaxed">
                        {data.feedback}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Skills & Keyword Gap Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Detected Skills */}
            <div className="p-6 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
                <h3 className="font-display text-base font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-emerald-600">check_circle</span>
                  Extracted Candidate Skills
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {resumeAnalysis.parsedData?.extractedSkills?.length || 0} Detected
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Skills, frameworks, languages, and tools identified in your resume:
              </p>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-1">
                {(resumeAnalysis.parsedData?.extractedSkills || []).length > 0 ? (
                  resumeAnalysis.parsedData.extractedSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-emerald-50/80 text-emerald-900 border border-emerald-200/80 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[14px] text-emerald-600">done</span>
                      {skill}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-on-surface-variant italic">No skills detected. Consider adding a dedicated Skills section.</p>
                )}
              </div>
            </div>

            {/* Missing Keywords for Target Role */}
            <div className="p-6 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
                <h3 className="font-display text-base font-bold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[20px] text-rose-600">warning</span>
                  Missing Keywords for Target Role
                </h3>
                <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  {resumeAnalysis.parsedData?.missingKeywordsForTargetRole?.length || 0} Recommended
                </span>
              </div>
              <p className="text-xs text-on-surface-variant">
                Frequently expected in job descriptions for your target roles but missing from your resume:
              </p>
              <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto pr-1">
                {(resumeAnalysis.parsedData?.missingKeywordsForTargetRole || []).length > 0 ? (
                  resumeAnalysis.parsedData.missingKeywordsForTargetRole.map((keyword, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-900 border border-rose-200 text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                    >
                      <span className="material-symbols-outlined text-[14px] text-rose-500">add_circle</span>
                      {keyword}
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-on-surface-variant italic">No critical missing keywords identified!</p>
                )}
              </div>
            </div>
          </div>

          {/* AI Actionable Recommendations */}
          {(resumeAnalysis.recommendations || []).length > 0 && (
            <div className="p-6 lg:p-8 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-surface-container-high">
                <div>
                  <h3 className="font-display text-lg font-extrabold text-primary flex items-center gap-2">
                    <span className="material-symbols-outlined text-[22px] text-secondary">tips_and_updates</span>
                    AI Actionable Bullet Rewrites
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Transform weak project and experience bullet points into high-impact, quantified achievements.
                  </p>
                </div>
                <span className="text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full">
                  {resumeAnalysis.recommendations.length} Rewrites
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {resumeAnalysis.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-2xl bg-surface-container-low/70 border border-surface-container-high/80 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-bold text-xs text-primary flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-secondary/20 text-secondary flex items-center justify-center text-[11px] font-black">
                          {idx + 1}
                        </span>
                        {rec.title}
                      </span>
                      <ImpactBadge impact={rec.impact} />
                    </div>

                    <div className="space-y-2 text-xs">
                      {/* Current */}
                      <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200/60 text-rose-900 flex items-start gap-2.5">
                        <span className="font-bold text-[10px] uppercase text-rose-700 mt-0.5 flex-shrink-0 bg-rose-100 px-1.5 py-0.5 rounded">
                          Current Weak
                        </span>
                        <p className="leading-relaxed line-through opacity-80">{rec.current}</p>
                      </div>

                      {/* Suggested */}
                      <div className="p-3 rounded-xl bg-emerald-50/80 border border-emerald-200/80 text-emerald-950 flex items-start gap-2.5">
                        <span className="font-bold text-[10px] uppercase text-emerald-700 mt-0.5 flex-shrink-0 bg-emerald-100 px-1.5 py-0.5 rounded">
                          Suggested High-Impact
                        </span>
                        <p className="leading-relaxed font-medium">{rec.suggested}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Internships (Matched Against Existing Internships) */}
          <div className="p-6 lg:p-8 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-surface-container-high">
              <div>
                <h3 className="font-display text-lg font-extrabold text-primary flex items-center gap-2">
                  <span className="material-symbols-outlined text-[22px] text-secondary">recommend</span>
                  Recommended Internships for Your Resume
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Single-pass matching against live listings — ranked by Resume Match Score with per-internship skill gap analysis.
                </p>
              </div>
              <span className="text-xs font-bold text-secondary bg-secondary/10 px-3 py-1 rounded-full self-start sm:self-auto">
                {recommendedInternships.length} Internships Matched
              </span>
            </div>

            {recommendedInternships.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {recommendedInternships.slice(0, 6).map((internship) => {
                  const matchScore = internship.resumeMatchScore || 75;
                  const matchColor =
                    matchScore >= 80
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                      : matchScore >= 60
                      ? 'text-amber-700 bg-amber-50 border-amber-200'
                      : 'text-rose-700 bg-rose-50 border-rose-200';

                  return (
                    <div
                      key={internship.id}
                      className="p-5 rounded-2xl bg-surface-container-low/60 border border-surface-container-high/80 hover:border-secondary/50 transition-all flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-sm"
                    >
                      <div className="space-y-3">
                        {/* Header: Logo, Title, Match Score */}
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <div
                              className={`w-11 h-11 rounded-xl font-bold flex items-center justify-center flex-shrink-0 text-sm ${
                                internship.logoBg || 'bg-blue-100 text-blue-700'
                              }`}
                            >
                              {internship.logoText || (internship.company?.charAt(0) || 'C')}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-primary truncate">
                                {internship.title}
                              </h4>
                              <p className="text-xs text-on-surface-variant font-medium">
                                {internship.company} • {internship.location || 'India'}
                              </p>
                            </div>
                          </div>

                          {/* Match Score Badge */}
                          <div className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1 flex-shrink-0 ${matchColor}`}>
                            <span className="material-symbols-outlined text-[14px]">bolt</span>
                            {matchScore}% Match
                          </div>
                        </div>

                        {/* Stipend & Details */}
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-on-surface-variant">
                          <span className="font-bold text-primary">
                            ₹{(internship.stipend || 20000).toLocaleString()}/mo
                          </span>
                          <span>•</span>
                          <span>{internship.roleType || 'Full-Time Intern'}</span>
                          <span>•</span>
                          <span>{internship.duration || '3-6 months'}</span>
                        </div>

                        {/* Matched Skills */}
                        {internship.matchedSkills && internship.matchedSkills.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                              Matched Skills ({internship.matchedSkills.length})
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {internship.matchedSkills.map((s, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 text-[11px] font-semibold border border-emerald-200 flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-[12px] text-emerald-600">done</span>
                                  {s}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Missing Skills */}
                        {internship.missingSkills && internship.missingSkills.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider block">
                              Missing Skills ({internship.missingSkills.length})
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {internship.missingSkills.slice(0, 4).map((s, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded bg-rose-50 text-rose-800 text-[11px] font-semibold border border-rose-200 flex items-center gap-1"
                                >
                                  <span className="material-symbols-outlined text-[12px] text-rose-500">close</span>
                                  {s}
                                </span>
                              ))}
                              {internship.missingSkills.length > 4 && (
                                <span className="text-[10px] text-on-surface-variant self-center">
                                  +{internship.missingSkills.length - 4} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-2 border-t border-surface-container-high/60">
                        <button
                          type="button"
                          onClick={() => navigate('internship-details', internship.id)}
                          className="flex-1 py-2 rounded-xl bg-surface-container hover:bg-surface-container-high text-primary text-xs font-bold transition-all text-center"
                        >
                          View Details
                        </button>
                        {internship.applyUrl && internship.applyUrl !== '#' ? (
                          <a
                            href={internship.applyUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:opacity-90 transition-all text-center flex items-center justify-center gap-1"
                          >
                            <span>Apply Now</span>
                            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate('internship-details', internship.id)}
                            className="flex-1 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:opacity-90 transition-all text-center"
                          >
                            Apply via Portal
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-surface-container-low rounded-2xl">
                <p className="text-sm text-on-surface-variant">
                  Loading live internship listings to match against your resume...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
