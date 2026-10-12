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
    <section className="border-b border-[#EAEAEA] bg-[#004a2a]">
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <h2 className="text-3xl font-extrabold tracking-tight text-white">
          Siap tempur TKA?
        </h2>
        <p className="mt-2 text-white/80">
          100+ pelajar udah mulai. Giliran kamu — gratis.
        </p>
        <button
          onClick={handleLogin}
          className="mt-8 rounded-md bg-white px-8 py-4 text-base font-bold text-[#004a2a] hover:bg-neutral-100"
        >
          Masuk dengan Google — Gratis
        </button>
      </div>
    </section>
  )
}

export function Footer() {
  return (
    <footer className="bg-white">
      <div className="mx-auto max-w-6xl px-5 py-10">
        <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
          <div className="text-xl font-extrabold text-[#004a2a]">musse</div>
          <p className="text-xs text-neutral-500">
            Sesuai kisi-kisi Kemendikbud 2026. Platform latihan TKA untuk SMA/SMK.
          </p>
        </div>
        <p className="mt-6 text-center text-xs text-neutral-400">
          © 2026 musse. Dibuat dengan 💚 untuk pelajar Indonesia.
        </p>
      </div>
    </footer>
  )
}
