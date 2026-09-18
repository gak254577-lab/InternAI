import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export default function ApplicationTrackerPage() {
  const { applications, addApplication, updateApplicationColumn, deleteApplication, navigate } = useApp();
  const [viewMode, setViewMode] = useState('kanban'); // 'kanban' or 'list'
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterText, setFilterText] = useState('');

  // Form State for new application
  const [formCompany, setFormCompany] = useState('');
  const [formRole, setFormRole] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formStipend, setFormStipend] = useState('');
  const [formStatus, setFormStatus] = useState('applied');
  const [formNextEvent, setFormNextEvent] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const columns = [
    { id: 'saved', label: 'Saved', color: 'bg-slate-100 text-slate-700', icon: 'bookmark' },
    { id: 'applied', label: 'Applied', color: 'bg-blue-50 text-blue-700', icon: 'send' },
    { id: 'assessment', label: 'Assessment (OA)', color: 'bg-amber-50 text-amber-700', icon: 'quiz' },
    { id: 'interview', label: 'Interview', color: 'bg-purple-50 text-purple-700', icon: 'videocam' },
    { id: 'offer', label: 'Offer', color: 'bg-emerald-50 text-emerald-700', icon: 'verified' }
  ];

  const handleCreateApplication = (e) => {
    e.preventDefault();
    if (!formCompany || !formRole) return;

    addApplication({
      company: formCompany,
      role: formRole,
      location: formLocation,
      stipend: formStipend,
      status: formStatus,
      column: formStatus,
      nextEvent: formNextEvent || 'Under Review',
      notes: formNotes
    });

    // Reset Form
    setFormCompany('');
    setFormRole('');
    setFormNotes('');
    setShowAddModal(false);
  };

  const filteredApps = applications.filter((app) => {
    if (!filterText) return true;
    const q = filterText.toLowerCase();
    return (
      app.company.toLowerCase().includes(q) ||
      app.role.toLowerCase().includes(q) ||
      (app.notes && app.notes.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-space-md lg:p-space-lg max-w-7xl mx-auto space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-primary">
            Application Tracker
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Manage and track all your internship applications across hiring stages.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex rounded-lg bg-surface-container-lowest border border-surface-container-high p-1 text-xs">
            <button
              type="button"
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-primary-container text-on-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_kanban</span>
              <span>Kanban</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-md font-semibold flex items-center gap-1 transition-colors ${
                viewMode === 'list'
                  ? 'bg-primary-container text-on-primary'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">view_list</span>
              <span>List</span>
            </button>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all flex items-center gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined text-[16px]">add</span>
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {/* Filter search */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative max-w-md w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">
            search
          </span>
          <input
            type="text"
            value={filterText}
            onChange={(e) => setFilterText(e.target.value)}
            placeholder="Filter by company, role, or notes..."
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-surface-container-lowest border border-outline-variant text-on-surface focus:outline-none focus:border-secondary"
          />
        </div>
        <span className="text-xs text-on-surface-variant font-medium">
          Total: {filteredApps.length} active applications
        </span>
      </div>

      {/* Kanban Board View */}
      {viewMode === 'kanban' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4">
          {columns.map((col) => {
            const colApps = filteredApps.filter((a) => a.column === col.id);
            return (
              <div
                key={col.id}
                className="rounded-2xl bg-surface-container-low/60 border border-surface-container-high p-3 flex flex-col min-h-[450px]"
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-3 px-1 border-b border-surface-container-high/80 mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-xs text-primary uppercase tracking-wider">
                      {col.label}
                    </span>
                    <span className="w-5 h-5 rounded-full bg-surface-container-lowest border border-surface-container-high text-[11px] font-bold text-primary flex items-center justify-center">
                      {colApps.length}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFormStatus(col.id);
                      setShowAddModal(true);
                    }}
                    className="text-on-surface-variant hover:text-secondary"
                    title={`Add card to ${col.label}`}
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                  </button>
                </div>

                {/* Cards List */}
                <div className="space-y-3 flex-1">
                  {colApps.map((app) => (
                    <div
                      key={app.id}
                      className="p-4 rounded-xl bg-surface-container-lowest border border-surface-container-high shadow-sm hover:border-secondary hover:shadow-md transition-all space-y-2 relative group"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-primary leading-snug">
                            {app.company}
                          </h4>
                          <p className="text-xs text-on-surface-variant font-medium">
                            {app.role}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteApplication(app.id)}
                          className="opacity-0 group-hover:opacity-100 text-outline hover:text-error transition-opacity"
                          title="Delete card"
                        >
                          <span className="material-symbols-outlined text-[16px]">close</span>
                        </button>
                      </div>

                      <div className="text-[11px] text-on-surface-variant flex items-center justify-between">
                        <span>{app.location}</span>
                        <span className="font-semibold text-primary">{app.stipend}</span>
                      </div>

                      {app.nextEvent && (
                        <div className="p-2 rounded-lg bg-surface-container-low text-[11px] text-secondary font-medium flex items-center gap-1">
                          <span className="material-symbols-outlined text-[14px]">event</span>
                          <span className="truncate">{app.nextEvent}</span>
                        </div>
                      )}

                      {app.notes && (
                        <p className="text-[10px] text-on-surface-variant/80 italic line-clamp-2">
                          "{app.notes}"
                        </p>
                      )}

                      {/* Move Column Dropdown */}
                      <div className="pt-2 border-t border-surface-container-high flex items-center justify-between text-[10px]">
                        <span className="text-outline uppercase tracking-wider font-semibold">Stage:</span>
                        <select
                          value={app.column}
                          onChange={(e) => updateApplicationColumn(app.id, e.target.value)}
                          className="bg-surface-container px-2 py-0.5 rounded text-[10px] font-semibold text-primary focus:outline-none cursor-pointer"
                        >
                          {columns.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ))}

                  {colApps.length === 0 && (
                    <div className="h-32 border-2 border-dashed border-outline-variant/40 rounded-xl flex items-center justify-center text-xs text-outline">
                      No applications
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-2xl bg-surface-container-lowest border border-surface-container-high overflow-hidden shadow-sm">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container-low text-on-surface-variant font-bold uppercase tracking-wider border-b border-surface-container-high">
              <tr>
                <th className="px-5 py-3.5">Company &amp; Role</th>
                <th className="px-5 py-3.5">Stage</th>
                <th className="px-5 py-3.5">Location &amp; Stipend</th>
                <th className="px-5 py-3.5">Next Milestone</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-container-high">
              {filteredApps.map((app) => (
                <tr key={app.id} className="hover:bg-surface-container-low/50 transition-colors">
                  <td className="px-5 py-4">
                    <span className="font-bold text-primary block text-sm">{app.company}</span>
                    <span className="text-on-surface-variant">{app.role}</span>
                  </td>
                  <td className="px-5 py-4">
                    <select
                      value={app.column}
                      onChange={(e) => updateApplicationColumn(app.id, e.target.value)}
                      className="bg-surface-container px-2.5 py-1 rounded-lg text-xs font-semibold text-primary focus:outline-none cursor-pointer"
                    >
                      {columns.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-4">
                    <span className="block text-primary font-semibold">{app.stipend}</span>
                    <span className="text-on-surface-variant">{app.location}</span>
                  </td>
                  <td className="px-5 py-4 text-secondary font-medium">
                    {app.nextEvent || 'None'}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      type="button"
                      onClick={() => deleteApplication(app.id)}
                      className="p-1.5 text-outline hover:text-error transition-colors"
                      title="Delete application"
                    >
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Application Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-primary/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface-container-lowest rounded-2xl shadow-2xl border border-surface-container-high max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
              <h3 className="font-headline-sm text-lg font-bold text-primary">
                Add New Internship Application
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-outline hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleCreateApplication} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={formCompany}
                  onChange={(e) => setFormCompany(e.target.value)}
                  placeholder="e.g. Zepto, Microsoft, CRED"
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                />
              </div>

              <div>
                <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                  Role Title *
                </label>
                <input
                  type="text"
                  required
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  placeholder="e.g. Software Engineering Intern"
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Bengaluru • Hybrid"
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                  />
                </div>
                <div>
                  <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                    Stipend
                  </label>
                  <input
                    type="text"
                    value={formStipend}
                    onChange={(e) => setFormStipend(e.target.value)}
                    placeholder="e.g. ₹45,000/mo"
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                    Initial Stage
                  </label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                  >
                    {columns.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                    Next Milestone / Date
                  </label>
                  <input
                    type="text"
                    value={formNextEvent}
                    onChange={(e) => setFormNextEvent(e.target.value)}
                    placeholder="e.g. OA Due on Friday"
                    className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-on-surface uppercase tracking-wider mb-1">
                  Notes / Interview Tips
                </label>
                <textarea
                  rows={2}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Referred by college alumni, test focus on graphs..."
                  className="w-full px-3 py-2 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-surface-container-high flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-surface-container-high text-on-surface font-semibold hover:bg-surface-container-low transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-secondary text-on-secondary font-bold hover:bg-secondary-container transition-all shadow-sm"
                >
                  Save Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
