#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { getUserStats, getLevelProgress } from './tools/user.js';
import { getActiveQuests, completeQuest } from './tools/quests.js';
import { getStreakInfo } from './tools/streaks.js';
import { getBadgeProgress } from './tools/badges.js';
import { checkHealthData } from './tools/health.js';
import { RESOURCES, readResource } from './resources/index.js';
import { PROMPTS, getPromptMessages } from './prompts/index.js';

const server = new Server(
  { name: 'dydyd', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {}, prompts: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_user_stats',
      description: 'Get the current user\'s XP, level, level title, and streak days',
      inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'get_level_progress',
      description: 'Get XP progress toward the next level, including percentage complete',
      inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'get_active_quests',
      description: 'List all active quests for the current user with completion status',
      inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'complete_quest',
      description: 'Mark a quest as complete. WRITE OPERATION — requires explicit user confirmation before calling.',
      inputSchema: {
        type: 'object',
        properties: {
          questId: { type: 'string', description: 'The ID of the UserQuest to complete' },
        },
        required: ['questId'],
      },
    },
    {
      name: 'get_streak_info',
      description: 'Get current streak, freeze count remaining, and last active date',
      inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'get_badge_progress',
      description: 'Get earned badges and progress toward the next badge',
      inputSchema: { type: 'object', properties: {}, required: [] },
    },
    {
      name: 'check_health_data',
      description: 'Get a summary of recent health source data (steps, sleep, calories, etc.)',
      inputSchema: { type: 'object', properties: {}, required: [] },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'get_user_stats': {
        const data = await getUserStats();
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }
      case 'get_level_progress': {
        const data = await getLevelProgress();
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }
      case 'get_active_quests': {
        const data = await getActiveQuests();
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }
      case 'complete_quest': {
        if (!args || typeof args.questId !== 'string') {
          throw new Error('questId is required');
        }
        const data = await completeQuest(args.questId);
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }
      case 'get_streak_info': {
        const data = await getStreakInfo();
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }
      case 'get_badge_progress': {
        const data = await getBadgeProgress();
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }
      case 'check_health_data': {
        const data = await checkHealthData();
        return { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] };
      }
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (err: any) {
    return {
      content: [{ type: 'text', text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

server.setRequestHandler(ListResourcesRequestSchema, async () => ({ resources: RESOURCES }));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const text = await readResource(request.params.uri);
  return { contents: [{ uri: request.params.uri, mimeType: 'application/json', text }] };
});

server.setRequestHandler(ListPromptsRequestSchema, async () => ({ prompts: PROMPTS }));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const messages = getPromptMessages(name, (args as Record<string, string>) || {});
  return { messages };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write('DYDYD MCP server running on stdio\n');
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
