'use client'

import { useEffect, useRef, useState } from 'react'
import { useCountUp } from '@/lib/useCountUp'
import { STATS, MARQUEE_MAPEL } from '@/content/stats'

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
    <span ref={ref} className="font-pixel text-[22px] leading-none text-white sm:text-4xl md:text-5xl">
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
            {STATS.map((stat) => (
              <div key={stat.label} className="flex flex-col items-center px-4 text-center md:px-8">
                <span className="flex size-12 items-center justify-center rounded-full bg-[var(--musse-lime)] md:size-14">
                  <svg aria-hidden="true" className="size-5 md:size-6" fill="none" stroke="#111111" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
                    <path d={stat.icon} />
                  </svg>
                </span>
                <div className="mt-4">
                  <StatNumber value={stat.value} suffix={stat.suffix} />
                </div>
                <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 md:text-xs">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Marquee mapel */}
          <div className="marquee-paused relative mt-8 overflow-hidden md:mt-10" aria-hidden="true">
            <div className="marquee-track flex w-max gap-3">
              {[...MARQUEE_MAPEL, ...MARQUEE_MAPEL].map((mapel, i) => (
                <span key={i} className="whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-bold text-white/80">
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
