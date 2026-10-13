'use client'

import { useGoogleLogin } from '@/lib/useGoogleLogin'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { useEffect, useRef, useState } from 'react'
import StatsStrip from './StatsStrip'

const avatars = ['A', 'R', 'N', 'F', 'D']
const MAPEL = ['MTK', 'FIS', 'KIM', 'BIO', 'IND']
const OPTIONS = [
  { k: 'A', v: 'Rp19.000', sel: false },
  { k: 'B', v: 'Rp23.000', sel: true },
  { k: 'C', v: 'Rp25.000', sel: false },
]

/* HP besar — desain dikembalikan seperti hero lama; kartu pembahasan slide-in loop 6 detik. */
function BigPhone() {
  return (
    <div className="relative w-[230px] shrink-0 rounded-[2rem] border-[7px] border-[#252b3b] bg-[#f8fafc] p-1 shadow-[0_24px_60px_rgba(0,0,0,0.45)] sm:w-[280px]">
      {/* notch */}
      <div className="absolute left-1/2 top-0 z-10 h-5 w-20 -translate-x-1/2 rounded-b-xl bg-[#252b3b]" />
      <div className="overflow-hidden rounded-[1.45rem]">
        <div className="bg-[#f8fafc] text-slate-900">
          <div className="flex justify-between px-4 pb-3 pt-6 text-[9px] font-bold">
            <span>09:41</span>
            <span className="text-slate-400">musse</span>
          </div>
          <div className="border-b border-slate-200 px-4 pb-3">
            <div className="flex justify-between text-[10px] font-bold">
              <span>Matematika</span>
              <span className="text-indigo-600">12 / 46</span>
            </div>
            <div className="mt-2 h-1 rounded bg-slate-200">
              <div className="h-1 w-1/4 rounded bg-indigo-600" />
            </div>
          </div>
          <div className="px-4 py-4">
            <p className="text-[9px] font-bold text-slate-400">SOAL 12</p>
            <p className="mt-2 text-[11px] font-semibold leading-relaxed">
              Harga 3 buku dan 2 penggaris Rp18.000. Harga 2 buku dan 5 penggaris adalah...
            </p>
            <div className="mt-4 flex flex-col gap-2">
              {OPTIONS.map((o) => (
                <div
                  key={o.k}
                  className={`rounded-lg border px-3 py-2 text-[10px] ${
                    o.sel ? 'border-indigo-600 bg-indigo-50 font-bold' : 'border-slate-200'
                  }`}
                >
                  <span className="mr-2 text-slate-400">{o.k}</span>
                  {o.v}
                  {o.sel && <span className="float-right text-indigo-600">✓</span>}
                </div>
              ))}
            </div>
            {/* Kartu pembahasan: selalu di layout (tanpa layout shift), animasi slide-in dari bawah */}
            <div className="phone-card-loop mt-4 rounded-xl bg-indigo-50 p-3">
              <p className="text-[9px] font-bold text-indigo-700">Pembahasan tersedia</p>
              <p className="mt-1 text-[9px] leading-relaxed text-slate-500">
                Substitusi x = y + 1000 ke persamaan utama...
              </p>
            </div>
          </div>
          <div className="flex justify-around border-t border-slate-200 px-4 py-3 text-[10px] text-slate-400">
            <span>⌂</span>
            <span className="font-bold text-indigo-600">▦</span>
            <span>?</span>
            <span>◯</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Jendela desktop kecil (HTML/CSS): browser 16:10 + sidebar mapel + panel AI Tutor. */
function DesktopWindow() {
  return (
    <div className="overflow-hidden rounded-xl border-[5px] border-[#252b3b] bg-white shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
      {/* bar browser */}
      <div className="flex items-center gap-1.5 bg-[#252b3b] px-3 py-2">
        <span className="size-2 rounded-full bg-[#FF5F57]" />
        <span className="size-2 rounded-full bg-[#FEBC2E]" />
        <span className="size-2 rounded-full bg-[#28C840]" />
        <span className="ml-1 text-[9px] font-bold text-white/80">musse</span>
      </div>
      <div className="flex">
        {/* sidebar mapel */}
        <div className="flex w-9 shrink-0 flex-col items-center gap-1.5 bg-slate-100 px-1 py-2">
          {MAPEL.map((m) => (
            <span
              key={m}
              className="flex size-6 items-center justify-center rounded-md border border-slate-200 bg-white text-[6px] font-bold text-slate-600"
            >
              {m}
            </span>
          ))}
        </div>
        {/* area utama */}
        <div className="flex flex-1 gap-1.5 p-1.5">
          {/* kartu soal ringkas */}
          <div className="w-[44%] rounded-lg border border-slate-200 p-1.5">
            <p className="text-[6px] font-bold text-slate-400">SOAL 12</p>
            <p className="mt-0.5 text-[7px] font-semibold leading-snug text-slate-800">
              Harga 3 buku dan 2 penggaris Rp18.000...
            </p>
            <div className="mt-1 space-y-0.5">
              <div className="rounded border border-indigo-200 bg-indigo-50 px-1 py-0.5 text-[6px] font-bold text-indigo-700">
                B. Rp23.000 ✓
              </div>
              <div className="rounded border border-slate-200 px-1 py-0.5 text-[6px] text-slate-400">
                A. Rp19.000
              </div>
            </div>
          </div>
          {/* panel AI Tutor */}
          <div className="flex flex-1 flex-col rounded-lg bg-indigo-50/60 p-1.5">
            <p className="text-[7px] font-bold text-indigo-700">✨ AI Tutor</p>
            <div className="win-chat-1 mt-1 self-end rounded-xl rounded-br-sm bg-purple-600 px-1.5 py-1 text-[7px] font-medium text-white">
              Kenapa jawabannya B?
            </div>
            <div className="win-chat-2 mt-1 rounded-xl rounded-bl-sm bg-[#d9f99d] px-1.5 py-1 text-[7px] leading-snug text-slate-800">
              Karena substitusi x = y + 1000...
            </div>
            <div className="mt-auto rounded-full border border-slate-200 bg-white px-1.5 py-1 text-[6px] text-slate-400">
              Tanya apa saja tentang soal...
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

/* Komposisi mockup hero: HP besar + jendela desktop kecil di depannya. */
function HeroMockup() {
  const reduced = useReducedMotion()
  const wrapRef = useRef<HTMLDivElement>(null)

  /* Parallax halus mengikuti mouse (desktop saja, maks 8px). */
  const onMouseMove = (e: React.MouseEvent) => {
    const el = wrapRef.current
    if (reduced || !el || !window.matchMedia('(pointer: fine)').matches) return
    const r = el.getBoundingClientRect()
    const x = ((e.clientX - r.left) / r.width - 0.5) * 16
    const y = ((e.clientY - r.top) / r.height - 0.5) * 16
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`
  }
  const onMouseLeave = () => {
    if (wrapRef.current) wrapRef.current.style.transform = 'translate(0, 0)'
  }

  return (
    <div
      className="relative flex min-h-[380px] items-center justify-center sm:min-h-[520px]"
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
    >
      <div className="absolute size-72 rounded-full bg-indigo-600/10 blur-3xl sm:size-96" />
      {/* Garis orbit elips + titik lime */}
      <div className="pointer-events-none absolute inset-8 -rotate-12 rounded-[50%] border border-[#111111]/25" />
      <div className="pointer-events-none absolute inset-16 rounded-[50%] border border-[#111111]/15 rotate-12" />
      <div className="hero-orbit pointer-events-none absolute inset-8" aria-hidden="true">
        <span className="absolute left-1/2 top-0 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--musse-lime)] shadow-[0_0_8px_rgba(182,255,0,0.8)]" />
      </div>

      {/* Komposisi */}
      <div
        ref={wrapRef}
        className="relative h-[430px] w-[300px] transition-transform duration-200 ease-out sm:h-[500px] sm:w-[540px]"
        style={{ willChange: 'transform' }}
      >
        {/* HP besar: tengah di mobile, kiri di desktop */}
        <div className="absolute left-1/2 top-0 z-[5] -translate-x-1/2 sm:left-6 sm:translate-x-0">
          <div className="hero-float">
            <BigPhone />
          </div>
        </div>
        {/* Jendela desktop kecil: kanan-bawah HP, tumpang tindih sedikit */}
        <div className="absolute bottom-2 right-0 z-10 w-[150px] sm:bottom-6 sm:w-[320px]">
          <div className="hero-float-2">
            <DesktopWindow />
          </div>
        </div>
        {/* Chip melayang — z-20 agar tidak tertutup frame */}
        <span className="absolute left-0 top-10 z-20 rounded-xl border border-[#111111] bg-white px-3 py-2 text-[10px] font-bold shadow-[0_4px_0_#111111]">
          <span className="mr-1 text-indigo-600">✓</span>Benar
        </span>
        <span className="absolute right-0 top-2 z-20 rounded-xl border border-[#111111] bg-white px-3 py-2 text-[10px] font-bold shadow-[0_4px_0_#111111]">
          Streak 14 hari
        </span>
        <span className="absolute bottom-24 left-2 z-20 hidden rounded-xl border border-[#111111] bg-[var(--musse-lime)] px-3 py-2 text-[10px] font-bold text-[#111111] shadow-[0_4px_0_#111111] min-[400px]:block">
          AI Tutor
        </span>
      </div>
    </div>
  )
}

export default function Hero() {
  const [showStickyCta, setShowStickyCta] = useState(false)
  const handleLogin = useGoogleLogin()

  useEffect(() => {
    const hero = document.getElementById('hero')
    const closing = document.getElementById('closing-cta')
    if (!hero || !closing) return
    const observer = new IntersectionObserver(([entry]) => setShowStickyCta(!entry.isIntersecting), { threshold: 0.1 })
    const closingObserver = new IntersectionObserver(([entry]) => { if (entry.isIntersecting) setShowStickyCta(false) }, { threshold: 0.1 })
    observer.observe(hero)
    closingObserver.observe(closing)
    return () => { observer.disconnect(); closingObserver.disconnect() }
  }, [])

  return (
    <>
      <header id="hero" className="relative overflow-hidden border-b border-[#111111] bg-[var(--musse-bg)]">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:72px_72px] [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
        <nav className="relative mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8">
          <div className="text-xl font-bold text-[var(--musse-ink)]">musse<span className="text-[#111111]">.</span></div>
          <button onClick={handleLogin} className="rounded-full bg-[var(--musse-lime)] px-4 py-2.5 text-xs font-bold text-[#10150b] shadow-[0_8px_24px_rgba(182,255,0,0.18)] transition hover:-translate-y-0.5 hover:bg-[#c5ff3d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--musse-lime)]">
            Masuk dengan Google
          </button>
        </nav>

        <div className="relative mx-auto grid max-w-6xl gap-8 px-5 pb-12 pt-10 sm:gap-12 sm:pb-16 sm:pt-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:px-8 lg:pb-24 lg:pt-20">
          <div className="max-w-xl animate-[fadeIn_0.7s_ease-out]">
            <span className="inline-flex rounded-full border border-[var(--musse-lime)]/25 bg-[var(--musse-lime)]/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--musse-ink)]">Latihan TKA untuk SMA/SMK</span>
            <h1 aria-label="TKA? Santai. Latihan di Sini, Siap Tempur." className="mt-5 leading-[1.15]">
              <span className="headline-3d block text-[clamp(30px,8.5vw,64px)]" aria-hidden="true">TKA? Santai.</span>
              <span className="headline-3d mt-1 block text-[clamp(30px,8.5vw,64px)]" aria-hidden="true"><span className="mr-2">—</span>Latihan di Sini,</span>
              <span className="mt-3 block" aria-hidden="true"><span className="stamp-block font-pixel whitespace-nowrap text-[clamp(18px,5vw,44px)] leading-snug">SIAP TEMPUR</span></span>
            </h1>
            <p className="mt-6 max-w-lg text-base leading-7 text-[var(--musse-muted)]">990+ soal sesuai kisi-kisi 2026, pembahasan AI langkah per langkah, plus analisis kelemahan otomatis. Gratis.</p>
            <button onClick={handleLogin} className="mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-[var(--musse-lime)] px-6 py-4 text-sm font-bold text-[#10150b] shadow-[0_12px_35px_rgba(182,255,0,0.2)] transition hover:-translate-y-1 hover:bg-[#c5ff3d] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--musse-lime)] sm:w-auto">Masuk dengan Google — Gratis <span aria-hidden="true">↗</span></button>
            <p className="mt-3 text-xs text-[var(--musse-muted)]">10 detik, tanpa password, tanpa kartu kredit.</p>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2" aria-hidden="true">{avatars.map((avatar, index) => <span key={avatar} className="flex size-8 items-center justify-center rounded-full border-2 border-[var(--musse-bg)] text-[10px] font-bold text-[#10150b]" style={{ backgroundColor: ['#B6FF00', '#8DE7FF', '#A78BFA', '#FFB86B', '#F9A8D4'][index] }}>{avatar}</span>)}</div>
              <p className="text-sm font-bold text-[var(--musse-text)]">100+ <span className="font-normal text-[var(--musse-muted)]">pelajar sudah mulai</span></p>
            </div>
          </div>
          <HeroMockup />
        </div>
      </header>
      <StatsStrip />
      {showStickyCta && <div className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 sm:hidden"><button onClick={handleLogin} className="min-h-12 w-full rounded-full bg-[var(--musse-lime)] px-5 text-sm font-bold text-[#111111] shadow-[0_4px_0_#111111]">Masuk dengan Google — Gratis</button></div>}
    </>
  )
}
