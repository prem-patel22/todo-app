import { useState } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { useTaskStore } from "../stores/taskStore";
import { Task } from "../types/task";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";

interface CalendarViewProps {
  onEditTask: (task: Task) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onEditTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { tasks } = useTaskStore(); // ✅ Zustand store used here

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // ✅ Get tasks for a specific day
  const getTasksForDay = (day: Date) => {
    return tasks.filter(
      (task) => task.dueDate && isSameDay(new Date(task.dueDate), day)
    );
  };

  // ✅ Priority dot color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-yellow-500";
      case "low":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  // ✅ Month navigation
  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((current) =>
      direction === "prev" ? subMonths(current, 1) : addMonths(current, 1)
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <CalendarIcon className="text-blue-500" size={24} />
          <h2 className="text-2xl font-semibold text-gray-800">
            {format(currentDate, "MMMM yyyy")}
          </h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => navigateMonth("prev")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrentDate(new Date())}
            className="btn-secondary text-sm"
          >
            Today
          </button>
          <button
            onClick={() => navigateMonth("next")}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Weekdays */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center font-semibold text-gray-600 py-2 text-sm"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-2">
        {/* Empty slots before month starts */}
        {Array.from({ length: monthStart.getDay() }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="h-32 border rounded-lg bg-gray-50"
          />
        ))}

        {/* Actual days */}
        {days.map((day) => {
          const dayTasks = getTasksForDay(day);
          const isToday = isSameDay(day, new Date());
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <div
              key={day.toISOString()}
              className={`min-h-32 border rounded-lg p-2 transition-colors ${
                isToday
                  ? "bg-blue-50 border-blue-200 ring-2 ring-blue-100"
                  : "border-gray-200 hover:bg-gray-50"
              } ${!isCurrentMonth ? "opacity-40" : ""}`}
            >
              <div
                className={`text-sm font-medium mb-1 ${
                  isToday ? "text-blue-600" : "text-gray-700"
                }`}
              >
                {format(day, "d")}
              </div>

              {/* Task List */}
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {dayTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    onClick={() => onEditTask(task)}
                    className={`text-xs p-1 rounded cursor-pointer transition-colors group ${
                      task.status === "completed"
                        ? "bg-gray-100 text-gray-500 line-through"
                        : "bg-white shadow-sm hover:shadow"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="truncate flex-1">{task.title}</span>
                      <div
                        className={`w-2 h-2 rounded-full ${getPriorityColor(
                          task.priority
                        )} ml-1`}
                      />
                    </div>
                    {task.category && (
                      <div className="text-gray-400 text-xs truncate">
                        {task.category}
                      </div>
                    )}
                  </div>
                ))}

                {/* Extra tasks indicator */}
                {dayTasks.length > 4 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{dayTasks.length - 4} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
