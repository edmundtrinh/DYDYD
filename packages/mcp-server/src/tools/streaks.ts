import axios from 'axios';

const api = axios.create({
  baseURL: process.env.DYDYD_API_URL || 'http://localhost:3000',
  headers: {
    Authorization: `Bearer ${process.env.DYDYD_API_TOKEN || ''}`,
    'Content-Type': 'application/json',
  },
});

export async function getStreakInfo() {
  const res = await api.get('/api/streaks');
  return res.data.data;
}
