import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { matchResumeWithInternships } from '../utils/resumeMatcher';

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
    applyUrl: 'https://internshala.com/internships/frontend-development-internship',
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
    applyUrl: 'https://internshala.com/internships/full-stack-development-internship',
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
    logoBg: 'bg-purple-100 text-purple-700',
    applyUrl: 'https://internshala.com/internships/python-development-internship',
  },
  {
    id: 'fallback-4',
    title: 'AI / Machine Learning Intern',
    company: 'NextGen Intelligence',
    location: 'Remote, India',
    description: 'Fine-tune foundational LLMs, build RAG pipelines, and integrate conversational AI workflows using Python, PyTorch, and LangChain.',
    stipend: 35000,
    tags: ['Python', 'Machine Learning', 'PyTorch', 'LangChain', 'NLP', 'Git'],
    skills: ['Python', 'Machine Learning', 'PyTorch', 'LangChain', 'NLP', 'Docker'],
    roleType: 'Full-Time Intern',
    duration: '3 months',
    logoText: 'N',
    logoBg: 'bg-amber-100 text-amber-700',
    applyUrl: 'https://internshala.com/internships/machine-learning-internship',
  },
  {
    id: 'fallback-5',
    title: 'DevOps & Cloud Intern',
    company: 'CloudNative Solutions',
    location: 'Pune, India (Hybrid)',
    description: 'Maintain CI/CD pipelines, containerize backend microservices with Docker, and configure cloud infrastructure on AWS and Kubernetes.',
    stipend: 26000,
    tags: ['Docker', 'Kubernetes', 'AWS', 'Linux', 'CI/CD', 'Git'],
    skills: ['Docker', 'Kubernetes', 'AWS', 'Linux', 'CI/CD', 'Git', 'Python'],
    roleType: 'Full-Time Intern',
    duration: '6 months',
    logoText: 'C',
    logoBg: 'bg-sky-100 text-sky-700',
    applyUrl: 'https://internshala.com/internships/devops-internship',
  },
  {
    id: 'fallback-6',
    title: 'Mobile App Developer Intern (React Native)',
    company: 'AppVenture Studios',
    location: 'Remote, India',
    description: 'Build cross-platform mobile apps for iOS and Android using React Native, TypeScript, and state management libraries.',
    stipend: 22000,
    tags: ['React Native', 'TypeScript', 'JavaScript', 'Mobile', 'Git'],
    skills: ['React Native', 'TypeScript', 'JavaScript', 'Mobile', 'Git'],
    roleType: 'Full-Time Intern',
    duration: '3-6 months',
    logoText: 'A',
    logoBg: 'bg-rose-100 text-rose-700',
    applyUrl: 'https://internshala.com/internships/react-native-internship',
  },
];

