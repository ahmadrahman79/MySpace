// Shared activities system across all modules (Tasks, Notes, Calendar, Sticky Notes)

export const DEFAULT_ACTIVITIES = [
  'Administrasi',
  'Dasar',
  'DLS',
  'DTSEN',
  'GC PBI',
  'Humas',
  'Latsar',
  'Podes',
  'Polkam',
  'Sakernas',
  'SE2026',
  'Sektoral',
  'Sensus Ekonomi',
  'Seruti Tw 2 & Tw 4',
  'SNLIK',
  'Supas',
  'Susenas-Seruti',
  'Tambahan',
  'Umum',
  'ZI'
];

const LOCAL_STORAGE_KEY = 'myspace_custom_activities';

export function getStoredActivities(): string[] {
  if (typeof window === 'undefined') return DEFAULT_ACTIVITIES;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return DEFAULT_ACTIVITIES;
    const custom = JSON.parse(raw);
    const combined = Array.from(new Set([...DEFAULT_ACTIVITIES, ...(Array.isArray(custom) ? custom : [])]));
    return combined.sort();
  } catch {
    return DEFAULT_ACTIVITIES;
  }
}

export function addCustomActivity(newActivity: string): string[] {
  const trimmed = newActivity.trim();
  if (!trimmed) return getStoredActivities();
  if (typeof window === 'undefined') return DEFAULT_ACTIVITIES;

  try {
    const current = getStoredActivities();
    if (!current.includes(trimmed)) {
      const updated = [...current, trimmed].sort();
      const customOnly = updated.filter(a => !DEFAULT_ACTIVITIES.includes(a));
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(customOnly));
      // Dispatch event to inform other open views/components
      window.dispatchEvent(new CustomEvent('activities-updated', { detail: updated }));
      return updated;
    }
    return current;
  } catch {
    return DEFAULT_ACTIVITIES;
  }
}
