import { localDb } from './local';
import { supabaseDb, isSupabaseConfigured } from './supabase';
import { mongoDb, isMongoConfigured } from './mongo';
import { Task, StickyNote, CalendarEvent, NoteItem, ResourceItem, DashboardStats } from '../types';

export interface DatabaseAdapter {
  getTasks(): Promise<Task[]>;
  getTaskById(id: string): Promise<Task | null>;
  createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task | null>;
  deleteTask(id: string): Promise<boolean>;

  getStickyNotes(): Promise<StickyNote[]>;
  getStickyNoteById(id: string): Promise<StickyNote | null>;
  createStickyNote(note: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<StickyNote>;
  updateStickyNote(id: string, updates: Partial<StickyNote>): Promise<StickyNote | null>;
  deleteStickyNote(id: string): Promise<boolean>;
  convertStickyToTask(stickyId: string, activity?: string): Promise<{ task: Task; sticky: StickyNote } | null>;

  getEvents(): Promise<CalendarEvent[]>;
  createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent>;
  updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null>;
  deleteEvent(id: string): Promise<boolean>;

  getNotes(): Promise<NoteItem[]>;
  getNoteById(id: string): Promise<NoteItem | null>;
  createNote(note: Omit<NoteItem, 'id' | 'createdAt' | 'lastEditedTime'>): Promise<NoteItem>;
  updateNote(id: string, updates: Partial<NoteItem>): Promise<NoteItem | null>;
  deleteNote(id: string): Promise<boolean>;

  getResources(): Promise<ResourceItem[]>;
  createResource(res: Omit<ResourceItem, 'id' | 'createdAt'>): Promise<ResourceItem>;
  deleteResource(id: string): Promise<boolean>;

  getStats(): Promise<DashboardStats>;
}

export function getDatabase(): DatabaseAdapter {
  const dbType = (process.env.DATABASE_TYPE || '').toLowerCase();

  if (dbType === 'mongodb' && isMongoConfigured) {
    return mongoDb;
  }

  // If Supabase is configured or explicitly selected
  if (isSupabaseConfigured || dbType === 'supabase') {
    if (isSupabaseConfigured) {
      return supabaseDb;
    }
  }

  // Default to local storage (which uses seed-data.json / runtime-data.json)
  return localDb;
}

export const db: DatabaseAdapter = getDatabase();
export { localDb, supabaseDb, mongoDb };
