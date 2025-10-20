import { create } from "zustand";
import { differenceInMinutes, format } from "date-fns";

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
  dueDate?: string;
  dueTime?: string;
  scheduledTime?: string;
  estimatedDuration?: number; // in minutes
  actualDuration?: number; // in minutes
  completionTime?: string;
  category?: string;
  tags: string[];
  isRecurring: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
  reminders: Reminder[];
  timeTrackers: TimeTracker[];
  extraTimeTaken?: number; // in minutes
  timeSaved?: number; // in minutes
  extraTimeRequests?: number; // track how many extra time requests
}

export interface Reminder {
  id: string;
  type:
    | "start"
    | "completion"
    | "overdue"
    | "progress-check"
    | "extra-time-complete";
  scheduledAt: string;
  sent: boolean;
  message: string;
}

export interface TimeTracker {
  action: "scheduled" | "started" | "completed" | "paused" | "extended";
  timestamp: string;
  note?: string;
  duration?: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "error" | "success";
  timestamp: string;
  taskId?: string;
  read: boolean;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  priority: "low" | "medium" | "high";
  dueDate?: string;
  dueTime?: string;
  scheduledTime?: string;
  estimatedDuration?: number;
  category?: string;
  tags?: string[];
}

interface TaskStore {
  tasks: Task[];
  notifications: AppNotification[];
  scheduledTimeouts: Map<string, NodeJS.Timeout>;
  addTask: (taskData: CreateTaskData) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  updateTaskStatus: (taskId: string, status: Task["status"]) => void;
  startTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  postponeTask: (taskId: string) => void;
  requestExtraTime: (taskId: string, extraMinutes: number) => void;
  addNotification: (
    title: string,
    message: string,
    type: "info" | "warning" | "error" | "success",
    taskId?: string
  ) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  showSystemNotification: (
    title: string,
    message: string,
    taskId?: string,
    actions?: boolean
  ) => void;
  scheduleTaskReminders: (
    taskId: string,
    scheduledTime: string,
    estimatedDuration?: number
  ) => void;
  cancelScheduledReminders: (taskId: string) => void;
  scheduleExtraTimeCompletionCheck: (
    taskId: string,
    extraMinutes: number
  ) => void;
}

// Mock initial data - Empty for user to add tasks
const initialTasks: Task[] = [];

// Enhanced System notification utility with precise timing
const showSystemNotification = (
  title: string,
  message: string,
  taskId?: string,
  actions: boolean = true
) => {
  if ("Notification" in window && Notification.permission === "granted") {
    const options: NotificationOptions = {
      body: message,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: taskId,
      requireInteraction: true,
      silent: false,
    };

    if (actions && taskId) {
      // @ts-ignore - actions are supported in some browsers
      options.actions = [
        {
          action: "start",
          title: "✅ Start Task",
        },
        {
          action: "postpone",
          title: "⏰ Later",
        },
      ];
    }

    const notification = new Notification(title, options);

    notification.onclick = (event) => {
      event.preventDefault();
      window.focus();

      if (taskId) {
        const { tasks, startTask, postponeTask } = useTaskStore.getState();
        const task = tasks.find((t) => t.id === taskId);

        if (task) {
          if (confirm(`"${task.title}"\n\nAre you starting this task now?`)) {
            startTask(taskId);
          } else {
            postponeTask(taskId);
          }
        }
      }

      notification.close();
    };

    setTimeout(() => {
      notification.close();
    }, 60000);

    playNotificationSound();
  }
};

// Play notification sound
const playNotificationSound = () => {
  try {
    // Try to use HTML5 audio for better compatibility
    const audio = new Audio(
      "data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA=="
    );
    audio.play().catch(() => {
      // Fallback to Web Audio API
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.5
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    });
  } catch (error) {
    console.log("Audio not supported");
  }
};

// Request notification permission
const requestNotificationPermission = async () => {
  if ("Notification" in window) {
    if (Notification.permission === "default") {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        console.log("Notification permission granted");
      }
    }
  }
};

