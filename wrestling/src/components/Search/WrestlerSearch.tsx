'use client'

import { useEffect, useRef, useState } from 'react'
import { searchWrestlers, Wrestler } from '@/lib/api'

interface WrestlerSearchProps {
  /** The currently selected wrestler, if any. Controlled by the parent. */
  selected: Wrestler | null
  onSelect: (wrestler: Wrestler | null) => void
  placeholder?: string
  label?: string
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

export default function WrestlerSearch({
  selected,
  onSelect,
  placeholder = 'Search wrestlers by name or alias...',
  label,
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

      {open && !selected && (
        <ul className="absolute z-20 mt-1 max-h-72 w-full overflow-y-auto rounded border border-gray-700 bg-gray-900 shadow-lg">
          {results.map((wrestler) => {
            const alias = matchedAlias(wrestler, query.trim())
            return (
              <li key={wrestler._id}>
                <button
                  type="button"
                  onClick={() => handleSelect(wrestler)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-gray-800"
                >
                  <span className="text-gray-100">
                    {wrestler.displayName}
                    {alias && (
                      <span className="text-gray-500"> (via alias: {alias})</span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs text-gray-500">
                    {wrestler.totalMatches} matches
                  </span>
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
