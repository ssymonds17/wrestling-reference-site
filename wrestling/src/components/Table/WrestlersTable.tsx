import Link from 'next/link'
import { Wrestler, WrestlerSortBy } from '@/lib/api'
import RatingDistribution from '@/components/Rating/RatingDistribution'

interface WrestlersTableProps {
  wrestlers: Wrestler[]
  loading?: boolean
  sortBy: WrestlerSortBy
  onSortChange: (sortBy: WrestlerSortBy) => void
  emptyMessage?: string
}

const SORTABLE: { key: WrestlerSortBy; label: string }[] = [
  { key: 'name', label: 'Wrestler' },
  { key: 'totalMatches', label: 'Matches' },
  { key: 'careerScore', label: 'Career score' },
]

export default function WrestlersTable({
  wrestlers,
  loading = false,
  sortBy,
  onSortChange,
  emptyMessage = 'No wrestlers found.',
}: WrestlersTableProps) {
  return (
    <div className="overflow-x-auto rounded border border-gray-800">
      <table className="w-full text-sm">
        <thead className="bg-gray-900 text-gray-400">
          <tr>
            {SORTABLE.map(({ key, label }) => (
              <th key={key} className="px-3 py-2 text-left font-medium">
                <button
                  type="button"
                  onClick={() => onSortChange(key)}
                  className={`hover:text-gray-200 ${
                    sortBy === key ? 'text-blue-400' : ''
                  }`}
                >
                  {label}
                  {sortBy === key && <span aria-hidden> &darr;</span>}
                </button>
              </th>
            ))}
            <th className="px-3 py-2 text-left font-medium">Aliases</th>
            <th className="px-3 py-2 text-left font-medium">Ratings</th>
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
            </tr>
          ))}
          {loading && (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                Loading wrestlers...
              </td>
            </tr>
          )}
          {!loading && wrestlers.length === 0 && (
            <tr>
              <td colSpan={5} className="px-3 py-6 text-center text-gray-500">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
