import { useState, useEffect } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  setMonth,
  setYear,
} from "date-fns";
import { useTaskStore } from "../stores/taskStore";
import { Task } from "../types/task";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  ChevronDown,
} from "lucide-react";

interface CalendarViewProps {
  onEditTask: (task: Task) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({ onEditTask }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const { tasks } = useTaskStore();

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getTasksForDay = (day: Date) => {
    return tasks.filter(
      (task) => task.dueDate && isSameDay(new Date(task.dueDate), day)
    );
  };

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

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentDate((current) =>
      direction === "prev" ? subMonths(current, 1) : addMonths(current, 1)
    );
  };

  const selectMonth = (month: number) => {
    setCurrentDate((current) => setMonth(current, month));
    setShowMonthPicker(false);
  };

  const selectYear = (year: number) => {
    setCurrentDate((current) => setYear(current, year));
    setShowYearPicker(false);
  };

  // Generate years (from current year - 10 to current year + 10)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 21 }, (_, i) => currentYear - 10 + i);

  // Month names
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  // Close pickers when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowMonthPicker(false);
      setShowYearPicker(false);
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <CalendarIcon className="text-blue-500" size={24} />

          {/* Month and Year Picker */}
          <div className="flex items-center space-x-2">
            {/* Month Picker */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMonthPicker(!showMonthPicker);
                  setShowYearPicker(false);
                }}
                className="flex items-center space-x-1 px-3 py-2 text-lg font-semibold text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span>{format(currentDate, "MMMM")}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    showMonthPicker ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showMonthPicker && (
                <div className="absolute top-12 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-48 max-h-60 overflow-y-auto">
                  <div className="p-2 grid grid-cols-3 gap-1">
                    {months.map((month, index) => (
                      <button
                        key={month}
                        onClick={() => selectMonth(index)}
                        className={`p-2 text-sm rounded-md transition-colors ${
                          currentDate.getMonth() === index
                            ? "bg-blue-500 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {month.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Year Picker */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowYearPicker(!showYearPicker);
                  setShowMonthPicker(false);
                }}
                className="flex items-center space-x-1 px-3 py-2 text-lg font-semibold text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span>{format(currentDate, "yyyy")}</span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${
                    showYearPicker ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showYearPicker && (
                <div className="absolute top-12 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-32 max-h-60 overflow-y-auto">
                  <div className="p-2 grid grid-cols-1 gap-1">
                    {years.map((year) => (
                      <button
                        key={year}
                        onClick={() => selectYear(year)}
                        className={`p-2 text-sm rounded-md transition-colors ${
                          currentDate.getFullYear() === year
                            ? "bg-blue-500 text-white"
                            : "text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
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

      <div className="grid grid-cols-7 gap-2">
        {/* Empty cells for days before month start */}
        {Array.from({ length: monthStart.getDay() }).map((_, index) => (
          <div
            key={`empty-${index}`}
            className="h-32 border rounded-lg bg-gray-50"
          />
        ))}

        {/* Calendar days */}
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

      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-center space-x-6 text-xs text-gray-600">
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>High Priority</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Medium Priority</span>
          </div>
          <div className="flex items-center space-x-1">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Low Priority</span>
          </div>
        </div>
      </div>
    </div>
  );
};
