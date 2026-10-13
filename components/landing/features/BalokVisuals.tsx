'use client'

import type { ReactNode } from 'react'
import { BALOK_ICON_PATHS } from '@/content/features'

/* Ikon Lucide buat balok (path dari content/features.ts). */
export function BalokIcon({ name, bg }: { name: string; bg: string }) {
  return (
    <span className={`flex size-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#111111] ${bg}`}>
      <svg aria-hidden="true" className="size-5" fill="none" stroke="#111111" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d={BALOK_ICON_PATHS[name]} />
      </svg>
    </span>
  )
}

/* ---------- Mini visual balok (maks ~96px, dekoratif) ---------- */

export function BMapel() {
  return (
    <div className="flex gap-1">
      {['MTK', 'FIS', 'KIM'].map((c) => (
        <span key={c} className="rounded-md border border-[#111111] bg-[var(--musse-lime)] px-1.5 py-0.5 text-[10px] font-bold text-[#111111]">
          {c}
        </span>
      ))}
    </div>
  )
}

export function BBenarSalah() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden="true">
      <span className="flex size-5 items-center justify-center rounded-full bg-green-500">
        <svg className="size-3" fill="none" stroke="#fff" strokeWidth="3.5" viewBox="0 0 24 24">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <span className="size-5 rounded-full border-[1.5px] border-[#111111] bg-white" />
    </div>
  )
}

export function BAutopsi({ dark }: { dark: boolean }) {
  const track = dark ? 'bg-white/20' : 'bg-[#111111]/10'
  return (
    <div className="w-20 space-y-1.5" aria-hidden="true">
      <div className={`h-2 overflow-hidden rounded-full ${track}`}>
        <div className="h-full w-[62%] rounded-full bg-red-500" />
      </div>
      <div className={`h-2 overflow-hidden rounded-full ${track}`}>
        <div className="h-full w-[35%] rounded-full bg-[#F97316]" />
      </div>
    </div>
  )
}

export function BProgres({ dark }: { dark: boolean }) {
  return (
    <svg aria-hidden="true" className="h-8 w-20" viewBox="0 0 80 32" fill="none">
      <polyline
        points="2,28 16,24 30,26 44,18 58,20 72,8 78,5"
        stroke={dark ? '#818CF8' : '#4F46E5'}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="78" cy="5" r="3.5" fill="#B6FF00" stroke="#111111" strokeWidth="1.5" />
    </svg>
  )
}

export function BMisi({ dark }: { dark: boolean }) {
  const items = [true, true, false]
  return (
    <div className="space-y-1" aria-hidden="true">
      {items.map((done, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className={`flex size-3.5 items-center justify-center rounded border border-[#111111] ${done ? 'bg-[var(--musse-lime)]' : dark ? 'bg-transparent' : 'bg-white'}`}>
            {done && (
              <svg className="size-2.5" fill="none" stroke="#111111" strokeWidth="3.5" viewBox="0 0 24 24">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </span>
          <span className={`h-1.5 rounded-full ${dark ? 'bg-white/25' : 'bg-[#111111]/15'}`} style={{ width: 28 - i * 6 }} />
        </div>
      ))}
    </div>
  )
}

export function BTryout({ dark }: { dark: boolean }) {
  return (
    <p className={`font-mono text-lg font-bold tracking-widest ${dark ? 'text-white' : 'text-[#111111]'}`}>
      59:59
    </p>
  )
}

export function BStreak() {
  return (
    <div className="flex gap-1" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="size-3 rounded-full border border-[#111111] bg-[#F97316]" />
      ))}
    </div>
  )
}

export function BCountdown({ dark }: { dark: boolean }) {
  return (
    <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-[#111111]'}`}>
      14 <span className={`text-xs font-medium ${dark ? 'text-white/60' : 'text-[var(--musse-muted)]'}`}>hari</span>
    </p>
  )
}

export function BMode() {
  return (
    <div className="flex w-20 rounded-full border-[1.5px] border-[#111111] bg-white p-0.5 text-[10px] font-bold" aria-hidden="true">
      <span className="flex-1 rounded-full bg-[#111111] px-1 py-0.5 text-center text-white">Lthn</span>
      <span className="flex-1 px-1 py-0.5 text-center text-[var(--musse-muted)]">Sim</span>
    </div>
  )
}

/* Mapping key data → komponen mini visual. */
export const BALOK_MINIS: Record<string, (dark: boolean) => ReactNode> = {
  mapel: () => <BMapel />,
  'benar-salah': () => <BBenarSalah />,
  autopsi: (d) => <BAutopsi dark={d} />,
  progres: (d) => <BProgres dark={d} />,
  misi: (d) => <BMisi dark={d} />,
  tryout: (d) => <BTryout dark={d} />,
  streak: () => <BStreak />,
  countdown: (d) => <BCountdown dark={d} />,
  mode: () => <BMode />,
}
