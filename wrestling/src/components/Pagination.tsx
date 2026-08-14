interface PaginationProps {
  offset: number
  limit: number
  /** Rows returned for the current page. */
  pageCount: number
  onOffsetChange: (offset: number) => void
  loading?: boolean
}

/**
 * GET /matches returns no grand total, only the page it served, so there is
 * no last-page control and no page count. A full page implies another page
 * may exist; a short page means this is the end.
 */
export default function Pagination({
  offset,
  limit,
  pageCount,
  onOffsetChange,
  loading = false,
}: PaginationProps) {
  const hasPrevious = offset > 0
  const hasNext = pageCount === limit
  const from = pageCount === 0 ? 0 : offset + 1
  const to = offset + pageCount

  if (!hasPrevious && !hasNext) return null

  const buttonClasses =
    'rounded border border-gray-700 px-3 py-1.5 text-sm hover:border-gray-500 disabled:opacity-30 disabled:hover:border-gray-700'

  return (
    <div className="mt-4 flex items-center justify-between">
      <span className="text-sm tabular-nums text-gray-500">
        {from}–{to}
      </span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onOffsetChange(Math.max(0, offset - limit))}
          disabled={!hasPrevious || loading}
          className={buttonClasses}
        >
          Previous
        </button>
        <button
          type="button"
          onClick={() => onOffsetChange(offset + limit)}
          disabled={!hasNext || loading}
          className={buttonClasses}
        >
          Next
        </button>
      </div>
    </div>
  )
}
