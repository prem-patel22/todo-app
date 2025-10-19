// frontend/src/components/tasks/TaskBoard.tsx
import { DragDropContext, DropResult } from "react-beautiful-dnd";
import { useTaskStore } from "../../stores/taskStore";
import { TaskColumn } from "./TaskColumn";

const columns = [
  { id: "todo", title: "To Do" },
  { id: "in-progress", title: "In Progress" },
  { id: "completed", title: "Completed" },
];

export const TaskBoard: React.FC = () => {
  const { tasks, updateTaskStatus } = useTaskStore();

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId as Task["status"];

    updateTaskStatus(taskId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6">
        {columns.map((column) => (
          <TaskColumn
            key={column.id}
            column={column}
            tasks={tasks.filter((task) => task.status === column.id)}
          />
        ))}
      </div>
    </DragDropContext>
  );
};
