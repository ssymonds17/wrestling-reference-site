import Link from 'next/link'
import { WrestlerYear, YearStandingsSortBy } from '@/lib/api'
import { formatScore } from '@/lib/format'
import RatingDistribution from '@/components/Rating/RatingDistribution'
import TierBadge from '@/components/TierBadge'

interface YearStandingsTableProps {
  standings: WrestlerYear[]
  loading?: boolean
  sortBy: YearStandingsSortBy
  onSortChange: (sortBy: YearStandingsSortBy) => void
  /**
   * Rendered in a trailing actions column when supplied — this is the seam
   * the tier-assignment control plugs into.
   */
  renderActions?: (row: WrestlerYear) => React.ReactNode
}

export default function YearStandingsTable({
  standings,
  loading = false,
  sortBy,
  onSortChange,
  renderActions,
}: YearStandingsTableProps) {
  const columnCount = renderActions ? 9 : 8

  return (
    <div className="overflow-x-auto rounded border border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-900 text-gray-400">
          <tr>
            <th className="px-3 py-2 text-left font-medium">#</th>
            <th className="px-3 py-2 text-left font-medium">Wrestler</th>
            <th className="px-3 py-2 text-left font-medium">Matches</th>
            <th className="px-3 py-2 text-left font-medium">
              <button
                type="button"
                onClick={() => onSortChange('formulaScore')}
                className={`hover:text-gray-200 ${
                  sortBy === 'formulaScore' ? 'text-blue-400' : ''
                }`}
              >
                Score
                {sortBy === 'formulaScore' && <span aria-hidden> &darr;</span>}
              </button>
            </th>
            <th
              className="px-3 py-2 text-left font-medium"
              title="Weighted average of performance ratings (K)"
            >
              K
            </th>
            <th
              className="px-3 py-2 text-left font-medium"
              title="Above-one factor: sqrt(non-negative ratings / matches) (L)"
            >
              L
            </th>
            <th className="px-3 py-2 text-left font-medium">Ratings</th>
            <th className="px-3 py-2 text-left font-medium">
              <button
                type="button"
                onClick={() => onSortChange('yearTierPoints')}
                className={`hover:text-gray-200 ${
                  sortBy === 'yearTierPoints' ? 'text-blue-400' : ''
                }`}
              >
                Tier
                {sortBy === 'yearTierPoints' && <span aria-hidden> &darr;</span>}
              </button>
            </th>
            {renderActions && (
              <th className="px-3 py-2 text-right font-medium">Actions</th>
            )}
          </tr>
        </thead>
        <tbody>
          {standings.map((row, index) => (
            <tr
              key={row._id}
              className="border-t border-gray-800 hover:bg-gray-900/40"
            >
              <td className="px-3 py-2 tabular-nums text-gray-500">
                {index + 1}
              </td>
              <td className="px-3 py-2">
                <Link
                  href={`/wrestler/${row.wrestlerId}`}
                  className="text-blue-400 hover:text-blue-300"
                >
                  {row.displayName}
                </Link>
              </td>
              <td className="px-3 py-2 tabular-nums text-gray-300">
                {row.matchCount}
              </td>
              <td className="px-3 py-2 tabular-nums text-gray-100">
                {formatScore(row.formulaScore)}
              </td>
              <td className="px-3 py-2 tabular-nums text-gray-500">
                {formatScore(row.weightedAverage)}
              </td>
              <td className="px-3 py-2 tabular-nums text-gray-500">
                {formatScore(row.aboveOneFactor)}
              </td>
              <td className="w-32 px-3 py-2">
                <RatingDistribution counts={row.ratingCounts} variant="strip" />
              </td>
              <td className="px-3 py-2">
                <TierBadge tier={row.yearTier} />
              </td>
              {renderActions && (
                <td className="px-3 py-2 text-right">{renderActions(row)}</td>
              )}
            </tr>
          ))}
          {loading && (
            <tr>
              <td
                colSpan={columnCount}
                className="px-3 py-6 text-center text-gray-500"
              >
                Loading standings...
              </td>
            </tr>
          )}
          {!loading && standings.length === 0 && (
            <tr>
              <td
                colSpan={columnCount}
                className="px-3 py-6 text-center text-gray-500"
              >
                No standings for this year.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
