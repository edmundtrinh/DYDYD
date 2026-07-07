// ============================================
// DYDYD - Widget Data Models (Swift)
// ============================================
// Codable structs that mirror the JSON shape
// written by the React Native widgetData service.
// Field names and types must match exactly.
// ============================================

import Foundation
import WidgetKit

/// App Group identifier — must match APP_GROUP_ID in widgetData.ts
let appGroupID = "group.com.dydyd.app"

/// UserDefaults key — must match WIDGET_DATA_KEY in widgetData.ts
let widgetDataKey = "widgetData"

/// UserDefaults key for pending completions (widget -> app)
let widgetPendingCompletionsKey = "widgetPendingCompletions"

// MARK: - Data Models

struct DYDYDWidgetData: Codable {
    let dailyXP: Int
    let dailyGoal: Int
    let questsRemaining: Int
    let topQuests: [DYDYDWidgetQuest]
    let currentStreak: Int
    let lastUpdated: String  // ISO 8601 string from JS Date.toISOString()
}

struct DYDYDWidgetQuest: Codable, Identifiable {
    let id: String
    let name: String
    let iconName: String
    let xp: Int
    let isCompleted: Bool
    let progress: Double  // 0.0–1.0
}

struct PendingCompletion: Codable {
    let userQuestId: String
    let timestamp: String
}

// MARK: - Data Loading

func loadWidgetData() -> DYDYDWidgetData? {
    guard let defaults = UserDefaults(suiteName: appGroupID),
          let jsonString = defaults.string(forKey: widgetDataKey),
          let data = jsonString.data(using: .utf8) else {
        return nil
    }

    return try? JSONDecoder().decode(DYDYDWidgetData.self, from: data)
}

/// Returns placeholder data when real data is unavailable
func placeholderWidgetData() -> DYDYDWidgetData {
    return DYDYDWidgetData(
        dailyXP: 0,
        dailyGoal: 500,
        questsRemaining: 0,
        topQuests: [],
        currentStreak: 0,
        lastUpdated: ISO8601DateFormatter().string(from: Date())
    )
}

// MARK: - Pending Completions

/// Write a pending completion for the main app to process on foreground
func writePendingCompletion(userQuestId: String) {
    guard let defaults = UserDefaults(suiteName: appGroupID) else { return }

    var pending: [PendingCompletion] = []

    // Load existing pending completions
    if let jsonString = defaults.string(forKey: widgetPendingCompletionsKey),
       let data = jsonString.data(using: .utf8),
       let existing = try? JSONDecoder().decode([PendingCompletion].self, from: data) {
        pending = existing
    }

    // Append new completion
    let completion = PendingCompletion(
        userQuestId: userQuestId,
        timestamp: ISO8601DateFormatter().string(from: Date())
    )
    pending.append(completion)

    // Write back
    if let encoded = try? JSONEncoder().encode(pending),
       let jsonString = String(data: encoded, encoding: .utf8) {
        defaults.set(jsonString, forKey: widgetPendingCompletionsKey)
    }
}
