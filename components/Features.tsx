const features = [
  {
    icon: '📚',
    title: 'Banyak mata pelajaran',
    desc: '27 mapel: Matematika, Bahasa, Fisika, Kimia, sampai mapel kejuruan SMK.',
    visual: 'grid mapel',
  },
  {
    icon: '⚡',
    title: 'Benar/salah langsung',
    desc: 'Jawab → langsung tahu benar atau salah. Nggak perlu nunggu.',
    visual: 'animasi jawab',
  },
  {
    icon: '💡',
    title: 'Pembahasan langkah per langkah',
    desc: 'Tiap soal ada pembahasan AI yang jelas, bukan cuma kunci jawaban.',
    visual: 'animasi pembahasan',
  },
  {
    icon: '🤖',
    title: 'AI Chat paham konteks soal',
    desc: 'Nanya soal nomer berapa pun, AI ngerti soal mana yang kamu maksud.',
    visual: 'animasi chat',
  },
  {
    icon: '💬',
    title: 'Ruang AI per mapel',
    desc: 'Ruang diskusi khusus tiap mapel. Mau dalami Fisika? Masuk ruangnya.',
    visual: 'mockup chat',
  },
  {
    icon: '🧠',
    title: 'Pendamping Belajar AI',
    desc: 'AI nyatet pola belajarmu otomatis dan ngasih tau apa yang perlu diperbaiki.',
    visual: 'mockup insight',
  },
  {
    icon: '📊',
    title: 'Progres belajar',
    desc: 'Lihat perkembanganmu per mapel, per minggu. Yang naik kelihatan.',
    visual: 'mockup grafik',
  },
  {
    icon: '🔍',
    title: 'Autopsi kelemahan',
    desc: 'AI bedah hasil tryout-mu: salah karena terburu-buru, salah konsep, atau apa.',
    visual: 'mockup autopsi',
  },
  {
    icon: '🎯',
    title: 'Misi harian',
    desc: 'Tiap hari ada tantangan fokus berdasarkan kelemahanmu kemarin.',
    visual: 'mockup misi',
  },
  {
    icon: '📝',
    title: 'Tryout simulasi',
    desc: 'Simulasi full persis kayak hari-H: timer, jumlah soal, suasana tegangnya.',
    visual: 'mockup tryout',
  },
  {
    icon: '🔥',
    title: 'Streak harian',
    desc: 'Belajar beruntun tiap hari, streak-mu naik. Jangan sampai putus!',
    visual: 'badge streak',
  },
  {
    icon: '📅',
    title: 'Countdown TKA',
    desc: 'Hitung mundur ke hari-H biar kamu nggak santai-santai amat.',
    visual: 'badge countdown',
  },
]

export default function Features() {
  return (
    <section className="border-b border-[#EAEAEA] bg-white">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-neutral-900">
          Semua yang kamu butuhin buat TKA
        </h2>
        <p className="mt-2 text-center text-neutral-600">Satu aplikasi, 12 senjata.</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="rounded-lg border border-[#EAEAEA] p-5">
              {/* Visual: mockup mini */}
              <div className="flex h-28 items-center justify-center rounded-md bg-[#F7F7F9] text-4xl">
                {f.icon}
              </div>
              <h3 className="mt-4 font-bold text-neutral-900">{f.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-lg border border-[#EAEAEA] bg-[#F7F7F9] p-5">
          <p className="text-sm font-bold text-neutral-900">🎯 Mode Latihan vs ⏱️ Mode Simulasi</p>
          <p className="mt-1 text-sm text-neutral-600">
            Mode Latihan: santai, boleh tanya AI kapan aja. Mode Simulasi: timer ketat, tanpa
            bantuan — kayak ujian beneran.
          </p>
        </div>
      </div>
    </section>
  )
}
