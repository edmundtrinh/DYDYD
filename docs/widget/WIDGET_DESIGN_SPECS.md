# DYDYD iOS Widget - Detailed Design Specifications

## 📐 Dimension Reference

### iOS Widget Sizes (Human Interface Guidelines)
```
┌─ Medium (2×2) ────────────────┐
│   iPhone Default: 329×329     │
│   iPad: 364×364               │
└───────────────────────────────┘

┌─ Large (2×3) ─────────────────┐
│   iPhone Default: 329×559     │
│   iPad: 364×715               │
└───────────────────────────────┘

┌─ Large (2×4) ─────────────────┐
│   iPhone Default: 329×689     │
│   iPad: 364×915               │
└───────────────────────────────┘

┌─ Extra Large (4×4) ───────────┐
│   iPad Only: 728×728          │
└───────────────────────────────┘
```

**Note**: All measurements in points (pt). 1pt = 1px on standard displays, 0.5px on 3x displays.

## 🎨 Color Palette

### Category Colors (Primary)
```
Physical Health:
├─ Main:  #EF4444 (Red 500)
├─ Light: #FEE2E2 (Red 100)
├─ Dark:  #DC2626 (Red 600)
└─ RGB:   239, 68, 68

Mental Wellness:
├─ Main:  #8B5CF6 (Violet 500)
├─ Light: #F3E8FF (Violet 100)
├─ Dark:  #7C3AED (Violet 600)
└─ RGB:   139, 92, 246

Career/Productivity:
├─ Main:  #3B82F6 (Blue 500)
├─ Light: #DBEAFE (Blue 100)
├─ Dark:  #1D4ED8 (Blue 700)
└─ RGB:   59, 130, 246

Relationships/Social:
├─ Main:  #F59E0B (Amber 500)
├─ Light: #FEF3C7 (Amber 100)
├─ Dark:  #D97706 (Amber 600)
└─ RGB:   245, 158, 11

Home/Chores:
├─ Main:  #10B981 (Emerald 500)
├─ Light: #D1FAE5 (Emerald 100)
├─ Dark:  #059669 (Emerald 600)
└─ RGB:   16, 185, 129
```

### Neutral Colors (Light Mode)
```
Background:   #F9FAFB (Gray 50)
Card:         #FFFFFF (White)
Text Primary: #111827 (Gray 900)
Text Sec:     #6B7280 (Gray 500)
Border:       #E5E7EB (Gray 200)
Divider:      #F3F4F6 (Gray 100)
```

### Neutral Colors (Dark Mode)
```
Background:   #111827 (Gray 900)
Card:         #1F2937 (Gray 800)
Text Primary: #F9FAFB (Gray 50)
Text Sec:     #D1D5DB (Gray 300)
Border:       #374151 (Gray 700)
Divider:      #2D3748 (Gray 700)
```

### Special Colors
```
Success:      #10B981 (Green 500)
Warning:      #F59E0B (Amber 500)
Error:        #EF4444 (Red 500)
Info:         #3B82F6 (Blue 500)
Streak:       #F59E0B (Gold/Amber)
XP Badge:     #F59E0B + #EF4444 (Gradient)
```

## 🔤 Typography System

### Font Face
**Primary**: SF Pro Display (iOS system font)
**Fallback**: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto

### Font Scale (iOS)

| Usage | Size | Weight | Line Height | Letter Spacing |
|-------|------|--------|-------------|----------------|
| Quest Name | 16pt | Semibold (600) | 20pt | -0.3pt |
| Progress Value | 24pt | Bold (700) | 32pt | 0pt |
| Category Label | 12pt | Regular (400) | 16pt | 0pt |
| Value Unit | 13pt | Regular (400) | 18pt | 0pt |
| Button Label | 14pt | Semibold (600) | 18pt | 0.5pt |
| Detail Header | 11pt | Semibold (600) | 16pt | 0.5pt |
| Activity Time | 12pt | Regular (400) | 16pt | 0pt |
| Activity Amount | 13pt | Medium (500) | 18pt | 0pt |
| Section Title | 12pt | Semibold (600) | 16pt | 0.5pt |

