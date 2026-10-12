import AnimatedIcon from './AnimatedIcon'
import { Chip } from './ui'

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

/* ---------- Mini UI kartu utama ---------- */

function PembahasanVisual() {
  const steps = [
    'Tulis harga yang diketahui',
    'Buat persamaan dari soal',
    'Selesaikan persamaan',
    'Cek kembali jawaban',
  ]
  const active = 1
  return (
    <div className="rounded-2xl border-[1.5px] border-[#111111] bg-[#E0E7FF] p-4">
      <p className="text-xs font-bold uppercase tracking-widest text-[#4F46E5]">Langkah 2/5</p>
      <ol className="mt-3 space-y-2">
        {steps.map((s, i) => (
          <li
            key={s}
            className={`rounded-xl border-[1.5px] border-[#111111] px-3 py-2 text-sm font-medium ${
              i === active ? 'bg-[var(--musse-lime)] text-[#111111]' : 'bg-white text-[var(--musse-text)]'
            }`}
          >
            <span className="mr-2 font-bold">{i + 1}.</span>
            {s}
          </li>
        ))}
      </ol>
      <span className="mt-3 inline-block rounded-full border-[1.5px] border-[#111111] bg-white px-3 py-1 text-xs font-bold text-[#111111]">
        Jawaban: B
      </span>
    </div>
  )
}

function AiChatVisual() {
  return (
    <div className="rounded-2xl border-[1.5px] border-[#111111] bg-[#F0FFB8] p-4">
      <span className="inline-block rounded-full border-[1.5px] border-[#111111] bg-white px-3 py-1 text-xs font-bold text-[#111111]">
        Soal 12 · Matematika
      </span>
      <div className="mt-3 flex justify-end">
        <p className="max-w-[80%] rounded-2xl rounded-br-sm border-[1.5px] border-[#111111] bg-[#111111] px-3 py-2 text-sm text-white">
          Kenapa jawabannya B?
        </p>
      </div>
      <div className="mt-2 flex justify-start">
        <p className="max-w-[85%] rounded-2xl rounded-bl-sm border-[1.5px] border-[#111111] bg-white px-3 py-2 text-sm text-[#111111]">
          Karena substitusi x = 4 memenuhi kedua persamaan di soal 12.
        </p>
      </div>
      <div className="mt-2 flex items-center gap-1.5 pl-1" aria-hidden="true">
        <span className="size-2 animate-bounce rounded-full bg-[#111111]" />
        <span className="size-2 animate-bounce rounded-full bg-[#111111] [animation-delay:0.15s]" />
        <span className="size-2 animate-bounce rounded-full bg-[#111111] [animation-delay:0.3s]" />
      </div>
    </div>
  )
}

function AutopsiVisual() {
  const bars = [
    { label: 'Salah konsep', pct: 62, color: '#F97316' },
    { label: 'Salah hitung', pct: 12, color: '#0EA5E9' },
  ]
  return (
    <div className="rounded-2xl border-[1.5px] border-[#111111] bg-[#FFEDD5] p-4">
      <div className="space-y-3">
        {bars.map((b) => (
          <div key={b.label}>
            <div className="flex items-center justify-between text-xs font-bold text-[#111111]">
              <span>{b.label}</span>
              <span>{b.pct}%</span>
            </div>
            <div className="mt-1 h-3 overflow-hidden rounded-full border-[1.5px] border-[#111111] bg-white">
              <div className="h-full rounded-full" style={{ width: `${b.pct}%`, backgroundColor: b.color }} />
            </div>
          </div>
        ))}
      </div>
      <span className="mt-3 inline-block rounded-full border-[1.5px] border-[#111111] bg-[var(--musse-lime)] px-3 py-1 text-xs font-bold text-[#111111]">
        💡 Fokus ke geometri
      </span>
    </div>
  )
}

/* ---------- Mini visual kartu kecil ---------- */

