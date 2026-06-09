import { useCallback } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';
import { useAppSelector } from '../store/hooks';
import { selectUserSettings } from '../store/slices/userSlice';

type HapticType = 'impactLight' | 'impactMedium' | 'impactHeavy' | 'notificationSuccess' | 'notificationWarning' | 'notificationError';

export const useHaptic = () => {
  const settings = useAppSelector(selectUserSettings);
  const enabled = settings?.hapticFeedbackEnabled ?? true;

  const trigger = useCallback(
    (type: HapticType = 'impactLight') => {
      if (!enabled) return;
      try {
        ReactNativeHapticFeedback.trigger(type, {
          enableVibrateFallback: true,
          ignoreAndroidSystemSettings: false,
        });
      } catch {
        // Graceful fallback on unsupported platforms
      }
    },
    [enabled],
  );

  return { trigger };
};