### Text Colors by Context
```
Quest Name:           Primary Color (Category)
Progress %:           Category Main Color
Category Label:       #6B7280 (Gray 500) / #D1D5DB (Dark)
Unit Text:            #9CA3AF (Gray 400) / #9CA3AF (Dark)
Button Text:          White (on colored bg) or Primary (on light bg)
Streak Badge:         #F59E0B (Amber)
XP Value:             Category Main Color
Activity Time:        #6B7280 (Gray 500) / #9CA3AF (Dark)
Activity Amount:      #111827 (Gray 900) / #F9FAFB (Light)
Section Headers:      #6B7280 (Gray 500) / #9CA3AF (Dark)
```

## 📐 Spacing & Layout

### Widget Padding
```
Medium (2x2):
├─ Horizontal: 16pt (both sides)
├─ Vertical:   16pt (top/bottom)
└─ Internal Gap: 16pt between sections

Large (2x3/2x4):
├─ Horizontal: 16pt (both sides)
├─ Vertical:   16pt (top/bottom)
├─ Featured Section: 16pt padding
├─ Detail Section: 16pt padding
└─ Section Divider: 1pt border
```

### Category Color Bar
```
Width:     4pt (left side only)
Height:    40pt (or full quest header height)
Radius:    2pt rounded (subtle)
Position:  Aligned with quest name
Opacity:   100% (fully opaque)
```

### Progress Circle
```
Medium Widget:
├─ Diameter:     80pt
├─ Stroke Width: 3pt
├─ Center Text:  24pt bold percentage
└─ Sub-text:     12pt "Complete"

Large Widget:
├─ Diameter:     100pt
├─ Stroke Width: 3pt
├─ Center Text:  28pt bold percentage
└─ Sub-text:     13pt "Complete"

Animation:
├─ Duration:     500ms
├─ Easing:       ease-in-out
├─ Start:        0% opacity, 0% stroke-dash
└─ End:          100% opacity, full stroke-dash
```

### Button Dimensions
```
Quick-Log Button:
├─ Height:       36pt (min 44pt including padding)
├─ Padding:      12pt horizontal, 8pt vertical
├─ Border Radius: 8pt
├─ Font Size:    14pt semibold
├─ Gap Icon-Text: 6pt
└─ States:
   ├─ Normal:    Full opacity, scale 1.0
   ├─ Hover:     Scale 1.05
   └─ Active:    Scale 0.95, duration 200ms

Settings Icon Button:
├─ Size:         24×24pt
├─ Padding:      8pt all sides
├─ Border Radius: 6pt
└─ Color:        Category main color
```

### Streak Badge
```
Dimensions:
├─ Height:       20pt
├─ Padding:      4pt horizontal, 2pt vertical
├─ Border Radius: 10pt (fully rounded)
└─ Font Size:    11pt bold

Colors:
├─ Background:   #FEF3C7 (Amber 100)
├─ Text:         #D97706 (Amber 600)
└─ Icon:         🔥 (fire emoji)
```

## 🎬 Animation & Motion Specifications

### Progress Circle Animation
```
Property:       stroke-dashoffset
Duration:       500ms
Easing:         cubic-bezier(0.4, 0.0, 0.2, 1)  {ease-in-out}
From:           circumference
To:             circumference * (1 - percentage)
Trigger:        On component mount or value change
Repeat:         Once per update
```

### Smart Stack Swipe Transition
```
Outgoing Card:
├─ Property:     opacity + scale + translateX
├─ Duration:     300ms
├─ From:         opacity 1, scale 1.0, translateX 0
└─ To:           opacity 0, scale 0.95, translateX -20pt

Incoming Card:
├─ Property:     opacity + scale + translateX
├─ Duration:     300ms
├─ From:         opacity 0, scale 0.95, translateX 20pt
└─ To:           opacity 1, scale 1.0, translateX 0

Combined Effect:
├─ Easing:       cubic-bezier(0.34, 1.56, 0.64, 1)  {spring}
└─ Result:       Bounce/pop feeling (Apple style)
```

