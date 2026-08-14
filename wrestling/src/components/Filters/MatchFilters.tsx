'use client'

import { Promotion, Wrestler, YearSummary } from '@/lib/api'
import { OVERALL_MATCH_RATING_VALUES } from '@/lib/api'
import WrestlerSearch from '@/components/Search/WrestlerSearch'

export interface MatchFilterState {
  year: string
  promotionId: string
  minOverallRating: string
}

interface MatchFiltersProps {
  filters: MatchFilterState
  onChange: (filters: MatchFilterState) => void
  wrestler: Wrestler | null
  onWrestlerChange: (wrestler: Wrestler | null) => void
  promotions: Promotion[]
  years: YearSummary[]
  onReset: () => void
  resultCount: number
}

const selectClasses =
  'w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none'

const promotionLabel = (promotion: Promotion): string =>
  promotion.abbreviation
    ? `${promotion.abbreviation} — ${promotion.displayName}`
    : promotion.displayName

export default function MatchFilters({
  filters,
  onChange,
  wrestler,
  onWrestlerChange,
  promotions,
  years,
  onReset,
  resultCount,
}: MatchFiltersProps) {
  const set = (field: keyof MatchFilterState) => (value: string) =>
    onChange({ ...filters, [field]: value })

  const active =
    Boolean(filters.year) ||
    Boolean(filters.promotionId) ||
    Boolean(filters.minOverallRating) ||
    Boolean(wrestler)

  return (
    <div className="mb-4 rounded border border-gray-800 bg-gray-900/50 p-4">
      <div className="grid gap-3 md:grid-cols-4">
        <div>
          <label className="mb-1 block text-sm text-gray-300">Year</label>
          <select
            className={selectClasses}
            value={filters.year}
            onChange={(e) => set('year')(e.target.value)}
          >
            <option value="">All years</option>
            {years.map((year) => (
              <option key={year.year} value={year.year}>
                {year.year} ({year.matchCount})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">Promotion</label>
          <select
            className={selectClasses}
            value={filters.promotionId}
            onChange={(e) => set('promotionId')(e.target.value)}
          >
            <option value="">All promotions</option>
            {promotions.map((promotion) => (
              <option key={promotion._id} value={promotion._id}>
                {promotionLabel(promotion)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm text-gray-300">
            Min overall rating
          </label>
          <select
            className={selectClasses}
            value={filters.minOverallRating}
            onChange={(e) => set('minOverallRating')(e.target.value)}
          >
            <option value="">Any rating</option>
            {OVERALL_MATCH_RATING_VALUES.map((value) => (
              <option key={value} value={value}>
                {value}+
              </option>
            ))}
          </select>
        </div>

        <WrestlerSearch
          label="Wrestler"
          selected={wrestler}
          onSelect={onWrestlerChange}
          placeholder="Name or alias..."
        />
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="text-gray-500">
          Showing {resultCount} match{resultCount === 1 ? '' : 'es'}
          {active ? ' for the current filters' : ''}
        </span>
        {active && (
          <button
            type="button"
            onClick={onReset}
            className="text-blue-400 hover:text-blue-300"
          >
            Reset filters
          </button>
        )}
      </div>
    </div>
  )
}
