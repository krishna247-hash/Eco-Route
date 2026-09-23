'use client';

import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import { searchLocations, type LocationResult } from '@/lib/locationApi';

interface LocationAutocompleteProps {
  placeholder?: string;
  initialValue?: string;
  onSelect: (location: LocationResult) => void;
  className?: string;
}

const DEBOUNCE_MS = 350;

export function LocationAutocomplete({
  placeholder = 'Search a city, town, or place…',
  initialValue = '',
  onSelect,
  className,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(initialValue);
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextSearch = useRef(false);

  useEffect(() => {
    if (skipNextSearch.current) {
      skipNextSearch.current = false;
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const found = await searchLocations(trimmed);
        setResults(found);
        setError(found.length === 0 ? 'No matches found.' : null);
      } catch {
        setResults([]);
        setError('Location search is temporarily unavailable. You can still enter details manually below.');
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(location: LocationResult) {
    skipNextSearch.current = true;
    setQuery(location.displayName);
    setResults([]);
    setOpen(false);
    onSelect(location);
  }

  return (
    <div ref={containerRef} className={`relative ${className ?? ''}`}>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-8 text-sm text-slate-900 shadow-sm transition-all placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-emerald-500" />
        )}
      </div>

      {open && (results.length > 0 || error) && (
        <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
          {results.length > 0 ? (
            <ul className="max-h-64 overflow-y-auto py-1">
              {results.map((location, i) => (
                <li key={`${location.latitude}-${location.longitude}-${i}`}>
                  <button
                    type="button"
                    onClick={() => handleSelect(location)}
                    className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-emerald-50"
                  >
                    <MapPin className="mt-0.5 h-3.5 w-3.5 flex-none text-emerald-600" />
                    <span>
                      <span className="block font-medium text-slate-800">{location.name}</span>
                      <span className="block text-xs text-slate-500">{location.displayName}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2.5 text-xs text-slate-500">{error}</p>
          )}
        </div>
      )}
    </div>
  );
}
