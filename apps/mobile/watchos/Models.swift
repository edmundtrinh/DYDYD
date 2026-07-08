// ============================================
// DYDYD Watch - Data Models
// ============================================
// Mirror of @dydyd/shared WatchData / WatchQuest types

import Foundation

struct WatchQuest: Identifiable, Codable {
    /// UserQuest ID — used for completion dispatch
    let id: String
    /// Quest catalog ID — for informational reference
    let questId: String
    let name: String
    let iconName: String
    let xp: Int
    var isCompleted: Bool
    var completionsToday: Int
    let maxCompletions: Int
}

struct WatchData: Codable {
    var dailyQuests: [WatchQuest]
    var todayXP: Int
    var level: Int
    var currentStreak: Int

    static let empty = WatchData(dailyQuests: [], todayXP: 0, level: 1, currentStreak: 0)
}

struct WatchSyncPayload: Codable {
    let type: String // "full_sync", "quest_update", "completion", "stats_update"
    let timestamp: Date
    let data: WatchData
}

enum WatchMessageType: String {
    case syncQuests = "SYNC_QUESTS"
    case questCompleted = "QUEST_COMPLETED"
    case syncProgress = "SYNC_PROGRESS"
    case requestSync = "REQUEST_SYNC"
    case updateComplications = "UPDATE_COMPLICATIONS"
}
