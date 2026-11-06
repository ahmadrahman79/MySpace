'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Plus,
  StickyNote as StickyIcon,
  Check,
  FileText,
  Calendar,
  Layers,
  ArrowUpRight,
  Volume2,
  VolumeX,
  Bell,
  MapPin
} from 'lucide-react';
import { Task, StickyNote, CalendarEvent, NoteItem } from '@/lib/types';
import { formatIndonesianDate } from '@/components/ui/IndonesianDatePicker';
import { prayerAudio } from '@/lib/audioAlert';

const MONTH_NAMES_ID = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const DAYS_SHORT_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

interface PrayerSchedule {
  tanggal: string;
  imsak: string;
  subuh: string;
  terbit: string;
  dhuha: string;
  dzuhur: string;
  ashar: string;
  maghrib: string;
  isya: string;
}

export default function HomePage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [stickies, setStickies] = useState<StickyNote[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Time & Greeting
  const [timeStr, setTimeStr] = useState('08:00');
  const [greeting, setGreeting] = useState('Selamat Pagi');
  const [currentDateFormatted, setCurrentDateFormatted] = useState('');

  // Prayer Times State
  const [prayerSchedule, setPrayerSchedule] = useState<PrayerSchedule | null>(null);
  const [locationName, setLocationName] = useState<string>('Memuat Lokasi...');
  const [nextPrayerName, setNextPrayerName] = useState<string>('');
  const [nextPrayerTime, setNextPrayerTime] = useState<string>('');
  const [minutesToNextPrayer, setMinutesToNextPrayer] = useState<number | null>(null);
  const [isAlarmRinging, setIsAlarmRinging] = useState(false);
  const [alarmMessage, setAlarmMessage] = useState('');

  // Input for quick task addition
  const [newTaskInput, setNewTaskInput] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  // Selected date on calendar
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDay, setSelectedDay] = useState(today.getDate());

  // Fetch Prayer Times from IP
  useEffect(() => {
    async function loadPrayerTimes() {
      try {
        const res = await fetch('/api/prayer-times');
        const data = await res.json();
        if (data.success && data.schedule) {
          setPrayerSchedule(data.schedule);
          setLocationName(`${data.city || 'Pontianak'}, ${data.region || 'Indonesia'}`);
        }
      } catch (err) {
        console.error('Failed to load prayer times:', err);
      }
    }
    loadPrayerTimes();
  }, []);

  // Update Clock, Current Date, and Next Prayer Countdown
  useEffect(() => {
    const updateClockAndPrayer = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));

      // Indonesian formatted date
      const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
      const dayName = days[now.getDay()];
      const d = now.getDate();
      const m = MONTH_NAMES_ID[now.getMonth()];
      const y = now.getFullYear();
      setCurrentDateFormatted(`${dayName}, ${d} ${m} ${y}`);

      const hours = now.getHours();
      if (hours < 11) setGreeting('Selamat Pagi');
      else if (hours < 15) setGreeting('Selamat Siang');
      else if (hours < 18) setGreeting('Selamat Sore');
      else setGreeting('Selamat Malam');

      // Calculate Next Prayer
      if (prayerSchedule) {
        const prayerList: { name: string; time: string }[] = [
          { name: 'Subuh', time: prayerSchedule.subuh },
          { name: 'Terbit', time: prayerSchedule.terbit },
          { name: 'Dzuhur', time: prayerSchedule.dzuhur },
          { name: 'Ashar', time: prayerSchedule.ashar },
          { name: 'Maghrib', time: prayerSchedule.maghrib },
          { name: 'Isya', time: prayerSchedule.isya },
        ];

        const currentMinutes = now.getHours() * 60 + now.getMinutes();

        let found = false;
        for (const p of prayerList) {
          if (!p.time) continue;
          const [pHour, pMin] = p.time.split(':').map(Number);
          const pTotalMinutes = pHour * 60 + pMin;

          if (pTotalMinutes > currentMinutes) {
            setNextPrayerName(p.name);
            setNextPrayerTime(p.time);
            const diff = pTotalMinutes - currentMinutes;
            setMinutesToNextPrayer(diff);
            found = true;

            // Trigger Nada Dering 1 (10 Menit Sebelum Sholat)
            if (diff === 10 && now.getSeconds() === 0) {
              setAlarmMessage(`10 Menit Menuju Waktu Sholat ${p.name} (${p.time})`);
              setIsAlarmRinging(true);
              prayerAudio?.playReminder10Min(() => setIsAlarmRinging(false));
            }
            break;
          } else if (pTotalMinutes === currentMinutes && now.getSeconds() === 0) {
            // Trigger Nada Dering 2 (Waktu Sholat Masuk - 30 Detik)
            setAlarmMessage(`Waktu Sholat ${p.name} (${p.time}) Telah Tiba!`);
            setIsAlarmRinging(true);
            prayerAudio?.playAdhanAlarm(30, () => setIsAlarmRinging(false));
          }
        }

        // If all prayers passed today, next is Subuh tomorrow
        if (!found && prayerSchedule.subuh) {
          setNextPrayerName('Subuh (Besok)');
          setNextPrayerTime(prayerSchedule.subuh);
          const [pHour, pMin] = prayerSchedule.subuh.split(':').map(Number);
          const diff = (24 * 60 - currentMinutes) + (pHour * 60 + pMin);
          setMinutesToNextPrayer(diff);
        }
      }
    };

    updateClockAndPrayer();
    const interval = setInterval(updateClockAndPrayer, 1000);
    return () => clearInterval(interval);
  }, [prayerSchedule]);

  const handleStopAlarm = () => {
    prayerAudio?.stop();
    setIsAlarmRinging(false);
    setAlarmMessage('');
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const [tRes, sRes, eRes, nRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/sticky-notes'),
        fetch('/api/events?year=2026'),
        fetch('/api/notes'),
      ]);

      const [tData, sData, eData, nData] = await Promise.all([
        tRes.json(),
        sRes.json(),
        eRes.json(),
        nRes.json(),
      ]);

      if (tData.success) {
        const sortedTasks = [...tData.data].sort((a, b) => {
          const dateA = a.createdAt || a.finishAt || '';
          const dateB = b.createdAt || b.finishAt || '';
          return dateB.localeCompare(dateA);
        });
        setTasks(sortedTasks);
      }

      if (sData.success) {
        const sortedStickies = [...sData.data].sort((a, b) => {
          const dateA = a.createdAt || a.date || '';
          const dateB = b.createdAt || b.date || '';
          return dateB.localeCompare(dateA);
        });
        setStickies(sortedStickies);
      }

      if (eData.success) setEvents(eData.data.events || []);
      if (nData.success) setNotes(nData.data);
    } catch (e) {
      console.error('Failed to load home data:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleQuickAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskInput.trim()) return;

    try {
      setAddingTask(true);
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTaskInput.trim(),
          activity: 'Administrasi',
          progress: 'Not Started',
          finishAt: new Date().toISOString().split('T')[0],
          statusKipApp: 'Pending',
          priority: 'Medium',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewTaskInput('');
        loadData();
      }
    } catch (e) {
      console.error('Quick add task failed:', e);
    } finally {
      setAddingTask(false);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    const newProgress = task.progress === 'Done' ? 'Not Started' : 'Done';
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress: newProgress }),
      });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, progress: newProgress } : t))
      );
    } catch (e) {
      console.error('Failed to toggle task:', e);
    }
  };

  // Generate calendar days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const calendarCells = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  const totalTasks = tasks.length || 1;
  const completedCount = tasks.filter((t) => t.progress === 'Done').length;
  const percentComplete = Math.min(100, Math.round((completedCount / totalTasks) * 100));

  return (
    <div className="space-y-6 animate-fade-in pb-16">
      {/* ALARM BANNER (JIKA NADA DERING SEDANG BERBUNYI) */}
      {isAlarmRinging && (
        <div className="rounded-3xl bg-emerald-600 text-white p-4 sm:p-5 shadow-xl flex items-center justify-between gap-4 animate-bounce">
          <div className="flex items-center gap-3">
            <Bell className="h-6 w-6 text-amber-300 animate-spin" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                Notifikasi Jadwal Sholat
              </span>
              <h3 className="text-base sm:text-lg font-black">{alarmMessage}</h3>
            </div>
          </div>
          <button
            onClick={handleStopAlarm}
            className="rounded-full bg-white text-emerald-950 hover:bg-emerald-50 px-5 py-2.5 text-xs font-black shadow-lg transition active:scale-95 flex items-center gap-2"
          >
            <VolumeX className="h-4 w-4" />
            <span>Matikan Nada Dering 🔇</span>
          </button>
        </div>
      )}

      {/* Top Greeting Header with Indonesian Date */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>{greeting}, Ahmad Rahman</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Sistem Produktivitas Terintegrasi & Pengingat Waktu Sholat Otomatis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tanggal Bahasa Indonesia */}
          <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-3.5 py-1.5 text-xs font-black text-emerald-700 dark:text-emerald-300 shadow-2xs">
            📅 {currentDateFormatted || formatIndonesianDate(new Date().toISOString())}
          </span>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Kotak Jam Hijau Tanpa Gradasi + Jadwal Sholat NU + To-do (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* 1. KOTAK JAM: HIJAU SOLID TANPA GRADASI (Sesuai Permintaan User) */}
          <div className="relative overflow-hidden rounded-3xl bg-[#059669] text-white p-6 sm:p-7 shadow-lg shadow-emerald-900/15 flex flex-col justify-between min-h-[160px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-emerald-200" />
                <span>Waktu Saat Ini</span>
              </span>
              <div className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1 rounded-full bg-black/20 text-white backdrop-blur-xs">
                <MapPin className="h-3 w-3 text-emerald-300" />
                <span>{locationName}</span>
              </div>
            </div>

            {/* Jam & Tanggal Indonesia */}
            <div className="my-3 flex flex-wrap items-baseline justify-between gap-3">
              <span className="text-4xl sm:text-5xl font-black tracking-tight font-mono">
                {timeStr}
              </span>
              <span className="text-xs sm:text-sm font-bold text-emerald-100">
                {currentDateFormatted}
              </span>
            </div>

            {/* Countdown Jadwal Sholat Berikutnya */}
            <div className="pt-3 border-t border-white/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-300 animate-ping" />
                <span className="font-extrabold text-white">
                  {minutesToNextPrayer !== null
                    ? `${minutesToNextPrayer} menit lagi menuju Sholat ${nextPrayerName} (${nextPrayerTime} WIB)`
                    : 'Memuat waktu sholat...'}
                </span>
              </div>

              {isAlarmRinging && (
                <button
                  onClick={handleStopAlarm}
                  className="rounded-full bg-white text-emerald-900 px-3 py-1 text-[11px] font-black shadow-xs hover:bg-emerald-50 transition"
                >
                  Matikan Dering
                </button>
              )}
            </div>
          </div>

          {/* 2. JADWAL SHOLAT NU ONLINE (Desain Sesuai NU Online / Kemenag) */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 font-black text-slate-800 dark:text-slate-100">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span>Jadwal Sholat Hari Ini (Standar NU Online)</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold">{locationName}</span>
            </div>

            {prayerSchedule ? (
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center pt-1">
                {[
                  { name: 'Subuh', time: prayerSchedule.subuh },
                  { name: 'Terbit', time: prayerSchedule.terbit },
                  { name: 'Dzuhur', time: prayerSchedule.dzuhur },
                  { name: 'Ashar', time: prayerSchedule.ashar },
                  { name: 'Maghrib', time: prayerSchedule.maghrib },
                  { name: 'Isya', time: prayerSchedule.isya },
                ].map((p) => {
                  const isNext = p.name === nextPrayerName;
                  return (
                    <div
                      key={p.name}
                      className={`p-2.5 rounded-2xl border transition ${
                        isNext
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs dark:bg-emerald-950/40 dark:text-emerald-200'
                          : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75">
                        {p.name}
                      </span>
                      <span className="text-xs sm:text-sm font-black font-mono mt-0.5 block">
                        {p.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-slate-400 italic">
                Memuat jadwal sholat...
              </div>
            )}
          </div>

          {/* 3. DAFTAR TUGAS TERBARU */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                <span className="h-5 w-5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center text-xs font-bold">
                  ✓
                </span>
                <span>Tugas Paling Baru</span>
              </div>
              <Link
                href="/tasks"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Lihat Semua ({tasks.length})</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Quick Add Bar */}
            <form onSubmit={handleQuickAddTask} className="flex items-center rounded-2xl bg-slate-50 dark:bg-slate-800/80 p-1.5 border border-slate-200 dark:border-slate-700">
              <input
                type="text"
                placeholder="Tambah tugas cepat baru..."
                value={newTaskInput}
                onChange={(e) => setNewTaskInput(e.target.value)}
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={addingTask}
                className="h-8 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs flex items-center justify-center shadow-xs transition"
              >
                + Tambah
              </button>
            </form>

            {/* Checklist Items Terbaru */}
            <div className="space-y-2 pt-1 max-h-[260px] overflow-y-auto pr-1">
              {tasks.slice(0, 5).map((t) => {
                const isDone = t.progress === 'Done';
                return (
                  <div
                    key={t.id}
                    onClick={() => toggleTaskStatus(t)}
                    className={`group flex items-center justify-between rounded-2xl p-3 border cursor-pointer transition ${
                      isDone
                        ? 'border-slate-100 bg-slate-50/50 text-slate-400 dark:border-slate-800 dark:bg-slate-900/40'
                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-emerald-200 dark:hover:border-emerald-800 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <div
                        className={`h-5 w-5 rounded-lg border flex items-center justify-center transition shrink-0 ${
                          isDone
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-slate-600 group-hover:border-emerald-500'
                        }`}
                      >
                        {isDone && <Check className="h-3.5 w-3.5" />}
                      </div>

                      <div className="flex flex-col truncate">
                        <span
                          className={`text-xs font-bold truncate ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-800 dark:text-slate-100'
                          }`}
                        >
                          {t.name}
                        </span>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{t.activity}</span>
                          <span>•</span>
                          <span>{formatIndonesianDate(t.finishAt || t.finishAtRaw)}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                      t.progress === 'Done'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : t.progress === 'Very Urgent'
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                        : t.progress === 'Doing'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {t.progress}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Progress completion bar */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold">
              <span className="text-slate-500">
                Penyelesaian Tugas: {completedCount} dari {tasks.length}
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">{percentComplete}% Selesai</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-500"
                style={{ width: `${percentComplete}%` }}
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Kalender Mini + Sticky Note Terbaru (6 cols) */}
        <div className="lg:col-span-6 space-y-6">
          {/* 4. MINI CALENDAR WIDGET */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-sm font-black text-slate-900 dark:text-white">
                {MONTH_NAMES_ID[currentMonth]} {currentYear}
              </span>
              <Link
                href="/calendar"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Buka Kalender Penuh</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Days header: Min, Sen, Sel, Rab, Kam, Jum, Sab */}
            <div className="grid grid-cols-7 text-center text-[10px] font-bold text-slate-400 mb-1">
              {DAYS_SHORT_ID.map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold">
              {calendarCells.map((day, idx) => {
                if (!day) {
                  return <div key={`empty-${idx}`} className="h-7 w-7" />;
                }
                const isSelected = day === selectedDay;
                const isToday =
                  day === today.getDate() &&
                  currentMonth === today.getMonth() &&
                  currentYear === today.getFullYear();

                return (
                  <button
                    key={day}
                    onClick={() => setSelectedDay(day)}
                    className={`h-7 w-7 mx-auto rounded-xl flex items-center justify-center text-xs transition ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-black shadow-xs ring-2 ring-emerald-200'
                        : isToday
                        ? 'border border-emerald-500 text-emerald-600 font-black'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 5. STICKY NOTE TERBARU */}
          <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 text-sm font-black text-slate-900 dark:text-white">
                <StickyIcon className="h-4 w-4 text-amber-500" />
                <span>Sticky Notes Paling Baru</span>
              </div>
              <Link
                href="/sticky"
                className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Lihat Semua ({stickies.length})</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            {/* Grid of Latest Sticky Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {stickies.slice(0, 4).map((s) => {
                const colorStyles: Record<string, string> = {
                  amber: 'bg-amber-50/80 border-amber-200 text-amber-950 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-100',
                  emerald: 'bg-emerald-50/80 border-emerald-200 text-emerald-950 dark:bg-emerald-950/30 dark:border-emerald-800 dark:text-emerald-100',
                  sky: 'bg-sky-50/80 border-sky-200 text-sky-950 dark:bg-sky-950/30 dark:border-sky-800 dark:text-sky-100',
                  purple: 'bg-purple-50/80 border-purple-200 text-purple-950 dark:bg-purple-950/30 dark:border-purple-800 dark:text-purple-100',
                  rose: 'bg-rose-50/80 border-rose-200 text-rose-950 dark:bg-rose-950/30 dark:border-rose-800 dark:text-rose-100',
                  orange: 'bg-orange-50/80 border-orange-200 text-orange-950 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-100',
                };
                const cardCls = colorStyles[s.color] || colorStyles.amber;

                return (
                  <div
                    key={s.id}
                    className={`rounded-2xl p-4 border flex flex-col justify-between shadow-2xs transition hover:scale-[1.01] ${cardCls}`}
                  >
                    <div>
                      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-black/5 dark:border-white/5">
                        <span className="text-[10px] font-black uppercase tracking-wider opacity-70">
                          {s.area || 'Personal'}
                        </span>
                        <span className="text-[9px] font-semibold opacity-60">
                          {formatIndonesianDate(s.date)}
                        </span>
                      </div>
                      <h4 className="text-xs font-black truncate">{s.title}</h4>
                      <p className="mt-1 text-[11px] opacity-80 line-clamp-3 leading-relaxed">
                        {s.content}
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/5 flex items-center justify-between text-[10px]">
                      <span className="font-bold opacity-75">
                        Status: {s.status}
                      </span>
                      <Link
                        href="/sticky"
                        className="font-bold underline hover:opacity-100 opacity-70 flex items-center gap-0.5"
                      >
                        <span>Buka</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
