'use client'

import { useEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react'
import { Chip, CheckIcon } from './ui'
import { useLoopAnimation } from '@/lib/useLoopAnimation'
import { useGoogleLogin } from '@/lib/useGoogleLogin'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { useStageScale } from '@/lib/useStageScale'
import { useCursor, type CursorState } from '@/lib/useCursor'
import {
  CONFETTI,
  DESIGN_W,
  FINAL_STEP,
  LANGKAH,
  LOOP_DEMO,
  OPTIONS,
  POINTS,
  STAGE_H,
  TL_DEMO,
} from '@/lib/demo-content'

/* ── Ikon & primitif kecil ─────────────────────────────────────────── */

/* Jeda berurutan antar opsi jawaban (detik) dan antar partikel confetti. */
const OPTION_STAGGER = 0.08
const CONFETTI_STAGGER = 0.02

/* Elemen muncul dengan animasi. key+cycle mengulang animasi tiap loop. */
function Appear({
  animKey,
  anim = 'anim-rise-8',
  delay = 0,
  className = '',
  children,
}: {
  animKey: string
  anim?: string
  delay?: number
  className?: string
  children: ReactNode
}) {
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

/* Efek mengetik huruf per huruf; reset otomatis saat unmount. */
function TypewriterText({
  text,
  active,
  instant,
  speed = 42,
}: {
  text: string
  active: boolean
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
  }, [active, instant, text, speed])

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

/* ── Hook kecil ────────────────────────────────────────────────────── */

/*
 * Saat pertama dimuat soal langsung terlihat (tidak mulai dari kosong):
 * step 0 dianggap 1 sampai timeline berjalan sekali.
 */
function useFirstVisibleStep(step: number) {
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (step >= 1) setShown(true)
  }, [step])
  return step === 0 ? (shown ? 0 : 1) : step
}

/* ── Sub-komponen panggung ─────────────────────────────────────────── */

type StageProps = {
  rs: number
  cycle: number
  reduced: boolean
}

type CardProps = {
  rs: number
  cycle: number
  collapsed: boolean
  optBRef: RefObject<HTMLDivElement | null>
}

function OptionRow({ opt, index, rs, cycle, optBRef }: {
  opt: (typeof OPTIONS)[number]
  index: number
  rs: number
  cycle: number
  optBRef: RefObject<HTMLDivElement | null>
}) {
  const isB = opt.key === 'B'
  const bCls =
    rs >= 4 && isB
      ? 'border-[#111111] bg-[var(--musse-lime)]'
      : rs === 3 && isB
        ? 'border-[2.5px] border-[#111111] bg-[#F7F7F9]'
        : 'border-[#111111]/25 bg-white'
  return (
    <Appear key={opt.key} animKey={`opt-${cycle}-${opt.key}`} anim="anim-rise-10" delay={index * OPTION_STAGGER}>
      <div
        ref={isB ? optBRef : undefined}
        className={`flex items-center gap-2 rounded-xl border-[1.5px] px-3 py-1.5 text-sm ${bCls}`}
      >
        <span className="shrink-0 font-bold text-[#111111]">{opt.key}.</span>
        <span className="min-w-0 flex-1 truncate text-[#111111]">{opt.text}</span>
        {rs >= 4 && isB && <CheckIcon className="size-4 shrink-0" />}
      </div>
    </Appear>
  )
}

