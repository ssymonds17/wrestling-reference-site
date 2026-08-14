'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { SignedIn } from '@clerk/nextjs'
import WrestlersTable from '@/components/Table/WrestlersTable'
import { getWrestlers, Wrestler, WrestlerSortBy } from '@/lib/api'
import { errorMessage } from '@/lib/format'

// The API caps this list server-side at whatever limit we send (defaulting to
// 500, which is below the current roster), so ask for comfortably more than
// the roster size and filter client-side.
const FETCH_LIMIT = 2000

const matchesQuery = (wrestler: Wrestler, query: string): boolean => {
  if (!query) return true
  const q = query.toLowerCase()
  return (
    wrestler.name.includes(q) ||
    wrestler.displayName.toLowerCase().includes(q) ||
    wrestler.aliases.some((alias) => alias.search.includes(q))
  )
}

export default function WrestlersPage() {
  const [wrestlers, setWrestlers] = useState<Wrestler[]>([])
  const [sortBy, setSortBy] = useState<WrestlerSortBy>('careerScore')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await getWrestlers({ sortBy, limit: FETCH_LIMIT })
      setWrestlers(data)
    } catch (err) {
      setError(errorMessage(err, 'Could not load wrestlers'))
    } finally {
      setLoading(false)
    }
  }, [sortBy])

  useEffect(() => {
    load()
  }, [load])

  // Filtering is local: the whole roster is already in memory, and the
  // alias-aware /search endpoint would lose the current sort order.
  const visible = useMemo(
    () => wrestlers.filter((wrestler) => matchesQuery(wrestler, query.trim())),
    [wrestlers, query],
  )

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Wrestlers</h1>
          <p className="mt-1 text-sm text-gray-400">
            {loading
              ? 'Loading roster...'
              : `${wrestlers.length} wrestlers. Sort by any column heading.`}
          </p>
        </div>
        <SignedIn>
          <Link
            href="/wrestler/new"
            className="shrink-0 rounded border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            Add wrestler
          </Link>
        </SignedIn>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter by name or alias..."
          className="w-full max-w-sm rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        {query && (
          <span className="whitespace-nowrap text-sm text-gray-500">
            {visible.length} match{visible.length === 1 ? '' : 'es'}
          </span>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <WrestlersTable
        wrestlers={visible}
        loading={loading}
        sortBy={sortBy}
        onSortChange={setSortBy}
        emptyMessage={
          query ? 'No wrestlers match that filter.' : 'No wrestlers yet.'
        }
      />
    </div>
  )
}
