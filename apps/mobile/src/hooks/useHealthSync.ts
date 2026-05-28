import { useCallback } from 'react';

export const useHealthSync = () => {
  const initializeHealthSync = useCallback(() => {
    // TODO: Phase 2 — Wire up HealthKit (iOS) and Google Fit (Android)
  }, []);

  return { initializeHealthSync };
};
