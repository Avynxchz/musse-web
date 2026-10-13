'use client'

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Chip } from './ui'
import { useLoopAnimation } from '@/lib/useLoopAnimation'
import { useGoogleLogin } from '@/lib/useGoogleLogin'

/* Skenario: 9 detik aksi + 1.5 detik jeda = loop 10 detik */
const TL_DEMO: [number, number][] = [
  [0, 1], // kartu soal spring-in + opsi stagger
  [1800, 2], // kursor meluncur ke opsi B
  [2600, 3], // klik: ripple, B jadi lime + centang, badge "Benar!", confetti
  [3800, 4], // panel chat slide-up + user mengetik
  [5000, 5], // indikator mengetik
  [5800, 6], // balasan AI + langkah pembahasan
  [7000, 7], // chip streak pop
  [8500, 8], // fade out semua
]
const LOOP_DEMO = 10000

const OPTIONS = [
  { key: 'A', text: 'Rp4.000' },
  { key: 'B', text: 'Rp5.000' },
  { key: 'C', text: 'Rp6.000' },
  { key: 'D', text: 'Rp7.000' },
  { key: 'E', text: 'Rp8.000' },
]

const LANGKAH = [
  '3b + 2p = 21.000',
  '2b + 3p = 19.000',
  'Eliminasi → b = Rp5.000',
]

const CONFETTI: { dx: string; dy: string; c: string; d: number }[] = [
  { dx: '-48px', dy: '-32px', c: '#B6FF00', d: 0 },
  { dx: '42px', dy: '-38px', c: '#4F46E5', d: 0.05 },
  { dx: '-62px', dy: '8px', c: '#F97316', d: 0.1 },
  { dx: '58px', dy: '4px', c: '#0EA5E9', d: 0.08 },
  { dx: '-30px', dy: '-54px', c: '#F97316', d: 0.12 },
  { dx: '26px', dy: '-60px', c: '#B6FF00', d: 0.03 },
  { dx: '-54px', dy: '32px', c: '#0EA5E9', d: 0.15 },
  { dx: '50px', dy: '28px', c: '#4F46E5', d: 0.07 },
]

const POINTS = [
  'Jawab soal, langsung tahu benar atau salah.',
  'Tiap soal ada pembahasan langkah demi langkah.',
  'Masih bingung? Tanya AI yang paham konteks soalmu.',
]

/* Elemen muncul dengan pop; null saat sembunyi */
function Appear({
  show,
  animKey,
  anim = 'anim-pop',
  delay = 0,
  className = '',
  children,
}: {
  show: boolean
  animKey: string
  anim?: string
  delay?: number
  className?: string
  children: ReactNode
}) {
  if (!show) return null
  return (
    <div
      key={animKey}
      className={`${anim} ${className}`}
      style={delay ? { animationDelay: `${delay}s` } : undefined}
    >
      {children}
    </div>
  )
}

/* Efek mengetik huruf per huruf */
function TypewriterText({
  text,
  active,
  cycleKey,
  instant,
  speed = 42,
}: {
  text: string
  active: boolean
  cycleKey: number
  instant: boolean
  speed?: number
}) {
  const [n, setN] = useState(0)

  useEffect(() => {
    if (!active || instant) return
    setN(0)
    const t = setInterval(() => {
      setN((v) => {
        if (v >= text.length) {
          clearInterval(t)
          return v
        }
        return v + 1
      })
    }, speed)
    return () => clearInterval(t)
  }, [active, cycleKey, instant, text, speed])

  useEffect(() => {
    if (!active) setN(0)
  }, [active])

  const shown = instant ? text : text.slice(0, n)
  return (
    <>
      {shown}
      {active && !instant && n < text.length && <span className="animate-pulse">▊</span>}
    </>
  )
}

function GoogleG() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 shrink-0">
      <path fill="#4285F4" d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.6 2.8c2.3-2.1 3.8-5.2 3.8-8.6z" />
      <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-3.6 2.8C3.5 21.3 7.4 24 12 24z" />
      <path fill="#FBBC05" d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4L1.6 6.8C.6 8.6 0 10.2 0 12s.6 3.4 1.6 4.9l3.6-2.5z" />
      <path fill="#EA4335" d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.4 0 3.5 2.7 1.6 6.8l3.6 2.8c1-2.9 3.7-4.9 6.8-4.9z" />
    </svg>
  )
}

