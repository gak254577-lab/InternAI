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
    try {
      const saved = localStorage.getItem('internai_internships');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return initialInternships;
  });

  const [applications, setApplications] = useState(() => {
    try {
      const saved = localStorage.getItem('internai_applications');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return initialApplications;
  });

  const [bookmarks, setBookmarks] = useState(() => {
    try {
      const saved = localStorage.getItem('internai_bookmarks');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (_) {}
    return [];
  });

  const [roadmap, setRoadmap] = useState(() => {
    try {
      const saved = localStorage.getItem('internai_roadmap');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return initialRoadmapMilestones;
  });

  const [mockInterview, setMockInterview] = useState(() => {
    try {
      const saved = localStorage.getItem('internai_mock_interview');
      return saved ? JSON.parse(saved) : initialMockInterview;
    } catch (_) {
      return initialMockInterview;
    }
  });

  const [resumeAnalysis, setResumeAnalysis] = useState(() => {
    try {
      const saved = localStorage.getItem('internai_resume_analysis');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && (parsed.fileName || parsed.atsScore > 0)) return parsed;
      }
    } catch (_) {}
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
      const isBookmarked = prev.includes(internshipId);
      const nextBookmarks = isBookmarked
        ? prev.filter((id) => id !== internshipId)
        : [...prev, internshipId];

      if (!isBookmarked) {
        // Add to Application Tracker as 'saved' if not already present
        setApplications((prevApps) => {
          const alreadyTracked = prevApps.some((a) => a.internshipId === internshipId || a.id === internshipId);
          if (alreadyTracked) return prevApps;
          const target = internships.find((i) => i.id === internshipId);
          if (!target) return prevApps;
          const newSaved = {
            id: `app-${Date.now()}-${internshipId}`,
            internshipId: target.id,
            company: target.company || 'Company',
            role: target.title || 'Intern',
            status: 'saved',
            column: 'saved',
            location: target.location || 'Remote / India',
            stipend: target.stipend
              ? typeof target.stipend === 'number'
                ? `₹${target.stipend.toLocaleString()}/mo`
                : target.stipend
              : '',
            nextEvent: 'Saved in Wishlist • Apply soon',
            notes: `Saved from ${target.source === 'linkedin' ? 'LinkedIn' : target.source === 'adzuna' ? 'Adzuna' : 'listings'}.`,
            appliedDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
            appliedExternally: false,
          };
          return [newSaved, ...prevApps];
        });
      } else {
        // If un-bookmarked and card is still just 'saved' (not applied), remove it from applications
        setApplications((prevApps) =>
          prevApps.filter((a) => !(a.internshipId === internshipId && a.column === 'saved'))
        );
      }

      return nextBookmarks;
    });
  };

  const addApplication = (appData) => {
    const newApp = {
      id: appData.id || `app-${Date.now()}`,
      appliedDate: appData.appliedDate || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
      column: appData.column || 'applied',
      ...appData
    };
    setApplications((prev) => [newApp, ...prev]);
    if (newApp.column === 'saved' && newApp.internshipId) {
      setBookmarks((prev) => (prev.includes(newApp.internshipId) ? prev : [...prev, newApp.internshipId]));
    }
  };

  const updateApplicationColumn = (appId, newColumn) => {
    setApplications((prev) =>
      prev.map((app) => (app.id === appId ? { ...app, column: newColumn, status: newColumn } : app))
    );
  };

  const deleteApplication = (appId) => {
    setApplications((prev) => {
      const appToDelete = prev.find((a) => a.id === appId);
      if (appToDelete && appToDelete.internshipId) {
        setBookmarks((b) => b.filter((id) => id !== appToDelete.internshipId));
      }
      return prev.filter((app) => app.id !== appId);
    });
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
   * Automatically adds the application to the 'applied' pipeline column,
   * or promotes an existing 'saved' card to 'applied'.
   */
  const confirmApplied = (jobOverride = null) => {
    const targetJob = jobOverride || pendingApplyJob;
    if (targetJob) {
      const existingIdx = applications.findIndex(
        (a) => a.internshipId === targetJob.id || (a.company === targetJob.company && a.role === targetJob.title)
      );
      if (existingIdx !== -1) {
        // Upgrade from saved to applied
        setApplications((prev) =>
          prev.map((app, idx) =>
            idx === existingIdx
              ? {
                  ...app,
                  status: 'applied',
                  column: 'applied',
                  nextEvent: 'Application Submitted • Awaiting Recruiter Review',
                  appliedDate: app.appliedDate || new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }),
                  appliedExternally: true,
                }
              : app
          )
        );
        if (showToast) {
          showToast(`Moved ${targetJob.company || 'internship'} to Applied in your Tracker!`, 'success');
        }
      } else {
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
   * Adds the application under the 'saved' wishlist column and syncs bookmarks.
   */
  const saveApplyForLater = (jobOverride = null) => {
    const targetJob = jobOverride || pendingApplyJob;
    if (targetJob) {
      if (targetJob.id) {
        setBookmarks((prev) => (prev.includes(targetJob.id) ? prev : [...prev, targetJob.id]));
      }
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
