// ============================================
// DYDYD Watch - Connectivity Manager
// ============================================
// Handles WatchConnectivity communication with the iPhone app

import Foundation
import WatchConnectivity
import Combine

class ConnectivityManager: NSObject, ObservableObject, WCSessionDelegate {
    @Published var watchData: WatchData = .empty
    @Published var isReachable: Bool = false

    private var session: WCSession?
    private let userDefaults = UserDefaults(suiteName: "group.com.dydyd.app")

    override init() {
        super.init()
        if WCSession.isSupported() {
            session = WCSession.default
            session?.delegate = self
            session?.activate()
        }
    }

    // MARK: - Sending Messages

    func requestSync() {
        guard let session = session, session.isReachable else { return }

        let message: [String: Any] = [
            "type": WatchMessageType.requestSync.rawValue,
            "timestamp": Date().timeIntervalSince1970
        ]

        session.sendMessage(message, replyHandler: nil) { error in
            print("DYDYD Watch: Failed to request sync: \(error.localizedDescription)")
        }
    }

    func sendQuestCompleted(questId: String, value: Double? = nil) {
        guard let session = session, session.isReachable else {
            queueCompletion(questId: questId, value: value)
            return
        }

        var payload: [String: Any] = ["questId": questId]
        if let value = value {
            payload["value"] = value
        }

        let message: [String: Any] = [
            "type": WatchMessageType.questCompleted.rawValue,
            "payload": payload,
            "timestamp": Date().timeIntervalSince1970
        ]

        session.sendMessage(message, replyHandler: nil) { error in
            print("DYDYD Watch: Failed to send completion: \(error.localizedDescription)")
            self.queueCompletion(questId: questId, value: value)
        }
    }

    // MARK: - WCSessionDelegate

    func session(_ session: WCSession, activationDidCompleteWith activationState: WCSessionActivationState, error: Error?) {
        if let error = error {
            print("DYDYD Watch: Session activation failed: \(error.localizedDescription)")
            return
        }

        DispatchQueue.main.async {
            self.isReachable = session.isReachable
        }

        loadCachedData()
    }

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        processContext(applicationContext)
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
        }

        if session.isReachable {
            sendQueuedCompletions()
        }
    }

    // MARK: - Data Processing

    private func processContext(_ context: [String: Any]) {
        guard let jsonData = try? JSONSerialization.data(withJSONObject: context) else { return }

        do {
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            let payload = try decoder.decode(WatchSyncPayload.self, from: jsonData)

            DispatchQueue.main.async {
                self.watchData = payload.data
            }

            cacheData(payload.data)
        } catch {
            print("DYDYD Watch: Failed to decode context: \(error.localizedDescription)")
        }
    }

    // MARK: - Persistence

    private func cacheData(_ data: WatchData) {
        guard let encoded = try? JSONEncoder().encode(data) else { return }
        userDefaults?.set(encoded, forKey: "cachedWatchData")
    }

    private func loadCachedData() {
        guard let data = userDefaults?.data(forKey: "cachedWatchData"),
              let cached = try? JSONDecoder().decode(WatchData.self, from: data) else { return }

        DispatchQueue.main.async {
            self.watchData = cached
        }
    }

    private func queueCompletion(questId: String, value: Double?) {
        var queue = userDefaults?.array(forKey: "pendingCompletions") as? [[String: Any]] ?? []
        var entry: [String: Any] = ["questId": questId, "timestamp": Date().timeIntervalSince1970]
        if let value = value {
            entry["value"] = value
        }
        queue.append(entry)
        userDefaults?.set(queue, forKey: "pendingCompletions")
    }

    private func sendQueuedCompletions() {
        guard let queue = userDefaults?.array(forKey: "pendingCompletions") as? [[String: Any]],
              !queue.isEmpty else { return }

        for entry in queue {
            if let questId = entry["questId"] as? String {
                let value = entry["value"] as? Double
                sendQuestCompleted(questId: questId, value: value)
            }
        }

        userDefaults?.removeObject(forKey: "pendingCompletions")
    }
}
