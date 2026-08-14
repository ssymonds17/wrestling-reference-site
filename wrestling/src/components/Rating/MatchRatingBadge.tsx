interface MatchRatingBadgeProps {
  rating: number
  size?: "sm" | "lg"
}

/**
 * Overall match ratings are a fixed set: 1, 2, 3, 4, 4.25, 4.5, 4.75, 5. The
 * colour scheme is deliberately not a single gradient — the quarter-point
 * values above 4 are their own bands:
 *
 *   1           red
 *   2           blue
 *   3           orange
 *   4           green
 *   4.25, 4.5   gold
 *   4.75, 5     purple
 *
 * Thresholds are checked high to low so an unexpected in-between value (say
 * 4.6) still lands in the nearest band below rather than falling through.
 * These are literal class strings because Tailwind cannot build class names
 * from interpolated values.
 *
 * The gold band runs hotter than the others (25% fill, 70% border, near-white
 * text) so it reads as gold rather than a washed-out yellow, and so it stays
 * clearly apart from the orange of 3.
 */
const bucketClasses = (rating: number): string => {
  if (rating >= 4.75) return "bg-purple-500/15 text-purple-300 border-purple-500/40"
  if (rating >= 4.25) return "bg-yellow-400/25 text-yellow-100 border-yellow-400/70"
  if (rating >= 4) return "bg-green-500/15 text-green-300 border-green-500/40"
  if (rating >= 3) return "bg-orange-500/15 text-orange-300 border-orange-500/40"
  if (rating >= 2) return "bg-blue-500/15 text-blue-300 border-blue-500/40"
  return "bg-red-500/15 text-red-300 border-red-500/40"
}

// Trim the trailing zeros a naive toFixed(2) would add: 4.25 stays 4.25,
// 4.5 renders as 4.5, and 4 renders as 4 rather than 4.00.
const formatRating = (rating: number): string => String(rating)

export default function MatchRatingBadge({
  rating,
  size = "sm",
}: MatchRatingBadgeProps) {
  const sizeClasses =
    size === "lg"
      ? "px-3 py-1 text-lg font-semibold"
      : "px-1.5 py-0.5 text-xs font-medium"

  return (
    <span
      className={`inline-block rounded border tabular-nums ${bucketClasses(rating)} ${sizeClasses}`}
    >
      {formatRating(rating)}
    </span>
  )
}
