/* DYDYD UI Kit · Mobile · shared component styles */

const dyColors = {
  bg: '#0F0F1A', surface1: '#1A1A2E', surface2: '#232338', surface3: '#2A2A3E',
  fg1: '#fff', fg2: '#B7B7CC', fg3: '#888899', fg4: '#5A5A6E',
  green: '#2EA043', greenBright: '#34C75A',
  blue: '#2563EB', blueBright: '#3B82F6',
  purple: '#7C3AED', purpleBright: '#8B5CF6',
  orange: '#EA580C', orangeBright: '#F97316',
  red: '#DC2626', redBright: '#EF4444',
  gold: '#F5B400', goldBright: '#FBBF24',
};

const CATEGORIES = {
  physical_health:      { name: 'Physical Health',     icon: '💪', color: dyColors.green,  },
  mental_wellness:      { name: 'Mental Wellness',     icon: '🧠', color: dyColors.purple, },
  career_productivity:  { name: 'Career & Productivity', icon: '💼', color: dyColors.blue,   },
  relationships_social: { name: 'Relationships',       icon: '❤️', color: dyColors.red,    },
  home_chores:          { name: 'Home & Chores',       icon: '🏠', color: dyColors.orange, },
};

const RARITY = {
  common:    { color: '#9CA3AF' },
  uncommon:  { color: dyColors.green },
  rare:      { color: dyColors.blue },
  epic:      { color: dyColors.purple },
  legendary: { color: dyColors.gold },
  mythic:    { color: dyColors.red },
};

function fmtNum(n){ if(n>=1e6) return (n/1e6).toFixed(1)+'M'; if(n>=1e3) return (n/1e3).toFixed(1)+'K'; return String(n); }

Object.assign(window, { dyColors, CATEGORIES, RARITY, fmtNum });
