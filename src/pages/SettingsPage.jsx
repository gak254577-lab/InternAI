import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function SettingsPage() {
  const { studentProfile, updateProfile } = useApp();
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [autoMatch, setAutoMatch] = useState(true);
  const [targetStipend, setTargetStipend] = useState('40000');

  return (
    <div className="p-space-md lg:p-space-lg max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-primary">
          Portal Settings
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Customize matching criteria, notifications, and telemetry preferences.
        </p>
      </div>

      <div className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm space-y-5">
        <h3 className="font-headline-sm text-base font-bold text-primary">
          AI Matching Preferences
        </h3>

        <div className="space-y-4 text-xs">
          <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low cursor-pointer">
            <div>
              <span className="font-bold text-primary block">Real-time Job Matching Alerts</span>
              <span className="text-on-surface-variant">Notify immediately when a &gt;90% match role opens</span>
            </div>
            <input
              type="checkbox"
              checked={emailAlerts}
              onChange={(e) => setEmailAlerts(e.target.checked)}
              className="accent-secondary w-4 h-4"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-xl bg-surface-container-low cursor-pointer">
            <div>
              <span className="font-bold text-primary block">Automated Roadmap Re-calibration</span>
              <span className="text-on-surface-variant">Update milestone sprints automatically on code commits</span>
            </div>
            <input
              type="checkbox"
              checked={autoMatch}
              onChange={(e) => setAutoMatch(e.target.checked)}
              className="accent-secondary w-4 h-4"
            />
          </label>

          <div className="p-3 rounded-xl bg-surface-container-low space-y-1.5">
            <span className="font-bold text-primary block">Target Minimum Stipend</span>
            <span className="text-on-surface-variant block mb-1">Filter out roles offering below this amount</span>
            <input
              type="number"
              step="5000"
              value={targetStipend}
              onChange={(e) => setTargetStipend(e.target.value)}
              className="w-48 px-3 py-1.5 rounded-lg bg-surface border border-outline-variant text-xs text-primary font-bold focus:outline-none focus:border-secondary"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-surface-container-high flex justify-end">
          <button
            type="button"
            onClick={() => alert('Settings saved successfully!')}
            className="px-5 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all shadow-sm"
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
}
