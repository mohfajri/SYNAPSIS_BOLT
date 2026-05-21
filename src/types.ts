export interface User {
  id: string;
  username: string;
  name: string;
  nickname: string;
  password?: string;
  role: string;
  email: string;
  createdAt: string;
}

export interface Project {
  id: string;
  kode: string;
  nama: string;
  modul: string;
  pic: string;
  client: string;
  asal: string;
  status: string;
  startDate: string;
  endDate: string;
  completionDate: string;
  prasyarat: string;
  notes: string;
  url: string;
  createdAt: string;
}

export interface SubTask {
  id: string;
  title: string;
  done: boolean;
}

export interface Task {
  id: string;
  project: string; // project code e.g. 'P01'
  modul: string;
  task: string;
  taskType: string;
  categoryProgress: string;
  pic: string;
  priority: string;
  status: string;
  startDate: string;
  dueDate: string;
  progress: number;
  notes: string;
  url: string;
  subtasks: SubTask[];
  createdAt: string;
}

export interface CommLog {
  id: string;
  project: string;
  type: 'Email' | 'WhatsApp' | 'Rapat' | 'Telepon';
  date: string;
  participants: string;
  summary: string;
  detail: string;
}

export interface MeetingLog {
  id: string;
  project: string;
  date: string;
  title: string;
  attendees: string;
  agenda: string;
  decisions: string;
  actions: string;
}

export interface Documentation {
  id: string;
  project: string;
  category: 'API Specs' | 'User Manual' | 'Desain' | 'Kontrak' | 'Lainnya';
  title: string;
  url: string;
  desc: string;
  date: string;
}

export interface LogEntry {
  id: string;
  projId: string;
  type: 'kendala' | 'solusi' | 'fokus';
  date: string;
  text: string;
}
