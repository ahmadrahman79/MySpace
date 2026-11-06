import fs from 'fs';
import path from 'path';
import { Task, StickyNote, CalendarEvent, NoteItem, ResourceItem, DashboardStats } from '../types';

interface StoreData {
  tasks: Task[];
  events: CalendarEvent[];
  notes: NoteItem[];
  stickyNotes: StickyNote[];
  resources: ResourceItem[];
}

const dataDir = path.join(process.cwd(), 'data');
const runtimeFile = path.join(dataDir, 'runtime-data.json');
const seedFile = path.join(dataDir, 'seed-data.json');

function initData(): StoreData {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (fs.existsSync(runtimeFile)) {
    try {
      const content = fs.readFileSync(runtimeFile, 'utf8');
      return JSON.parse(content);
    } catch (e) {
      console.error('Error reading runtime-data.json, falling back to seed:', e);
    }
  }

  if (fs.existsSync(seedFile)) {
    try {
      const content = fs.readFileSync(seedFile, 'utf8');
      const data = JSON.parse(content);
      fs.writeFileSync(runtimeFile, JSON.stringify(data, null, 2), 'utf8');
      return data;
    } catch (e) {
      console.error('Error reading seed-data.json:', e);
    }
  }

  return {
    tasks: [],
    events: [],
    notes: [],
    stickyNotes: [],
    resources: [],
  };
}

let cachedData: StoreData | null = null;

function getData(): StoreData {
  if (!cachedData) {
    cachedData = initData();
  }
  return cachedData;
}

function saveData(): void {
  if (cachedData) {
    try {
      fs.writeFileSync(runtimeFile, JSON.stringify(cachedData, null, 2), 'utf8');
    } catch (e) {
      console.error('Failed to write runtime data:', e);
    }
  }
}

