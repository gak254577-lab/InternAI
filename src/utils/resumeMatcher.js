/**
 * resumeMatcher.js
 *
 * Performs client-side single-pass matching between an analyzed resume profile
 * and the platform's existing internship listings (Adzuna, LinkedIn, Firestore).
 *
 * This avoids redundant AI calls per internship while accurately calculating:
 * 1. Resume Match Score (0–100%)
 * 2. Matched Skills (skills found in resume)
 * 3. Missing Skills (critical required skills absent from resume)
 */

// Common tech synonyms and aliases for robust fuzzy matching
const SYNONYMS = {
  react: ['react', 'react.js', 'reactjs', 'react native'],
  javascript: ['javascript', 'js', 'es6', 'ecmascript'],
  typescript: ['typescript', 'ts'],
  node: ['node', 'node.js', 'nodejs'],
  python: ['python', 'py', 'python3'],
  html: ['html', 'html5'],
  css: ['css', 'css3', 'scss', 'sass'],
  tailwind: ['tailwind', 'tailwind css', 'tailwindcss'],
  mongodb: ['mongodb', 'mongo'],
  sql: ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'oracle'],
  postgresql: ['postgresql', 'postgres', 'psql'],
  docker: ['docker', 'containerization', 'containers'],
  kubernetes: ['kubernetes', 'k8s'],
  aws: ['aws', 'amazon web services', 'ec2', 's3', 'lambda'],
  gcp: ['gcp', 'google cloud', 'google cloud platform'],
  azure: ['azure', 'microsoft azure'],
  git: ['git', 'github', 'gitlab', 'version control'],
  nextjs: ['next.js', 'nextjs', 'next'],
  express: ['express', 'express.js', 'expressjs'],
  java: ['java', 'spring', 'springboot', 'spring boot'],
  cplusplus: ['c++', 'cpp'],
  csharp: ['c#', 'csharp', '.net', 'dotnet'],
  machinelearning: ['machine learning', 'ml', 'deep learning', 'ai', 'data science', 'pytorch', 'tensorflow'],
  restapi: ['rest', 'rest api', 'restful', 'restful api', 'apis'],
};

/**
 * Normalizes a skill string for comparison.
 */
function normalizeSkill(s) {
  return String(s || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s+#.-]/g, '');
}

/**
 * Checks whether a candidate skill matches a required skill.
 */
function isSkillMatch(candidateSkill, requiredSkill) {
  const cNorm = normalizeSkill(candidateSkill);
  const rNorm = normalizeSkill(requiredSkill);

  if (!cNorm || !rNorm) return false;

  // Exact or direct inclusion match
  if (cNorm === rNorm || cNorm.includes(rNorm) || rNorm.includes(cNorm)) {
    return true;
  }

  // Synonym check
  for (const group of Object.values(SYNONYMS)) {
    const candidateInGroup = group.some((alias) => cNorm.includes(alias) || alias.includes(cNorm));
    const requiredInGroup = group.some((alias) => rNorm.includes(alias) || alias.includes(rNorm));
    if (candidateInGroup && requiredInGroup) {
      return true;
    }
  }

  return false;
}

/**
 * Extracts key technology terms from text (e.g. description or title).
 */
export function extractTechKeywordsFromText(text = '') {
  const commonTech = [
    'React', 'JavaScript', 'TypeScript', 'Node.js', 'Python', 'Java', 'C++', 'C#',
    'HTML', 'CSS', 'Tailwind', 'MongoDB', 'SQL', 'PostgreSQL', 'Docker', 'AWS',
    'Git', 'Kubernetes', 'Next.js', 'Express', 'Machine Learning', 'REST API',
    'Django', 'Flask', 'Spring Boot', 'Redux', 'GraphQL', 'Linux', 'Figma'
  ];

  const lower = text.toLowerCase();
  return commonTech.filter((tech) => {
    const rx = new RegExp(`\\b${tech.replace('+', '\\+').replace('.', '\\.')}\\b`, 'i');
    return rx.test(lower) || lower.includes(tech.toLowerCase());
  });
}

/**
 * Matches an analyzed resume profile against a list of internships.
 *
 * @param {object} resumeProfile - Extracted resume profile from Gemini
 * @param {string[]} resumeProfile.extractedSkills - Candidate skills
 * @param {string[]} [resumeProfile.targetRoles=[]] - Target roles / domain interests
 * @param {object[]} internships - List of existing internships from state/APIs
 * @returns {object[]} Ranked recommended internships with match scores and skill gaps
 */
export function matchResumeWithInternships(resumeProfile, internships = []) {
  if (!internships || internships.length === 0) {
    return [];
  }

  const candidateSkills = (resumeProfile?.extractedSkills || []).map((s) => String(s).trim());
  const targetRoles = (resumeProfile?.targetRoles || []).map((r) => String(r).toLowerCase());

  const scoredInternships = internships.map((internship) => {
    // Collect required skills from tags, skills array, and text
    const declaredSkills = [
      ...(internship.skills || []),
      ...(internship.tags || []),
    ];

    // If internship has few tags, extract tech keywords from title and description
    const textSkills = extractTechKeywordsFromText(
      `${internship.title || ''} ${internship.description || ''}`
    );

    const allRequired = [...new Set([...declaredSkills, ...textSkills])].filter(Boolean);

    // Identify matched and missing skills
    const matchedSkills = [];
    const missingSkills = [];

    allRequired.forEach((req) => {
      const matched = candidateSkills.some((cand) => isSkillMatch(cand, req));
      if (matched) {
        matchedSkills.push(req);
      } else {
        missingSkills.push(req);
      }
    });

    // 1. Skill Match Score (0–100)
    let skillScore = 70; // baseline
    if (allRequired.length > 0) {
      skillScore = Math.round((matchedSkills.length / allRequired.length) * 100);
    } else if (candidateSkills.length > 0) {
      skillScore = 75;
    }

    // 2. Role / Title Match Score (0–100)
    let roleScore = 65;
    const titleLower = (internship.title || '').toLowerCase();
    if (targetRoles.some((tr) => titleLower.includes(tr) || tr.includes(titleLower))) {
      roleScore = 95;
    } else if (
      titleLower.includes('software') ||
      titleLower.includes('developer') ||
      titleLower.includes('engineer') ||
      titleLower.includes('frontend') ||
      titleLower.includes('backend') ||
      titleLower.includes('full stack')
    ) {
      roleScore = 80;
    }

    // 3. Keyword Context Score (0–100)
    let keywordScore = 60;
    const descLower = (internship.description || '').toLowerCase();
    const candidateMatchesInDesc = candidateSkills.filter((cs) =>
      descLower.includes(cs.toLowerCase())
    ).length;
    keywordScore = Math.min(95, 50 + candidateMatchesInDesc * 10);

    // Overall Weighted Resume Match Score
    // Skills: 55%, Role: 30%, Keywords/Desc: 15%
    const resumeMatchScore = Math.max(
      20,
      Math.min(99, Math.round(skillScore * 0.55 + roleScore * 0.30 + keywordScore * 0.15))
    );

    return {
      ...internship,
      resumeMatchScore,
      matchedSkills: [...new Set(matchedSkills)],
      missingSkills: [...new Set(missingSkills)],
      totalRequiredSkillsCount: allRequired.length,
    };
  });

  // Sort descending by Resume Match Score
  return scoredInternships.sort((a, b) => b.resumeMatchScore - a.resumeMatchScore);
}
