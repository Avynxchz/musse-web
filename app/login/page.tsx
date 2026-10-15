'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toast, useToast } from '../components/ui';

/* ================= Halaman Login (dummy) ================= */

export default function LoginPage() {
  const router = useRouter();
  const { toast, showToastMsg } = useToast();
  const [loading, setLoading] = useState(false);
  const loginTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup: cegah router.push setelah unmount
  useEffect(() => {
    return () => {
      if (loginTimer.current) clearTimeout(loginTimer.current);
    };
  }, []);

  const logEvent = useCallback((event: string, payload: Record<string, unknown> = {}) => {
    console.log('[login]', event, payload);
  }, []);

  // Page view logging
  useEffect(() => {
    logEvent('page_view', { page: 'login' });
  }, []);

  const handleGoogleLogin = useCallback(() => {
    if (loading) return;
    setLoading(true);
    logEvent('auth_login_google_click', { mode: 'dummy' });
    showToastMsg('Login dummy — OAuth menyusul');
    // Dummy: jeda sebentar lalu masuk beranda
    if (loginTimer.current) clearTimeout(loginTimer.current);
    loginTimer.current = setTimeout(() => {
      logEvent('auth_login_google', { status: 'authenticated_dummy', quota_granted: 25 });
      router.push('/beranda');
    }, 900);
  }, [loading, logEvent, router, showToastMsg]);

  return (
    <div className="min-h-dvh bg-[#18181B] flex justify-center">
      <div className="relative w-full max-w-[430px] min-h-dvh bg-[#FAFAF7] flex flex-col sm:border-x-2 sm:border-[#111] overflow-hidden">
        {/* ===== Isi: header / hero / footer ===== */}
        <div className="flex-1 flex flex-col justify-between p-6 overflow-y-auto">
          {/* Logo + badge */}
          <div className="flex items-center justify-between">
            <span className="font-[var(--font-heading)] text-2xl font-extrabold tracking-tight">
              musse<span className="text-[#4F46E5]">.</span>
            </span>
            <span className="bg-[#B6FF00] border-2 border-[#111] shadow-[0_4px_0_#111] px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
              Beta Gratis 100%
            </span>
          </div>

          {/* Hero */}
          <div className="my-auto py-6">
            <div className="inline-block bg-[#E0E7FF] border-2 border-[#111] px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider mb-4">
              Persiapan TKA SMA/SMK 2026
            </div>
            <h1 className="font-[var(--font-heading)] text-4xl font-extrabold leading-[1.1] text-[#111] tracking-tight">
              Tahu Jawabannya.
              <br />
              <span className="underline decoration-[#B6FF00] decoration-[8px] underline-offset-4">
                Paham Polanya.
              </span>
            </h1>
            <p className="mt-3 text-sm text-neutral-600 leading-relaxed">
              990+ soal resmi 27 mapel Pusmendik, pembahasan 5 pilar langkah demi
              langkah, AI Tutor kontekstual, dan Guru Autopsi pendeteksi
              kebocoran skor.
            </p>

            {/* Kartu info */}
            <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-4 mt-6 bg-white">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="bg-[#B6FF00] border border-[#111] px-2 py-0.5 rounded-md">
                  🔥 Streak Otomatis
                </span>
                <span className="text-[#4F46E5]">✨ 25 Tanya AI / Hari</span>
              </div>
              <p className="mt-2.5 text-xs text-neutral-600 font-medium">
                Semua progres latihan, riwayat waktu per soal, dan diagnosis
                kelemahanmu langsung tersimpan aman di akun Google-mu.
              </p>
            </div>

            {/* Tombol login */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full mt-6 bg-[#B6FF00] hover:bg-[#c6ff33] disabled:opacity-70 border-2 border-[#111] shadow-[0_3px_0_#111] active:translate-y-[2px] active:shadow-[0_1px_0_#111] transition-all text-[#111] font-extrabold py-4 px-5 rounded-2xl flex items-center justify-center gap-3 text-sm"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.9-.1-1.5-.3-2.3H12v4.3h6.5c-.1 1.1-.8 2.7-2.4 3.8l3.6 2.8c2.3-2.1 3.8-5.2 3.8-8.6z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.8-2.9c-1 .7-2.4 1.2-4.1 1.2-3.1 0-5.8-2.1-6.8-5l-3.6 2.8C3.5 21.3 7.4 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.2 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4L1.6 6.8C.6 8.6 0 10.2 0 12s.6 3.4 1.6 4.9l3.6-2.5z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.7c1.8 0 3 .8 3.7 1.4l3.3-3.2C17.9 1.1 15.2 0 12 0 7.4 0 3.5 2.7 1.6 6.8l3.6 2.8c1-2.9 3.7-4.9 6.8-4.9z"
                />
              </svg>
              {loading ? 'Menghubungkan…' : 'Masuk dengan Google — Gratis'}
            </button>
            <p className="text-center text-[11px] text-neutral-500 mt-2.5">
              10 detik • Tanpa password • Semua fitur terbuka
            </p>
          </div>

          {/* Footer */}
          <div className="text-center text-[11px] text-neutral-400">
            © 2026 musse • Sesuai Kisi-Kisi TKA Kemendikdasmen
          </div>
        </div>

        {/* ===== Toast ===== */}
        <Toast message={toast} className="bottom-8" />
      </div>
    </div>
  );
}
