'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'

export default function Dashboard() {
  const router = useRouter()
  const [user, setUser] = useState<{ name?: string; email?: string; avatar?: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace('/')
        return
      }
      setUser({
        name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0],
        email: data.user.email,
        avatar: data.user.user_metadata?.avatar_url,
      })
      setLoading(false)
    })
  }, [router])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-white">
        <p className="text-neutral-500">Memuat...</p>
      </main>
    )
  }

  return (
    <main className="min-h-dvh bg-white">
      {/* Header minimal */}
      <header className="border-b border-[#EAEAEA]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
          <div className="text-xl font-extrabold text-[#004a2a]">musse</div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-neutral-700">Halo, {user?.name} 👋</span>
            <button
              onClick={handleLogout}
              className="rounded-md border border-[#EAEAEA] px-3 py-1.5 text-sm font-medium text-neutral-600"
            >
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Placeholder */}
      <div className="mx-auto max-w-3xl px-5 py-20 text-center">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-lg bg-[#F7F7F9] text-4xl">
          🚧
        </div>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-neutral-900">
          Dashboard lagi dibangun
        </h1>
        <p className="mt-2 text-neutral-600">
          Selamat datang, {user?.name}! Dashboard belajarmu sedang disiapin.
          <br />
          Sementara itu, latihan dulu di app lama yuk.
        </p>
        <a
          href="https://tka-master.up.railway.app/app"
          className="mt-8 inline-block rounded-md bg-[#004a2a] px-6 py-3 font-bold text-white"
        >
          Buka App Latihan →
        </a>
        <p className="mt-4 text-xs text-neutral-400">
          Login sebagai {user?.email}. Progres di app lama tetap kesimpen di akun Google yang sama.
        </p>
      </div>
    </main>
  )
}
