'use client';

import { memo, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

export type DesktopNavKey = 'beranda' | 'ruang' | 'akun';

const NAV_ITEMS: ReadonlyArray<{ key: Exclude<DesktopNavKey, 'akun'>; icon: string; label: string; href: string }> = [
  { key: 'beranda', icon: '📚', label: 'Beranda', href: '/beranda' },
  { key: 'ruang', icon: '🧠', label: 'Ruang AI', href: '/ruang' },
];

const NAV_ACTIVE =
  'w-full border-2 border-[#111] shadow-[0_3px_0_#111] bg-[#B6FF00] text-[#111] px-3.5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2.5 text-left transition-all';
const NAV_IDLE =
  'w-full border-2 border-transparent hover:border-[#111] hover:bg-[#FAFAF7] text-neutral-700 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 text-left transition-all';

/**
 * Sidebar kiri KHUSUS DESKTOP (md:+) — dipakai bersama oleh Beranda, Ruang AI, dan Akun
 * supaya navigasi desktop konsisten. Markup & kelas sama dengan sidebar Beranda
 * (menu Beranda + Ruang AI, profil di bawah dengan popup akun ala Vercel).
 * Di mobile sidebar ini disembunyikan (`hidden`); mobile tetap memakai BottomNav.
 * `active="akun"` = halaman Akun (tidak ada item menu yang menyala; tombol profil jadi aktif).
 * `footerExtra` = slot opsional di bawah kartu profil (mis. chip streak/tanggal TKA milik Beranda).
 */
export const DesktopSidebar = memo(function DesktopSidebar({
  active,
  footerExtra,
}: {
  active: DesktopNavKey;
  footerExtra?: ReactNode;
}) {
  const router = useRouter();
  const [akunPopupOpen, setAkunPopupOpen] = useState(false);
  const [userName, setUserName] = useState('Pengguna');
  const [userEmail, setUserEmail] = useState('');
  const [userInitials, setUserInitials] = useState('?');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const fullName = user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Pengguna';
        setUserName(fullName);
        setUserEmail(user.email || '');
        const initials = fullName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
        setUserInitials(initials || '?');
      }
    });
  }, []);
  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 bg-white border-r-2 border-[#111] flex-col justify-between md:sticky md:top-0 md:h-dvh z-30">
      <div className="p-5 space-y-6">
        {/* Logo */}
        <div className="flex items-center gap-3 pb-4 border-b-2 border-[#111]">
          <div className="w-10 h-10 rounded-xl bg-[#B6FF00] border-2 border-[#111] shadow-[0_3px_0_#111] flex items-center justify-center font-extrabold text-base text-[#111] shrink-0">
            ⚡
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-extrabold text-[#111] tracking-tight leading-none">MUSSE</h1>
            <p className="text-[11px] font-bold text-neutral-500 mt-1 truncate">Arena Latihan TKA Resmi</p>
          </div>
        </div>

        {/* Menu Navigasi */}
        <nav className="space-y-2" aria-label="Menu Utama">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-400 px-1">
            Menu Navigasi
          </p>
          {NAV_ITEMS.map((it) => {
            const on = it.key === active;
            return (
              <button
                key={it.key}
                type="button"
                aria-current={on ? 'page' : undefined}
                onClick={() => {
                  if (!on) router.push(it.href);
                }}
                className={on ? NAV_ACTIVE : NAV_IDLE}
              >
                <span className="text-sm">{it.icon}</span>
                <span>{it.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Profil User di Bawah Sidebar - klik untuk popup akun */}
      <div className="p-4 border-t-2 border-[#111] bg-[#FAFAF7] space-y-3 relative">
        <button
          type="button"
          onClick={() => setAkunPopupOpen((v) => !v)}
          aria-expanded={akunPopupOpen}
          aria-current={active === 'akun' ? 'page' : undefined}
          className={`w-full flex items-center gap-2.5 rounded-xl border-2 hover:border-[#111] hover:bg-white px-2 py-1.5 -mx-2 text-left transition-all ${
            active === 'akun' ? 'border-[#111] bg-white' : 'border-transparent'
          }`}
        >
          <div className="w-9 h-9 rounded-full bg-[#B6FF00] border-2 border-[#111] flex items-center justify-center font-extrabold text-xs shrink-0">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold text-[#111] truncate">{userName} 👋</p>
            <p className="text-[11px] text-neutral-500 font-semibold truncate">Siap tempur hari ini</p>
          </div>
          <span className="text-neutral-400 text-xs">▲</span>
        </button>
        {/* Popup akun ala Vercel */}
        {akunPopupOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setAkunPopupOpen(false)} />
            <div className="absolute bottom-full left-2 right-2 mb-2 z-50 border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl bg-white overflow-hidden">
              <div className="p-4 border-b-2 border-[#111] bg-[#FAFAF7]">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-[#B6FF00] border-2 border-[#111] flex items-center justify-center font-extrabold text-sm shrink-0">
                    {userInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold truncate">{userName}</p>
                    <p className="text-xs text-neutral-500 truncate">{userEmail}</p>
                    <span className="inline-block mt-1 bg-[#B6FF00] border border-[#111] px-2 py-0.5 rounded text-[10px] font-extrabold">
                      Kuota AI: 24/25
                    </span>
                  </div>
                </div>
              </div>
              <div className="p-2">
                <button
                  type="button"
                  onClick={() => {
                    setAkunPopupOpen(false);
                    if (active !== 'akun') router.push('/akun');
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-xs font-bold text-left hover:bg-[#FAFAF7] flex items-center gap-2.5"
                >
                  <span>⚙️</span> Pengaturan Akun
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAkunPopupOpen(false);
                    router.push('/login');
                  }}
                  className="w-full px-3 py-2.5 rounded-xl text-xs font-extrabold text-left text-red-700 hover:bg-red-50 flex items-center gap-2.5"
                >
                  <span>🚪</span> Keluar
                </button>
              </div>
            </div>
          </>
        )}
        {footerExtra}
      </div>
    </aside>
  );
});
