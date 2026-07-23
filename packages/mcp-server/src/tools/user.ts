import axios from 'axios';

const api = axios.create({
  baseURL: process.env.DYDYD_API_URL || 'http://localhost:3000',
  headers: {
    Authorization: `Bearer ${process.env.DYDYD_API_TOKEN || ''}`,
    'Content-Type': 'application/json',
  },
});

export async function getUserStats() {
  const res = await api.get('/api/user/profile');
  const user = res.data.data;
  return {
    totalXP: user.totalXP,
    level: user.level,
    levelTitle: user.levelTitle,
    streakDays: user.currentStreak,
  };
}

export async function getLevelProgress() {
  const res = await api.get('/api/progress/level');
  const p = res.data.data;
  return {
    currentLevel: p.currentLevel,
    currentLevelXP: p.currentLevelXP,
    xpForNextLevel: p.xpForNextLevel,
    percentComplete: p.percentComplete,
    totalXP: p.totalXP,
  };
}
