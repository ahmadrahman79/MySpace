export type TaskProgress =
  | 'Very Urgent'
  | 'Not Started'
  | 'Doing'
  | 'Waiting on External'
  | 'Done';

export type KipAppStatus = 'Pending' | 'Not Add' | 'Added';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type StickyArea = 'Personal' | 'Family' | 'Business' | 'Side Hustle';

export type StickyPriority = 'Low' | 'Medium' | 'High';

export type StickyStatus = 'Not started' | 'In progress' | 'Done';

export interface Task {
  id: string;
  name: string;
  activity: string;
  progress: TaskProgress;
  finishAt: string | null; // ISO YYYY-MM-DD
  finishAtRaw?: string;
  statusKipApp: KipAppStatus;
  note: string;
  priority: TaskPriority;
  imageUrls: string[];
  linkUrls: string[];
  originStickyNoteId: string | null;
  eventId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StickyNote {
  id: string;
  title: string;
  content: string;
  area: StickyArea;
  priority: StickyPriority;
  status: StickyStatus;
  date: string | null; // ISO YYYY-MM-DD
  completed: boolean;
  color: 'amber' | 'emerald' | 'sky' | 'purple' | 'rose' | 'orange';
  convertedToTaskId: string | null;
  imageUrls: string[];
  linkUrls: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  activity: string;
  startDate: string | null; // ISO YYYY-MM-DD
  endDate: string | null;   // ISO YYYY-MM-DD
  dateRaw?: string;
  isRange: boolean;
  status: 'Completed' | 'Not Started' | 'In Progress';
  type: 'event' | 'holiday' | 'leave';
  description?: string;
  imageUrls?: string[];
  linkUrls?: string[];
  associatedTaskIds?: string[];
}

export interface NoteImage {
  name: string;
  url: string;
}

export interface NoteLink {
  title: string;
  url: string;
}

export interface NoteItem {
  id: string;
  title: string;
  activity: string;
  createdAt: string;
  createdBy: string;
  lastEditedTime: string;
  content: string;
  images: NoteImage[];
  links: NoteLink[];
  associatedTaskIds?: string[];
}

export interface ResourceItem {
  id: string;
  title: string;
  url: string;
  category: string;
  description: string;
  tags: string[];
  type?: 'link' | 'image';
  createdAt: string;
}

export interface DashboardStats {
  totalTasks: number;
  doneTasks: number;
  doingTasks: number;
  urgentTasks: number;
  overdueTasks: number;
  tasksDueToday: number;
  eventsToday: number;
  activeStickyNotes: number;
  totalNotes: number;
  totalResources: number;
}

