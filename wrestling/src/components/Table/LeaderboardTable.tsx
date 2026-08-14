import Link from 'next/link'
import { LeaderboardEntry, LeaderboardYear } from '@/lib/api'
import { tierClasses } from '@/components/TierBadge'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  loading?: boolean
}

/**
 * Year columns are the years in which at least one listed wrestler holds a
 * tier, ascending. Deriving them from the data rather than from a fixed range
 * means no empty columns and no gap years — 1974 sits next to 1980 while
 * 1975-79 have no records.
 */
const tieredYearColumns = (entries: LeaderboardEntry[]): number[] =>
  Array.from(
    new Set(
      entries.flatMap((entry) =>
        (entry.years ?? [])
          .filter((year) => Boolean(year.yearTier))
          .map((year) => year.year),
      ),
    ),
  ).sort((a, b) => a - b)

/** Tiered years only, keyed by year for O(1) cell lookup. */
const tieredYearsByYear = (
  entry: LeaderboardEntry,
): Map<number, LeaderboardYear> =>
  new Map(
    (entry.years ?? [])
      .filter((year) => Boolean(year.yearTier))
      .map((year) => [year.year, year]),
  )

// The rank, wrestler and career columns stay put while the year grid scrolls.
// Sticky cells need an opaque background or the scrolled columns show through,
// which is also why the hover colour is opaque rather than an alpha tint.
const STICKY_BASE = 'sticky bg-gray-950 group-hover:bg-gray-900'
const STICKY_HEAD = 'sticky z-20 bg-gray-900'

export default function LeaderboardTable({
  entries,
  loading = false,
}: LeaderboardTableProps) {
  const yearColumns = tieredYearColumns(entries)
  const columnCount = 3 + yearColumns.length

  return (
    <div className="overflow-x-auto rounded border border-gray-800">
      <table className="w-full border-collapse text-sm">
        <thead className="bg-gray-900 text-gray-400">
          <tr>
            <th
              className={`${STICKY_HEAD} left-0 px-3 py-2 text-left font-medium`}
            >
              #
            </th>
            <th
              className={`${STICKY_HEAD} left-10 px-3 py-2 text-left font-medium`}
            >
              Wrestler
            </th>
            <th
              className={`${STICKY_HEAD} left-52 px-3 py-2 text-right font-medium`}
            >
              Career
            </th>
            {yearColumns.map((year) => (
              <th
                key={year}
                className="px-2 py-2 text-center font-medium tabular-nums"
              >
                {year}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const byYear = tieredYearsByYear(entry)

            return (
              <tr
                key={entry._id}
                className="group border-t border-gray-800 hover:bg-gray-900"
              >
                <td
                  className={`${STICKY_BASE} left-0 z-10 px-3 py-2 tabular-nums text-gray-500`}
                >
                  {index + 1}
                </td>
                <td
                  className={`${STICKY_BASE} left-10 z-10 whitespace-nowrap px-3 py-2`}
                >
                  <Link
                    href={`/wrestler/${entry._id}`}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {entry.displayName}
                  </Link>
                </td>
                <td
                  className={`${STICKY_BASE} left-52 z-10 border-r border-gray-800 px-3 py-2 text-right tabular-nums font-semibold text-gray-100`}
                >
                  {entry.careerScore}
                </td>
                {yearColumns.map((year) => {
                  const tiered = byYear.get(year)
                  return (
                    <td key={year} className="px-2 py-2 text-center">
                      {tiered ? (
                        <span
                          title={`${year}: ${tiered.yearTier} (${tiered.matchCount} matches)`}
                          className={`inline-block min-w-[2rem] rounded border px-1.5 py-0.5 text-xs font-medium tabular-nums ${tierClasses(
                            tiered.yearTier as string,
                          )}`}
                        >
                          {tiered.yearTierPoints}
                        </span>
                      ) : (
                        <span className="text-gray-800">&middot;</span>
                      )}
                    </td>
                  )
                })}
              </tr>
            )
          })}
          {loading && (
            <tr>
              <td
                colSpan={Math.max(columnCount, 3)}
                className="px-3 py-6 text-center text-gray-500"
              >
                Loading leaderboard...
              </td>
            </tr>
          )}
          {!loading && entries.length === 0 && (
            <tr>
              <td
                colSpan={Math.max(columnCount, 3)}
                className="px-3 py-6 text-center text-gray-500"
              >
                No ranked wrestlers yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
