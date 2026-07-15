import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Hook that tracks the device's "Reduce Motion" accessibility setting.
 * Returns `true` when the user has enabled reduced motion in system settings.
 *
 * Usage:
 *   const reduceMotion = useReducedMotion();
 *   // Skip or simplify animations when reduceMotion is true
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotion,
    );

    return () => {
      subscription.remove();
    };
  }, []);

  return reduceMotion;
}
