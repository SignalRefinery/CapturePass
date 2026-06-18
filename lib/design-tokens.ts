export const designTokens = {
  colors: {
    primary: "#0B5FFF",
    deepBlue: "#0F4C81",
    insightGold: "#F5B301",
    successGreen: "#16A34A",
    charcoal: "#111827",
    background: "#FAFBFC",
    white: "#FFFFFF"
  },
  rgb: {
    primary: "11, 95, 255",
    deepBlue: "15, 76, 129",
    insightGold: "245, 179, 1",
    successGreen: "22, 163, 74",
    charcoal: "17, 24, 39",
    background: "250, 251, 252",
    white: "255, 255, 255"
  }
} as const;

export type DesignTokens = typeof designTokens;

export const brandColors = designTokens.colors;

export function brandRgba(color: keyof typeof designTokens.rgb, alpha: number) {
  return `rgba(${designTokens.rgb[color]}, ${alpha})`;
}
