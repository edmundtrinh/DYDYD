// ============================================
// DYDYD - Large Widget
// ============================================
// Full daily dashboard: XP progress, streak,
// all top quests with interactive completion,
// and a motivational footer.
// System large widget size (~329x345 pt).
// ============================================

import SwiftUI
import WidgetKit

struct DYDYDLargeWidget: Widget {
    let kind = "DYDYDLargeWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DYDYDTimelineProvider()) { entry in
            LargeWidgetView(entry: entry)
                .containerBackground(Color(hex: "#0F0F1A"), for: .widget)
        }
        .configurationDisplayName("DYDYD Dashboard")
        .description("Full daily dashboard with quests, XP, and streak.")
        .supportedFamilies([.systemLarge])
    }
}

// MARK: - View

struct LargeWidgetView: View {
    let entry: DYDYDTimelineEntry

    private var xpProgress: Double {
        guard entry.widgetData.dailyGoal > 0 else { return 0 }
        return min(Double(entry.widgetData.dailyXP) / Double(entry.widgetData.dailyGoal), 1.0)
    }

    private var completedCount: Int {
        entry.widgetData.topQuests.filter { $0.isCompleted }.count
    }

    private var totalQuests: Int {
        entry.widgetData.topQuests.count + entry.widgetData.questsRemaining
            - entry.widgetData.topQuests.filter { !$0.isCompleted }.count
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header: App name + date
            HStack {
                Text("DYDYD")
                    .font(.system(size: 13, weight: .bold))
                    .foregroundColor(Color(hex: "#8B8BA3"))
                    .tracking(2)

                Spacer()

                Text(Date(), style: .date)
                    .font(.system(size: 11, weight: .medium))
                    .foregroundColor(Color(hex: "#8B8BA3"))
            }

            // Stats row: XP ring + Streak + Quests done
            HStack(spacing: 16) {
                // XP Progress Ring
                ZStack {
                    Circle()
                        .stroke(Color(hex: "#2A2A3E"), lineWidth: 5)
                    Circle()
                        .trim(from: 0, to: xpProgress)
                        .stroke(
                            Color(hex: "#F5B400"),
                            style: StrokeStyle(lineWidth: 5, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))

                    VStack(spacing: 1) {
                        Text("\(entry.widgetData.dailyXP)")
                            .font(.system(size: 16, weight: .bold, design: .rounded))
                            .foregroundColor(Color(hex: "#F5B400"))
                        Text("/ \(entry.widgetData.dailyGoal)")
                            .font(.system(size: 8, weight: .medium, design: .monospaced))
                            .foregroundColor(Color(hex: "#8B8BA3"))
                    }
                }
                .frame(width: 60, height: 60)

                // Streak card
                StatCard(
                    emoji: "\u{1F525}",
                    value: "\(entry.widgetData.currentStreak)",
                    label: "day streak"
                )

                // Quests completed card
                StatCard(
                    emoji: "\u{2705}",
                    value: "\(completedCount)/\(totalQuests)",
                    label: "quests done"
                )
            }

            // Divider
            Rectangle()
                .fill(Color(hex: "#2A2A3E"))
                .frame(height: 1)

            // Quest list header
            HStack {
                Text("Today's Quests")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundColor(.white)

                Spacer()

                if entry.widgetData.questsRemaining > 0 {
                    Text("\(entry.widgetData.questsRemaining) remaining")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(Color(hex: "#8B8BA3"))
                } else {
                    Text("All done! \u{1F389}")
                        .font(.system(size: 11, weight: .medium))
                        .foregroundColor(Color(hex: "#2EA043"))
                }
            }

            // Quest list
            if entry.widgetData.topQuests.isEmpty {
                VStack(spacing: 6) {
                    Text("\u{1F3AF}")
                        .font(.system(size: 28))
                    Text("No active quests")
                        .font(.system(size: 13, weight: .medium))
                        .foregroundColor(Color(hex: "#8B8BA3"))
                    Text("Open DYDYD to add quests")
                        .font(.system(size: 11))
                        .foregroundColor(Color(hex: "#8B8BA3"))
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            } else {
                VStack(spacing: 8) {
                    ForEach(entry.widgetData.topQuests) { quest in
                        if #available(iOS 17.0, *) {
                            LargeQuestRowView(quest: quest)
                        } else {
                            LargeQuestRowViewNonInteractive(quest: quest)
                        }
                    }
                }
            }

            Spacer()

            // Footer: motivational text based on progress
            HStack {
                Spacer()
                Text(motivationalText)
                    .font(.system(size: 10, weight: .medium))
                    .foregroundColor(Color(hex: "#8B8BA3"))
                    .italic()
                Spacer()
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var motivationalText: String {
        if entry.widgetData.questsRemaining == 0 && !entry.widgetData.topQuests.isEmpty {
            return "All quests complete! You're crushing it \u{1F4AA}"
        } else if xpProgress >= 0.75 {
            return "Almost at your XP goal -- keep going!"
        } else if entry.widgetData.currentStreak >= 7 {
            return "\(entry.widgetData.currentStreak)-day streak! Don't break the chain \u{1F525}"
        } else {
            return "Every quest completed is XP earned \u{2B50}"
        }
    }
}

// MARK: - Stat Card

struct StatCard: View {
    let emoji: String
    let value: String
    let label: String

    var body: some View {
        VStack(spacing: 4) {
            Text(emoji)
                .font(.system(size: 14))
            Text(value)
                .font(.system(size: 18, weight: .bold, design: .rounded))
                .foregroundColor(.white)
            Text(label)
                .font(.system(size: 9, weight: .medium))
                .foregroundColor(Color(hex: "#8B8BA3"))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(Color(hex: "#1A1A2E"))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color(hex: "#2A2A3E"), lineWidth: 1)
                )
        )
    }
}

