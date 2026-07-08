// ============================================
// DYDYD - Watch Extension Config Plugin
// ============================================
// Expo config plugin that configures the iOS app
// for Apple Watch companion integration:
//  1. Adds WatchConnectivity framework entitlement
//  2. Adds HealthKit entitlement for Watch
//  3. Adds App Group entitlement (shared data between app + Watch)
//  4. Adds WatchOS app target reference to Xcode project
//
// The watchOS app target itself must be added manually
// in Xcode or via EAS build hooks; this plugin handles
// the supplementary entitlements and configuration that
// enable communication between the phone app and Watch.
// ============================================

const {
  withEntitlementsPlist,
  withInfoPlist,
  withXcodeProject,
} = require('@expo/config-plugins');

const APP_GROUP_ID = 'group.com.dydyd.app';

/**
 * Add App Group entitlement to the main app target.
 * This allows the main app and the Watch extension to
 * share data via the shared UserDefaults suite.
 */
function withAppGroupEntitlement(config) {
  return withEntitlementsPlist(config, (mod) => {
    const entitlements = mod.modResults;

    // Add App Group capability
    if (!entitlements['com.apple.security.application-groups']) {
      entitlements['com.apple.security.application-groups'] = [];
    }

    const groups = entitlements['com.apple.security.application-groups'];
    if (!groups.includes(APP_GROUP_ID)) {
      groups.push(APP_GROUP_ID);
    }

    return mod;
  });
}

/**
 * Add HealthKit entitlement for Watch companion.
 * The Watch app needs HealthKit access for auto-completing
 * health-related quests (steps, active energy, sleep, etc.).
 */
function withHealthKitEntitlement(config) {
  return withEntitlementsPlist(config, (mod) => {
    const entitlements = mod.modResults;

    // Enable HealthKit capability
    if (!entitlements['com.apple.developer.healthkit']) {
      entitlements['com.apple.developer.healthkit'] = true;
    }

    if (!entitlements['com.apple.developer.healthkit.access']) {
      entitlements['com.apple.developer.healthkit.access'] = [];
    }

    return mod;
  });
}

/**
 * Add WatchConnectivity usage description to Info.plist.
 * Required for apps that communicate with a paired Apple Watch.
 */
function withWatchConnectivityInfo(config) {
  return withInfoPlist(config, (mod) => {
    const infoPlist = mod.modResults;

    // Declare that this app has a Watch companion
    infoPlist.WKCompanionAppBundleIdentifier = 'com.dydyd.app';

    // Add HealthKit usage description if not already present (required by Apple)
    if (!infoPlist.NSHealthShareUsageDescription) {
      infoPlist.NSHealthShareUsageDescription =
        'DYDYD uses health data to automatically track quest progress for steps, workouts, sleep, and mindfulness.';
    }

    return mod;
  });
}

/**
 * Add WatchConnectivity framework to the Xcode project.
 * This framework is required for bidirectional communication
 * between the iPhone app and the Watch app.
 */
function withWatchConnectivityFramework(config) {
  return withXcodeProject(config, (mod) => {
    const project = mod.modResults;

    // Find the main app target
    const targetKey = project.getFirstTarget()?.uuid;
    if (targetKey) {
      // Add WatchConnectivity.framework
      project.addFramework('WatchConnectivity.framework', {
        target: targetKey,
        link: true,
      });
    }

    return mod;
  });
}

/**
 * Main plugin entry point. Composes all Watch-related
 * config modifications.
 */
function withDYDYDWatch(config) {
  config = withAppGroupEntitlement(config);
  config = withHealthKitEntitlement(config);
  config = withWatchConnectivityInfo(config);
  config = withWatchConnectivityFramework(config);
  return config;
}

module.exports = withDYDYDWatch;
