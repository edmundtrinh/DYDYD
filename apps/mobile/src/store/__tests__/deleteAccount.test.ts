import configureStore from 'redux-mock-store';
import { deleteAccount } from '../slices/userSlice';
import { userService } from '../../services/api/userService';

jest.mock('../../services/api/userService', () => ({
  userService: {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
    updateSettings: jest.fn(),
    updateCategoryPriorities: jest.fn(),
    deleteAccount: jest.fn(),
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

describe('deleteAccount thunk', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('dispatches pending and fulfilled on success', async () => {
    (userService.deleteAccount as jest.Mock).mockResolvedValue(undefined);

    const store = mockStore({ user: { profile: null } });
    await store.dispatch(deleteAccount('mypassword123') as any);

    const types = store.getActions().map((a: any) => a.type);
    expect(types).toContain('user/deleteAccount/pending');
    expect(types).toContain('user/deleteAccount/fulfilled');
  });

  it('calls userService.deleteAccount with password', async () => {
    (userService.deleteAccount as jest.Mock).mockResolvedValue(undefined);

    const store = mockStore({ user: { profile: null } });
    await store.dispatch(deleteAccount('secret123') as any);

    expect(userService.deleteAccount).toHaveBeenCalledWith('secret123');
  });

  it('dispatches rejected on wrong password', async () => {
    (userService.deleteAccount as jest.Mock).mockRejectedValue(
      new Error('Incorrect password'),
    );

    const store = mockStore({ user: { profile: null } });
    await store.dispatch(deleteAccount('wrongpassword') as any);

    const types = store.getActions().map((a: any) => a.type);
    expect(types).toContain('user/deleteAccount/rejected');
  });
});
