'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getMatchById, getPromotionById, Match, Promotion } from '@/lib/api'
import { errorMessage, formatDate } from '@/lib/format'
import MatchRatingBadge from '@/components/Rating/MatchRatingBadge'
import PerformanceBadge from '@/components/Rating/PerformanceBadge'

interface MatchPageProps {
  params: { id: string }
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-gray-200">{children}</dd>
    </div>
  )
}

export default function MatchPage({ params }: MatchPageProps) {
  const [match, setMatch] = useState<Match | null>(null)
  const [promotion, setPromotion] = useState<Promotion | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const load = async () => {
      try {
        const found = await getMatchById(params.id)
        if (!active) return
        setMatch(found)

        // The match stores the era-correct label; fetch the promotion so we
        // can also show the canonical entity and link to its other matches.
        try {
          const promotionDoc = await getPromotionById(found.promotionId)
          if (active) setPromotion(promotionDoc)
        } catch {
          // Non-fatal: the label on the match is enough to render the page.
        }
      } catch (err) {
        if (active) setError(errorMessage(err, 'Could not load match'))
      } finally {
        if (active) setLoading(false)
      }
    }
    load()
    return () => {
      active = false
    }
  }, [params.id])

  if (loading) {
    return <p className="text-sm text-gray-500">Loading match...</p>
  }

  if (error || !match) {
    return (
      <div>
        <p className="text-sm text-red-400">{error ?? 'Match not found.'}</p>
        <Link
          href="/matches"
          className="mt-3 inline-block text-sm text-blue-400 hover:text-blue-300"
        >
          &larr; Back to matches
        </Link>
      </div>
    )
  }

  const rated = match.participants.filter(
    (p) => p.performanceRating !== null && p.performanceRating !== undefined,
  )

  return (
    <div className="max-w-4xl">
      <Link
        href="/matches"
        className="text-sm text-blue-400 hover:text-blue-300"
      >
        &larr; Back to matches
      </Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold leading-snug">
            {match.participantsDisplay}
          </h1>
          <p className="mt-1 text-gray-400">{match.matchTitle}</p>
        </div>
        <div className="text-right">
          <MatchRatingBadge rating={match.overallMatchRating} size="lg" />
          <div className="mt-1 text-xs text-gray-500">overall rating</div>
        </div>
      </div>

      <dl className="mt-6 grid gap-4 rounded border border-gray-800 bg-gray-900/50 p-5 sm:grid-cols-4">
        <Field label="Date">
          <span className="tabular-nums">{formatDate(match.date)}</span>
        </Field>
        <Field label="Year">
          <Link
            href={`/year/${match.year}`}
            className="text-blue-400 hover:text-blue-300"
          >
            {match.year}
          </Link>
        </Field>
        <Field label="Promotion">
          <Link
            href={`/matches?promotionId=${match.promotionId}`}
            className="text-blue-400 hover:text-blue-300"
          >
            {match.promotionDisplayName}
          </Link>
          {promotion && promotion.displayName !== match.promotionDisplayName && (
            <span className="block text-xs text-gray-500">
              {promotion.displayName}
            </span>
          )}
        </Field>
        <Field label="Show">{match.show}</Field>
      </dl>

      {(match.extraInfo || match.cardUrl) && (
        <div className="mt-4 space-y-2 text-sm">
          {match.extraInfo && (
            <p className="text-gray-300">{match.extraInfo}</p>
          )}
          {match.cardUrl && (
            <a
              href={match.cardUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
            >
              View full card &rarr;
            </a>
          )}
        </div>
      )}

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-semibold">
          Participants{' '}
          <span className="text-base text-gray-500">
            ({match.participantCount}
            {rated.length < match.participantCount &&
              `, ${rated.length} rated`}
            )
          </span>
        </h2>

        <ul className="divide-y divide-gray-800 rounded border border-gray-800">
          {match.participants.map((participant, index) => (
            <li
              key={`${participant.wrestlerId}-${index}`}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <Link
                href={`/wrestler/${participant.wrestlerId}`}
                className="text-blue-400 hover:text-blue-300"
              >
                {participant.displayName}
              </Link>
              <PerformanceBadge
                rating={participant.performanceRating}
                withLabel
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}
