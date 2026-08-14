import {
  PERFORMANCE_RATING_LABELS,
  PerformanceRating,
} from '@/lib/ratings'

interface PerformanceBadgeProps {
  rating: number | null | undefined
  /** Show the word label next to the number. */
  withLabel?: boolean
}

// Tailwind can't build class names from interpolated values, so the rating
// scale is mapped to literal classes. Colours mirror theme.colors.rating.
const RATING_CLASSES: Record<PerformanceRating, string> = {
  1: 'bg-rating-1/15 text-rating-1 border-rating-1/40',
  2: 'bg-rating-2/15 text-rating-2 border-rating-2/40',
  3: 'bg-rating-3/15 text-rating-3 border-rating-3/40',
  4: 'bg-rating-4/15 text-rating-4 border-rating-4/40',
  5: 'bg-rating-5/15 text-rating-5 border-rating-5/40',
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

  return (
    <span
      title={label}
      className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-xs font-medium ${RATING_CLASSES[rating]}`}
    >
      {rating}
      {withLabel && <span className="font-normal">{label}</span>}
    </span>
  )
}
