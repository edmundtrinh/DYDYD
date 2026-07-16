// ============================================
// OTA Updates Hook — EAS Update integration
// ============================================
//
// Checks for over-the-air updates on app launch.
// Downloads in the background; applies on next cold start.
// No-op in development builds and Expo Go.

import { useEffect, useCallback, useRef } from 'react';
import * as Updates from 'expo-updates';

export interface OTAUpdateStatus {
  /** Whether an update is currently being checked/downloaded */
  isChecking: boolean;
  /** Whether an update has been downloaded and is pending restart */
  isUpdatePending: boolean;
  /** Error message if check/download failed */
  error: string | null;
}

/**
 * Hook that checks for OTA updates on mount and provides
 * manual check/apply capabilities.
 *
 * - Skips entirely in __DEV__ mode or when expo-updates is disabled
 * - Downloads updates in the background without interrupting the user
 * - Does NOT force-reload; the update applies on the next app restart
 */
export function useOTAUpdates(): {
  status: OTAUpdateStatus;
  checkForUpdate: () => Promise<void>;
} {
  const isCheckingRef = useRef(false);
  // We use refs for the status and a force-update counter to avoid
  // re-renders on every status change (background operation).
  const statusRef = useRef<OTAUpdateStatus>({
    isChecking: false,
    isUpdatePending: false,
    error: null,
  });

  const checkForUpdate = useCallback(async () => {
    // Guard: no-op in dev mode or when updates are disabled
    if (__DEV__) {
      return;
    }

    // Prevent concurrent checks
    if (isCheckingRef.current) {
      return;
    }

    try {
      // expo-updates may not be enabled in certain build configurations
      if (!Updates.isEnabled) {
        return;
      }

      isCheckingRef.current = true;
      statusRef.current = {
        ...statusRef.current,
        isChecking: true,
        error: null,
      };

      const checkResult = await Updates.checkForUpdateAsync();

      if (checkResult.isAvailable) {
        // Download the update in the background
        await Updates.fetchUpdateAsync();

        statusRef.current = {
          isChecking: false,
          isUpdatePending: true,
          error: null,
        };

        // Note: We intentionally do NOT call Updates.reloadAsync() here.
        // The update will apply on the next natural app restart.
        // This avoids jarring the user mid-session.
        if (!__DEV__) {
          console.log('[OTA] Update downloaded, will apply on next restart');
        }
      } else {
        statusRef.current = {
          isChecking: false,
          isUpdatePending: false,
          error: null,
        };
      }
    } catch (error) {
      // Gracefully handle all failure modes:
      // - Network offline
      // - Timeout
      // - Invalid update bundle
      // - expo-updates not configured
      const message =
        error instanceof Error ? error.message : 'Unknown update error';

      statusRef.current = {
        isChecking: false,
        isUpdatePending: false,
        error: message,
      };

      if (!__DEV__) {
        console.warn('[OTA] Update check failed:', message);
      }
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  // Check for updates on mount (app launch)
  useEffect(() => {
    checkForUpdate();
  }, [checkForUpdate]);

  return {
    status: statusRef.current,
    checkForUpdate,
  };
}
