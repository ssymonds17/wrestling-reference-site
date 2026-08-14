"use client"

import { useState } from "react"
import Link from "next/link"
import { Match } from "@/lib/api"
import { formatDate } from "@/lib/format"
import MatchRatingBadge from "@/components/Rating/MatchRatingBadge"
import PerformanceBadge from "@/components/Rating/PerformanceBadge"
import ParticipantsModal from "@/components/Modal/ParticipantsModal"

interface MatchesTableProps {
  matches: Match[]
  loading?: boolean
  /**
   * When rendered on a wrestler profile, show that wrestler's performance
   * rating in its own column instead of the participants pill.
   */
  highlightWrestlerId?: string
  emptyMessage?: string
}

const HeaderCell = ({ children }: { children: React.ReactNode }) => (
  <th className="px-3 py-2 text-left font-medium">{children}</th>
)

export default function MatchesTable({
  matches,
  loading = false,
  highlightWrestlerId,
  emptyMessage = "No matches found.",
}: MatchesTableProps) {
  const perspective = Boolean(highlightWrestlerId)
  const [openMatch, setOpenMatch] = useState<Match | null>(null)

  return (
    <>
      <div className="overflow-x-auto rounded border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400">
            <tr>
              <HeaderCell>Rating</HeaderCell>
              <HeaderCell>Date</HeaderCell>
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
