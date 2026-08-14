"use client"

import { useEffect, useRef } from "react"

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  /** Optional secondary line under the title. */
  subtitle?: string
  children: React.ReactNode
}

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Escape closes, and the body is locked so the page behind the backdrop
  // doesn't scroll under the modal.
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose()
    }

    document.addEventListener("keydown", handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [open, onClose])

  // Move focus into the panel on open so keyboard users land inside the
  // dialog rather than back at the top of the page.
  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 sm:items-center"
      // Only a click that both starts and ends on the backdrop closes the
      // modal; onClick alone would also fire when a drag-select inside the
      // panel happens to release over the backdrop.
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="w-full max-w-lg rounded border border-gray-700 bg-gray-950 shadow-xl focus:outline-none"
      >
        <div className="flex items-start justify-between gap-4 border-b border-gray-800 px-5 py-4">
          <div>
            <h2 className="font-semibold text-gray-100">{title}</h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-mr-1 -mt-1 rounded px-2 py-1 text-gray-500 hover:text-gray-200"
          >
            &times;
          </button>
        </div>

        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