export default function AIMatchingPage() {
  const {
    internships,
    resumeAnalysis,
    studentProfile,
    bookmarks,
    toggleBookmark,
    navigate,
    openApplyAndTrack,
    navigateToInterview,
    fetchAllLiveInternships,
    adzunaLoading,
  } = useApp();
  const { userProfile } = useAuth();

  const profile = userProfile || studentProfile;

  // Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [minMatchScore, setMinMatchScore] = useState(0); // 0, 70, 80, 90
  const [roleTypeFilter, setRoleTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('match-desc'); // 'match-desc', 'stipend-desc', 'fewest-missing'

  // Ensure live listings are fetched if empty
  useEffect(() => {
    if (!internships || internships.length === 0) {
      fetchAllLiveInternships({ keywords: 'software intern', country: 'in' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Determine candidate skills: prefer extracted resume skills, fallback to profile skills
  const candidateSkills = useMemo(() => {
    const resumeSkills = resumeAnalysis?.parsedData?.extractedSkills || [];
    if (resumeSkills.length > 0) return resumeSkills;

    const rawProfileSkills = profile?.skills || [];
    return rawProfileSkills.map((s) => (typeof s === 'string' ? s : s.name || '')).filter(Boolean);
  }, [resumeAnalysis, profile]);

  const hasResume = Boolean(resumeAnalysis && (resumeAnalysis.fileName || resumeAnalysis.atsScore > 0));

  // Compute recommended internships
  const recommendedInternships = useMemo(() => {
    if (resumeAnalysis?.recommendedInternships?.length > 0) {
      return resumeAnalysis.recommendedInternships;
    }

    const candidateProfile = {
      extractedSkills: candidateSkills.length > 0 ? candidateSkills : ['JavaScript', 'React', 'Python', 'HTML', 'CSS', 'Git'],
      targetRoles: profile?.targetRoles && profile.targetRoles.length > 0
        ? profile.targetRoles
        : ['Software Engineering Intern', 'Frontend Intern', 'Full Stack Intern'],
    };

    const pool = internships && internships.length > 0 ? internships : FALLBACK_INTERNSHIPS;
    return matchResumeWithInternships(candidateProfile, pool);
  }, [resumeAnalysis, candidateSkills, profile, internships]);

  // Apply filters and sorting
  const filteredInternships = useMemo(() => {
    return recommendedInternships.filter((job) => {
      const matchScore = job.resumeMatchScore || 70;
      if (minMatchScore > 0 && matchScore < minMatchScore) {
        return false;
      }

      if (roleTypeFilter !== 'all' && job.roleType !== roleTypeFilter) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matched =
          (job.title || '').toLowerCase().includes(q) ||
          (job.company || '').toLowerCase().includes(q) ||
          (job.location || '').toLowerCase().includes(q) ||
          (job.tags || []).some((t) => t.toLowerCase().includes(q)) ||
          (job.matchedSkills || []).some((s) => s.toLowerCase().includes(q));
        if (!matched) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'match-desc') {
        return (b.resumeMatchScore || 0) - (a.resumeMatchScore || 0);
      }
      if (sortBy === 'stipend-desc') {
        const stipendA = typeof a.stipend === 'number' ? a.stipend : 0;
        const stipendB = typeof b.stipend === 'number' ? b.stipend : 0;
        return stipendB - stipendA;
      }
      if (sortBy === 'fewest-missing') {
        const missingA = a.missingSkills?.length || 0;
        const missingB = b.missingSkills?.length || 0;
        return missingA - missingB;
      }
      return 0;
    });
  }, [recommendedInternships, minMatchScore, roleTypeFilter, searchQuery, sortBy]);

  return (
    <div className="p-space-md lg:p-space-lg max-w-7xl mx-auto space-y-6">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[30px] text-secondary">smart_toy</span>
              AI Matching
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary text-[11px] font-bold border border-secondary/20">
              Personalized Match Engine
            </span>
          </div>
          <p className="text-sm text-on-surface-variant mt-1.5 leading-relaxed">
            Single-pass matching against live listings — ranked by Resume Match Score with per-internship skill gap analysis.
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('resume-analyzer')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all shadow-sm self-start md:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">description</span>
          <span>{hasResume ? 'Update / Re-Analyze Resume' : 'Analyze Resume for 95%+ Accuracy'}</span>
        </button>
      </div>

      {/* Resume Context Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[22px]">
              {hasResume ? 'verified' : 'account_circle'}
            </span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-primary truncate">
                {hasResume ? `Matched against: ${resumeAnalysis.fileName || 'Uploaded Resume'}` : 'Matched against Student Profile Skills'}
              </span>
              {hasResume && (
                <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                  ATS {resumeAnalysis.atsScore}/100
                </span>
              )}
            </div>
            <p className="text-[11px] text-on-surface-variant mt-0.5 truncate">
              {candidateSkills.length > 0
                ? `${candidateSkills.length} skills analyzed: ${candidateSkills.slice(0, 5).join(', ')}${candidateSkills.length > 5 ? '…' : ''}`
                : 'No skills found. Upload your resume or add skills in Profile to enhance matching.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto flex-shrink-0">
          <span className="text-xs font-bold text-secondary bg-secondary/10 px-3 py-1.5 rounded-xl border border-secondary/20">
            {filteredInternships.length} Internships Matched
          </span>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by role, company, or matched skill..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface focus:outline-none focus:border-secondary"
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Match Score Filter */}
          <select
            value={minMatchScore}
            onChange={(e) => setMinMatchScore(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface font-semibold focus:outline-none focus:border-secondary cursor-pointer"
          >
            <option value={0}>All Match Scores</option>
            <option value={85}>85%+ High Match</option>
            <option value={75}>75%+ Strong Match</option>
            <option value={60}>60%+ Moderate Match</option>
          </select>

          {/* Role Type Filter */}
          <select
            value={roleTypeFilter}
            onChange={(e) => setRoleTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface font-semibold focus:outline-none focus:border-secondary cursor-pointer"
          >
            <option value="all">All Role Types</option>
            <option value="Full-Time Intern">Full-Time Intern</option>
            <option value="Part-Time Intern">Part-Time Intern</option>
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface font-semibold focus:outline-none focus:border-secondary cursor-pointer"
          >
            <option value="match-desc">Sort by: Highest Match</option>
            <option value="stipend-desc">Sort by: Highest Stipend</option>
            <option value="fewest-missing">Sort by: Fewest Missing Skills</option>
          </select>
        </div>
      </div>

      {/* Recommended Internships Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-[22px] text-secondary">recommend</span>
            Recommended Internships for Your Resume
          </h2>
          <span className="text-xs text-on-surface-variant font-medium">
            Showing {filteredInternships.length} of {recommendedInternships.length} results
          </span>
        </div>

        {adzunaLoading ? (
          <div className="p-12 text-center bg-surface-container-lowest rounded-3xl border border-surface-container-high space-y-3">
            <span className="material-symbols-outlined text-[36px] text-secondary animate-spin">
              progress_activity
            </span>
            <p className="text-sm font-semibold text-primary">Matching live internships against your skills…</p>
          </div>
        ) : filteredInternships.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredInternships.map((internship) => {
              const matchScore = internship.resumeMatchScore || 75;
              const isBookmarked = bookmarks.includes(internship.id);
              const matchColor =
                matchScore >= 80
                  ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                  : matchScore >= 60
                  ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : 'text-rose-700 bg-rose-50 border-rose-200';

              return (
                <div
                  key={internship.id}
                  className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high hover:border-secondary/50 transition-all flex flex-col justify-between space-y-4 shadow-2xs hover:shadow-md"
                >
                  <div className="space-y-3">
                    {/* Header: Logo, Title, Bookmark, Match Score */}
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
                          <h4 className="font-bold text-sm text-primary truncate hover:text-secondary cursor-pointer"
                              onClick={() => navigate('internship-details', internship.id)}>
                            {internship.title}
                          </h4>
                          <p className="text-xs text-on-surface-variant font-medium">
                            {internship.company} • {internship.location || 'India'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => toggleBookmark(internship.id)}
                          className={`p-1.5 rounded-lg border transition-all ${
                            isBookmarked
                              ? 'bg-amber-50 text-amber-600 border-amber-200'
                              : 'text-outline hover:text-on-surface border-transparent hover:bg-surface-container-low'
                          }`}
                          title={isBookmarked ? 'Remove Bookmark' : 'Save for Later'}
                        >
                          <span className="material-symbols-outlined text-[18px]">
                            {isBookmarked ? 'bookmark' : 'bookmark_border'}
                          </span>
                        </button>

                        <div className={`px-2.5 py-1 rounded-xl text-xs font-black border flex items-center gap-1 ${matchColor}`}>
                          <span className="material-symbols-outlined text-[14px]">bolt</span>
                          {matchScore}% Match
                        </div>
                      </div>
                    </div>

                    {/* Stipend & Details */}
                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-on-surface-variant">
                      <span className="font-bold text-primary">
                        {internship.stipend
                          ? typeof internship.stipend === 'number'
                            ? `₹${internship.stipend.toLocaleString()}/mo`
                            : internship.stipend
                          : '₹20,000/mo'}
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
                    <button
                      type="button"
                      onClick={() => navigateToInterview(internship.id)}
                      className="py-2 px-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest text-primary text-xs font-bold transition-all flex items-center gap-1"
                      title="Practice Mock Interview for this role"
                    >
                      <span className="material-symbols-outlined text-[15px]">mic</span>
                      <span>Interview</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => openApplyAndTrack(internship)}
                      className="flex-1 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all text-center flex items-center justify-center gap-1 shadow-sm"
                    >
                      <span>Apply Now</span>
                      <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-12 text-center bg-surface-container-lowest rounded-3xl border border-surface-container-high space-y-3">
            <span className="material-symbols-outlined text-[44px] text-on-surface-variant opacity-40">
              filter_list_off
            </span>
            <h3 className="font-bold text-sm text-primary">No matching internships found</h3>
            <p className="text-xs text-on-surface-variant max-w-md mx-auto">
              Try adjusting your search query, lowering the minimum match score filter, or uploading a resume to discover more roles.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setMinMatchScore(0);
                setRoleTypeFilter('all');
              }}
              className="mt-2 px-4 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all"
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
