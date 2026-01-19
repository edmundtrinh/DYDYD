// ============================================
// DYDYD - Apple Watch App
// ============================================
// WatchOS companion app for quick quest completion

import SwiftUI
import WatchKit
import WatchConnectivity

// MARK: - Watch Session Manager

class WatchSessionManager: NSObject, ObservableObject, WCSessionDelegate {
    static let shared = WatchSessionManager()
    
    @Published var quests: [WatchQuest] = []
    @Published var progress: WatchProgress = WatchProgress()
    @Published var isReachable: Bool = false
    @Published var isLoading: Bool = false
    
    private var session: WCSession?
    
    override init() {
        super.init()
        if WCSession.isSupported() {
            session = WCSession.default
            session?.delegate = self
            session?.activate()
        }
    }
    
    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
        }
    }
    
    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
        }
    }
    
    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        DispatchQueue.main.async {
            self.handleMessage(message)
        }
    }
    
    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        DispatchQueue.main.async {
            self.handleMessage(applicationContext)
        }
    }
    
    private func handleMessage(_ message: [String: Any]) {
        guard let type = message["type"] as? String else { return }
        
        switch type {
        case "SYNC_QUESTS":
            if let questsData = message["quests"] as? [[String: Any]] {
                self.quests = questsData.compactMap { WatchQuest(from: $0) }
            }
        case "SYNC_PROGRESS":
            self.progress = WatchProgress(from: message)
        default:
            break
        }
        isLoading = false
    }
    
    func completeQuest(_ questId: String, value: Int = 1) {
        guard let session = session, session.isReachable else { return }
        
        let message: [String: Any] = [
            "type": "QUEST_COMPLETED",
            "payload": [
                "questId": questId,
                "value": value,
                "timestamp": Date().timeIntervalSince1970
            ]
        ]
        
        session.sendMessage(message, replyHandler: nil) { error in
            print("Error sending message: \(error)")
        }
        
        // Optimistically mark as completed
        if let index = quests.firstIndex(where: { $0.id == questId }) {
            quests[index].isCompleted = true
            quests[index].currentValue += value
            progress.completedCount += 1
            progress.todayXP += quests[index].xpValue
        }
    }
    
    func requestSync() {
        guard let session = session, session.isReachable else { return }
        isLoading = true
        
        let message: [String: Any] = [
            "type": "REQUEST_SYNC",
            "timestamp": Date().timeIntervalSince1970
        ]
        
        session.sendMessage(message, replyHandler: nil) { error in
            DispatchQueue.main.async {
                self.isLoading = false
            }
        }
    }
}

// MARK: - Data Models

struct WatchQuest: Identifiable {
    let id: String
    let questId: String
    var name: String
    var category: String
    var targetValue: Int
    var currentValue: Int
    var isCompleted: Bool
    var xpValue: Int
    
    init(from dict: [String: Any]) {
        self.id = dict["id"] as? String ?? UUID().uuidString
        self.questId = dict["questId"] as? String ?? ""
        self.name = dict["name"] as? String ?? "Quest"
        self.category = dict["category"] as? String ?? ""
        self.targetValue = dict["targetValue"] as? Int ?? 1
        self.currentValue = dict["currentValue"] as? Int ?? 0
        self.isCompleted = dict["isCompleted"] as? Bool ?? false
        self.xpValue = dict["xpValue"] as? Int ?? 0
    }
    
    init?(from dict: [String: Any]?) {
        guard let dict = dict else { return nil }
        self.init(from: dict)
    }
    
    var categoryColor: Color {
        switch category {
        case "physical_health": return .red
        case "mental_wellness": return .purple
        case "career": return .blue
        case "relationships": return .pink
        case "home_chores": return .orange
        default: return .gray
        }
    }
    
    var categoryIcon: String {
        switch category {
        case "physical_health": return "heart.fill"
        case "mental_wellness": return "brain.head.profile"
        case "career": return "briefcase.fill"
        case "relationships": return "person.2.fill"
        case "home_chores": return "house.fill"
        default: return "star.fill"
        }
    }
}

struct WatchProgress {
    var todayXP: Int = 0
    var totalXP: Int = 0
    var level: Int = 1
    var completedCount: Int = 0
    var totalCount: Int = 0
    
    init() {}
    
