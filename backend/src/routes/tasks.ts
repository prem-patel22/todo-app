import express from "express";
import { body, validationResult } from "express-validator";
import { prisma } from "../config/database";
import { AppError } from "../middleware/errorHandler";
import { AuthRequest } from "../middleware/auth";

const router = express.Router();

// Get all tasks for user
router.get("/", async (req: AuthRequest, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user!.id },
      include: {
        reminders: true,
        timeTrackers: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(tasks);
  } catch (error) {
    next(error);
  }
});

// Get task by ID
router.get("/:id", async (req: AuthRequest, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
      include: {
        reminders: true,
        timeTrackers: true,
      },
    });

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    res.json(task);
  } catch (error) {
    next(error);
  }
});

// Create task
router.post(
  "/",
  [
    body("title").trim().isLength({ min: 1 }),
    body("dueDate").optional().isISO8601(),
    body("estimatedDuration").optional().isInt({ min: 1 }),
  ],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError("Validation failed", 400);
      }

      const {
        title,
        description,
        priority,
        dueDate,
        dueTime,
        estimatedDuration,
        category,
        tags,
      } = req.body;

      const task = await prisma.task.create({
        data: {
          title,
          description,
          priority: priority || "MEDIUM",
          dueDate: dueDate ? new Date(dueDate) : null,
          dueTime,
          scheduledTime:
            dueDate && dueTime ? new Date(`${dueDate}T${dueTime}`) : null,
          estimatedDuration,
          category,
          tags: tags || [],
          userId: req.user!.id,
        },
        include: {
          reminders: true,
          timeTrackers: true,
        },
      });

      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }
);

// Update task
router.put(
  "/:id",
  [body("title").optional().trim().isLength({ min: 1 })],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError("Validation failed", 400);
      }

      const task = await prisma.task.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
      });

      if (!task) {
        throw new AppError("Task not found", 404);
      }

      // Prevent modification if task is in progress or completed
      if (task.status === "IN_PROGRESS" || task.status === "COMPLETED") {
        throw new AppError(
          "Cannot modify task while in progress or completed",
          400
        );
      }

      const updatedTask = await prisma.task.update({
        where: { id: req.params.id },
        data: {
          ...req.body,
          dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined,
          scheduledTime:
            req.body.dueDate && req.body.dueTime
              ? new Date(`${req.body.dueDate}T${req.body.dueTime}`)
              : undefined,
          updatedAt: new Date(),
        },
        include: {
          reminders: true,
          timeTrackers: true,
        },
      });

      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  }
);

// Delete task
router.delete("/:id", async (req: AuthRequest, res, next) => {
  try {
    const task = await prisma.task.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.id,
      },
    });

    if (!task) {
      throw new AppError("Task not found", 404);
    }

    // Prevent deletion if task is in progress or completed
    if (task.status === "IN_PROGRESS" || task.status === "COMPLETED") {
      throw new AppError(
        "Cannot delete task while in progress or completed",
        400
      );
    }

    await prisma.task.delete({
      where: { id: req.params.id },
    });

    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    next(error);
  }
});

// Update task status
router.patch(
  "/:id/status",
  [body("status").isIn(["TODO", "IN_PROGRESS", "COMPLETED"])],
  async (req: AuthRequest, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        throw new AppError("Validation failed", 400);
      }

      const task = await prisma.task.findFirst({
        where: {
          id: req.params.id,
          userId: req.user!.id,
        },
      });

      if (!task) {
        throw new AppError("Task not found", 404);
      }

      const updatedTask = await prisma.task.update({
        where: { id: req.params.id },
        data: {
          status: req.body.status,
          completionTime:
            req.body.status === "COMPLETED" ? new Date() : undefined,
          updatedAt: new Date(),
        },
        include: {
          reminders: true,
          timeTrackers: true,
        },
      });

      // Add time tracker entry
      await prisma.timeTracker.create({
        data: {
          taskId: task.id,
          action:
            req.body.status === "IN_PROGRESS"
              ? "started"
              : req.body.status === "COMPLETED"
              ? "completed"
              : "scheduled",
          note: `Status changed to ${req.body.status.toLowerCase()}`,
        },
      });

      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
