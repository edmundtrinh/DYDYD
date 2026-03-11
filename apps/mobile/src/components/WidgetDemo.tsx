import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Settings } from 'lucide-react';

// ==================== TYPES ====================

interface QuestData {
  id: string;
  name: string;
  category: 'physical_health' | 'mental_wellness' | 'career_productivity' | 'relationships_social' | 'home_chores';
  currentValue: number;
  targetValue: number;
  unit: string;
  streak: number;
  completed: boolean;
  xpValue: number;
}

interface ActivityLogEntry {
  timestamp: string;
  amount: number;
  xpEarned: number;
}

// ==================== CONSTANTS ====================

const CATEGORY_COLORS: Record<string, { bg: string; light: string; text: string }> = {
  physical_health: { bg: '#EF4444', light: '#FEE2E2', text: '#DC2626' },
  mental_wellness: { bg: '#8B5CF6', light: '#F3E8FF', text: '#7C3AED' },
  career_productivity: { bg: '#3B82F6', light: '#DBEAFE', text: '#1D4ED8' },
  relationships_social: { bg: '#F59E0B', light: '#FEF3C7', text: '#D97706' },
  home_chores: { bg: '#10B981', light: '#D1FAE5', text: '#059669' },
};

const CATEGORY_ICONS: Record<string, string> = {
  physical_health: '🏃',
  mental_wellness: '🧘',
  career_productivity: '💼',
  relationships_social: '👥',
  home_chores: '🏠',
};

// ==================== MOCK DATA ====================

const MOCK_QUESTS: QuestData[] = [
  {
    id: '1',
    name: 'Walk 10k Steps',
    category: 'physical_health',
    currentValue: 6750,
    targetValue: 10000,
    unit: 'steps',
    streak: 12,
    completed: false,
    xpValue: 50,
  },
  {
    id: '2',
    name: 'Meditate',
    category: 'mental_wellness',
    currentValue: 15,
    targetValue: 20,
    unit: 'minutes',
    streak: 5,
    completed: false,
    xpValue: 30,
  },
  {
    id: '3',
    name: 'Code Review',
    category: 'career_productivity',
    currentValue: 1,
    targetValue: 1,
    unit: 'task',
    streak: 8,
    completed: true,
    xpValue: 40,
  },
];

const ACTIVITY_LOG: ActivityLogEntry[] = [
  { timestamp: '3:45 PM', amount: 2100, xpEarned: 25 },
  { timestamp: '1:20 PM', amount: 1850, xpEarned: 22 },
  { timestamp: '11:00 AM', amount: 1500, xpEarned: 18 },
];

// ==================== COMPONENTS ====================

interface ProgressCircleProps {
  percentage: number;
  size: 'sm' | 'md' | 'lg';
  color: string;
}

const ProgressCircle: React.FC<ProgressCircleProps> = ({ percentage, size, color }) => {
  const sizes = { sm: 60, md: 80, lg: 100 };
  const circumference = 2 * Math.PI * (sizes[size] / 2 - 4);
  const offset = circumference * (1 - percentage / 100);
  const actualSize = sizes[size];

  return (
    <div className="relative flex items-center justify-center" style={{ width: actualSize, height: actualSize }}>
      <svg width={actualSize} height={actualSize} className="transform -rotate-90">
        <circle cx={actualSize / 2} cy={actualSize / 2} r={actualSize / 2 - 4} fill="none" stroke="#e5e7eb" strokeWidth="3" />
        <circle
          cx={actualSize / 2}
          cy={actualSize / 2}
          r={actualSize / 2 - 4}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-lg font-bold" style={{ color }}>{Math.round(percentage)}%</div>
        <div className="text-xs text-gray-500">Complete</div>
      </div>
    </div>
  );
};

interface QuickLogButtonProps {
  label: string;
  icon: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  color?: string;
}

