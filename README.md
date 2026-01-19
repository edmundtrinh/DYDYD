# Did You Do Your Dailies? (DYDYD)

A gamified habit tracking mobile app that turns daily life into a game-like quest system. Earn XP, level up, and stay motivated to build healthy habits across all facets of life.

## 🎮 Features

- **Daily & Weekly Quests**: Complete habits and tasks to earn experience points
- **Gamification**: XP system, levels, streaks, and badges
- **Health Integration**: Auto-sync with Apple Health and Google Fit
- **Cross-Platform**: iOS and Android with feature parity
- **Widgets**: Home screen widgets for quick progress views
- **Apple Watch**: Companion app for on-the-go tracking
- **Progress Dashboard**: Visualize your habits and trends

## 📁 Project Structure

```
dydyd/
├── apps/
│   ├── mobile/          # React Native app (iOS & Android)
│   └── backend/         # Node.js/Express API server
├── packages/
│   └── shared/          # Shared types, constants, and utilities
├── turbo.json           # Turbo build configuration
└── package.json         # Monorepo root configuration
```

## 🛠 Tech Stack

### Mobile App
- **Framework**: React Native 0.73 with TypeScript
- **State Management**: Redux Toolkit with persistence
- **Navigation**: React Navigation 6
- **Health Data**: Apple HealthKit / Google Fit

### Backend
- **Runtime**: Node.js with Express
- **Database**: PostgreSQL
- **Cache**: Redis
- **Auth**: JWT tokens

### Shared
- TypeScript types and interfaces
- Quest library with 50+ predefined habits
- XP/level calculation utilities
- Validation helpers

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Yarn 4 (Corepack)
- Xcode 15+ (for iOS)
- Android Studio (for Android)
- CocoaPods (for iOS dependencies)

### Installation

1. **Enable Corepack** (if not already):
   ```bash
   corepack enable
   ```

2. **Install dependencies**:
   ```bash
   yarn install
   ```

3. **Build shared packages**:
   ```bash
   yarn build
   ```

4. **Run the mobile app**:
   ```bash
   # iOS
   cd apps/mobile
   yarn ios
   
   # Android
   cd apps/mobile
   yarn android
   ```

5. **Run the backend** (when implemented):
   ```bash
   cd apps/backend
   yarn dev
   ```

## 📱 Quest Categories

| Category | Examples |
|----------|----------|
| 🏃 Physical Health | Steps, sleep, exercise, hydration |
| 🧠 Mental Wellness | Meditation, journaling, reading |
| 💼 Career & Productivity | Job applications, learning, networking |
| ❤️ Relationships & Social | Family time, social outings, calls |
| 🏠 Home & Chores | Cleaning, laundry, cooking |

## 🎯 XP System

- **Level Formula**: `baseXP * (growthRate ^ (level - 1))`
- **Base XP**: 100 per level
- **Growth Rate**: 1.15x multiplier
- **Max Level**: 100

## 📄 License

This project is proprietary. All rights reserved.

## 🤝 Contributing

This is a private project. Please contact the maintainers for contribution guidelines.
