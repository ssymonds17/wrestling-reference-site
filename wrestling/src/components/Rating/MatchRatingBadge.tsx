interface MatchRatingBadgeProps {
  rating: number
  size?: 'sm' | 'lg'
}

// Overall match ratings span 1-5 with quarter-points above 4, so the badge
// buckets by floor rather than exact match: 4.25/4.5/4.75 all read as "4".
const bucketClasses = (rating: number): string => {
  if (rating >= 5) return 'bg-rating-5/15 text-rating-5 border-rating-5/40'
  if (rating >= 4) return 'bg-rating-4/15 text-rating-4 border-rating-4/40'
  if (rating >= 3) return 'bg-rating-3/15 text-rating-3 border-rating-3/40'
  if (rating >= 2) return 'bg-rating-2/15 text-rating-2 border-rating-2/40'
  return 'bg-rating-1/15 text-rating-1 border-rating-1/40'
}

// Trim the trailing zeros a naive toFixed(2) would add: 4.25 stays 4.25,
// 4.5 renders as 4.5, and 4 renders as 4 rather than 4.00.
const formatRating = (rating: number): string => String(rating)

export default function MatchRatingBadge({
  rating,
  size = 'sm',
}: MatchRatingBadgeProps) {
  const sizeClasses =
    size === 'lg' ? 'px-3 py-1 text-lg font-semibold' : 'px-1.5 py-0.5 text-xs font-medium'

  return (
    <span
      className={`inline-block rounded border tabular-nums ${bucketClasses(rating)} ${sizeClasses}`}
    >
      {formatRating(rating)}
    </span>
  )
}
