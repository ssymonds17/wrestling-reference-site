'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { SignedIn } from '@clerk/nextjs'
import WrestlersTable from '@/components/Table/WrestlersTable'
import { searchWrestlers, Wrestler } from '@/lib/api'
import { errorMessage } from '@/lib/format'

const DEBOUNCE_MS = 250
const MIN_QUERY_LENGTH = 2
const RESULT_LIMIT = 50

export default function WrestlersPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Wrestler[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Distinguishes "you haven't searched yet" from "your search found nothing",
  // which need different empty states.
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([])
      setSearched(false)
      setLoading(false)
      setError(null)
      return
    }

    // Guard against out-of-order responses: a slow request for "ric" must not
    // overwrite the results for "ric flair" typed a moment later.
    let active = true
    setLoading(true)

    const timer = setTimeout(async () => {
      try {
        const { data } = await searchWrestlers(trimmed, RESULT_LIMIT)
        if (!active) return
        setResults(data)
        setSearched(true)
        setError(null)
      } catch (err) {
        if (!active) return
        setResults([])
        setError(errorMessage(err, 'Could not search wrestlers'))
      } finally {
        if (active) setLoading(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query])

  const typedTooLittle =
    query.trim().length > 0 && query.trim().length < MIN_QUERY_LENGTH
  const atLimit = results.length === RESULT_LIMIT

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Wrestlers</h1>
          <p className="mt-1 text-sm text-gray-400">
            Search the roster by name or alias. For rankings, see the{' '}
            <Link
              href="/leaderboard"
              className="text-blue-400 hover:text-blue-300"
            >
              career leaderboard
            </Link>
            .
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
          placeholder="Search by name or alias..."
          autoFocus
          className="w-full max-w-sm rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
        {loading && <span className="text-sm text-gray-500">Searching...</span>}
        {!loading && searched && (
          <span className="whitespace-nowrap text-sm text-gray-500">
            {results.length}
            {atLimit ? '+' : ''} result{results.length === 1 ? '' : 's'}
          </span>
        )}
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="whitespace-nowrap text-sm text-gray-400 hover:text-gray-100"
          >
            Clear
          </button>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      {searched ? (
        <>
          <WrestlersTable
            wrestlers={results}
            loading={loading}
            emptyMessage="No wrestlers match that search."
          />
          {atLimit && (
            <p className="mt-3 text-xs text-gray-600">
              Showing the first {RESULT_LIMIT} matches. Narrow the search to see
              more specific results.
            </p>
          )}
        </>
      ) : (
        <div className="rounded border border-gray-800 bg-gray-900/30 px-4 py-16 text-center">
          <p className="text-sm text-gray-400">
            {typedTooLittle
              ? `Keep typing — at least ${MIN_QUERY_LENGTH} characters.`
              : 'Start typing to find a wrestler.'}
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Aliases are searchable, so a ring name finds the wrestler who used
            it.
          </p>
        </div>
      )}
    </div>
  )
}