### Button Press Animation
```
Property:       scale
Duration:       150ms
Easing:         cubic-bezier(0.4, 0.0, 0.2, 1)
From:           scale(1.0)
To:             scale(0.92)
Trigger:        On click
```

### Badge/Streak Animation
```
Property:       scale
Duration:       300ms
Easing:         ease-out
From:           scale(0.95)
To:             scale(1.0)
Trigger:        On streak achieved
```

### Scroll Indicator Animation
```
Property:       opacity + scale
Duration:       200ms
Easing:         ease-in-out
Active Dot:     scale(1.5), opacity 1.0
Inactive Dot:   scale(1.0), opacity 0.5
```

## 📊 Chart Specifications

### Hourly Breakdown Chart
```
Type:           Bar chart (sparkline style)
Height:         48pt
Bars:           7 (6am, 9am, 12pm, 3pm, 6pm, 9pm + current)
Bar Width:      Flex (equal width)
Gap Between:    4pt
Colors:
├─ Gradient From: Light variant color (top)
├─ Gradient To:   Main category color (bottom)
└─ Opacity:       80%

Current Hour:
├─ Indicator:    Vertical line or different shade
├─ Color:        Category main color
└─ Width:        2pt
```

### Weekly Comparison
```
Bars Per Week:  7 (Mon-Sun)
Height:         32pt per week
Width:          Flex (equal)
Gap:            4pt horizontal, 12pt between weeks
Colors:
├─ Light Theme: Category light color
└─ Dark Theme:  Category main color with opacity
Opacity:        Variable (0.5-1.0) based on value
Completed:      Full opacity
Incomplete:     50% opacity
```

### Activity Log Items
```
Height:         32pt (with padding)
Padding:        8pt vertical, 12pt horizontal
Border-Bottom:  1pt #E5E7EB (Light) / #374151 (Dark)
Last Item:      No border

Time:
├─ Size:        12pt regular
├─ Color:       #6B7280 (Light) / #9CA3AF (Dark)
└─ Format:      "3:45 PM"

Amount:
├─ Size:        13pt medium
├─ Color:       Primary text
└─ Format:      "+1,200 steps"

XP Badge:
├─ Size:        11pt bold
├─ Padding:     4pt horizontal, 2pt vertical
├─ Border Radius: 4pt
├─ Background:  Category light color
└─ Format:      "+25 XP"
```

## 🔲 Component Specs

### Widget Container
```
Border Radius:    16pt (all corners)
Background:       #FFFFFF (Light) / #1F2937 (Dark)
Shadow:           iOS standard shadow
  ├─ Light:       0 4px 12px rgba(0,0,0,0.1)
  └─ Dark:        0 4px 12px rgba(0,0,0,0.3)
Border:           1pt #E5E7EB (Light) / #374151 (Dark)
Safe Area:        Respect iPhone notches/Dynamic Island
Corner Mask:      Based on widget frame size
```

### Scrollable Detail Container
```
Height:           250-400pt (depending on widget size)
Overflow:         Scroll vertically
Padding:          16pt top/bottom, 0pt sides
Scroll Indicator: Slim (2pt width)
Colors:
├─ Light:         #D1D5DB (Gray 300)
└─ Dark:          #6B7280 (Gray 600)
```

### Divider Lines (Between Sections)
```
Height:           1pt
Width:            Full widget width (minus padding)
Color:            #E5E7EB (Light) / #374151 (Dark)
Margin:           16pt vertical
Opacity:          100%
```

## 🎯 Layout Specifications

