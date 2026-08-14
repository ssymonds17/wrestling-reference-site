'use client'

import { useEffect, useRef, useState } from 'react'
import { searchWrestlers, Wrestler } from '@/lib/api'

interface WrestlerSearchProps {
  /** The currently selected wrestler, if any. Controlled by the parent. */
  selected: Wrestler | null
  onSelect: (wrestler: Wrestler | null) => void
  placeholder?: string
  label?: string
  /**
   * Wrestler ids that cannot be picked, e.g. already added as participants on
   * the match form. They still appear in results but are shown disabled, so
   * the reason they are unavailable is visible rather than mysterious.
   */
  excludeIds?: string[]
}

const DEBOUNCE_MS = 250
const MIN_QUERY_LENGTH = 2

/**
 * Which of the wrestler's names the query actually hit. Surfacing this lets
 * the user confirm an alias-only match (e.g. searching "Allan Le Foudre"
 * resolving to Charly Verhulst) rather than wondering why a name they didn't
 * type came back.
 */
const matchedAlias = (wrestler: Wrestler, query: string): string | null => {
  const q = query.toLowerCase()
  if (wrestler.displayName.toLowerCase().includes(q)) return null
  const alias = wrestler.aliases.find((a) => a.search.includes(q))
  return alias ? alias.display : null
}

/**
 * The line under the name. Aliases are what separate two similarly named
 * wrestlers, so they earn the space — a match count does not help you pick
 * between two Gregs.
 *
 * When the hit came from an alias, that specific alias is the useful thing to
 * show: it explains why a name the user did not type is in the results. When
 * the hit was on the main name, the full alias list is the disambiguator.
 */
const resultSubtitle = (wrestler: Wrestler, query: string): string | null => {
  const alias = matchedAlias(wrestler, query)
  if (alias) return `via alias: ${alias}`
  if (wrestler.aliases.length === 0) return null
  return `aka ${wrestler.aliases.map((a) => a.display).join(', ')}`
}

export default function WrestlerSearch({
  selected,
  onSelect,
  placeholder = 'Search wrestlers by name or alias...',
  label,
  excludeIds = [],
}: WrestlerSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Wrestler[]>([])
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < MIN_QUERY_LENGTH) {
      setResults([])
      return
    }

    // Guard against out-of-order responses: a slow early request must not
    // overwrite results from a later, more specific query.
    let active = true
    setSearching(true)
    const timer = setTimeout(async () => {
      try {
        const { data } = await searchWrestlers(trimmed, 15)
        if (active) {
          setResults(data)
          setOpen(true)
        }
      } catch {
        if (active) setResults([])
      } finally {
        if (active) setSearching(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query])

  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSelect = (wrestler: Wrestler) => {
    onSelect(wrestler)
    setQuery('')
    setResults([])
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="mb-1 block text-sm text-gray-300">{label}</label>
      )}

      {selected ? (
        <div className="flex items-center justify-between gap-2 rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm">
          <span className="text-gray-100">{selected.displayName}</span>
          <button
            type="button"
            onClick={() => onSelect(null)}
            className="text-xs text-gray-400 hover:text-red-400"
          >
            Clear
          </button>
        </div>
      ) : (
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
        />
      )}

      {/* min-w so the panel stays readable when the input sits in a narrow grid
          column, as it does for each participant row on the match form. The
          panel is an overlay, so extending past the input is fine. */}
      {open && !selected && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full min-w-[20rem] overflow-y-auto rounded border border-gray-700 bg-gray-900 shadow-lg">
          {results.map((wrestler) => {
            const subtitle = resultSubtitle(wrestler, query.trim())
            const excluded = excludeIds.includes(wrestler._id)
            return (
              <li key={wrestler._id}>
                <button
                  type="button"
                  onClick={() => handleSelect(wrestler)}
                  disabled={excluded}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-transparent"
                >
                  <span
                    className={`block ${
                      excluded ? 'text-gray-600' : 'text-gray-100'
                    }`}
                  >
                    {wrestler.displayName}
                    {excluded && (
                      <span className="text-gray-600"> &middot; already added</span>
                    )}
                  </span>
                  {subtitle && (
                    <span
                      className={`mt-0.5 block break-words text-xs leading-snug ${
                        excluded ? 'text-gray-700' : 'text-gray-500'
                      }`}
                    >
                      {subtitle}
                    </span>
                  )}
                </button>
              </li>
            )
          })}
          {!searching && results.length === 0 && (
            <li className="px-3 py-2 text-sm text-gray-500">No wrestlers found.</li>
          )}
          {searching && (
            <li className="px-3 py-2 text-sm text-gray-500">Searching...</li>
          )}
        </ul>
      )}
    </div>
  )
}
