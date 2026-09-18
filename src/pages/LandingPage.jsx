import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function LandingPage() {
  const { navigate, internships } = useApp();
  const [emailInput, setEmailInput] = useState('');
  const [submittedEmail, setSubmittedEmail] = useState(false);

  const heroInternship = internships[0] || {
    company: 'Razorpay',
    title: 'Full Stack Engineering Intern',
    team: 'Foundational Engineering Team • 6 Months',
    location: 'Bengaluru • Hybrid',
    matchScore: 94
  };

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (emailInput.trim()) {
      setSubmittedEmail(true);
      setTimeout(() => {
        navigate('dashboard');
      }, 1000);
    }
  };

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-surface-container-low via-background to-surface px-space-lg lg:px-margin py-space-xl">
        <div className="absolute -top-40 -left-20 w-96 h-96 rounded-full bg-secondary-fixed opacity-40 blur-3xl pointer-events-none"></div>
        <div className="absolute top-1/3 -right-24 w-80 h-80 rounded-full bg-tertiary-fixed opacity-30 blur-3xl pointer-events-none"></div>

        <div className="relative max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
          {/* Left Column: Copy & Actions */}
          <div className="lg:col-span-7 flex flex-col items-start gap-space-md">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-surface-container-lowest shadow-sm text-secondary font-label-md text-label-md border border-outline-variant/30">
              <span className="material-symbols-outlined text-[16px] text-secondary-container" style={{ fontVariationSettings: "'FILL' 1" }}>
                auto_awesome
              </span>
              <span className="font-semibold tracking-wide">Powered by Student-Tuned LLM • No Recruiter Spam</span>
            </div>

            {/* Headline */}
            <h1 className="font-display text-display text-primary tracking-tight leading-[1.08] max-w-2xl">
              Find the Right Internship.{' '}
              <span className="bg-gradient-to-r from-secondary via-secondary-container to-on-tertiary-container bg-clip-text text-transparent">
                Prepare Smarter.
              </span>{' '}
              Apply with Confidence.
            </h1>

            {/* Subheading */}
            <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl">
              AI-powered internship discovery and preparation built specifically for college students. Match your exact coursework, analyze resume gaps, practice tailored mock interviews, and apply directly.
            </p>

            {/* CTA Group */}
            <div className="flex flex-wrap items-center gap-space-sm pt-space-xs w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate('explore-internships')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-secondary text-on-secondary font-title-md text-title-md hover:bg-secondary-container shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5"
              >
                <span className="material-symbols-outlined text-[20px]">explore</span>
                <span>Explore 1,200+ Internships</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('resume-analyzer')}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-surface-container-lowest text-on-surface font-title-md text-title-md shadow-sm hover:shadow-md hover:bg-surface-container-low transition-all border border-outline-variant/40"
              >
                <span className="material-symbols-outlined text-[20px] text-on-tertiary-container">spark</span>
                <span>Upload &amp; Analyze Resume</span>
              </button>
            </div>

            {/* Social Proof Metric Ribbon */}
            <div className="flex items-center gap-space-lg pt-space-md">
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-primary font-bold">1,240+</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Verified Roles</span>
              </div>
              <div className="h-8 w-px bg-surface-container-high"></div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-primary font-bold">94.8%</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Interview Shortlist Rate</span>
              </div>
              <div className="h-8 w-px bg-surface-container-high"></div>
              <div className="flex flex-col">
                <span className="font-headline-sm text-headline-sm text-primary font-bold">₹22,000</span>
                <span className="font-label-sm text-label-sm text-on-surface-variant">Avg. Monthly Stipend</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Live Hero Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl bg-surface-container-lowest/95 backdrop-blur-xl shadow-xl p-6 transition-all hover:shadow-2xl border border-outline-variant/30">
              {/* Ambient AI glow ring */}
              <div className="absolute inset-x-0 -top-px h-1 bg-gradient-to-r from-secondary-container via-on-tertiary-container to-secondary rounded-t-2xl"></div>

              {/* Header pill */}
              <div className="flex items-center justify-between pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary-container text-on-primary flex items-center justify-center font-bold text-headline-sm">
                    {heroInternship.company.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-title-md text-title-md text-on-surface leading-tight font-semibold">
                      {heroInternship.company}
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      {heroInternship.location}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-surface-container text-on-secondary-fixed-variant font-label-sm text-label-sm">
                  <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span>
                  Live Match
                </span>
              </div>

              {/* Job title & match readout */}
              <div className="pt-1 pb-4">
                <h3 className="font-headline-sm text-headline-sm text-primary font-bold">
                  {heroInternship.title}
                </h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                  Foundational Engineering Team • 6 Months
                </p>
              </div>

              {/* AI Match Gauge Card */}
              <div className="p-4 rounded-xl bg-surface-container-low flex items-center justify-between gap-4">
                <div className="flex flex-col">
                  <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                    AI Match Score
                  </span>
                  <span className="font-headline-md text-headline-md text-secondary font-extrabold mt-0.5">
                    {heroInternship.matchScore}% Perfect Fit
                  </span>
                  <span className="font-body-sm text-body-sm text-on-surface-variant">
                    Matches 8 of 9 college curriculum prerequisites
                  </span>
                </div>

                {/* Circular Gauge */}
                <div className="relative w-16 h-16 flex-shrink-0 flex items-center justify-center">
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
                      strokeDasharray={`${heroInternship.matchScore}, 100`}
                      strokeLinecap="round"
                      strokeWidth="3.5"
                    />
                  </svg>
                  <span className="absolute font-headline-sm text-title-md text-primary font-bold">
                    {heroInternship.matchScore}%
                  </span>
                </div>
              </div>

              {/* Skills Alignment */}
              <div className="pt-4 pb-2">
                <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider font-semibold">
                  Skill Alignment Breakdown
                </span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-lowest shadow-sm">
                    <span className="font-body-sm text-body-sm font-medium text-on-surface">React.js</span>
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                      <span className="material-symbols-outlined text-[14px] mr-0.5">check_circle</span>
                      94% Match
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-lowest shadow-sm">
                    <span className="font-body-sm text-body-sm font-medium text-on-surface">Redis Cache</span>
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                      <span className="material-symbols-outlined text-[14px] mr-0.5">check_circle</span>
                      88% Match
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-lowest shadow-sm">
                    <span className="font-body-sm text-body-sm font-medium text-on-surface">TypeScript</span>
                    <span className="inline-flex items-center text-xs font-semibold text-emerald-600">
                      <span className="material-symbols-outlined text-[14px] mr-0.5">check_circle</span>
                      90% Match
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-surface-container-lowest shadow-sm">
                    <span className="font-body-sm text-body-sm font-medium text-on-surface">Docker</span>
                    <span className="inline-flex items-center text-xs font-semibold text-amber-600">
                      <span className="material-symbols-outlined text-[14px] mr-0.5">warning</span>
                      Gap (70%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => navigate('internship-details', heroInternship.id || 'int-1')}
                  className="flex-1 py-2.5 rounded-lg bg-primary-container text-on-primary font-title-md text-title-md hover:bg-primary transition-all flex items-center justify-center gap-2"
                >
                  <span>View Match Analysis</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5-Step Acceleration Roadmap Section */}
      <section className="px-space-lg lg:px-margin py-space-xl max-w-7xl mx-auto w-full">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed text-label-sm font-semibold uppercase tracking-wider">
            Step-by-Step Pathway
          </span>
          <h2 className="font-headline-lg text-headline-lg text-primary font-bold mt-3">
            How InternAI Accelerates Your Career
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-2">
            From discovering roles aligned with your college grades to passing the final technical interview.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[
            { step: '01', title: 'Profile & Coursework', desc: 'Sync your university coursework and GitHub projects.', icon: 'school', route: 'profile' },
            { step: '02', title: 'Upload Resume', desc: 'AI scans and suggests keyword improvements for ATS pass.', icon: 'upload_file', route: 'resume-analyzer' },
            { step: '03', title: 'Verified Roles', desc: 'Browse internships verified directly with companies.', icon: 'verified', route: 'explore-internships' },
            { step: '04', title: 'Preparation Roadmap', desc: 'Follow a curated week-by-week study plan targeting gaps.', icon: 'alt_route', route: 'preparation-roadmap' },
            { step: '05', title: 'AI Mock Interview', desc: 'Practice role-specific technical questions with live feedback.', icon: 'mic', route: 'mock-interview' }
          ].map((item, idx) => (
            <div
              key={idx}
              onClick={() => navigate(item.route)}
              className="p-5 rounded-xl bg-surface-container-lowest border border-surface-container-high hover:border-secondary hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-secondary font-bold text-lg">{item.step}</span>
                  <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                    <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  </div>
                </div>
                <h3 className="font-title-md text-primary font-semibold mt-3">{item.title}</h3>
                <p className="font-body-sm text-on-surface-variant mt-1.5 text-xs leading-relaxed">{item.desc}</p>
              </div>
              <span className="text-secondary font-label-sm text-xs font-semibold mt-4 inline-flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                Explore <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Autonomous Co-Pilot Features */}
      <section className="bg-surface-container-low/60 px-space-lg lg:px-margin py-space-xl border-y border-surface-container-high">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10">
            <div>
              <span className="px-3 py-1 rounded-full bg-tertiary-fixed/40 text-on-tertiary-fixed-variant text-label-sm font-semibold uppercase tracking-wider">
                Full-Stack Tooling
              </span>
              <h2 className="font-headline-lg text-headline-lg text-primary font-bold mt-2">
                Autonomous Career Co-Pilot
              </h2>
            </div>
            <p className="text-on-surface-variant max-w-md mt-2 md:mt-0 font-body-sm text-sm">
              Engineered with precision for ambitious engineering and computer science students aiming for Tier-1 companies.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: 'AI Resume Analyzer',
                desc: 'Get instant line-by-line feedback, quantified bullet rewrites, and keyword alignment against internship descriptions.',
                icon: 'description',
                route: 'resume-analyzer',
                tag: '94% ATS Rate'
              },
              {
                title: 'Smart Internship Matching',
                desc: 'Proprietary algorithm weighs your coursework, verified repositories, and skills to surface highest-fit internships.',
                icon: 'smart_toy',
                route: 'explore-internships',
                tag: 'Instant Ranking'
              },
              {
                title: 'Strict Eligibility Checker',
                desc: 'Never waste time applying to roles with hidden graduation year or degree prerequisites. Check exact criteria upfront.',
                icon: 'fact_check',
                route: 'explore-internships',
                tag: 'Zero Rejection Waste'
              },
              {
                title: 'AI Preparation Roadmap',
                desc: 'Tailored timeline that identifies missing concepts (Redis, System Design, SQL indexing) and builds a week-by-week study sprint.',
                icon: 'alt_route',
                route: 'preparation-roadmap',
                tag: 'Personalized'
              },
              {
                title: 'AI Mock Interviewer',
                desc: 'Audio and speech simulation that asks questions, listens to answers, and grades technical precision in real time.',
                icon: 'mic',
                route: 'mock-interview',
                tag: 'Speech-to-Score'
              },
              {
                title: 'Application Pipeline Tracker',
                desc: 'Track every internship application with an integrated Kanban board, interview dates, OA links, and reminder triggers.',
                icon: 'view_kanban',
                route: 'my-applications',
                tag: 'Organized'
              }
            ].map((f, idx) => (
              <div
                key={idx}
                onClick={() => navigate(f.route)}
                className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center text-secondary group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                    <span className="material-symbols-outlined text-[22px]">{f.icon}</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-[11px] font-medium">
                    {f.tag}
                  </span>
                </div>
                <h3 className="font-headline-sm text-primary font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Verified Openings Preview */}
      <section className="px-space-lg lg:px-margin py-space-xl max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-primary font-bold">
              Live Verified Openings
            </h2>
            <p className="text-on-surface-variant text-sm mt-1">Actively hiring for Fall 2026 &amp; Summer 2027</p>
          </div>
          <button
            type="button"
            onClick={() => navigate('explore-internships')}
            className="text-secondary font-title-md text-sm font-semibold flex items-center gap-1 hover:underline"
          >
            View All {internships.length}+ Roles <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {internships.slice(0, 3).map((job) => (
            <div
              key={job.id}
              className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high hover:border-secondary hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${job.logoBg} flex items-center justify-center font-bold text-lg`}>
                      {job.logoText}
                    </div>
                    <div>
                      <h4 className="font-semibold text-primary">{job.company}</h4>
                      <p className="text-xs text-on-surface-variant">{job.location}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                    {job.matchScore}% Match
                  </span>
                </div>

                <h3 className="font-bold text-primary text-base mt-4 line-clamp-1">{job.title}</h3>
                <p className="text-xs text-on-surface-variant mt-1 line-clamp-2">{job.description}</p>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {job.tags.slice(0, 3).map((tag, tidx) => (
                    <span key={tidx} className="px-2 py-0.5 rounded bg-surface-container text-on-surface text-[11px] font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-surface-container-high flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-on-surface-variant block uppercase tracking-wider font-semibold">Stipend</span>
                  <span className="text-sm font-bold text-primary">₹{(job.stipend || 12000).toLocaleString('en-IN')}/mo</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('internship-details', job.id)}
                  className="px-3 py-1.5 rounded-lg bg-secondary text-on-secondary text-xs font-semibold hover:bg-secondary-container transition-colors"
                >
                  Quick Apply
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA Box */}
      <section className="px-space-lg lg:px-margin pb-space-xl max-w-7xl mx-auto w-full">
        <div className="rounded-3xl bg-gradient-to-r from-primary via-primary-container to-[#171347] text-on-primary p-8 lg:p-12 relative overflow-hidden shadow-2xl">
          <div className="relative z-10 max-w-2xl">
            <span className="px-3 py-1 rounded-full bg-secondary text-on-secondary text-xs font-semibold uppercase tracking-wider">
              Get Ahead in Your Career
            </span>
            <h2 className="font-display text-3xl lg:text-4xl font-extrabold mt-4 text-white leading-tight">
              Your Next Internship is Waiting. Start AI Matching Today.
            </h2>
            <p className="text-on-primary-container text-sm lg:text-base mt-3 leading-relaxed">
              Join 12,000+ computer science and engineering students preparing smarter with personalized roadmap sprints and automated gap analysis.
            </p>

            <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3 mt-6">
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="Enter university email (.edu / college ID)"
                className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-secondary text-sm"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-secondary text-on-secondary font-semibold text-sm hover:bg-secondary-container transition-all shadow-md"
              >
                {submittedEmail ? 'Welcome! Opening Dashboard...' : 'Get Instant Access'}
              </button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
