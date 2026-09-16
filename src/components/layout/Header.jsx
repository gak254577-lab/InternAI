import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function Header({ setMobileOpen }) {
  const { globalSearch, setGlobalSearch, navigate, internships } = useApp();
  const { currentUser, userProfile, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const searchInputRef = useRef(null);

  const displayName = userProfile?.name || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Student Candidate';
  const displayPhoto = currentUser?.photoURL || userProfile?.photoURL || '/images/student_avatar.png';
  const readiness = userProfile?.readinessScore || 86;

  // Cmd + K shortcut to focus search
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleQuickMatch = () => {
    const best = [...internships].sort((a, b) => b.matchScore - a.matchScore)[0];
    if (best) {
      navigate('internship-details', best.id);
    } else {
      navigate('explore-internships');
    }
  };

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter') {
      navigate('explore-internships');
    }
  };

  const handleLogout = async () => {
    setShowProfileMenu(false);
    await logout();
    navigate('landing');
  };

  return (
    <header className="fixed top-0 left-0 lg:left-64 right-0 h-16 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-surface-container-high z-40 px-space-md lg:px-space-lg flex items-center justify-between gap-space-sm">
      {/* Mobile Menu Button */}
      <button
        type="button"
        onClick={() => setMobileOpen((prev) => !prev)}
        className="lg:hidden p-2 text-on-surface-variant hover:text-on-surface"
        aria-label="Open navigation menu"
      >
        <span className="material-symbols-outlined text-[24px]">menu</span>
      </button>

      {/* Global Search Bar */}
      <div className="relative flex-1 max-w-xl">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">
          search
        </span>
        <input
          ref={searchInputRef}
          type="text"
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          onKeyDown={handleSearchSubmit}
          placeholder="Search internships, skills, companies... (Cmd + K)"
          className="w-full pl-10 pr-4 py-2 text-body-md font-body-md rounded-lg bg-surface border border-outline-variant text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-all"
        />
      </div>

      {/* Right Actions Cluster */}
      <div className="flex items-center gap-space-sm lg:gap-space-md relative">
        {/* AI Readiness Badge */}
        <div
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-tertiary-fixed/30 border border-tertiary-fixed text-on-tertiary-fixed-variant font-label-md text-label-md font-semibold cursor-pointer"
          onClick={() => navigate('roadmap')}
          title="Click to view preparation roadmap"
        >
          <span className="material-symbols-outlined text-[16px] text-on-tertiary-container">
            auto_awesome
          </span>
          <span>AI Readiness {readiness}%</span>
        </div>

        {/* Quick AI Match Button */}
        <button
          type="button"
          onClick={handleQuickMatch}
          className="inline-flex items-center gap-1.5 px-3 lg:px-4 py-2 rounded-lg bg-secondary text-on-secondary font-title-md text-title-md hover:bg-secondary-container transition-all shadow-sm"
        >
          <span className="material-symbols-outlined text-[18px]">temp_preferences_custom</span>
          <span className="hidden sm:inline">Quick AI Match</span>
        </button>

        <div className="h-6 w-px bg-surface-container-high hidden sm:block"></div>

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowProfileMenu(false);
            }}
            className="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-error ring-2 ring-surface-container-lowest"></span>
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container-high p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
                <span className="font-title-md text-primary font-bold">Notifications</span>
                <span className="text-xs bg-secondary-fixed text-on-secondary-fixed px-2 py-0.5 rounded-full font-semibold">2 new</span>
              </div>
              <div className="divide-y divide-surface-container-high max-h-64 overflow-y-auto">
                <div
                  className="py-3 cursor-pointer hover:bg-surface-container-low px-2 rounded-lg transition-colors"
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('my-applications');
                  }}
                >
                  <p className="text-xs font-semibold text-primary">Razorpay Round 2 Scheduled</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">Tomorrow at 3:00 PM IST with Technical Lead</p>
                  <span className="text-[10px] text-outline mt-1 block">1 hour ago</span>
                </div>
                <div
                  className="py-3 cursor-pointer hover:bg-surface-container-low px-2 rounded-lg transition-colors"
                  onClick={() => {
                    setShowNotifications(false);
                    navigate('explore-internships');
                  }}
                >
                  <p className="text-xs font-semibold text-primary">94% Fit: SDE Intern at Razorpay</p>
                  <p className="text-xs text-on-surface-variant mt-0.5">New role matching your verified Redis skills</p>
                  <span className="text-[10px] text-outline mt-1 block">3 hours ago</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile or Sign-In state */}
        {currentUser ? (
          <div className="relative">
            <img
              alt={displayName}
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
              className="w-8 h-8 rounded-full object-cover ring-1 ring-outline-variant cursor-pointer hover:ring-secondary transition-all"
              src={displayPhoto}
              onError={(e) => {
                e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
              }}
            />

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-surface-container-lowest rounded-xl shadow-xl border border-surface-container-high py-2 z-50">
                <div className="px-4 py-2 border-b border-surface-container-high">
                  <p className="font-semibold text-sm text-primary truncate">{displayName}</p>
                  <p className="text-xs text-on-surface-variant truncate">{currentUser.email}</p>
                </div>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-xs text-on-surface hover:bg-surface-container-low flex items-center gap-2"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('profile');
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">person</span>
                  View Profile in Firestore
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-xs text-on-surface hover:bg-surface-container-low flex items-center gap-2"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('my-applications');
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Applications Pipeline
                </button>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-xs text-on-surface hover:bg-surface-container-low flex items-center gap-2"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('resume-analyzer');
                  }}
                >
                  <span className="material-symbols-outlined text-[18px]">description</span>
                  Resume Analyzer
                </button>
                <div className="border-t border-surface-container-high my-1"></div>
                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-bold"
                  onClick={handleLogout}
                >
                  <span className="material-symbols-outlined text-[18px]">logout</span>
                  Sign Out of Firebase
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('login')}
              className="px-3 py-1.5 rounded-lg border border-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container-low transition-colors"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => navigate('register')}
              className="px-3.5 py-1.5 rounded-lg bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all shadow-sm"
            >
              Register
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
