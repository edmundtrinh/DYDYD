jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  setUser: jest.fn(),
  captureException: jest.fn(),
  addBreadcrumb: jest.fn(),
  withScope: jest.fn((cb: any) => cb({ setExtra: jest.fn() })),
}), { virtual: true });

import {
  initSentry,
  setUser,
  clearUser,
  captureException,
  addBreadcrumb,
} from '../sentry';

describe('Sentry monitoring', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does not crash when SENTRY_DSN is empty', () => {
    expect(() => initSentry()).not.toThrow();
  });

  it('setUser does not throw without Sentry initialized', () => {
    expect(() => setUser('user-1', 'test@test.com')).not.toThrow();
  });

  it('clearUser does not throw without Sentry initialized', () => {
    expect(() => clearUser()).not.toThrow();
  });

  it('captureException does not throw without Sentry initialized', () => {
    expect(() => captureException(new Error('test'))).not.toThrow();
  });

  it('captureException with context does not throw', () => {
    expect(() =>
      captureException(new Error('test'), { screen: 'HomeScreen' }),
    ).not.toThrow();
  });

  it('addBreadcrumb does not throw without Sentry initialized', () => {
    expect(() => addBreadcrumb('navigation', 'Opened HomeScreen')).not.toThrow();
  });

  it('addBreadcrumb accepts different levels', () => {
    expect(() => addBreadcrumb('api', 'Request failed', 'error')).not.toThrow();
    expect(() => addBreadcrumb('ui', 'Button pressed', 'info')).not.toThrow();
  });
});
