import { Draggable } from "@hello-pangea/dnd";
import {
  Calendar,
  Tag,
  Clock,
  Play,
  CheckCircle,
  Clock4,
  Lock,
  Hourglass,
} from "lucide-react";
import { useTaskStore } from "../stores/taskStore";

interface TaskCardProps {
  task: any;
  index: number;
  onEdit: (task: any) => void;
  onDelete: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index,
  onEdit,
  onDelete,
}) => {
  const { startTask, completeTask } = useTaskStore();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusActions = () => {
    switch (task.status) {
      case "todo":
        return (
          <button
            onClick={() => {
              if (confirm(`Start working on "${task.title}" now?`)) {
                startTask(task.id);
              } else {
                // Show system notification for postponed task
                if (
                  "Notification" in window &&
                  Notification.permission === "granted"
                ) {
                  new Notification("⏰ Task Postponed", {
                    body: `"${task.title}" - Time is running!`,
                    icon: "/favicon.ico",
                  });
                }
              }
            }}
            className="flex items-center space-x-1 text-green-600 hover:text-green-800 text-sm font-medium"
          >
            <Play size={14} />
            <span>Start</span>
          </button>
        );
      case "in-progress":
        return (
          <button
            onClick={() => completeTask(task.id)}
            className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            <CheckCircle size={14} />
            <span>Complete</span>
          </button>
        );
      default:
        return null;
    }
  };

  const formatDateTime = (dateString: string, timeString?: string) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (timeString) {
      return `${date.toLocaleDateString()} ${timeString}`;
    }
    return date.toLocaleDateString();
  };

  // Calculate expected completion time
  const getExpectedCompletionTime = () => {
    if (task.dueDate && task.dueTime && task.estimatedDuration) {
      const dueDateTime = new Date(`${task.dueDate}T${task.dueTime}`);
      const completionTime = new Date(
        dueDateTime.getTime() + task.estimatedDuration * 60000
      );
      return completionTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return null;
  };

  const expectedCompletion = getExpectedCompletionTime();
  const isLocked = task.status === "in-progress" || task.status === "completed";

  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={isLocked}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg border p-4 mb-3 transition-all ${
            snapshot.isDragging
              ? "shadow-lg rotate-1"
              : "shadow-sm hover:shadow-md"
          } ${
            task.status === "completed"
              ? "opacity-75 bg-green-50 border-green-200"
              : task.status === "in-progress"
              ? "bg-blue-50 border-blue-200"
              : ""
          } ${isLocked ? "cursor-not-allowed" : ""}`}
        >
          {isLocked && (
            <div className="flex items-center justify-end mb-2 text-gray-500">
              <Lock size={14} className="mr-1" />
              <span className="text-xs">Locked</span>
            </div>
          )}

          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-800 flex-1">{task.title}</h3>
            <div className="flex space-x-1 ml-2">
              {getStatusActions()}
              {!isLocked && (
                <button
                  onClick={() => onEdit(task)}
                  className="text-blue-500 hover:text-blue-700 p-1"
                  title="Edit task"
                >
                  ✏️
                </button>
              )}
              {!isLocked && (
                <button
                  onClick={() => onDelete(task.id)}
                  className="text-red-500 hover:text-red-700 p-1"
                  title="Delete task"
                >
                  🗑️
                </button>
              )}
            </div>
          </div>

          {task.description && (
            <p className="text-gray-600 text-sm mb-3">{task.description}</p>
          )}

          <div className="flex items-center justify-between mb-2">
            <span
              className={`px-2 py-1 rounded-full text-xs border ${getPriorityColor(
                task.priority
              )}`}
            >
              {task.priority}
            </span>

            <span
              className={`px-2 py-1 rounded-full text-xs border ${
                task.status === "completed"
                  ? "bg-green-100 text-green-800 border-green-200"
                  : task.status === "in-progress"
                  ? "bg-blue-100 text-blue-800 border-blue-200"
                  : "bg-gray-100 text-gray-800 border-gray-200"
              }`}
            >
              {task.status}
            </span>
          </div>

          <div className="space-y-2 text-xs text-gray-600">
            {/* Starts At - Only show if scheduled time is in future */}
            {task.status === "todo" &&
              task.scheduledTime &&
              new Date(task.scheduledTime) > new Date() && (
                <div className="flex items-center">
                  <Clock4 size={12} className="mr-1" />
                  Starts at: {new Date(task.scheduledTime).toLocaleString()}
                </div>
              )}

            {/* Due Date/Time */}
            {task.dueDate && (
              <div className="flex items-center">
                <Calendar size={12} className="mr-1" />
                Due: {formatDateTime(task.dueDate, task.dueTime)}
              </div>
            )}

            {/* Estimated Duration */}
            {task.estimatedDuration && (
              <div className="flex items-center">
                <Hourglass size={12} className="mr-1" />
                Estimated: {task.estimatedDuration} minutes
              </div>
            )}

            {/* Expected Completion - Only for todo tasks */}
            {expectedCompletion && task.status === "todo" && (
              <div className="flex items-center">
                <Clock size={12} className="mr-1" />
                Expected completion: {expectedCompletion}
              </div>
            )}

            {/* Category */}
            {task.category && (
              <div className="flex items-center">
                <Tag size={12} className="mr-1" />
                {task.category}
              </div>
            )}
          </div>

          {task.status === "completed" && (
            <div className="mt-2 p-2 bg-green-50 rounded border border-green-200">
              <div className="text-xs text-green-800 space-y-1">
                {task.timeSaved && task.timeSaved > 0 && (
                  <div>🎉 Completed {task.timeSaved} minutes early!</div>
                )}
                {task.extraTimeTaken && task.extraTimeTaken > 0 && (
                  <div>⏱️ Took {task.extraTimeTaken} minutes extra</div>
                )}
                {task.actualDuration && (
                  <div>Total time: {task.actualDuration} minutes</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
};
