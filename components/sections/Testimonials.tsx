import { Chip } from '../landing-ui'
import { TESTIMONIALS } from '@/content/testimonials'

function TestimonialCard({ text, name, detail }: {
  text: string
  name: string
  detail: string
}) {
  const initials = name.split(' ').map((word) => word[0]).join('').slice(0, 2)
  return (
    <div className="card-framed card-hover min-w-[88%] snap-center rounded-2xl p-6 transition-transform md:min-w-0">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-[var(--musse-lime)] text-sm font-bold text-[#10150b]">
          {initials}
        </div>
        <div>
          <p className="text-sm font-bold text-[var(--musse-text)]">{name}</p>
          <p className="text-xs text-[var(--musse-muted)]">{detail}</p>
        </div>
      </div>
      <p className="mt-6 text-[15px] leading-7 text-[var(--musse-text)]">&quot;{text}&quot;</p>
    </div>
  )
}

export default function Testimonials() {
  return (
    <section className="border-b border-[#111111] bg-[var(--musse-section)]">
      <div className="mx-auto max-w-6xl px-5 py-12 md:py-24">
        <Chip>Kata mereka</Chip>
        <h2 className="mt-4 max-w-xl text-3xl font-extrabold text-[var(--musse-text)] md:text-5xl">
          Belajar jadi lebih <span className="text-[var(--musse-indigo)]">terarah.</span>
        </h2>
        <p className="mt-3 text-sm text-[var(--musse-muted)]">Dipercaya 100+ pelajar SMA/SMK</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
          {TESTIMONIALS.map((t, i) => (
            <TestimonialCard key={i} text={t.text} name={t.name} detail={t.detail} />
          ))}
        </div>
      </div>
    </section>
  )
}
