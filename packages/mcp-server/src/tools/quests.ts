import axios from 'axios';

const api = axios.create({
  baseURL: process.env.DYDYD_API_URL || 'http://localhost:3000',
  headers: {
    Authorization: `Bearer ${process.env.DYDYD_API_TOKEN || ''}`,
    'Content-Type': 'application/json',
  },
});

export async function getActiveQuests() {
  const res = await api.get('/api/quests/user');
  return res.data.data;
}

export async function completeQuest(questId: string) {
  const res = await api.post(`/api/quests/${questId}/complete`, {});
  return res.data.data;
}
