import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { ADZUNA_COUNTRIES } from '../services/adzunaService';

export default function ExploreInternshipsPage() {
  const {
    internships,
    bookmarks,
    toggleBookmark,
    navigate,
    globalSearch,
    setGlobalSearch,
    fetchLiveInternships,
    fetchLiveLinkedInInternships,
    fetchAllLiveInternships,
    adzunaLoading,
    adzunaError,
    adzunaTotalCount,
    linkedinLoading,
    linkedinError,
    isRapidApiConfigured,
  } = useApp();

  // Filters State
  const [selectedSource, setSelectedSource] = useState('all'); // 'all', 'adzuna', 'linkedin'
  const [selectedRoleType, setSelectedRoleType] = useState('all');
  const [minStipend, setMinStipend] = useState(0);
  const [selectedTech, setSelectedTech] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [sortBy, setSortBy] = useState('date');

  // Adzuna search controls
  const [searchKeywords, setSearchKeywords] = useState('software intern');
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('in');
  const [currentPage, setCurrentPage] = useState(1);
  const RESULTS_PER_PAGE = 20;

  const allTechStacks = ['React', 'TypeScript', 'Node.js', 'Python', 'Go', 'Java', 'Docker', 'Machine Learning'];

  const toggleTechFilter = (tech) => {
    setSelectedTech((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  // Fetch on first load
  useEffect(() => {
    handleSearch(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (page = 1) => {
    setCurrentPage(page);
    const opts = {
      keywords: searchKeywords || 'software intern',
      location: searchLocation,
      country: selectedCountry,
      page,
      resultsPerPage: RESULTS_PER_PAGE,
    };
    if (selectedSource === 'adzuna') {
      fetchLiveInternships(opts);
    } else if (selectedSource === 'linkedin') {
      fetchLiveLinkedInInternships(opts);
    } else {
      fetchAllLiveInternships(opts);
    }
  };

  const totalPages = Math.ceil(adzunaTotalCount / RESULTS_PER_PAGE);

  const filteredInternships = useMemo(() => {
    return internships
      .filter((job) => {
        // Platform Source filter
        if (selectedSource !== 'all' && (job.source || 'adzuna') !== selectedSource) {
          return false;
        }
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

        // Stipend (only filter if slider moved above 0)
        if (minStipend > 0 && job.stipend < minStipend) {
          return false;
        }

        // Location
        if (
          selectedLocation !== 'all' &&
          !job.location.toLowerCase().includes(selectedLocation.toLowerCase())
        ) {
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
        if (sortBy === 'stipend') return b.stipend - a.stipend;
        if (sortBy === 'deadline') return new Date(a.deadline) - new Date(b.deadline);
        // default: newest (by source order from Adzuna)
        return 0;
      });
  }, [internships, globalSearch, selectedRoleType, minStipend, selectedLocation, selectedTech, sortBy]);

  return (
    <div className="p-space-md lg:p-space-lg max-w-7xl mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl font-extrabold text-primary flex items-center gap-2">
            Explore Internships
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
              Live
            </span>
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Real-time verified internship listings powered by Adzuna
            {adzunaTotalCount > 0 && (
              <span className="ml-1 font-semibold text-secondary">
                — {adzunaTotalCount.toLocaleString()} total internships
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-on-surface-variant font-medium">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-surface-container-lowest border border-surface-container-high text-xs font-semibold text-on-surface focus:outline-none focus:border-secondary"
          >
            <option value="date">Newest</option>
            <option value="stipend">Highest Stipend</option>
            <option value="deadline">Closing Soonest</option>
          </select>
        </div>
      </div>

      {/* Adzuna Live Search Bar */}
      <div className="mb-6 p-4 rounded-2xl bg-surface-container-lowest border border-surface-container-high shadow-sm">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Country selector */}
          <div className="relative sm:w-44">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">public</span>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-surface border border-outline-variant text-on-surface focus:outline-none focus:border-secondary appearance-none cursor-pointer"
            >
              {Object.entries(ADZUNA_COUNTRIES).map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
          </div>

          {/* Keywords */}
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">work</span>
            <input
              type="text"
              value={searchKeywords}
              onChange={(e) => setSearchKeywords(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
              placeholder="e.g. React Developer Intern, Machine Learning Intern..."
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-surface border border-outline-variant text-on-surface focus:outline-none focus:border-secondary"
            />
          </div>

          {/* City / location (optional) */}
          <div className="relative sm:w-44">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">location_on</span>
            <input
              type="text"
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(1)}
              placeholder="City (optional)"
              className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl bg-surface border border-outline-variant text-on-surface focus:outline-none focus:border-secondary"
            />
          </div>

          <button
            type="button"
            onClick={() => handleSearch(1)}
            disabled={adzunaLoading || linkedinLoading}
            className="px-5 py-2.5 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {adzunaLoading || linkedinLoading ? (
              <>
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                <span>Searching…</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[16px]">search</span>
                <span>Search Internships</span>
              </>
            )}
          </button>
        </div>

        {/* RapidAPI Activation Banner if subscription required */}
        {linkedinError && linkedinError.includes('RapidAPI') && (
          <div className="mt-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
            <span className="material-symbols-outlined text-[20px] text-amber-600 flex-shrink-0 mt-0.5">vpn_key_alert</span>
            <div className="flex-1 space-y-1.5">
              <span className="font-bold block text-amber-950 text-sm">RapidAPI JSearch Activation Needed (Free 1-Click Step)</span>
              <p className="text-amber-800 leading-relaxed">
                Your RapidAPI key is saved in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">.env</code>! However, RapidAPI requires you to click <strong>"Subscribe"</strong> on the Basic ($0/mo Free) plan once before it enables queries.
              </p>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href="https://rapidapi.com/letscrape-6bRBa3QguO5/api/jsearch/pricing"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-700 text-white font-bold hover:bg-amber-800 transition-colors text-xs shadow-sm"
                >
                  <span>1-Click Free Subscription on RapidAPI</span>
                  <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                </a>
                <button
                  type="button"
                  onClick={() => setSelectedSource('adzuna')}
                  className="px-3 py-1.5 rounded-lg border border-amber-300 bg-white text-amber-900 font-semibold text-xs hover:bg-amber-100 transition-colors"
                >
                  Switch to Adzuna Live (800+ Active Roles)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Banner */}
        {(adzunaError || (linkedinError && !linkedinError.includes('RapidAPI'))) && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
            <span className="material-symbols-outlined text-[16px] text-rose-600 flex-shrink-0 mt-0.5">error</span>
            <div>
              <span className="font-bold block">Notice</span>
              {adzunaError && <div>Adzuna: {adzunaError}</div>}
              {linkedinError && !linkedinError.includes('RapidAPI') && <div>LinkedIn: {linkedinError}</div>}
            </div>
          </div>
        )}
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
                setMinStipend(0);
                setSelectedTech([]);
                setSelectedLocation('all');
                setGlobalSearch('');
              }}
              className="text-xs font-semibold text-secondary hover:underline"
            >
              Reset
            </button>
          </div>

          {/* Platform Source Filter */}
          <div>
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-2">
              Platform Source
            </label>
            <div className="space-y-1.5 text-xs">
              {[
                { id: 'all', label: 'All Sources (Adzuna + LinkedIn)' },
                { id: 'adzuna', label: 'Adzuna Live' },
                { id: 'linkedin', label: 'LinkedIn (RapidAPI)' },
              ].map((src) => (
                <label key={src.id} className="flex items-center gap-2 cursor-pointer text-on-surface hover:text-secondary">
                  <input
                    type="radio"
                    name="platformSource"
                    checked={selectedSource === src.id}
                    onChange={() => setSelectedSource(src.id)}
                    className="accent-secondary"
                  />
                  <span>{src.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Search by Keyword (local filter) */}
          <div>
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-2">
              Filter Results
            </label>
            <div className="relative">
              <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-outline text-[18px]">
                search
              </span>
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Filter by keyword…"
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
                { id: 'all', label: 'All Internships' },
                { id: 'Full-Time Intern', label: 'Full-Time Intern' },
                { id: 'Summer Intern', label: 'Summer / Part-Time Intern' },
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
                {minStipend === 0 ? 'Any' : `₹${minStipend.toLocaleString()}/mo`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100000"
              step="5000"
              value={minStipend}
              onChange={(e) => setMinStipend(Number(e.target.value))}
              className="w-full accent-secondary"
            />
            <div className="flex justify-between text-[10px] text-outline mt-1">
              <span>Any</span>
              <span>₹50k</span>
              <span>₹100k+</span>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-2">
              Location Filter
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
              <option value="delhi">Delhi / NCR</option>
              <option value="pune">Pune</option>
              <option value="remote">Remote</option>
            </select>
          </div>

          {/* Tech Stack Chips */}
          <div>
            <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-2">
              Tech Stack
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
            <span>
              Showing {filteredInternships.length} listing{filteredInternships.length !== 1 ? 's' : ''}
              {adzunaTotalCount > 0 && (
                <span className="ml-1 text-on-surface-variant/60">
                  (page {currentPage} of {totalPages || 1})
                </span>
              )}
            </span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live from Adzuna
            </span>
          </div>

          {/* Loading skeleton */}
          {adzunaLoading && (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high animate-pulse"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-surface-container-high rounded w-2/3" />
                      <div className="h-3 bg-surface-container-high rounded w-1/3" />
                      <div className="h-3 bg-surface-container-high rounded w-full" />
                      <div className="h-3 bg-surface-container-high rounded w-4/5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Results */}
          {!adzunaLoading && filteredInternships.length === 0 && (
            <div className="p-12 rounded-2xl bg-surface-container-lowest border border-surface-container-high text-center">
              <span className="material-symbols-outlined text-4xl text-outline mb-2">search_off</span>
              <h3 className="font-bold text-primary text-base">No matching internships found</h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Try different keywords or clear the filters.
              </p>
              <button
                type="button"
                onClick={() => handleSearch(1)}
                className="mt-4 px-4 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold"
              >
                Refresh Live Listings
              </button>
            </div>
          )}

          {!adzunaLoading &&
            filteredInternships.map((job) => {
              const isSaved = bookmarks.includes(job.id);
              return (
                <div
                  key={job.id}
                  className="p-6 rounded-2xl bg-surface-container-lowest border border-surface-container-high hover:border-secondary hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`w-14 h-14 rounded-2xl ${job.logoBg || 'bg-surface-container-low'} flex-shrink-0 flex items-center justify-center font-extrabold text-2xl shadow-sm`}
                    >
                      {job.logoText || '?'}
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2
                          onClick={() =>
                            job.applyUrl && job.applyUrl !== '#'
                              ? window.open(job.applyUrl, '_blank', 'noreferrer')
                              : navigate('internship-details', job.id)
                          }
                          className="font-headline-sm text-lg font-bold text-primary hover:text-secondary cursor-pointer"
                        >
                          {job.title}
                        </h2>
                        {job.source === 'linkedin' ? (
                          <span className="px-2 py-0.5 rounded-full bg-[#0A66C2]/10 text-[#0A66C2] font-bold text-[10px] border border-[#0A66C2]/25 flex items-center gap-1">
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25c-.9 0-1.63.73-1.63 1.63 0 .9.73 1.63 1.63 1.63.9 0 1.63-.73 1.63-1.63 0-.9-.73-1.63-1.63-1.63Z" />
                            </svg>
                            LinkedIn
                          </span>
                        ) : job.isLiveMatch ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
                            Adzuna
                          </span>
                        ) : null}
                      </div>

                      <p className="text-xs font-medium text-on-surface-variant">
                        {job.company} • {job.location} • {job.roleType}
                      </p>

                      <p className="text-xs text-on-surface-variant leading-relaxed line-clamp-2">
                        {job.description}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {job.tags.slice(0, 5).map((tag, idx) => (
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
                        ₹{(job.stipend || 12000).toLocaleString('en-IN')}/mo
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

                      <a
                        href={job.applyUrl || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-xl bg-secondary text-on-secondary text-xs font-bold hover:bg-secondary-container transition-all shadow-sm flex items-center gap-1"
                      >
                        <span>Apply Now</span>
                        <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}

          {/* Pagination */}
          {!adzunaLoading && totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => handleSearch(currentPage - 1)}
                className="px-4 py-2 rounded-xl border border-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Prev
              </button>

              <span className="text-xs text-on-surface-variant font-medium">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => handleSearch(currentPage + 1)}
                className="px-4 py-2 rounded-xl border border-surface-container-high text-xs font-semibold text-on-surface hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                Next
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
