import { Droppable } from "@hello-pangea/dnd";
import { TaskCard } from "./TaskCard";
import { useTaskStore } from "../stores/taskStore";

interface TaskBoardProps {
  onEditTask: (task: any) => void;
}

const columns = [
  {
    id: "todo",
    title: "To Do",
    color: "bg-blue-50",
    textColor: "text-blue-800",
  },
  {
    id: "in-progress",
    title: "In Progress",
    color: "bg-yellow-50",
    textColor: "text-yellow-800",
  },
  {
    id: "completed",
    title: "Completed",
    color: "bg-green-50",
    textColor: "text-green-800",
  },
] as const;

export const TaskBoard: React.FC<TaskBoardProps> = ({ onEditTask }) => {
  const { tasks, deleteTask, updateTaskStatus } = useTaskStore();

  const handleDeleteTask = (taskId: string) => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteTask(taskId);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
      {columns.map((column) => (
        <Droppable key={column.id} droppableId={column.id}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`rounded-lg p-4 min-h-[500px] transition-colors ${
                snapshot.isDraggingOver
                  ? "ring-2 ring-blue-300 bg-opacity-80"
                  : ""
              } ${column.color}`}
            >
              <div
                className={`font-semibold text-lg mb-4 ${column.textColor} flex items-center justify-between`}
              >
                <span>{column.title}</span>
                <span className="text-sm bg-white px-2 py-1 rounded-full">
                  {tasks.filter((task) => task.status === column.id).length}
                </span>
              </div>

              <div className="space-y-3">
                {tasks
                  .filter((task) => task.status === column.id)
                  .map((task, index) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      index={index}
                      onEdit={onEditTask}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                {provided.placeholder}

                {tasks.filter((task) => task.status === column.id).length ===
                  0 && (
                  <div className="text-center text-gray-400 py-8">
                    <div className="text-4xl mb-2">📝</div>
                    <p>No tasks here</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Droppable>
      ))}
    </div>
  );
};
