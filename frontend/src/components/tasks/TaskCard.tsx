// frontend/src/components/tasks/TaskCard.tsx
import { Draggable } from 'react-beautiful-dnd';
import { Task } from '../../../shared/types';

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, index, onEdit, onDelete }) => {
  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white rounded-lg shadow-sm border p-4 mb-2 transition-all ${
            snapshot.isDragging ? 'shadow-lg rotate-2' : ''
          }`}
        >
          <div className="flex justify-between items-start">
            <h3 className="font-semibold text-gray-800">{task.title}</h3>
            <div className="flex space-x-2">
              <button onClick={() => onEdit(task)} className="text-blue-500 hover:text-blue-700">
                ✏️
              </button>
              <button onClick={() => onDelete(task.id)} className="text-red-500 hover:text-red-700">
                🗑️
              </button>
            </div>
          </div>
          {task.description && (
            <p className="text-gray-600 text-sm mt-2">{task.description}</p>
          )}
          <div className="flex items-center justify-between mt-3">
            <span className={`px-2 py-1 rounded-full text-xs ${
              task.priority === 'high' ? 'bg-red-100 text-red-800' :
              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
              'bg-green-100 text-green-800'
            }`}>
              {task.priority}
            </span>
            {task.dueDate && (
              <span className="text-gray-500 text-sm">
                {new Date(task.dueDate).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
};