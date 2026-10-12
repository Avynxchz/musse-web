const steps = [
  { n: '1', title: 'Login pakai Google', desc: '10 detik. Pilih akun, langsung masuk.' },
  { n: '2', title: 'Kerjain paket soal', desc: 'Pilih mapel, kerjain dengan timer kayak hari-H.' },
  { n: '3', title: 'Lihat kelemahanmu', desc: 'AI bedah hasilmu dan kasih tau apa yang harus diperbaiki.' },
]

const testimonials = [
  {
    text: 'Pembahasannya jelas banget, kayak dijelasin temen yang pinter. Autopsinya ngebantu tau aku lemah di mana.',
    name: 'Siswa SMA',
    detail: 'Pengguna musse',
  },
  {
    text: 'AI tutor-nya ngerti soal yang aku maksud tanpa harus copy-paste soal. Ngebantu pas belajar malem-malem.',
    name: 'Siswa SMK',
    detail: 'Pengguna musse',
  },
  {
    text: 'Tryout-nya bikin nggak kaget pas gladi bersih kemarin. Timer-nya persis kayak aslinya.',
    name: 'Siswa SMA',
    detail: 'Pengguna musse',
  },
]

const faqs = [
  {
    q: 'Kenapa harus login Google?',
    a: 'Biar progresmu tersimpan dan AI bisa personalisasi belajar. Tanpa login, nggak ada yang kesimpen.',
  },
  {
    q: 'Data apa yang diambil musse?',
    a: 'Cuma nama, email, dan foto profil dasar dari Google. Nggak nyentuh email, Drive, atau data Google lainnya.',
  },
  {
    q: 'Apakah data saya aman?',
    a: 'Ya. Data cuma dipakai buat progres belajarmu, nggak dijual atau dibagikan ke siapa pun.',
  },
  {
    q: 'Bisa hapus akun?',
    a: 'Bisa, kapan aja dari halaman Akun. Semua datamu ikut terhapus permanen.',
  },
  {
    q: 'Apakah benar-benar gratis?',
    a: 'Ya, gratis selama masa beta. Semua fitur bisa dipakai tanpa bayar.',
  },
  {
    q: 'Apakah sesuai kisi-kisi Kemendikbud 2026?',
    a: 'Ya. Bank soal disusun mengikuti kisi-kisi resmi 2026-2027 untuk SMA/SMK.',
  },
]

export function Steps() {
  return (
    <section className="border-b border-white/10 bg-[var(--musse-bg)]">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <span className="inline-block bg-[var(--musse-lime)] px-2 py-0.5 text-xs font-black uppercase tracking-widest text-[#10150b]">3 langkah</span>
        <h2 className="mt-4 text-3xl font-extrabold tracking-[-0.04em] text-[var(--musse-text)] md:text-5xl">Mulai dari sini.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className={`rounded-3xl border p-6 ${s.n === '2' ? 'border-[var(--musse-lime)] bg-[var(--musse-lime)] text-[#10150b]' : 'border-white/10 bg-[var(--musse-card)] text-[var(--musse-text)]'}`}>
              <div className={`text-4xl font-black ${s.n === '2' ? 'text-[#10150b]' : 'text-[var(--musse-lime)]'}`}>{s.n}</div>
              <h3 className="mt-10 font-bold">{s.title}</h3>
              <p className={`mt-2 text-sm leading-6 ${s.n === '2' ? 'text-[#26320c]' : 'text-[var(--musse-muted)]'}`}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Testimonials() {
  return (
    <section className="border-b border-white/10 bg-[#0d1322]">
      <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
        <span className="inline-block bg-[var(--musse-lime)] px-2 py-0.5 text-xs font-black uppercase tracking-widest text-[#10150b]">Kata mereka</span>
        <h2 className="mt-4 max-w-xl text-3xl font-extrabold tracking-[-0.04em] text-[var(--musse-text)] md:text-5xl">Belajar jadi lebih <span className="text-[var(--musse-lime)]">terarah.</span></h2>
        <p className="mt-3 text-sm text-[var(--musse-muted)]">Dipercaya 100+ pelajar SMA/SMK</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {testimonials.map((t, i) => <div key={i} className="rounded-3xl border border-white/10 bg-[var(--musse-card)] p-6"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-full bg-[var(--musse-lime)] text-sm font-black text-[#10150b]">{t.name.split(' ').map((word) => word[0]).join('').slice(0, 2)}</div><div><p className="text-sm font-bold text-[var(--musse-text)]">{t.name}</p><p className="text-xs text-[var(--musse-muted)]">{t.detail}</p></div></div><p className="mt-6 text-sm leading-7 text-[var(--musse-text)]">&quot;{t.text}&quot;</p></div>)}
        </div>
      </div>
    </section>
  )
}

export function Pricing() {
  return (
    <section className="border-b border-[#EAEAEA] bg-white">
      <div className="mx-auto max-w-4xl px-5 py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-neutral-900">Harga</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          <div className="rounded-lg border border-[#EAEAEA] p-6">
            <h3 className="font-bold text-neutral-900">Gratis</h3>
            <p className="mt-2">
              <span className="text-3xl font-extrabold text-neutral-900">Rp0</span>
              <span className="text-sm text-neutral-500">/selamanya</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-neutral-700">
              <li>✅ Semua soal & pembahasan</li>
              <li>✅ 5 tanya AI Tutor per hari</li>
              <li>✅ Simulasi dengan timer</li>
            </ul>
          </div>
          <div className="rounded-lg border-2 border-[#004a2a] p-6">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-neutral-900">Pro</h3>
              <span className="rounded-md bg-[#004a2a] px-2 py-1 text-xs font-bold text-white">
                Gratis selama beta
              </span>
            </div>
            <p className="mt-2">
              <span className="text-lg font-bold text-neutral-400 line-through">Rp14.900</span>{' '}
              <span className="text-3xl font-extrabold text-neutral-900">Rp0</span>
              <span className="text-sm text-neutral-500">/bulan</span>
            </p>
            <ul className="mt-4 space-y-2 text-sm text-neutral-700">
              <li>✅ 100 tanya AI Tutor per hari</li>
              <li>✅ Semua fitur Gratis</li>
              <li>✅ Analisis Autopsi lengkap</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

export function Faq() {
  return (
    <section className="border-b border-[#EAEAEA] bg-white">
      <div className="mx-auto max-w-3xl px-5 py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-neutral-900">
          Pertanyaan umum
        </h2>
        <div className="mt-10 space-y-3">
          {faqs.map((f) => (
            <details key={f.q} className="rounded-lg border border-[#EAEAEA] p-4">
              <summary className="cursor-pointer font-bold text-neutral-900">{f.q}</summary>
              <p className="mt-2 text-sm text-neutral-600">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
