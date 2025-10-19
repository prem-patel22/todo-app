// backend/src/controllers/taskController.ts
import { Request, Response } from 'express';
import { TaskService } from '../services/taskService';

export class TaskController {
  constructor(private taskService: TaskService) {}

  async createTask(req: Request, res: Response) {
    try {
      const task = await this.taskService.createTask({
        ...req.body,
        userId: req.user.id
      });
      res.status(201).json(task);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getTasks(req: Request, res: Response) {
    try {
      const { status, category, priority } = req.query;
      const tasks = await this.taskService.getUserTasks(req.user.id, {
        status,
        category,
        priority
      });
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async updateTask(req: Request, res: Response) {
    try {
      const task = await this.taskService.updateTask(req.params.id, req.body, req.user.id);
      res.json(task);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
}