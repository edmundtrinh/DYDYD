import axios from 'axios';

const api = axios.create({
  baseURL: process.env.DYDYD_API_URL || 'http://localhost:3000',
  headers: {
    Authorization: `Bearer ${process.env.DYDYD_API_TOKEN || ''}`,
    'Content-Type': 'application/json',
  },
});

export const RESOURCES = [
  {
    uri: 'user://profile',
    name: 'User Profile',
    description: 'Current user profile including XP, level, and streak',
    mimeType: 'application/json',
  },
  {
    uri: 'quests://active',
    name: 'Active Quests',
    description: 'List of the user\'s currently active quests',
    mimeType: 'application/json',
  },
  {
    uri: 'badges://earned',
    name: 'Earned Badges',
    description: 'Badges the user has earned so far',
    mimeType: 'application/json',
  },
];

export async function readResource(uri: string): Promise<string> {
  switch (uri) {
    case 'user://profile': {
      const res = await api.get('/api/user/profile');
      return JSON.stringify(res.data.data, null, 2);
    }
    case 'quests://active': {
      const res = await api.get('/api/quests/user');
      return JSON.stringify(res.data.data, null, 2);
    }
    case 'badges://earned': {
      const res = await api.get('/api/badges/user');
      return JSON.stringify(res.data.data, null, 2);
    }
    default:
      throw new Error(`Unknown resource: ${uri}`);
  }
}
