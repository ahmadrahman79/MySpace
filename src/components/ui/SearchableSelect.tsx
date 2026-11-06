'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Search, Plus, Check } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  badge?: string;
}

interface SearchableSelectProps {
  value: string;
  options: (SelectOption | string)[];
  onChange: (val: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  className?: string;
  allowCustomAdd?: boolean;
  onCustomAdd?: (newVal: string) => void;
}

export function SearchableSelect({
  value,
  options,
  onChange,
  placeholder = 'Pilih...',
  searchPlaceholder = 'Cari...',
  className = '',
  allowCustomAdd = false,
  onCustomAdd
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options to SelectOption[]
  const normalizedOptions: SelectOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }, [options]);

  // Current selected label
  const selectedOption = normalizedOptions.find((o) => o.value === value);
  const currentLabel = selectedOption ? selectedOption.label : value || placeholder;

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!search.trim()) return normalizedOptions;
    return normalizedOptions.filter((o) =>
      o.label.toLowerCase().includes(search.toLowerCase()) ||
      o.value.toLowerCase().includes(search.toLowerCase())
    );
  }, [normalizedOptions, search]);

  // Focus search input when popover opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  // Handle outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const handleAddCustom = () => {
    const trimmed = search.trim();
    if (!trimmed) return;
    if (onCustomAdd) {
      onCustomAdd(trimmed);
    }
    onChange(trimmed);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative inline-block w-full ${className}`}>
      {/* Trigger Button - strictly styled as Gambar 1 with emerald/green border */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex w-full items-center justify-between rounded-lg border bg-white px-3 py-2 text-xs font-semibold transition shadow-2xs dark:bg-slate-900 ${
          isOpen
            ? 'border-emerald-500 ring-1 ring-emerald-500/20 text-slate-900 dark:text-white'
            : 'border-emerald-500/80 hover:border-emerald-600 text-slate-800 dark:text-slate-100'
        }`}
      >
        <span className="truncate">{currentLabel}</span>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-emerald-600 shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-emerald-600 shrink-0" />
        )}
      </button>

      {/* Popover Menu matching Gambar 1 */}
      {isOpen && (
        <div className="absolute left-0 right-0 z-50 mt-1 min-w-[200px] rounded-lg border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-100">
          {/* Top Search Input with green border matching Gambar 1 */}
          <div className="mb-2">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-emerald-500 px-2.5 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Options List */}
          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5 custom-scrollbar">
            {filteredOptions.length === 0 ? (
              <div className="p-2 text-center text-xs text-slate-400 italic">
                Tidak ada pilihan ditemukan
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => handleSelect(opt.value)}
                    className={`flex w-full items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-left transition ${
                      isSelected
                        ? 'font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0 ml-1" />}
                  </button>
                );
              })
            )}

            {/* Optional custom addition */}
            {allowCustomAdd && search.trim() && !filteredOptions.some(o => o.label.toLowerCase() === search.toLowerCase()) && (
              <button
                type="button"
                onClick={handleAddCustom}
                className="mt-1 flex w-full items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-bold text-emerald-700 bg-emerald-50/80 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah &quot;{search.trim()}&quot;</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
