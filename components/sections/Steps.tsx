import { Chip } from '../ui'

const steps = [
  { n: '1', title: 'Login pakai Google', desc: '10 detik. Pilih akun, langsung masuk.' },
  { n: '2', title: 'Kerjain paket soal', desc: 'Pilih mapel, kerjain dengan timer kayak hari-H.' },
  { n: '3', title: 'Lihat kelemahanmu', desc: 'AI bedah hasilmu dan kasih tau apa yang harus diperbaiki.' },
]

function StepCard({ n, title, desc }: { n: string; title: string; desc: string }) {
  const highlighted = n === '2'
  return (
    <div
      className={`card-hover rounded-2xl p-6 transition-transform ${
        highlighted ? 'card-framed-lime text-[#10150b]' : 'card-framed text-[var(--musse-text)]'
      }`}
    >
      <div className={`text-4xl font-bold ${highlighted ? 'text-[#10150b]' : 'text-[var(--musse-indigo)]'}`}>
        {n}
      </div>
      <h3 className="mt-10 font-bold">{title}</h3>
      <p className={`mt-2 text-[15px] leading-6 ${highlighted ? 'text-[#26320c]' : 'text-[var(--musse-muted)]'}`}>
        {desc}
      </p>
    </div>
  )
}

export default function Steps() {
  return (
    <section className="border-b border-[#111111] bg-[var(--musse-bg)]">
      <div className="mx-auto max-w-6xl px-5 py-12 md:py-24">
        <Chip>3 langkah</Chip>
        <h2 className="mt-4 text-3xl font-extrabold text-[var(--musse-text)] md:text-5xl">
          Mulai dari sini.
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
          {steps.map((s) => (
            <StepCard key={s.n} n={s.n} title={s.title} desc={s.desc} />
          ))}
        </div>
      </div>
    </section>
  )
}
