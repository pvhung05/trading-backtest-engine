import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';

export interface IntervalOption {
  value: string;
  label: string;
  group: string;
}

export const INTERVAL_OPTIONS: IntervalOption[] = [
  { value: '1m', label: '1 minute', group: 'Minutes' },
  { value: '3m', label: '3 minutes', group: 'Minutes' },
  { value: '5m', label: '5 minutes', group: 'Minutes' },
  { value: '15m', label: '15 minutes', group: 'Minutes' },
  { value: '30m', label: '30 minutes', group: 'Minutes' },
  { value: '1h', label: '1 hour', group: 'Hours' },
  { value: '2h', label: '2 hours', group: 'Hours' },
  { value: '4h', label: '4 hours', group: 'Hours' },
  { value: '6h', label: '6 hours', group: 'Hours' },
  { value: '8h', label: '8 hours', group: 'Hours' },
  { value: '12h', label: '12 hours', group: 'Hours' },
  { value: '1d', label: '1 day', group: 'Days' },
  { value: '3d', label: '3 days', group: 'Days' },
  { value: '1w', label: '1 week', group: 'Weeks' },
  { value: '1M', label: '1 month', group: 'Months' },
];

interface IntervalDropdownProps {
  value: string;
  onChange: (v: string) => void;
}

export function IntervalDropdown({ value, onChange }: IntervalDropdownProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const filtered = INTERVAL_OPTIONS.filter((opt) =>
    opt.label.toLowerCase().includes(query.toLowerCase()) ||
    opt.value.toLowerCase().includes(query.toLowerCase())
  );

  const grouped = filtered.reduce<Record<string, IntervalOption[]>>((acc, opt) => {
    (acc[opt.group] ||= []).push(opt);
    return acc;
  }, {});

  const select = (v: string) => {
    onChange(v);
    setOpen(false);
    setQuery('');
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="px-3 py-1 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        {value}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-gray-400 dark:text-gray-500" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search intervals"
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white dark:focus:bg-gray-600 transition-colors"
              />
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto py-1">
            {Object.keys(grouped).length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-gray-400 dark:text-gray-500">
                No results
              </div>
            )}
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group}>
                <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  {group}
                </div>
                {items.map((opt) => {
                  const isActive = opt.value === value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => select(opt.value)}
                      className={`w-full px-3 py-1.5 flex items-center justify-between text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                        isActive
                          ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                          : 'text-gray-700 dark:text-gray-300'
                      }`}
                    >
                      <span>{opt.label}</span>
                      {isActive && (
                        <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                          {opt.value}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
