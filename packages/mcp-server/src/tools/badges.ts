import axios from 'axios';

const api = axios.create({
  baseURL: process.env.DYDYD_API_URL || 'http://localhost:3000',
  headers: {
    Authorization: `Bearer ${process.env.DYDYD_API_TOKEN || ''}`,
    'Content-Type': 'application/json',
  },
});

export async function getBadgeProgress() {
  const [allRes, userRes] = await Promise.all([
    api.get('/api/badges'),
    api.get('/api/badges/user'),
  ]);
  const allBadges: any[] = allRes.data.data;
  const earned: any[] = userRes.data.data;
  const earnedIds = new Set(earned.map((ub: any) => ub.badgeId));
  const next = allBadges.find((b: any) => !earnedIds.has(b.id)) || null;
  return {
    totalEarned: earned.length,
    totalAvailable: allBadges.length,
    earned: earned.map((ub: any) => ({
      name: ub.badge.name,
      rarity: ub.badge.rarity,
      earnedAt: ub.earnedAt,
    })),
    nextBadge: next
      ? { name: next.name, rarity: next.rarity, requirement: next.requirementType }
      : null,
  };
}
