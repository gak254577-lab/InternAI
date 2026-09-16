import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function SkillProgressPage() {
  const { studentProfile, updateProfile, navigate } = useApp();
  const [selectedTargetRole, setSelectedTargetRole] = useState('razorpay');
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const handleSyncGitHub = () => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      setSyncSuccess(true);
      // Boost a couple verified skill levels
      const updatedSkills = studentProfile.skills.map((s) => {
        if (s.name === 'Redis & Invalidation') return { ...s, level: 82, verified: true };
        if (s.name === 'Docker & Containerization') return { ...s, level: 75, verified: true };
        return s;
      });
      updateProfile({ skills: updatedSkills, readinessScore: 89 });
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 1500);
  };

  const roleGapMatrices = {
    razorpay: [
      { skill: 'React.js', required: 90, current: 94, status: 'Surplus' },
      { skill: 'TypeScript', required: 85, current: 88, status: 'Ready' },
      { skill: 'Node.js & Express', required: 80, current: 86, status: 'Ready' },
      { skill: 'Redis & Invalidation', required: 80, current: 78, status: 'In Progress' },
      { skill: 'Docker', required: 75, current: 70, status: 'In Progress' },
      { skill: 'Kubernetes', required: 60, current: 50, status: 'Gap' }
    ],
    google: [
      { skill: 'Data Structures & Algos', required: 95, current: 90, status: 'In Progress' },
      { skill: 'System Architecture', required: 80, current: 74, status: 'In Progress' },
      { skill: 'Concurrency & OS', required: 85, current: 82, status: 'Ready' },
      { skill: 'Graph Algorithms', required: 90, current: 88, status: 'Ready' }
    ],
    cred: [
      { skill: 'PostgreSQL ACID', required: 90, current: 85, status: 'In Progress' },
      { skill: 'Redis Caching', required: 85, current: 78, status: 'In Progress' },
      { skill: 'Message Queues (Kafka)', required: 75, current: 60, status: 'Gap' },
      { skill: 'High Concurrency', required: 85, current: 80, status: 'Ready' }
    ]
  };

  const activeGaps = roleGapMatrices[selectedTargetRole] || roleGapMatrices.razorpay;

  return (
    <div className="p-space-md lg:p-space-lg max-w-7xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-primary">
            Skill Progress &amp; Technical Mastery
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Engineered competency matrix calibrated across 12,000+ candidate evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleSyncGitHub}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-container text-on-primary text-xs font-bold hover:bg-primary transition-all shadow-sm"
          >
            <span className={`material-symbols-outlined text-[16px] text-on-tertiary-container ${isSyncing ? 'animate-spin' : ''}`}>
              sync
            </span>
            <span>{isSyncing ? 'Scanning Repos...' : syncSuccess ? 'Synced with GitHub!' : 'Sync GitHub Repos'}</span>
          </button>
          <button
            type="button"
            onClick={() => alert('Skill matrix report exported in JSON format.')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-high text-on-surface text-xs font-semibold hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[16px]">file_download</span>
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Skills Matrix (8 cols) + Role Gap Matrix (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column (8 cols): Skills Progress Bars */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <h3 className="font-headline-sm text-lg font-bold text-primary">
                Engineered Competency Matrix
              </h3>
              <span className="text-xs text-secondary font-bold">
                {studentProfile.skills.filter((s) => s.verified).length} Verified by Code
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {studentProfile.skills.map((skill, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/60 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-primary flex items-center gap-1">
                      {skill.name}
                      {skill.verified && (
                        <span className="material-symbols-outlined text-[14px] text-secondary" title="Verified by GitHub repository">
                          verified
                        </span>
                      )}
                    </span>
                    <span className="font-extrabold text-xs text-secondary">{skill.level}%</span>
                  </div>

                  {/* Level bar */}
                  <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-secondary h-full rounded-full transition-all duration-300"
                      style={{ width: `${skill.level}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-medium">
                    <span>Category: {skill.category}</span>
                    <span className={skill.level >= 85 ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
                      {skill.level >= 85 ? 'Production Ready' : 'Intermediate'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Target Role Gap Matrix */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-secondary">
                Comparative Alignment
              </span>
              <h3 className="font-headline-sm text-lg font-bold text-primary mt-1">
                Target Role Gap Matrix
              </h3>
            </div>

            {/* Role selector dropdown */}
            <div>
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider block mb-1.5">
                Target Internship Role
              </label>
              <select
                value={selectedTargetRole}
                onChange={(e) => setSelectedTargetRole(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-xs text-primary font-bold focus:outline-none focus:border-secondary"
              >
                <option value="razorpay">Razorpay — SDE Intern (Web Platforms)</option>
                <option value="google">Google — SWE Summer Intern 2027</option>
                <option value="cred">CRED — Backend Platform Intern</option>
              </select>
            </div>

            {/* Gap Matrix items */}
            <div className="space-y-3 pt-2">
              {activeGaps.map((item, idx) => {
                const isReady = item.status === 'Ready' || item.status === 'Surplus';
                const isGap = item.status === 'Gap';
                return (
                  <div key={idx} className="p-3 rounded-xl bg-surface-container-low text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-primary">{item.skill}</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          isReady
                            ? 'bg-emerald-100 text-emerald-800'
                            : isGap
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-on-surface-variant">
                      <span>Required: {item.required}%</span>
                      <span className="font-semibold text-primary">Current: {item.current}%</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => navigate('preparation-roadmap')}
              className="w-full mt-2 py-2.5 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all shadow-sm"
            >
              Bridge Skill Gaps in Roadmap
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