### Medium Widget (2x2) Layout
```
┌─────────────────────────────────┐
│ [4pt bar] Category  [streak]    │  16pt padding
├─────────────────────────────────┤
│  Quest Name                     │
├─────────────────────────────────┤  16pt gap
│         [Progress Circle]       │  (80pt diameter)
│         75% Complete            │
├─────────────────────────────────┤  16pt gap
│         6,750 / 10,000 steps    │
├─────────────────────────────────┤  16pt gap
│ [+100] [+500]                   │  (36pt height buttons)
├─────────────────────────────────┤  16pt gap
│ Swipe for more quests ➡️         │  (12pt text, center)
└─────────────────────────────────┘
```

### Large Widget (2x3/2x4) Layout
```
┌─────────────────────────────────┐
│ [Featured Quest Section] ────────  ~200pt
│ ├─ Header + color bar           │
│ ├─ Progress circle (100pt)      │
│ ├─ Value display                │
│ └─ Quick-log buttons (2 cols)   │
├─────────────────────────────────┤  1pt divider
│ [Detail Sections - Scrollable]   │  ~360pt
│ ├─ Hourly Breakdown             │
│ ├─ Weekly Comparison            │
│ └─ Activity Log (3-4 items)     │
│ [Scroll Indicators ● ○ ○]        │
└─────────────────────────────────┘
```

## ♿ Accessibility Specifications

### Color Contrast (WCAG AA)
```
Text on Category Color:   4.5:1 minimum
Primary Text on Light:    4.5:1 minimum
Primary Text on Dark:     4.5:1 minimum
Secondary Text:           3:1 minimum
Links:                    4.5:1 minimum
```

### Touch Targets
```
Minimum Size:     44×44pt (Apple HIG)
Button Padding:   8pt minimum (all sides)
Interactive Gap:  8pt minimum between targets
```

### Dark Mode
```
Respects:         prefers-color-scheme media query
Automatic:        Switches at system dark mode toggle
Colors:           All colors have dark variants defined
Readability:      Enhanced in dark mode
```

## 📱 iOS WidgetKit Mapping

### SwiftUI View Hierarchy
```swift
VStack(spacing: 16) {
  // Header: 44pt
  HStack {
    Color(category)  // 4pt bar
    VStack {
      Text(category)  // 12pt
      Text(name)      // 16pt semibold
    }
    Spacer()
    if streak > 0 {
      StreakBadge()   // 20pt
    }
  }

  // Progress Circle: 80-100pt diameter
  ProgressCircle()

  // Value: 32pt
  VStack(spacing: 4) {
    Text(percentage)  // 24pt bold
    Text(unit)        // 13pt
  }

  // Buttons: 36pt height
  HStack(spacing: 8) {
    QuickLogButton()  // 50% width
    QuickLogButton()  // 50% width
  }

  // Detail Sections (Large only)
  if showDetails {
    ScrollView {
      VStack(spacing: 16) {
        DetailSection()
        DetailSection()
        DetailSection()
      }
    }
    .frame(maxHeight: 360)
  }
}
.padding(16)
.background(Color.widgetBackground)
.cornerRadius(16)
.shadow(radius: 4)
```

## 🔌 Recommended Fonts

```
San Francisco Pro Display
├─ Weight: Regular, Medium, Semibold, Bold
├─ Sizes: 11pt to 28pt
├─ Tracking: -0.3pt (16pt+), 0pt (smaller)
└─ Line Height: 1.2-1.3x font size

Fallback Stack:
-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
```

## 🧪 QA Checklist

- [ ] Colors match exactly (use hex/RGB comparison tools)
- [ ] Typography sizes and weights correct
- [ ] Spacing measurements precise (use design inspector)
- [ ] Corner radius applied to all boxes
- [ ] Shadows rendered correctly
- [ ] Animations smooth (60fps)
- [ ] Dark mode colors correct
- [ ] Touch targets 44pt minimum
- [ ] Text contrast 4.5:1 or higher
- [ ] Responsive at all widget sizes
- [ ] Renders correctly on iPhone 12, 13, 14, 15
- [ ] Safe area respected
- [ ] No clipping of content

---

**Design System Version**: 1.0
**Last Updated**: March 10, 2026
**Status**: Ready for Implementation
