import Link from 'next/link'
import { Wrestler } from '@/lib/api'
import RatingDistribution from '@/components/Rating/RatingDistribution'

interface WrestlersTableProps {
  wrestlers: Wrestler[]
  loading?: boolean
  emptyMessage?: string
}

// Deliberately not sortable. This page is a name lookup, always alphabetical;
// ranking by matches or career score is the leaderboard's job. The counts stay
// as context on the row.
export default function WrestlersTable({
  wrestlers,
  loading = false,
  emptyMessage = 'No wrestlers found.',
}: WrestlersTableProps) {
  return (
    <div className="overflow-x-auto rounded border border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-900 text-gray-400">
          <tr>
            <th className="px-3 py-2 text-left font-medium">Wrestler</th>
            <th className="px-3 py-2 text-left font-medium">Matches</th>
            <th className="px-3 py-2 text-left font-medium">Career score</th>
            <th className="px-3 py-2 text-left font-medium">Aliases</th>
            <th className="px-3 py-2 text-left font-medium">Ratings</th>
            <th className="px-3 py-2 text-right font-medium">Cagematch</th>
          </tr>
        </thead>
        <tbody>
          {wrestlers.map((wrestler) => (
            <tr
              key={wrestler._id}
              className="border-t border-gray-800 hover:bg-gray-900/40"
            >
              <td className="px-3 py-2">
                <Link
                  href={`/wrestler/${wrestler._id}`}
                  className="text-blue-400 hover:text-blue-300"
                >
                  {wrestler.displayName}
                </Link>
              </td>
              <td className="px-3 py-2 tabular-nums text-gray-300">
                {wrestler.totalMatches}
              </td>
              <td className="px-3 py-2 tabular-nums text-gray-100">
                {wrestler.careerScore}
              </td>
              <td className="max-w-xs px-3 py-2 text-xs text-gray-500">
                {wrestler.aliases.length > 0
                  ? wrestler.aliases.map((a) => a.display).join(', ')
                  : '—'}
              </td>
              <td className="w-32 px-3 py-2">
                <RatingDistribution counts={wrestler.ratingCounts} variant="strip" />
              </td>
              <td className="whitespace-nowrap px-3 py-2 text-right">
                {wrestler.cagematchUrl ? (
                  <a
                    href={wrestler.cagematchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${wrestler.displayName} on Cagematch`}
                    className="text-sm text-blue-400 hover:text-blue-300"
                  >
                    Profile ↗
                  </a>
                ) : (
                  <span className="text-gray-700">&mdash;</span>
                )}
              </td>
            </tr>
          ))}
          {loading && (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                Loading wrestlers...
              </td>
            </tr>
          )}
          {!loading && wrestlers.length === 0 && (
            <tr>
              <td colSpan={6} className="px-3 py-6 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
