export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  category?: string;
  tags: string[];
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  dueDate?: string;
  category?: string;
  tags?: string[];
}
