import Link from 'next/link'
import { WrestlerYear } from '@/lib/api'
import { formatScore } from '@/lib/format'
import { scoreBreakdown } from '@/lib/score'
import RatingDistribution from '@/components/Rating/RatingDistribution'
import TierBadge from '@/components/TierBadge'
import TierSelect from '@/components/Tier/TierSelect'

interface YearStandingsTableProps {
  standings: WrestlerYear[]
  loading?: boolean
  /**
   * Rendered in a trailing actions column when supplied.
   */
  renderActions?: (row: WrestlerYear) => React.ReactNode
  /**
   * Turns the Tier column into an inline picker. Off by default, so the
   * read-only view for signed-out visitors is unchanged.
   */
  editable?: boolean
  onTierChange?: (row: WrestlerYear, tier: string | null) => void
  /** wrestlerId whose assignment is mid-flight, if any. */
  savingWrestlerId?: string | null
}

/**
 * Deliberately not sortable. Rows arrive in formulaScore order, which is the
 * standings order. Tier is assigned off the back of that score, so ordering by
 * tier produces a near-identical list — the choice was redundant rather than
 * useful.
 */
export default function YearStandingsTable({
  standings,
  loading = false,
  renderActions,
  editable = false,
  onTierChange,
  savingWrestlerId = null,
}: YearStandingsTableProps) {
  const columnCount = renderActions ? 7 : 6

  return (
    <div className="overflow-x-auto rounded border border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-900 text-gray-400">
          <tr>
            <th className="px-3 py-2 text-left font-medium">#</th>
            <th className="px-3 py-2 text-left font-medium">Wrestler</th>
            <th className="px-3 py-2 text-left font-medium">Score</th>
            <th className="px-3 py-2 text-left font-medium">Matches</th>
            <th className="px-3 py-2 text-left font-medium">Performances</th>
            <th className="px-3 py-2 text-left font-medium">Tier</th>
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
              {/* The formula's inputs live in the tooltip rather than their own
                  columns — diagnostic detail, not something to scan a table by. */}
              <td className="px-3 py-2 tabular-nums text-gray-100">
                <span
                  title={scoreBreakdown(row)}
                  className="cursor-help decoration-gray-600 decoration-dotted underline-offset-4 hover:underline"
                >
                  {formatScore(row.formulaScore)}
                </span>
              </td>
              <td className="px-3 py-2 tabular-nums text-gray-300">
                {row.matchCount}
              </td>
              <td className="w-32 px-3 py-2">
                <RatingDistribution counts={row.ratingCounts} variant="strip" />
              </td>
              {/* Rows are ordered by score, which a tier assignment does not
                  change — so nothing jumps under the cursor during bulk work. */}
              <td className="px-3 py-2">
                {editable && onTierChange ? (
                  <TierSelect
                    value={row.yearTier}
                    onChange={(tier) => onTierChange(row, tier)}
                    saving={savingWrestlerId === row.wrestlerId}
                  />
                ) : (
                  <TierBadge tier={row.yearTier} />
                )}
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
