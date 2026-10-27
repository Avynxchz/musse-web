'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { createClient } from '../../lib/supabase';
import {
  BottomNav,
  LogCounter,
  LogPanel,
  NeoBtn,
  Toast,
  useBehaviorLog,
  useToast,
} from '../components/ui';

/* ================= Halaman ================= */

export default function AkunPage() {
  const router = useRouter();

  const [tanggalTKA, setTanggalTKA] = useState('26 Okt 2026');
  const [modalTanggalOpen, setModalTanggalOpen] = useState(false);
  const [inputTanggal, setInputTanggal] = useState('');
  const [userName, setUserName] = useState('Pengguna');
  const [userEmail, setUserEmail] = useState('');
  const { toast, showToastMsg } = useToast();
  const { logs, logEvent, showLogPanel, setShowLogPanel } = useBehaviorLog('akun');

  // Page view logging
  useEffect(() => {
    logEvent('page_view', { page: 'akun' });
  }, []);

  // Nama & email profil dari akun Google yang login (bukan hardcode)
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUserName(user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'Pengguna');
        setUserEmail(user.email || '');
      }
    });
  }, []);

  const bukaModalTanggal = () => {
    setInputTanggal('');
    setModalTanggalOpen(true);
    logEvent('tka_date_modal_open', {});
  };

  const simpanTanggal = () => {
    const v = inputTanggal.trim();
    if (v) {
      setTanggalTKA(v);
      logEvent('tka_date_update', { new_date: v });
      showToastMsg(`🎯 Target TKA: ${v}`);
    }
    setModalTanggalOpen(false);
  };

  return (
    <div className="min-h-dvh bg-[#18181B] flex justify-center">
      <div className="relative w-full max-w-[430px] md:max-w-none min-h-dvh bg-[#FAFAF7] flex flex-col md:flex-row sm:border-x-2 md:border-x-0 sm:border-[#111] overflow-hidden md:overflow-visible">
        {/* ===== Sidebar Kiri Desktop (md:+) ===== */}
        <DesktopSidebar active="akun" />

        {/* ===== Kolom Utama Konten ===== */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* ===== Header ===== */}
          <header className="bg-white border-b-2 border-[#111] px-4 md:px-8 py-3 md:py-4 flex items-center justify-between shrink-0 md:sticky md:top-0 md:z-20">
            <h2 className="text-base md:text-lg font-extrabold">Akun & Pengaturan</h2>
            <LogCounter count={logs.length} onClick={() => setShowLogPanel((v) => !v)} />
          </header>

          {/* ===== Konten scroll ===== */}
          <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 md:space-y-0 pb-8 md:grid md:grid-cols-2 md:gap-6 md:content-start md:max-w-4xl">
          {/* Kartu profil */}
          <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-4 flex items-center gap-3 bg-white">
            <div className="w-12 h-12 rounded-full bg-[#B6FF00] border-2 border-[#111] flex items-center justify-center font-extrabold text-base shrink-0">
              {userName.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase() || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-extrabold truncate">{userName}</h3>
              <p className="text-xs text-neutral-500">{userEmail ? `${userEmail} · Terhubung Google` : 'Terhubung Google'}</p>
              <span className="inline-block mt-1 bg-[#E0E7FF] border border-[#111] px-2 py-0.5 rounded text-[10px] font-extrabold">
                Kuota AI: 24 / 25 Tersisa Hari Ini
              </span>
            </div>
          </div>

          {/* Kartu pengaturan */}
          <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-4 space-y-3 text-xs bg-white">
            <div className="flex items-center justify-between gap-2">
              <span className="font-bold">Tanggal Target Ujian TKA</span>
              <NeoBtn onClick={bukaModalTanggal} className="bg-[#B6FF00] px-2.5 py-1 rounded-lg">
                {tanggalTKA}
              </NeoBtn>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-200">
              <span className="font-bold">Mapel Pilihan di Beranda</span>
              <NeoBtn
                onClick={() => {
                  logEvent('akun_atur_mapel_click', {});
                  showToastMsg('⚙️ Atur mapel di Beranda ya');
                  router.push('/beranda');
                }}
                className="bg-[#E0E7FF] px-2.5 py-1 rounded-lg"
              >
                ⚙️ Atur Mapel
              </NeoBtn>
            </div>
            <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-200">
              <span className="font-bold">Ukuran Teks Soal Default</span>
              <NeoBtn
                onClick={() => {
                  logEvent('akun_font_scale_click', {});
                  showToastMsg('🔤 Ukuran teks diatur di Arena Soal');
                }}
                className="bg-white px-2.5 py-1 rounded-lg"
              >
                100% (Normal)
              </NeoBtn>
            </div>
          </div>

          {/* Tombol keluar */}
          <button
            type="button"
            onClick={() => {
              logEvent('akun_logout_click', {});
              showToastMsg('🚪 Ini dummy — belum logout beneran');
            }}
            className="w-full md:col-span-2 border-2 border-[#111] shadow-[0_3px_0_#111] active:translate-y-[2px] active:shadow-[0_1px_0_#111] transition-all bg-red-100 text-red-900 font-extrabold py-3 rounded-xl text-xs"
          >
            Keluar dari Akun Google
          </button>

          <p className="text-center text-[11px] text-neutral-400 md:col-span-2">
            Data dummy — profil & pengaturan nyata menyusul setelah konek backend.
          </p>

          <p className="text-center text-[10px] text-neutral-400 leading-relaxed px-2 md:col-span-2">
            Kami mencatat pola penggunaan (halaman dibuka, fitur dipakai) untuk
            meningkatkan app. Tidak ada data pribadi yang dibagikan.
          </p>
        </div>

        {/* ===== Bottom nav (Hanya tampil di Mobile) ===== */}
        <div className="h-20 shrink-0 md:hidden" />
        <div className="md:hidden">
          <BottomNav active="akun" />
        </div>

        {/* ===== Modal tanggal custom ===== */}
        {modalTanggalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
            <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-5 bg-white w-full max-w-[300px] text-center">
              <div className="text-3xl mb-2">📅</div>
              <p className="text-sm font-bold text-[#111] mb-3">Target tanggal TKA (cth: 26 Okt 2026)</p>
              <input
                type="text"
                value={inputTanggal}
                onChange={(e) => setInputTanggal(e.target.value)}
                placeholder="26 Okt 2026"
                className="w-full border-2 border-[#111] rounded-xl px-3 py-2 text-sm mb-3"
              />
              <div className="flex gap-2">
                <NeoBtn onClick={simpanTanggal} className="flex-1 bg-[#B6FF00] py-2.5 rounded-xl text-xs">
                  OK
                </NeoBtn>
                <NeoBtn
                  onClick={() => setModalTanggalOpen(false)}
                  className="flex-1 bg-white py-2.5 rounded-xl text-xs"
                >
                  Batal
                </NeoBtn>
              </div>
            </div>
          </div>
        )}

        {/* ===== Toast ===== */}
        <Toast message={toast} className="bottom-20" />

        {/* ===== Panel behavior log ===== */}
        {showLogPanel && (
          <LogPanel
            logs={logs}
            onClose={() => setShowLogPanel(false)}
            badge="Telemetry"
            title="Behavior Log"
          />
        )}
        </div>
      </div>
    </div>
  );
}
