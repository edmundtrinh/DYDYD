// ============================================
// DYDYD - iOS Widget Extension
// ============================================
// SwiftUI Widget for iOS Home Screen

import WidgetKit
import SwiftUI

// MARK: - Data Models

struct QuestData: Codable, Identifiable {
    let id: String
    let name: String
    let category: String
    let targetValue: Int
    let currentValue: Int
    let isCompleted: Bool
    let xpValue: Int
}

struct WidgetData: Codable {
    let todayXP: Int
    let totalXP: Int
    let level: Int
    let levelProgress: Double
    let completedCount: Int
    let totalCount: Int
    let quests: [QuestData]
    let lastUpdated: Date
}

// MARK: - Shared Data Provider

class SharedDataProvider {
    static let shared = SharedDataProvider()
    private let appGroupIdentifier = "group.app.dydyd.shared"
    
    func getWidgetData() -> WidgetData {
        guard let userDefaults = UserDefaults(suiteName: appGroupIdentifier),
              let data = userDefaults.data(forKey: "widgetData"),
              let widgetData = try? JSONDecoder().decode(WidgetData.self, from: data)
        else {
            return WidgetData(
                todayXP: 0,
                totalXP: 0,
                level: 1,
                levelProgress: 0,
                completedCount: 0,
                totalCount: 0,
                quests: [],
                lastUpdated: Date()
            )
        }
        return widgetData
    }
}

// MARK: - Timeline Entry

struct DYDYDEntry: TimelineEntry {
    let date: Date
    let data: WidgetData
}

// MARK: - Timeline Provider

struct DYDYDTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> DYDYDEntry {
        DYDYDEntry(date: Date(), data: WidgetData(
            todayXP: 25,
            totalXP: 1250,
            level: 5,
            levelProgress: 0.6,
            completedCount: 5,
            totalCount: 8,
            quests: [
                QuestData(id: "1", name: "Walk 10,000 steps", category: "physical_health", targetValue: 10000, currentValue: 7500, isCompleted: false, xpValue: 10),
                QuestData(id: "2", name: "Drink 8 cups water", category: "physical_health", targetValue: 8, currentValue: 8, isCompleted: true, xpValue: 8),
                QuestData(id: "3", name: "Meditate 10 min", category: "mental_wellness", targetValue: 1, currentValue: 0, isCompleted: false, xpValue: 3),
            ],
            lastUpdated: Date()
        ))
    }
    
    func getSnapshot(in context: Context, completion: @escaping (DYDYDEntry) -> Void) {
        let entry = DYDYDEntry(date: Date(), data: SharedDataProvider.shared.getWidgetData())
        completion(entry)
    }
    
    func getTimeline(in context: Context, completion: @escaping (Timeline<DYDYDEntry>) -> Void) {
        let currentDate = Date()
        let data = SharedDataProvider.shared.getWidgetData()
        let entry = DYDYDEntry(date: currentDate, data: data)
        
        // Refresh every 15 minutes
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 15, to: currentDate)!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))
        completion(timeline)
    }
}

// MARK: - Category Helpers

extension String {
    var categoryColor: Color {
        switch self {
        case "physical_health": return .red
        case "mental_wellness": return .purple
        case "career": return .blue
        case "relationships": return .pink
        case "home_chores": return .orange
        default: return .gray
        }
    }
    
    var categoryIcon: String {
        switch self {
        case "physical_health": return "heart.fill"
        case "mental_wellness": return "brain.head.profile"
        case "career": return "briefcase.fill"
        case "relationships": return "person.2.fill"
        case "home_chores": return "house.fill"
        default: return "star.fill"
        }
    }
}

// MARK: - Widget Views

struct SmallWidgetView: View {
    let data: WidgetData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Image(systemName: "flame.fill")
                    .foregroundColor(.orange)
                Text("Level \(data.level)")
                    .font(.headline)
                    .fontWeight(.bold)
            }
            
            Text("\(data.todayXP) XP today")
                .font(.title2)
                .fontWeight(.bold)
                .foregroundColor(.primary)
            
            Spacer()
            
            HStack {
                Text("\(data.completedCount)/\(data.totalCount)")
                    .font(.caption)
                    .foregroundColor(.secondary)
                
                Spacer()
                
                ProgressView(value: Double(data.completedCount), total: Double(max(data.totalCount, 1)))
                    .progressViewStyle(LinearProgressViewStyle(tint: .green))
                    .frame(width: 60)
            }
        }
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
    }
}