export const localDb = {
  // Tasks
  async getTasks(): Promise<Task[]> {
    return getData().tasks;
  },

  async getTaskById(id: string): Promise<Task | null> {
    return getData().tasks.find((t) => t.id === id) || null;
  },

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const data = getData();
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.tasks.unshift(newTask);
    saveData();
    return newTask;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const data = getData();
    const index = data.tasks.findIndex((t) => t.id === id);
    if (index === -1) return null;

    data.tasks[index] = {
      ...data.tasks[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveData();
    return data.tasks[index];
  },

  async deleteTask(id: string): Promise<boolean> {
    const data = getData();
    const lenBefore = data.tasks.length;
    data.tasks = data.tasks.filter((t) => t.id !== id);
    if (data.tasks.length !== lenBefore) {
      saveData();
      return true;
    }
    return false;
  },

  // Sticky Notes
  async getStickyNotes(): Promise<StickyNote[]> {
    return getData().stickyNotes;
  },

  async getStickyNoteById(id: string): Promise<StickyNote | null> {
    return getData().stickyNotes.find((s) => s.id === id) || null;
  },

  async createStickyNote(note: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<StickyNote> {
    const data = getData();
    const newNote: StickyNote = {
      ...note,
      id: `sticky-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.stickyNotes.unshift(newNote);
    saveData();
    return newNote;
  },

  async updateStickyNote(id: string, updates: Partial<StickyNote>): Promise<StickyNote | null> {
    const data = getData();
    const index = data.stickyNotes.findIndex((s) => s.id === id);
    if (index === -1) return null;

    data.stickyNotes[index] = {
      ...data.stickyNotes[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveData();
    return data.stickyNotes[index];
  },

  async deleteStickyNote(id: string): Promise<boolean> {
    const data = getData();
    const lenBefore = data.stickyNotes.length;
    data.stickyNotes = data.stickyNotes.filter((s) => s.id !== id);
    if (data.stickyNotes.length !== lenBefore) {
      saveData();
      return true;
    }
    return false;
  },

  // Workflow 2: Convert Sticky Note to Task
  async convertStickyToTask(stickyId: string, activity = 'Administrasi'): Promise<{ task: Task; sticky: StickyNote } | null> {
    const data = getData();
    const sticky = data.stickyNotes.find((s) => s.id === stickyId);
    if (!sticky) return null;

    // Check if already converted to avoid duplicate creation
    if (sticky.convertedToTaskId) {
      const existingTask = data.tasks.find((t) => t.id === sticky.convertedToTaskId);
      if (existingTask) {
        return { task: existingTask, sticky };
      }
    }

    // Map Area to Activity if possible
    let taskActivity = activity;
    if (sticky.area === 'Business') taskActivity = 'Administrasi';
    else if (sticky.area === 'Personal') taskActivity = 'Dasar';
    else if (sticky.area === 'Side Hustle') taskActivity = 'Tambahan';

    const priorityMap = {
      High: 'High' as const,
      Medium: 'Medium' as const,
      Low: 'Low' as const,
    };

    const newTask: Task = {
      id: `task-from-${sticky.id}`,
      name: sticky.title,
      activity: taskActivity,
      progress: 'Not Started',
      finishAt: sticky.date,
      finishAtRaw: sticky.date || '',
      statusKipApp: 'Pending',
      note: sticky.content || '',
      priority: priorityMap[sticky.priority] || 'Medium',
      imageUrls: [...sticky.imageUrls],
      linkUrls: [...sticky.linkUrls],
      originStickyNoteId: sticky.id,
      eventId: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    data.tasks.unshift(newTask);
    sticky.convertedToTaskId = newTask.id;
    sticky.updatedAt = new Date().toISOString();

    saveData();
    return { task: newTask, sticky };
  },

  // Calendar Events
  async getEvents(): Promise<CalendarEvent[]> {
    return getData().events;
  },

  async createEvent(event: Omit<CalendarEvent, 'id'>): Promise<CalendarEvent> {
    const data = getData();
    const newEvent: CalendarEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    data.events.push(newEvent);
    saveData();
    return newEvent;
  },

  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent | null> {
    const data = getData();
    const index = data.events.findIndex((e) => e.id === id);
    if (index === -1) return null;

    data.events[index] = {
      ...data.events[index],
      ...updates,
    };
    saveData();
    return data.events[index];
  },

  async deleteEvent(id: string): Promise<boolean> {
    const data = getData();
    const lenBefore = data.events.length;
    data.events = data.events.filter((e) => e.id !== id);
    if (data.events.length !== lenBefore) {
      saveData();
      return true;
    }
    return false;
  },

  // Notes🤓
  async getNotes(): Promise<NoteItem[]> {
    return getData().notes;
  },

  async getNoteById(id: string): Promise<NoteItem | null> {
    return getData().notes.find((n) => n.id === id) || null;
  },

  async createNote(note: Omit<NoteItem, 'id' | 'createdAt' | 'lastEditedTime'>): Promise<NoteItem> {
    const data = getData();
    const now = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const newNote: NoteItem = {
      ...note,
      id: `note-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: now,
      lastEditedTime: now,
    };
    data.notes.unshift(newNote);
    saveData();
    return newNote;
  },

  async updateNote(id: string, updates: Partial<NoteItem>): Promise<NoteItem | null> {
    const data = getData();
    const index = data.notes.findIndex((n) => n.id === id);
    if (index === -1) return null;

    const now = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    data.notes[index] = {
      ...data.notes[index],
      ...updates,
      lastEditedTime: now,
    };
    saveData();
    return data.notes[index];
  },

  async deleteNote(id: string): Promise<boolean> {
    const data = getData();
    const lenBefore = data.notes.length;
    data.notes = data.notes.filter((n) => n.id !== id);
    if (data.notes.length !== lenBefore) {
      saveData();
      return true;
    }
    return false;
  },

  // Resources (Links & Media)
  async getResources(): Promise<ResourceItem[]> {
    return getData().resources;
  },

  async createResource(res: Omit<ResourceItem, 'id' | 'createdAt'>): Promise<ResourceItem> {
    const data = getData();
    const newRes: ResourceItem = {
      ...res,
      id: `res-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    data.resources.unshift(newRes);
    saveData();
    return newRes;
  },

  async deleteResource(id: string): Promise<boolean> {
    const data = getData();
    const lenBefore = data.resources.length;
    data.resources = data.resources.filter((r) => r.id !== id);
    if (data.resources.length !== lenBefore) {
      saveData();
      return true;
    }
    return false;
  },

  // Dashboard Stats
  async getStats(): Promise<DashboardStats> {
    const data = getData();
    const todayStr = new Date().toISOString().split('T')[0];

    const totalTasks = data.tasks.length;
    const doneTasks = data.tasks.filter((t) => t.progress === 'Done').length;
    const doingTasks = data.tasks.filter((t) => t.progress === 'Doing').length;
    const urgentTasks = data.tasks.filter((t) => t.progress === 'Very Urgent' || t.priority === 'High').length;
    
    // Overdue tasks: Not done, and finishAt is in the past
    const overdueTasks = data.tasks.filter((t) => {
      if (t.progress === 'Done' || !t.finishAt) return false;
      return t.finishAt < todayStr;
    }).length;

    // Due today
    const tasksDueToday = data.tasks.filter((t) => t.finishAt === todayStr).length;

    // Events today
    const eventsToday = data.events.filter((e) => {
      if (!e.startDate) return false;
      if (e.isRange && e.endDate) {
        return e.startDate <= todayStr && todayStr <= e.endDate;
      }
      return e.startDate === todayStr;
    }).length;

    const activeStickyNotes = data.stickyNotes.filter((s) => !s.completed && !s.convertedToTaskId).length;
    const totalNotes = data.notes.length;
    const totalResources = data.resources.length;

    return {
      totalTasks,
      doneTasks,
      doingTasks,
      urgentTasks,
      overdueTasks,
      tasksDueToday,
      eventsToday,
      activeStickyNotes,
      totalNotes,
      totalResources,
    };
  },
};

