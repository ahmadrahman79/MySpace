import { MongoClient, Db } from 'mongodb';
import { Task, StickyNote, CalendarEvent, NoteItem, ResourceItem, DashboardStats } from '../types';
import { localDb } from './local';

const mongoUri = process.env.MONGODB_URI || '';
export const isMongoConfigured = Boolean(
  mongoUri &&
  mongoUri.startsWith('mongodb') &&
  !mongoUri.includes('username:password')
);

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

async function getMongoDb(): Promise<Db | null> {
  if (!isMongoConfigured) return null;
  if (cachedDb) return cachedDb;

  try {
    cachedClient = new MongoClient(mongoUri);
    await cachedClient.connect();
    cachedDb = cachedClient.db('productivity_system');
    return cachedDb;
  } catch (e) {
    console.error('Failed to connect to MongoDB Atlas:', e);
    return null;
  }
}

export const mongoDb = {
  async getTasks(): Promise<Task[]> {
    const db = await getMongoDb();
    if (!db) return localDb.getTasks();
    const docs = await db.collection('tasks').find({}).sort({ createdAt: -1 }).toArray();
    return docs.map(mapMongoDoc) as unknown as Task[];
  },

  async getTaskById(id: string): Promise<Task | null> {
    const db = await getMongoDb();
    if (!db) return localDb.getTaskById(id);
    const doc = await db.collection('tasks').findOne({ _id: id as any });
    if (!doc) return null;
    return mapMongoDoc(doc) as unknown as Task;
  },

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const db = await getMongoDb();
    if (!db) return localDb.createTask(task);
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.collection('tasks').insertOne({ ...newTask, _id: newTask.id as any });
    return newTask;
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task | null> {
    const db = await getMongoDb();
    if (!db) return localDb.updateTask(id, updates);
    const res = await db.collection('tasks').findOneAndUpdate(
      { _id: id as any },
      { $set: { ...updates, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    if (!res) return null;
    return mapMongoDoc(res) as unknown as Task;
  },

  async deleteTask(id: string): Promise<boolean> {
    const db = await getMongoDb();
    if (!db) return localDb.deleteTask(id);
    const res = await db.collection('tasks').deleteOne({ _id: id as any });
    return res.deletedCount > 0;
  },

  async getStickyNotes(): Promise<StickyNote[]> {
    const db = await getMongoDb();
    if (!db) return localDb.getStickyNotes();
    const docs = await db.collection('sticky_notes').find({}).sort({ createdAt: -1 }).toArray();
    return docs.map(mapMongoDoc) as unknown as StickyNote[];
  },

  async getStickyNoteById(id: string): Promise<StickyNote | null> {
    const db = await getMongoDb();
    if (!db) return localDb.getStickyNoteById(id);
    const doc = await db.collection('sticky_notes').findOne({ _id: id as any });
    if (!doc) return null;
    return mapMongoDoc(doc) as unknown as StickyNote;
  },

  async createStickyNote(note: Omit<StickyNote, 'id' | 'createdAt' | 'updatedAt'>): Promise<StickyNote> {
    const db = await getMongoDb();
    if (!db) return localDb.createStickyNote(note);
    const newNote: StickyNote = {
      ...note,
      id: `sticky-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await db.collection('sticky_notes').insertOne({ ...newNote, _id: newNote.id as any });
    return newNote;
  },

  async updateStickyNote(id: string, updates: Partial<StickyNote>): Promise<StickyNote | null> {
    const db = await getMongoDb();
    if (!db) return localDb.updateStickyNote(id, updates);
    const res = await db.collection('sticky_notes').findOneAndUpdate(
      { _id: id as any },
      { $set: { ...updates, updatedAt: new Date().toISOString() } },
      { returnDocument: 'after' }
    );
    if (!res) return null;
    return mapMongoDoc(res) as unknown as StickyNote;
  },

  async deleteStickyNote(id: string): Promise<boolean> {
    const db = await getMongoDb();
    if (!db) return localDb.deleteStickyNote(id);
    const res = await db.collection('sticky_notes').deleteOne({ _id: id as any });
    return res.deletedCount > 0;
  },

  async convertStickyToTask(stickyId: string, activity = 'Administrasi') {
    return localDb.convertStickyToTask(stickyId, activity);
  },

  async getEvents(): Promise<CalendarEvent[]> {
    const db = await getMongoDb();
    if (!db) return localDb.getEvents();
    const docs = await db.collection('events').find({}).toArray();
    return docs.map(mapMongoDoc) as unknown as CalendarEvent[];
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
    const db = await getMongoDb();
    if (!db) return localDb.getNotes();
    const docs = await db.collection('notes').find({}).toArray();
    return docs.map(mapMongoDoc) as unknown as NoteItem[];
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
    const db = await getMongoDb();
    if (!db) return localDb.getResources();
    const docs = await db.collection('resources').find({}).toArray();
    return docs.map(mapMongoDoc) as unknown as ResourceItem[];
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

function mapMongoDoc(doc: any) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return { id: String(_id || rest.id), ...rest };
}
