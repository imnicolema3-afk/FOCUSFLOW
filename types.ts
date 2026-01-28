
export enum TaskStatus {
  TODO = 'todo',
  DONE = 'done',
  MIGRATED = 'migrated'
}

export type TaskCategory = 'General' | 'Work' | 'School';

export interface Task {
  id: string;
  text: string;
  status: TaskStatus;
  date: string; // ISO string YYYY-MM-DD
  category: TaskCategory;
  xpAwarded: boolean;
  notes?: string;
  subtasks?: { id: string; text: string; completed: boolean }[];
}

export interface Event {
  id: string;
  title: string;
  time: string;
  date: string;
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  type: 'income' | 'expense';
  date: string;
  category?: string;
  notes?: string;
}

export interface BrainDump {
  id: string;
  content: string;
  timestamp: number;
}

export interface Reminder {
  id: string;
  text: string;
  completed: boolean;
  dueDate?: string; // Optional YYYY-MM-DD
}

export interface JournalEntry {
  date: string; // YYYY-MM-DD
  grateful: string[];
  thoughts: string;
}

export interface Birthday {
  id: string;
  name: string;
  date: string; // MM-DD
}

export interface UserStats {
  xp: number;
  level: number;
  streak: number;
  lastActive: string;
}

export type View = 'home' | 'trackers' | 'lists' | 'work' | 'school' | 'me';
