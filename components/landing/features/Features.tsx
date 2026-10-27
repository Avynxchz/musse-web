'use client'

import { useRef, useState } from 'react'
import { Chip, CheckIcon } from '../../landing-ui'
import { MAIN_CARDS, BALOKS, type MainCardVisual } from '@/content/features'
import { PembahasanVisual, AiChatVisual, RuangAiVisual } from './FeatureVisuals'
import { BalokIcon, BALOK_MINIS } from './BalokVisuals'

/* Mapping key data → elemen visual (dibuat sekali di module, seperti sebelumnya). */
const MAIN_VISUALS: Record<MainCardVisual, React.ReactNode> = {
  pembahasan: <PembahasanVisual />,
  'ai-chat': <AiChatVisual />,
  'ruang-ai': <RuangAiVisual />,
}

function CheckRow({ text, circleBg }: { text: string; circleBg: string }) {
  return (
    <li className="flex items-center gap-2.5">
      <span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${circleBg}`}>
        <CheckIcon strokeWidth={2.5} />
      </span>
      <span className="text-sm text-[var(--musse-text)]">{text}</span>
    </li>
  )
}

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
          {MAIN_CARDS.map((card, index) => (
            <article
              key={card.title}
              className="card-framed card-hover min-w-[88%] snap-center rounded-2xl p-6 transition-transform sm:min-w-[60%] lg:min-w-0"
            >
              <span className="text-4xl font-bold text-[var(--musse-indigo)]">0{index + 1}</span>
              <div className="mt-4">{MAIN_VISUALS[card.visual]}</div>
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
            {BALOKS.map((b, i) => {
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
                    {BALOK_MINIS[b.mini](dark)}
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
