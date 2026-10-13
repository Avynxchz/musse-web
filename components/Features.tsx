'use client'

import { useRef, useState } from 'react'
import { Chip } from './ui'
import { useLoopAnimation } from '@/lib/useLoopAnimation'

function CheckRow({ text, circleBg }: { text: string; circleBg: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${circleBg}`}>
        <svg aria-hidden="true" className="size-3.5" fill="none" stroke="#111111" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </span>
      <span className="text-sm text-[var(--musse-text)]">{text}</span>
    </li>
  )
}

/* ---------- Hook animasi loop (dipakai ketiga kartu besar) ---------- */

const TL_PEMBAHASAN: [number, number][] = [[0, 1], [1600, 2], [3200, 3], [4800, 4], [6400, 5], [8000, 6], [10000, 7]]
const LOOP_PEMBAHASAN = 11500
const TL_CHAT: [number, number][] = [[0, 1], [800, 2], [2200, 3], [3400, 4], [6500, 5]]
const LOOP_CHAT = 8000
const TL_RUANG: [number, number][] = [[0, 1], [1000, 2], [2500, 3], [3400, 4], [4500, 5], [6500, 6]]
const LOOP_RUANG = 8000

/* ---------- Primitif visual bersama (dipakai ketiga kartu besar) ---------- */

// Panel tint + fade-out akhir loop. Tinggi distabilkan lewat minH.
function VisualPanel({
  tint,
  faded,
  minH = '',
  wrapRef,
  children,
}: {
  tint: string
  faded: boolean
  minH?: string
  wrapRef: React.Ref<HTMLDivElement>
  children: React.ReactNode
}) {
  return (
    <div ref={wrapRef} className={`ruang-anim rounded-2xl border-[1.5px] border-[#111111] p-4 ${tint}`}>
      <div className={`${faded ? 'opacity-0' : 'opacity-100'} ${minH} transition-opacity duration-500`}>
        {children}
      </div>
    </div>
  )
}

// Elemen yang muncul dengan animasi pop/slide. key+cycle bikin animasi keulang tiap loop.
// keepSpace: tetap ambil tempat (visibility hidden) biar layout tidak lompat.
function PopIn({
  show,
  animKey,
  variant = 'pop',
  delay,
  keepSpace = false,
  className = '',
  children,
}: {
  show: boolean
  animKey: string
  variant?: 'pop' | 'slide' | 'pop-big'
  delay?: number
  keepSpace?: boolean
  className?: string
  children: React.ReactNode
}) {
  if (!show && !keepSpace) return null
  const animClass = variant === 'pop' ? 'anim-pop' : variant === 'slide' ? 'anim-slide' : 'anim-pop-big'
  return (
    <div
      key={animKey}
      className={`${className} ${show ? animClass : ''}`}
      style={{
        visibility: show ? 'visible' : 'hidden',
        animationDelay: show && delay != null ? `${delay}s` : undefined,
      }}
    >
      {children}
    </div>
  )
}

function TypingDots() {
  return (
    <div className="mt-2 flex items-center gap-1.5 pl-1" aria-hidden="true">
      <span className="size-2 animate-bounce rounded-full bg-[#111111]" />
      <span className="size-2 animate-bounce rounded-full bg-[#111111] [animation-delay:0.15s]" />
      <span className="size-2 animate-bounce rounded-full bg-[#111111] [animation-delay:0.3s]" />
    </div>
  )
}

function ChatBubble({ from, children }: { from: 'user' | 'ai'; children: React.ReactNode }) {
  const isUser = from === 'user'
  return (
    <div className={isUser ? 'flex justify-end' : 'flex justify-start'}>
      <p
        className={
          isUser
            ? 'max-w-[80%] rounded-2xl rounded-br-sm border-[1.5px] border-[#111111] bg-[#111111] px-3 py-2 text-sm text-white'
            : 'max-w-[85%] rounded-2xl rounded-bl-sm border-[1.5px] border-[#111111] bg-white px-3 py-2 text-sm text-[#111111]'
        }
      >
        {children}
      </p>
    </div>
  )
}

// Pil kecil berbingkai (chip konteks, "Jawaban: B")
function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-block rounded-full border-[1.5px] border-[#111111] bg-white px-3 py-1 text-xs font-bold text-[#111111]">
      {children}
    </span>
  )
}

