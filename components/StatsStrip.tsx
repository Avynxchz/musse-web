'use client'

import { useEffect, useRef, useState } from 'react'

const stats = [
  { value: 990, suffix: '+', label: 'soal TKA', icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z' },
  { value: 27, suffix: '', label: 'mapel SMA/SMK', icon: 'm12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5' },
  { value: 100, suffix: '+', label: 'pelajar mulai', icon: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75' },
]

const mapelChips = [
  'Matematika', 'Bahasa Indonesia', 'Bahasa Inggris', 'Fisika', 'Kimia', 'Biologi',
  'Ekonomi', 'Kewirausahaan', 'Mapel Kejuruan SMK',
]

function useCountUp(target: number, start: boolean, duration = 1200) {
  const [count, setCount] = useState(0)
  useEffect(() => {
    if (!start) return
    // Hormati prefers-reduced-motion: langsung final
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(target)
      return
    }
    let raf: number
    const t0 = performance.now()
    const tick = (now: number) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = 1 - Math.pow(1 - p, 3) // ease-out
      setCount(Math.round(target * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [start, target, duration])
  return count
}

function StatNumber({ value, suffix }: { value: number; suffix: string }) {
  const ref = useRef<HTMLSpanElement>(null)
  const [started, setStarted] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.4 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  const count = useCountUp(value, started)
  return (
    <span ref={ref} className="font-display text-[32px] font-bold leading-none text-white sm:text-6xl md:text-7xl">
      {count.toLocaleString('id-ID')}
      <span className="text-[var(--musse-lime)]">{suffix}</span>
    </span>
  )
}

export default function StatsStrip() {
  return (
    <section aria-label="Statistik musse" className="border-b border-[#111111] bg-[var(--musse-bg)]">
      <div className="mx-auto max-w-6xl px-5 py-10 md:py-16 lg:px-8">
        {/* Pita hitam premium */}
        <div className="relative overflow-hidden rounded-[28px] bg-[#111111] p-8 md:p-12">
          {/* Glow lime tipis di sudut */}
          <div className="pointer-events-none absolute -left-20 -top-20 size-64 rounded-full bg-[var(--musse-lime)]/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 -right-20 size-64 rounded-full bg-[var(--musse-lime)]/10 blur-3xl" aria-hidden="true" />

          <div className="relative grid grid-cols-3 divide-x divide-[rgba(255,255,255,0.12)]">
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center px-4 text-center md:px-8">
                <span className="flex size-12 items-center justify-center rounded-full bg-[var(--musse-lime)] md:size-14">
                  <svg aria-hidden="true" className="size-5 md:size-6" fill="none" stroke="#111111" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                    <path d={stat.icon} />
                  </svg>
                </span>
                <div className="mt-4">
                  <StatNumber value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="font-display mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 md:text-xs">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Marquee mapel */}
          <div className="marquee-paused relative mt-8 overflow-hidden md:mt-10" aria-hidden="true">
            <div className="marquee-track flex w-max gap-3">
              {[...mapelChips, ...mapelChips].map((mapel, i) => (
                <span key={i} className="font-display whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold text-white/80">
                  {mapel}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
