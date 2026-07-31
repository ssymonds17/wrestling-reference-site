"use client"

import { useCallback, useEffect, useState } from "react"
import axios from "axios"
import { useAuth } from "@clerk/nextjs"
import ProtectedRoute from "@/components/Auth/ProtectedRoute"
import {
  createMatch,
  CreateMatchInput,
  getMatches,
  getPromotions,
  getWrestlers,
  Match,
  OVERALL_MATCH_RATING_VALUES,
  Promotion,
  Wrestler,
} from "@/lib/api"
import { PERFORMANCE_RATING_LABELS } from "@/lib/ratings"

interface ParticipantRow {
  wrestlerId: string
  displayName: string
  performanceRating: string
}

interface FormState {
  date: string
  promotionId: string
  promotionDisplayName: string
  show: string
  matchTitle: string
  participantsDisplay: string
  overallMatchRating: string
  cardUrl: string
  extraInfo: string
}

const EMPTY_FORM: FormState = {
  date: "",
  promotionId: "",
  promotionDisplayName: "",
  show: "",
  matchTitle: "",
  participantsDisplay: "",
  overallMatchRating: "",
  cardUrl: "",
  extraInfo: "",
}

const EMPTY_PARTICIPANT: ParticipantRow = {
  wrestlerId: "",
  displayName: "",
  performanceRating: "",
}

const errorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? err.message ?? fallback
  }
  return err instanceof Error ? err.message : fallback
}

// The selectable era labels are abbreviations: the canonical abbreviation
// plus every alias abbreviation (e.g. AJPW; or WWE -> WWF, WWWF).
const promotionLabelOptions = (promotion: Promotion): string[] => {
  const opts: string[] = []
  if (promotion.abbreviation) opts.push(promotion.abbreviation)
  for (const alias of promotion.aliases) {
    opts.push(alias.abbreviation)
  }
  return Array.from(new Set(opts))
}

const formatDate = (iso: string): string => {
  const d = new Date(iso)
  const dd = String(d.getUTCDate()).padStart(2, "0")
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  return `${dd}-${mm}-${d.getUTCFullYear()}`
}

const buildPayload = (
  form: FormState,
  participants: ParticipantRow[],
): CreateMatchInput | { error: string } => {
  if (!form.date) return { error: "Date is required" }
  if (!form.promotionId) return { error: "Promotion is required" }
  if (!form.promotionDisplayName) return { error: "Promotion label is required" }
  if (!form.participantsDisplay.trim()) {
    return { error: "Participants display is required" }
  }
  const rating = Number(form.overallMatchRating)
  if (!form.overallMatchRating || Number.isNaN(rating)) {
    return { error: "Overall rating is required" }
  }
  const cleaned = participants.filter((p) => p.wrestlerId && p.displayName.trim())
  if (cleaned.length < 2) {
    return { error: "A match needs at least two participants" }
  }
  return {
    date: form.date,
    promotionId: form.promotionId,
    promotionDisplayName: form.promotionDisplayName,
    show: form.show.trim() || "House Show",
    matchTitle: form.matchTitle.trim() || "Singles Match",
    participantsDisplay: form.participantsDisplay.trim(),
    cardUrl: form.cardUrl.trim() || undefined,
    extraInfo: form.extraInfo.trim() || undefined,
    overallMatchRating: rating,
    participants: cleaned.map((p) => ({
      wrestlerId: p.wrestlerId,
      displayName: p.displayName.trim(),
      performanceRating: p.performanceRating ? Number(p.performanceRating) : null,
    })),
  }
}

const inputClasses =
  "w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"