function MapelChip({ selected, children }: { selected: boolean; children: React.ReactNode }) {
  return (
    <span
      className={`rounded-full border-[1.5px] border-[#111111] px-3 py-1 text-xs font-bold text-[#111111] ${
        selected ? 'bg-[var(--musse-lime)]' : 'bg-white'
      }`}
    >
      {children}
    </span>
  )
}

/* ---------- Visual kartu 1: Pembahasan ---------- */

const PEMBAHASAN_STEPS = [
  'Tulis harga yang diketahui',
  'Buat persamaan dari soal',
  'Selesaikan persamaan',
  'Cek kembali jawaban',
  'Tulis jawaban akhir',
]

function PembahasanVisual() {
  const { step, cycle, wrapRef } = useLoopAnimation(TL_PEMBAHASAN, LOOP_PEMBAHASAN)
  const active = step === 0 ? 1 : Math.min(step, 5)
  const done = step >= 6
  return (
    <VisualPanel tint="bg-[#E0E7FF]" faded={step === 7} wrapRef={wrapRef}>
      <p className="text-xs font-bold uppercase tracking-widest text-[#4F46E5]">
        Langkah {done ? 5 : active}/5
      </p>
      <ol className="mt-3 space-y-2">
        {PEMBAHASAN_STEPS.map((s, i) => {
          const idx = i + 1
          const isActive = done ? idx === 5 : idx === active
          return (
            <li
              key={s}
              className={`rounded-xl border-[1.5px] border-[#111111] px-3 py-2 text-sm font-medium transition-colors duration-700 ${
                isActive ? 'bg-[var(--musse-lime)] text-[#111111]' : 'bg-white text-[var(--musse-text)]'
              }`}
            >
              <span className="mr-2 font-bold">{idx}.</span>
              {s}
            </li>
          )
        })}
      </ol>
      <div className="mt-3 min-h-[30px]">
        <PopIn show={step >= 6} animKey={`jb-${cycle}`}>
          <Pill>Jawaban: B</Pill>
        </PopIn>
      </div>
    </VisualPanel>
  )
}

/* ---------- Visual kartu 2: AI Chat ---------- */

function AiChatVisual() {
  const { step, cycle, wrapRef } = useLoopAnimation(TL_CHAT, LOOP_CHAT)
  return (
    <VisualPanel tint="bg-[#F0FFB8]" faded={step === 5} minH="min-h-[268px]" wrapRef={wrapRef}>
      <div className="min-h-[28px]">
        <PopIn show={step >= 1} animKey={`ctx-${cycle}`}>
          <Pill>Soal 12 · Matematika</Pill>
        </PopIn>
      </div>
      <div className="min-h-[52px]">
        <PopIn show={step >= 2} animKey={`uq-${cycle}`} className="mt-3">
          <ChatBubble from="user">Kenapa jawabannya B?</ChatBubble>
        </PopIn>
      </div>
      <div className="min-h-[64px]">
        {step === 3 && <TypingDots />}
        <PopIn show={step >= 4} animKey={`aq-${cycle}`} className="mt-2">
          <ChatBubble from="ai">Karena substitusi x = 4 memenuhi kedua persamaan di soal 12.</ChatBubble>
        </PopIn>
      </div>
    </VisualPanel>
  )
}

/* ---------- Visual kartu 3: Ruang AI & Pendamping ---------- */

const MAPEL_CHIPS = ['MTK', 'FIS', 'KIM', 'BIO']

