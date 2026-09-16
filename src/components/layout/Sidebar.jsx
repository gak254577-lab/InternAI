import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ mobileOpen, setMobileOpen }) {
  const { currentRoute, navigate, studentProfile } = useApp();
  const { currentUser, userProfile } = useAuth();

  const profile = userProfile || studentProfile;

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'grid_view' },
    { id: 'explore-internships', label: 'Explore Internships', icon: 'search' },
    { id: 'ai-matching', label: 'AI Matching', icon: 'smart_toy', badge: 'NEW' },
    { id: 'resume-analyzer', label: 'Resume Analyzer', icon: 'description' },
    { id: 'my-applications', label: 'My Applications', icon: 'send' },
    { id: 'preparation-roadmap', label: 'Preparation Roadmap', icon: 'alt_route' },
    { id: 'mock-interview', label: 'Mock Interview', icon: 'mic' },
    { id: 'skill-progress', label: 'Skill Progress', icon: 'trending_up' },
    { id: 'profile', label: 'Profile', icon: 'person' }
  ];

  const secondaryItems = [
    { id: 'settings', label: 'Settings', icon: 'settings' },
    { id: 'help-and-resources', label: 'Help & Resources', icon: 'help_outline' }
  ];

  const isCurrent = (id) => {
    if (id === 'explore-internships' && (currentRoute === 'explore-internships' || currentRoute === 'explore' || currentRoute === 'internship-details')) return true;
    if (id === 'my-applications' && (currentRoute === 'my-applications' || currentRoute === 'applications')) return true;
    if (id === 'preparation-roadmap' && (currentRoute === 'preparation-roadmap' || currentRoute === 'roadmap')) return true;
    return currentRoute === id;
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 h-screen w-64 bg-surface-container-lowest border-r border-surface-container-high z-50 flex flex-col justify-between overflow-y-auto transition-transform duration-200 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex flex-col">
          {/* Logo Brand Header */}
          <div
            className="h-16 px-space-md flex items-center gap-space-sm border-b border-surface-container-high cursor-pointer"
            onClick={() => {
              navigate('dashboard');
              if (setMobileOpen) setMobileOpen(false);
            }}
          >
            <img
              alt="InternAI Logo"
              className="h-8 w-auto object-contain"
              src="/images/internai_logo.svg"
              onError={(e) => {
                e.target.src = '/images/internai_logo.png';
              }}
            />
            <span className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold">
              InternAI
            </span>
          </div>

          {/* Nav Section Label */}
          <div className="px-space-md pt-space-md pb-space-xs">
            <span className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Navigation
            </span>
          </div>

          {/* Primary Nav Links */}
          <nav className="flex flex-col gap-space-xs px-space-sm">
            {navItems.map((item) => {
              const active = isCurrent(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    navigate(item.id);
                    if (setMobileOpen) setMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-space-md py-space-sm rounded-lg transition-colors text-left ${
                    active
                      ? 'bg-primary-container text-on-primary font-title-md'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-space-sm">
                    <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                    <span className="font-body-md text-body-md font-medium">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded bg-tertiary-container text-on-tertiary-container font-label-sm text-[10px] tracking-wide uppercase font-semibold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="flex flex-col border-t border-surface-container-high pt-space-sm pb-space-md">
          <nav className="flex flex-col gap-space-xs px-space-sm mb-space-sm">
            {secondaryItems.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  navigate(item.id);
                  if (setMobileOpen) setMobileOpen(false);
                }}
                className={`w-full flex items-center gap-space-sm px-space-md py-space-sm rounded-lg transition-colors text-left ${
                  currentRoute === item.id
                    ? 'bg-primary-container text-on-primary font-title-md'
                    : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                <span className="font-body-md text-body-md font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Mini Student Profile Card */}
          <div
            className="mx-space-sm p-space-sm rounded-xl bg-surface-container-low border border-surface-container-high flex flex-col gap-space-xs cursor-pointer hover:border-secondary transition-all"
            onClick={() => {
              navigate('profile');
              if (setMobileOpen) setMobileOpen(false);
            }}
          >
            <div className="flex items-center gap-space-sm">
              <img
                alt={profile.name}
                className="w-9 h-9 rounded-full object-cover ring-1 ring-outline-variant"
                src={currentUser?.photoURL || profile.photoURL || profile.avatar || '/images/student_avatar.png'}
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150';
                }}
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="font-title-md text-title-md truncate text-on-surface font-semibold">
                  {profile.name}
                </span>
                <span className="font-body-sm text-body-sm text-on-surface-variant truncate">
                  {profile.degree ? profile.degree.split(' ')[0] : 'B.Tech'} • {profile.year || '3rd Year'}
                </span>
              </div>
            </div>
            <div className="mt-1 flex items-center justify-between pt-space-xs border-t border-surface-container-high">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-surface-container-lowest text-on-secondary-fixed-variant border border-secondary-fixed font-label-sm text-label-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                {profile.status || 'Ready to Apply'}
              </span>
              <span className="material-symbols-outlined text-[16px] text-on-surface-variant">
                navigate_next
              </span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
