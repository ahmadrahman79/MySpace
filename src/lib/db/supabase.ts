import { createClient } from '@supabase/supabase-js';
import { Task, StickyNote, CalendarEvent, NoteItem, ResourceItem, DashboardStats } from '../types';
import { localDb } from './local';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl.startsWith('https://') &&
  !supabaseUrl.includes('your-project')
);

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const supabaseDb = {
  async getTasks(): Promise<Task[]> {
    if (!supabase) return localDb.getTasks();
    const { data, error } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Supabase getTasks error:', error);
      return localDb.getTasks();
    }
    return data.map(mapDbTask);
  },

  async getTaskById(id: string): Promise<Task | null> {
    if (!supabase) return localDb.getTaskById(id);
    const { data, error } = await supabase.from('tasks').select('*').eq('id', id).single();
    if (error || !data) return null;
    return mapDbTask(data);
  },

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    if (!supabase) return localDb.createTask(task);
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          name: task.name,
          activity: task.activity,
          progress: task.progress,
          finish_at: task.finishAt,
          finish_at_raw: task.finishAtRaw,
          status_kipapp: task.statusKipApp,
          note: task.note,
          priority: task.priority,
          image_urls: task.imageUrls,
          link_urls: task.linkUrls,
          origin_sticky_note_id: task.originStickyNoteId,
          event_id: task.eventId,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase createTask error:', error);
      return localDb.createTask(task);
    }
    return mapDbTask(data);
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    if (!supabase) return localDb.updateTask(id, updates);
    const payload: Record<string, any> = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.activity !== undefined) payload.activity = updates.activity;
    if (updates.progress !== undefined) payload.progress = updates.progress;
    if (updates.finishAt !== undefined) payload.finish_at = updates.finishAt;
    if (updates.statusKipApp !== undefined) payload.status_kipapp = updates.statusKipApp;
    if (updates.note !== undefined) payload.note = updates.note;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.imageUrls !== undefined) payload.image_urls = updates.imageUrls;
    if (updates.linkUrls !== undefined) payload.link_urls = updates.linkUrls;

    const { data, error } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase updateTask error:', error);
      return localDb.updateTask(id, updates);
    }
    return mapDbTask(data);
  },

  async deleteTask(id: string): Promise<boolean> {
    if (!supabase) return localDb.deleteTask(id);
    const { error } = await supabase.from('tasks').delete().eq('id', id);
    if (error) {
      console.error('Supabase deleteTask error:', error);
      return localDb.deleteTask(id);
    }
    return true;
  },

  async getStickyNotes(): Promise<StickyNote[]> {
    if (!supabase) return localDb.getStickyNotes();
    const { data, error } = await supabase.from('sticky_notes').select('*').order('created_at', { ascending: false });
    if (error) {
      console.error('Supabase getStickyNotes error:', error);
      return localDb.getStickyNotes();
    }
    return data.map(mapDbSticky);
  },

  async getStickyNoteById(id: string): Promise<StickyNote | null> {
    if (!supabase) return localDb.getStickyNoteById(id);
    const { data, error } = await supabase.from('sticky_notes').select('*').eq('id', id).single();
    if (error || !data) return null;
    return mapDbSticky(data);
  },

  async createStickyNote(note: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<StickyNote> {
    if (!supabase) return localDb.createStickyNote(note);
    const { data, error } = await supabase
      .from('sticky_notes')
      .insert([
        {
          title: note.title,
          content: note.content,
          area: note.area,
          priority: note.priority,
          status: note.status,
          date: note.date,
          completed: note.completed,
          color: note.color,
          converted_to_task_id: note.convertedToTaskId,
          image_urls: note.imageUrls,
          link_urls: note.linkUrls,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Supabase createStickyNote error:', error);
      return localDb.createStickyNote(note);
    }
    return mapDbSticky(data);
  },

  async updateStickyNote(id: string, updates: Partial<StickyNote>): Promise<StickyNote | null> {
    if (!supabase) return localDb.updateStickyNote(id, updates);
    const payload: Record<string, any> = {};
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.area !== undefined) payload.area = updates.area;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.date !== undefined) payload.date = updates.date;
    if (updates.completed !== undefined) payload.completed = updates.completed;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.convertedToTaskId !== undefined) payload.converted_to_task_id = updates.convertedToTaskId;

    const { data, error } = await supabase
      .from('sticky_notes')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase updateStickyNote error:', error);
      return localDb.updateStickyNote(id, updates);
    }
    return mapDbSticky(data);
  },

  async deleteStickyNote(id: string): Promise<boolean> {
    if (!supabase) return localDb.deleteStickyNote(id);
    const { error } = await supabase.from('sticky_notes').delete().eq('id', id);
    if (error) {
      console.error('Supabase deleteStickyNote error:', error);
      return localDb.deleteStickyNote(id);
    }
    return true;
  },

  async convertStickyToTask(stickyId: string, activity = 'Administrasi') {
    return localDb.convertStickyToTask(stickyId, activity);
  },

  async getEvents(): Promise<CalendarEvent[]> {
    if (!supabase) return localDb.getEvents();
    const { data, error } = await supabase.from('events').select('*');
    if (error) {
      console.error('Supabase getEvents error:', error);
      return localDb.getEvents();
    }
    return data.map(mapDbEvent);
  },

  async createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    return localDb.createEvent(event);
  },

  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    return localDb.updateEvent(id, updates);
  },

  async deleteEvent(id: string): Promise<boolean> {
    return localDb.deleteEvent(id);
  },

  async getNotes(): Promise<NoteItem[]> {
    if (!supabase) return localDb.getNotes();
    const { data, error } = await supabase.from('notes').select('*');
    if (error) {
      console.error('Supabase getNotes error:', error);
      return localDb.getNotes();
    }
    return data.map(mapDbNote);
  },

  async getNoteById(id: string): Promise<NoteItem | null> {
    return localDb.getNoteById(id);
  },

  async createNote(note: Omit<NoteItem, 'id' | 'createdAt' | 'lastEditedTime'>): Promise<NoteItem> {
    return localDb.createNote(note);
  },

  async updateNote(id: string, updates: Partial<NoteItem>): Promise<NoteItem | null> {
    return localDb.updateNote(id, updates);
  },

  async deleteNote(id: string): Promise<boolean> {
    return localDb.deleteNote(id);
  },

  async getResources(): Promise<ResourceItem[]> {
    if (!supabase) return localDb.getResources();
    const { data, error } = await supabase.from('resources').select('*');
    if (error) {
      console.error('Supabase getResources error:', error);
      return localDb.getResources();
    }
    return data.map(mapDbResource);
  },

  async createResource(res: Omit<ResourceItem, 'id' | 'createdAt'>): Promise<ResourceItem> {
    return localDb.createResource(res);
  },

  async deleteResource(id: string): Promise<boolean> {
    return localDb.deleteResource(id);
  },

  async getStats(): Promise<DashboardStats> {
    return localDb.getStats();
  },
};

