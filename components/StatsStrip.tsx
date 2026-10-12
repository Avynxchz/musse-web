const stats = [
  { value: '990+', label: 'soal TKA' },
  { value: '27', label: 'mapel SMA/SMK' },
  { value: '100+', label: 'pelajar mulai' },
]

export default function StatsStrip() {
  return (
    <section aria-label="Statistik musse" className="border-b border-white/[0.08] bg-[var(--musse-bg)]">
      <div className="mx-auto grid max-w-6xl gap-3 px-5 py-5 sm:grid-cols-3 sm:gap-4 lg:px-8">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/[0.08] bg-[var(--musse-card)] px-5 py-4 shadow-[0_12px_40px_rgba(0,0,0,0.16)]">
            <p className="text-2xl font-extrabold tracking-tight text-[var(--musse-lime)]">{stat.value}</p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-[var(--musse-muted)]">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
