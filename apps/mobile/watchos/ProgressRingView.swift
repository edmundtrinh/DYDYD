// ============================================
// DYDYD Watch - Progress Ring View
// ============================================

import SwiftUI

struct ProgressRingView: View {
    let completed: Int
    let total: Int
    let todayXP: Int
    let streak: Int

    private var progress: Double {
        guard total > 0 else { return 0 }
        return Double(completed) / Double(total)
    }

    var body: some View {
        VStack(spacing: 8) {
            ZStack {
                Circle()
                    .stroke(Color.gray.opacity(0.3), lineWidth: 8)

                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(
                        AngularGradient(
                            gradient: Gradient(colors: [.blue, .purple, .blue]),
                            center: .center
                        ),
                        style: StrokeStyle(lineWidth: 8, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(.easeInOut(duration: 0.5), value: progress)

                VStack(spacing: 2) {
                    Text("\(completed)/\(total)")
                        .font(.system(.title3, design: .rounded).bold())
                    Text("quests")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            .frame(height: 80)

            HStack(spacing: 16) {
                VStack {
                    Text("\(todayXP)")
                        .font(.system(.caption, design: .rounded).bold())
                    Text("XP")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }

                VStack {
                    Text("\(streak)")
                        .font(.system(.caption, design: .rounded).bold())
                    Text("streak")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(.vertical, 4)
    }
}
