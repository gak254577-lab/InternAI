// Eligibility Engine (Step 4)
// Compares a student's profile against an internship's stated requirements
// and produces a per-requirement checklist plus a single-line verdict.
//
// NOTE: This is informational only. As per project rules, the final
// eligibility decision always belongs to the internship provider — InternAI
// only tells the student whether they appear to meet the *listed* criteria.

/** Pulls the first number out of a string like "9.12 / 10.0" or "9.12". */
function parseCGPA(rawCgpa) {
  if (rawCgpa === null || rawCgpa === undefined) return null;
  if (typeof rawCgpa === 'number') return rawCgpa;
  const match = String(rawCgpa).match(/(\d+(\.\d+)?)/);
  return match ? parseFloat(match[1]) : null;
}

/** Pulls the leading integer out of strings like "3rd Year (Class of 2027)" or "3rd Year". */
function parseYear(rawYear) {
  if (rawYear === null || rawYear === undefined) return null;
  if (typeof rawYear === 'number') return rawYear;
  const match = String(rawYear).match(/(\d+)/);
  return match ? parseInt(match[1], 10) : null;
}

/** Skills on a profile can be plain strings (Firestore) or {name, ...} objects (mock data). */
function normalizeSkillList(skills) {
  if (!Array.isArray(skills)) return [];
  return skills
    .map((s) => (typeof s === 'string' ? s : s?.name))
    .filter(Boolean)
    .map((s) => s.toLowerCase().trim());
}

/** Loose case-insensitive containment match in either direction, e.g. "React" <-> "React.js". */
function fuzzyIncludes(haystackList, needle) {
  const target = needle.toLowerCase().trim();
  return haystackList.some((item) => item.includes(target) || target.includes(item));
}

/**
 * @param {object} profile - student profile (userProfile from Firestore, or the mock studentProfile fallback)
 * @param {object} internship - internship record. Supports either the full Step-3 schema
 *   (degree[], branches[], eligibleYears[], minCGPA, skills[]) or falls back gracefully
 *   to legacy fields (tags[]) where the newer fields aren't present yet on a record.
 * @returns {{ checks: Array<{label: string, passed: boolean, detail: string}>, overallEligible: boolean, verdict: string }}
 */
export function checkEligibility(profile, internship) {
  const checks = [];

  const profileSkills = normalizeSkillList(profile?.skills);
  const requiredSkills = internship?.skills?.length ? internship.skills : internship?.tags || [];

  requiredSkills.forEach((skill) => {
    const passed = fuzzyIncludes(profileSkills, skill);
    checks.push({
      label: skill,
      passed,
      detail: passed ? 'Found on your profile' : 'Not listed on your profile yet'
    });
  });

  // CGPA
  if (internship?.minCGPA !== undefined && internship?.minCGPA !== null) {
    const studentCGPA = parseCGPA(profile?.cgpa);
    const passed = studentCGPA !== null && studentCGPA >= internship.minCGPA;
    checks.push({
      label: 'CGPA',
      passed,
      detail:
        studentCGPA === null
          ? 'CGPA not set on your profile'
          : `Your ${studentCGPA} vs required ${internship.minCGPA}+`
    });
  }

  // Degree
  if (internship?.degree?.length) {
    const studentDegree = (profile?.degree || '').toLowerCase();
    const passed = internship.degree.some((d) => studentDegree.includes(d.toLowerCase()));
    checks.push({
      label: 'Degree',
      passed,
      detail: passed
        ? `Matches ${profile?.degree}`
        : `Requires: ${internship.degree.join(' / ')}`
    });
  }

  // Branch
  if (internship?.branches?.length) {
    const studentBranch = (profile?.branch || profile?.degree || '').toLowerCase();
    const passed = internship.branches.some((b) => studentBranch.includes(b.toLowerCase()));
    checks.push({
      label: 'Branch',
      passed,
      detail: passed
        ? `Matches ${profile?.branch || internship.branches.find((b) => studentBranch.includes(b.toLowerCase()))}`
        : `Requires: ${internship.branches.join(' / ')}`
    });
  }

  // Eligible Year
  if (internship?.eligibleYears?.length) {
    const studentYear = parseYear(profile?.year);
    const passed = studentYear !== null && internship.eligibleYears.includes(studentYear);
    checks.push({
      label: 'Year',
      passed,
      detail:
        studentYear === null
          ? 'Year not set on your profile'
          : `Your Year ${studentYear} vs eligible Years ${internship.eligibleYears.join(', ')}`
    });
  }

  const overallEligible = checks.length > 0 && checks.every((c) => c.passed);
  const verdict = overallEligible
    ? 'You appear to meet the listed requirements.'
    : "You don't currently meet all the listed requirements.";

  return { checks, overallEligible, verdict };
}