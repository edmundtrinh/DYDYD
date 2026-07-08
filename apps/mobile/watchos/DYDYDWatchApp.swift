// ============================================
// DYDYD Watch - App Entry Point
// ============================================

import SwiftUI

@main
struct DYDYDWatchApp: App {
    @StateObject private var connectivityManager = ConnectivityManager()

    var body: some Scene {
        WindowGroup {
            QuestListView()
                .environmentObject(connectivityManager)
        }
    }
}
