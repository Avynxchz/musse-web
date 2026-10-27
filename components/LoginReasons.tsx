import { Chip } from './landing-ui'
import { REASONS } from '@/content/login-reasons'

function ReasonCard({ number, title, desc, highlighted }: {
  number: string
  title: string
  desc: string
  highlighted: boolean
}) {
  return (
    <article
      className={`card-hover min-h-[200px] min-w-[88%] snap-center rounded-2xl p-6 transition-transform sm:min-w-[75%] md:min-w-0 ${
        highlighted ? 'card-framed-lime text-[#11160a]' : 'card-framed text-[var(--musse-text)]'
      }`}
    >
      <p className={`text-4xl font-bold ${highlighted ? 'text-[#476900]' : 'text-[var(--musse-indigo)]'}`}>
        {number}
      </p>
      <h3 className="mt-10 text-lg font-bold leading-snug">{title}</h3>
      <p className={`mt-3 text-[15px] leading-6 ${highlighted ? 'text-[#33420f]' : 'text-[var(--musse-muted)]'}`}>
        {desc}
      </p>
      {highlighted && (
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.14em]">
          Makin siap, makin pede →
        </p>
      )}
    </article>
  )
}

export default function LoginReasons() {
  return (
    <section className="border-b border-[#111111] bg-[var(--musse-bg)]">
      <div className="mx-auto max-w-6xl px-5 py-16 lg:px-8 lg:py-24">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--musse-indigo)]">
            Kenapa login?
          </p>
          <h2 className="mt-3 text-3xl font-extrabold leading-tight text-[var(--musse-text)] sm:text-5xl">
            Belajar lebih <span className="text-[var(--musse-indigo)]">personal</span>, tanpa ribet.
          </h2>
          <p className="mt-4 text-base leading-7 text-[var(--musse-muted)]">
            Tiga alasan kenapa 100+ pelajar login pakai Google:
          </p>
        </div>

        <div className="reasons-carousel mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 md:mt-10 md:grid md:grid-cols-3 md:gap-5 md:overflow-visible">
          {REASONS.map((reason, index) => (
            <ReasonCard
              key={reason.number}
              number={reason.number}
              title={reason.title}
              desc={reason.desc}
              highlighted={index === 1}
            />
          ))}
        </div>

        <div className="mt-2 flex justify-center gap-1.5 md:hidden" aria-label="Indikator alasan login">
          <span className="size-1.5 rounded-full bg-[#111111]" />
          <span className="size-1.5 rounded-full bg-[#111111]/30" />
          <span className="size-1.5 rounded-full bg-[#111111]/30" />
        </div>
      </div>
    </section>
  )
}
