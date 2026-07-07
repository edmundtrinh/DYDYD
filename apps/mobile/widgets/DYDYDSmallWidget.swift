// ============================================
// DYDYD - Small Widget
// ============================================
// Shows streak count + XP progress ring.
// System small widget size (~155x155 pt).
// ============================================

import SwiftUI
import WidgetKit

struct DYDYDSmallWidget: Widget {
    let kind = "DYDYDSmallWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DYDYDTimelineProvider()) { entry in
            SmallWidgetView(entry: entry)
                .containerBackground(Color(hex: "#0F0F1A"), for: .widget)
        }
        .configurationDisplayName("DYDYD Streak")
        .description("See your streak and daily XP progress.")
        .supportedFamilies([.systemSmall])
    }
}

// MARK: - View

struct SmallWidgetView: View {
    let entry: DYDYDTimelineEntry

    private var xpProgress: Double {
        guard entry.widgetData.dailyGoal > 0 else { return 0 }
        return min(Double(entry.widgetData.dailyXP) / Double(entry.widgetData.dailyGoal), 1.0)
    }

    var body: some View {
        VStack(spacing: 8) {
            // XP Progress Ring
            ZStack {
                // Background ring
                Circle()
                    .stroke(Color(hex: "#2A2A3E"), lineWidth: 6)

                // Progress ring
                Circle()
                    .trim(from: 0, to: xpProgress)
                    .stroke(
                        Color(hex: "#F5B400"),
                        style: StrokeStyle(lineWidth: 6, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))

                // Center content
                VStack(spacing: 2) {
                    Text("\(entry.widgetData.dailyXP)")
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                        .foregroundColor(Color(hex: "#F5B400"))
                    Text("XP")
                        .font(.system(size: 10, weight: .medium))
                        .foregroundColor(Color(hex: "#8B8BA3"))
                }
            }
            .frame(width: 70, height: 70)

            // Streak
            HStack(spacing: 4) {
                Text("\u{1F525}")
                    .font(.system(size: 14))
                Text("\(entry.widgetData.currentStreak) day streak")
                    .font(.system(size: 12, weight: .semibold))
                    .foregroundColor(.white)
            }

            // Quests remaining
            Text("\(entry.widgetData.questsRemaining) quests left")
                .font(.system(size: 10, weight: .medium))
                .foregroundColor(Color(hex: "#8B8BA3"))
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Preview

#if DEBUG
struct SmallWidgetView_Previews: PreviewProvider {
    static var previews: some View {
        SmallWidgetView(entry: DYDYDTimelineEntry(
            date: Date(),
            widgetData: DYDYDWidgetData(
                dailyXP: 320,
                dailyGoal: 500,
                questsRemaining: 3,
                topQuests: [],
                currentStreak: 14,
                lastUpdated: ISO8601DateFormatter().string(from: Date())
            )
        ))
        .previewContext(WidgetPreviewContext(family: .systemSmall))
    }
}
#endif
