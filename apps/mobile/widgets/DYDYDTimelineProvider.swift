// ============================================
// DYDYD - Widget Timeline Provider
// ============================================
// Provides timeline entries to WidgetKit.
// Reads serialized data from the App Group
// UserDefaults and builds the widget timeline.
// ============================================

import WidgetKit

struct DYDYDTimelineEntry: TimelineEntry {
    let date: Date
    let widgetData: DYDYDWidgetData
}

struct DYDYDTimelineProvider: TimelineProvider {
    typealias Entry = DYDYDTimelineEntry

    // MARK: - Placeholder (shown during widget gallery)

    func placeholder(in context: Context) -> DYDYDTimelineEntry {
        DYDYDTimelineEntry(
            date: Date(),
            widgetData: placeholderWidgetData()
        )
    }

    // MARK: - Snapshot (shown in widget picker)

    func getSnapshot(in context: Context, completion: @escaping (DYDYDTimelineEntry) -> Void) {
        let data = loadWidgetData() ?? placeholderWidgetData()
        completion(DYDYDTimelineEntry(date: Date(), widgetData: data))
    }

    // MARK: - Timeline

    func getTimeline(in context: Context, completion: @escaping (Timeline<DYDYDTimelineEntry>) -> Void) {
        let data = loadWidgetData() ?? placeholderWidgetData()
        let entry = DYDYDTimelineEntry(date: Date(), widgetData: data)

        // Refresh policy: the app calls WidgetCenter.shared.reloadAllTimelines()
        // whenever state changes, so we use .never here. The timeline is
        // app-driven rather than time-driven.
        // Fallback: also request a refresh in 30 minutes in case the app hasn't
        // pushed an update (e.g., user hasn't opened the app).
        let nextUpdate = Calendar.current.date(byAdding: .minute, value: 30, to: Date())!
        let timeline = Timeline(entries: [entry], policy: .after(nextUpdate))

        completion(timeline)
    }
}
