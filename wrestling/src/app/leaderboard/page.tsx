'use client'

import { useCallback, useEffect, useState } from 'react'
import { getCareerLeaderboard, LeaderboardEntry } from '@/lib/api'
import { errorMessage } from '@/lib/format'
import LeaderboardTable from '@/components/Table/LeaderboardTable'
import { TIERS } from '@/lib/tiers'

const LIMIT_OPTIONS = [25, 50, 100, 250]

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [limit, setLimit] = useState(100)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await getCareerLeaderboard(limit)
      setEntries(data)
    } catch (err) {
      setError(errorMessage(err, 'Could not load leaderboard'))
    } finally {
      setLoading(false)
    }
  }, [limit])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Career leaderboard</h1>
          <p className="mt-1 text-sm text-gray-400">
            Ranked by career score, the sum of tier points across every year.
            Ties break on the best individual years.
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-gray-300">Show</span>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="rounded border border-gray-700 bg-gray-900 px-2 py-1.5 focus:border-blue-500 focus:outline-none"
          >
            {LIMIT_OPTIONS.map((value) => (
              <option key={value} value={value}>
                Top {value}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mb-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-gray-500">
        {TIERS.map((tier) => (
          <span key={tier.name}>
            {tier.name} = {tier.points} pts/year
          </span>
        ))}
      </p>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <LeaderboardTable entries={entries} loading={loading} />
    </div>
  )
}
