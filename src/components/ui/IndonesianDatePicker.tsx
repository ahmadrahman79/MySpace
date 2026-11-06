'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronDown, X, ArrowRight } from 'lucide-react';

interface IndonesianDatePickerProps {
  value?: string | null; // format: 'YYYY-MM-DD' or ISO or 'YYYY-MM-DD s/d YYYY-MM-DD'
  endDateValue?: string | null;
  onChange: (dateStr: string) => void;
  onRangeChange?: (startDate: string, endDate: string) => void;
  isRange?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS_SHORT_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export function formatIndonesianDate(dateStr?: string | null): string {
  if (!dateStr) return '';
  if (dateStr.includes(' s/d ')) {
    const [start, end] = dateStr.split(' s/d ');
    return `${formatIndonesianDate(start)} s/d ${formatIndonesianDate(end)}`;
  }
  const clean = dateStr.split('T')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d) && m >= 0 && m < 12) {
      return `${String(d).padStart(2, '0')} ${MONTH_NAMES_ID[m]} ${y}`;
    }
  }
  const date = new Date(dateStr);
  if (!isNaN(date.getTime())) {
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  }
  return dateStr;
}

export function IndonesianDatePicker({
  value,
  endDateValue,
  onChange,
  onRangeChange,
  isRange = false,
  placeholder = 'Pilih tanggal...',
  className = '',
  disabled = false,
}: IndonesianDatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [startDateInternal, setStartDateInternal] = useState<string>(value ? value.split('T')[0] : '');
  const [endDateInternal, setEndDateInternal] = useState<string>(endDateValue ? endDateValue.split('T')[0] : '');
  const [selectingStep, setSelectingStep] = useState<'start' | 'end'>('start');

  const initialDate = useMemoDate(value);
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth());

  useEffect(() => {
    if (value) {
      const clean = value.split('T')[0];
      setStartDateInternal(clean);
      const d = parseDateString(clean);
      if (d) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
    if (endDateValue) {
      setEndDateInternal(endDateValue.split('T')[0]);
    }
  }, [value, endDateValue]);

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

  const prevMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleSelectDay = (day: number) => {
    const formatted = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (!isRange) {
      onChange(formatted);
      setIsOpen(false);
      return;
    }

    // Range mode logic
    if (selectingStep === 'start' || !startDateInternal || (startDateInternal && endDateInternal)) {
      setStartDateInternal(formatted);
      setEndDateInternal('');
      setSelectingStep('end');
      onChange(formatted);
    } else {
      // Step 2: Selecting End Date
      if (formatted < startDateInternal) {
        // If clicked date is before start date, make it the new start date
        setStartDateInternal(formatted);
        setEndDateInternal('');
        setSelectingStep('end');
        onChange(formatted);
      } else {
        setEndDateInternal(formatted);
        setSelectingStep('start');
        if (onRangeChange) {
          onRangeChange(startDateInternal, formatted);
        } else {
          onChange(`${startDateInternal} s/d ${formatted}`);
        }
        setIsOpen(false);
      }
    }
  };

  const handleSelectToday = (e: React.MouseEvent) => {
    e.stopPropagation();
    const today = new Date();
    const formatted = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    onChange(formatted);
    setStartDateInternal(formatted);
    setEndDateInternal('');
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setStartDateInternal('');
    setEndDateInternal('');
    setIsOpen(false);
  };

  const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay();
  const daysInCurrentMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthLastDate = new Date(viewYear, viewMonth, 0).getDate();

  const days: { day: number; isCurrentMonth: boolean; dateStr: string }[] = [];

  for (let i = firstDayIndex - 1; i >= 0; i--) {
    const d = prevMonthLastDate - i;
    const m = viewMonth === 0 ? 12 : viewMonth;
    const y = viewMonth === 0 ? viewYear - 1 : viewYear;
    days.push({
      day: d,
      isCurrentMonth: false,
      dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    });
  }

  for (let d = 1; d <= daysInCurrentMonth; d++) {
    days.push({
      day: d,
      isCurrentMonth: true,
      dateStr: `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    });
  }

  const remaining = (days.length % 7 === 0) ? 0 : 7 - (days.length % 7);
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth + 2 > 12 ? 1 : viewMonth + 2;
    const y = viewMonth + 2 > 12 ? viewYear + 1 : viewYear;
    days.push({
      day: d,
      isCurrentMonth: false,
      dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
    });
  }

  const displayText = useMemo(() => {
    if (isRange && startDateInternal && endDateInternal) {
      return `${formatIndonesianDate(startDateInternal)} – ${formatIndonesianDate(endDateInternal)}`;
    }
    if (startDateInternal) {
      return formatIndonesianDate(startDateInternal);
    }
    return '';
  }, [isRange, startDateInternal, endDateInternal]);

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      {/* Input Display Button */}
      <div
        onClick={() => {
          if (!disabled) setIsOpen(!isOpen);
        }}
        className={`flex items-center justify-between cursor-pointer rounded-2xl border bg-white px-3.5 py-2.5 text-xs text-slate-800 transition shadow-2xs hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-slate-600 ${
          isOpen ? 'ring-2 ring-emerald-500/20 border-emerald-500' : 'border-slate-200'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      >
        <span className={displayText ? 'font-semibold text-slate-900 dark:text-white' : 'text-slate-400'}>
          {displayText || placeholder}
        </span>
        <div className="flex items-center gap-1.5 text-slate-400">
          {displayText && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded-full hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <CalendarIcon className="h-4 w-4 text-emerald-600" />
        </div>
      </div>

      {/* Floating Calendar Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 left-0 w-80 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-black text-slate-900 dark:text-white">
              {MONTH_NAMES_ID[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={prevMonth}
                className="h-6 w-6 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={nextMonth}
                className="h-6 w-6 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Range selection indicator */}
          {isRange && (
            <div className="mb-2 p-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-[11px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center justify-between">
              <span>{selectingStep === 'start' ? '1. Pilih Tanggal Mulai' : '2. Pilih Tanggal Selesai'}</span>
              {startDateInternal && (
                <span className="text-[10px] font-mono text-emerald-600">
                  {formatIndonesianDate(startDateInternal)}
                </span>
              )}
            </div>
          )}

          {/* Days of week header */}
          <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-1">
            {DAYS_SHORT_ID.map((d) => (
              <div key={d} className="py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {days.map((item, idx) => {
              const isStart = item.dateStr === startDateInternal;
              const isEnd = item.dateStr === endDateInternal;
              const isInRange = isRange && startDateInternal && endDateInternal && item.dateStr > startDateInternal && item.dateStr < endDateInternal;
              const isToday = item.dateStr === new Date().toISOString().split('T')[0];

              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => handleSelectDay(item.day)}
                  className={`h-7 w-7 mx-auto rounded-xl flex items-center justify-center text-xs font-semibold transition ${
                    isStart || isEnd
                      ? 'bg-emerald-600 text-white font-black shadow-xs ring-2 ring-emerald-300'
                      : isInRange
                      ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-200 font-bold'
                      : isToday
                      ? 'border border-emerald-500 text-emerald-600 dark:text-emerald-400 font-bold'
                      : !item.isCurrentMonth
                      ? 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {item.day}
                </button>
              );
            })}
          </div>

          {/* Footer Controls */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
            >
              Hapus
            </button>
            <button
              type="button"
              onClick={handleSelectToday}
              className="text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Hari Ini
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function parseDateString(str: string): Date | null {
  if (!str) return null;
  const clean = str.split('T')[0].split(' ')[0];
  const parts = clean.split('-');
  if (parts.length === 3) {
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
      return new Date(y, m, d);
    }
  }
  const date = new Date(str);
  return isNaN(date.getTime()) ? null : date;
}

function useMemoDate(value?: string | null): Date {
  if (!value) return new Date();
  const parsed = parseDateString(value);
  return parsed || new Date();
}
