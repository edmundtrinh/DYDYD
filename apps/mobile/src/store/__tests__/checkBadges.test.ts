import configureStore from 'redux-mock-store';
import { checkBadges } from '../slices/progressSlice';
import { progressService } from '../../services/api/progressService';

jest.mock('../../services/api/progressService', () => ({
  progressService: {
    getUserStats: jest.fn(),
    getDailyProgress: jest.fn(),
    getWeeklyProgress: jest.fn(),
    getEarnedBadges: jest.fn(),
    getLeaderboard: jest.fn(),
    getStreaks: jest.fn(),
    checkBadges: jest.fn(),
  },
}));

const thunkMiddleware: any =
  ({ dispatch, getState }: any) =>
  (next: any) =>
  (action: any) => {
    if (typeof action === 'function') return action(dispatch, getState, undefined);
    return next(action);
  };

const mockStore = configureStore([thunkMiddleware]);

describe('checkBadges thunk', () => {
  it('dispatches pending and fulfilled on success', async () => {
    const mockBadges = [
      { id: 'ub1', badgeId: 'b1', badge: { name: 'First Steps' }, earnedAt: '2026-06-09' },
    ];
    (progressService.checkBadges as jest.Mock).mockResolvedValue(mockBadges);

    const store = mockStore({
      progress: {
        earnedBadges: [],
        newBadgeIds: [],
      },
    });

    await store.dispatch(checkBadges() as any);

    const actions = store.getActions();
    const types = actions.map((a: any) => a.type);
    expect(types).toContain('progress/checkBadges/pending');
    expect(types).toContain('progress/checkBadges/fulfilled');
  });

  it('dispatches rejected on failure', async () => {
    (progressService.checkBadges as jest.Mock).mockRejectedValue(
      new Error('Network error'),
    );

    const store = mockStore({
      progress: {
        earnedBadges: [],
        newBadgeIds: [],
      },
    });

    await store.dispatch(checkBadges() as any);

    const actions = store.getActions();
    const types = actions.map((a: any) => a.type);
    expect(types).toContain('progress/checkBadges/pending');
    expect(types).toContain('progress/checkBadges/rejected');
  });

  it('calls progressService.checkBadges', async () => {
    (progressService.checkBadges as jest.Mock).mockResolvedValue([]);

    const store = mockStore({
      progress: { earnedBadges: [], newBadgeIds: [] },
    });

    await store.dispatch(checkBadges() as any);
    expect(progressService.checkBadges).toHaveBeenCalled();
  });
});
