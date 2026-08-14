'use client'

import { Fragment, useState } from 'react'
import Link from 'next/link'
import { LeaderboardEntry, LeaderboardYear } from '@/lib/api'
import { formatScore } from '@/lib/format'
import { TIERS } from '@/lib/tiers'
import TierBadge from '@/components/TierBadge'

interface LeaderboardTableProps {
  entries: LeaderboardEntry[]
  loading?: boolean
}

const tierCount = (years: LeaderboardYear[], tierName: string): number =>
  years.filter((y) => y.yearTier === tierName).length

/** Tiered years only, best tier first then most recent year first. */
const tieredYears = (years: LeaderboardYear[]): LeaderboardYear[] =>
  years
    .filter((y) => Boolean(y.yearTier))
    .sort((a, b) =>
      b.yearTierPoints !== a.yearTierPoints
        ? b.yearTierPoints - a.yearTierPoints
        : b.year - a.year,
    )

export default function LeaderboardTable({
  entries,
  loading = false,
}: LeaderboardTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const columnCount = 5 + TIERS.length

  return (
    <div className="overflow-x-auto rounded border border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-900 text-gray-400">
          <tr>
            <th className="px-3 py-2 text-left font-medium">#</th>
            <th className="px-3 py-2 text-left font-medium">Wrestler</th>
            <th className="px-3 py-2 text-left font-medium">Career</th>
            {TIERS.map((tier) => (
              <th
                key={tier.name}
                className="px-3 py-2 text-left font-medium"
                title={`${tier.name} (${tier.points} points per year)`}
              >
                {tier.name.split(' ')[0]}
              </th>
            ))}
            <th className="px-3 py-2 text-left font-medium">Matches</th>
            <th className="px-3 py-2 text-right font-medium">Years</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry, index) => {
            const years = entry.years ?? []
            const isOpen = expanded === entry._id
            const tiered = tieredYears(years)

            return (
              <Fragment key={entry._id}>
                <tr className="border-t border-gray-800 hover:bg-gray-900/40">
                  <td className="px-3 py-2 tabular-nums text-gray-500">
                    {index + 1}
                  </td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/wrestler/${entry._id}`}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      {entry.displayName}
                    </Link>
                  </td>
                  <td className="px-3 py-2 tabular-nums font-semibold text-gray-100">
                    {entry.careerScore}
                  </td>
                  {TIERS.map((tier) => {
                    const count = tierCount(years, tier.name)
                    return (
                      <td
                        key={tier.name}
                        className={`px-3 py-2 tabular-nums ${
                          count > 0 ? 'text-gray-200' : 'text-gray-700'
                        }`}
                      >
                        {count > 0 ? count : '—'}
                      </td>
                    )
                  })}
                  <td className="px-3 py-2 tabular-nums text-gray-400">
                    {entry.totalMatches}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : entry._id)}
                      disabled={tiered.length === 0}
                      className="text-xs text-blue-400 hover:text-blue-300 disabled:text-gray-700"
                    >
                      {isOpen ? 'Hide' : `${tiered.length} tiered`}
                    </button>
                  </td>
                </tr>
                {isOpen && (
                  <tr className="border-t border-gray-800 bg-gray-900/60">
                    <td colSpan={columnCount} className="px-3 py-3">
                      <div className="flex flex-wrap gap-2">
                        {tiered.map((year) => (
                          <Link
                            key={year.year}
                            href={`/year/${year.year}`}
                            className="inline-flex items-center gap-2 rounded border border-gray-700 px-2 py-1 hover:border-gray-500"
                          >
                            <span className="tabular-nums text-gray-200">
                              {year.year}
                            </span>
                            <TierBadge tier={year.yearTier} />
                            <span className="text-xs text-gray-500">
                              {year.matchCount} matches &middot;{' '}
                              {formatScore(year.formulaScore)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
          {loading && (
            <tr>
              <td
                colSpan={columnCount}
                className="px-3 py-6 text-center text-gray-500"
              >
                Loading leaderboard...
              </td>
            </tr>
          )}
          {!loading && entries.length === 0 && (
            <tr>
              <td
                colSpan={columnCount}
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
