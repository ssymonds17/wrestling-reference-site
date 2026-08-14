"use client"

import { useState } from "react"
import Link from "next/link"
import { Match, MatchSortBy, MatchSortDir } from "@/lib/api"
import { formatDate } from "@/lib/format"
import MatchRatingBadge from "@/components/Rating/MatchRatingBadge"
import PerformanceBadge from "@/components/Rating/PerformanceBadge"
import ParticipantsModal from "@/components/Modal/ParticipantsModal"

export interface MatchSort {
  sortBy: MatchSortBy
  sortDir: MatchSortDir
}

interface MatchesTableProps {
  matches: Match[]
  loading?: boolean
  /**
   * When rendered on a wrestler profile, show that wrestler's performance
   * rating in its own column instead of the participants pill.
   */
  highlightWrestlerId?: string
  emptyMessage?: string
  /**
   * Supply both to make Rating and Date sortable. Sorting is server-side, so
   * omitting these leaves the headers as plain text rather than offering a
   * control that would only reorder the current page.
   */
  sort?: MatchSort
  onSortChange?: (sort: MatchSort) => void
}

const HeaderCell = ({ children }: { children: React.ReactNode }) => (
  <th className="px-3 py-2 text-left font-medium">{children}</th>
)

/**
 * Clicking the active column flips direction; clicking a new one starts
 * descending, which is the more useful default for both a date and a rating.
 */
const nextSort = (current: MatchSort, sortBy: MatchSortBy): MatchSort =>
  current.sortBy === sortBy
    ? { sortBy, sortDir: current.sortDir === "desc" ? "asc" : "desc" }
    : { sortBy, sortDir: "desc" }

const SortableHeader = ({
  label,
  sortBy,
  sort,
  onSortChange,
}: {
  label: string
  sortBy: MatchSortBy
  sort?: MatchSort
  onSortChange?: (sort: MatchSort) => void
}) => {
  if (!sort || !onSortChange) return <HeaderCell>{label}</HeaderCell>

  const active = sort.sortBy === sortBy

  return (
    <th className="px-3 py-2 text-left font-medium">
      <button
        type="button"
        onClick={() => onSortChange(nextSort(sort, sortBy))}
        aria-label={`Sort by ${label.toLowerCase()}`}
        className={`hover:text-gray-200 ${active ? "text-blue-400" : ""}`}
      >
        {label}
        <span aria-hidden className={active ? "" : "text-gray-700"}>
          {" "}
          {active && sort.sortDir === "asc" ? "↑" : "↓"}
        </span>
      </button>
    </th>
  )
}

export default function MatchesTable({
  matches,
  loading = false,
  highlightWrestlerId,
  emptyMessage = "No matches found.",
  sort,
  onSortChange,
}: MatchesTableProps) {
  const perspective = Boolean(highlightWrestlerId)
  const [openMatch, setOpenMatch] = useState<Match | null>(null)

  return (
    <>
      <div className="overflow-x-auto rounded border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <SortableHeader
                label="Rating"
                sortBy="rating"
                sort={sort}
                onSortChange={onSortChange}
              />
              <SortableHeader
                label="Date"
                sortBy="date"
                sort={sort}
                onSortChange={onSortChange}
              />
              <HeaderCell>Promotion</HeaderCell>
              <HeaderCell>Show</HeaderCell>
              <HeaderCell>Match</HeaderCell>
              <HeaderCell>Type</HeaderCell>
              <HeaderCell>
                {perspective ? "Performance" : "Participants"}
              </HeaderCell>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => {
              const highlighted = highlightWrestlerId
                ? match.participants.find(
                    (p) => p.wrestlerId === highlightWrestlerId,
                  )
                : undefined

              return (
                <tr
                  key={match._id}
                  className="border-t border-gray-800 hover:bg-gray-900/40"
                >
                  <td className="px-3 py-2">
                    <MatchRatingBadge rating={match.overallMatchRating} />
                  </td>
                  {/* Deliberately not a link: the only route to the match page
                      is the Match column, and the card URL is surfaced on the
                      match page itself rather than here. */}
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-gray-300">
                    {formatDate(match.date)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-gray-300">
                    {match.promotionDisplayName}
                  </td>
                  <td className="px-3 py-2 text-gray-400">{match.show}</td>
                  <td className="px-3 py-2">
                    <Link
                      href={`/match/${match._id}`}
                      className="text-gray-200 hover:text-blue-300"
                    >
                      {match.participantsDisplay}
                    </Link>
                  </td>
                  <td className="px-3 py-2 text-gray-400">{match.matchTitle}</td>
                  <td className="px-3 py-2">
                    {perspective ? (
                      <PerformanceBadge
                        rating={highlighted?.performanceRating ?? null}
                        withLabel
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => setOpenMatch(match)}
                        className="whitespace-nowrap rounded-full border border-gray-700 px-2.5 py-0.5 text-xs text-gray-300 transition-colors hover:border-gray-500 hover:text-gray-100"
                      >
                        {match.participantCount} participant
                        {match.participantCount === 1 ? "" : "s"}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {loading && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  Loading matches...
                </td>
              </tr>
            )}
            {!loading && matches.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ParticipantsModal
        match={openMatch}
        onClose={() => setOpenMatch(null)}
        highlightWrestlerId={highlightWrestlerId}
      />
    </>
  )
}
