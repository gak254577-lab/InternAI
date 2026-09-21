import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import CollegeSelect from '../components/common/CollegeSelect';

const POPULAR_SKILLS = [
  'React',
  'Python',
  'Java',
  'Node.js',
  'JavaScript',
  'TypeScript',
  'C++',
  'SQL',
  'Machine Learning',
  'AWS',
  'Docker',
  'Git',
  'MongoDB',
  'Tailwind CSS',
  'Data Structures'
];

const POPULAR_INTERESTS = [
  'Full Stack Development',
  'Backend Engineering',
  'Frontend / UI',
  'AI & Machine Learning',
  'Cloud & DevOps',
  'Data Science',
  'Mobile Development (Android/iOS)',
  'Cybersecurity'
];

const DEGREES = ['B.Tech', 'B.E.', 'B.S.', 'BCA', 'MCA', 'M.Tech', 'M.S.', 'Dual Degree (B.Tech + M.Tech)'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year / Final Year', 'Recent Graduate'];

export default function OnboardingPage() {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const { studentProfile, updateProfile, navigate } = useApp();

  const profile = userProfile || studentProfile;

  const [step, setStep] = useState(1); // 1: Academic, 2: Skills & Links, 3: Personal & Summary
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState(profile.name || currentUser?.displayName || '');
  const [phone, setPhone] = useState(profile.phone || '');
  const [college, setCollege] = useState(profile.college || '');
  const [degree, setDegree] = useState(profile.degree || 'B.Tech');
  const [branch, setBranch] = useState(profile.branch || 'Computer Science & Engineering');
  const [year, setYear] = useState(profile.year || '3rd Year');
  const [graduationYear, setGraduationYear] = useState(profile.graduationYear || '2027');
  const [cgpa, setCgpa] = useState(profile.cgpa || '');
  const [skills, setSkills] = useState(
    Array.isArray(profile.skills)
      ? profile.skills.map((s) => (typeof s === 'string' ? s : s.name))
      : ['React', 'JavaScript', 'Python']
  );
  const [skillInput, setSkillInput] = useState('');
  const [interests, setInterests] = useState(
    Array.isArray(profile.interests) && profile.interests.length > 0
      ? profile.interests
      : ['Full Stack Development', 'AI & Machine Learning']
  );
  const [interestInput, setInterestInput] = useState('');
  const [github, setGithub] = useState(profile.github || '');
  const [linkedin, setLinkedin] = useState(profile.linkedin || '');
  const [bio, setBio] = useState(
    profile.bio ||
      `Undergraduate student in ${branch || 'Computer Science'} passionate about building robust software solutions and exploring high-impact internships.`
  );

  useEffect(() => {
    if (currentUser?.displayName && !name) {
      setName(currentUser.displayName);
    }
  }, [currentUser]);

  const toggleSkill = (skill) => {
    if (skills.includes(skill)) {
      setSkills(skills.filter((s) => s !== skill));
    } else {
      setSkills([...skills, skill]);
    }
  };

  const handleAddCustomSkill = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      e.preventDefault();
      const val = skillInput.trim();
      if (val && !skills.includes(val)) {
        setSkills([...skills, val]);
        setSkillInput('');
      }
    }
  };

  const toggleInterest = (interest) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const handleAddCustomInterest = (e) => {
    if (e.key === 'Enter' || e.type === 'blur') {
      e.preventDefault();
      const val = interestInput.trim();
      if (val && !interests.includes(val)) {
        setInterests([...interests, val]);
        setInterestInput('');
      }
    }
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);

    const payload = {
      name: name.trim() || 'Student Candidate',
      phone: phone.trim(),
      college: college.trim() || 'University',
      degree,
      branch: branch.trim(),
      year,
      graduationYear,
      cgpa: cgpa.trim(),
      bio: bio.trim(),
      skills,
      interests,
      github: github.trim(),
      linkedin: linkedin.trim(),
      projects: profile.projects || [],
      certifications: profile.certifications || [],
      profileCompleted: true,
      readinessScore: Math.min(80 + (skills.length > 3 ? 10 : 5) + (cgpa ? 5 : 0), 98)
    };

    try {
      await updateUserProfile(payload);
      if (updateProfile) {
        updateProfile(payload);
      }
      navigate('dashboard');
    } catch (err) {
      console.error('Error saving profile during onboarding:', err);
      navigate('dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 selection:bg-secondary-fixed selection:text-on-secondary-fixed py-12">
      {/* Glow Effects */}
      <div className="absolute top-1/4 -right-20 w-96 h-96 rounded-full bg-secondary-fixed opacity-25 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 -left-20 w-96 h-96 rounded-full bg-primary-fixed opacity-20 blur-3xl pointer-events-none"></div>

      <div className="relative w-full max-w-2xl">
        {/* Brand Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <img
              alt="InternAI Logo"
              className="h-8 w-auto object-contain"
              src="/images/internai_logo.svg"
              onError={(e) => {
                e.target.src = '/images/internai_logo.png';
              }}
            />
            <span className="font-headline-sm text-xl text-primary font-bold tracking-tight">
              InternAI
            </span>
          </div>

          <button
            type="button"
            onClick={() => navigate('dashboard')}
            className="text-xs text-on-surface-variant hover:text-primary font-semibold transition-colors"
          >
            Skip for now →
          </button>
        </div>

        {/* Main Card */}
        <div className="p-6 sm:p-8 rounded-3xl bg-surface-container-lowest border border-surface-container-high shadow-2xl space-y-6">
          {/* Header & Step Tracker */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-secondary uppercase tracking-wider">
              <span>Step {step} of 3</span>
              <span>
                {step === 1 && 'Academic Credentials'}
                {step === 2 && 'Skills & Interests'}
                {step === 3 && 'Personal & Verification'}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-surface-container-high h-2 rounded-full overflow-hidden">
              <div
                className="bg-secondary h-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              ></div>
            </div>

            <div>
              <h1 className="font-display text-2xl font-bold text-primary">
                {step === 1 && 'Where do you study?'}
                {step === 2 && 'What are your technical superpowers?'}
                {step === 3 && 'Finalize your candidate profile'}
              </h1>
              <p className="text-xs text-on-surface-variant mt-1">
                {step === 1 &&
                  'Your academic background helps us verify your engineering student status and recommend matching roles.'}
                {step === 2 &&
                  'Select the technologies you know. Our AI matches your skills with live internship requirements.'}
                {step === 3 &&
                  'Add contact details and a short summary so recruiters can connect with you directly.'}
              </p>
            </div>
          </div>

          {/* Step 1: Academic Background */}
          {step === 1 && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  College / University in India *
                </label>
                <CollegeSelect
                  value={college}
                  onChange={setCollege}
                  required
                  placeholder="Select or search your college in India (e.g. IIT, NIT, BITS, VIT, DU)..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Degree *
                  </label>
                  <select
                    value={degree}
                    onChange={(e) => setDegree(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-all"
                  >
                    {DEGREES.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Branch / Major *
                  </label>
                  <input
                    type="text"
                    required
                    value={branch}
                    onChange={(e) => setBranch(e.target.value)}
                    placeholder="e.g. Computer Science, IT, AI & Data Science"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Current Year
                  </label>
                  <select
                    value={year}
                    onChange={(e) => setYear(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-all"
                  >
                    {YEARS.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    Graduation Year
                  </label>
                  <input
                    type="text"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                    placeholder="e.g. 2026, 2027"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-all"
                  />
                </div>

                <div>
                  <label className="block font-bold text-on-surface uppercase tracking-wider mb-1.5">
                    CGPA / Percentage
                  </label>
                  <input
                    type="text"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    placeholder="e.g. 8.6 / 10"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-all"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Skills & Interests */}
          {step === 2 && (
            <div className="space-y-5 text-xs">
              {/* Technical Skills */}
              <div className="space-y-2">
                <label className="block font-bold text-on-surface uppercase tracking-wider">
                  Technical Skills (Click to add or type below)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_SKILLS.map((sk) => {
                    const isSelected = skills.includes(sk);
                    return (
                      <button
                        key={sk}
                        type="button"
                        onClick={() => toggleSkill(sk)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                          isSelected
                            ? 'bg-secondary text-on-secondary shadow-sm'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-surface-container-high'
                        }`}
                      >
                        <span>{sk}</span>
                        {isSelected && (
                          <span className="material-symbols-outlined text-[14px]">check</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Custom skill input */}
                <div className="pt-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={handleAddCustomSkill}
                    placeholder="Type custom skill and press Enter (e.g. GraphQL, Flutter, PyTorch)..."
                    className="w-full px-3.5 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                  />
                </div>

                {/* Selected Skills Badges */}
                <div className="flex flex-wrap gap-1 pt-1">
                  <span className="text-[11px] font-bold text-on-surface-variant py-0.5">Selected:</span>
                  {skills.length === 0 && (
                    <span className="text-[11px] text-outline italic">No skills selected yet</span>
                  )}
                  {skills.map((sk) => (
                    <span
                      key={sk}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-secondary/10 text-secondary font-bold text-[11px]"
                    >
                      {sk}
                      <button
                        type="button"
                        onClick={() => toggleSkill(sk)}
                        className="hover:text-rose-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Career Interests */}
              <div className="space-y-2 pt-2 border-t border-surface-container-high">
                <label className="block font-bold text-on-surface uppercase tracking-wider">
                  Target Roles / Interests
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_INTERESTS.map((int) => {
                    const isSelected = interests.includes(int);
                    return (
                      <button
                        key={int}
                        type="button"
                        onClick={() => toggleInterest(int)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${
                          isSelected
                            ? 'bg-primary text-on-primary shadow-sm'
                            : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-surface-container-high'
                        }`}
                      >
                        {int}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Links */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2 border-t border-surface-container-high">
                <div>
                  <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                    GitHub Profile
                  </label>
                  <input
                    type="url"
                    value={github}
                    onChange={(e) => setGithub(e.target.value)}
                    placeholder="https://github.com/yourhandle"
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                    LinkedIn Profile
                  </label>
                  <input
                    type="url"
                    value={linkedin}
                    onChange={(e) => setLinkedin(e.target.value)}
                    placeholder="https://linkedin.com/in/yourhandle"
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Personal & Bio */}
          {step === 3 && (
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Abhishek Dogra"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-all"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface uppercase tracking-wider mb-1.5">
                  Candidate Bio / Summary
                </label>
                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share a brief overview of your interests, current projects, or target internship roles..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-all"
                ></textarea>
              </div>

              {/* Firestore sync note */}
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-secondary text-xs flex items-center gap-2.5">
                <span className="material-symbols-outlined text-[20px] text-secondary flex-shrink-0">
                  cloud_done
                </span>
                <span>
                  This profile will be saved securely to your <strong>Firestore User Document</strong> (<code>users/{currentUser?.uid || 'student'}</code>) for instant internship matching.
                </span>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-surface-container-high">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-4 py-2.5 rounded-xl border border-surface-container-high bg-surface text-on-surface text-xs font-semibold hover:bg-surface-container-low transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Previous</span>
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex items-center gap-2.5">
              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (step === 1 && !college.trim()) {
                      alert('Please enter your College or University name to proceed.');
                      return;
                    }
                    setStep(step + 1);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all flex items-center gap-1.5 shadow-md"
                >
                  <span>Continue</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSaveProfile}
                  className="px-6 py-2.5 rounded-xl bg-primary text-on-primary text-xs font-bold hover:bg-primary-container hover:text-on-primary-container transition-all flex items-center gap-2 shadow-lg disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <span className="material-symbols-outlined text-[16px] animate-spin">
                        progress_activity
                      </span>
                      <span>Saving to Firestore...</span>
                    </>
                  ) : (
                    <>
                      <span>Save Profile & Launch Dashboard</span>
                      <span className="material-symbols-outlined text-[16px]">rocket_launch</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
