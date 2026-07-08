// ============================================
// DYDYD Watch - Quest List View
// ============================================
// Main view showing today's active quests

import SwiftUI

struct QuestListView: View {
    @EnvironmentObject var connectivity: ConnectivityManager

    var body: some View {
        NavigationStack {
            Group {
                if connectivity.watchData.dailyQuests.isEmpty {
                    VStack(spacing: 12) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 40))
                            .foregroundColor(.green)
                        Text("No quests today")
                            .font(.headline)
                        Text("Pull down to sync")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                } else if allQuestsCompleted {
                    VStack(spacing: 12) {
                        Image(systemName: "party.popper.fill")
                            .font(.system(size: 40))
                            .foregroundColor(.yellow)
                        Text("All done!")
                            .font(.headline)
                        Text("+\(connectivity.watchData.todayXP) XP today")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                } else {
                    List {
                        ForEach(connectivity.watchData.dailyQuests) { quest in
                            QuestRowView(quest: quest) {
                                connectivity.sendQuestCompleted(questId: quest.id)
                            }
                        }

                        Section {
                            ProgressRingView(
                                completed: completedCount,
                                total: totalCount,
                                todayXP: connectivity.watchData.todayXP,
                                streak: connectivity.watchData.currentStreak
                            )
                            .listRowBackground(Color.clear)
                        }
                    }
                }
            }
            .navigationTitle("DYDYD")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        connectivity.requestSync()
                    } label: {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
        }
    }

    private var allQuestsCompleted: Bool {
        connectivity.watchData.dailyQuests.allSatisfy { $0.isCompleted }
    }

    private var completedCount: Int {
        connectivity.watchData.dailyQuests.filter { $0.isCompleted }.count
    }

    private var totalCount: Int {
        connectivity.watchData.dailyQuests.count
    }
}
