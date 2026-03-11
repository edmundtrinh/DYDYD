# Quick Integration Guide - Widget Prototype

## 🎯 How to View the Widget Prototype

### Method 1: Add Route (Recommended)

#### If using React Router:
```typescript
// apps/mobile/src/navigation/AppRouter.tsx
import { WidgetDemoScreen } from '@/screens/WidgetDemoScreen';

export const AppRouter = () => {
  return (
    <Routes>
      {/* ... existing routes ... */}
      <Route path="/widget-demo" element={<WidgetDemoScreen />} />
    </Routes>
  );
};
```

#### If using React Navigation (React Native):
```typescript
// apps/mobile/src/navigation/RootNavigator.tsx
import { WidgetDemoScreen } from '@/screens/WidgetDemoScreen';

const Stack = createNativeStackNavigator();

export const RootNavigator = () => {
  return (
    <Stack.Navigator>
      {/* ... existing screens ... */}
      <Stack.Screen
        name="WidgetDemo"
        component={WidgetDemoScreen}
        options={{ title: 'Widget Prototype' }}
      />
    </Stack.Navigator>
  );
};
```

### Method 2: Add to Dev Menu
Add a link in your development dashboard:
```tsx
<Link to="/widget-demo">
  📱 View Widget Prototype
</Link>
```

### Method 3: Direct Import in Dev Page
```tsx
import WidgetDemo from '@/components/WidgetDemo';

export const DevDashboard = () => {
  return (
    <div className="space-y-4">
      <h1>Development Tools</h1>
      <WidgetDemo />
    </div>
  );
};
```

## 🔌 Connect Real Data

### Step 1: Import Redux Hooks
```typescript
import { useSelector } from 'react-redux';
import { selectActiveQuests } from '@/store/questSlice';
import { selectUserProgress } from '@/store/progressSlice';
```

### Step 2: Modify WidgetDemo Component
Replace the mock data section with:
```typescript
// Replace this:
const MOCK_QUESTS: QuestData[] = [...]

// With this:
const WidgetDemo: React.FC = () => {
  const activeQuests = useSelector(selectActiveQuests);
  const progress = useSelector(selectUserProgress);
  const [isDark, setIsDark] = useState(false);

  // Transform Redux data to QuestData format
  const quests: QuestData[] = activeQuests.map((quest) => ({
    id: quest.id,
    name: quest.name,
    category: quest.category,
    currentValue: progress[quest.id]?.current || 0,
    targetValue: quest.targetValue || 100,
    unit: quest.unit || 'units',
    streak: quest.currentStreak || 0,
    completed: progress[quest.id]?.completed || false,
    xpValue: quest.baseXP || 0,
  }));

  // ... rest of component uses quests instead of MOCK_QUESTS
};
```

### Step 3: Implement Quick-Log Handlers
```typescript
import { useDispatch } from 'react-redux';
import { completeQuest } from '@/store/questSlice';

const WidgetDemo: React.FC = () => {
  const dispatch = useDispatch();

  const handleQuickLog = (questId: string, amount: number) => {
    dispatch(completeQuest({
      questId,
      value: amount,
      source: 'manual',
    }));
  };

  // Update button onClick:
  <QuickLogButton
    label="+100"
    icon="➕"
    onClick={() => handleQuickLog(quest.id, 100)}
    color={color.bg}
  />
};
```

## 🎨 Customize for Your Brand

### Change Colors to Match DYDYD
The colors are already set to match the shared constants, but if you need to adjust:

```typescript
// Option 1: Import from shared constants
import { CATEGORY_COLORS } from '@dydyd/shared/constants';

// Option 2: Override specific colors
const CATEGORY_COLORS = {
  physical_health: {
    bg: '#EF4444',  // Your red
    light: '#FEE2E2',
    text: '#DC2626'
  },
  // ... rest of categories
};
```

### Adjust Widget Dimensions
```typescript
// In MediumWidget and LargeWidget:
<div style={{ maxWidth: '329px' }}>  {/* Change this value */}
```

### Change Animation Speed
```typescript
// In SmartStackDemo:
setTimeout(() => setIsAnimating(false), 300); // Change 300ms to your preference

// In ProgressCircle:
className="transition-all duration-500" {/* Change duration */}
```

