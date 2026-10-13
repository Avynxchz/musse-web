'use client'

import Image from 'next/image'
import { useGoogleLogin } from '@/lib/useGoogleLogin'
import { useReducedMotion } from '@/lib/useReducedMotion'
import { useEffect, useRef, useState } from 'react'
import StatsStrip from './StatsStrip'

const avatars = ['A', 'R', 'N', 'F', 'D']

/* Komposisi mockup hero: laptop di belakang + HP miring di depan. */
function HeroMockup() {
  const reduced = useReducedMotion()
  const [showSoal, setShowSoal] = useState(true)
  const wrapRef = useRef<HTMLDivElement>(null)

  /* Layar HP bergantian tiap 3,5 detik (cross-fade). */
  useEffect(() => {
    if (reduced) return
    const t = setInterval(() => setShowSoal((s) => !s), 3500)
    return () => clearInterval(t)
  }, [reduced])

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
      className="relative flex min-h-[330px] items-center justify-center sm:min-h-[500px]"
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
      {/* Chip melayang */}
      <span className="absolute left-2 top-14 rounded-xl border border-[#111111] bg-white px-3 py-2 text-[10px] font-bold shadow-[0_4px_0_#111111] sm:left-0"><span className="mr-1 text-indigo-600">✓</span>Benar</span>
      <span className="absolute right-0 top-24 rounded-xl border border-[#111111] bg-white px-3 py-2 text-[10px] font-bold shadow-[0_4px_0_#111111]">Streak 14 hari</span>
      <span className="hidden absolute bottom-10 left-8 sm:block rounded-xl border border-[#111111] bg-[var(--musse-lime)] px-3 py-2 text-[10px] font-bold text-[#111111] shadow-[0_4px_0_#111111]">AI Tutor</span>

      {/* Komposisi: maks 300px di mobile, di tengah */}
      <div
        ref={wrapRef}
        className="relative aspect-[2/1] w-[300px] transition-transform duration-200 ease-out sm:w-[440px] lg:w-[520px]"
        style={{ willChange: 'transform' }}
      >
        {/* Laptop (belakang) */}
        <div className="hero-float absolute right-0 top-0 w-[72%] sm:w-[80%] lg:w-[86%]">
          <div className="overflow-hidden rounded-xl border-[6px] border-[#111111] bg-[#111111] shadow-[0_4px_0_#111111]">
            <Image
              src="/mockups/desktop-dashboard.jpg"
              alt="Tampilan dashboard aplikasi musse di laptop"
              width={1440}
              height={751}
              priority
              className="h-auto w-full"
            />
          </div>
          {/* Dasar keyboard sederhana */}
          <div className="mx-auto h-2.5 w-[104%] -translate-x-[2%] rounded-b-lg border border-[#111111] bg-[#2b2b2b]" />
        </div>

        {/* HP (depan, sedikit miring, bertumpuk di kiri bawah laptop) */}
        <div className="hero-float-2 absolute bottom-0 left-0 z-10 w-[30%] sm:w-[30%]">
          <div className="rounded-[1.8rem] border-[3px] border-[#111111] bg-[#111111] p-1 shadow-[0_4px_0_#111111]">
            <div className="relative aspect-[640/998] overflow-hidden rounded-[1.35rem] bg-white">
              <Image
                src="/mockups/hp-soal.png"
                alt="Tampilan soal di aplikasi musse (HP)"
                width={640}
                height={998}
                className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700 ${showSoal ? 'opacity-100' : 'opacity-0'}`}
              />
              <Image
                src="/mockups/hp-pembahasan.png"
                alt="Tampilan pembahasan di aplikasi musse (HP)"
                width={640}
                height={998}
                loading="lazy"
                className={`absolute inset-0 h-full w-full object-cover object-top transition-opacity duration-700 ${showSoal ? 'opacity-0' : 'opacity-100'}`}
              />
              {/* Notch tipis */}
              <span className="absolute left-1/2 top-1.5 h-3.5 w-16 -translate-x-1/2 rounded-full bg-[#111111]" aria-hidden="true" />
            </div>
          </div>
        </div>
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
