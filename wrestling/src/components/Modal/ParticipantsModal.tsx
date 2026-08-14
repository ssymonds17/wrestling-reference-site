"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { getWrestlersByIds, Match } from "@/lib/api"
import { formatDate } from "@/lib/format"
import Modal from "@/components/Modal/Modal"
import PerformanceBadge from "@/components/Rating/PerformanceBadge"

interface ParticipantsModalProps {
  /** The match whose participants to show, or null when closed. */
  match: Match | null
  onClose: () => void
  /** Highlights one participant, e.g. the wrestler whose profile we are on. */
  highlightWrestlerId?: string
}

export default function ParticipantsModal({
  match,
  onClose,
  highlightWrestlerId,
}: ParticipantsModalProps) {
  // A match participant stores only the name used in that match, so the
  // canonical name has to be looked up. One batch request resolves the whole
  // participant list, and resolved names are cached for the lifetime of the
  // table since the same wrestlers recur heavily across a filtered list.
  const cache = useRef<Map<string, string>>(new Map())
  const [canonicalNames, setCanonicalNames] = useState<Map<string, string>>(
    new Map(),
  )

  useEffect(() => {
    if (!match) return

    const missing = Array.from(
      new Set(
        match.participants
          .map((p) => p.wrestlerId)
          .filter((id) => !cache.current.has(id)),
      ),
    )

    // Publish whatever is already cached straight away so names that were
    // resolved on a previous open render without a flash.
    setCanonicalNames(new Map(cache.current))
    if (missing.length === 0) return

    let active = true
    getWrestlersByIds(missing)
      .then((wrestlers) => {
        // Keyed off the returned ids rather than the requested order: the API
        // drops unknown or malformed ids, so the result can be shorter.
        for (const wrestler of wrestlers) {
          cache.current.set(wrestler._id, wrestler.displayName)
        }
        if (active) setCanonicalNames(new Map(cache.current))
      })
      .catch(() => {
        // A failed lookup just leaves the per-match names showing, which is
        // still correct, just less informative.
      })

    return () => {
      active = false
    }
  }, [match])

  return (
    <Modal
      open={match !== null}
      onClose={onClose}
      title={match ? match.participantsDisplay : ""}
      subtitle={
        match
          ? `${match.promotionDisplayName} · ${match.show} · ${formatDate(
              match.date,
            )}`
          : undefined
      }
    >
      {match && (
        <>
          <ul className="divide-y divide-gray-800">
            {match.participants.map((participant, index) => {
              const highlighted = participant.wrestlerId === highlightWrestlerId
              const canonical = canonicalNames.get(participant.wrestlerId)
              // Until the lookup resolves, fall back to the per-match name so
              // the row is never blank.
              const primary = canonical ?? participant.displayName
              const showAlias =
                canonical !== undefined && canonical !== participant.displayName

              return (
                <li
                  key={`${participant.wrestlerId}-${index}`}
                  className="flex items-center justify-between gap-3 py-2"
                >
                  <span className="min-w-0">
                    <Link
                      href={`/wrestler/${participant.wrestlerId}`}
                      onClick={onClose}
                      className={
                        highlighted
                          ? "font-medium text-gray-100 hover:text-blue-300"
                          : "text-blue-400 hover:text-blue-300"
                      }
                    >
                      {primary}
                    </Link>
                    {showAlias && (
                      <span className="text-gray-500">
                        {" "}
                        ({participant.displayName})
                      </span>
                    )}
                  </span>
                  <PerformanceBadge
                    rating={participant.performanceRating}
                    withLabel
                  />
                </li>
              )
            })}
          </ul>

          <Link
            href={`/match/${match._id}`}
            onClick={onClose}
            className="mt-4 inline-block text-sm text-blue-400 hover:text-blue-300"
          >
            Open full match &rarr;
          </Link>
        </>
      )}
    </Modal>
  )
}