## 📱 Test Responsiveness

The component is designed for web display but works on all screen sizes:

```tsx
// Test at different breakpoints:
// - Mobile: 375×812 (iPhone 12)
// - Tablet: 768×1024 (iPad)
// - Desktop: 1280×800 (laptop)

// The component uses Tailwind's responsive classes:
// md: and lg: prefixes for responsive design
```

## 🧪 Test Dark Mode

Click the "🌙 Dark" button in the top-right to toggle dark mode:

```typescript
// Dark mode uses Tailwind classes:
isDark ? 'bg-gray-900 text-white' : 'bg-white text-gray-900'

// Colors adapt for dark mode:
isDark ? 'text-gray-400' : 'text-gray-600'
```

## 🚀 Deploy to Production

### Before deploying:

1. **Connect Real Data**
   - [ ] Replace mock MOCK_QUESTS with Redux store
   - [ ] Implement handleQuickLog with API calls
   - [ ] Add loading and error states

2. **Add Native Features**
   - [ ] Implement swipe gestures (react-use-gesture)
   - [ ] Add haptic feedback (react-haptics)
   - [ ] Integrate with WidgetKit (iOS)
   - [ ] Implement Android widget

3. **Testing**
   - [ ] Unit tests for data transformation
   - [ ] E2E tests for interactions
   - [ ] Visual regression tests
   - [ ] Performance tests

4. **Optimization**
   - [ ] Lazy load detail sections
   - [ ] Memoize expensive calculations
   - [ ] Use virtualization for long lists
   - [ ] Optimize bundle size

## 📊 Performance Tips

### Use React.memo for Widget Components
```typescript
export const MediumWidget = React.memo(
  ({ quest, isDark }: MediumWidgetProps) => {
    // component code
  },
  (prev, next) => {
    // Custom comparison to avoid re-renders
    return prev.quest.id === next.quest.id && prev.isDark === next.isDark;
  }
);
```

### Optimize Progress Circle Rendering
```typescript
const ProgressCircle = React.memo(({ percentage, size, color }: ProgressCircleProps) => {
  // Only re-render when percentage changes
});
```

### Use useMemo for Expensive Calculations
```typescript
const transformedQuests = useMemo(() => {
  return quests.map(q => ({ /* transform */ }));
}, [quests]);
```

## 🐛 Troubleshooting

### Issue: Styling not applied
**Solution**: Make sure Tailwind CSS is configured in your project
```bash
# Check if Tailwind is installed
npm list tailwindcss

# If missing, install:
npm install -D tailwindcss postcss autoprefixer
```

### Issue: Icons not showing
**Solution**: lucide-react must be installed
```bash
npm install lucide-react
```

### Issue: Component doesn't respond to clicks
**Solution**: Check that React is properly handling events
```typescript
// Make sure buttons have onClick handlers
<button onClick={() => console.log('clicked')}>
  Click me
</button>
```

### Issue: Dark mode colors look wrong
**Solution**: Verify Tailwind dark mode is enabled
```javascript
// tailwind.config.js
module.exports = {
  darkMode: 'class', // or 'media'
  // ...
};
```

## 📚 Related Files

- **Component**: `./apps/mobile/src/components/WidgetDemo.tsx`
- **Screen**: `./apps/mobile/src/screens/WidgetDemoScreen.tsx`
- **Guide**: `./WIDGET_PROTOTYPE_GUIDE.md`
- **Types**: `./packages/shared/src/types.ts`
- **Constants**: `./packages/shared/src/constants.ts`

## 🎓 Learning Resources

- [React Hooks](https://react.dev/reference/react)
- [Tailwind CSS](https://tailwindcss.com)
- [iOS WidgetKit](https://developer.apple.com/documentation/widgetkit)
- [SwiftUI](https://developer.apple.com/xcode/swiftui/)
- [React Navigation](https://reactnavigation.org)

## 💬 Questions?

1. Review the detailed guide: `WIDGET_PROTOTYPE_GUIDE.md`
2. Check the component comments in `WidgetDemo.tsx`
3. Look at mock data structure for examples
4. Review the "Next Steps" section in the guide

---

**Happy prototyping! 🚀**
