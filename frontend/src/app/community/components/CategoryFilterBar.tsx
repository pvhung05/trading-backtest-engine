import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import type { IdeaFilter, MarketCategory } from '../types';

interface CategoryFilterBarProps {
  activeFilter: IdeaFilter;
  onFilterChange: (f: IdeaFilter) => void;
  activeCategory: MarketCategory;
  onCategoryChange: (c: MarketCategory) => void;
}

const CATEGORY_OPTIONS: { id: MarketCategory; label: string }[] = [
  { id: 'all', label: 'All ideas' },
  { id: 'crypto', label: 'Crypto' },
  { id: 'stocks', label: 'Stocks' },
  { id: 'forex', label: 'Forex' },
  { id: 'indices', label: 'Indices' },
  { id: 'strategies', label: 'Strategies' },
];

export function CategoryFilterBar({
  activeFilter,
  onFilterChange,
  activeCategory,
  onCategoryChange,
}: CategoryFilterBarProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedCategoryLabel =
    CATEGORY_OPTIONS.find((c) => c.id === activeCategory)?.label || 'All ideas';

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleDown = (e: MouseEvent) => {
      if (!dropdownRef.current) return;
      if (!dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDown);
    return () => document.removeEventListener('mousedown', handleDown);
  }, [dropdownOpen]);

  return (
    <section className="pt-6 pb-4 space-y-6">
      {/* Hero Title (Large bold: "Community ideas") */}
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          Community ideas
        </h1>
      </div>

      {/* Center Filter Pills: Popular | Editors' picks */}
      <div className="flex items-center justify-center gap-2">
        <button
          onClick={() => onFilterChange('popular')}
          className={`px-6 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            activeFilter === 'popular'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
              : 'bg-gray-100 dark:bg-[#1e222d] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Popular
        </button>

        <button
          onClick={() => onFilterChange('editors_picks')}
          className={`px-6 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
            activeFilter === 'editors_picks'
              ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-sm'
              : 'bg-gray-100 dark:bg-[#1e222d] text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          Editors' picks
        </button>
      </div>

      {/* Right-aligned filters: All ideas ˅ & Videos only */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {/* All ideas dropdown */}
        <div ref={dropdownRef} className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-[#1e222d] border border-gray-200 dark:border-[#2a2e39] text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
          >
            <span>{selectedCategoryLabel}</span>
            <ChevronDown className="size-3.5 text-gray-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-white dark:bg-[#1e222d] rounded-2xl shadow-xl border border-gray-100 dark:border-[#2a2e39] py-1.5 z-30 animate-in fade-in zoom-in-95 duration-100">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => {
                    onCategoryChange(cat.id);
                    setDropdownOpen(false);
                  }}
                  className={`w-full text-left px-4 py-2 text-xs font-semibold transition-colors cursor-pointer ${
                    activeCategory === cat.id
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-950/30'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

