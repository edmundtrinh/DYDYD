import { Router, Request, Response, NextFunction, IRouter } from 'express';
import { body } from 'express-validator';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';
import { prisma } from '../lib/prisma';
import {
  ApiResponse,
  HealthDataSource,
  HealthDataType,
  HealthSyncResult,
} from '@dydyd/shared';

const router: IRouter = Router();

/**
 * POST /api/health/sync
 * Receive aggregated health metrics from the mobile app and auto-complete
 * matching quests.
 *
 * The mobile app aggregates raw health data locally and sends only summary
 * metrics (e.g. total steps today, total workout minutes). We never accept
 * raw health records to comply with Apple/Google data policies.
 */
router.post(
  '/sync',
  authenticate,
  validate([
    body('metrics')
      .isArray({ min: 1 })
      .withMessage('Metrics array is required and must not be empty'),
    body('metrics.*.type')
      .isIn([
        'steps',
        'distance',
        'active_calories',
        'sleep_hours',
        'water_cups',
        'workout_minutes',
        'heart_rate',
        'mindful_minutes',
        'stand_hours',
      ])
      .withMessage('Invalid health data type'),
    body('metrics.*.value')
      .isNumeric()
      .withMessage('Value must be a number'),
    body('metrics.*.source')
      .isIn([
        'apple_health',
        'google_fit',
        'garmin',
        'samsung_health',
        'manual',
      ])
      .withMessage('Invalid health data source'),
    body('metrics.*.timestamp')
      .isISO8601()
      .withMessage('Timestamp must be ISO 8601'),
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { metrics } = req.body as {
        metrics: Array<{
          type: HealthDataType;
          value: number;
          source: HealthDataSource;
          timestamp: string;
        }>;
      };

      const userId = req.userId!;

      // Get user's active quests that have a health data type
      const userQuests = await prisma.userQuest.findMany({
        where: {
          userId,
          isActive: true,
          quest: {
            healthDataType: { not: null },
          },
        },
        include: { quest: true },
      });

      const questsAutoCompleted: string[] = [];
      let totalXpEarned = 0;

      for (const metric of metrics) {
        // Find quests whose healthDataType matches this metric
        const matchingQuests = userQuests.filter(
          (uq: any) => uq.quest.healthDataType === metric.type
        );

        for (const userQuest of matchingQuests) {
          // Check if the target value is met
          if (
            userQuest.quest.targetValue != null &&
            metric.value < userQuest.quest.targetValue
          ) {
            continue; // Target not reached
          }

          // Determine the period start for this quest based on the metric timestamp
          const metricDate = new Date(metric.timestamp);
          let periodStart: Date;

          switch (userQuest.quest.frequency) {
            case 'weekly': {
              const day = metricDate.getDay();
              periodStart = new Date(metricDate);
              periodStart.setDate(metricDate.getDate() - day);
              periodStart.setHours(0, 0, 0, 0);
              break;
            }
            case 'monthly':
              periodStart = new Date(
                metricDate.getFullYear(),
                metricDate.getMonth(),
                1
              );
              break;
            default: // daily
              periodStart = new Date(metricDate);
              periodStart.setHours(0, 0, 0, 0);
          }

          // Check if max completions for the period have been reached
          const completionsInPeriod = await prisma.questCompletion.count({
            where: {
              userQuestId: userQuest.id,
              periodStart,
            },
          });

          if (completionsInPeriod >= userQuest.quest.maxCompletionsPerPeriod) {
            continue; // Already maxed out this period
          }

          const xpEarned = userQuest.customXP || userQuest.quest.baseXP;

          // Create the completion
          await prisma.questCompletion.create({
            data: {
              userQuestId: userQuest.id,
              xpEarned,
              value: metric.value,
              source: metric.source,
              periodStart,
            },
          });

          // Update user quest stats
          await prisma.userQuest.update({
            where: { id: userQuest.id },
            data: {
              totalCompletions: { increment: 1 },
              lastCompletedAt: metricDate,
              currentStreak: { increment: 1 },
              longestStreak: {
                set: Math.max(
                  userQuest.longestStreak,
                  userQuest.currentStreak + 1
                ),
              },
            },
          });

          totalXpEarned += xpEarned;
          questsAutoCompleted.push(userQuest.id);
        }
      }

      // Update user total XP if any quests were completed
      if (totalXpEarned > 0) {
        await prisma.user.update({
          where: { id: userId },
          data: { totalXP: { increment: totalXpEarned } },
        });
      }

      const result: HealthSyncResult = {
        success: true,
        dataPoints: metrics.map((m) => ({
          type: m.type,
          value: m.value,
          unit: '',
          source: m.source,
          timestamp: new Date(m.timestamp),
        })),
        questsAutoCompleted,
        xpEarned: totalXpEarned,
      };

      const response: ApiResponse<HealthSyncResult> = {
        success: true,
        data: result,
      };

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