function mapDbTask(row: any): Task {
  return {
    id: String(row.id),
    name: row.name,
    activity: row.activity,
    progress: row.progress,
    finishAt: row.finish_at,
    finishAtRaw: row.finish_at_raw,
    statusKipApp: row.status_kipapp,
    note: row.note,
    priority: row.priority,
    imageUrls: row.image_urls || [],
    linkUrls: row.link_urls || [],
    originStickyNoteId: row.origin_sticky_note_id,
    eventId: row.event_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDbSticky(row: any): StickyNote {
  return {
    id: String(row.id),
    title: row.title,
    content: row.content,
    area: row.area,
    priority: row.priority,
    status: row.status,
    date: row.date,
    completed: row.completed,
    color: row.color,
    convertedToTaskId: row.converted_to_task_id,
    imageUrls: row.image_urls || [],
    linkUrls: row.link_urls || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDbEvent(row: any): CalendarEvent {
  return {
    id: String(row.id),
    title: row.title,
    activity: row.activity,
    startDate: row.start_date,
    endDate: row.end_date,
    dateRaw: row.date_raw,
    isRange: row.is_range,
    status: row.status,
    type: row.type,
    description: row.description,
    imageUrls: row.image_urls || [],
    linkUrls: row.link_urls || [],
    associatedTaskIds: row.associated_task_ids || [],
  };
}

function mapDbNote(row: any): NoteItem {
  return {
    id: String(row.id),
    title: row.title,
    activity: row.activity,
    createdAt: row.created_at,
    createdBy: row.created_by,
    lastEditedTime: row.last_edited_time,
    content: row.content,
    images: row.images || [],
    links: row.links || [],
    associatedTaskIds: row.associated_task_ids || [],
  };
}

function mapDbResource(row: any): ResourceItem {
  return {
    id: String(row.id),
    title: row.title,
    url: row.url,
    category: row.category,
    description: row.description,
    tags: row.tags || [],
    type: row.type || 'link',
    createdAt: row.created_at,
  };
}
