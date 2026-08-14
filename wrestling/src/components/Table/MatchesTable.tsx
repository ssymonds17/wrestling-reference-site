import Link from 'next/link'
import { Match } from '@/lib/api'
import { formatDate } from '@/lib/format'
import MatchRatingBadge from '@/components/Rating/MatchRatingBadge'
import PerformanceBadge from '@/components/Rating/PerformanceBadge'

interface MatchesTableProps {
  matches: Match[]
  loading?: boolean
  /**
   * When rendered on a wrestler profile, show that wrestler's performance
   * rating in its own column instead of listing every participant.
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
  emptyMessage = 'No matches found.',
}: MatchesTableProps) {
  const perspective = Boolean(highlightWrestlerId)

  return (
    <div className="overflow-x-auto rounded border border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-900 text-gray-400">
          <tr>
            <HeaderCell>Date</HeaderCell>
            <HeaderCell>Promotion</HeaderCell>
            <HeaderCell>Show</HeaderCell>
            <HeaderCell>Match</HeaderCell>
            <HeaderCell>Type</HeaderCell>
            <HeaderCell>Rating</HeaderCell>
            <HeaderCell>{perspective ? 'Performance' : 'Participants'}</HeaderCell>
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
                <td className="whitespace-nowrap px-3 py-2 tabular-nums">
                  <Link
                    href={`/match/${match._id}`}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    {formatDate(match.date)}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-3 py-2 text-gray-300">
                  {match.promotionDisplayName}
                </td>
                <td className="px-3 py-2 text-gray-400">{match.show}</td>
                <td className="px-3 py-2 text-gray-200">
                  <Link
                    href={`/match/${match._id}`}
                    className="hover:text-blue-300"
                  >
                    {match.participantsDisplay}
                  </Link>
                </td>
                <td className="px-3 py-2 text-gray-400">{match.matchTitle}</td>
                <td className="px-3 py-2">
                  <MatchRatingBadge rating={match.overallMatchRating} />
                </td>
                <td className="px-3 py-2">
                  {perspective ? (
                    <PerformanceBadge
                      rating={highlighted?.performanceRating ?? null}
                      withLabel
                    />
                  ) : (
                    <div className="flex flex-wrap gap-x-3 gap-y-1">
                      {match.participants.map((p, i) => (
                        <span
                          key={`${p.wrestlerId}-${i}`}
                          className="inline-flex items-center gap-1 whitespace-nowrap"
                        >
                          <Link
                            href={`/wrestler/${p.wrestlerId}`}
                            className="text-gray-200 hover:text-blue-300"
                          >
                            {p.displayName}
                          </Link>
                          <PerformanceBadge rating={p.performanceRating} />
                        </span>
                      ))}
                    </div>
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
  )
}
