import { Chip } from '../landing-ui'
import { FREE_FEATURES, PRO_FEATURES } from '@/content/pricing'

function FeatureList({ features, accentClass }: { features: string[]; accentClass: string }) {
  return (
    <ul className="mt-8 flex flex-col gap-3 text-sm">
      {features.map((feature) => (
        <li key={feature} className="flex gap-3">
          <span className={accentClass} aria-hidden="true">•</span>
          {feature}
        </li>
      ))}
    </ul>
  )
}

export default function Pricing() {
  return (
    <section id="harga" className="border-b border-[#111111] bg-[var(--musse-bg)]">
      <div className="mx-auto max-w-5xl px-5 py-12 md:py-24">
        <div className="max-w-xl">
          <Chip>Harga sederhana</Chip>
          <h2 className="mt-4 text-3xl font-extrabold text-[var(--musse-text)] md:text-5xl">
            Mulai gratis. <span className="text-[var(--musse-indigo)]">Naik level</span> kapan saja.
          </h2>
        </div>

        <div className="mt-10 grid gap-4 md:grid-cols-2 md:gap-5">
          {/* Paket Gratis */}
          <div className="card-framed card-hover rounded-2xl p-6 transition-transform md:p-8">
            <p className="text-xs font-bold uppercase tracking-widest text-[var(--musse-muted)]">
              Untuk mulai latihan
            </p>
            <h3 className="mt-5 text-xl font-bold text-[var(--musse-text)]">Gratis</h3>
            <p className="mt-3">
              <span className="text-4xl font-bold text-[var(--musse-text)]">Rp0</span>
              <span className="text-sm text-[var(--musse-muted)]">/selamanya</span>
            </p>
            <div className="text-[var(--musse-muted)]">
              <FeatureList features={FREE_FEATURES} accentClass="text-[var(--musse-indigo)]" />
            </div>
          </div>

          {/* Paket Pro */}
          <div className="card-framed-lime card-hover relative overflow-hidden rounded-2xl p-6 text-[#10150b] transition-transform md:p-8">
            <span className="absolute right-5 top-5 rounded-full bg-[#10150b] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--musse-lime)]">
              Gratis selama beta
            </span>
            <p className="text-xs font-bold uppercase tracking-widest text-[#42520d]">
              Untuk latihan lebih dalam
            </p>
            <h3 className="mt-5 text-xl font-bold">Pro</h3>
            <p className="mt-3">
              <span className="text-lg font-bold text-[#53631d] line-through">Rp14.900</span>
              <span className="ml-2 text-4xl font-bold">Rp0</span>
              <span className="text-sm text-[#42520d]">/bulan</span>
            </p>
            <div className="text-[#26320c]">
              <FeatureList features={PRO_FEATURES} accentClass="font-bold" />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
