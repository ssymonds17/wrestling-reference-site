'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { SignedIn } from '@clerk/nextjs'
import MatchFilters, {
  MatchFilterState,
} from '@/components/Filters/MatchFilters'
import MatchesTable, { MatchSort } from '@/components/Table/MatchesTable'
import Pagination from '@/components/Pagination'
import {
  getMatches,
  getPromotions,
  getWrestlerById,
  getYears,
  Match,
  MatchSortBy,
  MatchSortDir,
  Promotion,
  Wrestler,
  YearSummary,
} from '@/lib/api'
import { errorMessage } from '@/lib/format'

const PAGE_SIZE = 50

const EMPTY_FILTERS: MatchFilterState = {
  year: '',
  promotionId: '',
  minOverallRating: '',
}

const DEFAULT_SORT: MatchSort = { sortBy: 'date', sortDir: 'desc' }

// 'performance' is deliberately excluded. This page has no single wrestler to
// sort by — the API 400s without a wrestlerId — and the table shows the
// participants pill rather than a performance column here. A URL asking for it
// falls back to the default rather than erroring. Do not add it.
const VALID_SORT_BY: MatchSortBy[] = ['date', 'rating']
const VALID_SORT_DIR: MatchSortDir[] = ['asc', 'desc']

// An unrecognised value in the URL falls back to the default rather than
// erroring, matching how the API treats the same params.
const sortFromParams = (
  sortBy: string | null,
  sortDir: string | null,
): MatchSort => ({
  sortBy: VALID_SORT_BY.includes(sortBy as MatchSortBy)
    ? (sortBy as MatchSortBy)
    : DEFAULT_SORT.sortBy,
  sortDir: VALID_SORT_DIR.includes(sortDir as MatchSortDir)
    ? (sortDir as MatchSortDir)
    : DEFAULT_SORT.sortDir,
})