struct MediumWidgetView: View {
    let data: WidgetData
    
    var body: some View {
        HStack(spacing: 16) {
            // Left side - Stats
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "flame.fill")
                        .foregroundColor(.orange)
                    Text("Level \(data.level)")
                        .font(.headline)
                        .fontWeight(.bold)
                }
                
                Text("\(data.todayXP) XP")
                    .font(.title)
                    .fontWeight(.bold)
                
                ProgressView(value: data.levelProgress)
                    .progressViewStyle(LinearProgressViewStyle(tint: .blue))
                
                Text("\(data.completedCount)/\(data.totalCount) quests")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            
            Divider()
            
            // Right side - Quest list
            VStack(alignment: .leading, spacing: 6) {
                ForEach(Array(data.quests.prefix(3))) { quest in
                    QuestRow(quest: quest)
                }
                
                if data.quests.count > 3 {
                    Text("+\(data.quests.count - 3) more")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
    }
}

struct LargeWidgetView: View {
    let data: WidgetData
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header
            HStack {
                VStack(alignment: .leading) {
                    Text("Did You Do Your Dailies?")
                        .font(.headline)
                    Text("Level \(data.level) • \(data.todayXP) XP today")
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                ZStack {
                    Circle()
                        .stroke(Color.gray.opacity(0.3), lineWidth: 4)
                    Circle()
                        .trim(from: 0, to: CGFloat(data.completedCount) / CGFloat(max(data.totalCount, 1)))
                        .stroke(Color.green, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    Text("\(data.completedCount)/\(data.totalCount)")
                        .font(.caption2)
                        .fontWeight(.bold)
                }
                .frame(width: 44, height: 44)
            }
            
            Divider()
            
            // Quest list
            LazyVStack(alignment: .leading, spacing: 8) {
                ForEach(Array(data.quests.prefix(6))) { quest in
                    QuestRowLarge(quest: quest)
                }
            }
            
            Spacer()
            
            // Footer
            HStack {
                Text("Tap to open")
                    .font(.caption2)
                    .foregroundColor(.secondary)
                Spacer()
                Text("Updated \(data.lastUpdated, style: .relative) ago")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
        }
        .padding()
        .containerBackground(.fill.tertiary, for: .widget)
    }
}

struct QuestRow: View {
    let quest: QuestData
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: quest.isCompleted ? "checkmark.circle.fill" : "circle")
                .foregroundColor(quest.isCompleted ? .green : quest.category.categoryColor)
                .font(.caption)
            
            Text(quest.name)
                .font(.caption2)
                .lineLimit(1)
                .strikethrough(quest.isCompleted)
                .foregroundColor(quest.isCompleted ? .secondary : .primary)
        }
    }
}

struct QuestRowLarge: View {
    let quest: QuestData
    
    var body: some View {
        HStack(spacing: 12) {
            Image(systemName: quest.isCompleted ? "checkmark.circle.fill" : quest.category.categoryIcon)
                .foregroundColor(quest.isCompleted ? .green : quest.category.categoryColor)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(quest.name)
                    .font(.caption)
                    .fontWeight(.medium)
                    .lineLimit(1)
                    .strikethrough(quest.isCompleted)
                    .foregroundColor(quest.isCompleted ? .secondary : .primary)
                
                if quest.targetValue > 1 && !quest.isCompleted {
                    ProgressView(value: Double(quest.currentValue), total: Double(quest.targetValue))
                        .progressViewStyle(LinearProgressViewStyle(tint: quest.category.categoryColor))
                }
            }
            
            Spacer()
            
            Text("+\(quest.xpValue) XP")
                .font(.caption2)
                .fontWeight(.semibold)
                .foregroundColor(quest.isCompleted ? .green : .secondary)
        }
    }
}

// MARK: - Widget Configuration

