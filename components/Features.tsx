import AnimatedIcon from './AnimatedIcon'

const coreFeatures = [
  { title: 'Pembahasan langkah demi langkah', desc: 'Tiap soal ada pembahasan AI yang jelas, bukan cuma kunci jawaban.', visual: 'pembahasan' },
  { title: 'AI Chat yang paham konteks soal', desc: 'Nanya soal nomor berapa pun, AI ngerti soal mana yang kamu maksud.', visual: 'ai-chat' },
  { title: 'Autopsi kelemahan', desc: 'AI bedah hasil tryout-mu: salah karena terburu-buru, salah konsep, atau apa.', visual: 'autopsi' },
]

const utilityFeatures: { title: string; desc: string; visual: string }[] = [
  { title: '27 mapel', desc: 'SMA sampai mapel kejuruan SMK.', visual: 'mapel' },
  { title: 'Benar/salah langsung', desc: 'Tahu hasil tanpa menunggu.', visual: 'benar-salah' },
  { title: 'Ruang AI per mapel', desc: 'Diskusi khusus tiap mapel.', visual: 'ai-room' },
  { title: 'Pendamping Belajar TKA dengan AI', desc: 'Pola belajarmu dibaca otomatis.', visual: 'pendamping' },
  { title: 'Progres belajar', desc: 'Perkembanganmu selalu terlihat.', visual: 'progres' },
  { title: 'Misi harian', desc: 'Tantangan fokus setiap hari.', visual: 'misi' },
  { title: 'Tryout simulasi', desc: 'Latihan persis seperti hari-H.', visual: 'tryout' },
  { title: 'Streak', desc: 'Jaga ritme belajar beruntun.', visual: 'streak' },
  { title: 'Countdown TKA', desc: 'Tahu berapa hari menuju hari-H.', visual: 'countdown' },
  { title: 'Mode latihan vs simulasi', desc: 'Santai belajar atau uji mental.', visual: 'mapel' },
]

export default function Features() {
  return <section id="fitur" className="border-b border-[#111111] bg-[var(--musse-bg)]"><div className="mx-auto max-w-6xl px-5 py-16 md:py-24"><div className="max-w-2xl"><span className="inline-block bg-[var(--musse-lime)] px-2 py-0.5 text-xs font-black uppercase tracking-widest text-[#10150b]">Fitur inti</span><h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-[var(--musse-text)] md:text-5xl">Semua yang kamu butuhin buat <span className="text-[var(--musse-indigo)]">TKA.</span></h2><p className="mt-4 text-[var(--musse-muted)]">Satu aplikasi untuk latihan, memahami pola salah, dan datang ke hari-H dengan lebih siap.</p></div><div className="core-features-carousel mt-8 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 lg:mt-12 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible">{coreFeatures.map((feature, index) => <article key={feature.title} className={`group min-w-[88%] snap-center overflow-hidden rounded-3xl md:min-w-0 border border-[#111111] bg-[var(--musse-card)] p-5 ${index === 1 ? 'lg:-translate-y-5' : ''}`}><span className="text-xs font-bold text-[var(--musse-indigo)]">0{index + 1}</span><h3 className="mt-5 text-xl font-extrabold leading-tight text-[var(--musse-text)]">{feature.title}</h3><p className="mt-2 text-sm leading-6 text-[var(--musse-muted)]">{feature.desc}</p><div className="mt-6 rounded-2xl bg-[#F1F1EC] p-3"><AnimatedIcon type={feature.visual} /></div></article>)}</div><div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3 lg:mt-6 lg:grid-cols-5">{utilityFeatures.map((feature) => <article key={feature.title} className="group rounded-2xl border border-[#111111] bg-white p-4 transition hover:border-[var(--musse-lime)]/50 hover:bg-white/[0.06]"><AnimatedIcon type={feature.visual} /><h3 className="mt-3 text-sm font-bold leading-tight text-[var(--musse-text)]">{feature.title}</h3><p className="mt-1 text-sm leading-5 text-[var(--musse-muted)]">{feature.desc}</p></article>)}</div></div></section>
}
