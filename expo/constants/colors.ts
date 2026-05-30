/**
 * "Golden Hour" color palette for Random Quotes For You.
 * Warm, inviting tones with rich amber accents.
 */

// ── Light Mode ──────────────────────────────────────────────
const warmCream = "#FEF9F3" as const;
const softWhite = "#FFFFFF" as const;
const darkBrown = "#3D2C1E" as const;
const warmTaupe = "#8B7355" as const;
const amberGold = "#C8873A" as const;
const paleGold = "#E8D5B0" as const;
const mutedWarm = "#B8A088" as const;

// ── Dark Mode ───────────────────────────────────────────────
const deepCharcoal = "#1A1614" as const;
const darkCard = "#25201C" as const;
const warmCreamDark = "#F0E6D8" as const;
const mutedWarmDark = "#A89880" as const;
const brightGold = "#D4A054" as const;
const subtleGold = "#3D3224" as const;
const darkSurface = "#2C2722" as const;

// ── Shared ──────────────────────────────────────────────────
const dangerRed = "#E05555" as const;
const successGreen = "#5C9A6F" as const;

export type ThemeColors = typeof light;

export const light = {
  background: warmCream,
  surface: softWhite,
  card: softWhite,
  primaryText: darkBrown,
  secondaryText: warmTaupe,
  accent: amberGold,
  accentLight: paleGold,
  border: paleGold,
  tabBar: softWhite,
  tabBarBorder: paleGold,
  tabIconDefault: mutedWarm,
  tabIconSelected: amberGold,
  danger: dangerRed,
  success: successGreen,
  shadow: "rgba(61, 44, 30, 0.08)",
  gradientStart: warmCream,
  gradientEnd: paleGold,
  dailyCardBg: "#FAF5EB",
  chipBg: "#F5EDE0",
  chipText: darkBrown,
  skeleton: "#F0E8DA",
} as const;

export const dark = {
  background: deepCharcoal,
  surface: darkCard,
  card: darkCard,
  primaryText: warmCreamDark,
  secondaryText: mutedWarmDark,
  accent: brightGold,
  accentLight: subtleGold,
  border: "#3D3224",
  tabBar: "#151210",
  tabBarBorder: "#2C2722",
  tabIconDefault: mutedWarmDark,
  tabIconSelected: brightGold,
  danger: "#E07070",
  success: "#6DAA7E",
  shadow: "rgba(0, 0, 0, 0.3)",
  gradientStart: deepCharcoal,
  gradientEnd: "#2C1F14",
  dailyCardBg: "#1F1B18",
  chipBg: darkSurface,
  chipText: warmCreamDark,
  skeleton: "#2C2722",
} as const;
