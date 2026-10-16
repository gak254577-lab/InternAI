import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initialStudentProfile,
  initialInternships,
  initialApplications,
  initialRoadmapMilestones,
  initialMockInterview,
  initialResumeAnalysis
} from './initialData';
import { fetchAdzunaInternships } from '../services/adzunaService';
import { fetchLinkedInInternships } from '../services/linkedinService';
import { useToast } from './ToastContext';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Navigation State
  const [currentRoute, setCurrentRoute] = useState(() => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    return hash || 'dashboard';
  });
  const [selectedInternshipId, setSelectedInternshipId] = useState(null);
  // Selected application for Mock Interview
  const [selectedApplicationId, setSelectedApplicationId] = useState(null);

  // Sync route with URL hash for easy browser history and bookmarks
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#/', '').replace('#', '');
      if (hash.startsWith('internship/')) {
        const id = hash.replace('internship/', '');
        setSelectedInternshipId(id);
        setCurrentRoute('internship-details');
      } else if (hash) {
        setCurrentRoute(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (route, param = null) => {
    if (route === 'internship-details' && param) {
      setSelectedInternshipId(param);
      window.location.hash = `/internship/${param}`;
      setCurrentRoute('internship-details');
    } else {
      window.location.hash = `/${route}`;
      setCurrentRoute(route);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Navigate to Mock Interview pre-loaded with a specific application.
   * @param {string} applicationId - The application's id field
   */
  const navigateToInterview = (applicationId) => {
    setSelectedApplicationId(applicationId);
    window.location.hash = '/mock-interview';
    setCurrentRoute('mock-interview');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Persistent State in LocalStorage
  const [studentProfile, setStudentProfile] = useState(() => {
    const saved = localStorage.getItem('internai_student_profile');
    return saved ? JSON.parse(saved) : initialStudentProfile;
  });

  // Selected preparation track — shared between PreparationRoadmapPage & SkillProgressPage
  const [selectedTrack, setSelectedTrack] = useState(() => {
    return localStorage.getItem('internai_selected_track') || 'fullstack';
  });

  const [internships, setInternships] = useState(() => {
    // Always start fresh — internships are fetched live from APIs
    localStorage.removeItem('internai_internships');
    return initialInternships;
  });

  const [applications, setApplications] = useState(() => {
    // Always start fresh — no pre-loaded demo applications
    localStorage.removeItem('internai_applications');
    return initialApplications;
  });

  const [bookmarks, setBookmarks] = useState(() => {
    localStorage.removeItem('internai_bookmarks');
    return [];
  });

  const [roadmap, setRoadmap] = useState(() => {
    // Always start fresh — roadmap is generated per user
    localStorage.removeItem('internai_roadmap');
    return initialRoadmapMilestones;
  });

  const [mockInterview, setMockInterview] = useState(() => {
    const saved = localStorage.getItem('internai_mock_interview');
    return saved ? JSON.parse(saved) : initialMockInterview;
  });

  const [resumeAnalysis, setResumeAnalysis] = useState(() => {
    // Always start fresh — resume analysis is session-only
    localStorage.removeItem('internai_resume_analysis');
    return initialResumeAnalysis;
  });

  // Adzuna live internship fetch state
  const [adzunaLoading, setAdzunaLoading] = useState(false);
  const [adzunaError, setAdzunaError] = useState(null);
  const [adzunaTotalCount, setAdzunaTotalCount] = useState(0);

  // LinkedIn RapidAPI live internship fetch state
  const [linkedinLoading, setLinkedinLoading] = useState(false);
  const [linkedinError, setLinkedinError] = useState(null);
  const [isRapidApiConfigured, setIsRapidApiConfigured] = useState(false);

  // Global Search State
  const [globalSearch, setGlobalSearch] = useState('');

  // "Did you apply?" Return tracking state
  const { showToast } = useToast() || {};
  const [pendingApplyJob, setPendingApplyJob] = useState(() => {
    try {
      const saved = localStorage.getItem('internai_pending_apply');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [showApplyModal, setShowApplyModal] = useState(false);

  // Return-from-external-site detection when user tabs back
  useEffect(() => {
    const handleFocus = () => {
      try {
        const stored = localStorage.getItem('internai_pending_apply');
        if (stored) {
          const job = JSON.parse(stored);
          if (job && (job.id || job.title)) {
            setPendingApplyJob(job);
            setTimeout(() => {
              setShowApplyModal(true);
            }, 350);
          }
        }
      } catch (_) {}
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  // Persist handlers
  useEffect(() => {
    localStorage.setItem('internai_student_profile', JSON.stringify(studentProfile));
  }, [studentProfile]);

  useEffect(() => {
    localStorage.setItem('internai_selected_track', selectedTrack);
  }, [selectedTrack]);

  useEffect(() => {
    localStorage.setItem('internai_internships', JSON.stringify(internships));
  }, [internships]);

  useEffect(() => {
    localStorage.setItem('internai_applications', JSON.stringify(applications));
  }, [applications]);

  useEffect(() => {
    localStorage.setItem('internai_bookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    localStorage.setItem('internai_roadmap', JSON.stringify(roadmap));
  }, [roadmap]);

  useEffect(() => {
    localStorage.setItem('internai_mock_interview', JSON.stringify(mockInterview));
  }, [mockInterview]);

  useEffect(() => {
    localStorage.setItem('internai_resume_analysis', JSON.stringify(resumeAnalysis));
  }, [resumeAnalysis]);

  // Actions
  const updateProfile = (updatedFields) => {
    setStudentProfile((prev) => ({ ...prev, ...updatedFields }));
  };

  const toggleBookmark = (internshipId) => {
    setBookmarks((prev) => {
      if (prev.includes(internshipId)) {
        return prev.filter((id) => id !== internshipId);
      } else {
        return [...prev, internshipId];
      }
    });
  };

  const addApplication = (appData) => {
    const newApp = {
      id: `app-${Date.now()}`,
      appliedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      column: appData.column || 'applied',
      ...appData
    };
    setApplications((prev) => [newApp, ...prev]);
  };

  const updateApplicationColumn = (appId, newColumn) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, column: newColumn, status: newColumn } : app))
    );
  };

  const deleteApplication = (appId) => {
    setApplications((prev) => prev.filter((app) => app.id !== appId));
  };

  /**
   * Opens the external internship application link and stores the job
   * in pending state so that when the user returns to the tab, the
   * "Did you apply?" confirmation popup displays.
   */
  const openApplyAndTrack = (job) => {
    if (!job) return;
    const externalUrl =
      job.applyUrl ||
      job.url ||
      job.externalUrl ||
      (job.source === 'linkedin'
        ? `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent((job.title || '') + ' ' + (job.company || ''))}`
        : `https://internshala.com/internships/${encodeURIComponent(job.title || 'software')}`);

    setPendingApplyJob(job);
    try {
      localStorage.setItem('internai_pending_apply', JSON.stringify(job));
    } catch (_) {}

    window.open(externalUrl, '_blank', 'noopener,noreferrer');
  };

  /**
   * Called when the user confirms they applied from the popup.
   * Automatically adds the application to the 'applied' pipeline column.
   */
  const confirmApplied = (jobOverride = null) => {
    const targetJob = jobOverride || pendingApplyJob;
    if (targetJob) {
      const alreadyApplied = applications.some((a) => a.internshipId === targetJob.id);
      if (!alreadyApplied) {
        addApplication({
          internshipId: targetJob.id,
          company: targetJob.company || 'Company',
          role: targetJob.title || 'Intern',
          status: 'applied',
          column: 'applied',
          location: targetJob.location || 'Remote / India',
          stipend: targetJob.stipend
            ? typeof targetJob.stipend === 'number'
              ? `₹${targetJob.stipend.toLocaleString()}/mo`
              : targetJob.stipend
            : '',
          nextEvent: 'Application Submitted • Awaiting Recruiter Review',
          notes: `Applied externally via ${targetJob.source === 'linkedin' ? 'LinkedIn' : targetJob.source === 'adzuna' ? 'Adzuna' : 'career portal'}.`,
          appliedExternally: true,
        });
        if (showToast) {
          showToast(`Added application for ${targetJob.company || 'internship'} to your Tracker!`, 'success');
        }
      } else {
        if (showToast) {
          showToast(`Application for ${targetJob.company || 'this role'} is already tracked!`, 'info');
        }
      }
    }
    setShowApplyModal(false);
    setPendingApplyJob(null);
    try {
      localStorage.removeItem('internai_pending_apply');
    } catch (_) {}
  };

  /**
   * Called when user chooses to save the internship for later from the popup.
   * Adds the application under the 'saved' wishlist column.
   */
  const saveApplyForLater = (jobOverride = null) => {
    const targetJob = jobOverride || pendingApplyJob;
    if (targetJob) {
      const alreadyExists = applications.some((a) => a.internshipId === targetJob.id);
      if (!alreadyExists) {
        addApplication({
          internshipId: targetJob.id,
          company: targetJob.company || 'Company',
          role: targetJob.title || 'Intern',
          status: 'saved',
          column: 'saved',
          location: targetJob.location || 'Remote / India',
          stipend: targetJob.stipend
            ? typeof targetJob.stipend === 'number'
              ? `₹${targetJob.stipend.toLocaleString()}/mo`
              : targetJob.stipend
            : '',
          nextEvent: 'Saved in Wishlist • Apply soon',
          notes: 'Saved after visiting external portal.',
          appliedExternally: false,
        });
        if (showToast) {
          showToast(`Saved ${targetJob.company || 'internship'} to your Applications Wishlist!`, 'info');
        }
      }
    }
    setShowApplyModal(false);
    setPendingApplyJob(null);
    try {
      localStorage.removeItem('internai_pending_apply');
    } catch (_) {}
  };

  /**
   * Dismiss the "Did you apply?" popup without adding to applications.
   */
  const dismissApplyModal = () => {
    setShowApplyModal(false);
    setPendingApplyJob(null);
    try {
      localStorage.removeItem('internai_pending_apply');
    } catch (_) {}
  };

  const toggleRoadmapTask = (milestoneId, taskId) => {
    setRoadmap((prev) =>
      prev.map((m) => {
        if (m.id !== milestoneId) return m;
        const updatedTasks = m.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t));
        const completedCount = updatedTasks.filter((t) => t.completed).length;
        const pct = Math.round((completedCount / updatedTasks.length) * 100);
        return {
          ...m,
          tasks: updatedTasks,
          completionPct: pct,
          status: pct === 100 ? 'completed' : pct > 0 ? 'in_progress' : 'upcoming'
        };
      })
    );
  };

  const recalculateRoadmap = () => {
    // Dynamically advance or recalculate roadmap metrics
    setRoadmap((prev) =>
      prev.map((m, idx) => {
        if (idx === 1) {
          return {
            ...m,
            completionPct: 80,
            tasks: m.tasks.map((t, tidx) => (tidx <= 2 ? { ...t, completed: true } : t))
          };
        }
        return m;
      })
    );
    updateProfile({ readinessScore: Math.min(studentProfile.readinessScore + 3, 98) });
  };

  /**
   * Fetches live internship listings from Adzuna and merges them into state.
   * Existing locally-added internships (source !== 'adzuna') are preserved.
   * @param {object} opts - Options forwarded to fetchAdzunaInternships
   */
  const fetchLiveInternships = async (opts = {}) => {
    setAdzunaLoading(true);
    setAdzunaError(null);
    try {
      const {
        keywords = 'software internship',
        location = '',
        country = 'in',
        page = 1,
        resultsPerPage = 20
      } = opts;
      const { results, totalCount, error } = await fetchAdzunaInternships({
        keywords, location, country, page, resultsPerPage
      });
      if (error) {
        setAdzunaError(error);
      } else {
        setAdzunaTotalCount(totalCount);
        setInternships((prev) => {
          const local = prev.filter((i) => i.source !== 'adzuna');
          return [...results, ...local];
        });
      }
    } catch (err) {
      setAdzunaError('Unexpected error fetching internships.');
      console.error('[AppContext] fetchLiveInternships error:', err);
    } finally {
      setAdzunaLoading(false);
    }
  };

  /**
   * Fetches LinkedIn internship listings via RapidAPI (Option 2)
   */
  const fetchLiveLinkedInInternships = async (opts = {}) => {
    setLinkedinLoading(true);
    setLinkedinError(null);
    try {
      const { keywords = 'software intern', location = 'India', page = 1 } = opts;
      const { results, isConfigured, error } = await fetchLinkedInInternships({
        keywords,
        location,
        page,
      });
      setIsRapidApiConfigured(isConfigured);
      if (error) {
        setLinkedinError(error);
      }
      setInternships((prev) => {
        const nonLinkedIn = prev.filter((i) => i.source !== 'linkedin');
        return [...results, ...nonLinkedIn];
      });
    } catch (err) {
      setLinkedinError('Error fetching LinkedIn listings.');
      console.error('[AppContext] fetchLiveLinkedInInternships error:', err);
    } finally {
      setLinkedinLoading(false);
    }
  };

  /**
   * Combined fetch across both Adzuna and LinkedIn
   */
  const fetchAllLiveInternships = async (opts = {}) => {
    await Promise.allSettled([
      fetchLiveInternships(opts),
      fetchLiveLinkedInInternships(opts),
    ]);
  };

  const analyzeNewResume = (fileName, analysisData = null) => {
    setResumeAnalysis((prev) => ({
      ...prev,
      fileName,
      uploadDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: '2-digit',
        year: 'numeric'
      }),
      atsScore: analysisData?.atsScore ?? 0,
      atsScoreReason: analysisData?.atsScoreReason ?? '',
      scoreBreakdown: analysisData?.scoreBreakdown ?? null,
      candidateInfo: analysisData?.candidateInfo ?? null,
      recommendations: analysisData?.recommendations ?? [],
      parsedData: analysisData?.parsedData ?? { extractedSkills: [], missingKeywordsForTargetRole: [] },
      matchBreakdown: analysisData?.matchBreakdown ?? {},
      recommendedInternships: analysisData?.recommendedInternships ?? [],
      contactInfoDetected: analysisData?.contactInfoDetected ?? { email: false, phone: false, linkedin: false, github: false },
      extractedEducation: analysisData?.extractedEducation ?? [],
      extractedProjects: analysisData?.extractedProjects ?? [],
      extractedCertifications: analysisData?.extractedCertifications ?? [],
      missingInformation: analysisData?.missingInformation ?? [],
      improvements: analysisData?.improvements ?? [],
      matchAgainstRole: analysisData?.matchAgainstRole ?? null,
    }));
  };

  const loadSavedResume = (savedResumeData) => {
    if (!savedResumeData) return;
    setResumeAnalysis({
      fileName: savedResumeData.fileName || 'Saved_Resume.pdf',
      uploadDate: savedResumeData.uploadedAt
        ? new Date(savedResumeData.uploadedAt).toLocaleDateString('en-US', {
            month: 'short',
            day: '2-digit',
            year: 'numeric'
          })
        : 'Saved',
      atsScore: savedResumeData.atsScore ?? 0,
      atsScoreReason: savedResumeData.atsScoreReason || '',
      scoreBreakdown: savedResumeData.scoreBreakdown || null,
      candidateInfo: savedResumeData.candidateInfo || null,
      recommendations: savedResumeData.recommendations || [],
      parsedData: {
        extractedSkills: savedResumeData.extractedSkills || [],
        missingKeywordsForTargetRole: savedResumeData.missingKeywords || [],
      },
      matchBreakdown: savedResumeData.matchBreakdown || {},
      recommendedInternships: savedResumeData.recommendedInternships || [],
      contactInfoDetected: savedResumeData.contactInfoDetected || { email: false, phone: false, linkedin: false, github: false },
      extractedEducation: savedResumeData.extractedEducation || [],
      extractedProjects: savedResumeData.extractedProjects || [],
      extractedCertifications: savedResumeData.extractedCertifications || [],
      missingInformation: savedResumeData.missingInformation || [],
      improvements: savedResumeData.improvements || [],
      matchAgainstRole: savedResumeData.matchAgainstRole || null,
    });
  };

  const clearResumeAnalysis = () => {
    localStorage.removeItem('internai_resume_analysis');
    setResumeAnalysis(initialResumeAnalysis);
  };

  const submitInterviewAnswer = (userAnswer) => {
    const timeNow = new Date().toLocaleTimeString([], { minute: '2-digit', second: '2-digit' });
    setMockInterview((prev) => ({
      ...prev,
      transcriptLog: [
        ...prev.transcriptLog,
        {
          speaker: 'student',
          timestamp: timeNow,
          text: userAnswer
        },
        {
          speaker: 'ai_interviewer',
          timestamp: timeNow,
          text: 'Good answer! Let me follow up with the next question.'
        }
      ],
      realtimeEvaluation: {
        ...prev.realtimeEvaluation,
        technicalAccuracy: Math.min(prev.realtimeEvaluation.technicalAccuracy + 2, 98),
        confidenceIndex: Math.min((prev.realtimeEvaluation.confidenceIndex || 0) + 1, 100)
      }
    }));
  };

  const selectedInternship =
    internships.find((i) => i.id === selectedInternshipId) || internships[0];

  return (
    <AppContext.Provider
      value={{
        currentRoute,
        navigate,
        selectedInternshipId,
        setSelectedInternshipId,
        selectedInternship,
        studentProfile,
        updateProfile,
        internships,
        applications,
        bookmarks,
        toggleBookmark,
        addApplication,
        updateApplicationColumn,
        deleteApplication,
        roadmap,
        toggleRoadmapTask,
        recalculateRoadmap,
        mockInterview,
        submitInterviewAnswer,
        resumeAnalysis,
        analyzeNewResume,
        loadSavedResume,
        clearResumeAnalysis,
        globalSearch,
        setGlobalSearch,
        // Shared preparation track (synced between Roadmap & Skill Progress pages)
        selectedTrack,
        setSelectedTrack,
        // Adzuna live data
        fetchLiveInternships,
        adzunaLoading,
        adzunaError,
        adzunaTotalCount,
        // LinkedIn RapidAPI live data
        fetchLiveLinkedInInternships,
        fetchAllLiveInternships,
        linkedinLoading,
        linkedinError,
        isRapidApiConfigured,
        // Mock Interview — application selection
        selectedApplicationId,
        setSelectedApplicationId,
        navigateToInterview,
        // Global Apply Tracking & Confirmation Modal
        pendingApplyJob,
        showApplyModal,
        openApplyAndTrack,
        confirmApplied,
        saveApplyForLater,
        dismissApplyModal,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
