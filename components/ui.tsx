import type { ReactNode } from 'react'

/**
 * Komponen UI bersama — dulunya pola className ini duplikat
 * di Features, LoginReasons, dan Sections.
 */

/** Badge lime kecil uppercase, misal: "Fitur inti", "3 langkah", "Coba dulu" */
export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block bg-[var(--musse-lime)] px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-[#10150b]">
      {children}
    </span>
  )
}

/** Ikon centang — dulunya duplikat di Features, DemoAnimasi (2x). */
export function CheckIcon({
  className = 'size-3.5',
  strokeWidth = 3,
}: {
  className?: string
  strokeWidth?: number
}) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      stroke="#111111"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={strokeWidth}
      viewBox="0 0 24 24"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  )
}