/* Kartu soal — elemen yang SAMA mengecil jadi baris ringkasan (morph, bukan swap). */
function SoalCard({ rs, cycle, collapsed, optBRef }: CardProps) {
  return (
    <>
      {rs >= 1 && (
        <div key={`card-${cycle}`} className="anim-spring relative rounded-2xl border-[1.5px] border-[#111111] bg-white p-3 shadow-[0_4px_0_#111111]">
          {/* Isi penuh: tinggi + opacity dianimasikan, bukan di-swap */}
          <div
            className={`grid transition-all duration-500 ease-in-out ${
              collapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
            }`}
          >
            <div className="overflow-hidden">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-block rounded-full border border-[#111111] bg-[#E0E7FF] px-2.5 py-0.5 text-[11px] font-bold text-[#111111]">
                  Soal 12/46 · Matematika
                </span>
                {rs === 4 && (
                  <span key={`bdg-${cycle}`} className="anim-pop rounded-full border-[1.5px] border-[#111111] bg-[var(--musse-lime)] px-3 py-0.5 text-xs font-extrabold text-[#111111]">
                    Benar! ✓
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm font-medium leading-5 text-[#111111]">
                Harga 3 buku tulis dan 2 penggaris Rp21.000. Harga 2 buku tulis dan 3 penggaris
                Rp19.000. Harga 1 buku tulis adalah …
              </p>
              <div className="mt-2.5 space-y-1.5">
                {OPTIONS.map((o, i) => (
                  <OptionRow key={o.key} opt={o} index={i} rs={rs} cycle={cycle} optBRef={optBRef} />
                ))}
              </div>
            </div>
          </div>

          {/* Baris ringkasan — di dalam kartu yang sama */}
          <div
            className={`grid transition-all duration-500 ease-in-out ${
              collapsed ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
            }`}
          >
            <div className="overflow-hidden">
              <div className="flex items-center gap-2 py-1">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#111111] bg-[var(--musse-lime)]">
                  <CheckIcon />
                </span>
                <p className="truncate text-sm font-bold text-[#111111]">Soal 12/46 · B. Rp5.000</p>
                <span className="ml-auto shrink-0 rounded-full border-[1.5px] border-[#111111] bg-[var(--musse-lime)] px-2.5 py-0.5 text-[11px] font-extrabold text-[#111111]">
                  Benar!
                </span>
              </div>
            </div>
          </div>

          {/* Confetti memancar dari badge */}
          {rs === 4 && (
            <div aria-hidden="true" className="pointer-events-none absolute right-8 top-6 z-20">
              {CONFETTI.map((p, i) => (
                <span
                  key={`${cycle}-${i}`}
                  className="anim-confetti absolute rounded-[2px]"
                  style={
                    {
                      width: p.size,
                      height: p.size,
                      backgroundColor: p.c,
                      animationDelay: `${i * CONFETTI_STAGGER}s`,
                      '--dx': `${p.dx}px`,
                      '--dy': `${p.dy}px`,
                    } as CSSProperties
                  }
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  )
}

/* Baris chip — ruang dicadangkan sejak awal agar layout tidak melompat. */
function ChipRow({ rs, cycle }: { rs: number; cycle: number }) {
  return (
    <div className="flex min-h-[32px] items-center justify-end gap-2">
      {rs >= 12 && (
        <>
          <Appear animKey={`c1-${cycle}`}>
            <span className="inline-block rounded-full border-[1.5px] border-[#111111] bg-white px-2.5 py-1 text-xs font-bold text-[#111111]">
              🔥 Streak 14 hari
            </span>
          </Appear>
          <Appear animKey={`c2-${cycle}`} delay={0.15}>
            <span className="inline-block rounded-full border-[1.5px] border-[#111111] bg-[var(--musse-lime)] px-2.5 py-1 text-xs font-bold text-[#111111]">
              +1 soal selesai
            </span>
          </Appear>
        </>
      )}
    </div>
  )
}

/* Panel chat — tinggi dicadangkan, pesan ditambahkan ke bawah. */
function ChatPanel({ rs, cycle, reduced }: { rs: number; cycle: number; reduced: boolean }) {
  return (
    <div className="h-[230px] overflow-hidden rounded-2xl border-[1.5px] border-[#111111] bg-white p-3">
      <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#4F46E5]">
        ✨ Tanya AI
      </p>
      <div className="mt-2 space-y-2">
        {rs >= 6 && (
          <Appear animKey={`uq-${cycle}`} anim="anim-rise-8">
            <div className="flex justify-end">
              <p className="min-w-0 max-w-[85%] break-words rounded-2xl rounded-br-sm bg-[#111111] px-3 py-2 text-sm text-white">
                <TypewriterText text="Kenapa jawabannya B?" active instant={reduced} />
              </p>
            </div>
          </Appear>
        )}
        {rs === 7 && (
          <div className="flex items-center gap-1 pl-1" aria-hidden="true">
            <span className="size-1.5 animate-bounce rounded-full bg-[#111111]" />
            <span className="size-1.5 animate-bounce rounded-full bg-[#111111] [animation-delay:0.15s]" />
            <span className="size-1.5 animate-bounce rounded-full bg-[#111111] [animation-delay:0.3s]" />
          </div>
        )}
        {rs >= 8 && (
          <Appear animKey={`aq-${cycle}`} anim="anim-rise-8">
            <div className="flex justify-start">
              <p className="min-w-0 max-w-[92%] break-words rounded-2xl rounded-bl-sm border-[1.5px] border-[#111111] bg-[#F0FFB8] px-3 py-2 text-sm text-[#111111]">
                Karena x = 5 memenuhi kedua persamaan linear itu.
              </p>
            </div>
          </Appear>
        )}
        {LANGKAH.map(
          (teks, i) =>
            rs >= 9 + i && (
              <Appear key={`l${i + 1}`} animKey={`l${i + 1}-${cycle}`} anim="anim-rise-8">
                <p className="min-w-0 break-words text-sm text-[var(--musse-text)]">
                  <span className="font-bold text-[#4F46E5]">Langkah {i + 1}.</span> {teks}
                </p>
              </Appear>
            )
        )}
      </div>
    </div>
  )
}

/* Kursor SVG + ripple di titik klik. */
function CursorLayer({ cursor, rs }: { cursor: CursorState; rs: number }) {
  return (
    <>
      {cursor.ready && (rs === 2 || rs === 3 || rs === 4) && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-0 top-0 z-30"
          style={{
            transform: `translate(${cursor.x}px, ${cursor.y}px)`,
            opacity: cursor.opacity,
            transition: cursor.snap ? 'none' : 'transform 0.9s ease-in-out, opacity 0.25s ease',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            className="size-7"
            style={{
              transform: `translate(-6px, -4px) scale(${cursor.press ? 0.9 : 1})`,
              transition: 'transform 0.2s ease',
              filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.25))',
            }}
          >
            <path d="M6 3l13 8.5-7 1.5-2.5 7z" fill="#111111" stroke="#ffffff" strokeWidth="1.5" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      {rs === 4 && (
        <span
          key="ripple"
          aria-hidden="true"
          className="anim-ripple pointer-events-none absolute z-30 size-5 rounded-full border-[2.5px] border-[#111111]"
          style={{ left: cursor.x, top: cursor.y }}
        />
      )}
    </>
  )
}

/* Seluruh panggung kiri: bar jendela + viewport animasi. */
function DemoStage({
  rs,
  cycle,
  collapsed,
  reduced,
  wrapRef,
  containerRef,
  scale,
  innerRef,
  optBRef,
  cursor,
}: StageProps & {
  collapsed: boolean
  wrapRef: RefObject<HTMLDivElement | null>
  containerRef: RefObject<HTMLDivElement | null>
  scale: number
  innerRef: RefObject<HTMLDivElement | null>
  optBRef: RefObject<HTMLDivElement | null>
  cursor: CursorState
}) {
  return (
    <div className="overflow-hidden rounded-2xl border-[1.5px] border-[#111111] bg-white shadow-[0_4px_0_#111111]">
      {/* Bar jendela */}
      <div className="flex h-10 items-center gap-1.5 border-b-[1.5px] border-[#111111] bg-[#F7F7F9] px-4">
        <span className="size-3 rounded-full border border-[#111111] bg-[#FF5F57]" />
        <span className="size-3 rounded-full border border-[#111111] bg-[#FEBC2E]" />
        <span className="size-3 rounded-full border border-[#111111] bg-[#28C840]" />
        <span className="ml-2 text-xs font-bold text-[var(--musse-muted)]">musse — latihan soal</span>
      </div>

      {/* Viewport: tinggi tetap, alur vertikal dari atas */}
      <div ref={containerRef} className="relative w-full overflow-hidden" style={{ height: STAGE_H * scale }}>
        <div
          ref={innerRef}
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: DESIGN_W, transform: `scale(${scale})` }}
        >
          <div ref={wrapRef} className={`p-4 transition-opacity duration-[400ms] ${rs === 13 ? 'opacity-0' : 'opacity-100'}`}>
            <div className="space-y-3">
              <SoalCard rs={rs} cycle={cycle} collapsed={collapsed} optBRef={optBRef} />
              <ChipRow rs={rs} cycle={cycle} />
              <ChatPanel rs={rs} cycle={cycle} reduced={reduced} />
            </div>
          </div>
          <CursorLayer cursor={cursor} rs={rs} />
        </div>
      </div>
    </div>
  )
}

/* Kolom kanan: teks + CTA. */
function DemoInfo({ onLogin }: { onLogin: () => void }) {
  return (
    <div>
      <Chip>Lihat cara kerjanya</Chip>
      <h2 className="mt-4 text-3xl font-extrabold text-[var(--musse-text)] md:text-4xl">
        Jawab soal, lihat benar/salahnya, tanya AI kalau bingung.
      </h2>
      <ul className="mt-6 space-y-3">
        {POINTS.map((p) => (
          <li key={p} className="flex items-start gap-3">
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-[var(--musse-lime)]">
              <CheckIcon strokeWidth={2.5} />
            </span>
            <span className="text-[15px] leading-6 text-[var(--musse-text)]">{p}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onLogin}
        className="mt-7 inline-flex items-center gap-2.5 rounded-full border-[1.5px] border-[#111111] bg-[var(--musse-lime)] px-6 py-3.5 text-[15px] font-extrabold text-[#10150b] shadow-[0_4px_0_#111111] transition-transform hover:-translate-y-0.5"
      >
        <GoogleG />
        Masuk dengan Google untuk coba semua soal
      </button>
      <p className="mt-3 text-sm text-[var(--musse-muted)]">10 detik, tanpa password.</p>
    </div>
  )
}

/* ── Komponen utama ────────────────────────────────────────────────── */

export default function DemoAnimasi() {
  const { step, cycle, wrapRef } = useLoopAnimation(TL_DEMO, LOOP_DEMO)
  const reduced = useReducedMotion()
  const s = useFirstVisibleStep(step)
  const rs = reduced ? FINAL_STEP : s // frame statis akhir untuk reduced-motion
  const handleLogin = useGoogleLogin()
  const { containerRef, scale } = useStageScale()
  const innerRef = useRef<HTMLDivElement>(null)
  const optBRef = useRef<HTMLDivElement>(null)
  const cursor = useCursor(innerRef, optBRef, rs)
  const collapsed = rs >= 5

  return (
    <section id="demo" className="border-b border-[#111111] bg-[var(--musse-section)]">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:py-24 lg:grid-cols-2">
        <DemoStage
          rs={rs}
          cycle={cycle}
          collapsed={collapsed}
          reduced={reduced}
          wrapRef={wrapRef}
          containerRef={containerRef}
          scale={scale}
          innerRef={innerRef}
          optBRef={optBRef}
          cursor={cursor}
        />
        <DemoInfo onLogin={handleLogin} />
      </div>
    </section>
  )
}