function MisiVisual() {
  const items = [
    { t: 'Kerjakan 10 soal', done: true },
    { t: 'Baca pembahasan', done: true },
    { t: 'Tryout mini', done: false },
  ]
  return (
    <div className="mt-3 space-y-1.5">
      {items.map((it) => (
        <div key={it.t} className="flex items-center gap-2 text-xs">
          <span className={`flex size-4 items-center justify-center rounded border-[1.5px] border-[#111111] ${it.done ? 'bg-[var(--musse-lime)]' : 'bg-white'}`}>
            {it.done && (
              <svg aria-hidden="true" className="size-3" fill="none" stroke="#111111" strokeWidth="3" viewBox="0 0 24 24">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </span>
          <span className={it.done ? 'opacity-60 line-through' : ''}>{it.t}</span>
        </div>
      ))}
    </div>
  )
}

function StreakVisual() {
  return (
    <div className="mt-3 flex gap-1.5" aria-hidden="true">
      {Array.from({ length: 7 }).map((_, i) => (
        <span
          key={i}
          className={`size-3.5 rounded-full border-[1.5px] border-[#111111] ${i < 5 ? 'bg-[#F97316]' : 'bg-white/20'}`}
        />
      ))}
    </div>
  )
}

function ProgresVisual() {
  return (
    <svg aria-hidden="true" className="mt-3 h-10 w-full" viewBox="0 0 120 40" fill="none">
      <polyline
        points="2,34 22,30 42,32 62,22 82,24 102,10 118,6"
        stroke="#4F46E5"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="118" cy="6" r="4" fill="#B6FF00" stroke="#111111" strokeWidth="1.5" />
    </svg>
  )
}

function MapelVisual() {
  const chips = ['MTK', 'FIS', 'KIM', 'BIO', 'IND', 'ING']
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {chips.map((c) => (
        <span key={c} className="rounded-md border-[1.5px] border-[#111111] bg-[var(--musse-lime)] px-2 py-0.5 text-[11px] font-bold text-[#111111]">
          {c}
        </span>
      ))}
    </div>
  )
}

function BenarSalahVisual() {
  return (
    <div className="mt-3 space-y-1.5">
      <div className="flex items-center justify-between rounded-lg border-[1.5px] border-[#111111] bg-green-100 px-2.5 py-1.5 text-xs font-bold">
        <span>A. 42</span>
        <svg aria-hidden="true" className="size-4 text-green-700" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <div className="flex items-center justify-between rounded-lg border-[1.5px] border-[#111111] bg-white px-2.5 py-1.5 text-xs">
        <span>B. 38</span>
      </div>
    </div>
  )
}

function RuangAiVisual() {
  return (
    <div className="mt-3 flex items-center gap-2">
      <span className="flex size-8 items-center justify-center rounded-full border-[1.5px] border-[#111111] bg-[#0EA5E9] text-xs font-bold text-white">
        F
      </span>
      <span className="text-xs font-bold">Ruang Fisika</span>
    </div>
  )
}

function PendampingVisual() {
  return (
    <div className="mt-3 rounded-lg border-[1.5px] border-[#111111] bg-[#E0E7FF] p-2.5 text-xs leading-5">
      <span className="font-bold">Insight:</span> kamu sering salah di soal cerita.
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
    title: 'Autopsi kelemahan',
    desc: 'AI bedah hasil tryout-mu: salah karena terburu-buru, salah konsep, atau apa.',
    visual: <AutopsiVisual />,
    checks: ['Tahu salahmu di mana', 'Dibedah otomatis dari hasil tryout', 'Ada saran perbaikan'],
    circleBg: 'bg-[#FFEDD5]',
  },
]

const smallCards: {
  title: string
  desc: string
  visual: string
  mini: React.ReactNode
}[] = [
  { title: 'Benar/salah langsung', desc: 'Tahu hasil tanpa menunggu.', visual: 'benar-salah', mini: <BenarSalahVisual /> },
  { title: 'Ruang AI per mapel', desc: 'Diskusi khusus tiap mapel.', visual: 'ai-room', mini: <RuangAiVisual /> },
  { title: 'Pendamping Belajar TKA dengan AI', desc: 'Pola belajarmu dibaca otomatis.', visual: 'pendamping', mini: <PendampingVisual /> },
  { title: 'Progres belajar', desc: 'Perkembanganmu selalu terlihat.', visual: 'progres', mini: <ProgresVisual /> },
  { title: 'Streak', desc: 'Jaga ritme belajar beruntun.', visual: 'streak', mini: <StreakVisual /> },
  { title: 'Misi harian', desc: 'Tantangan fokus setiap hari.', visual: 'misi', mini: <MisiVisual /> },
  { title: '27 mapel', desc: 'SMA sampai mapel kejuruan SMK.', visual: 'mapel', mini: <MapelVisual /> },
]

/* ---------- Section ---------- */

export default function Features() {
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

        {/* 3 kartu utama */}
        <div className="core-features-carousel mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 lg:mt-12 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible">
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

        {/* Grid kecil — 7 kartu, baris terakhir auto-center */}
        <div className="mt-5 flex flex-wrap justify-center gap-4 lg:mt-6 lg:gap-5">
          {smallCards.map((card) => (
            <article
              key={card.title}
              className="card-framed card-invert card-hover group w-[calc(50%-0.5rem)] rounded-2xl p-5 md:w-[calc(33.333%-0.667rem)] lg:w-[calc(25%-0.75rem)]"
            >
              <AnimatedIcon type={card.visual} />
              <h3 className="inv-t mt-3 text-sm font-bold leading-tight">
                {card.title}
              </h3>
              <p className="inv-d mt-1 text-[13px] leading-5">
                {card.desc}
              </p>
              <div className="inv-t">
                {card.mini}
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
