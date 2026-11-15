import React, { useState, useRef, useEffect } from 'react';
import { Filter, X, ChevronDown } from 'lucide-react';

export interface FilterField {
  key: string;
  label: string;
  options: { value: string; label: string }[];
}

interface FilterPanelProps {
  fields: FilterField[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onClear: () => void;
}

export default function FilterPanel({ fields, values, onChange, onClear }: FilterPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const activeCount = Object.values(values).filter(v => v !== '').length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
          activeCount > 0
            ? 'bg-blue-50 border-blue-300 text-blue-700'
            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
        }`}
      >
        <Filter className="w-4 h-4" />
        Filters
        {activeCount > 0 && (
          <span className="bg-blue-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <span className="text-sm font-semibold text-slate-700">Filters</span>
            {activeCount > 0 && (
              <button
                onClick={() => { onClear(); }}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="p-4 space-y-3 max-h-80 overflow-y-auto">
            {fields.map(field => {
              const isSelected = Boolean(values[field.key]);
              return (
                <div key={field.key}>
                  <label className={`flex items-center justify-between text-xs font-medium uppercase tracking-wider mb-1.5 ${
                    isSelected ? 'text-blue-700 font-semibold' : 'text-slate-500'
                  }`}>
                    <span className="flex items-center gap-1.5">
                      {field.label}
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />}
                    </span>
                    {isSelected && (
                      <button
                        type="button"
                        onClick={() => onChange(field.key, '')}
                        className="text-[10px] font-medium text-blue-600 hover:text-blue-800 normal-case tracking-normal"
                      >
                        Reset
                      </button>
                    )}
                  </label>
                  <select
                    aria-label={field.label}
                    value={values[field.key] || ''}
                    onChange={e => onChange(field.key, e.target.value)}
                    className={`w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors ${
                      isSelected
                        ? 'border-blue-300 bg-blue-50/40 text-blue-900 font-medium'
                        : 'border-slate-300 bg-white text-slate-700'
                    }`}
                  >
                    <option value="">All</option>
                    {field.options.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              );
            })}
          </div>
          <div className="px-4 py-3 border-t border-slate-100 bg-slate-50">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg py-2 hover:bg-slate-50 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
