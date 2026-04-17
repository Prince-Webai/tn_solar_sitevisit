'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Clock, FileText, User, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { mockJobs, mockClients } from '@/lib/mock-data';

interface SearchResult {
  id: string;
  type: 'job' | 'client' | 'address';
  title: string;
  subtitle: string;
  href: string;
}

const RECENT_SEARCHES_KEY = 'visionsolar_recent_searches';
const MAX_RECENT = 5;

export function Header() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch { /* ignore */ }
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(() => {
      const q = query.toLowerCase();
      const jobResults: SearchResult[] = mockJobs
        .filter(j =>
          j.job_number.toLowerCase().includes(q) ||
          j.client?.first_name.toLowerCase().includes(q) ||
          j.client?.last_name.toLowerCase().includes(q) ||
          j.address.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q)
        )
        .slice(0, 4)
        .map(j => ({
          id: j.id,
          type: 'job',
          title: `${j.job_number} — ${j.client?.first_name} ${j.client?.last_name}`,
          subtitle: j.address,
          href: `/dashboard?job=${j.id}`,
        }));

      const clientResults: SearchResult[] = mockClients
        .filter(c =>
          c.first_name.toLowerCase().includes(q) ||
          c.last_name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q)
        )
        .slice(0, 3)
        .map(c => ({
          id: c.id,
          type: 'client',
          title: `${c.first_name} ${c.last_name}`,
          subtitle: c.email,
          href: `/dashboard?client=${c.id}`,
        }));

      setResults([...jobResults, ...clientResults]);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const saveSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, MAX_RECENT);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleSelect = (result: SearchResult) => {
    saveSearch(result.title);
    setQuery('');
    setShowDropdown(false);
    router.push(result.href);
  };

  const iconForType = (type: string) => {
    switch (type) {
      case 'job': return <FileText className="w-4 h-4 text-vision-green" />;
      case 'client': return <User className="w-4 h-4 text-solar-orange" />;
      case 'address': return <MapPin className="w-4 h-4 text-mid-gray" />;
      default: return null;
    }
  };

  return (
    <header className="h-16 bg-white border-b border-light-gray flex items-center px-6 gap-4 shrink-0">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-mid-gray" />
        <Input
          ref={inputRef}
          id="global-search"
          type="text"
          placeholder="Search jobs, clients, addresses..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          className="pl-10 pr-8 h-10 bg-off-white border-light-gray focus:border-vision-green focus:ring-vision-green/20"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-mid-gray hover:text-charcoal transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {/* Dropdown */}
        {showDropdown && (query || recentSearches.length > 0) && (
          <div
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 mt-1 bg-white border border-light-gray rounded-lg shadow-lg overflow-hidden z-50 animate-fade-in"
          >
            {/* Results */}
            {results.length > 0 && (
              <div className="p-1">
                {results.map(r => (
                  <button
                    key={r.id}
                    onClick={() => handleSelect(r)}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-off-white transition-colors text-left"
                  >
                    {iconForType(r.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-charcoal truncate">{r.title}</p>
                      <p className="text-xs text-mid-gray truncate">{r.subtitle}</p>
                    </div>
                    <span className="text-[10px] uppercase tracking-wider text-mid-gray font-medium px-1.5 py-0.5 bg-off-white rounded">
                      {r.type}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* No results */}
            {query && results.length === 0 && (
              <div className="px-4 py-6 text-center">
                <p className="text-sm text-mid-gray">No results found for &ldquo;{query}&rdquo;</p>
              </div>
            )}

            {/* Recent searches */}
            {!query && recentSearches.length > 0 && (
              <div className="p-1">
                <p className="px-3 py-1.5 text-xs font-medium text-mid-gray uppercase tracking-wider">
                  Recent Searches
                </p>
                {recentSearches.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuery(s); setShowDropdown(true); }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-md hover:bg-off-white transition-colors text-left"
                  >
                    <Clock className="w-4 h-4 text-mid-gray" />
                    <span className="text-sm text-dark-gray">{s}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side placeholder for notifications etc */}
      <div className="flex items-center gap-2">
        <div className="h-8 px-3 flex items-center rounded-full bg-accent text-green-dark text-xs font-semibold">
          {new Date().toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
        </div>
      </div>
    </header>
  );
}
