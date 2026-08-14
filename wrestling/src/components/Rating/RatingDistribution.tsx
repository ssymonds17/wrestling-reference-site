import { RatingCounts } from '@/lib/api'
import { PERFORMANCE_RATING_LABELS, PerformanceRating } from '@/lib/ratings'

interface RatingDistributionProps {
  counts: RatingCounts
  /** Bar chart with a legend, or a compact single stacked strip. */
  variant?: 'bars' | 'strip'
}

const RATING_BG: Record<PerformanceRating, string> = {
  1: 'bg-rating-1',
  2: 'bg-rating-2',
  3: 'bg-rating-3',
  4: 'bg-rating-4',
  5: 'bg-rating-5',
}

const RATINGS: PerformanceRating[] = [1, 2, 3, 4, 5]

const toRows = (counts: RatingCounts) =>
  RATINGS.map((rating) => ({
    rating,
    count: counts[`rating${rating}` as keyof RatingCounts] ?? 0,
  }))

export default function RatingDistribution({
  counts,
  variant = 'bars',
}: RatingDistributionProps) {
  const rows = toRows(counts)
  const total = rows.reduce((sum, row) => sum + row.count, 0)

  if (total === 0) {
    return <span className="text-xs text-gray-600">no rated matches</span>
  }

  if (variant === 'strip') {
    return (
      <div
        className="flex h-2 w-full min-w-[80px] overflow-hidden rounded-full bg-gray-800"
        title={rows
          .map((r) => `${PERFORMANCE_RATING_LABELS[r.rating]}: ${r.count}`)
          .join('  ')}
      >
        {rows
          .filter((row) => row.count > 0)
          .map((row) => (
            <div
              key={row.rating}
              className={RATING_BG[row.rating]}
              style={{ width: `${(row.count / total) * 100}%` }}
            />
          ))}
      </div>
    )
  }

  // Bars scale against the most common rating so the shape stays readable
  // even when one bucket dominates.
  const peak = Math.max(...rows.map((row) => row.count))

  // Best at the top, worst at the bottom — reads like a ranking rather than a
  // numeric axis. The strip variant keeps its 1-to-5 left-to-right order,
  // where ascending matches reading direction.
  return (
    <div className="space-y-1.5">
      {[...rows].reverse().map((row) => (
        <div key={row.rating} className="flex items-center gap-2 text-xs">
          <span className="w-24 shrink-0 text-gray-400">
            {PERFORMANCE_RATING_LABELS[row.rating]}
          </span>
          <div className="h-3 flex-1 rounded bg-gray-800">
            <div
              className={`h-3 rounded ${RATING_BG[row.rating]}`}
              style={{ width: peak > 0 ? `${(row.count / peak) * 100}%` : '0%' }}
            />
          </div>
          {/* Count and percentage get their own fixed-width, right-aligned
              cells. In a single cell the two values shift against each other
              as digit counts change, so a 0 would not line up under a 3. */}
          <span className="w-10 shrink-0 text-right tabular-nums text-gray-300">
            {row.count}
          </span>
          <span className="w-10 shrink-0 text-right tabular-nums text-gray-600">
            {Math.round((row.count / total) * 100)}%
          </span>
        </div>
      ))}
    </div>
  )
}
