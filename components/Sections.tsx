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
    <section className="border-b border-[#EAEAEA] bg-white">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-neutral-900">
          Cara kerja
        </h2>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <div key={s.n} className="rounded-lg border border-[#EAEAEA] p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-[#004a2a] text-xl font-extrabold text-white">
                {s.n}
              </div>
              <h3 className="mt-4 font-bold text-neutral-900">{s.title}</h3>
              <p className="mt-1 text-sm text-neutral-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function Testimonials() {
  return (
    <section className="border-b border-[#EAEAEA] bg-[#F7F7F9]">
      <div className="mx-auto max-w-6xl px-5 py-16">
        <h2 className="text-center text-3xl font-extrabold tracking-tight text-neutral-900">
          Kata mereka yang udah pakai
        </h2>
        <p className="mt-2 text-center text-sm text-neutral-500">
          Dipercaya 100+ pelajar SMA/SMK
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {testimonials.map((t, i) => (
            <div key={i} className="rounded-lg border border-[#EAEAEA] bg-white p-6">
              <p className="text-sm text-neutral-700">"{t.text}"</p>
              <p className="mt-4 text-sm font-bold text-neutral-900">{t.name}</p>
              <p className="text-xs text-neutral-500">{t.detail}</p>
            </div>
          ))}
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
