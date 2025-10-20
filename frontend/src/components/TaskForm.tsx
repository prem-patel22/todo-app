import { useState, useEffect } from "react";
import { useTaskStore } from "../stores/taskStore";
import { X, Calendar, Tag, Clock, Hourglass, AlertCircle } from "lucide-react";

interface TaskFormProps {
  task?: any;
  onClose: () => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ task, onClose }) => {
  const { addTask, updateTask } = useTaskStore();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium" as "low" | "medium" | "high",
    dueDate: "",
    dueTime: "",
    scheduledTime: "",
    estimatedDuration: 30, // default 30 minutes
    category: "",
    tags: [] as string[],
  });
  const [errors, setErrors] = useState<{ dueDate?: string; dueTime?: string }>(
    {}
  );

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        priority: task.priority,
        dueDate: task.dueDate || "",
        dueTime: task.dueTime || "",
        scheduledTime: task.scheduledTime || "",
        estimatedDuration: task.estimatedDuration || 30,
        category: task.category || "",
        tags: task.tags || [],
      });
    }
  }, [task]);

  const validateForm = () => {
    const newErrors: { dueDate?: string; dueTime?: string } = {};

    if (!formData.dueDate) {
      newErrors.dueDate = "Due date is required";
    }

    if (!formData.dueTime) {
      newErrors.dueTime = "Due time is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (formData.title.trim()) {
      // Combine date and time for scheduledTime - FIXED TIMEZONE ISSUE
      let scheduledTime = "";
      if (formData.dueDate && formData.dueTime) {
        // Create date in local timezone without timezone conversion
        const localDate = new Date(`${formData.dueDate}T${formData.dueTime}`);
        scheduledTime = localDate.toISOString();
      }

      const taskData = {
        ...formData,
        scheduledTime,
      };

      if (task) {
        updateTask(task.id, taskData);
      } else {
        addTask(taskData);
      }
      onClose();
    }
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && e.currentTarget.value.trim()) {
      e.preventDefault();
      const newTag = e.currentTarget.value.trim();
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag],
      }));
      e.currentTarget.value = "";
    }
  };

  const removeTag = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index),
    }));
  };

  const handleDurationChange = (value: string) => {
    const minutes = parseInt(value) || 0;
    if (minutes >= 0 && minutes <= 1440) {
      // Max 24 hours
      setFormData((prev) => ({
        ...prev,
        estimatedDuration: minutes,
      }));
    }
  };

  // Calculate completion time based on due time and estimated duration
  const getCompletionTime = () => {
    if (formData.dueDate && formData.dueTime && formData.estimatedDuration) {
      const dueDateTime = new Date(`${formData.dueDate}T${formData.dueTime}`);
      const completionTime = new Date(
        dueDateTime.getTime() + formData.estimatedDuration * 60000
      );
      return completionTime.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    return null;
  };

  const completionTime = getCompletionTime();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">
            {task ? "Edit Task" : "Create New Task"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              className="input-field"
              placeholder="Enter task title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              className="input-field resize-none h-20"
              placeholder="Enter task description"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Calendar size={16} className="inline mr-1" />
                Due Date *
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, dueDate: e.target.value }));
                  setErrors((prev) => ({ ...prev, dueDate: undefined }));
                }}
                className={`input-field ${
                  errors.dueDate
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
              />
              {errors.dueDate && (
                <p className="text-red-600 text-xs mt-1 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.dueDate}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Clock size={16} className="inline mr-1" />
                Due Time *
              </label>
              <input
                type="time"
                required
                value={formData.dueTime}
                onChange={(e) => {
                  setFormData((prev) => ({ ...prev, dueTime: e.target.value }));
                  setErrors((prev) => ({ ...prev, dueTime: undefined }));
                }}
                className={`input-field ${
                  errors.dueTime
                    ? "border-red-300 focus:border-red-500 focus:ring-red-500"
                    : ""
                }`}
              />
              {errors.dueTime && (
                <p className="text-red-600 text-xs mt-1 flex items-center">
                  <AlertCircle size={12} className="mr-1" />
                  {errors.dueTime}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Hourglass size={16} className="inline mr-1" />
                Est. Duration (minutes)
              </label>
              <input
                type="number"
                min="1"
                max="1440"
                value={formData.estimatedDuration}
                onChange={(e) => handleDurationChange(e.target.value)}
                className="input-field"
                placeholder="Enter minutes"
              />
            </div>
          </div>

          {completionTime && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="text-sm text-blue-800">
                <strong>Expected Completion:</strong> {completionTime}
                <br />
                <span className="text-xs text-blue-600">
                  (Based on due time + {formData.estimatedDuration} minutes
                  estimated work)
                </span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    priority: e.target.value as any,
                  }))
                }
                className="input-field"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                <Tag size={16} className="inline mr-1" />
                Category
              </label>
              <input
                type="text"
                value={formData.category}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, category: e.target.value }))
                }
                className="input-field"
                placeholder="e.g., Work, Personal, Shopping"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags
            </label>
            <input
              type="text"
              onKeyDown={handleAddTag}
              className="input-field mb-2"
              placeholder="Type and press Enter to add tags"
            />
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag, index) => (
                <span
                  key={index}
                  className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm flex items-center"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(index)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">
              🚀 Smart Time Management
            </h3>
            <ul className="text-green-700 text-sm list-disc list-inside space-y-1">
              <li>Date and Time are required for proper scheduling</li>
              <li>System calculates expected completion time automatically</li>
              <li>Get notified when it's time to start and complete</li>
              <li>Track actual vs estimated time performance</li>
              <li>Request extra time if needed with follow-up notifications</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-3 pt-4 border-t">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              {task ? "Update Task" : "Create Task"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
