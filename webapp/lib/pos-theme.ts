// POS Theme Color Utility
// This file contains all theme color configurations for the POS system

export type POSTheme = 'orange' | 'blue' | 'green' | 'purple' | 'red' | 'teal' | 'amber' | 'pink';

export interface ThemeColors {
  primary: string;      // Main accent color (buttons, highlights)
  primaryHover: string; // Hover state
  secondary: string;    // Secondary accent
  gradient: string;     // Gradient for backgrounds
  text: string;         // Text color on primary bg
  bgLight: string;      // Light background variant
  border: string;       // Border color
}

// Theme color mappings using Tailwind CSS classes
export const posThemeColors: Record<POSTheme, ThemeColors> = {
  orange: {
    primary: 'bg-orange-500',
    primaryHover: 'hover:bg-orange-600',
    secondary: 'bg-orange-600',
    gradient: 'from-orange-500 to-red-500',
    text: 'text-orange-500',
    bgLight: 'bg-orange-500/20',
    border: 'border-orange-500',
  },
  blue: {
    primary: 'bg-blue-500',
    primaryHover: 'hover:bg-blue-600',
    secondary: 'bg-blue-600',
    gradient: 'from-blue-500 to-cyan-500',
    text: 'text-blue-500',
    bgLight: 'bg-blue-500/20',
    border: 'border-blue-500',
  },
  green: {
    primary: 'bg-green-500',
    primaryHover: 'hover:bg-green-600',
    secondary: 'bg-green-600',
    gradient: 'from-green-500 to-emerald-500',
    text: 'text-green-500',
    bgLight: 'bg-green-500/20',
    border: 'border-green-500',
  },
  purple: {
    primary: 'bg-purple-500',
    primaryHover: 'hover:bg-purple-600',
    secondary: 'bg-purple-600',
    gradient: 'from-purple-500 to-pink-500',
    text: 'text-purple-500',
    bgLight: 'bg-purple-500/20',
    border: 'border-purple-500',
  },
  red: {
    primary: 'bg-red-500',
    primaryHover: 'hover:bg-red-600',
    secondary: 'bg-red-600',
    gradient: 'from-red-500 to-rose-500',
    text: 'text-red-500',
    bgLight: 'bg-red-500/20',
    border: 'border-red-500',
  },
  teal: {
    primary: 'bg-teal-500',
    primaryHover: 'hover:bg-teal-600',
    secondary: 'bg-teal-600',
    gradient: 'from-teal-500 to-cyan-500',
    text: 'text-teal-500',
    bgLight: 'bg-teal-500/20',
    border: 'border-teal-500',
  },
  amber: {
    primary: 'bg-amber-500',
    primaryHover: 'hover:bg-amber-600',
    secondary: 'bg-amber-600',
    gradient: 'from-amber-500 to-yellow-500',
    text: 'text-amber-500',
    bgLight: 'bg-amber-500/20',
    border: 'border-amber-500',
  },
  pink: {
    primary: 'bg-pink-500',
    primaryHover: 'hover:bg-pink-600',
    secondary: 'bg-pink-600',
    gradient: 'from-pink-500 to-rose-500',
    text: 'text-pink-500',
    bgLight: 'bg-pink-500/20',
    border: 'border-pink-500',
  },
};

// Get theme colors by theme code
export function getThemeColors(theme: string): ThemeColors {
  return posThemeColors[theme as POSTheme] || posThemeColors.orange;
}

// Map theme to Tailwind classes for specific components
export function getThemeClasses(theme: string) {
  const colors = getThemeColors(theme);

  return {
    // Buttons
    primaryButton: `${colors.primary} ${colors.primaryHover} text-white`,
    secondaryButton: `${colors.secondary} text-white`,

    // Badges/Pills
    badge: `${colors.primary} text-white`,
    badgeLight: `${colors.bgLight} ${colors.text}`,

    // Text
    textPrimary: colors.text,

    // Backgrounds
    bgPrimary: colors.primary,
    bgLight: colors.bgLight,
    bgGradient: `bg-gradient-to-r ${colors.gradient}`,

    // Borders
    borderPrimary: colors.border,

    // Icons
    iconColor: colors.text,

    // Order count badge
    orderBadge: `${colors.primary} text-white`,

    // Table number badge
    tableBadge: `${colors.primary}`,

    // Status colors (keep some fixed for UX clarity)
    statusPending: 'bg-yellow-500',
    statusConfirmed: 'bg-blue-500',
    statusPreparing: colors.primary,
    statusReady: 'bg-green-500',
  };
}

// Default theme
export const DEFAULT_THEME: POSTheme = 'orange';
