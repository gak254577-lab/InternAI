import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  initialStudentProfile,
  initialInternships,
  initialApplications,
  initialRoadmapMilestones,
  initialMockInterview,
  initialResumeAnalysis
} from './initialData';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Navigation State
  const [currentRoute, setCurrentRoute] = useState(() => {
    const hash = window.location.hash.replace('#/', '').replace('#', '');
    return hash || 'dashboard';
  });
  const [selectedInternshipId, setSelectedInternshipId] = useState('int-1');

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

  // Persistent State in LocalStorage
  const [studentProfile, setStudentProfile] = useState(() => {
    const saved = localStorage.getItem('internai_student_profile');
    return saved ? JSON.parse(saved) : initialStudentProfile;
  });

  const [internships, setInternships] = useState(() => {
    const saved = localStorage.getItem('internai_internships');
    return saved ? JSON.parse(saved) : initialInternships;
  });

  const [applications, setApplications] = useState(() => {
    const saved = localStorage.getItem('internai_applications');
    return saved ? JSON.parse(saved) : initialApplications;
  });

  const [bookmarks, setBookmarks] = useState(() => {
    const saved = localStorage.getItem('internai_bookmarks');
    return saved ? JSON.parse(saved) : ['int-1', 'int-3'];
  });

  const [roadmap, setRoadmap] = useState(() => {
    const saved = localStorage.getItem('internai_roadmap');
    return saved ? JSON.parse(saved) : initialRoadmapMilestones;
  });

  const [mockInterview, setMockInterview] = useState(() => {
    const saved = localStorage.getItem('internai_mock_interview');
    return saved ? JSON.parse(saved) : initialMockInterview;
  });

  const [resumeAnalysis, setResumeAnalysis] = useState(() => {
    const saved = localStorage.getItem('internai_resume_analysis');
    return saved ? JSON.parse(saved) : initialResumeAnalysis;
  });

  // Global Search State
  const [globalSearch, setGlobalSearch] = useState('');

  // Persist handlers
  useEffect(() => {
    localStorage.setItem('internai_student_profile', JSON.stringify(studentProfile));
  }, [studentProfile]);

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

  const analyzeNewResume = (fileName) => {
    setResumeAnalysis((prev) => ({
      ...prev,
      fileName,
      uploadDate: 'Just now',
      atsScore: 93,
      recommendations: [
        {
          type: 'keyword_addition',
          title: 'Docker & Kubernetes Integration',
          current: 'Created containers for deployment.',
          suggested: 'Containerized multi-tier microservices with Docker Compose, reducing local development spin-up time by 75%.',
          impact: '+4 ATS points'
        },
        ...prev.recommendations
      ]
    }));
    updateProfile({ readinessScore: 91 });
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
          text: "Excellent elaboration on React 19's transition boundaries and using useSyncExternalStore to isolate high-frequency WebSocket updates! Next, how would you design cache invalidation when a merchant updates their bank account profile?"
        }
      ],
      realtimeEvaluation: {
        ...prev.realtimeEvaluation,
        technicalAccuracy: Math.min(prev.realtimeEvaluation.technicalAccuracy + 2, 98),
        confidenceIndex: 94
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
        globalSearch,
        setGlobalSearch
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
