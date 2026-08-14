'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { getYears, YearSummary } from '@/lib/api'
import { errorMessage } from '@/lib/format'

/** Groups years into decades so a 60-year span stays navigable. */
const byDecade = (years: YearSummary[]) => {
  const groups = new Map<number, YearSummary[]>()
  for (const year of years) {
    const decade = Math.floor(year.year / 10) * 10
    const existing = groups.get(decade)
    if (existing) existing.push(year)
    else groups.set(decade, [year])
  }
  return Array.from(groups.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([decade, entries]) => ({
      decade,
      years: entries.sort((a, b) => b.year - a.year),
      matchCount: entries.reduce((sum, entry) => sum + entry.matchCount, 0),
    }))
}

export default function YearsPage() {
  const [years, setYears] = useState<YearSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await getYears()
        setYears(data)
      } catch (err) {
        setError(errorMessage(err, 'Could not load years'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const decades = useMemo(() => byDecade(years), [years])
  const peak = useMemo(
    () => Math.max(1, ...years.map((year) => year.matchCount)),
    [years],
  )

  return (
    <div>
      <h1 className="text-3xl font-bold">Years</h1>
      <p className="mt-1 text-sm text-gray-400">
        Match counts by year. Open a year for its standings and tier
        assignments.
      </p>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      {loading && <p className="mt-4 text-sm text-gray-500">Loading years...</p>}

      <div className="mt-6 space-y-8">
        {decades.map((group) => (
          <section key={group.decade}>
            <div className="mb-3 flex items-baseline gap-3">
              <h2 className="text-xl font-semibold">{group.decade}s</h2>
              <span className="text-sm text-gray-500">
                {group.matchCount} matches across {group.years.length} year
                {group.years.length === 1 ? '' : 's'}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {group.years.map((year) => (
                <Link
                  key={year.year}
                  href={`/year/${year.year}`}
                  className="rounded border border-gray-800 bg-gray-900/50 p-4 transition-colors hover:border-gray-600"
                >
                  <div className="text-2xl font-bold tabular-nums">
                    {year.year}
                  </div>
                  <div className="mt-1 text-xs text-gray-400">
                    {year.matchCount} match{year.matchCount === 1 ? '' : 'es'}
                  </div>
                  <div className="mt-2 h-1 rounded bg-gray-800">
                    <div
                      className="h-1 rounded bg-blue-500"
                      style={{ width: `${(year.matchCount / peak) * 100}%` }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>

      {!loading && years.length === 0 && (
        <p className="mt-6 text-sm text-gray-500">
          No years yet — years are derived from match dates.
        </p>
      )}
    </div>
  )
}
