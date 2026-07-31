export const PERFORMANCE_RATING_LABELS = {
  1: "Negative",
  2: "Neutral",
  3: "Positive",
  4: "Great",
  5: "Outstanding",
} as const

export type PerformanceRating = keyof typeof PERFORMANCE_RATING_LABELS
