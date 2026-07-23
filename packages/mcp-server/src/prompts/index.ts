export const PROMPTS = [
  {
    name: 'daily_motivation',
    description: 'Generate an encouraging message based on the user\'s current streak and today\'s completed quests',
    arguments: [
      { name: 'streakDays', description: 'Current streak in days', required: true },
      { name: 'completedToday', description: 'Number of quests completed today', required: true },
      { name: 'totalToday', description: 'Total quests available today', required: true },
    ],
  },
  {
    name: 'quest_recommendation',
    description: 'Suggest which quests to focus on based on the user\'s category priorities and current progress',
    arguments: [
      { name: 'topCategory', description: 'The user\'s highest-priority quest category', required: true },
      { name: 'level', description: 'Current player level', required: true },
    ],
  },
  {
    name: 'streak_recovery',
    description: 'A compassionate message and action plan after a streak break',
    arguments: [
      { name: 'daysMissed', description: 'How many days were missed', required: true },
      { name: 'previousStreak', description: 'The streak length before the break', required: true },
    ],
  },
];

export function getPromptMessages(name: string, args: Record<string, string>) {
  switch (name) {
    case 'daily_motivation':
      return [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `The user has a ${args.streakDays}-day streak and has completed ${args.completedToday} out of ${args.totalToday} quests today in the DYDYD habit tracking app. Write a short, energetic motivational message (2-3 sentences) that celebrates their progress and encourages them to keep going. Use RPG-style language — they are a hero on a quest.`,
          },
        },
      ];

    case 'quest_recommendation':
      return [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `A level ${args.level} DYDYD player has set "${args.topCategory}" as their top priority category. Recommend 2-3 specific habits from that category they should focus on this week. Frame it as a quest briefing from a wise NPC guide.`,
          },
        },
      ];

    case 'streak_recovery':
      return [
        {
          role: 'user' as const,
          content: {
            type: 'text' as const,
            text: `A DYDYD player missed ${args.daysMissed} day(s) and lost a ${args.previousStreak}-day streak. Write a compassionate, non-judgmental message (3-4 sentences) acknowledging the break, reframing it as a temporary setback that all heroes face, and giving one concrete action they can take today to restart. Use gentle RPG language.`,
          },
        },
      ];

    default:
      throw new Error(`Unknown prompt: ${name}`);
  }
}