// MARK: - Large Quest Row (Interactive, iOS 17+)

@available(iOS 17.0, *)
struct LargeQuestRowView: View {
    let quest: DYDYDWidgetQuest

    var body: some View {
        HStack(spacing: 10) {
            // Check button
            if quest.isCompleted {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 20))
                    .foregroundColor(Color(hex: "#2EA043"))
            } else {
                Button(intent: CompleteQuestIntent(questId: quest.id)) {
                    Image(systemName: "circle")
                        .font(.system(size: 20))
                        .foregroundColor(Color(hex: "#8B8BA3"))
                }
                .buttonStyle(.plain)
            }

            // Quest info
            VStack(alignment: .leading, spacing: 2) {
                Text(quest.name)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(quest.isCompleted ? Color(hex: "#8B8BA3") : .white)
                    .strikethrough(quest.isCompleted)
                    .lineLimit(1)

                // Progress bar (for partial completion)
                if !quest.isCompleted && quest.progress > 0 {
                    GeometryReader { geometry in
                        ZStack(alignment: .leading) {
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color(hex: "#2A2A3E"))
                                .frame(height: 4)
                            RoundedRectangle(cornerRadius: 2)
                                .fill(Color(hex: "#F5B400"))
                                .frame(width: geometry.size.width * quest.progress, height: 4)
                        }
                    }
                    .frame(height: 4)
                }
            }

            Spacer()

            // XP badge
            Text("+\(quest.xp)")
                .font(.system(size: 11, weight: .bold, design: .monospaced))
                .foregroundColor(Color(hex: "#F5B400").opacity(quest.isCompleted ? 0.4 : 1.0))
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(
                    Capsule()
                        .fill(Color(hex: "#F5B400").opacity(0.1))
                )
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(Color(hex: "#1A1A2E"))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color(hex: "#2A2A3E"), lineWidth: 1)
                )
        )
    }
}

// MARK: - Large Quest Row (Non-interactive, < iOS 17)

struct LargeQuestRowViewNonInteractive: View {
    let quest: DYDYDWidgetQuest

    var body: some View {
        HStack(spacing: 10) {
            Image(systemName: quest.isCompleted ? "checkmark.circle.fill" : "circle")
                .font(.system(size: 20))
                .foregroundColor(quest.isCompleted ? Color(hex: "#2EA043") : Color(hex: "#8B8BA3"))

            VStack(alignment: .leading, spacing: 2) {
                Text(quest.name)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundColor(quest.isCompleted ? Color(hex: "#8B8BA3") : .white)
                    .strikethrough(quest.isCompleted)
                    .lineLimit(1)
            }

            Spacer()

            Text("+\(quest.xp)")
                .font(.system(size: 11, weight: .bold, design: .monospaced))
                .foregroundColor(Color(hex: "#F5B400").opacity(quest.isCompleted ? 0.4 : 1.0))
                .padding(.horizontal, 8)
                .padding(.vertical, 3)
                .background(
                    Capsule()
                        .fill(Color(hex: "#F5B400").opacity(0.1))
                )
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 8)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(Color(hex: "#1A1A2E"))
                .overlay(
                    RoundedRectangle(cornerRadius: 10)
                        .stroke(Color(hex: "#2A2A3E"), lineWidth: 1)
                )
        )
    }
}

// MARK: - Preview

#if DEBUG
struct LargeWidgetView_Previews: PreviewProvider {
    static var previews: some View {
        LargeWidgetView(entry: DYDYDTimelineEntry(
            date: Date(),
            widgetData: DYDYDWidgetData(
                dailyXP: 320,
                dailyGoal: 500,
                questsRemaining: 2,
                topQuests: [
                    DYDYDWidgetQuest(id: "1", name: "Morning Workout", iconName: "figure.run", xp: 50, isCompleted: true, progress: 1.0),
                    DYDYDWidgetQuest(id: "2", name: "Read 30 Minutes", iconName: "book", xp: 30, isCompleted: true, progress: 1.0),
                    DYDYDWidgetQuest(id: "3", name: "Drink 8 Glasses of Water", iconName: "drop", xp: 20, isCompleted: false, progress: 0.6),
                ],
                currentStreak: 14,
                lastUpdated: ISO8601DateFormatter().string(from: Date())
            )
        ))
        .previewContext(WidgetPreviewContext(family: .systemLarge))
    }
}
#endif
