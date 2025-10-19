// frontend/src/components/calendar/CalendarView.tsx
import {
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameDay,
  startOfMonth,
} from "date-fns";
import { useState } from "react";
import { useTaskStore } from "../../stores/taskStore";

export const CalendarView: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { tasks } = useTaskStore();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTasksForDay = (day: Date) => {
    return tasks.filter(
      (task) => task.dueDate && isSameDay(new Date(task.dueDate), day)
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="flex space-x-2">
          <button
            onClick={() =>
              setCurrentDate(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1)
              )
            }
          >
            ←
          </button>
          <button onClick={() => setCurrentDate(new Date())}>Today</button>
          <button
            onClick={() =>
              setCurrentDate(
                (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1)
              )
            }
          >
            →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center font-medium text-gray-500 py-2">
            {day}
          </div>
        ))}

        {days.map((day) => {
          const dayTasks = getTasksForDay(day);
          return (
            <div
              key={day.toISOString()}
              className={`min-h-24 border rounded-lg p-2 ${
                isSameDay(day, new Date())
                  ? "bg-blue-50 border-blue-200"
                  : "border-gray-200"
              }`}
            >
              <div className="text-sm font-medium">{format(day, "d")}</div>
              <div className="mt-1 space-y-1">
                {dayTasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className={`text-xs p-1 rounded ${
                      task.priority === "high"
                        ? "bg-red-100 text-red-800"
                        : task.priority === "medium"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                    }`}
                  >
                    {task.title}
                  </div>
                ))}
                {dayTasks.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{dayTasks.length - 3} more
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