function Matches() {
  const { getToken } = useAuth()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [participants, setParticipants] = useState<ParticipantRow[]>([
    { ...EMPTY_PARTICIPANT },
    { ...EMPTY_PARTICIPANT },
  ])
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [wrestlers, setWrestlers] = useState<Wrestler[]>([])
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadMatches = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getMatches()
      setMatches(data)
    } catch (err) {
      setError(errorMessage(err, "Could not load matches"))
    } finally {
      setLoading(false)
    }
  }, [])

  const loadRefData = useCallback(async () => {
    try {
      const [proms, wres] = await Promise.all([getPromotions(), getWrestlers()])
      setPromotions(proms.data)
      setWrestlers(wres.data)
    } catch (err) {
      setError(errorMessage(err, "Could not load promotions and wrestlers"))
    }
  }, [])

  useEffect(() => {
    loadRefData()
    loadMatches()
  }, [loadRefData, loadMatches])

  const update =
    (field: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handlePromotionChange = (
    e: React.ChangeEvent<HTMLSelectElement>,
  ) => {
    const promotionId = e.target.value
    const promotion = promotions.find((p) => p._id === promotionId)
    setForm((prev) => ({
      ...prev,
      promotionId,
      promotionDisplayName: promotion?.abbreviation ?? "",
    }))
  }

  const updateParticipant =
    (index: number, field: keyof ParticipantRow) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value
      setParticipants((prev) =>
        prev.map((row, i) => {
          if (i !== index) return row
          if (field === "wrestlerId") {
            const wrestler = wrestlers.find((w) => w._id === value)
            return {
              ...row,
              wrestlerId: value,
              displayName: wrestler ? wrestler.displayName : row.displayName,
            }
          }
          return { ...row, [field]: value }
        }),
      )
    }

  const addParticipant = () =>
    setParticipants((prev) => [...prev, { ...EMPTY_PARTICIPANT }])

  const removeParticipant = (index: number) =>
    setParticipants((prev) => prev.filter((_, i) => i !== index))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    const payload = buildPayload(form, participants)
    if ("error" in payload) {
      setError(payload.error)
      return
    }

    setSubmitting(true)
    try {
      const created = await createMatch(payload, getToken)
      setSuccess(
        `Created match at ${created.show} (${created.participantCount} participants, id ${created.id})`,
      )
      setForm(EMPTY_FORM)
      setParticipants([{ ...EMPTY_PARTICIPANT }, { ...EMPTY_PARTICIPANT }])
      await loadMatches()
    } catch (err) {
      setError(errorMessage(err, "Could not create match"))
    } finally {
      setSubmitting(false)
    }
  }

  const selectedPromotion = promotions.find((p) => p._id === form.promotionId)
  const labelOptions = selectedPromotion
    ? promotionLabelOptions(selectedPromotion)
    : []
  const refDataMissing = promotions.length === 0 || wrestlers.length === 0
  const wrestlerNameById = new Map(
    wrestlers.map((w) => [w._id, w.displayName]),
  )

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold">Matches</h1>
      <p className="text-gray-400 mt-1 mb-6 text-sm">
        Browse matches and add new ones. A match references a promotion and its
        participants.
      </p>

      {refDataMissing && (
        <p className="mb-6 text-sm text-yellow-400">
          Create at least one promotion and one wrestler first — a match needs
          both to reference.
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-gray-900/50 border border-gray-800 rounded p-5 mb-8"
      >
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              className={inputClasses}
              value={form.date}
              onChange={update("date")}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Overall rating <span className="text-red-400">*</span>
            </label>
            <select
              className={inputClasses}
              value={form.overallMatchRating}
              onChange={update("overallMatchRating")}
            >
              <option value="">Select rating...</option>
              {OVERALL_MATCH_RATING_VALUES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Promotion <span className="text-red-400">*</span>
            </label>
            <select
              className={inputClasses}
              value={form.promotionId}
              onChange={handlePromotionChange}
            >
              <option value="">Select promotion...</option>
              {promotions.map((promotion) => (
                <option key={promotion._id} value={promotion._id}>
                  {promotion.displayName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Promotion label (era){" "}
              <span className="text-gray-500">= promotionDisplayName</span>
            </label>
            <select
              className={inputClasses}
              value={form.promotionDisplayName}
              onChange={update("promotionDisplayName")}
              disabled={!selectedPromotion}
            >
              <option value="">Select label...</option>
              {labelOptions.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Show <span className="text-gray-500">(defaults to House Show)</span>
            </label>
            <input
              className={inputClasses}
              value={form.show}
              onChange={update("show")}
              placeholder="House Show"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Match title / type{" "}
              <span className="text-gray-500">(defaults to Singles Match)</span>
            </label>
            <input
              className={inputClasses}
              value={form.matchTitle}
              onChange={update("matchTitle")}
              placeholder="Singles Match"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Participants display <span className="text-red-400">*</span>
          </label>
          <input
            className={inputClasses}
            value={form.participantsDisplay}
            onChange={update("participantsDisplay")}
            placeholder="Ric Flair (c) vs. Harley Race"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Participants <span className="text-red-400">*</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            For each participant: pick the wrestler, the name they appeared
            under in this match (an alias if they used one), and their
            performance rating.
          </p>
          <div className="space-y-2">
            {participants.map((participant, index) => {
              const rowWrestler = wrestlers.find(
                (w) => w._id === participant.wrestlerId,
              )
              const nameOptions = rowWrestler
                ? [
                    rowWrestler.displayName,
                    ...rowWrestler.aliases.map((a) => a.display),
                  ]
                : []
              return (
                <div key={index} className="flex gap-2">
                  <select
                    className={inputClasses}
                    value={participant.wrestlerId}
                    onChange={updateParticipant(index, "wrestlerId")}
                  >
                    <option value="">Select wrestler...</option>
                    {wrestlers.map((wrestler) => (
                      <option key={wrestler._id} value={wrestler._id}>
                        {wrestler.displayName}
                      </option>
                    ))}
                  </select>
                  <select
                    className={inputClasses}
                    value={participant.displayName}
                    onChange={updateParticipant(index, "displayName")}
                    disabled={!rowWrestler}
                  >
                    <option value="">Shown as...</option>
                    {nameOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                  <select
                    className="bg-gray-900 border border-gray-700 rounded px-2 py-2 text-sm focus:outline-none focus:border-blue-500"
                    value={participant.performanceRating}
                    onChange={updateParticipant(index, "performanceRating")}
                  >
                    <option value="">No rating</option>
                    {Object.entries(PERFORMANCE_RATING_LABELS).map(
                      ([value, label]) => (
                        <option key={value} value={value}>
                          {value} - {label}
                        </option>
                      ),
                    )}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeParticipant(index)}
                    disabled={participants.length <= 2}
                    className="px-3 text-gray-400 hover:text-red-400 disabled:opacity-30 border border-gray-700 rounded"
                    aria-label="Remove participant"
                  >
                    x
                  </button>
                </div>
              )
            })}
          </div>
          <button
            type="button"
            onClick={addParticipant}
            className="mt-2 text-sm text-blue-400 hover:text-blue-300"
          >
            + Add participant
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Card URL <span className="text-gray-500">(optional)</span>
            </label>
            <input
              className={inputClasses}
              value={form.cardUrl}
              onChange={update("cardUrl")}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Extra info <span className="text-gray-500">(optional)</span>
            </label>
            <input
              className={inputClasses}
              value={form.extraInfo}
              onChange={update("extraInfo")}
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 border border-blue-600 rounded text-sm font-medium transition-colors"
        >
          {submitting ? "Creating..." : "Create match"}
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">{success}</p>}
      </form>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">
          Stored matches{" "}
          <span className="text-gray-500 text-base">({matches.length})</span>
        </h2>
        <button
          onClick={loadMatches}
          disabled={loading}
          className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      <div className="overflow-x-auto border border-gray-800 rounded">
        <table className="w-full text-sm">
          <thead className="bg-gray-900 text-gray-400 text-left">
            <tr>
              <th className="px-3 py-2 font-medium">Date</th>
              <th className="px-3 py-2 font-medium">Promotion</th>
              <th className="px-3 py-2 font-medium">Show</th>
              <th className="px-3 py-2 font-medium">Match</th>
              <th className="px-3 py-2 font-medium">Title</th>
              <th className="px-3 py-2 font-medium">Rating</th>
              <th className="px-3 py-2 font-medium">Participants</th>
            </tr>
          </thead>
          <tbody>
            {matches.map((match) => (
              <tr key={match._id} className="border-t border-gray-800">
                <td className="px-3 py-2 whitespace-nowrap">
                  {formatDate(match.date)}
                </td>
                <td className="px-3 py-2 text-gray-300">
                  {match.promotionDisplayName}
                </td>
                <td className="px-3 py-2 text-gray-400">{match.show}</td>
                <td className="px-3 py-2 text-gray-400">
                  {match.participantsDisplay}
                </td>
                <td className="px-3 py-2 text-gray-400">{match.matchTitle}</td>
                <td className="px-3 py-2 text-gray-300">
                  {match.overallMatchRating}
                </td>
                <td className="px-3 py-2 text-gray-400">
                  <div className="space-y-0.5">
                    {match.participants.map((p, i) => {
                      const canonical = wrestlerNameById.get(p.wrestlerId)
                      return (
                        <div key={i}>
                          <span className="text-gray-200">{p.displayName}</span>
                          {canonical && canonical !== p.displayName && (
                            <span className="text-gray-500">
                              {" "}
                              ({canonical})
                            </span>
                          )}
                          {p.performanceRating && (
                            <span className="text-gray-500">
                              {" "}
                              &middot; {p.performanceRating}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && matches.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  No matches yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function MatchesPage() {
  return (
    <ProtectedRoute>
      <Matches />
    </ProtectedRoute>
  )
}