    init(from dict: [String: Any]) {
        self.todayXP = dict["todayXP"] as? Int ?? 0
        self.totalXP = dict["totalXP"] as? Int ?? 0
        self.level = dict["level"] as? Int ?? 1
        self.completedCount = dict["completedCount"] as? Int ?? 0
        self.totalCount = dict["totalCount"] as? Int ?? 0
    }
}

// MARK: - Main App

@main
struct DYDYDWatchApp: App {
    @StateObject private var sessionManager = WatchSessionManager.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(sessionManager)
        }
    }
}

// MARK: - Content View

struct ContentView: View {
    @EnvironmentObject var sessionManager: WatchSessionManager
    
    var body: some View {
        TabView {
            QuestListView()
            ProgressView()
        }
        .tabViewStyle(.page)
        .onAppear {
            sessionManager.requestSync()
        }
    }
}

// MARK: - Quest List View

struct QuestListView: View {
    @EnvironmentObject var sessionManager: WatchSessionManager
    
    var body: some View {
        if sessionManager.isLoading {
            VStack {
                ProgressView()
                Text("Syncing...")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        } else if sessionManager.quests.isEmpty {
            VStack(spacing: 8) {
                Image(systemName: "checkmark.circle")
                    .font(.largeTitle)
                    .foregroundColor(.green)
                Text("No quests")
                    .font(.headline)
                Text("Open DYDYD on your phone")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        } else {
            ScrollView {
                VStack(spacing: 8) {
                    // Header
                    HStack {
                        Text("Today's Quests")
                            .font(.headline)
                        Spacer()
                        Text("\(sessionManager.progress.completedCount)/\(sessionManager.progress.totalCount)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .padding(.horizontal)
                    
                    // Quest list
                    ForEach(sessionManager.quests) { quest in
                        QuestCard(quest: quest)
                    }
                }
                .padding(.vertical, 8)
            }
        }
    }
}

// MARK: - Quest Card

struct QuestCard: View {
    @EnvironmentObject var sessionManager: WatchSessionManager
    let quest: WatchQuest
    
    var body: some View {
        Button(action: {
            if !quest.isCompleted {
                sessionManager.completeQuest(quest.id)
                WKInterfaceDevice.current().play(.success)
            }
        }) {
            HStack(spacing: 10) {
                // Icon
                ZStack {
                    Circle()
                        .fill(quest.isCompleted ? Color.green : quest.categoryColor.opacity(0.2))
                        .frame(width: 32, height: 32)
                    
                    Image(systemName: quest.isCompleted ? "checkmark" : quest.categoryIcon)
                        .font(.system(size: 14, weight: .semibold))
                        .foregroundColor(quest.isCompleted ? .white : quest.categoryColor)
                }
                
                // Content
                VStack(alignment: .leading, spacing: 2) {
                    Text(quest.name)
                        .font(.system(size: 13, weight: .medium))
                        .lineLimit(2)
                        .strikethrough(quest.isCompleted)
                        .foregroundColor(quest.isCompleted ? .secondary : .primary)
                    
                    if quest.targetValue > 1 {
                        HStack(spacing: 4) {
                            ProgressView(value: Double(quest.currentValue), total: Double(quest.targetValue))
                                .progressViewStyle(LinearProgressViewStyle(tint: quest.categoryColor))
                                .frame(width: 50)
                            Text("\(quest.currentValue)/\(quest.targetValue)")
                                .font(.system(size: 10))
                                .foregroundColor(.secondary)
                        }
                    }
                }
                
                Spacer()
                
                // XP
                VStack {
                    Text("+\(quest.xpValue)")
                        .font(.system(size: 11, weight: .bold))
                        .foregroundColor(quest.isCompleted ? .green : .orange)
                    Text("XP")
                        .font(.system(size: 8))
                        .foregroundColor(.secondary)
                }
            }
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(Color(white: 0.15))
            )
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 8)
    }
}

// MARK: - Progress View

struct WatchProgressView: View {
    @EnvironmentObject var sessionManager: WatchSessionManager
    
    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                // Level badge
                VStack(spacing: 4) {
                    Image(systemName: "flame.fill")
                        .font(.title)
                        .foregroundColor(.orange)
                    Text("Level \(sessionManager.progress.level)")
                        .font(.headline)
                }
                .padding()
                .background(
                    Circle()
                        .fill(Color.orange.opacity(0.2))
                        .frame(width: 80, height: 80)
                )
                
                // XP Stats
                VStack(spacing: 8) {
                    HStack {
                        VStack {
                            Text("\(sessionManager.progress.todayXP)")
                                .font(.title2)
                                .fontWeight(.bold)
                            Text("Today")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                        
                        Divider()
                            .frame(height: 30)
                        
                        VStack {
                            Text("\(sessionManager.progress.totalXP)")
                                .font(.title2)
                                .fontWeight(.bold)
                            Text("Total")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .fill(Color(white: 0.15))
                    )
                }
                
                // Completion ring
                ZStack {
                    Circle()
                        .stroke(Color.gray.opacity(0.3), lineWidth: 8)
                    Circle()
                        .trim(from: 0, to: CGFloat(sessionManager.progress.completedCount) / CGFloat(max(sessionManager.progress.totalCount, 1)))
                        .stroke(Color.green, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    
                    VStack {
                        Text("\(sessionManager.progress.completedCount)")
                            .font(.title)
                            .fontWeight(.bold)
                        Text("of \(sessionManager.progress.totalCount)")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                .frame(width: 100, height: 100)
                
                // Refresh button
                Button(action: {
                    sessionManager.requestSync()
                }) {
                    Label("Refresh", systemImage: "arrow.clockwise")
                        .font(.caption)
                }
                .buttonStyle(.bordered)
            }
            .padding()
        }
    }
}

// MARK: - Complication

import ClockKit

class ComplicationController: NSObject, CLKComplicationDataSource {
    
    func getComplicationDescriptors(handler: @escaping ([CLKComplicationDescriptor]) -> Void) {
        let descriptors = [
            CLKComplicationDescriptor(
                identifier: "dydyd_progress",
                displayName: "DYDYD Progress",
                supportedFamilies: [
                    .circularSmall,
                    .modularSmall,
                    .modularLarge,
                    .utilitarianSmall,
                    .utilitarianSmallFlat,
                    .utilitarianLarge,
                    .graphicCorner,
                    .graphicCircular,
                    .graphicRectangular
                ]
            )
        ]
        handler(descriptors)
    }
    
    func getCurrentTimelineEntry(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationTimelineEntry?) -> Void) {
        let progress = WatchSessionManager.shared.progress
        let template = makeTemplate(for: complication, progress: progress)
        let entry = CLKComplicationTimelineEntry(date: Date(), complicationTemplate: template)
        handler(entry)
    }
    
    func getLocalizableSampleTemplate(for complication: CLKComplication, withHandler handler: @escaping (CLKComplicationTemplate?) -> Void) {
        let sampleProgress = WatchProgress()
        handler(makeTemplate(for: complication, progress: sampleProgress))
    }
    
    private func makeTemplate(for complication: CLKComplication, progress: WatchProgress) -> CLKComplicationTemplate {
        let completionRatio = Float(progress.completedCount) / Float(max(progress.totalCount, 1))
        
        switch complication.family {
        case .circularSmall:
            let template = CLKComplicationTemplateCircularSmallRingText()
            template.textProvider = CLKSimpleTextProvider(text: "\(progress.completedCount)")
            template.fillFraction = completionRatio
            template.ringStyle = .closed
            return template
            
        case .modularSmall:
            let template = CLKComplicationTemplateModularSmallRingText()
            template.textProvider = CLKSimpleTextProvider(text: "\(progress.todayXP)")
            template.fillFraction = completionRatio
            template.ringStyle = .closed
            return template
            
        case .graphicCircular:
            let template = CLKComplicationTemplateGraphicCircularClosedGaugeText()
            template.gaugeProvider = CLKSimpleGaugeProvider(
                style: .fill,
                gaugeColor: .green,
                fillFraction: completionRatio
            )
            template.centerTextProvider = CLKSimpleTextProvider(text: "\(progress.completedCount)")
            return template
            
        case .graphicCorner:
            let template = CLKComplicationTemplateGraphicCornerGaugeText()
            template.gaugeProvider = CLKSimpleGaugeProvider(
                style: .fill,
                gaugeColor: .green,
                fillFraction: completionRatio
            )
            template.outerTextProvider = CLKSimpleTextProvider(text: "\(progress.todayXP) XP")
            template.leadingTextProvider = CLKSimpleTextProvider(text: "Lv\(progress.level)")
            return template
            
        default:
            return CLKComplicationTemplateCircularSmallSimpleText(
                textProvider: CLKSimpleTextProvider(text: "\(progress.todayXP)")
            )
        }
    }
}