export default function DemoAnimasi() {
  const { step, cycle, wrapRef } = useLoopAnimation(TL_DEMO, LOOP_DEMO)
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )
  const s = reduced ? 7 : step // frame statis akhir untuk reduced-motion
  const handleLogin = useGoogleLogin()
  const answered = s >= 3

  return (
    <section id="demo" className="border-b border-[#111111] bg-[var(--musse-section)]">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:py-24 lg:grid-cols-2">
        {/* Kiri: panggung animasi */}
        <div className="rounded-2xl border-[1.5px] border-[#111111] bg-white shadow-[0_4px_0_#111111]">
          {/* Bar jendela */}
          <div className="flex h-10 items-center gap-1.5 border-b-[1.5px] border-[#111111] bg-[#F7F7F9] px-4">
            <span className="size-3 rounded-full border border-[#111111] bg-[#FF5F57]" />
            <span className="size-3 rounded-full border border-[#111111] bg-[#FEBC2E]" />
            <span className="size-3 rounded-full border border-[#111111] bg-[#28C840]" />
            <span className="ml-2 text-xs font-bold text-[var(--musse-muted)]">musse — latihan soal</span>
          </div>

          {/* Viewport animasi */}
          <div ref={wrapRef} className="relative h-[420px] overflow-hidden bg-[var(--musse-bg)] lg:h-[460px]">
            <div className={`absolute inset-0 transition-opacity duration-500 ${s === 8 ? 'opacity-0' : 'opacity-100'}`}>
              {/* Chip streak */}
              {s >= 7 && (
                <div className="absolute right-3 top-3 z-20 flex gap-2">
                  <span key={`st1-${cycle}`} className="anim-pop rounded-full border-[1.5px] border-[#111111] bg-white px-2.5 py-1 text-[11px] font-bold text-[#111111]">
                    🔥 Streak 14 hari
                  </span>
                  <span key={`st2-${cycle}`} className="anim-pop rounded-full border-[1.5px] border-[#111111] bg-[var(--musse-lime)] px-2.5 py-1 text-[11px] font-bold text-[#111111]" style={{ animationDelay: '0.2s' }}>
                    +1 soal selesai
                  </span>
                </div>
              )}

              {/* Kartu soal */}
              {s >= 1 && (
                <div key={`q-${cycle}`} className="anim-spring absolute left-3 right-3 top-12">
                  <div className="relative rounded-2xl border-[1.5px] border-[#111111] bg-white p-3 shadow-[0_4px_0_#111111]">
                    <span className="inline-block rounded-full border border-[#111111] bg-[#E0E7FF] px-2.5 py-0.5 text-[11px] font-bold text-[#111111]">
                      Soal 12/46 · Matematika
                    </span>
                    <p className="mt-2 text-[13px] font-medium leading-5 text-[#111111]">
                      Harga 3 buku tulis dan 2 penggaris Rp21.000. Harga 2 buku tulis dan 3 penggaris
                      Rp19.000. Harga 1 buku tulis adalah …
                    </p>

                    <div className="mt-2.5 space-y-1.5">
                      {OPTIONS.map((o, i) => {
                        const isB = o.key === 'B'
                        const correct = answered && isB
                        return (
                          <Appear
                            key={o.key}
                            show
                            animKey={`opt-${cycle}-${o.key}`}
                            delay={i * 0.12}
                          >
                            <div
                              className={`relative flex items-center gap-2 rounded-xl border-[1.5px] px-3 py-1.5 text-[13px] ${
                                correct
                                  ? 'border-[#111111] bg-[var(--musse-lime)] font-bold text-[#111111]'
                                  : 'border-[#111111]/20 bg-white text-[var(--musse-text)]'
                              }`}
                            >
                              <span className="font-bold">{o.key}.</span> {o.text}
                              {correct && (
                                <svg aria-hidden="true" className="ml-auto size-4 shrink-0" fill="none" stroke="#111111" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" viewBox="0 0 24 24">
                                  <path d="M20 6 9 17l-5-5" />
                                </svg>
                              )}
                              {/* Kursor: sudah dirender sejak awal (tak terlihat), meluncur saat step 2 */}
                              {isB && (
                                <svg
                                  aria-hidden="true"
                                  viewBox="0 0 24 24"
                                  className="pointer-events-none absolute right-2 top-1/2 z-10 size-6 -translate-y-1/2 transition-all duration-700 ease-out"
                                  style={{
                                    translate: s >= 2 ? '0 0' : '90px 70px',
                                    opacity: s >= 2 ? 1 : 0,
                                  }}
                                >
                                  <path d="M6 3l13 8.5-7 1.5-2.5 7z" fill="#111111" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" />
                                </svg>
                              )}
                              {/* Ripple saat klik */}
                              {isB && answered && (
                                <span
                                  key={`rip-${cycle}`}
                                  aria-hidden="true"
                                  className="anim-ripple pointer-events-none absolute right-4 top-1/2 z-10 block size-4 rounded-full border-[2.5px] border-[#111111]"
                                />
                              )}
                            </div>
                          </Appear>
                        )
                      })}
                    </div>

                    {/* Badge Benar! */}
                    {answered && (
                      <div
                        key={`bnr-${cycle}`}
                        className="anim-pop absolute -top-3 right-6 z-20 rotate-6 rounded-full border-[1.5px] border-[#111111] bg-[var(--musse-lime)] px-3 py-1 text-xs font-extrabold text-[#111111]"
                      >
                        Benar! ✓
                      </div>
                    )}

                    {/* Confetti */}
                    {answered && (
                      <div key={`cf-${cycle}`} aria-hidden="true" className="pointer-events-none absolute right-10 top-0 z-20">
                        {CONFETTI.map((p, i) => (
                          <span
                            key={i}
                            className="anim-confetti absolute size-2 rounded-[2px]"
                            style={{ backgroundColor: p.c, animationDelay: `${p.d}s`, '--dx': p.dx, '--dy': p.dy } as CSSProperties}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Panel chat AI */}
              <div
                className={`absolute inset-x-3 bottom-3 z-10 transition-all duration-700 ${
                  s >= 4 ? 'translate-y-0 opacity-100' : 'translate-y-[115%] opacity-0'
                }`}
              >
                <div className="rounded-2xl border-[1.5px] border-[#111111] bg-white p-3 shadow-[0_4px_0_#111111]">
                  <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#4F46E5]">
                    ✨ Tanya AI
                  </p>
                  <div className="mt-2 flex justify-end">
                    <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-[#111111] px-3 py-2 text-[13px] text-white">
                      <TypewriterText text="Kenapa jawabannya B?" active={s >= 4} cycleKey={cycle} instant={reduced} />
                    </p>
                  </div>
                  {s === 5 && (
                    <div className="mt-2 flex items-center gap-1 pl-1" aria-hidden="true">
                      <span className="size-1.5 animate-bounce rounded-full bg-[#111111]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-[#111111] [animation-delay:0.15s]" />
                      <span className="size-1.5 animate-bounce rounded-full bg-[#111111] [animation-delay:0.3s]" />
                    </div>
                  )}
                  {s >= 6 && (
                    <div key={`ai-${cycle}`}>
                      <div className="anim-pop mt-2 flex justify-start">
                        <p className="max-w-[92%] rounded-2xl rounded-bl-sm border-[1.5px] border-[#111111] bg-[#F0FFB8] px-3 py-2 text-[13px] text-[#111111]">
                          Karena x = 5 memenuhi kedua persamaan linear itu.
                        </p>
                      </div>
                      <div className="mt-2 space-y-1">
                        {LANGKAH.map((l, i) => (
                          <p
                            key={`${cycle}-${i}`}
                            className="anim-pop text-[13px] text-[var(--musse-text)]"
                            style={{ animationDelay: `${0.25 + i * 0.2}s` }}
                          >
                            <span className="font-bold text-[#4F46E5]">Langkah {i + 1}.</span> {l}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Kanan: teks + CTA */}
        <div>
          <Chip>Lihat cara kerjanya</Chip>
          <h2 className="mt-4 text-3xl font-extrabold text-[var(--musse-text)] md:text-4xl">
            Jawab soal, lihat benar/salahnya, tanya AI kalau bingung.
          </h2>
          <ul className="mt-6 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3">
                <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--musse-lime)]">
                  <svg aria-hidden="true" className="size-3.5" fill="none" stroke="#111111" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
                <span className="text-[15px] leading-6 text-[var(--musse-text)]">{p}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={handleLogin}
            className="mt-7 inline-flex items-center gap-2.5 rounded-full border-[1.5px] border-[#111111] bg-[var(--musse-lime)] px-6 py-3.5 text-[15px] font-extrabold text-[#10150b] shadow-[0_4px_0_#111111] transition-transform hover:-translate-y-0.5"
          >
            <GoogleG />
            Masuk dengan Google untuk coba semua soal
          </button>
          <p className="mt-3 text-sm text-[var(--musse-muted)]">10 detik, tanpa password.</p>
        </div>
      </div>
    </section>
  )
}