const QuickLogButton: React.FC<QuickLogButtonProps> = ({ label, icon, onClick, variant = 'primary', color = '#3B82F6' }) => {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 active:scale-95 flex items-center gap-2 ${
        variant === 'primary'
          ? 'text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
      style={variant === 'primary' ? { backgroundColor: color } : undefined}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
};

interface DetailSectionProps {
  title: string;
  content: React.ReactNode;
}

const DetailSection: React.FC<DetailSectionProps> = ({ title, content }) => (
  <div className="border-b border-gray-200 pb-4 last:border-b-0">
    <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">{title}</h3>
    {content}
  </div>
);

// ==================== WIDGET COMPONENTS ====================

interface MediumWidgetProps {
  quest: QuestData;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  isDark?: boolean;
}

const MediumWidget: React.FC<MediumWidgetProps> = ({ quest, onSwipeLeft, onSwipeRight, isDark = false }) => {
  const color = CATEGORY_COLORS[quest.category];
  const percentage = (quest.currentValue / quest.targetValue) * 100;

  return (
    <div
      className={`w-full rounded-2xl p-4 space-y-4 shadow-lg border border-gray-100 ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white'
      }`}
      style={{ maxWidth: '329px' }}
    >
      {/* Header */}
      <div className={`flex items-start justify-between ${isDark ? 'text-white' : ''}`}>
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-10 rounded-full"
            style={{ backgroundColor: color.bg }}
          />
          <div>
            <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {CATEGORY_ICONS[quest.category]} {quest.category.replace(/_/g, ' ')}
            </p>
            <h2 className={`text-base font-semibold ${isDark ? 'text-white' : ''}`}>{quest.name}</h2>
          </div>
        </div>
        {quest.streak > 0 && (
          <div className={`text-xs font-bold px-2 py-1 rounded-full ${isDark ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-700'}`}>
            🔥 {quest.streak}
          </div>
        )}
      </div>

      {/* Progress Circle */}
      <div className="flex justify-center py-4">
        <ProgressCircle
          percentage={percentage}
          size="md"
          color={color.bg}
        />
      </div>

      {/* Value Display */}
      <div className="text-center">
        <p className={`text-2xl font-bold ${isDark ? 'text-white' : ''}`}>
          {quest.currentValue.toLocaleString()}
        </p>
        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          of {quest.targetValue.toLocaleString()} {quest.unit}
        </p>
      </div>

      {/* Quick Log Buttons */}
      <div className="flex gap-2">
        <QuickLogButton
          label="+100"
          icon="➕"
          onClick={() => console.log('Add 100')}
          color={color.bg}
        />
        <QuickLogButton
          label="+500"
          icon="⬆️"
          onClick={() => console.log('Add 500')}
          color={color.bg}
        />
      </div>

      {/* Swipe Hint */}
      <p className={`text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        Swipe for more quests ➡️
      </p>
    </div>
  );
};

interface LargeWidgetProps {
  quest: QuestData;
  isDark?: boolean;
}

const LargeWidget: React.FC<LargeWidgetProps> = ({ quest, isDark = false }) => {
  const color = CATEGORY_COLORS[quest.category];
  const percentage = (quest.currentValue / quest.targetValue) * 100;

  return (
    <div
      className={`w-full rounded-2xl overflow-hidden shadow-lg border border-gray-100 ${
        isDark ? 'bg-gray-900 border-gray-800' : 'bg-white'
      }`}
      style={{ maxWidth: '329px' }}
    >
      {/* Featured Quest Section */}
      <div className="p-4 space-y-4 border-b border-gray-200">
        {/* Header */}
        <div className={`flex items-start justify-between ${isDark ? 'text-white' : ''}`}>
          <div className="flex items-center gap-3">
            <div
              className="w-1 h-10 rounded-full"
              style={{ backgroundColor: color.bg }}
            />
            <div>
              <p className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {CATEGORY_ICONS[quest.category]} {quest.category.replace(/_/g, ' ')}
              </p>
              <h2 className={`text-base font-semibold ${isDark ? 'text-white' : ''}`}>{quest.name}</h2>
            </div>
          </div>
          {quest.streak > 0 && (
            <div className={`text-xs font-bold px-2 py-1 rounded-full ${isDark ? 'bg-orange-900 text-orange-200' : 'bg-orange-100 text-orange-700'}`}>
              🔥 {quest.streak}
            </div>
          )}
        </div>

        {/* Progress Circle */}
        <div className="flex justify-center py-4">
          <ProgressCircle
            percentage={percentage}
            size="lg"
            color={color.bg}
          />
        </div>

        {/* Value Display */}
        <div className="text-center">
          <p className={`text-3xl font-bold ${isDark ? 'text-white' : ''}`}>
            {quest.currentValue.toLocaleString()}
          </p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            of {quest.targetValue.toLocaleString()} {quest.unit}
          </p>
        </div>

        {/* Quick Log Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <QuickLogButton
            label="+100 Steps"
            icon="🚶"
            onClick={() => console.log('Add 100')}
            color={color.bg}
          />
          <QuickLogButton
            label="+500 Steps"
            icon="🏃"
            onClick={() => console.log('Add 500')}
            color={color.bg}
          />
        </div>
      </div>

      {/* Detail Sections - Scrollable */}
      <div className={`p-4 space-y-6 max-h-64 overflow-y-auto ${isDark ? 'text-white' : ''}`}>
        {/* Hourly Breakdown */}
        <DetailSection
          title="Hourly Breakdown"
          content={
            <div className="flex items-end gap-1 h-12">
              {[30, 45, 60, 50, 70, 65, 55].map((height, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-t bg-gradient-to-t"
                  style={{
                    height: `${(height / 70) * 100}%`,
                    backgroundImage: `linear-gradient(to top, ${color.bg}, ${color.light})`,
                    opacity: 0.8,
                  }}
                  title={`${6 + i}am`}
                />
              ))}
            </div>
          }
        />

        {/* Weekly Comparison */}
        <DetailSection
          title="This Week"
          content={
            <div className="flex gap-3">
              <div className="flex-1">
                <p className={`text-xs font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'} mb-2`}>This Week</p>
                <div className="flex gap-1">
                  {[1, 0.8, 1, 0.6, 0.9, 0.7, 1].map((val, i) => (
                    <div key={i} className="flex-1 h-8 rounded bg-blue-100" style={{ opacity: val }} />
                  ))}
                </div>
                <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>6/7 days</p>
              </div>
            </div>
          }
        />

        {/* Activity Log */}
        <DetailSection
          title="Recent Activity"
          content={
            <div className="space-y-2">
              {ACTIVITY_LOG.map((entry, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>{entry.timestamp}</span>
                  <div className="flex items-center gap-2">
                    <span className={`font-medium ${isDark ? 'text-white' : ''}`}>+{entry.amount.toLocaleString()}</span>
                    <span className={`text-xs font-semibold px-2 py-1 rounded ${isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-700'}`}>
                      +{entry.xpEarned} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          }
        />
      </div>
    </div>
  );
};

// ==================== SMART STACK DEMO ====================

interface SmartStackDemoProps {
  isDark?: boolean;
}

const SmartStackDemo: React.FC<SmartStackDemoProps> = ({ isDark = false }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (prev + 1) % MOCK_QUESTS.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handlePrev = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex((prev) => (prev - 1 + MOCK_QUESTS.length) % MOCK_QUESTS.length);
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <div className="flex items-center justify-center gap-4">
      <button
        onClick={handlePrev}
        disabled={isAnimating}
        className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50"
      >
        <ChevronLeft size={24} />
      </button>

      <div className={`transform transition-all duration-300 ${isAnimating ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}>
        <MediumWidget quest={MOCK_QUESTS[activeIndex]} isDark={isDark} />
      </div>

      <button
        onClick={handleNext}
        disabled={isAnimating}
        className="p-2 rounded-full hover:bg-gray-200 disabled:opacity-50"
      >
        <ChevronRight size={24} />
      </button>

      {/* Indicator Dots */}
      <div className="flex gap-2">
        {MOCK_QUESTS.map((_, i) => (
          <button
            key={i}
            onClick={() => !isAnimating && setActiveIndex(i)}
            className={`w-2 h-2 rounded-full transition-all ${
              i === activeIndex ? 'bg-blue-500 w-6' : 'bg-gray-300'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

// ==================== MAIN DEMO PAGE ====================

export const WidgetDemo: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [activeTab, setActiveTab] = useState<'medium' | 'large' | 'stack'>('medium');

  return (
    <div className={`min-h-screen p-8 transition-colors duration-200 ${isDark ? 'bg-gray-950 text-white' : 'bg-gray-50'}`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-3xl font-bold">DYDYD iOS Widget Prototype</h1>
            <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Interactive wireframe demo of widget designs
            </p>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              isDark
                ? 'bg-white text-gray-900 hover:bg-gray-100'
                : 'bg-gray-900 text-white hover:bg-gray-800'
            }`}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-300">
          {(['medium', 'large', 'stack'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium transition-all border-b-2 ${
                activeTab === tab
                  ? `border-blue-500 ${isDark ? 'text-blue-400' : 'text-blue-600'}`
                  : `border-transparent ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`
              }`}
            >
              {tab === 'medium' && '📱 Medium (2x2)'}
              {tab === 'large' && '📲 Large (2x3/2x4)'}
              {tab === 'stack' && '🔄 Smart Stack'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className={`rounded-xl p-8 ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-white border border-gray-200'}`}>
          {activeTab === 'medium' && (
            <div className="space-y-8">
              <div>
                <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : ''}`}>
                  Medium Widget (2x2 - 329×329)
                </h2>
                <div className="flex justify-center">
                  <MediumWidget quest={MOCK_QUESTS[0]} isDark={isDark} />
                </div>
              </div>

              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-blue-50'}`}>
                <h3 className={`font-semibold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-900'}`}>Features:</h3>
                <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <li>✅ Category color bar & streak badge</li>
                  <li>✅ Animated progress circle with percentage</li>
                  <li>✅ Current/target value display</li>
                  <li>✅ Quick-log preset buttons (+100, +500)</li>
                  <li>✅ Swipe hint text</li>
                  <li>✅ Dark mode support</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'large' && (
            <div className="space-y-8">
              <div>
                <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : ''}`}>
                  Large Widget (2x3/2x4 - 329×560+)
                </h2>
                <div className="flex justify-center">
                  <LargeWidget quest={MOCK_QUESTS[0]} isDark={isDark} />
                </div>
              </div>

              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-green-50'}`}>
                <h3 className={`font-semibold mb-2 ${isDark ? 'text-green-300' : 'text-green-900'}`}>Features:</h3>
                <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <li>✅ All Medium widget features</li>
                  <li>✅ Scrollable detail sections below</li>
                  <li>✅ Hourly breakdown chart</li>
                  <li>✅ Weekly comparison (this week)</li>
                  <li>✅ Recent activity log with XP</li>
                  <li>✅ Smooth scroll with indicators</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'stack' && (
            <div className="space-y-8">
              <div>
                <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : ''}`}>
                  Smart Stack - Swipeable Between Quests
                </h2>
                <div className="flex justify-center py-8">
                  <SmartStackDemo isDark={isDark} />
                </div>
              </div>

              <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-purple-50'}`}>
                <h3 className={`font-semibold mb-2 ${isDark ? 'text-purple-300' : 'text-purple-900'}`}>Features:</h3>
                <ul className={`text-sm space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <li>✅ Left/right navigation buttons</li>
                  <li>✅ Smooth scale animation on transition</li>
                  <li>✅ Dot indicators showing current position</li>
                  <li>✅ Tappable dots for quick jump</li>
                  <li>✅ Intelligent quest priority (highest streak first)</li>
                  <li>✅ Supports up to 5 quests in stack</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Design Specs */}
        <div className={`mt-12 p-8 rounded-xl ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-gray-100 border border-gray-300'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : ''}`}>Design Specifications</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <p className={`font-semibold ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>Spacing</p>
              <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>Widget padding: 16pt</p>
              <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>Category bar: 4pt</p>
            </div>
            <div>
              <p className={`font-semibold ${isDark ? 'text-green-300' : 'text-green-700'}`}>Typography</p>
              <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>Quest name: 16pt semibold</p>
              <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>Progress: 18pt bold</p>
            </div>
            <div>
              <p className={`font-semibold ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>Animations</p>
              <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>Bounce: 350ms spring</p>
              <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>Progress update: 500ms</p>
            </div>
            <div>
              <p className={`font-semibold ${isDark ? 'text-orange-300' : 'text-orange-700'}`}>Colors</p>
              <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>Physical: #EF4444 (Red)</p>
              <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>Mental: #8B5CF6 (Purple)</p>
            </div>
            <div>
              <p className={`font-semibold ${isDark ? 'text-pink-300' : 'text-pink-700'}`}>Progress Circle</p>
              <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>MD: 80pt diameter</p>
              <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>LG: 100pt diameter</p>
            </div>
            <div>
              <p className={`font-semibold ${isDark ? 'text-cyan-300' : 'text-cyan-700'}`}>Buttons</p>
              <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>Height: 36pt</p>
              <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>Min tap target: 44pt</p>
            </div>
          </div>
        </div>

        {/* Implementation Notes */}
        <div className={`mt-8 p-8 rounded-xl ${isDark ? 'bg-gray-900 border border-gray-800' : 'bg-amber-50 border border-amber-300'}`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-amber-300' : 'text-amber-900'}`}>
            Next Steps for Production
          </h2>
          <ol className={`text-sm space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <li>1. Connect to real quest data from Redux store</li>
            <li>2. Implement swipe gestures with react-gesture or Framer Motion</li>
            <li>3. Add haptic feedback using react-haptics</li>
            <li>4. Create WidgetKit bridge for iOS app extension</li>
            <li>5. Add TimelineProvider for 15-min refresh intervals</li>
            <li>6. Implement quick-log API calls with optimistic updates</li>
            <li>7. Add error states and loading indicators</li>
            <li>8. Test on real iOS devices (iPhone 12+)</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default WidgetDemo;
