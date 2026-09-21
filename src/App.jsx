import React, { useEffect } from 'react';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider, useApp } from './context/AppContext';
import AppLayout from './components/layout/AppLayout';

import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import ExploreInternshipsPage from './pages/ExploreInternshipsPage';
import InternshipDetailsPage from './pages/InternshipDetailsPage';
import ResumeAnalyzerPage from './pages/ResumeAnalyzerPage';
import ApplicationTrackerPage from './pages/ApplicationTrackerPage';
import PreparationRoadmapPage from './pages/PreparationRoadmapPage';
import MockInterviewPage from './pages/MockInterviewPage';
import SkillProgressPage from './pages/SkillProgressPage';
import StudentProfilePage from './pages/StudentProfilePage';
import SettingsPage from './pages/SettingsPage';
import HelpPage from './pages/HelpPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import OnboardingPage from './pages/OnboardingPage';

function AppContent() {
  const { currentRoute, navigate } = useApp();
  const { currentUser, authLoading } = useAuth();

  // Route Protection Logic as per Task 3
  useEffect(() => {
    if (authLoading) return;

    const publicRoutes = ['landing', 'login', 'register'];

    // If unauthenticated user tries to access a protected page, redirect to Login
    if (!currentUser && !publicRoutes.includes(currentRoute)) {
      navigate('login');
    }

    // If authenticated user visits Login or Register, redirect to Dashboard
    if (currentUser && (currentRoute === 'login' || currentRoute === 'register')) {
      navigate('dashboard');
    }
  }, [currentUser, authLoading, currentRoute, navigate]);

  // Loading Screen while Firebase checks auth state
  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <img
            alt="InternAI Logo"
            className="h-12 w-auto animate-pulse"
            src="/images/internai_logo.svg"
            onError={(e) => {
              e.target.src = '/images/internai_logo.png';
            }}
          />
          <div className="flex items-center gap-2 text-xs font-semibold text-primary">
            <span className="material-symbols-outlined text-[18px] animate-spin text-secondary">
              progress_activity
            </span>
            <span>Initializing InternAI Student Portal...</span>
          </div>
        </div>
      </div>
    );
  }

  // Standalone Auth & Onboarding Screens (without sidebar/header)
  if (currentRoute === 'login') {
    return <LoginPage />;
  }
  if (currentRoute === 'register') {
    return <RegisterPage />;
  }
  if (currentRoute === 'onboarding') {
    return <OnboardingPage />;
  }

  // Page Routing inside AppLayout
  const renderCurrentPage = () => {
    switch (currentRoute) {
      case 'landing':
        return <LandingPage />;
      case 'dashboard':
        return <DashboardPage />;
      case 'explore-internships':
      case 'explore':
      case 'ai-matching':
        return <ExploreInternshipsPage />;
      case 'internship-details':
        return <InternshipDetailsPage />;
      case 'resume-analyzer':
        return <ResumeAnalyzerPage />;
      case 'my-applications':
      case 'applications':
        return <ApplicationTrackerPage />;
      case 'preparation-roadmap':
      case 'roadmap':
        return <PreparationRoadmapPage />;
      case 'mock-interview':
        return <MockInterviewPage />;
      case 'skill-progress':
      case 'skills':
        return <SkillProgressPage />;
      case 'profile':
        return <StudentProfilePage />;
      case 'settings':
        return <SettingsPage />;
      case 'help-and-resources':
      case 'help':
        return <HelpPage />;
      default:
        return currentUser ? <DashboardPage /> : <LandingPage />;
    }
  };

  return <AppLayout>{renderCurrentPage()}</AppLayout>;
}

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AppProvider>
          <AppContent />
        </AppProvider>
      </AuthProvider>
    </ToastProvider>
  );
}
