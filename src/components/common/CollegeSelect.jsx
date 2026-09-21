import React, { useState, useRef, useEffect, useMemo } from 'react';
import { INDIAN_COLLEGES } from '../../data/indianColleges';

export default function CollegeSelect({
  value = '',
  onChange,
  required = false,
  placeholder = 'Search or select your College / University in India...',
  id = 'college-select',
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState(value);
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Keep query in sync when parent value changes externally
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filtered colleges list
  const filteredColleges = useMemo(() => {
    const q = (query || '').toLowerCase().trim();
    if (!q) {
      return INDIAN_COLLEGES.slice(0, 40); // Show top 40 premier colleges initially
    }
    return INDIAN_COLLEGES.filter((c) => c.toLowerCase().includes(q));
  }, [query]);

  const handleSelect = (collegeName) => {
    setQuery(collegeName);
    if (onChange) {
      onChange(collegeName);
    }
    setIsOpen(false);
  };

  const handleInputChange = (e) => {
    const text = e.target.value;
    setQuery(text);
    if (onChange) {
      onChange(text);
    }
    if (!isOpen) {
      setIsOpen(true);
    }
  };

  const handleClear = (e) => {
    e.stopPropagation();
    setQuery('');
    if (onChange) {
      onChange('');
    }
    if (inputRef.current) {
      inputRef.current.focus();
    }
    setIsOpen(true);
  };

  const toggleDropdown = () => {
    setIsOpen((prev) => !prev);
    if (!isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  };

  // Helper badge for top tiers
  const getBadge = (name) => {
    if (name.includes('IIT')) return { label: 'IIT', color: 'bg-blue-100 text-blue-700' };
    if (name.includes('NIT')) return { label: 'NIT', color: 'bg-indigo-100 text-indigo-700' };
    if (name.includes('IIIT')) return { label: 'IIIT', color: 'bg-emerald-100 text-emerald-700' };
    if (name.includes('BITS')) return { label: 'BITS', color: 'bg-amber-100 text-amber-700' };
    return null;
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Search Input Bar with Caret / Toggle Button */}
      <div className="relative flex items-center">
        <input
          id={id}
          ref={inputRef}
          type="text"
          required={required}
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="w-full pl-3.5 pr-16 py-2.5 rounded-xl bg-surface border border-outline-variant text-on-surface text-xs focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/15 transition-all"
        />

        <div className="absolute right-2.5 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 text-outline hover:text-on-surface rounded-full hover:bg-surface-container transition-colors"
              title="Clear selection"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          )}

          {/* Caret / Dropdown Toggle Bar Icon */}
          <button
            type="button"
            onClick={toggleDropdown}
            className="p-1 text-on-surface-variant hover:text-secondary rounded-lg hover:bg-surface-container transition-colors"
            title={isOpen ? 'Close college options' : 'Show all college options'}
          >
            <span
              className={`material-symbols-outlined text-[20px] transition-transform duration-200 inline-block ${
                isOpen ? 'rotate-180 text-secondary' : 'text-on-surface-variant'
              }`}
            >
              keyboard_arrow_down
            </span>
          </button>
        </div>
      </div>

      {/* Dropdown Options List */}
      {isOpen && (
        <div
          ref={listRef}
          className="absolute left-0 right-0 top-full mt-1.5 bg-surface-container-lowest border border-surface-container-high rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto divide-y divide-surface-container-high/50 text-xs"
        >
          {/* Header Info */}
          <div className="p-2.5 bg-surface-container-low/60 flex items-center justify-between text-[11px] text-on-surface-variant font-semibold sticky top-0 backdrop-blur-sm z-10 border-b border-surface-container-high">
            <span>
              {query ? `Found ${filteredColleges.length} matches` : 'Showing popular Indian colleges'}
            </span>
            <span className="text-[10px] text-outline">Click to select or type your own</span>
          </div>

          {/* Option: Use custom typed text if not strictly in list */}
          {query.trim() && !INDIAN_COLLEGES.some((c) => c.toLowerCase() === query.trim().toLowerCase()) && (
            <div
              onClick={() => handleSelect(query.trim())}
              className="p-2.5 hover:bg-secondary/10 cursor-pointer text-secondary font-bold flex items-center gap-2 transition-colors border-b border-surface-container-high"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span>
              <span>Use custom college: "{query.trim()}"</span>
            </div>
          )}

          {/* List items */}
          {filteredColleges.length > 0 ? (
            filteredColleges.map((collegeName) => {
              const isSelected = query.toLowerCase() === collegeName.toLowerCase();
              const badge = getBadge(collegeName);

              return (
                <div
                  key={collegeName}
                  onClick={() => handleSelect(collegeName)}
                  className={`p-2.5 cursor-pointer flex items-center justify-between gap-2 transition-colors ${
                    isSelected
                      ? 'bg-secondary/15 text-secondary font-bold'
                      : 'hover:bg-surface-container-low text-on-surface'
                  }`}
                >
                  <div className="flex items-center gap-2 overflow-hidden text-ellipsis">
                    <span className="material-symbols-outlined text-[16px] text-outline flex-shrink-0">
                      school
                    </span>
                    <span className="truncate">{collegeName}</span>
                  </div>

                  {badge && (
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded flex-shrink-0 ${badge.color}`}
                    >
                      {badge.label}
                    </span>
                  )}
                </div>
              );
            })
          ) : (
            <div className="p-4 text-center text-on-surface-variant space-y-1">
              <p className="font-semibold">No exact matching colleges found in database.</p>
              <p className="text-[11px] text-outline">
                You can still select <strong>"{query}"</strong> as your college!
              </p>
              <button
                type="button"
                onClick={() => handleSelect(query.trim())}
                className="mt-2 px-3 py-1 bg-secondary text-on-secondary rounded-lg text-xs font-bold"
              >
                Set as my college
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