// Initialize notification permission
requestNotificationPermission();

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: initialTasks,
  notifications: [],
  scheduledTimeouts: new Map(),

  addTask: (taskData: CreateTaskData) => {
    // Validate required fields
    if (!taskData.dueDate || !taskData.dueTime) {
      get().addNotification(
        "Validation Error",
        "Due date and time are required to create a task",
        "error"
      );
      return;
    }

    const taskId = Math.random().toString(36).substr(2, 9);
    const now = new Date().toISOString();

    // FIXED: Combine date and time for scheduledTime with proper local timezone handling
    let scheduledTime = "";
    if (taskData.dueDate && taskData.dueTime) {
      // Create date in local timezone without timezone conversion issues
      const localDate = new Date(`${taskData.dueDate}T${taskData.dueTime}`);
      scheduledTime = localDate.toISOString(); // This preserves the intended local time
    }

    const newTask: Task = {
      ...taskData,
      id: taskId,
      status: "todo",
      tags: taskData.tags || [],
      isRecurring: false,
      createdAt: now,
      updatedAt: now,
      userId: "1",
      reminders: [],
      timeTrackers: [
        {
          action: "scheduled",
          timestamp: now,
          note: scheduledTime
            ? `Scheduled for ${new Date(scheduledTime).toLocaleString()}`
            : "Task created",
        },
      ],
      scheduledTime, // This now contains the correct time
      extraTimeRequests: 0,
    };

    set((state) => ({
      tasks: [...state.tasks, newTask],
    }));

    // Schedule reminders if we have a scheduled time
    if (scheduledTime) {
      get().scheduleTaskReminders(
        taskId,
        scheduledTime,
        taskData.estimatedDuration
      );
    }

    get().addNotification(
      "Task Created",
      `"${taskData.title}" created successfully`,
      "success",
      taskId
    );
  },

  scheduleTaskReminders: (
    taskId: string,
    scheduledTime: string,
    estimatedDuration?: number
  ) => {
    const { cancelScheduledReminders } = get();

    // Cancel any existing reminders for this task
    cancelScheduledReminders(taskId);

    const scheduledDate = new Date(scheduledTime);
    const now = new Date();
    const timeUntilStart = scheduledDate.getTime() - now.getTime();

    console.log(
      `Scheduling task ${taskId} at ${scheduledTime}, time until start: ${timeUntilStart}ms`
    );

    // Schedule start notification with precise timing (5 seconds before to account for any delays)
    const startNotificationTime = Math.max(0, timeUntilStart - 5000);

    if (startNotificationTime > 0) {
      const timeoutId = setTimeout(() => {
        const {
          tasks,
          showSystemNotification: notify,
          addNotification,
        } = get();
        const task = tasks.find((t) => t.id === taskId);

        if (task && task.status === "todo") {
          console.log(
            "Showing precise start notification for task:",
            task.title
          );

          // Add to app notifications
          addNotification(
            "⏰ Time to Start Task",
            `"${task.title}" is scheduled to start now`,
            "warning",
            taskId
          );

          // Show system notification
          notify(
            "⏰ Time to Start Task",
            `"${task.title}" - Click to confirm start`,
            taskId,
            true
          );

          // Show browser alert if window is focused
          if (document.hasFocus()) {
            if (
              confirm(
                `⏰ TIME TO START TASK\n\n"${task.title}"\n\nAre you starting this task now?`
              )
            ) {
              get().startTask(taskId);
            } else {
              get().postponeTask(taskId);
            }
          }
        }
      }, startNotificationTime);

      // Store timeout ID for potential cancellation
      set((state) => ({
        scheduledTimeouts: new Map(state.scheduledTimeouts).set(
          `start-${taskId}`,
          timeoutId
        ),
      }));
    }

    // Schedule completion check if estimated duration is provided
    if (estimatedDuration) {
      const completionTime = new Date(
        scheduledDate.getTime() + estimatedDuration * 60000
      );
      const timeUntilCompletionCheck =
        completionTime.getTime() - now.getTime() - 5000; // 5 seconds before

      if (timeUntilCompletionCheck > 0) {
        const completionTimeoutId = setTimeout(() => {
          const { tasks, completeTask, addNotification } = get();
          const task = tasks.find((t) => t.id === taskId);

          if (task && task.status === "in-progress") {
            addNotification(
              "✅ Task Completion Check",
              `Is "${task.title}" completed? Estimated time is up.`,
              "info",
              taskId
            );

            get().showSystemNotification(
              "✅ Task Completion Check",
              `Is "${task.title}" completed?\nEstimated time is up.`,
              taskId,
              false
            );

            if (document.hasFocus()) {
              if (
                confirm(
                  `IS TASK COMPLETED?\n\n"${task.title}"\n\nEstimated time is up. Is this task completed?`
                )
              ) {
                completeTask(taskId);
              } else {
                const extraTime = prompt(
                  "How many more minutes do you need?",
                  "15"
                );
                if (extraTime && !isNaN(parseInt(extraTime))) {
                  get().requestExtraTime(taskId, parseInt(extraTime));
                }
              }
            }
          }
        }, timeUntilCompletionCheck);

        set((state) => ({
          scheduledTimeouts: new Map(state.scheduledTimeouts).set(
            `completion-${taskId}`,
            completionTimeoutId
          ),
        }));
      }
    }
  },

  scheduleExtraTimeCompletionCheck: (taskId: string, extraMinutes: number) => {
    const { cancelScheduledReminders } = get();

    // Cancel any existing extra time reminders for this task
    const extraTimeout = get().scheduledTimeouts.get(`extra-${taskId}`);
    if (extraTimeout) {
      clearTimeout(extraTimeout);
    }

    const timeUntilExtraTimeComplete = extraMinutes * 60000;

    if (timeUntilExtraTimeComplete > 0) {
      const extraTimeoutId = setTimeout(() => {
        const { tasks, completeTask, addNotification, showSystemNotification } =
          get();
        const task = tasks.find((t) => t.id === taskId);

        if (task && task.status === "in-progress") {
          console.log(`Extra time completed for task: ${task.title}`);

          // Add to app notifications
          addNotification(
            "⏰ Extra Time Completed",
            `Your extra time for "${task.title}" is up. Have you completed the task?`,
            "warning",
            taskId
          );

          // Show system notification
          showSystemNotification(
            "⏰ Extra Time Completed",
            `Your extra time for "${task.title}" is up. Click to check status.`,
            taskId,
            true
          );

          // Show browser alert if window is focused
          if (document.hasFocus()) {
            if (
              confirm(
                `EXTRA TIME COMPLETED\n\n"${task.title}"\n\nYour extra time is up. Have you completed this task?\n\nClick OK if completed, Cancel to request more time.`
              )
            ) {
              completeTask(taskId);
            } else {
              const moreTime = prompt(
                "How many more minutes do you need?",
                "10"
              );
              if (moreTime && !isNaN(parseInt(moreTime))) {
                get().requestExtraTime(taskId, parseInt(moreTime));
              }
            }
          }
        }
      }, timeUntilExtraTimeComplete);

      // Store timeout ID for potential cancellation
      set((state) => ({
        scheduledTimeouts: new Map(state.scheduledTimeouts).set(
          `extra-${taskId}`,
          extraTimeoutId
        ),
      }));
    }
  },

  cancelScheduledReminders: (taskId: string) => {
    const { scheduledTimeouts } = get();

    const startTimeout = scheduledTimeouts.get(`start-${taskId}`);
    const completionTimeout = scheduledTimeouts.get(`completion-${taskId}`);
    const extraTimeout = scheduledTimeouts.get(`extra-${taskId}`);

    if (startTimeout) {
      clearTimeout(startTimeout);
    }
    if (completionTimeout) {
      clearTimeout(completionTimeout);
    }
    if (extraTimeout) {
      clearTimeout(extraTimeout);
    }

    set((state) => {
      const newTimeouts = new Map(state.scheduledTimeouts);
      newTimeouts.delete(`start-${taskId}`);
      newTimeouts.delete(`completion-${taskId}`);
      newTimeouts.delete(`extra-${taskId}`);
      return { scheduledTimeouts: newTimeouts };
    });
  },

  updateTask: (taskId: string, updates: Partial<Task>) => {
    const { tasks } = get();
    const task = tasks.find((t) => t.id === taskId);

    // Prevent modification if task is in progress or completed
    if (
      task &&
      (task.status === "in-progress" || task.status === "completed")
    ) {
      get().addNotification(
        "Action Failed",
        "Cannot modify task while in progress or completed",
        "error"
      );
      return;
    }

    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...updates,
              updatedAt: new Date().toISOString(),
              timeTrackers: [
                ...task.timeTrackers,
                {
                  action: "scheduled",
                  timestamp: new Date().toISOString(),
                  note: updates.scheduledTime
                    ? `Rescheduled for ${new Date(
                        updates.scheduledTime
                      ).toLocaleString()}`
                    : "Task updated",
                },
              ],
            }
          : task
      ),
    }));

    // Reschedule reminders if scheduled time changed
    if (updates.scheduledTime) {
      get().scheduleTaskReminders(
        taskId,
        updates.scheduledTime,
        updates.estimatedDuration
      );
    }
  },

  deleteTask: (taskId: string) => {
    const { tasks, cancelScheduledReminders } = get();
    const task = tasks.find((t) => t.id === taskId);

    // Prevent deletion if task is in progress or completed
    if (
      task &&
      (task.status === "in-progress" || task.status === "completed")
    ) {
      get().addNotification(
        "Action Failed",
        "Cannot delete task while in progress or completed",
        "error"
      );
      return;
    }

    // Cancel any scheduled reminders
    cancelScheduledReminders(taskId);

    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== taskId),
    }));

    get().addNotification(
      "Task Deleted",
      `"${task?.title}" has been deleted`,
      "info"
    );
  },

  updateTaskStatus: (taskId: string, status: Task["status"]) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId
          ? {
              ...task,
              status,
              updatedAt: new Date().toISOString(),
              timeTrackers: [
                ...task.timeTrackers,
                {
                  action:
                    status === "in-progress"
                      ? "started"
                      : status === "completed"
                      ? "completed"
                      : "scheduled",
                  timestamp: new Date().toISOString(),
                  note: `Status changed to ${status}`,
                },
              ],
            }
          : task
      ),
    })),

  startTask: (taskId: string) => {
    const { tasks, addNotification, showSystemNotification } = get();
    const task = tasks.find((t) => t.id === taskId);

    if (task) {
      const startTime = new Date();

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: "in-progress",
                updatedAt: startTime.toISOString(),
                timeTrackers: [
                  ...t.timeTrackers,
                  {
                    action: "started",
                    timestamp: startTime.toISOString(),
                    note: "Task started by user",
                  },
                ],
              }
            : t
        ),
      }));

      addNotification(
        "Task Started",
        `Started working on: "${task.title}"`,
        "success",
        taskId
      );
      showSystemNotification(
        "✅ Task Started",
        `"${task.title}" is now in progress`,
        taskId,
        false
      );
    }
  },

  completeTask: (taskId: string) => {
    const { tasks, addNotification, showSystemNotification } = get();
    const task = tasks.find((t) => t.id === taskId);

    if (task) {
      const completionTime = new Date();
      const startTime = task.timeTrackers.find(
        (t) => t.action === "started"
      )?.timestamp;
      let extraTimeTaken = 0;
      let timeSaved = 0;

      // Calculate time metrics
      if (startTime && task.estimatedDuration) {
        const actualDuration = differenceInMinutes(
          completionTime,
          new Date(startTime)
        );
        extraTimeTaken = Math.max(0, actualDuration - task.estimatedDuration);
        timeSaved = Math.max(0, task.estimatedDuration - actualDuration);
      }

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                status: "completed",
                completionTime: completionTime.toISOString(),
                actualDuration: differenceInMinutes(
                  completionTime,
                  new Date(startTime || t.createdAt)
                ),
                extraTimeTaken,
                timeSaved,
                updatedAt: completionTime.toISOString(),
                timeTrackers: [
                  ...t.timeTrackers,
                  {
                    action: "completed",
                    timestamp: completionTime.toISOString(),
                    note: `Task completed${
                      timeSaved > 0
                        ? ` - ${timeSaved} minutes early`
                        : extraTimeTaken > 0
                        ? ` - ${extraTimeTaken} minutes extra`
                        : ""
                    }`,
                  },
                ],
              }
            : t
        ),
      }));

      let completionMessage = `🎉 Completed: "${task.title}"`;
      if (timeSaved > 0) {
        completionMessage += ` - ${timeSaved} minutes early! 🎊`;
      } else if (extraTimeTaken > 0) {
        completionMessage += ` - ${extraTimeTaken} minutes extra time taken`;
      }

      addNotification("Task Completed", completionMessage, "success", taskId);
      showSystemNotification(
        "🎉 Task Completed",
        completionMessage,
        taskId,
        false
      );
    }
  },

  postponeTask: (taskId: string) => {
    const { tasks, addNotification, showSystemNotification } = get();
    const task = tasks.find((t) => t.id === taskId);

    if (task) {
      addNotification(
        "Task Postponed",
        `"${task.title}" - Time is running!`,
        "warning",
        taskId
      );
      showSystemNotification(
        "⏰ Task Postponed",
        `"${task.title}" - Time is running!`,
        taskId,
        false
      );

      // Schedule another reminder in 10 minutes
      setTimeout(() => {
        const { tasks: updatedTasks, addNotification: notify } = get();
        const updatedTask = updatedTasks.find((t) => t.id === taskId);
        if (updatedTask && updatedTask.status === "todo") {
          notify(
            "Task Reminder",
            `"${task.title}" is still pending! Click to start now.`,
            "warning",
            taskId
          );
          get().showSystemNotification(
            "⏰ Reminder",
            `"${task.title}" is still pending! Click to start now.`,
            taskId,
            true
          );
        }
      }, 10 * 60 * 1000); // 10 minutes
    }
  },

  requestExtraTime: (taskId: string, extraMinutes: number) => {
    const { tasks, addNotification } = get();
    const task = tasks.find((t) => t.id === taskId);

    if (task) {
      const newDueTime = new Date(Date.now() + extraMinutes * 60000);

      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId
            ? {
                ...t,
                dueTime: format(newDueTime, "HH:mm"),
                extraTimeRequests: (t.extraTimeRequests || 0) + 1,
                timeTrackers: [
                  ...t.timeTrackers,
                  {
                    action: "extended",
                    timestamp: new Date().toISOString(),
                    note: `Extended by ${extraMinutes} minutes`,
                  },
                ],
              }
            : t
        ),
      }));

      addNotification(
        "Time Extended",
        `"${task.title}" extended by ${extraMinutes} minutes`,
        "info",
        taskId
      );

      // Schedule extra time completion check
      get().scheduleExtraTimeCompletionCheck(taskId, extraMinutes);
    }
  },

  addNotification: (
    title: string,
    message: string,
    type: "info" | "warning" | "error" | "success",
    taskId?: string
  ) =>
    set((state) => ({
      notifications: [
        {
          id: Math.random().toString(36).substr(2, 9),
          title,
          message,
          type,
          timestamp: new Date().toISOString(),
          taskId,
          read: false,
        },
        ...state.notifications,
      ],
    })),

  removeNotification: (id: string) =>
    set((state) => ({
      notifications: state.notifications.filter(
        (notification) => notification.id !== id
      ),
    })),

  markNotificationAsRead: (id: string) =>
    set((state) => ({
      notifications: state.notifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      ),
    })),

  clearAllNotifications: () => set({ notifications: [] }),

  showSystemNotification: (
    title: string,
    message: string,
    taskId?: string,
    actions: boolean = true
  ) => {
    showSystemNotification(title, message, taskId, actions);
  },
}));
