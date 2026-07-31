"use client"

import { useCallback, useEffect, useState } from "react"
import axios from "axios"
import { useAuth } from "@clerk/nextjs"
import ProtectedRoute from "@/components/Auth/ProtectedRoute"
import { createWrestler, getWrestlers, Wrestler } from "@/lib/api"

interface FormState {
  displayName: string
  aliases: string
  cagematchUrl: string
}

const EMPTY_FORM: FormState = {
  displayName: "",
  aliases: "",
  cagematchUrl: "",
}

const splitList = (raw: string): string[] =>
  raw
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)

const errorMessage = (err: unknown, fallback: string): string => {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message ?? err.message ?? fallback
  }
  return err instanceof Error ? err.message : fallback
}

const inputClasses =
  "w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:border-blue-500"

function Wrestlers() {
  const { getToken } = useAuth()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [wrestlers, setWrestlers] = useState<Wrestler[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const loadWrestlers = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await getWrestlers()
      setWrestlers(data)
    } catch (err) {
      setError(errorMessage(err, "Could not load wrestlers"))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadWrestlers()
  }, [loadWrestlers])

  const update =
    (field: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!form.displayName.trim()) {
      setError("Display name is required")
      return
    }

    setSubmitting(true)
    try {
      const created = await createWrestler(
        {
          displayName: form.displayName.trim(),
          aliases: splitList(form.aliases),
          cagematchUrl: form.cagematchUrl.trim() || undefined,
        },
        getToken,
      )
      setSuccess(`Created "${created.displayName}" (id ${created.id})`)
      setForm(EMPTY_FORM)
      await loadWrestlers()
    } catch (err) {
      setError(errorMessage(err, "Could not create wrestler"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold">Wrestlers</h1>
      <p className="text-gray-400 mt-1 mb-6 text-sm">
        Browse wrestlers and add new ones. Matches and career score stay at 0
        until matches are ingested and recomputed.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 bg-gray-900/50 border border-gray-800 rounded p-5 mb-8"
      >
        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Display name <span className="text-red-400">*</span>
          </label>
          <input
            className={inputClasses}
            value={form.displayName}
            onChange={update("displayName")}
            placeholder="Ric Flair"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Other names / aliases{" "}
            <span className="text-gray-500">(comma-separated)</span>
          </label>
          <input
            className={inputClasses}
            value={form.aliases}
            onChange={update("aliases")}
            placeholder="Nature Boy, Black Scorpion"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">
            Cagematch URL <span className="text-gray-500">(optional)</span>
          </label>
          <input
            className={inputClasses}
            value={form.cagematchUrl}
            onChange={update("cagematchUrl")}
            placeholder="https://www.cagematch.net/?id=2&nr=..."
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 border border-blue-600 rounded text-sm font-medium transition-colors"
        >
          {submitting ? "Creating..." : "Create wrestler"}
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-green-400">{success}</p>}
      </form>

      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">
          Stored wrestlers{" "}
          <span className="text-gray-500 text-base">({wrestlers.length})</span>
        </h2>
        <button
          onClick={loadWrestlers}
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
              <th className="px-3 py-2 font-medium">Display name</th>
              <th className="px-3 py-2 font-medium">name</th>
              <th className="px-3 py-2 font-medium">Aliases</th>
              <th className="px-3 py-2 font-medium">Cagematch</th>
              <th className="px-3 py-2 font-medium">Matches</th>
              <th className="px-3 py-2 font-medium">Career Score</th>
              <th className="px-3 py-2 font-medium">ID</th>
            </tr>
          </thead>
          <tbody>
            {wrestlers.map((wrestler) => (
              <tr key={wrestler._id} className="border-t border-gray-800">
                <td className="px-3 py-2">{wrestler.displayName}</td>
                <td className="px-3 py-2 text-gray-400">{wrestler.name}</td>
                <td className="px-3 py-2 text-gray-400">
                  {wrestler.aliases.map((alias) => alias.display).join(", ")}
                </td>
                <td className="px-3 py-2 text-gray-400">
                  {wrestler.cagematchUrl ? (
                    <a
                      href={wrestler.cagematchUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-400 hover:text-blue-300"
                    >
                      link
                    </a>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-3 py-2 text-gray-400">
                  {wrestler.totalMatches}
                </td>
                <td className="px-3 py-2 text-gray-400">
                  {wrestler.careerScore}
                </td>
                <td className="px-3 py-2 text-gray-500 font-mono text-xs">
                  {wrestler._id}
                </td>
              </tr>
            ))}
            {!loading && wrestlers.length === 0 && (
              <tr>
                <td colSpan={7} className="px-3 py-6 text-center text-gray-500">
                  No wrestlers yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function WrestlersPage() {
  return (
    <ProtectedRoute>
      <Wrestlers />
    </ProtectedRoute>
  )
}