struct DYDYDWidget: Widget {
    let kind: String = "DYDYDWidget"
    
    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: DYDYDTimelineProvider()) { entry in
            DYDYDWidgetEntryView(entry: entry)
        }
        .configurationDisplayName("DYDYD Progress")
        .description("Track your daily quests and XP progress.")
        .supportedFamilies([.systemSmall, .systemMedium, .systemLarge])
    }
}

struct DYDYDWidgetEntryView: View {
    @Environment(\.widgetFamily) var family
    var entry: DYDYDEntry
    
    var body: some View {
        switch family {
        case .systemSmall:
            SmallWidgetView(data: entry.data)
        case .systemMedium:
            MediumWidgetView(data: entry.data)
        case .systemLarge:
            LargeWidgetView(data: entry.data)
        @unknown default:
            SmallWidgetView(data: entry.data)
        }
    }
}

// MARK: - Widget Bundle

@main
struct DYDYDWidgetBundle: WidgetBundle {
    var body: some Widget {
        DYDYDWidget()
    }
}

// MARK: - Preview

struct DYDYDWidget_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            DYDYDWidgetEntryView(entry: DYDYDEntry(
                date: Date(),
                data: WidgetData(
                    todayXP: 25,
                    totalXP: 1250,
                    level: 5,
                    levelProgress: 0.6,
                    completedCount: 5,
                    totalCount: 8,
                    quests: [
                        QuestData(id: "1", name: "Walk 10,000 steps", category: "physical_health", targetValue: 10000, currentValue: 7500, isCompleted: false, xpValue: 10),
                        QuestData(id: "2", name: "Drink 8 cups water", category: "physical_health", targetValue: 8, currentValue: 8, isCompleted: true, xpValue: 8),
                        QuestData(id: "3", name: "Meditate 10 min", category: "mental_wellness", targetValue: 1, currentValue: 0, isCompleted: false, xpValue: 3),
                    ],
                    lastUpdated: Date()
                )
            ))
            .previewContext(WidgetPreviewContext(family: .systemSmall))
            .previewDisplayName("Small")
            
            DYDYDWidgetEntryView(entry: DYDYDEntry(
                date: Date(),
                data: WidgetData(
                    todayXP: 25,
                    totalXP: 1250,
                    level: 5,
                    levelProgress: 0.6,
                    completedCount: 5,
                    totalCount: 8,
                    quests: [
                        QuestData(id: "1", name: "Walk 10,000 steps", category: "physical_health", targetValue: 10000, currentValue: 7500, isCompleted: false, xpValue: 10),
                        QuestData(id: "2", name: "Drink 8 cups water", category: "physical_health", targetValue: 8, currentValue: 8, isCompleted: true, xpValue: 8),
                        QuestData(id: "3", name: "Meditate 10 min", category: "mental_wellness", targetValue: 1, currentValue: 0, isCompleted: false, xpValue: 3),
                    ],
                    lastUpdated: Date()
                )
            ))
            .previewContext(WidgetPreviewContext(family: .systemMedium))
            .previewDisplayName("Medium")
            
            DYDYDWidgetEntryView(entry: DYDYDEntry(
                date: Date(),
                data: WidgetData(
                    todayXP: 25,
                    totalXP: 1250,
                    level: 5,
                    levelProgress: 0.6,
                    completedCount: 5,
                    totalCount: 8,
                    quests: [
                        QuestData(id: "1", name: "Walk 10,000 steps", category: "physical_health", targetValue: 10000, currentValue: 7500, isCompleted: false, xpValue: 10),
                        QuestData(id: "2", name: "Drink 8 cups water", category: "physical_health", targetValue: 8, currentValue: 8, isCompleted: true, xpValue: 8),
                        QuestData(id: "3", name: "Meditate 10 min", category: "mental_wellness", targetValue: 1, currentValue: 0, isCompleted: false, xpValue: 3),
                        QuestData(id: "4", name: "Apply to 5 jobs", category: "career", targetValue: 5, currentValue: 2, isCompleted: false, xpValue: 5),
                        QuestData(id: "5", name: "Call family", category: "relationships", targetValue: 1, currentValue: 1, isCompleted: true, xpValue: 2),
                    ],
                    lastUpdated: Date()
                )
            ))
            .previewContext(WidgetPreviewContext(family: .systemLarge))
            .previewDisplayName("Large")
        }
    }
}
