// ============================================
// DYDYD Watch - Quest Row View
// ============================================

import SwiftUI

struct QuestRowView: View {
    let quest: WatchQuest
    let onComplete: () -> Void

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 2) {
                Text(quest.name)
                    .font(.system(.body, design: .rounded))
                    .lineLimit(2)
                    .strikethrough(quest.isCompleted)
                    .foregroundColor(quest.isCompleted ? .secondary : .primary)

                HStack(spacing: 4) {
                    Image(systemName: iconForQuest)
                        .font(.caption2)
                        .foregroundColor(.accentColor)
                    Text("+\(quest.xp) XP")
                        .font(.caption2)
                        .foregroundColor(.secondary)

                    if quest.maxCompletions > 1 {
                        Text("\(quest.completionsToday)/\(quest.maxCompletions)")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
            }

            Spacer()

            if !quest.isCompleted {
                Button(action: onComplete) {
                    Image(systemName: "checkmark.circle")
                        .font(.title3)
                        .foregroundColor(.green)
                }
                .buttonStyle(.plain)
            } else {
                Image(systemName: "checkmark.circle.fill")
                    .font(.title3)
                    .foregroundColor(.green)
            }
        }
        .padding(.vertical, 2)
    }

    private var iconForQuest: String {
        switch quest.iconName {
        case "run": return "figure.run"
        case "walk": return "figure.walk"
        case "sleep": return "bed.double.fill"
        case "water": return "drop.fill"
        case "meditation": return "brain.head.profile"
        case "book": return "book.fill"
        case "workout": return "dumbbell.fill"
        case "heart": return "heart.fill"
        case "food": return "fork.knife"
        case "teeth": return "mouth.fill"
        default: return "star.fill"
        }
    }
}
