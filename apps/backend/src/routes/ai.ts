import { Hono } from 'hono';
import { z } from 'zod';
import Anthropic from '@anthropic-ai/sdk';
import { authenticate } from '../middleware/auth';
import { Errors } from '../middleware/errorHandler';
import { validateBody } from '../middleware/validate';
import { rateLimiter } from '../middleware/rateLimit';
import { prisma } from '../lib/prisma';
import { getLevelTitle, PREDEFINED_QUESTS, ApiResponse } from '@dydyd/shared';

type Env = {
  Variables: {
    validatedBody: unknown;
    userId: string;
    user: { id: string; email: string };
  };
};

const app = new Hono<Env>();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const spriteSchema = z.object({
  message: z.string().min(1).max(1000),
  context: z
    .object({
      recentQuests: z.array(z.string()).optional(),
      streakDays: z.number().int().min(0).optional(),
      currentLevel: z.number().int().min(1).optional(),
    })
    .optional(),
});

const aiRateLimiter = rateLimiter(60 * 60 * 1000, 10);

app.post(
  '/sprite',
  authenticate,
  aiRateLimiter,
  validateBody(spriteSchema),
  async (c) => {
    const userId = c.get('userId');
    const body = c.get('validatedBody') as z.infer<typeof spriteSchema>;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { totalXP: true, level: true, streakDays: true, streakFreezes: true },
    });

    if (!user) {
      throw Errors.notFound('User');
    }

    const activeQuests = await prisma.userQuest.findMany({
      where: { userId, isActive: true },
      include: { quest: { select: { name: true, category: true } } },
      take: 5,
    });

    const recentCompletions = await prisma.questCompletion.findMany({
      where: { userQuest: { userId } },
      orderBy: { completedAt: 'desc' },
      take: 5,
      include: { userQuest: { include: { quest: { select: { name: true } } } } },
    });

    const levelTitle = getLevelTitle(user.level);
    const questNames = activeQuests.map((uq: any) => uq.quest.name).join(', ') || 'none';
    const recentNames = recentCompletions
      .map((completion: any) => completion.userQuest.quest.name)
      .join(', ') || 'none';
    const questIdList = PREDEFINED_QUESTS.slice(0, 10).map((q: any) => q.id).join(', ');

    const systemPrompt = `You are the user's Sprite — a wise, encouraging fairy companion in the DYDYD habit-tracking RPG. You speak with warmth and a touch of magic. Your role is to help the hero (user) build better habits and celebrate their wins.

Hero's current stats:
- Level: ${user.level} (${levelTitle})
- Total XP: ${user.totalXP}
- Streak: ${user.streakDays ?? 0} days
- Streak freezes remaining: ${user.streakFreezes}
- Active quests: ${questNames}
- Recently completed: ${recentNames}

Keep responses concise (3-5 sentences). When relevant, suggest specific quest IDs from the DYDYD predefined quest list. Available quest IDs: ${questIdList}.

If you suggest quests, end your response with a JSON block on its own line in this exact format:
SUGGESTED_QUESTS:["quest-id-1","quest-id-2"]`;

    const completion = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: 'user', content: body.message }],
    });

    const rawReply = completion.content[0].type === 'text' ? completion.content[0].text : '';

    let reply = rawReply;
    let suggestedQuestIds: string[] | undefined;

    const questMatch = rawReply.match(/SUGGESTED_QUESTS:(\[.*?\])/s);
    if (questMatch) {
      try {
        suggestedQuestIds = JSON.parse(questMatch[1]);
      } catch {
        // ignore malformed JSON in Sprite suggestion footer
      }
      reply = rawReply.replace(/SUGGESTED_QUESTS:\[.*?\]/s, '').trim();
    }

    const response: ApiResponse<{ reply: string; suggestedQuestIds?: string[] }> = {
      success: true,
      data: { reply, suggestedQuestIds },
    };

    return c.json(response);
  }
);

export default app;
