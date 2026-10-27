'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Toast, useToast } from '../components/ui';
import { createClient } from '@/lib/supabase';

/* ================= Halaman Login (Google OAuth) ================= */

export default function LoginPage() {
  const router = useRouter();
  const { toast, showToastMsg } = useToast();
  const [loading, setLoading] = useState(false);

  // Log login dinonaktifkan (dulu console.log di sini).
  const logEvent = useCallback((_event: string, _payload: Record<string, unknown> = {}) => {}, []);

  // Page view logging + cek sesi yang sudah ada
  useEffect(() => {
    logEvent('page_view', { page: 'login' });
    // Kalau sudah login, langsung ke beranda
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.push('/beranda');
      }
    });
  }, [logEvent, router]);

  const handleGoogleLogin = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    logEvent('auth_login_google_click', { mode: 'oauth' });
    showToastMsg('Menghubungkan ke Google...');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        showToastMsg('Login gagal: ' + error.message);
        setLoading(false);
      }
      // Kalau sukses, browser redirect ke Google, jadi tidak perlu setLoading(false)
    } catch (e) {
      showToastMsg('Login gagal, coba lagi');
      setLoading(false);
    }
  }, [loading, logEvent, showToastMsg]);

  return (
    <div className="min-h-dvh bg-[#18181B] flex justify-center">
      <div className="relative w-full max-w-[430px] md:max-w-4xl min-h-dvh bg-[#FAFAF7] flex flex-col sm:border-x-2 sm:border-[#111] overflow-hidden">
        <div className="flex-1 flex flex-col justify-between p-6 md:p-10 overflow-y-auto">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-[#B6FF00] border-2 border-[#111] rounded-xl flex items-center justify-center font-black text-xl shadow-[0_4px_0_#111]">M</div>
              <span className="font-black text-xl tracking-tight">MUSSE</span>
            </div>
          </div>

          <div className="flex-1 flex flex-col justify-center py-10">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-3">
              Masuk ke <span className="bg-[#B6FF00] px-2 border-2 border-[#111] rounded-lg shadow-[0_4px_0_#111]">MUSSE</span>
            </h1>
            <p className="text-gray-600 mb-8">
              Latihan TKA dengan AI Tutor, analisis kelemahanmu langsung tersimpan aman di akun Google-mu.
            </p>

            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white border-2 border-[#111] rounded-2xl px-6 py-4 font-bold flex items-center justify-center gap-3 shadow-[0_4px_0_#111] hover:shadow-[0_2px_0_#111] hover:translate-y-[2px] transition-all disabled:opacity-50"
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              {loading ? 'Menghubungkan...' : 'Masuk dengan Google'}
            </button>

            <p className="text-center text-xs text-gray-500 mt-6">
              Dengan masuk, kamu setuju dengan Syarat & Ketentuan serta Kebijakan Privasi MUSSE.
            </p>
          </div>

          <div className="text-center text-xs text-gray-400">
            © 2026 MUSSE · Pendamping Belajar TKA dengan AI
          </div>
        </div>
      </div>
      {toast && <Toast message={toast} />}
    </div>
  );
}
