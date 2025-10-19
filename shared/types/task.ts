// shared/types/task.ts
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
  dueDate?: Date;
  categoryId?: string;
  tags: string[];
  isRecurring: boolean;
  recurrenceRule?: RecurrenceRule;
  reminder?: Date;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: Date;
  count?: number;
}