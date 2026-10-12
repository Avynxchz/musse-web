'use client'

import { createClient } from '@/lib/supabase'

export function FinalCta() {
  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  return (
    <section className="border-b border-white/10 bg-[var(--musse-lime)]">
      <div className="mx-auto max-w-4xl px-5 py-20 text-center md:py-28"><p className="text-xs font-black uppercase tracking-[0.2em] text-[#42520d]">Sudah siap?</p><h2 className="mt-4 text-5xl font-black tracking-[-0.08em] text-[#10150b] md:text-7xl">Siap tempur TKA?</h2><p className="mx-auto mt-4 max-w-md text-sm leading-6 text-[#42520d]">100+ pelajar udah mulai. Giliran kamu — gratis.</p><button onClick={handleLogin} className="mt-8 rounded-full bg-[#10150b] px-7 py-4 text-sm font-extrabold text-[var(--musse-lime)] transition hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#10150b]">Masuk dengan Google — Gratis</button></div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="bg-[var(--musse-bg)]">
      <div className="mx-auto max-w-6xl px-5 py-10 md:py-14"><div className="flex flex-col gap-6 border-b border-white/10 pb-8 md:flex-row md:items-start md:justify-between"><div><div className="text-2xl font-black tracking-[-0.08em] text-[var(--musse-lime)]">musse<span className="text-white">.</span></div><p className="mt-3 max-w-xs text-xs leading-6 text-[var(--musse-muted)]">Platform latihan TKA untuk SMA/SMK sesuai kisi-kisi Kemendikbud 2026.</p></div><nav aria-label="Footer" className="flex gap-5 text-xs text-[var(--musse-muted)]"><a href="#fitur" className="transition hover:text-[var(--musse-lime)]">Fitur</a><a href="#harga" className="transition hover:text-[var(--musse-lime)]">Harga</a><a href="#faq" className="transition hover:text-[var(--musse-lime)]">FAQ</a></nav></div><p className="pt-6 text-xs text-[var(--musse-muted)]">© 2026 musse. Dibuat untuk pelajar Indonesia.</p></div>
    </footer>
  )
}
