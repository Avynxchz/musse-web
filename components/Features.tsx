import { FeatureVisual } from './Mockups'

type IconName = 'book' | 'check' | 'bot' | 'brain' | 'chart' | 'target' | 'trophy' | 'clock' | 'flame' | 'layers'

const iconPaths: Record<IconName, string> = {
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z',
  check: 'M20 6 9 17l-5-5',
  bot: 'M12 8V4H8M4 12h16M6 8h12a2 2 0 0 1 2 2v8H4v-8a2 2 0 0 1 2-2ZM8 14h.01M16 14h.01',
  brain: 'M9.5 2a3.5 3.5 0 0 0-3.4 4.3A3.5 3.5 0 0 0 4 12a3.5 3.5 0 0 0 2.1 5.7A3.5 3.5 0 0 0 12 20V5.5A3.5 3.5 0 0 0 9.5 2ZM14.5 2a3.5 3.5 0 0 1 3.4 4.3A3.5 3.5 0 0 1 20 12a3.5 3.5 0 0 1-2.1 5.7A3.5 3.5 0 0 1 12 20',
  chart: 'M3 3v18h18M7 16l3-4 3 2 5-7',
  target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  trophy: 'M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4ZM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2',
  flame: 'M12 22c4 0 7-2.7 7-6.5 0-3.2-2-5.4-4.2-7.5.1 2.2-1 3.5-2 4.2.3-4.2-1.8-7-4.2-9.2.2 4-3.6 6.4-3.6 10.5C5 18.9 8.1 22 12 22Z',
  layers: 'm12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5',
}

function LucideIcon({ name }: { name: IconName }) {
  return <svg aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24"><path d={iconPaths[name]} /></svg>
}

const coreFeatures = [
  { title: 'Pembahasan langkah demi langkah', desc: 'Tiap soal ada pembahasan AI yang jelas, bukan cuma kunci jawaban.', visual: 'pembahasan' },
  { title: 'AI Chat yang paham konteks soal', desc: 'Nanya soal nomor berapa pun, AI ngerti soal mana yang kamu maksud.', visual: 'ai-chat' },
  { title: 'Autopsi kelemahan', desc: 'AI bedah hasil tryout-mu: salah karena terburu-buru, salah konsep, atau apa.', visual: 'autopsi' },
]

const utilityFeatures: { title: string; desc: string; icon: IconName }[] = [
  { title: '27 mapel', desc: 'SMA sampai mapel kejuruan SMK.', icon: 'book' },
  { title: 'Benar/salah langsung', desc: 'Tahu hasil tanpa menunggu.', icon: 'check' },
  { title: 'Ruang AI per mapel', desc: 'Diskusi khusus tiap mapel.', icon: 'bot' },
  { title: 'Pendamping Belajar TKA dengan AI', desc: 'Pola belajarmu dibaca otomatis.', icon: 'brain' },
  { title: 'Progres belajar', desc: 'Perkembanganmu selalu terlihat.', icon: 'chart' },
  { title: 'Misi harian', desc: 'Tantangan fokus setiap hari.', icon: 'target' },
  { title: 'Tryout simulasi', desc: 'Latihan persis seperti hari-H.', icon: 'trophy' },
  { title: 'Streak', desc: 'Jaga ritme belajar beruntun.', icon: 'flame' },
  { title: 'Countdown TKA', desc: 'Tahu berapa hari menuju hari-H.', icon: 'clock' },
  { title: 'Mode latihan vs simulasi', desc: 'Santai belajar atau uji mental.', icon: 'layers' },
]

export default function Features() {
  return <section id="fitur" className="border-b border-white/10 bg-[var(--musse-bg)]"><div className="mx-auto max-w-6xl px-5 py-16 md:py-24"><div className="max-w-2xl"><span className="inline-block bg-[var(--musse-lime)] px-2 py-0.5 text-xs font-black uppercase tracking-widest text-[#10150b]">Fitur inti</span><h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-[var(--musse-text)] md:text-5xl">Semua yang kamu butuhin buat <span className="text-[var(--musse-lime)]">TKA.</span></h2><p className="mt-4 text-[var(--musse-muted)]">Satu aplikasi untuk latihan, memahami pola salah, dan datang ke hari-H dengan lebih siap.</p></div><div className="mt-12 grid gap-5 lg:grid-cols-3">{coreFeatures.map((feature, index) => <article key={feature.title} className={`overflow-hidden rounded-3xl border border-white/10 bg-[var(--musse-card)] p-5 ${index === 1 ? 'lg:-translate-y-5' : ''}`}><span className="text-xs font-bold text-[var(--musse-lime)]">0{index + 1}</span><h3 className="mt-5 text-xl font-extrabold leading-tight text-[var(--musse-text)]">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--musse-muted)]">{feature.desc}</p><div className="mt-6 rounded-2xl bg-[#0B0F1A] p-3"><FeatureVisual type={feature.visual} /></div></article>)}</div><div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">{utilityFeatures.map((feature) => <article key={feature.title} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:border-[var(--musse-lime)]/50 hover:bg-white/[0.06]"><div className="flex size-9 items-center justify-center rounded-xl bg-[var(--musse-lime)]/10 text-[var(--musse-lime)]"><LucideIcon name={feature.icon} /></div><h3 className="mt-4 text-sm font-bold leading-tight text-[var(--musse-text)]">{feature.title}</h3><p className="mt-2 text-xs leading-5 text-[var(--musse-muted)]">{feature.desc}</p></article>)}</div></div></section>
}
