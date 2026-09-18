import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

export default function StudentProfilePage() {
  const { userProfile, currentUser, updateUserProfile } = useAuth();
  const { studentProfile } = useApp();

  // Combine userProfile from Firestore with fallback defaults
  const profile = userProfile || studentProfile;

  const [showEditModal, setShowEditModal] = useState(false);
  const [activeEditTab, setActiveEditTab] = useState('personal'); // 'personal', 'academic', 'career', 'projects', 'certifications'
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields State
  // Personal
  const [name, setName] = useState(profile.name || '');
  const [phone, setPhone] = useState(profile.phone || '');

  // Academic
  const [college, setCollege] = useState(profile.college || '');
  const [degree, setDegree] = useState(profile.degree || '');
  const [branch, setBranch] = useState(profile.branch || '');
  const [year, setYear] = useState(profile.year || '');
  const [graduationYear, setGraduationYear] = useState(profile.graduationYear || '');
  const [cgpa, setCgpa] = useState(profile.cgpa || '');

  // Career
  const [skillsStr, setSkillsStr] = useState(
    Array.isArray(profile.skills)
      ? profile.skills.map((s) => (typeof s === 'string' ? s : s.name)).join(', ')
      : ''
  );
  const [interestsStr, setInterestsStr] = useState(
    Array.isArray(profile.interests) ? profile.interests.join(', ') : ''
  );
  const [github, setGithub] = useState(profile.github || '');
  const [linkedin, setLinkedin] = useState(profile.linkedin || '');
  const [bio, setBio] = useState(profile.bio || '');

  // Projects
  const [projects, setProjects] = useState(profile.projects || []);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjTech, setNewProjTech] = useState('');

  // Certifications
  const [certifications, setCertifications] = useState(
    profile.certifications || []
  );
  const [newCertName, setNewCertName] = useState('');
  const [newCertIssuer, setNewCertIssuer] = useState('');
  const [newCertDate, setNewCertDate] = useState('');

  // Sync state when profile updates from Firestore
  useEffect(() => {
    if (profile) {
      setName(profile.name || '');
      setPhone(profile.phone || '');
      setCollege(profile.college || '');
      setDegree(profile.degree || '');
      setBranch(profile.branch || '');
      setYear(profile.year || '');
      setGraduationYear(profile.graduationYear || '');
      setCgpa(profile.cgpa || '');
      setBio(profile.bio || '');
      setGithub(profile.github || '');
      setLinkedin(profile.linkedin || '');
      if (Array.isArray(profile.skills)) {
        setSkillsStr(profile.skills.map((s) => (typeof s === 'string' ? s : s.name)).join(', '));
      }
      if (Array.isArray(profile.interests)) {
        setInterestsStr(profile.interests.join(', '));
      }
      if (Array.isArray(profile.projects)) {
        setProjects(profile.projects);
      }
      if (Array.isArray(profile.certifications)) {
        setCertifications(profile.certifications);
      }
    }
  }, [profile]);

  const handleAddProject = () => {
    if (!newProjName.trim()) return;
    const added = {
      id: `proj-${Date.now()}`,
      title: newProjName,
      desc: newProjDesc,
      tags: newProjTech.split(',').map((t) => t.trim()).filter(Boolean),
      stars: 12,
      github: github || 'https://github.com/',
      demo: '#'
    };
    setProjects((prev) => [...prev, added]);
    setNewProjName('');
    setNewProjDesc('');
    setNewProjTech('');
  };

  const handleRemoveProject = (id) => {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  const handleAddCert = () => {
    if (!newCertName.trim()) return;
    const added = {
      name: newCertName,
      issuer: newCertIssuer || 'Verified Issuer',
      date: newCertDate || '2026'
    };
    setCertifications((prev) => [...prev, added]);
    setNewCertName('');
    setNewCertIssuer('');
    setNewCertDate('');
  };

  const handleRemoveCert = (index) => {
    setCertifications((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveToFirestore = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const parsedSkills = skillsStr.split(',').map((s) => s.trim()).filter(Boolean);
      const parsedInterests = interestsStr.split(',').map((i) => i.trim()).filter(Boolean);

      const payload = {
        name,
        phone,
        college,
        degree,
        branch,
        year,
        graduationYear,
        cgpa,
        bio,
        skills: parsedSkills,
        interests: parsedInterests,
        github,
        linkedin,
        projects,
        certifications,
        resumeMetadata: profile.resumeMetadata || {
          resumeName: 'Student_Resume_2026.pdf',
          updatedAt: new Date().toISOString()
        }
      };

      await updateUserProfile(payload);
      setShowEditModal(false);
    } catch (err) {
      console.error('Error saving profile to Firestore:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const skillsList = Array.isArray(profile.skills)
    ? profile.skills.map((s) => (typeof s === 'string' ? s : s.name))
    : [];

  const interestsList = Array.isArray(profile.interests)
    ? profile.interests
    : [];

  return (
    <div className="p-space-md lg:p-space-lg max-w-7xl mx-auto space-y-6">
      {/* Profile Top Hero Card */}
      <div className="p-6 lg:p-8 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6">
          <img
            alt={profile.name}
            className="w-24 h-24 rounded-2xl object-cover ring-2 ring-outline-variant shadow-md"
            src={currentUser?.photoURL || profile.photoURL || '/images/student_avatar.png'}
            onError={(e) => {
              e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
            }}
          />
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-primary">
                {profile.name}
              </h1>
              <span className="px-3 py-1 rounded-full bg-surface-container-low text-on-secondary-fixed-variant border border-secondary-fixed font-label-sm text-xs font-semibold">
                <span className="w-2 h-2 rounded-full bg-secondary inline-block mr-1.5"></span>
                {profile.status || 'Ready to Apply'}
              </span>
            </div>
            <p className="text-sm font-semibold text-on-surface">
              {profile.degree} • <span className="text-on-surface-variant">{profile.college}</span>
            </p>
            <p className="text-xs text-on-surface-variant font-medium">
              {profile.branch} • {profile.year} (Class of {profile.graduationYear || '2027'}) • CGPA:{' '}
              <strong className="text-primary font-bold">{profile.cgpa}</strong>
            </p>
            <div className="flex flex-wrap gap-4 pt-1 text-xs text-on-surface-variant font-medium">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-secondary">mail</span>
                {currentUser?.email || profile.email}
              </span>
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-secondary">call</span>
                {profile.phone}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col gap-2.5 items-stretch md:items-end">
          <button
            type="button"
            onClick={() => setShowEditModal(true)}
            className="px-4 py-2.5 rounded-xl bg-secondary text-on-secondary font-bold text-xs hover:bg-secondary-container transition-all flex items-center justify-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">edit_note</span>
            <span>Edit Profile in Firestore</span>
          </button>
          <a
            href={profile.github || 'https://github.com'}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 rounded-xl bg-surface-container-lowest border border-surface-container-high text-on-surface font-semibold text-xs hover:bg-surface-container-low transition-colors flex items-center justify-center gap-1"
          >
            <span>GitHub Profile</span>
            <span className="material-symbols-outlined text-[14px]">open_in_new</span>
          </a>
        </div>
      </div>

      {/* Main Grid: Projects & Experience (8 cols) + Academic & Certifications (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Column (8 cols): Bio + Skills & Interests + Verified Projects */}
        <div className="lg:col-span-8 space-y-6">
          {/* Bio statement */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-2">
            <h3 className="font-headline-sm text-base font-bold text-primary">
              Candidate Summary &amp; Background
            </h3>
            <p className="text-sm text-on-surface-variant leading-relaxed">
              {profile.bio || 'No bio added yet. Click \'Edit Profile\' to add a summary about yourself.'}
            </p>
          </div>

          {/* Skills & Career Interests */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-surface-container-high">
              <h3 className="font-headline-sm text-base font-bold text-primary">
                Career Competencies &amp; Interests
              </h3>
              <span className="text-xs text-secondary font-bold">
                Synced with Firestore
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-bold text-on-surface-variant uppercase tracking-wider text-[10px] block mb-2">
                  Technical Skills ({skillsList.length})
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {skillsList.map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-surface-container-low text-primary font-semibold border border-surface-container-high"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <span className="font-bold text-on-surface-variant uppercase tracking-wider text-[10px] block mb-2">
                  Career Interests
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {interestsList.map((interest, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-secondary-fixed/50 text-on-secondary-fixed-variant font-semibold"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Verified Projects Showcase */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <div>
                <h3 className="font-headline-sm text-lg font-bold text-primary">
                  Technical Projects ({projects.length})
                </h3>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  Personal and open-source applications built and deployed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setActiveEditTab('projects');
                  setShowEditModal(true);
                }}
                className="text-xs font-bold text-secondary hover:underline flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                Add Project
              </button>
            </div>

            <div className="space-y-4">
              {projects.length === 0 ? (
                <div className="p-8 text-center text-xs text-outline border-2 border-dashed border-outline-variant/40 rounded-xl">
                  No projects added yet. Click 'Add Project' to showcase your software work.
                </div>
              ) : (
                projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-5 rounded-xl bg-surface-container-low border border-surface-container-high/70 space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-title-md font-bold text-primary text-base">
                          {proj.title}
                        </h4>
                        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
                          {proj.desc}
                        </p>
                      </div>
                      {proj.stars && (
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                          <span className="material-symbols-outlined text-[14px]">star</span>
                          <span>{proj.stars}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {proj.tags &&
                        proj.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-surface-container-lowest text-primary text-[11px] font-semibold border border-outline-variant/30"
                          >
                            {tag}
                          </span>
                        ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column (4 cols): Academic & Certifications & Resume Metadata */}
        <div className="lg:col-span-4 space-y-6">
          {/* Academic Info Card */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-3">
            <h3 className="font-title-md font-bold text-primary">
              Academic Record
            </h3>
            <div className="space-y-2 text-xs">
              <div className="p-3 rounded-xl bg-surface-container-low flex justify-between items-center">
                <span className="text-on-surface-variant">College</span>
                <span className="font-bold text-primary text-right max-w-[180px] truncate">{profile.college}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low flex justify-between items-center">
                <span className="text-on-surface-variant">Degree &amp; Branch</span>
                <span className="font-bold text-primary">{profile.branch}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low flex justify-between items-center">
                <span className="text-on-surface-variant">Graduation Year</span>
                <span className="font-bold text-primary">{profile.graduationYear || '2027'}</span>
              </div>
              <div className="p-3 rounded-xl bg-surface-container-low flex justify-between items-center">
                <span className="text-on-surface-variant">CGPA</span>
                <span className="font-bold text-secondary text-sm">{profile.cgpa} / 10.0</span>
              </div>
            </div>
          </div>

          {/* Certifications Card */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-title-md font-bold text-primary">
                Certifications ({certifications.length})
              </h3>
              <button
                type="button"
                onClick={() => {
                  setActiveEditTab('certifications');
                  setShowEditModal(true);
                }}
                className="text-xs font-bold text-secondary hover:underline"
              >
                + Add
              </button>
            </div>

            <div className="space-y-2 text-xs">
              {certifications.map((cert, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-surface-container-low flex items-start gap-2.5">
                  <span className="material-symbols-outlined text-[18px] text-secondary mt-0.5 flex-shrink-0">
                    verified
                  </span>
                  <div className="flex-1">
                    <span className="font-bold text-primary block">{cert.name}</span>
                    <span className="text-[11px] text-on-surface-variant">
                      {cert.issuer} • {cert.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resume Metadata Data Model */}
          <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-3">
            <h3 className="font-title-md font-bold text-primary">
              Resume Metadata
            </h3>
            <div className="p-3 rounded-xl bg-surface-container-low text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-on-surface-variant">Current File</span>
                <span className="font-bold text-primary truncate max-w-[150px]">
                  {profile.resumeMetadata?.resumeName || 'Student_Resume.pdf'}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-outline">Last Synced</span>
                <span className="text-on-surface-variant">
                  {profile.resumeMetadata?.updatedAt
                    ? new Date(profile.resumeMetadata.updatedAt).toLocaleDateString()
                    : 'Recently'}
                </span>
              </div>
            </div>
            <p className="text-[11px] text-outline italic">
              * Resume file uploads will be connected to Firebase Storage in a subsequent task.
            </p>
          </div>
        </div>
      </div>

      {/* Edit Profile in Firestore Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high max-w-2xl w-full p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <div>
                <h3 className="font-headline-sm text-lg font-bold text-primary">
                  Edit Student Profile in Firestore
                </h3>
                <p className="text-xs text-on-surface-variant">users/{currentUser?.uid || 'guest'}</p>
              </div>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex border-b border-surface-container-high gap-2 text-xs font-semibold">
              {[
                { id: 'personal', label: 'Personal' },
                { id: 'academic', label: 'Academic' },
                { id: 'career', label: 'Career & Skills' },
                { id: 'projects', label: 'Projects' },
                { id: 'certifications', label: 'Certifications' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveEditTab(tab.id)}
                  className={`pb-2 px-2 border-b-2 transition-colors ${
                    activeEditTab === tab.id
                      ? 'border-secondary text-secondary'
                      : 'border-transparent text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable Tab Content Form */}
            <form onSubmit={handleSaveToFirestore} className="space-y-4 text-xs flex-1 overflow-y-auto pr-1">
              {activeEditTab === 'personal' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                      Candidate Bio / Summary
                    </label>
                    <textarea
                      rows={3}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                    ></textarea>
                  </div>
                </div>
              )}

              {activeEditTab === 'academic' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                      College / University *
                    </label>
                    <input
                      type="text"
                      required
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                        Degree
                      </label>
                      <input
                        type="text"
                        value={degree}
                        onChange={(e) => setDegree(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                        Branch / Major
                      </label>
                      <input
                        type="text"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                        Current Year
                      </label>
                      <input
                        type="text"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                        Graduation Year
                      </label>
                      <input
                        type="text"
                        value={graduationYear}
                        onChange={(e) => setGraduationYear(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                        CGPA
                      </label>
                      <input
                        type="text"
                        value={cgpa}
                        onChange={(e) => setCgpa(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeEditTab === 'career' && (
                <div className="space-y-3">
                  <div>
                    <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                      Skills (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={skillsStr}
                      onChange={(e) => setSkillsStr(e.target.value)}
                      placeholder="React.js, Node.js, Python, Redis..."
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                      Interests (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={interestsStr}
                      onChange={(e) => setInterestsStr(e.target.value)}
                      placeholder="Full Stack, Distributed Systems, ML..."
                      className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                        GitHub Profile URL
                      </label>
                      <input
                        type="url"
                        value={github}
                        onChange={(e) => setGithub(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                        LinkedIn Profile URL
                      </label>
                      <input
                        type="url"
                        value={linkedin}
                        onChange={(e) => setLinkedin(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeEditTab === 'projects' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-surface-container-low space-y-2 border border-surface-container-high">
                    <span className="font-bold text-primary block">Add New Project</span>
                    <input
                      type="text"
                      placeholder="Project Name"
                      value={newProjName}
                      onChange={(e) => setNewProjName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-outline-variant text-xs"
                    />
                    <textarea
                      rows={2}
                      placeholder="Description of what was built and impact"
                      value={newProjDesc}
                      onChange={(e) => setNewProjDesc(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-outline-variant text-xs"
                    />
                    <input
                      type="text"
                      placeholder="Technologies (comma-separated, e.g. React, Redis)"
                      value={newProjTech}
                      onChange={(e) => setNewProjTech(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-outline-variant text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddProject}
                      className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-semibold text-xs"
                    >
                      + Append to Projects
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-primary block">Current Projects ({projects.length})</span>
                    {projects.map((p) => (
                      <div key={p.id} className="p-3 rounded-lg bg-surface flex items-center justify-between border">
                        <div>
                          <span className="font-bold text-primary block">{p.title}</span>
                          <span className="text-[11px] text-on-surface-variant truncate block max-w-sm">{p.desc}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProject(p.id)}
                          className="text-rose-600 hover:text-rose-800"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeEditTab === 'certifications' && (
                <div className="space-y-4">
                  <div className="p-3 rounded-xl bg-surface-container-low space-y-2 border border-surface-container-high">
                    <span className="font-bold text-primary block">Add Certification</span>
                    <input
                      type="text"
                      placeholder="Certification Name"
                      value={newCertName}
                      onChange={(e) => setNewCertName(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg bg-surface border border-outline-variant text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Issuing Organization"
                        value={newCertIssuer}
                        onChange={(e) => setNewCertIssuer(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-surface border border-outline-variant text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Date (e.g. 2026)"
                        value={newCertDate}
                        onChange={(e) => setNewCertDate(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg bg-surface border border-outline-variant text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddCert}
                      className="px-3 py-1.5 rounded-lg bg-primary-container text-on-primary font-semibold text-xs"
                    >
                      + Append to Certifications
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-primary block">Current Certifications</span>
                    {certifications.map((c, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-surface flex items-center justify-between border">
                        <div>
                          <span className="font-bold text-primary block">{c.name}</span>
                          <span className="text-[11px] text-on-surface-variant">
                            {c.issuer} • {c.date}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveCert(idx)}
                          className="text-rose-600 hover:text-rose-800"
                        >
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-surface-container-high flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl border border-surface-container-high text-on-surface font-semibold hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl bg-secondary text-on-secondary font-bold hover:bg-secondary-container transition-all shadow-sm flex items-center gap-1.5"
                >
                  {isSaving ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        progress_activity
                      </span>
                      <span>Saving to Firestore...</span>
                    </>
                  ) : (
                    <span>Save to Firestore</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