function Matches() {
  const router = useRouter()
  const searchParams = useSearchParams()

  // Filters live in the URL so a filtered view is linkable and survives
  // a refresh or a trip through a match detail page and back.
  const [filters, setFilters] = useState<MatchFilterState>({
    year: searchParams.get('year') ?? '',
    promotionId: searchParams.get('promotionId') ?? '',
    minOverallRating: searchParams.get('minOverallRating') ?? '',
  })
  const [wrestler, setWrestler] = useState<Wrestler | null>(null)
  const [sort, setSort] = useState<MatchSort>(
    sortFromParams(searchParams.get('sortBy'), searchParams.get('sortDir')),
  )
  const [offset, setOffset] = useState(
    Number.parseInt(searchParams.get('offset') ?? '0', 10) || 0,
  )

  const [matches, setMatches] = useState<Match[]>([])
  const [total, setTotal] = useState(0)
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [years, setYears] = useState<YearSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const wrestlerIdParam = searchParams.get('wrestlerId')

  // Reference data for the filter dropdowns. Promotions and years are both
  // small bounded lists, unlike the wrestler roster which is searched instead.
  useEffect(() => {
    const load = async () => {
      try {
        const [promotionsResponse, yearsResponse] = await Promise.all([
          getPromotions(),
          getYears(),
        ])
        setPromotions(promotionsResponse.data)
        setYears(yearsResponse.data)
      } catch (err) {
        setError(errorMessage(err, 'Could not load filter options'))
      }
    }
    load()
  }, [])

  // Rehydrate the wrestler chip when arriving on a ?wrestlerId= link, e.g.
  // from a profile page, so the filter bar shows a name rather than an id.
  useEffect(() => {
    if (!wrestlerIdParam) {
      setWrestler(null)
      return
    }
    let active = true
    getWrestlerById(wrestlerIdParam)
      .then((found) => {
        if (active) setWrestler(found)
      })
      .catch(() => {
        if (active) setWrestler(null)
      })
    return () => {
      active = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrestlerIdParam])

  const loadMatches = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data, total: matchTotal } = await getMatches({
        year: filters.year ? Number(filters.year) : undefined,
        promotionId: filters.promotionId || undefined,
        wrestlerId: wrestler?._id,
        minOverallRating: filters.minOverallRating
          ? Number(filters.minOverallRating)
          : undefined,
        sortBy: sort.sortBy,
        sortDir: sort.sortDir,
        limit: PAGE_SIZE,
        offset,
      })
      setMatches(data)
      setTotal(matchTotal)
    } catch (err) {
      setError(errorMessage(err, 'Could not load matches'))
    } finally {
      setLoading(false)
    }
  }, [filters, wrestler, sort, offset])

  useEffect(() => {
    loadMatches()
  }, [loadMatches])

  const syncUrl = useCallback(
    (
      next: MatchFilterState,
      nextWrestlerId: string | null,
      nextSort: MatchSort,
      nextOffset: number,
    ) => {
      const params = new URLSearchParams()
      if (next.year) params.set('year', next.year)
      if (next.promotionId) params.set('promotionId', next.promotionId)
      if (next.minOverallRating) {
        params.set('minOverallRating', next.minOverallRating)
      }
      if (nextWrestlerId) params.set('wrestlerId', nextWrestlerId)
      // Only non-default sorts go in the URL, so a plain /matches link stays
      // clean and the default order is implied.
      if (nextSort.sortBy !== DEFAULT_SORT.sortBy) {
        params.set('sortBy', nextSort.sortBy)
      }
      if (nextSort.sortDir !== DEFAULT_SORT.sortDir) {
        params.set('sortDir', nextSort.sortDir)
      }
      if (nextOffset > 0) params.set('offset', String(nextOffset))
      const query = params.toString()
      router.replace(query ? `/matches?${query}` : '/matches', { scroll: false })
    },
    [router],
  )

  // Any filter or sort change resets paging — page 3 of the old result set is
  // meaningless against the new one.
  const handleFilterChange = (next: MatchFilterState) => {
    setFilters(next)
    setOffset(0)
    syncUrl(next, wrestler?._id ?? null, sort, 0)
  }

  const handleWrestlerChange = (next: Wrestler | null) => {
    setWrestler(next)
    setOffset(0)
    syncUrl(filters, next?._id ?? null, sort, 0)
  }

  const handleSortChange = (next: MatchSort) => {
    setSort(next)
    setOffset(0)
    syncUrl(filters, wrestler?._id ?? null, next, 0)
  }

  const handleOffsetChange = (next: number) => {
    setOffset(next)
    syncUrl(filters, wrestler?._id ?? null, sort, next)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleReset = () => {
    setFilters(EMPTY_FILTERS)
    setWrestler(null)
    setSort(DEFAULT_SORT)
    setOffset(0)
    syncUrl(EMPTY_FILTERS, null, DEFAULT_SORT, 0)
  }

  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Matches</h1>
          <p className="mt-1 text-sm text-gray-400">
            Filter by year, promotion, wrestler or minimum overall rating.
          </p>
        </div>
        <SignedIn>
          <Link
            href="/match/new"
            className="shrink-0 rounded border border-blue-600 bg-blue-600 px-4 py-2 text-sm font-medium hover:bg-blue-700"
          >
            Add match
          </Link>
        </SignedIn>
      </div>

      <MatchFilters
        filters={filters}
        onChange={handleFilterChange}
        wrestler={wrestler}
        onWrestlerChange={handleWrestlerChange}
        promotions={promotions}
        years={years}
        onReset={handleReset}
        resultCount={total}
      />

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <MatchesTable
        matches={matches}
        loading={loading}
        sort={sort}
        onSortChange={handleSortChange}
      />

      <Pagination
        offset={offset}
        limit={PAGE_SIZE}
        pageCount={matches.length}
        total={total}
        onOffsetChange={handleOffsetChange}
        loading={loading}
      />
    </div>
  )
}

export default function MatchesPage() {
  // useSearchParams requires a Suspense boundary during static prerender.
  return (
    <Suspense fallback={<p className="text-sm text-gray-500">Loading...</p>}>
      <Matches />
    </Suspense>
  )
}
