// ============================================
// DYDYD - Widget Bundle
// ============================================
// Entry point for the widget extension.
// Registers all widget sizes.
// ============================================

import SwiftUI
import WidgetKit

@main
struct DYDYDWidgetBundle: WidgetBundle {
    var body: some Widget {
        DYDYDSmallWidget()
        DYDYDMediumWidget()
        DYDYDLargeWidget()
    }
}
