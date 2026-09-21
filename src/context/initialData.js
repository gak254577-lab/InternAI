// This file previously held hardcoded demo/mock content (a fake student
// "Aanya Sharma", 6 fake internships at real companies, fake applications,
// a fake prep roadmap, a fake mock-interview transcript, and a fake resume
// analysis). All of that has been removed.
//
// What remains below are empty-but-structurally-valid defaults: the shapes
// every page expects before any real data exists (before the student has
// filled in their profile, before internships are loaded from Firestore,
// before they've applied anywhere, etc.). Nothing here is shown to the user
// as if it were real — pages should treat empty values as "nothing yet"
// and render an empty/loading state instead.

export const initialStudentProfile = {
  id: "",
  name: "",
  avatar: "/images/student_avatar.png",
  college: "",
  degree: "",
  year: "",
  cgpa: "",
  status: "",
  readinessScore: 0,
  email: "",
  phone: "",
  location: "",
  github: "",
  linkedin: "",
  portfolio: "",
  bio: "",
  targetRoles: [],
  verifiedCoursework: [],
  skills: [],
  projects: []
};

// Real internship listings live in Firestore (see Step 3 work). This stays
// empty so the app never shows fake/demo internships as if they were real.
export const initialInternships = [];

export const initialApplications = [];

export const initialRoadmapMilestones = [];

export const initialMockInterview = {
  currentRole: "",
  topic: "",
  timerSeconds: 0,
  questionNumber: 0,
  totalQuestions: 0,
  currentQuestion: {
    id: "",
    prompt: "",
    idealPoints: []
  },
  realtimeEvaluation: {
    technicalAccuracy: 0,
    clarityScore: 0,
    architectureDepth: 0,
    confidenceIndex: 0,
    feedbackNotes: []
  },
  transcriptLog: []
};

export const initialResumeAnalysis = {
  fileName: "",
  uploadDate: "",
  atsScore: 0,
  atsScoreReason: "",
  scoreBreakdown: null,
  candidateInfo: null,
  parsedData: {
    extractedSkills: [],
    missingKeywordsForTargetRole: []
  },
  recommendations: [],
  matchBreakdown: {},
  recommendedInternships: []
};