'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  getYearStandings,
  WrestlerYear,
  YearStandingsSortBy,
} from '@/lib/api'
import { errorMessage } from '@/lib/format'
import YearStandingsTable from '@/components/Table/YearStandingsTable'
import { TIERS } from '@/lib/tiers'

interface YearPageProps {
  params: { year: string }
}

const MIN_MATCHES_OPTIONS = [0, 5, 10, 20]

export default function YearPage({ params }: YearPageProps) {
  const year = Number.parseInt(params.year, 10)
  const [standings, setStandings] = useState<WrestlerYear[]>([])
  const [sortBy, setSortBy] = useState<YearStandingsSortBy>('formulaScore')
  const [minMatches, setMinMatches] = useState(0)
  const [tieredOnly, setTieredOnly] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!Number.isFinite(year)) {
      setError('Invalid year')
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    try {
      const { data } = await getYearStandings(year, sortBy)
      setStandings(data)
    } catch (err) {
      setError(errorMessage(err, 'Could not load standings'))
    } finally {
      setLoading(false)
    }
  }, [year, sortBy])

  useEffect(() => {
    load()
  }, [load])

  // Low-match wrestlers crowd the top of the table because the formula's
  // ln(1 + matchCount) term is generous at small sample sizes, so allow a
  // floor. Filtering locally keeps the server sort authoritative.
  const visible = useMemo(
    () =>
      standings.filter((row) => {
        if (row.matchCount < minMatches) return false
        if (tieredOnly && !row.yearTier) return false
        return true
      }),
    [standings, minMatches, tieredOnly],
  )

  const tierCounts = useMemo(
    () =>
      TIERS.map((tier) => ({
        name: tier.name,
        count: standings.filter((row) => row.yearTier === tier.name).length,
      })),
    [standings],
  )

  return (
    <div>
      <Link href="/years" className="text-sm text-blue-400 hover:text-blue-300">
        &larr; All years
      </Link>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tabular-nums">{params.year}</h1>
          <p className="mt-1 text-sm text-gray-400">
            {loading
              ? 'Loading standings...'
              : `${standings.length} wrestlers with recorded matches this year.`}
          </p>
        </div>
        <Link
          href={`/matches?year=${params.year}`}
          className="text-sm text-blue-400 hover:text-blue-300"
        >
          Browse this year&apos;s matches
        </Link>
      </div>

      {!loading && standings.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-400">
          {tierCounts.map((tier) => (
            <span key={tier.name}>
              {tier.name}:{' '}
              <span className="tabular-nums text-gray-200">{tier.count}</span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4 rounded border border-gray-800 bg-gray-900/50 p-4 text-sm">
        <label className="flex items-center gap-2">
          <span className="text-gray-300">Min matches</span>
          <select
            value={minMatches}
            onChange={(e) => setMinMatches(Number(e.target.value))}
            className="rounded border border-gray-700 bg-gray-900 px-2 py-1.5 focus:border-blue-500 focus:outline-none"
          >
            {MIN_MATCHES_OPTIONS.map((value) => (
              <option key={value} value={value}>
                {value === 0 ? 'Any' : `${value}+`}
              </option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 text-gray-300">
          <input
            type="checkbox"
            checked={tieredOnly}
            onChange={(e) => setTieredOnly(e.target.checked)}
            className="h-4 w-4 rounded border-gray-700 bg-gray-900"
          />
          Tiered only
        </label>

        <span className="ml-auto text-gray-500">
          Showing {visible.length} of {standings.length}
        </span>
      </div>

      {error && <p className="mb-3 mt-3 text-sm text-red-400">{error}</p>}

      <div className="mt-4">
        <YearStandingsTable
          standings={visible}
          loading={loading}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      <p className="mt-3 text-xs text-gray-600">
        Score is K &times; L &times; ln(1 + matches), where K is the weighted
        average of performance ratings and L is the square root of the share of
        ratings above 1.
      </p>
    </div>
  )
}
