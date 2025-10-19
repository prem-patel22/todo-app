import { useState, useEffect } from "react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { TaskBoard } from "../components/TaskBoard";
import { TaskForm } from "../components/TaskForm";
import { CalendarView } from "../components/CalendarView";
import { NotificationCenter } from "../components/NotificationCenter";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { useTaskStore } from "../stores/taskStore";
import { LayoutGrid, Calendar, Plus, Shield } from "lucide-react";

type ViewMode = "board" | "calendar";

export default function Dashboard() {
  const [activeView, setActiveView] = useState<ViewMode>("board");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const { updateTaskStatus, tasks } = useTaskStore();

  // ✅ Ask notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ✅ Handle drag and drop task status change
  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId as any;
    updateTaskStatus(taskId, newStatus);
  };

  // ✅ Restrict editing for in-progress or completed tasks
  const handleEditTask = (task: any) => {
    if (task.status === "in-progress" || task.status === "completed") {
      alert("This task cannot be modified while in progress or completed.");
      return;
    }
    setEditingTask(task);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setEditingTask(null);
  };

  const viewIcons = {
    board: LayoutGrid,
    calendar: Calendar,
  };

  // ✅ Auto check tasks for scheduled start notifications (with precise timing)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      tasks.forEach((task) => {
        if (
          task.status === "todo" &&
          task.scheduledTime &&
          new Date(task.scheduledTime) <= now
        ) {
          const { startTask, showSystemNotification, addNotification } =
            useTaskStore.getState();

          // Add to app notifications
          addNotification(
            "⏰ Time to Start Task",
            `"${task.title}" is scheduled to start now`,
            "warning",
            task.id
          );

          // Show system notification
          showSystemNotification(
            "⏰ Time to Start Task",
            `"${task.title}" - Click to confirm start`,
            task.id,
            true
          );

          // Auto-prompt user if they're on the page
          if (document.hasFocus()) {
            if (
              confirm(
                `⏰ TIME TO START TASK\n\n"${task.title}"\n\nAre you starting this task now?`
              )
            ) {
              startTask(task.id);
            } else {
              showSystemNotification(
                "⏰ Task Postponed",
                `"${task.title}" - Time is running!`,
                task.id,
                false
              );
              addNotification(
                "Task Postponed",
                `"${task.title}" - Time is running!`,
                "warning",
                task.id
              );
            }
          }
        }
      });
    }, 10000); // Check every 10 seconds for better precision

    return () => clearInterval(interval);
  }, [tasks]);

  // ✅ Handle Service Worker Notifications (Start / Postpone Task)
  useEffect(() => {
    if ("serviceWorker" in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.addEventListener("message", (event) => {
        const { action, taskId } = event.data;
        const { startTask, postponeTask } = useTaskStore.getState();

        if (action === "startTask" && taskId) {
          startTask(taskId);
        } else if (action === "postponeTask" && taskId) {
          postponeTask(taskId);
        }
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                🚀 Smart TaskFlow
              </h1>
              <span className="ml-4 text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Intelligent Task Management
              </span>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield size={16} />
                <span>Auto-Lock: Active</span>
              </div>

              <div className="flex bg-gray-100 rounded-lg p-1">
                {(["board", "calendar"] as ViewMode[]).map((view) => {
                  const Icon = viewIcons[view];
                  return (
                    <button
                      key={view}
                      onClick={() => setActiveView(view)}
                      className={`px-3 py-2 rounded-md text-sm font-medium capitalize transition-colors flex items-center space-x-2 ${
                        activeView === view
                          ? "bg-white text-gray-900 shadow-sm"
                          : "text-gray-600 hover:text-gray-900"
                      }`}
                    >
                      <Icon size={16} />
                      <span>{view}</span>
                    </button>
                  );
                })}
              </div>

              <NotificationCenter />

              <button
                onClick={() => setIsFormOpen(true)}
                className="btn-primary flex items-center space-x-2"
              >
                <Plus size={16} />
                <span>New Task</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <ErrorBoundary>
          {activeView === "board" && (
            <DragDropContext onDragEnd={handleDragEnd}>
              <TaskBoard onEditTask={handleEditTask} />
            </DragDropContext>
          )}
        </ErrorBoundary>

        <ErrorBoundary>
          {activeView === "calendar" && (
            <CalendarView onEditTask={handleEditTask} />
          )}
        </ErrorBoundary>

        {isFormOpen && (
          <TaskForm task={editingTask} onClose={handleCloseForm} />
        )}
      </main>
    </div>
  );
}
