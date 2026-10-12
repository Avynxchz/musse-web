import { FeatureVisual } from './Mockups'

const features = [
  {
    title: 'Banyak mata pelajaran',
    desc: '27 mapel: Matematika, Bahasa, Fisika, Kimia, sampai mapel kejuruan SMK.',
    visual: 'mapel',
  },
  {
    title: 'Benar/salah langsung',
    desc: 'Jawab → langsung tahu benar atau salah. Nggak perlu nunggu.',
    visual: 'benar-salah',
  },
  {
    title: 'Pembahasan langkah per langkah',
    desc: 'Tiap soal ada pembahasan AI yang jelas, bukan cuma kunci jawaban.',
    visual: 'pembahasan',
  },
  {
    title: 'AI Chat paham konteks soal',
    desc: 'Nanya soal nomer berapa pun, AI ngerti soal mana yang kamu maksud.',
    visual: 'ai-chat',
  },
  {
    title: 'Ruang AI per mapel',
    desc: 'Ruang diskusi khusus tiap mapel. Mau dalami Fisika? Masuk ruangnya.',
    visual: 'ai-room',
  },
  {
    title: 'Pendamping Belajar AI',
    desc: 'AI nyatet pola belajarmu otomatis dan ngasih tau apa yang perlu diperbaiki.',
    visual: 'pendamping',
  },
  {
    title: 'Progres belajar',
    desc: 'Lihat perkembanganmu per mapel, per minggu. Yang naik kelihatan.',
    visual: 'progres',
  },
  {
    title: 'Autopsi kelemahan',
    desc: 'AI bedah hasil tryout-mu: salah karena terburu-buru, salah konsep, atau apa.',
    visual: 'autopsi',
  },
  {
    title: 'Misi harian',
    desc: 'Tiap hari ada tantangan fokus berdasarkan kelemahanmu kemarin.',
    visual: 'misi',
  },
  {
    title: 'Tryout simulasi',
    desc: 'Simulasi full persis kayak hari-H: timer, jumlah soal, suasana tegangnya.',
    visual: 'tryout',
  },
  {
    title: 'Streak harian',
    desc: 'Belajar beruntun tiap hari, streak-mu naik. Jangan sampai putus!',
    visual: 'streak',
  },
  {
    title: 'Countdown TKA',
    desc: 'Hitung mundur ke hari-H biar kamu nggak santai-santai amat.',
    visual: 'countdown',
  },
]

export default function Features() {
  return (
    <section className="border-b border-[#EAEAEA] bg-white">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-neutral-900 md:text-4xl">
          Semua yang kamu butuhin buat TKA
        </h2>
        <p className="mt-3 text-center text-lg text-neutral-600">Satu aplikasi, 12 senjata.</p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-[#EAEAEA] p-5 transition-all hover:-translate-y-1 hover:border-[#004a2a]/30 hover:shadow-lg"
            >
              <FeatureVisual type={f.visual} />
              <h3 className="mt-4 text-base font-bold text-neutral-900">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-neutral-600">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-xl border border-[#EAEAEA] bg-[#F7F7F9] p-6">
          <p className="font-bold text-neutral-900">🎯 Mode Latihan vs ⏱️ Mode Simulasi</p>
          <p className="mt-2 text-sm leading-relaxed text-neutral-600">
            Mode Latihan: santai, boleh tanya AI kapan aja. Mode Simulasi: timer ketat, tanpa
            bantuan — kayak ujian beneran.
          </p>
        </div>
      </div>
    </section>
  )
}
