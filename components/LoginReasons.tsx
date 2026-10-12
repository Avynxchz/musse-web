const reasons = [
  {
    icon: '📱',
    title: 'Progres ngikutin kamu',
    desc: 'Ganti HP atau laptop, nilai dan riwayat belajarmu tetap ada. Nggak ada yang hilang.',
  },
  {
    icon: '🧠',
    title: 'AI yang kenal kamu',
    desc: 'Makin sering latihan, AI makin paham kelemahanmu dan ngasih latihan yang tepat.',
  },
  {
    icon: '⚡',
    title: '10 detik, tanpa password',
    desc: 'Klik, pilih akun Google, langsung masuk. Nggak perlu daftar, nggak perlu ingat password.',
  },
]

export default function LoginReasons() {
  return (
    <section className="border-b border-[#EAEAEA] bg-white">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-neutral-900">
          Kenapa login?
        </h2>
        <p className="mt-2 text-center text-neutral-600">
          Tiga alasan kenapa 100+ pelajar login pakai Google:
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {reasons.map((r) => (
            <div key={r.title} className="rounded-lg border border-[#EAEAEA] bg-white p-6">
              <div className="text-3xl">{r.icon}</div>
              <h3 className="mt-3 text-lg font-bold text-neutral-900">{r.title}</h3>
              <p className="mt-2 text-sm text-neutral-600">{r.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
