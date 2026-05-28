import { useCallback } from 'react';

export const useWatchConnectivity = () => {
  const initializeWatch = useCallback(() => {
    // TODO: Phase 2 — Wire up Apple Watch and Wear OS connectivity
  }, []);

  return { initializeWatch };
};
