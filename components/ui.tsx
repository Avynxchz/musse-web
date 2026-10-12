import type { ReactNode } from 'react'

/**
 * Komponen UI bersama — dulunya pola className ini duplikat 6x
 * di Features, LoginReasons, Sections, LockedPreview.
 */

/** Badge lime kecil uppercase, misal: "Fitur inti", "3 langkah", "Coba dulu" */
export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block bg-[var(--musse-lime)] px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-[#10150b]">
      {children}
    </span>
  )
}

/** Header section standar: chip + judul + deskripsi opsional */
export function SectionHeader({
  chip,
  title,
  desc,
  maxWidth = 'max-w-2xl',
}: {
  chip: string
  title: ReactNode
  desc?: string
  maxWidth?: string
}) {
  return (
    <div className={maxWidth}>
      <Chip>{chip}</Chip>
      <h2 className="mt-4 text-3xl font-extrabold text-[var(--musse-text)] md:text-5xl">
        {title}
      </h2>
      {desc && (
        <p className="mt-4 text-[16px] leading-7 text-[var(--musse-muted)]">{desc}</p>
      )}
    </div>
  )
}
