// frontend/src/hooks/useTasks.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { taskService } from '../services/taskService';

export const useTasks = (filters?: any) => {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => taskService.getTasks(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: taskService.createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};