interface PaginationProps {
  offset: number
  limit: number
  /** Rows returned for the current page. */
  pageCount: number
  /** Rows matching the filter in total, ignoring the page window. */
  total: number
  onOffsetChange: (offset: number) => void
  loading?: boolean
}

/**
 * hasNext comes from the total rather than from the page being full. Inferring
 * it from a full page means a filter matching exactly one page length offers a
 * Next that lands on nothing.
 */
export default function Pagination({
  offset,
  limit,
  pageCount,
  total,
  onOffsetChange,
  loading = false,
}: PaginationProps) {
  const hasPrevious = offset > 0
  const hasNext = offset + pageCount < total
  const from = pageCount === 0 ? 0 : offset + 1
  const to = offset + pageCount

  if (!hasPrevious && !hasNext) return null

  const buttonClasses =
    'rounded border border-gray-700 px-3 py-1.5 text-sm hover:border-gray-500 disabled:opacity-30 disabled:hover:border-gray-700'

  const page = Math.floor(offset / limit) + 1
  const pageTotal = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="mt-4 flex items-center justify-between">
      <span className="text-sm text-gray-500">
        <span className="tabular-nums">
          {from}–{to}
        </span>{' '}
        of <span className="tabular-nums">{total}</span>
        <span className="ml-2 text-gray-600">
          page <span className="tabular-nums">{page}</span> of{' '}
          <span className="tabular-nums">{pageTotal}</span>
        </span>
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
