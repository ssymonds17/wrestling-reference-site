'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  getCareerLeaderboard,
  getYears,
  LeaderboardEntry,
  YearSummary,
} from '@/lib/api'
import { errorMessage } from '@/lib/format'
import TierBadge from '@/components/TierBadge'

const bestTier = (entry: LeaderboardEntry): string | undefined => {
  const tiered = (entry.years ?? []).filter((y) => Boolean(y.yearTier))
  if (tiered.length === 0) return undefined
  return tiered.reduce((best, year) =>
    year.yearTierPoints > best.yearTierPoints ? year : best,
  ).yearTier
}

function StatCard({
  href,
  label,
  value,
  hint,
}: {
  href: string
  label: string
  value: string
  hint: string
}) {
  return (
    <Link
      href={href}
      className="rounded border border-gray-800 bg-gray-900/50 p-5 transition-colors hover:border-gray-600"
    >
      <div className="text-sm text-gray-400">{label}</div>
      <div className="mt-1 text-3xl font-bold tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-gray-500">{hint}</div>
    </Link>
  )
}

export default function Home() {
  const [years, setYears] = useState<YearSummary[]>([])
  const [top, setTop] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const [yearsResponse, leaderboard] = await Promise.all([
          getYears(),
          getCareerLeaderboard(5),
        ])
        setYears(yearsResponse.data)
        setTop(leaderboard.data)
      } catch (err) {
        setError(errorMessage(err, 'Could not load summary data'))
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const totalMatches = years.reduce((sum, year) => sum + year.matchCount, 0)
  const yearRange =
    years.length > 0
      ? `${Math.min(...years.map((y) => y.year))}–${Math.max(
          ...years.map((y) => y.year),
        )}`
      : '—'

  return (
    <div>
      <h1 className="text-3xl font-bold">Wrestling Reference</h1>
      <p className="mt-1 text-gray-400">
        Match records, wrestler profiles, tiers, and career standings.
      </p>

      {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <StatCard
          href="/matches"
          label="Matches"
          value={loading ? '…' : String(totalMatches)}
          hint="Browse and filter every recorded match"
        />
        <StatCard
          href="/years"
          label="Years covered"
          value={loading ? '…' : String(years.length)}
          hint={yearRange}
        />
        <StatCard
          href="/leaderboard"
          label="Career leaderboard"
          value={loading ? '…' : `Top ${top.length}`}
          hint="Ranked by tier points across all years"
        />
      </div>

      <section className="mt-10">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Career leaders</h2>
          <Link
            href="/leaderboard"
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            Full leaderboard
          </Link>
        </div>

        <ol className="divide-y divide-gray-800 rounded border border-gray-800">
          {top.map((entry, index) => (
            <li key={entry._id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-6 shrink-0 tabular-nums text-gray-500">
                {index + 1}
              </span>
              <Link
                href={`/wrestler/${entry._id}`}
                className="text-blue-400 hover:text-blue-300"
              >
                {entry.displayName}
              </Link>
              <TierBadge tier={bestTier(entry)} />
              <span className="ml-auto tabular-nums font-semibold">
                {entry.careerScore}
              </span>
            </li>
          ))}
          {loading && (
            <li className="px-4 py-6 text-center text-sm text-gray-500">
              Loading...
            </li>
          )}
          {!loading && top.length === 0 && (
            <li className="px-4 py-6 text-center text-sm text-gray-500">
              No ranked wrestlers yet.
            </li>
          )}
        </ol>
      </section>
    </div>
  )
}
