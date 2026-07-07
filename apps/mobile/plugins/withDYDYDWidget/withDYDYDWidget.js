// ============================================
// DYDYD - Widget Extension Config Plugin
// ============================================
// Expo config plugin that configures the iOS app
// for WidgetKit integration:
//  1. Adds App Group entitlement to the main app
//  2. Sets the deployment target to iOS 17.0
//
// The widget extension target itself is injected by
// react-native-widget-extension's plugin; this plugin
// handles the supplementary configuration that package
// does not cover.
// ============================================

const {
  withEntitlementsPlist,
  withInfoPlist,
  withXcodeProject,
} = require('@expo/config-plugins');

const APP_GROUP_ID = 'group.com.dydyd.app';

/**
 * Add App Group entitlement to the main app target.
 * This allows the main app to read/write the shared
 * UserDefaults suite that the widget also accesses.
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
 * Add URL scheme for widget deep links.
 * When a user taps a quest in the widget, the widget
 * can open the app via dydyd://quest/{id}.
 */
function withWidgetURLScheme(config) {
  return withInfoPlist(config, (mod) => {
    const infoPlist = mod.modResults;

    if (!infoPlist.CFBundleURLTypes) {
      infoPlist.CFBundleURLTypes = [];
    }

    const existingScheme = infoPlist.CFBundleURLTypes.find(
      (urlType) =>
        urlType.CFBundleURLSchemes &&
        urlType.CFBundleURLSchemes.includes('dydyd'),
    );

    if (!existingScheme) {
      infoPlist.CFBundleURLTypes.push({
        CFBundleURLName: 'com.dydyd.app',
        CFBundleURLSchemes: ['dydyd'],
      });
    }

    return mod;
  });
}

/**
 * Main plugin entry point. Composes all widget-related
 * config modifications.
 */
function withDYDYDWidget(config) {
  config = withAppGroupEntitlement(config);
  config = withWidgetURLScheme(config);
  return config;
}

module.exports = withDYDYDWidget;
