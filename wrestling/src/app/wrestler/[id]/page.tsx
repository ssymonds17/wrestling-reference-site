'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getMatches,
  getWrestlerById,
  getWrestlerYears,
  Match,
  Wrestler,
  WrestlerYear,
} from '@/lib/api'
import { errorMessage, formatScore } from '@/lib/format'
import MatchesTable from '@/components/Table/MatchesTable'
import Pagination from '@/components/Pagination'
import RatingDistribution from '@/components/Rating/RatingDistribution'
import TierBadge from '@/components/TierBadge'

interface WrestlerPageProps {
  params: { id: string }
}

const PAGE_SIZE = 25

function StatBlock({
  label,
  value,
  hint,
}: {
  label: string
  value: string | number
  hint?: string
}) {
  return (
    <div className="rounded border border-gray-800 bg-gray-900/50 p-4">
      <div className="text-xs uppercase tracking-wide text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-bold tabular-nums">{value}</div>
      {hint && <div className="mt-0.5 text-xs text-gray-500">{hint}</div>}
    </div>
  )
}

export default function WrestlerPage({ params }: WrestlerPageProps) {
  const [wrestler, setWrestler] = useState<Wrestler | null>(null)
  const [years, setYears] = useState<WrestlerYear[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [matchesLoading, setMatchesLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const [found, yearsResponse] = await Promise.all([
          getWrestlerById(params.id),
          getWrestlerYears(params.id),
        ])
        if (!active) return
        setWrestler(found)
        setYears(yearsResponse.data)
      } catch (err) {
        if (active) setError(errorMessage(err, 'Could not load wrestler'))
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [params.id])

  const loadMatches = useCallback(async () => {
    setMatchesLoading(true)
    try {
      const { data } = await getMatches({
        wrestlerId: params.id,
        limit: PAGE_SIZE,
        offset,
      })
      setMatches(data)
    } catch (err) {
      setError(errorMessage(err, 'Could not load matches'))
    } finally {
      setMatchesLoading(false)
    }
  }, [params.id, offset])

  useEffect(() => {
    loadMatches()
  }, [loadMatches])

  if (loading) {
    return <p className="text-sm text-gray-500">Loading wrestler...</p>
  }

  if (error && !wrestler) {
    return (
      <div>
        <p className="text-sm text-red-400">{error}</p>
        <Link
          href="/wrestlers"
          className="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300"
        >
          &larr; Back to wrestlers
        </Link>
      </div>
    )
  }

  if (!wrestler) return null

  const tieredYears = years.filter((year) => Boolean(year.yearTier))
  const bestYear = years.reduce<WrestlerYear | null>(
    (best, year) =>
      best === null || year.formulaScore > best.formulaScore ? year : best,
    null,
  )

  return (
    <div>
      <Link
        href="/wrestlers"
        className="text-sm text-blue-400 hover:text-blue-300"
      >
        &larr; Back to wrestlers
      </Link>

      <div className="mt-3">
        <h1 className="text-3xl font-bold">{wrestler.displayName}</h1>
        {wrestler.aliases.length > 0 && (
          <p className="mt-1 text-sm text-gray-400">
            Also known as{' '}
            {wrestler.aliases.map((alias) => alias.display).join(', ')}
          </p>
        )}
        {wrestler.cagematchUrl && (
          <a
            href={wrestler.cagematchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 inline-block text-sm text-blue-400 hover:text-blue-300"
          >
            Cagematch profile &rarr;
          </a>
        )}
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-4">
        <StatBlock
          label="Career score"
          value={wrestler.careerScore}
          hint={`${tieredYears.length} tiered year${
            tieredYears.length === 1 ? '' : 's'
          }`}
        />
        <StatBlock label="Matches" value={wrestler.totalMatches} />
        <StatBlock
          label="Years active"
          value={years.length}
          hint={
            years.length > 0
              ? `${years[years.length - 1].year}–${years[0].year}`
              : undefined
          }
        />
        <StatBlock
          label="Best year"
          value={bestYear ? bestYear.year : '—'}
          hint={bestYear ? `score ${formatScore(bestYear.formulaScore)}` : undefined}
        />
      </div>

      <section className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div>
          <h2 className="mb-3 text-xl font-semibold">Rating distribution</h2>
          <div className="rounded border border-gray-800 bg-gray-900/50 p-4">
            <RatingDistribution counts={wrestler.ratingCounts} />
          </div>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-semibold">Year by year</h2>
          <div className="overflow-x-auto rounded border border-gray-800">
            <table className="w-full text-sm">
              <thead className="bg-gray-900 text-gray-400">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Year</th>
                  <th className="px-3 py-2 text-left font-medium">Matches</th>
                  <th className="px-3 py-2 text-left font-medium">Score</th>
                  <th className="px-3 py-2 text-left font-medium">Ratings</th>
                  <th className="px-3 py-2 text-left font-medium">Tier</th>
                </tr>
              </thead>
              <tbody>
                {years.map((year) => (
                  <tr key={year._id} className="border-t border-gray-800">
                    <td className="px-3 py-2 tabular-nums">
                      <Link
                        href={`/year/${year.year}`}
                        className="text-blue-400 hover:text-blue-300"
                      >
                        {year.year}
                      </Link>
                    </td>
                    <td className="px-3 py-2 tabular-nums text-gray-300">
                      {year.matchCount}
                    </td>
                    <td className="px-3 py-2 tabular-nums text-gray-100">
                      {formatScore(year.formulaScore)}
                    </td>
                    <td className="w-28 px-3 py-2">
                      <RatingDistribution
                        counts={year.ratingCounts}
                        variant="strip"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <TierBadge tier={year.yearTier} />
                    </td>
                  </tr>
                ))}
                {years.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-gray-500"
                    >
                      No year stats yet. Run the wrestler-year recompute after
                      ingesting matches.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Matches</h2>
          <Link
            href={`/matches?wrestlerId=${wrestler._id}`}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Open in match browser
          </Link>
        </div>

        <MatchesTable
          matches={matches}
          loading={matchesLoading}
          highlightWrestlerId={wrestler._id}
          emptyMessage="No matches recorded for this wrestler."
        />

        <Pagination
          offset={offset}
          limit={PAGE_SIZE}
          pageCount={matches.length}
          onOffsetChange={setOffset}
          loading={matchesLoading}
        />
      </section>
    </div>
  )
}
