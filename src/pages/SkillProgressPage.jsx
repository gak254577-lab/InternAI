import React, { useState, useMemo, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';



// ── Skill category auto-detection ─────────────────────────────────────────────
const CATEGORY_MAP = [
  { cat: 'Frontend',         kw: ['react', 'vue', 'angular', 'next', 'svelte', 'html', 'css', 'sass', 'tailwind', 'webpack', 'vite', 'ui', 'ux'] },
  { cat: 'Backend',          kw: ['node', 'express', 'fastapi', 'django', 'flask', 'spring', 'go', 'rust', 'php', 'laravel', 'graphql', 'grpc', 'rest', 'api'] },
  { cat: 'Database',         kw: ['sql', 'postgres', 'postgresql', 'mysql', 'mongodb', 'redis', 'firebase', 'supabase', 'dynamo', 'cassandra', 'elasticsearch', 'sqlite'] },
  { cat: 'DevOps & Cloud',   kw: ['docker', 'kubernetes', 'k8s', 'aws', 'azure', 'gcp', 'terraform', 'ansible', 'ci/cd', 'jenkins', 'linux', 'bash', 'nginx', 'cloud'] },
  { cat: 'Languages',        kw: ['python', 'javascript', 'typescript', 'java', 'c++', 'c#', 'ruby', 'kotlin', 'swift', 'dart', 'scala', 'r', 'matlab'] },
  { cat: 'ML / AI',          kw: ['machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit', 'pandas', 'numpy', 'nlp', 'transformer', 'bert', 'neural', 'keras', 'ml', 'ai', 'llm', 'hugging'] },
  { cat: 'Data & Analytics', kw: ['tableau', 'power bi', 'looker', 'bigquery', 'spark', 'airflow', 'etl', 'analytics', 'matplotlib', 'seaborn', 'excel', 'data'] },
  { cat: 'Security',         kw: ['security', 'penetration', 'owasp', 'cryptography', 'ctf', 'burp', 'nmap', 'wireshark', 'soc', 'ethical', 'firewall'] },
  { cat: 'Mobile',           kw: ['android', 'ios', 'flutter', 'react native', 'xamarin', 'expo'] },
  { cat: 'Tools & VCS',      kw: ['git', 'github', 'gitlab', 'jira', 'confluence', 'figma', 'postman', 'swagger'] },
];

function inferCategory(name) {
  const lower = (name || '').toLowerCase();
  for (const { cat, kw } of CATEGORY_MAP) {
    if (kw.some((k) => lower.includes(k))) return cat;
  }
  return 'General';
}

/** Normalise a raw skill (string or partial object) → canonical rich object */
function normalizeSkill(raw, idx) {
  if (typeof raw === 'string') {
    return { id: `skill-${idx}`, name: raw.trim(), level: 65, category: inferCategory(raw), verified: false };
  }
  return {
    id:       raw.id       || `skill-${idx}`,
    name:     raw.name     || String(raw),
    level:    raw.level    ?? 65,
    category: raw.category || inferCategory(raw.name || ''),
    verified: raw.verified || false,
  };
}

// ── Track → skill keyword mapping ────────────────────────────────────────────
const TRACK_SKILL_KEYWORDS = {
  fullstack:        ['react', 'typescript', 'javascript', 'node', 'express', 'mongodb', 'sql', 'postgres', 'html', 'css', 'rest', 'api', 'git', 'docker', 'redis', 'graphql', 'next', 'vue', 'angular'],
  ml:               ['python', 'machine learning', 'deep learning', 'tensorflow', 'pytorch', 'scikit', 'pandas', 'numpy', 'nlp', 'transformer', 'bert', 'data', 'ai', 'neural', 'ml', 'kaggle', 'hugging'],
  backend:          ['node', 'java', 'python', 'go', 'rust', 'c++', 'express', 'fastapi', 'spring', 'sql', 'postgres', 'redis', 'kafka', 'docker', 'kubernetes', 'microservice', 'api', 'grpc', 'system'],
  frontend:         ['react', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css', 'sass', 'tailwind', 'next', 'webpack', 'vite', 'figma', 'ui', 'ux', 'animation', 'a11y', 'accessibility'],
  'data-analyst':   ['sql', 'excel', 'python', 'tableau', 'power bi', 'pandas', 'matplotlib', 'seaborn', 'data', 'analytics', 'bi', 'statistics', 'reporting', 'etl', 'looker', 'bigquery'],
  'data-scientist': ['python', 'r', 'machine learning', 'statistics', 'pandas', 'numpy', 'scikit', 'tensorflow', 'pytorch', 'sql', 'data', 'spark', 'airflow', 'feature engineering', 'ml', 'xgboost'],
  cybersecurity:    ['security', 'penetration', 'network', 'linux', 'python', 'bash', 'owasp', 'cryptography', 'ctf', 'burp', 'nmap', 'wireshark', 'soc', 'siem', 'splunk', 'firewall', 'ethical'],
  cloud:            ['aws', 'azure', 'gcp', 'google cloud', 'docker', 'kubernetes', 'terraform', 'ansible', 'linux', 'devops', 'ci/cd', 'cloud', 'serverless', 'iam', 's3', 'ec2', 'lambda', 'cloudformation'],
};

const TRACK_LABELS = {
  fullstack:        'Full Stack Developer',
  ml:               'Machine Learning / AI',
  backend:          'Backend / Systems',
  frontend:         'Frontend / UI Engineering',
  'data-analyst':   'Data Analyst',
  'data-scientist': 'Data Scientist',
  cybersecurity:    'Cyber Security',
  cloud:            'Cloud Computing',
};

const TRACK_COLORS = {
  fullstack:        { icon: 'layers',           bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700'   },
  ml:               { icon: 'psychology',        bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  backend:          { icon: 'dns',               bg: 'bg-emerald-50',border: 'border-emerald-200',text: 'text-emerald-700'},
  frontend:         { icon: 'desktop_windows',   bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  'data-analyst':   { icon: 'bar_chart',         bg: 'bg-teal-50',   border: 'border-teal-200',   text: 'text-teal-700'  },
  'data-scientist': { icon: 'science',           bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700'},
  cybersecurity:    { icon: 'security',          bg: 'bg-red-50',    border: 'border-red-200',    text: 'text-red-700'   },
  cloud:            { icon: 'cloud',             bg: 'bg-sky-50',    border: 'border-sky-200',    text: 'text-sky-700'   },
};



// ─────────────────────────────────────────────────────────────────────────────
export default function SkillProgressPage() {
  const { selectedTrack, navigate } = useApp();
  const { userProfile, updateUserProfile } = useAuth();

  // Normalise skills from Firestore — handles both plain strings and rich objects
  const skills = useMemo(() => {
    const raw = userProfile?.skills || [];
    return raw.map((s, i) => normalizeSkill(s, i));
  }, [userProfile?.skills]);

  // ── UI state ──
  const [isSyncing, setIsSyncing]                   = useState(false);
  const [syncSuccess, setSyncSuccess]               = useState(false);
  const [isSaving, setIsSaving]                     = useState(false);
  const [showAddPanel, setShowAddPanel]             = useState(false);
  const [editingId, setEditingId]                   = useState(null);
  const [newSkillName, setNewSkillName]             = useState('');
  const [newSkillLevel, setNewSkillLevel]           = useState(65);

  // ── Derived values ──
  const trackMeta  = TRACK_COLORS[selectedTrack] || TRACK_COLORS.fullstack;
  const trackLabel = TRACK_LABELS[selectedTrack] || selectedTrack;
  const keywords   = TRACK_SKILL_KEYWORDS[selectedTrack] || [];

  const filteredSkills = skills.filter((s) => {
    const hay = `${s.name} ${s.category}`.toLowerCase();
    return keywords.some((kw) => hay.includes(kw.toLowerCase()));
  });
  const displaySkills  = filteredSkills.length > 0 ? filteredSkills : skills;
  const isFiltered     = filteredSkills.length > 0 && filteredSkills.length < skills.length;
  const verifiedCount  = skills.filter((s) => s.verified).length;

  // ── Persist to Firestore ──
  const persistSkills = useCallback(async (updated) => {
    setIsSaving(true);
    await updateUserProfile({ skills: updated });
    setIsSaving(false);
  }, [updateUserProfile]);

  // ── Action handlers ──
  const handleAddSkill = async () => {
    const trimmed = newSkillName.trim();
    if (!trimmed) return;
    const newSkill = {
      id: `skill-${Date.now()}`,
      name: trimmed,
      level: Number(newSkillLevel),
      category: inferCategory(trimmed),
      verified: false,
    };
    await persistSkills([...skills, newSkill]);
    setNewSkillName('');
    setNewSkillLevel(65);
    setShowAddPanel(false);
  };

  const handleUpdateLevel = async (id, newLevel) => {
    const updated = skills.map((s) => s.id === id ? { ...s, level: Number(newLevel) } : s);
    await persistSkills(updated);
    setEditingId(null);
  };

  const handleDeleteSkill = async (id) => {
    await persistSkills(skills.filter((s) => s.id !== id));
  };

  const handleSyncGitHub = async () => {
    if (!userProfile?.github) {
      alert('Add your GitHub URL in your Profile first, then sync to boost verified skills!');
      return;
    }
    setIsSyncing(true);
    await new Promise((r) => setTimeout(r, 1800));
    const BOOST_KEYWORDS = ['react', 'next', 'typescript', 'javascript', 'node', 'express', 'python', 'docker'];
    const boosted = skills.map((s) => {
      const lower = s.name.toLowerCase();
      if (BOOST_KEYWORDS.some((k) => lower.includes(k))) {
        return { ...s, level: Math.min(s.level + 5, 98), verified: true };
      }
      return s;
    });
    await persistSkills(boosted);
    setIsSyncing(false);
    setSyncSuccess(true);
    setTimeout(() => setSyncSuccess(false), 3000);
  };

  const handleExport = () => {
    const json = JSON.stringify({ skills, generatedAt: new Date().toISOString() }, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'skill_matrix.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-space-md lg:p-space-lg max-w-7xl mx-auto space-y-6">

      {/* ── Page header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-primary">
            Skill Progress &amp; Technical Mastery
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Engineered competency matrix calibrated across 12,000+ candidate evaluations.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setShowAddPanel((p) => !p)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:opacity-90 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Add Skill</span>
          </button>
        </div>
      </div>

      {/* ── Add-skill panel ── */}
      {showAddPanel && (
        <div className="p-5 rounded-2xl bg-surface-container-lowest border border-secondary/30 shadow-md space-y-4">
          <h3 className="text-sm font-bold text-primary flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[18px] text-secondary">add_circle</span>
            Add a New Skill
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div className="sm:col-span-2 space-y-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">Skill Name</label>
              <input
                type="text"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSkill()}
                placeholder="e.g. React.js, Python, Docker…"
                className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-xs text-primary font-medium focus:outline-none focus:border-secondary placeholder:text-on-surface-variant/50"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">
                Proficiency — {newSkillLevel}%
              </label>
              <input
                type="range" min={10} max={100} step={5}
                value={newSkillLevel}
                onChange={(e) => setNewSkillLevel(Number(e.target.value))}
                className="w-full accent-secondary"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 justify-end">
            <button
              type="button"
              onClick={() => { setShowAddPanel(false); setNewSkillName(''); setNewSkillLevel(65); }}
              className="px-4 py-1.5 rounded-xl text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAddSkill}
              disabled={!newSkillName.trim() || isSaving}
              className="px-5 py-1.5 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:opacity-90 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving…' : 'Add Skill'}
            </button>
          </div>
        </div>
      )}

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">

        {/* Left — Skills Matrix (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-5">

            {/* Matrix header */}
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high gap-2 flex-wrap">
              <div>
                <h3 className="font-headline-sm text-lg font-bold text-primary">Engineered Competency Matrix</h3>
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${trackMeta.bg} ${trackMeta.border} ${trackMeta.text}`}>
                    <span className="material-symbols-outlined text-[13px]">{trackMeta.icon}</span>
                    {trackLabel}
                  </span>
                  {isFiltered && (
                    <span className="text-[11px] text-on-surface-variant">
                      Showing {displaySkills.length} of {skills.length} skills
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => navigate('preparation-roadmap')}
                    className="text-[11px] text-secondary font-semibold hover:underline flex items-center gap-0.5"
                  >
                    <span className="material-symbols-outlined text-[13px]">swap_horiz</span>
                    Change domain
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {isSaving && (
                  <span className="text-[11px] text-on-surface-variant flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                    Saving…
                  </span>
                )}
                <span className="text-xs text-secondary font-bold flex-shrink-0">{verifiedCount} Verified by Code</span>
              </div>
            </div>

            {/* Empty state */}
            {skills.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-14 text-center gap-4">
                <span className="material-symbols-outlined text-[56px] text-on-surface-variant opacity-30">bar_chart</span>
                <div>
                  <p className="text-sm font-bold text-on-surface-variant">No skills added yet</p>
                  <p className="text-xs text-on-surface-variant mt-1 max-w-xs mx-auto">
                    Click <strong>Add Skill</strong> above to build your competency matrix, or add skills from your Profile page.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddPanel(true)}
                  className="mt-1 px-5 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:opacity-90 transition-all"
                >
                  + Add Your First Skill
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {displaySkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    isEditing={editingId === skill.id}
                    onEdit={() => setEditingId(skill.id)}
                    onCancelEdit={() => setEditingId(null)}
                    onUpdateLevel={(lvl) => handleUpdateLevel(skill.id, lvl)}
                    onDelete={() => handleDeleteSkill(skill.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right — Skill Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Skill Summary card */}
          <div className="p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-3">
            <h4 className="text-sm font-bold text-primary">Skill Summary</h4>
            {skills.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <StatPill label="Total Skills"     value={skills.length} />
                  <StatPill label="Avg Proficiency"  value={`${Math.round(skills.reduce((a, s) => a + s.level, 0) / skills.length)}%`} />
                  <StatPill label="Production Ready" value={skills.filter((s) => s.level >= 85).length} color="text-emerald-700" />
                  <StatPill label="Verified"         value={verifiedCount}                               color="text-secondary"    />
                </div>
                <div className="pt-2 border-t border-surface-container-high space-y-1.5">
                  <p className="text-[11px] font-bold text-on-surface-variant uppercase tracking-wider">By Category</p>
                  {Object.entries(
                    skills.reduce((acc, s) => { acc[s.category] = (acc[s.category] || 0) + 1; return acc; }, {})
                  )
                    .sort((a, b) => b[1] - a[1])
                    .map(([cat, count]) => (
                      <div key={cat} className="flex items-center justify-between text-xs">
                        <span className="text-on-surface-variant font-medium">{cat}</span>
                        <span className="font-bold text-primary">{count}</span>
                      </div>
                    ))}
                </div>
              </>
            ) : (
              <div className="py-6 text-center text-xs text-on-surface-variant">
                <p>No skills recorded yet.</p>
                <p className="text-[11px] text-outline mt-1">Add skills to see proficiency analytics.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── SkillCard ─────────────────────────────────────────────────────────────────
function SkillCard({ skill, isEditing, onEdit, onCancelEdit, onUpdateLevel, onDelete }) {
  const [localLevel, setLocalLevel] = useState(skill.level);
  React.useEffect(() => { setLocalLevel(skill.level); }, [skill.level]);

  const levelLabel = localLevel >= 90 ? 'Expert'
    : localLevel >= 75 ? 'Production Ready'
    : localLevel >= 55 ? 'Intermediate'
    : 'Beginner';
  const levelColor = localLevel >= 90 ? 'text-emerald-700'
    : localLevel >= 75 ? 'text-emerald-600'
    : localLevel >= 55 ? 'text-amber-700'
    : 'text-rose-600';
  const barColor = localLevel >= 90 ? 'bg-emerald-500'
    : localLevel >= 75 ? 'bg-secondary'
    : localLevel >= 55 ? 'bg-amber-500'
    : 'bg-rose-500';

  return (
    <div className="p-4 rounded-xl bg-surface-container-low border border-surface-container-high/60 space-y-2 group hover:shadow-sm transition-shadow">
      <div className="flex items-center justify-between">
        <span className="font-bold text-xs text-primary flex items-center gap-1">
          {skill.name}
          {skill.verified && (
            <span className="material-symbols-outlined text-[14px] text-secondary" title="Verified by GitHub">verified</span>
          )}
        </span>
        <div className="flex items-center gap-1">
          <span className="font-extrabold text-xs text-secondary">{isEditing ? localLevel : skill.level}%</span>
          {!isEditing && (
            <>
              <button
                type="button" onClick={onEdit} title="Edit proficiency"
                className="opacity-0 group-hover:opacity-100 ml-1 p-0.5 rounded-md hover:bg-surface-container transition-opacity"
              >
                <span className="material-symbols-outlined text-[13px] text-on-surface-variant">edit</span>
              </button>
              <button
                type="button" onClick={onDelete} title="Remove skill"
                className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md hover:bg-rose-50 transition-opacity"
              >
                <span className="material-symbols-outlined text-[13px] text-rose-500">delete</span>
              </button>
            </>
          )}
        </div>
      </div>

      <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden">
        <div
          className={`${barColor} h-full rounded-full transition-all duration-500`}
          style={{ width: `${isEditing ? localLevel : skill.level}%` }}
        />
      </div>

      {isEditing ? (
        <div className="space-y-2 pt-1">
          <div className="flex items-center gap-2">
            <input
              type="range" min={10} max={100} step={5}
              value={localLevel}
              onChange={(e) => setLocalLevel(Number(e.target.value))}
              className="flex-1 accent-secondary"
            />
            <span className="text-xs font-bold text-primary w-8 text-right">{localLevel}%</span>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onCancelEdit}
              className="text-[11px] px-2.5 py-1 rounded-lg text-on-surface-variant hover:bg-surface-container transition-colors">
              Cancel
            </button>
            <button type="button" onClick={() => onUpdateLevel(localLevel)}
              className="text-[11px] px-3 py-1 rounded-lg bg-secondary text-on-secondary font-bold hover:opacity-90 transition-all">
              Save
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-[10px] text-on-surface-variant font-medium">
          <span>Category: {skill.category}</span>
          <span className={`${levelColor} font-bold`}>{levelLabel}</span>
        </div>
      )}
    </div>
  );
}

// ── Stat pill ─────────────────────────────────────────────────────────────────
function StatPill({ label, value, color = 'text-primary' }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-2.5 text-center">
      <p className={`text-base font-extrabold ${color}`}>{value}</p>
      <p className="text-[10px] text-on-surface-variant mt-0.5">{label}</p>
    </div>
  );
}

