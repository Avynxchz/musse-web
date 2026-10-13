import { Chip } from '../ui'
import { FAQS } from '@/content/faq'

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="card-framed group rounded-2xl px-5 py-4">
      <summary className="cursor-pointer list-none pr-8 text-sm font-bold text-[var(--musse-text)] marker:hidden">
        {q}
        <span
          className="float-right text-xl font-normal text-[var(--musse-indigo)] transition-transform group-open:rotate-45"
          aria-hidden="true"
        >
          +
        </span>
      </summary>
      <p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--musse-muted)]">{a}</p>
    </details>
  )
}

export default function Faq() {
  return (
    <section id="faq" className="border-b border-[#111111] bg-[var(--musse-section)]">
      <div className="mx-auto max-w-3xl px-5 py-12 md:py-24">
        <Chip>FAQ</Chip>
        <h2 className="mt-4 text-3xl font-extrabold text-[var(--musse-text)] md:text-5xl">
          Pertanyaan yang sering muncul.
        </h2>
        <div className="mt-10 flex flex-col gap-4">
          {FAQS.map((f) => (
            <FaqItem key={f.q} q={f.q} a={f.a} />
          ))}
        </div>
      </div>
    </section>
  )
}
