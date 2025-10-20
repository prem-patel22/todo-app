import express from "express";
import { prisma } from "../config/database";
import { AuthRequest } from "../middleware/auth";

const router = express.Router();

// Get user profile
router.get("/profile", async (req: AuthRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

// Get user statistics
router.get("/stats", async (req: AuthRequest, res, next) => {
  try {
    const tasks = await prisma.task.findMany({
      where: { userId: req.user!.id },
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(
      (task) => task.status === "COMPLETED"
    ).length;
    const inProgressTasks = tasks.filter(
      (task) => task.status === "IN_PROGRESS"
    ).length;
    const todoTasks = tasks.filter((task) => task.status === "TODO").length;

    const totalTimeSaved = tasks.reduce(
      (sum, task) => sum + (task.timeSaved || 0),
      0
    );
    const totalExtraTime = tasks.reduce(
      (sum, task) => sum + (task.extraTimeTaken || 0),
      0
    );

    res.json({
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
      totalTimeSaved,
      totalExtraTime,
      productivityScore:
        completedTasks > 0
          ? Math.max(0, 100 - totalExtraTime / completedTasks)
          : 100,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