function RuangAiVisual() {
  const { step, cycle, wrapRef } = useLoopAnimation(TL_RUANG, LOOP_RUANG)
  return (
    <VisualPanel tint="bg-[#FFEDD5]" faded={step === 6} minH="min-h-[330px]" wrapRef={wrapRef}>
      {/* 1. Chip mapel */}
      <div className="flex flex-wrap gap-2">
        {MAPEL_CHIPS.map((c, i) => (
          <PopIn key={`${cycle}-${c}`} show={step >= 1} animKey={`${cycle}-${c}`} delay={i * 0.15} keepSpace>
            <MapelChip selected={step >= 2 && c === 'FIS'}>{c}</MapelChip>
          </PopIn>
        ))}
      </div>

      {/* 2. Kartu ruang */}
      <PopIn show={step >= 2} animKey={`room-${cycle}`} variant="slide" keepSpace className="mt-3">
        <div className="flex items-center gap-3 rounded-2xl border-[1.5px] border-[#111111] bg-white p-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#111111] bg-[#0EA5E9] text-sm font-bold text-white">
            F
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-[#111111]">Ruang Fisika</p>
            <p className="text-xs text-[var(--musse-muted)]">128 diskusi aktif</p>
          </div>
        </div>
      </PopIn>

      {/* 3. Chat */}
      <div className="mt-3 min-h-[104px]">
        <PopIn show={step >= 3} animKey={`q-${cycle}`} keepSpace>
          <ChatBubble from="user">Kak, kenapa pakai rumus itu?</ChatBubble>
        </PopIn>
        {step === 3 && <TypingDots />}
        <PopIn show={step >= 4} animKey={`a-${cycle}`} className="mt-2">
          <ChatBubble from="ai">Karena soalnya tentang gerak lurus — rumusnya cocok buat Fisika.</ChatBubble>
        </PopIn>
      </div>

      {/* 4. Kartu insight */}
      <PopIn show={step >= 5} animKey={`ins-${cycle}`} variant="pop-big" keepSpace className="mt-3">
        <div className="rounded-2xl border-[1.5px] border-[#111111] bg-[var(--musse-lime)] p-3">
          <p className="text-xs font-bold uppercase tracking-widest text-[#111111]">Insight minggu ini</p>
          <p className="mt-1 text-sm font-medium leading-5 text-[#111111]">
            Aljabarmu naik 23%. Fokus ke geometri ya!
          </p>
          <div className="mt-2 h-2.5 overflow-hidden rounded-full border border-[#111111] bg-white">
            <div
              className="h-full rounded-full bg-[#F97316]"
              style={{ width: step >= 5 ? '72%' : '0%', transition: 'width 1.2s ease 0.3s' }}
            />
          </div>
        </div>
      </PopIn>
    </VisualPanel>
  )
}

/* ---------- Ikon Lucide buat balok ---------- */

const balokIconPaths: Record<string, string> = {
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z',
  check: 'M20 6 9 17l-5-5',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  chart: 'M3 3v18h18M7 16l3-4 3 2 5-7',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  clipboard: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6v4H9V2Z',
  flame: 'M12 22c4 0 7-2.7 7-6.5 0-3.2-2-5.4-4.2-7.5.1 2.2-1 3.5-2 4.2.3-4.2-1.8-7-4.2-9.2.2 4-3.6 6.4-3.6 10.5C5 18.9 8.1 22 12 22Z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2',
  layers: 'm12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5',
}

function BalokIcon({ name, bg }: { name: string; bg: string }) {
  return (
    <span className={`flex size-11 shrink-0 items-center justify-center rounded-full border-[1.5px] border-[#111111] ${bg}`}>
      <svg aria-hidden="true" className="size-5" fill="none" stroke="#111111" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24">
        <path d={balokIconPaths[name]} />
      </svg>
    </span>
  )
}

/* ---------- Mini visual balok (maks ~96px) ---------- */

function BMapel() {
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

function BBenarSalah() {
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

function BAutopsi({ dark }: { dark: boolean }) {
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

function BProgres({ dark }: { dark: boolean }) {
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

function BMisi({ dark }: { dark: boolean }) {
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

function BTryout({ dark }: { dark: boolean }) {
  return (
    <p className={`font-mono text-lg font-bold tracking-widest ${dark ? 'text-white' : 'text-[#111111]'}`}>
      59:59
    </p>
  )
}

function BStreak() {
  return (
    <div className="flex gap-1" aria-hidden="true">
      {Array.from({ length: 5 }).map((_, i) => (
        <span key={i} className="size-3 rounded-full border border-[#111111] bg-[#F97316]" />
      ))}
    </div>
  )
}

function BCountdown({ dark }: { dark: boolean }) {
  return (
    <p className={`text-sm font-bold ${dark ? 'text-white' : 'text-[#111111]'}`}>
      14 <span className={`text-xs font-medium ${dark ? 'text-white/60' : 'text-[var(--musse-muted)]'}`}>hari</span>
    </p>
  )
}

function BMode() {
  return (
    <div className="flex w-20 rounded-full border-[1.5px] border-[#111111] bg-white p-0.5 text-[10px] font-bold" aria-hidden="true">
      <span className="flex-1 rounded-full bg-[#111111] px-1 py-0.5 text-center text-white">Lthn</span>
      <span className="flex-1 px-1 py-0.5 text-center text-[var(--musse-muted)]">Sim</span>
    </div>
  )
}

/* ---------- Data ---------- */

const mainCards = [
  {
    title: 'Pembahasan langkah demi langkah',
    desc: 'Tiap soal ada pembahasan AI yang jelas, bukan cuma kunci jawaban.',
    visual: <PembahasanVisual />,
    checks: ['Dijelaskan langkah demi langkah', 'Bukan cuma kunci jawaban', 'Ada di tiap soal'],
    circleBg: 'bg-[#E0E7FF]',
  },
  {
    title: 'AI Chat yang paham konteks soal',
    desc: 'Nanya soal nomor berapa pun, AI ngerti soal mana yang kamu maksud.',
    visual: <AiChatVisual />,
    checks: ['Tanpa copy-paste soal', 'Tahu soal mana yang kamu maksud', 'Jawab sesuai konteks'],
    circleBg: 'bg-[#F0FFB8]',
  },
  {
    title: 'Ruang AI & Pendamping Belajar TKA',
    desc: 'Diskusi di ruang tiap mapel, sementara AI nyatet pola belajarmu otomatis dan ngasih tau apa yang perlu diperbaiki.',
    visual: <RuangAiVisual />,
    checks: ['Ruang diskusi khusus tiap mapel', 'AI nyatet pola belajarmu otomatis', 'Dikasih tahu apa yang perlu diperbaiki'],
    circleBg: 'bg-[#FFEDD5]',
  },
]

type Balok = {
  title: string
  desc: string
  icon: string
  iconBg: string
  mini: (dark: boolean) => React.ReactNode
}

const CIRCLE_LIME = 'bg-[var(--musse-lime)]'
const CIRCLE_INDIGO = 'bg-[#E0E7FF]'
const CIRCLE_ORANGE = 'bg-[#FFEDD5]'
const CIRCLE_SKY = 'bg-[#E0F2FE]'

const baloks: Balok[] = [
  { title: '27 mapel', desc: 'SMA sampai mapel kejuruan SMK.', icon: 'book', iconBg: CIRCLE_LIME, mini: () => <BMapel /> },
  { title: 'Benar/salah langsung', desc: 'Tahu hasil tanpa menunggu.', icon: 'check', iconBg: CIRCLE_INDIGO, mini: () => <BBenarSalah /> },
  { title: 'Autopsi kelemahan', desc: 'AI bedah hasil tryout-mu: salah karena terburu-buru, salah konsep, atau apa.', icon: 'search', iconBg: CIRCLE_ORANGE, mini: (d) => <BAutopsi dark={d} /> },
  { title: 'Progres belajar', desc: 'Perkembanganmu selalu terlihat.', icon: 'chart', iconBg: CIRCLE_SKY, mini: (d) => <BProgres dark={d} /> },
  { title: 'Misi harian', desc: 'Tantangan fokus setiap hari.', icon: 'target', iconBg: CIRCLE_LIME, mini: (d) => <BMisi dark={d} /> },
  { title: 'Tryout simulasi', desc: 'Latihan persis seperti hari-H.', icon: 'clipboard', iconBg: CIRCLE_INDIGO, mini: (d) => <BTryout dark={d} /> },
  { title: 'Streak', desc: 'Jaga ritme belajar beruntun.', icon: 'flame', iconBg: CIRCLE_ORANGE, mini: () => <BStreak /> },
  { title: 'Countdown TKA', desc: 'Tahu berapa hari menuju hari-H.', icon: 'clock', iconBg: CIRCLE_SKY, mini: (d) => <BCountdown dark={d} /> },
  { title: 'Mode latihan vs simulasi', desc: 'Santai belajar atau uji mental.', icon: 'layers', iconBg: CIRCLE_LIME, mini: () => <BMode /> },
]

/* ---------- Section ---------- */

export default function Features() {
  const trackRef = useRef<HTMLDivElement>(null)
  const [activeDot, setActiveDot] = useState(0)

  const onTrackScroll = () => {
    const el = trackRef.current
    if (!el) return
    const card = el.querySelector('article')
    if (!card) return
    const w = card.getBoundingClientRect().width + 16
    setActiveDot(Math.min(2, Math.max(0, Math.round(el.scrollLeft / w))))
  }

  return (
    <section id="fitur" className="border-b border-[#111111] bg-[var(--musse-bg)]">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <div className="max-w-2xl">
          <Chip>Fitur inti</Chip>
          <h2 className="mt-4 text-3xl font-extrabold text-[var(--musse-text)] md:text-5xl">
            Semua yang kamu butuhin buat <span className="text-[var(--musse-indigo)]">TKA.</span>
          </h2>
          <p className="mt-4 text-[16px] leading-7 text-[var(--musse-muted)]">
            Satu aplikasi untuk latihan, memahami pola salah, dan datang ke hari-H dengan lebih siap.
          </p>
        </div>

        {/* BAGIAN A: 3 kartu utama */}
        <div
          ref={trackRef}
          onScroll={onTrackScroll}
          className="core-features-carousel mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 lg:mt-12 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible"
        >
          {mainCards.map((card, index) => (
            <article
              key={card.title}
              className="card-framed card-hover min-w-[88%] snap-center rounded-2xl p-6 transition-transform sm:min-w-[60%] lg:min-w-0"
            >
              <span className="text-4xl font-bold text-[var(--musse-indigo)]">0{index + 1}</span>
              <div className="mt-4">{card.visual}</div>
              <h3 className="mt-5 text-xl font-bold leading-tight text-[var(--musse-text)]">
                {card.title}
              </h3>
              <p className="mt-2 text-[15px] leading-6 text-[var(--musse-muted)]">{card.desc}</p>
              <ul className="mt-4 space-y-2.5">
                {card.checks.map((c) => (
                  <CheckRow key={c} text={c} circleBg={card.circleBg} />
                ))}
              </ul>
            </article>
          ))}
        </div>

        {/* Indikator titik carousel (mobile) */}
        <div className="mt-2 flex justify-center gap-2 lg:hidden" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={`size-2 rounded-full border border-[#111111] transition-colors ${i === activeDot ? 'bg-[#111111]' : 'bg-white'}`}
            />
          ))}
        </div>

        {/* BAGIAN B: balok fitur lain */}
        <div className="mt-14 lg:mt-20">
          <h3 className="text-xl font-extrabold text-[var(--musse-text)] md:text-2xl">
            <span className="inline-block -rotate-1 rounded-lg border-[1.5px] border-[#111111] bg-[var(--musse-lime)] px-3 py-1">
              Dan masih banyak lagi
            </span>
          </h3>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 lg:gap-5">
            {baloks.map((b, i) => {
              const dark = i % 2 === 1
              return (
                <article
                  key={b.title}
                  className={`flex h-[80px] items-center gap-3 rounded-[14px] p-3 transition-transform hover:-translate-y-0.5 ${
                    dark
                      ? 'border-[1.5px] border-white bg-[#111111] shadow-[0_4px_0_#B6FF00]'
                      : 'border-[1.5px] border-[#111111] bg-white shadow-[0_4px_0_#111111]'
                  }`}
                >
                  <BalokIcon name={b.icon} bg={b.iconBg} />
                  <div className="min-w-0 flex-1">
                    <h4 className={`truncate text-[15px] font-bold leading-tight ${dark ? 'text-white' : 'text-[var(--musse-text)]'}`}>
                      {b.title}
                    </h4>
                    <p className={`truncate text-sm leading-5 ${dark ? 'text-white/60' : 'text-[var(--musse-muted)]'}`}>
                      {b.desc}
                    </p>
                  </div>
                  <div className="hidden min-[400px]:block shrink-0">
                    {b.mini(dark)}
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
