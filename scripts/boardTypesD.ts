// boardTypesD.ts
// Globale Typen für Board & Add-Task (nur Editor/TypeScript)

type TaskStatus   = 'todo' | 'inprogress' | 'awaitingfeedback' | 'done';
type TaskPriority = 'urgent' | 'medium' | 'low';

interface Subtask {
  title: string;
  done: boolean;
}

interface Task {
  id: string;
  title?: string;
  description?: string;
  category?: string;
  dueDate?: string;
  priority?: TaskPriority | null;
  status: TaskStatus;
  assignedTo?: string[] | string | null;
  subtasks?: Subtask[] | null;
  createdAt?: number | null;
}

interface Person { name?: string; email?: string }
type PersonMap = Record<string, Person>;
