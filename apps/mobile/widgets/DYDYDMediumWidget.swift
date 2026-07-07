// ============================================
// DYDYD - Medium Widget
// ============================================
// Shows top 3 daily quests with interactive
// check buttons (iOS 17+ App Intents).
// System medium widget size (~329x155 pt).
// ============================================

import SwiftUI
import WidgetKit
import AppIntents

// MARK: - Widget Configuration

struct DYDYDMediumWidget: Widget {
    let kind = "DYDYDMediumWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DYDYDTimelineProvider()) { entry in
            MediumWidgetView(entry: entry)
                .containerBackground(Color(hex: "#0F0F1A"), for: .widget)
        }
        .configurationDisplayName("DYDYD Quests")
        .description("See and complete your top daily quests.")
        .supportedFamilies([.systemMedium])
    }
}

// MARK: - App Intent for Quest Completion

@available(iOS 17.0, *)
struct CompleteQuestIntent: AppIntent {
    static var title: LocalizedStringResource = "Complete Quest"
    static var description: IntentDescription = "Mark a quest as complete"

    @Parameter(title: "Quest ID")
    var questId: String

    init() {}

    init(questId: String) {
        self.questId = questId
    }

    func perform() async throws -> some IntentResult {
        // Write pending completion to shared UserDefaults
        // The main app will drain this on next foreground
        writePendingCompletion(userQuestId: questId)

        // Optimistically update the widget data to show completed state
        if let defaults = UserDefaults(suiteName: appGroupID),
           let jsonString = defaults.string(forKey: widgetDataKey),
           let data = jsonString.data(using: .utf8),
           var widgetData = try? JSONDecoder().decode(DYDYDWidgetData.self, from: data) {

            // Create updated quests with this one marked complete
            let updatedQuests = widgetData.topQuests.map { quest in
                if quest.id == questId {
                    return DYDYDWidgetQuest(
                        id: quest.id,
                        name: quest.name,
                        iconName: quest.iconName,
                        xp: quest.xp,
                        isCompleted: true,
                        progress: 1.0
                    )
                }
                return quest
            }

            // Recalculate derived values
            let updatedData = DYDYDWidgetData(
                dailyXP: widgetData.dailyXP + (widgetData.topQuests.first { $0.id == questId }?.xp ?? 0),
                dailyGoal: widgetData.dailyGoal,
                questsRemaining: max(0, widgetData.questsRemaining - 1),
                topQuests: updatedQuests,
                currentStreak: widgetData.currentStreak,
                lastUpdated: ISO8601DateFormatter().string(from: Date())
            )

            // Write optimistic update
            if let encoded = try? JSONEncoder().encode(updatedData),
               let jsonStr = String(data: encoded, encoding: .utf8) {
                defaults.set(jsonStr, forKey: widgetDataKey)
            }
        }

        // Reload the widget timeline to reflect the change
        WidgetCenter.shared.reloadAllTimelines()

        return .result()
    }
}

// MARK: - View

struct MediumWidgetView: View {
    let entry: DYDYDTimelineEntry

