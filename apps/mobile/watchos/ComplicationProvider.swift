// ============================================
// DYDYD Watch - Complication Provider
// ============================================

import SwiftUI
import WidgetKit

struct QuestProgressEntry: TimelineEntry {
    let date: Date
    let completed: Int
    let total: Int
    let todayXP: Int
    let currentStreak: Int
}

struct DYDYDComplicationProvider: TimelineProvider {
    private let userDefaults = UserDefaults(suiteName: "group.com.dydyd.app")

    func placeholder(in context: Context) -> QuestProgressEntry {
        QuestProgressEntry(date: Date(), completed: 3, total: 5, todayXP: 45, currentStreak: 7)
    }

    func getSnapshot(in context: Context, completion: @escaping (QuestProgressEntry) -> Void) {
        let entry = loadCurrentEntry()
        completion(entry)
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<QuestProgressEntry>) -> Void) {
        let entry = loadCurrentEntry()
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }

    private func loadCurrentEntry() -> QuestProgressEntry {
        guard let data = userDefaults?.data(forKey: "cachedWatchData"),
              let watchData = try? JSONDecoder().decode(WatchData.self, from: data) else {
            return QuestProgressEntry(date: Date(), completed: 0, total: 0, todayXP: 0, currentStreak: 0)
        }

        let completed = watchData.dailyQuests.filter { $0.isCompleted }.count
        return QuestProgressEntry(
            date: Date(),
            completed: completed,
            total: watchData.dailyQuests.count,
            todayXP: watchData.todayXP,
            currentStreak: watchData.currentStreak
        )
    }
}

struct CircularComplicationView: View {
    let entry: QuestProgressEntry

    private var progress: Double {
        guard entry.total > 0 else { return 0 }
        return Double(entry.completed) / Double(entry.total)
    }

    var body: some View {
        ZStack {
            AccessoryWidgetBackground()

            Gauge(value: progress) {
                Text("Q")
            } currentValueLabel: {
                Text("\(entry.completed)")
                    .font(.system(.title3, design: .rounded))
            }
            .gaugeStyle(.accessoryCircular)
            .tint(.blue)
        }
    }
}

struct RectangularComplicationView: View {
    let entry: QuestProgressEntry

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text("DYDYD")
                    .font(.caption2)
                    .foregroundColor(.secondary)
                Text("\(entry.currentStreak)d streak")
                    .font(.system(.body, design: .rounded).bold())
                Text("+\(entry.todayXP) XP today")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            Spacer()
        }
    }
}

struct DYDYDComplicationBundle: Widget {
    let kind: String = "DYDYDComplication"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DYDYDComplicationProvider()) { entry in
            if #available(watchOS 10.0, *) {
                CircularComplicationView(entry: entry)
                    .containerBackground(.fill.tertiary, for: .widget)
            } else {
                CircularComplicationView(entry: entry)
            }
        }
        .configurationDisplayName("Quest Progress")
        .description("Track your daily quest completion")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular, .accessoryInline])
    }
}
