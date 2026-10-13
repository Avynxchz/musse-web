'use client'

import { useGoogleLogin } from '@/lib/useGoogleLogin'

export function FinalCta() {
  const handleLogin = useGoogleLogin()

  return (
    <section id="closing-cta" className="border-b border-[#111111] bg-[#111111]">
      <div className="mx-auto max-w-4xl px-5 py-20 text-center md:py-28"><p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">Sudah siap?</p><h2 className="font-pixel mt-4 text-3xl text-white md:text-5xl">Siap tempur TKA?</h2><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-white/80">100+ pelajar udah mulai. Giliran kamu — gratis.</p><button onClick={handleLogin} className="mt-8 rounded-full bg-[var(--musse-lime)] px-7 py-4 text-sm font-bold text-[#111111] shadow-[0_4px_0_#111111] transition hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#10150b]">Masuk dengan Google — Gratis</button></div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="bg-[var(--musse-bg)]">
      <div className="mx-auto max-w-6xl px-5 py-10 md:py-14"><div className="flex flex-col gap-6 border-b border-[#111111] pb-8 md:flex-row md:items-start md:justify-between"><div><div className="text-2xl font-bold text-[#111111]">musse<span className="text-[#111111]">.</span></div><p className="mt-3 max-w-xs text-xs leading-6 text-[var(--musse-muted)]">Platform latihan TKA untuk SMA/SMK sesuai kisi-kisi Kemendikbud 2026.</p></div><nav aria-label="Footer" className="flex gap-5 text-xs font-bold text-[var(--musse-muted)]"><a href="#fitur" className="transition hover:text-[#111111]">Fitur</a><a href="#harga" className="transition hover:text-[#111111]">Harga</a><a href="#faq" className="transition hover:text-[#111111]">FAQ</a></nav></div><p className="pt-6 text-xs text-[var(--musse-muted)]">© 2026 musse. Dibuat untuk pelajar Indonesia.</p></div>
    </footer>
  )
}