    var body: some View {
        HStack(spacing: 12) {
            // Left: Streak + XP summary
            VStack(alignment: .leading, spacing: 8) {
                // App name
                Text("DYDYD")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(Color(hex: "#8B8BA3"))
                    .tracking(1.5)

                Spacer()

                // Streak
                HStack(spacing: 4) {
                    Text("\u{1F525}")
                        .font(.system(size: 16))
                    Text("\(entry.widgetData.currentStreak)")
                        .font(.system(size: 24, weight: .bold, design: .rounded))
                        .foregroundColor(.white)
                }

                // XP today
                HStack(spacing: 4) {
                    Text("\u{2B50}")
                        .font(.system(size: 12))
                    Text("\(entry.widgetData.dailyXP) XP")
                        .font(.system(size: 13, weight: .semibold, design: .monospaced))
                        .foregroundColor(Color(hex: "#F5B400"))
                }

                Spacer()
            }
            .frame(width: 80)

            // Divider
            Rectangle()
                .fill(Color(hex: "#2A2A3E"))
                .frame(width: 1)

            // Right: Quest list
            VStack(alignment: .leading, spacing: 6) {
                if entry.widgetData.topQuests.isEmpty {
                    // Empty state
                    VStack(spacing: 4) {
                        Text("\u{1F3AF}")
                            .font(.system(size: 24))
                        Text("No quests today")
                            .font(.system(size: 12, weight: .medium))
                            .foregroundColor(Color(hex: "#8B8BA3"))
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ForEach(entry.widgetData.topQuests) { quest in
                        if #available(iOS 17.0, *) {
                            QuestRowView(quest: quest)
                        } else {
                            QuestRowViewNonInteractive(quest: quest)
                        }
                    }

                    if entry.widgetData.questsRemaining > 3 {
                        Text("+\(entry.widgetData.questsRemaining - 3) more")
                            .font(.system(size: 10, weight: .medium))
                            .foregroundColor(Color(hex: "#8B8BA3"))
                    }
                }
            }
            .frame(maxWidth: .infinity)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Quest Row (Interactive, iOS 17+)

@available(iOS 17.0, *)
struct QuestRowView: View {
    let quest: DYDYDWidgetQuest

    var body: some View {
        HStack(spacing: 8) {
            // Check button (interactive)
            if quest.isCompleted {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 18))
                    .foregroundColor(Color(hex: "#2EA043"))
            } else {
                Button(intent: CompleteQuestIntent(questId: quest.id)) {
                    Image(systemName: "circle")
                        .font(.system(size: 18))
                        .foregroundColor(Color(hex: "#8B8BA3"))
                }
                .buttonStyle(.plain)
            }

            // Quest info
            VStack(alignment: .leading, spacing: 1) {
                Text(quest.name)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(quest.isCompleted ? Color(hex: "#8B8BA3") : .white)
                    .strikethrough(quest.isCompleted)
                    .lineLimit(1)

                Text("+\(quest.xp) XP")
                    .font(.system(size: 10, weight: .medium, design: .monospaced))
                    .foregroundColor(Color(hex: "#F5B400").opacity(quest.isCompleted ? 0.5 : 1.0))
            }

            Spacer()
        }
    }
}

// MARK: - Quest Row (Non-interactive, < iOS 17)

struct QuestRowViewNonInteractive: View {
    let quest: DYDYDWidgetQuest

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: quest.isCompleted ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 18))
                .foregroundColor(quest.isCompleted ? Color(hex: "#2EA043") : Color(hex: "#8B8BA3"))

            VStack(alignment: .leading, spacing: 1) {
                Text(quest.name)
                    .font(.system(size: 12, weight: .medium))
                    .foregroundColor(quest.isCompleted ? Color(hex: "#8B8BA3") : .white)
                    .strikethrough(quest.isCompleted)
                    .lineLimit(1)

                Text("+\(quest.xp) XP")
                    .font(.system(size: 10, weight: .medium, design: .monospaced))
                    .foregroundColor(Color(hex: "#F5B400").opacity(quest.isCompleted ? 0.5 : 1.0))
            }

            Spacer()
        }
    }
}

// MARK: - Preview

#if DEBUG
struct MediumWidgetView_Previews: PreviewProvider {
    static var previews: some View {
        MediumWidgetView(entry: DYDYDTimelineEntry(
            date: Date(),
            widgetData: DYDYDWidgetData(
                dailyXP: 150,
                dailyGoal: 500,
                questsRemaining: 5,
                topQuests: [
                    DYDYDWidgetQuest(id: "1", name: "Morning Workout", iconName: "figure.run", xp: 50, isCompleted: true, progress: 1.0),
                    DYDYDWidgetQuest(id: "2", name: "Read 30 Minutes", iconName: "book", xp: 30, isCompleted: false, progress: 0.0),
                    DYDYDWidgetQuest(id: "3", name: "Drink 8 Glasses", iconName: "drop", xp: 20, isCompleted: false, progress: 0.5),
                ],
                currentStreak: 14,
                lastUpdated: ISO8601DateFormatter().string(from: Date())
            )
        ))
        .previewContext(WidgetPreviewContext(family: .systemMedium))
    }
}
#endif
