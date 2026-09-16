import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';

export default function ExploreInternshipsPage() {
  const { internships, bookmarks, toggleBookmark, navigate, globalSearch, setGlobalSearch } = useApp();

  // Filters State
  const [selectedRoleType, setSelectedRoleType] = useState('all');
  const [minStipend, setMinStipend] = useState(20000);
  const [selectedTech, setSelectedTech] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [sortBy, setSortBy] = useState('match');

  const allTechStacks = ['React.js', 'TypeScript', 'Node.js', 'Redis', 'Go', 'Python', 'PostgreSQL', 'Docker'];

  const toggleTechFilter = (tech) => {
    setSelectedTech((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  const filteredInternships = useMemo(() => {
    return internships
      .filter((job) => {
        // Global or local search
        const query = globalSearch.toLowerCase().trim();
        if (query) {
          const matchQuery =
            job.title.toLowerCase().includes(query) ||
            job.company.toLowerCase().includes(query) ||
            job.location.toLowerCase().includes(query) ||
            job.tags.some((t) => t.toLowerCase().includes(query));
          if (!matchQuery) return false;
        }

        // Role Type
        if (selectedRoleType !== 'all' && job.roleType !== selectedRoleType) {
          return false;
        }

        // Stipend
        if (job.stipend < minStipend) {
          return false;
        }

        // Location
        if (selectedLocation !== 'all' && !job.location.toLowerCase().includes(selectedLocation.toLowerCase())) {
          return false;
        }

        // Tech Stacks
        if (selectedTech.length > 0) {
          const hasTech = selectedTech.some((tech) =>
            job.tags.some((t) => t.toLowerCase().includes(tech.toLowerCase()))
          );
          if (!hasTech) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'match') return b.matchScore - a.matchScore;
        if (sortBy === 'stipend') return b.stipend - a.stipend;
        if (sortBy === 'deadline') return new Date(a.deadline) - new Date(b.deadline);
        return 0;
      });
  }, [internships, globalSearch, selectedRoleType, minStipend, selectedLocation, selectedTech, sortBy]);

  return (
    <div className="p-space-md lg:p-space-lg max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-primary">
            Explore Internships
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Discover verified roles matched against your academic coursework and technical projects.
          </p>
        </div>

        {/* Sorting options */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-on-surface-variant font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high text-xs font-semibold text-on-surface focus:outline-none focus:border-secondary"
          >
            <option value="match">Highest AI Match</option>
            <option value="stipend">Highest Stipend</option>
            <option value="deadline">Closing Soonest</option>
          </select>
        </div>
      </div>

      {/* Main Layout: Left Filters + Right Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-start">
        {/* Left Filter Sidebar (3 cols) */}
        <div className="lg:col-span-3 p-5 rounded-2xl bg-surface-container-lowest border border-surface-container-high space-y-6 shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-surface-container-high">
            <h3 className="font-title-md font-bold text-primary flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[18px]">tune</span>
              Filters
            </h3>
            <button
              type="button"
              onClick={() => {
                setSelectedRoleType('all');
                setMinStipend(20000);
                setSelectedTech([]);
                setSelectedLocation('all');
                setGlobalSearch('');
              }}
              className="text-xs font-semibold text-secondary hover:underline"
            >
              Reset
            </button>
          </div>

          {/* Search by Keyword */}
          <div>
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-2">
              Role or Company
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                search
              </span>
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="e.g. Razorpay, React..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg bg-surface border border-outline-variant text-on-surface placeholder:text-outline focus:outline-none focus:border-secondary"
              />
            </div>
          </div>

          {/* Role Type */}
          <div>
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-2">
              Role Type
            </label>
            <div className="space-y-1.5 text-xs">
              {[
                { id: 'all', label: 'All Roles' },
                { id: 'Full-Time Intern', label: 'Full-Time Intern (6 Mo)' },
                { id: 'Summer Intern', label: 'Summer Intern (2-3 Mo)' }
              ].map((r) => (
                <label key={r.id} className="flex items-center gap-2 cursor-pointer text-on-surface hover:text-secondary">
                  <input
                    type="radio"
                    name="roleType"
                    checked={selectedRoleType === r.id}
                    onChange={() => setSelectedRoleType(r.id)}
                    className="accent-secondary"
                  />
                  <span>{r.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Stipend Range Slider */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">
                Min. Stipend
              </label>
              <span className="text-xs font-extrabold text-secondary">
                ₹{minStipend.toLocaleString()}/mo
              </span>
            </div>
            <input
              type="range"
              min="20000"
              max="100000"
              step="5000"
              value={minStipend}
              onChange={(e) => setMinStipend(Number(e.target.value))}
              className="w-full accent-secondary"
            />
            <div className="flex justify-between text-[10px] text-outline mt-1">
              <span>₹20k</span>
              <span>₹60k</span>
              <span>₹100k+</span>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-2">
              Location
            </label>
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-surface border border-outline-variant text-xs text-on-surface focus:outline-none focus:border-secondary"
            >
              <option value="all">Any Location</option>
              <option value="bengaluru">Bengaluru</option>
              <option value="mumbai">Mumbai</option>
              <option value="hyderabad">Hyderabad</option>
              <option value="remote">Remote</option>
            </select>
          </div>

          {/* Tech Stack Chips */}
          <div>
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-2">
              Core Tech Stack
            </label>
            <div className="flex flex-wrap gap-1.5">
              {allTechStacks.map((tech) => {
                const active = selectedTech.includes(tech);
                return (
                  <button
                    key={tech}
                    type="button"
                    onClick={() => toggleTechFilter(tech)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                      active
                        ? 'bg-secondary text-on-secondary shadow-sm'
                        : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
                    }`}
                  >
                    {tech}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Internship Results (9 cols) */}
        <div className="lg:col-span-9 space-y-4">
          <div className="flex items-center justify-between text-xs text-on-surface-variant font-medium px-1">
            <span>Showing {filteredInternships.length} verified roles</span>
            <span>Refined by AI Match affinity</span>
          </div>

          {filteredInternships.length === 0 ? (
            <div className="p-12 rounded-2xl bg-surface-container-lowest border border-surface-container-high text-center">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">search_off</span>
              <h3 className="font-bold text-primary text-base">No matching internships found</h3>
              <p className="text-xs text-on-surface-variant mt-1">Try lowering the minimum stipend or clearing keyword filters.</p>
            </div>
          ) : (
            filteredInternships.map((job) => {
              const isSaved = bookmarks.includes(job.id);
              return (
                <div
                  key={job.id}
                  className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high hover:border-secondary hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div className={`w-14 h-14 rounded-2xl ${job.logoBg} flex-shrink-0 flex items-center justify-center font-extrabold text-2xl shadow-sm`}>
                      {job.logoText}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2
                          onClick={() => navigate('internship-details', job.id)}
                          className="font-headline-sm text-lg font-bold text-primary hover:text-secondary cursor-pointer"
                        >
                          {job.title}
                        </h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-xs border border-emerald-200">
                          {job.matchScore}% Match
                        </span>
                        {job.isLiveMatch && (
                          <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed text-[10px] font-semibold">
                            Hot Role
                          </span>
                        )}
                      </div>

                      <p className="text-xs font-medium text-on-surface-variant">
                        {job.company} • {job.location} • {job.roleType} ({job.duration})
                      </p>

                      <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded-md bg-surface-container text-on-surface text-[11px] font-medium"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right side actions & stipend */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-surface-container-high">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] text-on-surface-variant block uppercase font-bold tracking-wider">
                        Monthly Stipend
                      </span>
                      <span className="text-lg font-extrabold text-primary">
                        ₹{job.stipend.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleBookmark(job.id)}
                        aria-label="Bookmark internship"
                        className="p-2.5 rounded-xl border border-surface-container-high text-on-surface-variant hover:text-secondary hover:border-secondary transition-colors"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {isSaved ? 'bookmark' : 'bookmark_border'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate('internship-details', job.id)}
                        className="px-4 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all shadow-sm flex items-center gap-1"
                      >
                        <span>View Details</span>
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
