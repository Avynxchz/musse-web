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
    <section className="border-b border-[#111111] bg-[var(--musse-bg)]">
      <div className="mx-auto max-w-6xl px-5 py-12 md:py-24">
        <span className="inline-block bg-[var(--musse-lime)] px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-[#10150b]">3 langkah</span>
        <h2 className="mt-4 text-3xl font-extrabold text-[var(--musse-text)] md:text-5xl">Mulai dari sini.</h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
          {steps.map((s) => (
            <div key={s.n} className={`card-hover rounded-2xl p-6 transition-transform ${s.n === '2' ? 'card-framed-lime text-[#10150b]' : 'card-framed text-[var(--musse-text)]'}`}>
              <div className={`text-4xl font-bold ${s.n === '2' ? 'text-[#10150b]' : 'text-[var(--musse-indigo)]'}`}>{s.n}</div>
              <h3 className="mt-10 font-bold">{s.title}</h3>
              <p className={`mt-2 text-[15px] leading-6 ${s.n === '2' ? 'text-[#26320c]' : 'text-[var(--musse-muted)]'}`}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Testimonials() {
  return (
    <section className="border-b border-[#111111] bg-[var(--musse-section)]">
      <div className="mx-auto max-w-6xl px-5 py-12 md:py-24">
        <span className="inline-block bg-[var(--musse-lime)] px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-[#10150b]">Kata mereka</span>
        <h2 className="mt-4 max-w-xl text-3xl font-extrabold text-[var(--musse-text)] md:text-5xl">Belajar jadi lebih <span className="text-[var(--musse-indigo)]">terarah.</span></h2>
        <p className="mt-3 text-sm text-[var(--musse-muted)]">Dipercaya 100+ pelajar SMA/SMK</p>
        <div className="mt-10 grid gap-4 md:grid-cols-3 md:gap-5">
          {testimonials.map((t, i) => <div key={i} className="card-framed card-hover min-w-[88%] snap-center rounded-2xl p-6 transition-transform md:min-w-0"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-full bg-[var(--musse-lime)] text-sm font-bold text-[#10150b]">{t.name.split(' ').map((word) => word[0]).join('').slice(0, 2)}</div><div><p className="text-sm font-bold text-[var(--musse-text)]">{t.name}</p><p className="text-xs text-[var(--musse-muted)]">{t.detail}</p></div></div><p className="mt-6 text-[15px] leading-7 text-[var(--musse-text)]">&quot;{t.text}&quot;</p></div>)}
        </div>
      </div>
    </section>
  )
}

export function Pricing() {
  const freeFeatures = ['Semua soal & pembahasan', '5 tanya AI Tutor per hari', 'Simulasi dengan timer']
  const proFeatures = ['100 tanya AI Tutor per hari', 'Semua fitur Gratis', 'Analisis Autopsi lengkap']

  return (
    <section id="harga" className="border-b border-[#111111] bg-[var(--musse-bg)]">
      <div className="mx-auto max-w-5xl px-5 py-12 md:py-24">
        <div className="max-w-xl"><span className="inline-block bg-[var(--musse-lime)] px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-[#10150b]">Harga sederhana</span><h2 className="mt-4 text-3xl font-extrabold text-[var(--musse-text)] md:text-5xl">Mulai gratis. <span className="text-[var(--musse-indigo)]">Naik level</span> kapan saja.</h2></div>
        <div className="mt-10 grid gap-4 md:grid-cols-2 md:gap-5">
          <div className="card-framed card-hover rounded-2xl p-6 transition-transform md:p-8"><p className="text-xs font-bold uppercase tracking-widest text-[var(--musse-muted)]">Untuk mulai latihan</p><h3 className="mt-5 text-xl font-bold text-[var(--musse-text)]">Gratis</h3><p className="mt-3"><span className="text-4xl font-bold text-[var(--musse-text)]">Rp0</span><span className="text-sm text-[var(--musse-muted)]">/selamanya</span></p><ul className="mt-8 flex flex-col gap-3 text-[15px] text-[var(--musse-muted)]">{freeFeatures.map((feature) => <li key={feature} className="flex gap-3"><span className="text-[var(--musse-indigo)]" aria-hidden="true">•</span>{feature}</li>)}</ul></div>
          <div className="card-framed-lime card-hover relative overflow-hidden rounded-2xl p-6 text-[#10150b] transition-transform md:p-8"><span className="absolute right-5 top-5 rounded-full bg-[#10150b] px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[var(--musse-lime)]">Gratis selama beta</span><p className="text-xs font-bold uppercase tracking-widest text-[#42520d]">Untuk latihan lebih dalam</p><h3 className="mt-5 text-xl font-bold">Pro</h3><p className="mt-3"><span className="text-lg font-bold text-[#53631d] line-through">Rp14.900</span><span className="ml-2 text-4xl font-bold">Rp0</span><span className="text-sm text-[#42520d]">/bulan</span></p><ul className="mt-8 flex flex-col gap-3 text-[15px] text-[#26320c]">{proFeatures.map((feature) => <li key={feature} className="flex gap-3"><span className="font-bold" aria-hidden="true">•</span>{feature}</li>)}</ul></div>
        </div>
      </div>
    </section>
  )
}

export function Faq() {
  return (
    <section id="faq" className="border-b border-[#111111] bg-[var(--musse-section)]">
      <div className="mx-auto max-w-3xl px-5 py-12 md:py-24"><span className="inline-block bg-[var(--musse-lime)] px-2 py-0.5 text-xs font-bold uppercase tracking-widest text-[#10150b]">FAQ</span><h2 className="mt-4 text-3xl font-extrabold text-[var(--musse-text)] md:text-5xl">Pertanyaan yang sering muncul.</h2><div className="mt-10 flex flex-col gap-4">{faqs.map((f) => <details key={f.q} className="card-framed group rounded-2xl px-5 py-4"><summary className="cursor-pointer list-none pr-8 text-sm font-bold text-[var(--musse-text)] marker:hidden">{f.q}<span className="float-right text-xl font-normal text-[var(--musse-indigo)] transition-transform group-open:rotate-45" aria-hidden="true">+</span></summary><p className="mt-3 max-w-2xl text-[15px] leading-7 text-[var(--musse-muted)]">{f.a}</p></details>)}</div></div>
    </section>
  )
}
