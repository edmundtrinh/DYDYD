// ============================================
// DYDYD - Widget Module Type Declarations
// ============================================
// Type declarations for iOS widget-related
// packages that don't ship their own types.
// ============================================

declare module 'react-native-widgetkit' {
  interface WidgetKit {
    /**
     * Reload all widget timelines. Causes WidgetKit to call
     * getTimeline on all registered TimelineProviders.
     */
    reloadAllTimelines(): void;

    /**
     * Reload timelines for a specific widget kind.
     * @param ofKind The widget kind string (matches Widget.kind in Swift)
     */
    reloadTimelines(ofKind: string): void;

    /**
     * Write a string value to the App Group UserDefaults.
     * @param key The UserDefaults key
     * @param value The string value (JSON.stringify objects)
     * @param appGroup The App Group identifier
     */
    setItem(key: string, value: string, appGroup: string): Promise<void>;

    /**
     * Read a string value from the App Group UserDefaults.
     * @param key The UserDefaults key
     * @param appGroup The App Group identifier
     * @returns The stored string value, or null if not found
     */
    getItem(key: string, appGroup: string): Promise<string | null>;
  }

  const widgetKit: WidgetKit;
  export default widgetKit;
}

declare module 'react-native-widget-extension' {
  // This module is primarily a config plugin.
  // The JS API is limited to Live Activities (not used here).
  const widgetExtension: Record<string, unknown>;
  export default widgetExtension;
}
