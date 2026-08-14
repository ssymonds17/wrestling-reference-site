import { PERFORMANCE_RATING_LABELS, PerformanceRating } from "@/lib/ratings"

interface PerformanceBadgeProps {
  rating: number | null | undefined
  /** Render the word label (e.g. "Outstanding" or "Negative") */
  withLabel?: boolean
}

/**
 * Tailwind can't build class names from interpolated values, so the scale is
 * mapped to literal classes:
 *
 *   1  red      Negative
 *   2  blue     Neutral
 *   3  orange   Positive
 *   4  green    Great
 *   5  purple   Outstanding
 *
 * Same colour language as MatchRatingBadge, so purple means the top of the
 * scale in both places. These hues match theme.colors.rating in
 * tailwind.config.js, which RatingDistribution uses for its solid bar fills —
 * change one and change the other.
 */
const RATING_CLASSES: Record<PerformanceRating, string> = {
  1: "bg-red-500/15 text-red-300 border-red-500/40",
  2: "bg-blue-500/15 text-blue-300 border-blue-500/40",
  3: "bg-orange-500/15 text-orange-300 border-orange-500/40",
  4: "bg-green-500/15 text-green-300 border-green-500/40",
  5: "bg-purple-500/15 text-purple-300 border-purple-500/40",
}

const isPerformanceRating = (value: number): value is PerformanceRating =>
  value in PERFORMANCE_RATING_LABELS

export default function PerformanceBadge({
  rating,
  withLabel = false,
}: PerformanceBadgeProps) {
  if (rating === null || rating === undefined) {
    return <span className="text-gray-600 text-xs">unrated</span>
  }

  if (!isPerformanceRating(rating)) {
    return <span className="text-gray-400 text-xs">{rating}</span>
  }

  const label = PERFORMANCE_RATING_LABELS[rating]

  // The title carries whichever form isn't shown, so the numeric value stays
  // discoverable on the labelled variant and vice versa.
  return (
    <span
      title={withLabel ? `Rating ${rating}` : label}
      className={`inline-flex items-center whitespace-nowrap rounded border px-1.5 py-0.5 text-xs font-medium ${RATING_CLASSES[rating]}`}
    >
      {withLabel ? label : rating}
    </span>
  )
}
