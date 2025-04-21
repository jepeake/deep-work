// Types
export type LocalWorkType = {
  id: string;
  label: string;
};

export type LocalStudySession = {
  id: string;
  date: string;
  duration: number;
  workTypeId: string;
};

export type LocalTask = {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string | null;
  createdAt: string;
  workTypeId: string;
};

// Helper to generate unique IDs
export const generateId = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Work Types
export const getLocalWorkTypes = (): LocalWorkType[] => {
  if (typeof window === 'undefined') return [];
  const workTypes = localStorage.getItem('workTypes');
  return workTypes ? JSON.parse(workTypes) : [];
};

export const saveLocalWorkType = (label: string): LocalWorkType => {
  if (typeof window === 'undefined') throw new Error('Cannot access localStorage on server');
  
  const workTypes = getLocalWorkTypes();
  
  // Check if work type already exists
  const existingType = workTypes.find(wt => wt.label.toLowerCase() === label.toLowerCase());
  if (existingType) return existingType;
  
  // Create new work type
  const newWorkType: LocalWorkType = {
    id: generateId(),
    label,
  };
  
  workTypes.push(newWorkType);
  localStorage.setItem('workTypes', JSON.stringify(workTypes));
  
  return newWorkType;
};

export const removeLocalWorkType = (id: string): void => {
  if (typeof window === 'undefined') return;
  
  const workTypes = getLocalWorkTypes();
  const updatedWorkTypes = workTypes.filter(wt => wt.id !== id);
  localStorage.setItem('workTypes', JSON.stringify(updatedWorkTypes));
};

// Study Sessions
export const getLocalStudySessions = (): LocalStudySession[] => {
  if (typeof window === 'undefined') return [];
  const sessions = localStorage.getItem('studySessions');
  return sessions ? JSON.parse(sessions) : [];
};

export const saveLocalStudySession = (session: Omit<LocalStudySession, 'id'>): LocalStudySession => {
  if (typeof window === 'undefined') throw new Error('Cannot access localStorage on server');
  
  const sessions = getLocalStudySessions();
  const newSession: LocalStudySession = {
    ...session,
    id: generateId(),
  };
  
  sessions.push(newSession);
  localStorage.setItem('studySessions', JSON.stringify(sessions));
  
  return newSession;
};

// Tasks
export const getLocalTasks = (): LocalTask[] => {
  if (typeof window === 'undefined') return [];
  const tasks = localStorage.getItem('tasks');
  return tasks ? JSON.parse(tasks) : [];
};

export const saveLocalTask = (task: Omit<LocalTask, 'id' | 'createdAt'>): LocalTask => {
  if (typeof window === 'undefined') throw new Error('Cannot access localStorage on server');
  
  const tasks = getLocalTasks();
  const newTask: LocalTask = {
    ...task,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  
  tasks.push(newTask);
  localStorage.setItem('tasks', JSON.stringify(tasks));
  
  return newTask;
};

export const updateLocalTask = (id: string, updates: Partial<Omit<LocalTask, 'id' | 'createdAt'>>): LocalTask | null => {
  if (typeof window === 'undefined') return null;
  
  const tasks = getLocalTasks();
  const taskIndex = tasks.findIndex(t => t.id === id);
  
  if (taskIndex === -1) return null;
  
  const updatedTask = {
    ...tasks[taskIndex],
    ...updates,
  };
  
  tasks[taskIndex] = updatedTask;
  localStorage.setItem('tasks', JSON.stringify(tasks));
  
  return updatedTask;
};

export const removeLocalTask = (id: string): void => {
  if (typeof window === 'undefined') return;
  
  const tasks = getLocalTasks();
  const updatedTasks = tasks.filter(t => t.id !== id);
  localStorage.setItem('tasks', JSON.stringify(updatedTasks));
}; 