'use client'

import { useLoopAnimation } from '@/lib/useLoopAnimation'
import { PEMBAHASAN_STEPS, RUANG_MAPEL_CHIPS } from '@/content/features'

/* ---------- Jadwal animasi loop ketiga kartu besar ---------- */

const TL_PEMBAHASAN: [number, number][] = [[0, 1], [1600, 2], [3200, 3], [4800, 4], [6400, 5], [8000, 6], [10000, 7]]
const LOOP_PEMBAHASAN = 11500
const TL_CHAT: [number, number][] = [[0, 1], [800, 2], [2200, 3], [3400, 4], [6500, 5]]
const LOOP_CHAT = 8000
const TL_RUANG: [number, number][] = [[0, 1], [1000, 2], [2500, 3], [3400, 4], [4500, 5], [6500, 6]]
const LOOP_RUANG = 8000

/* Jeda berurutan antar chip mapel (detik). */
const CHIP_STAGGER = 0.15

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

export function PembahasanVisual() {
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

export function AiChatVisual() {
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

export function RuangAiVisual() {
  const { step, cycle, wrapRef } = useLoopAnimation(TL_RUANG, LOOP_RUANG)
  return (
    <VisualPanel tint="bg-[#FFEDD5]" faded={step === 6} minH="min-h-[330px]" wrapRef={wrapRef}>
      {/* 1. Chip mapel */}
      <div className="flex flex-wrap gap-2">
        {RUANG_MAPEL_CHIPS.map((c, i) => (
          <PopIn key={`${cycle}-${c}`} show={step >= 1} animKey={`${cycle}-${c}`} delay={i * CHIP_STAGGER} keepSpace>
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
