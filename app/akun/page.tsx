'use client';

import { useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

/* ================= Behavior log (dummy: console + counter) ================= */

interface LogEntry {
  id: number;
  event: string;
  ts: string;
  payload: Record<string, unknown>;
}

let logId = 1;

/* ================= Komponen kecil ================= */

function NeoBtn({
  children,
  onClick,
  className = '',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border-2 border-[#111] shadow-[0_3px_0_#111] active:translate-y-[2px] active:shadow-[0_1px_0_#111] transition-all font-extrabold ${className}`}
    >
      {children}
    </button>
  );
}

function BottomNav({ active }: { active: 'latihan' | 'ruang' | 'akun' }) {
  const router = useRouter();
  const items = [
    { key: 'latihan', icon: '📝', label: 'Latihan', href: '/beranda' },
    { key: 'ruang', icon: '🧠', label: 'Ruang & Progres', href: '/ruang' },
    { key: 'akun', icon: '👤', label: 'Akun', href: '/akun' },
  ] as const;
  return (
    <nav className="bg-white border-t-2 border-[#111] px-6 py-2 flex items-center justify-around shrink-0 sticky bottom-0 z-20">
      {items.map((it) => {
        const on = active === it.key;
        return (
          <button
            key={it.key}
            type="button"
            onClick={() => {
              if (!on) router.push(it.href);
            }}
            className={`flex flex-col items-center gap-0.5 ${on ? 'text-[#111] font-extrabold' : 'text-neutral-500 font-bold'}`}
          >
            <span
              className={
                on
                  ? 'bg-[#B6FF00] border-2 border-[#111] px-3 py-0.5 rounded-full text-xs'
                  : 'px-3 py-0.5 text-xs'
              }
            >
              {it.icon}
            </span>
            <span className="text-[11px]">{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

/* ================= Halaman ================= */

export default function AkunPage() {
  const router = useRouter();

  const [tanggalTKA, setTanggalTKA] = useState('26 Okt 2026');
  const [modalTanggalOpen, setModalTanggalOpen] = useState(false);
  const [inputTanggal, setInputTanggal] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogPanel, setShowLogPanel] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const logEvent = useCallback((event: string, payload: Record<string, unknown> = {}) => {
    const entry: LogEntry = {
      id: logId++,
      event,
      ts: new Date().toLocaleTimeString('id-ID'),
      payload,
    };
    setLogs((prev) => [entry, ...prev].slice(0, 100));
    console.log('[akun]', event, payload);
  }, []);

  const showToastMsg = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
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
    <div className="min-h-screen bg-[#18181B] flex justify-center">
      <div className="relative w-full max-w-[430px] min-h-screen bg-[#FAFAF7] flex flex-col sm:border-x-2 sm:border-[#111] overflow-hidden">
        {/* ===== Header ===== */}
        <header className="bg-white border-b-2 border-[#111] px-4 py-3 flex items-center justify-between shrink-0">
          <h2 className="text-base font-extrabold">Akun & Pengaturan</h2>
          <button
            type="button"
            onClick={() => setShowLogPanel((v) => !v)}
            className="text-[11px] font-extrabold bg-[#B6FF00] border-2 border-[#111] rounded-full px-2.5 py-1"
            title="Behavior log"
          >
            📡 {logs.length}
          </button>
        </header>

        {/* ===== Konten scroll ===== */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">
          {/* Kartu profil */}
          <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-4 flex items-center gap-3 bg-white">
            <div className="w-12 h-12 rounded-full bg-[#B6FF00] border-2 border-[#111] flex items-center justify-center font-extrabold text-base shrink-0">
              AG
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-extrabold truncate">Agus Alfiansyah Putra</h3>
              <p className="text-xs text-neutral-500">agus@gmail.com · Terhubung Google</p>
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
            className="w-full border-2 border-[#111] shadow-[0_3px_0_#111] active:translate-y-[2px] active:shadow-[0_1px_0_#111] transition-all bg-red-100 text-red-900 font-extrabold py-3 rounded-xl text-xs"
          >
            Keluar dari Akun Google
          </button>

          <p className="text-center text-[11px] text-neutral-400">
            Data dummy — profil & pengaturan nyata menyusul setelah konek backend.
          </p>
        </div>

        {/* ===== Bottom nav ===== */}
        <BottomNav active="akun" />

        {/* ===== Modal tanggal custom ===== */}
        {modalTanggalOpen && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
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
        {toast && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 bg-[#111] text-white border-2 border-[#B6FF00] px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap">
            {toast}
          </div>
        )}

        {/* ===== Panel behavior log ===== */}
        {showLogPanel && (
          <div className="absolute inset-0 z-50 bg-[#111]/95 text-white flex flex-col p-4">
            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-[#B6FF00] text-[#111] px-2 py-0.5 rounded">
                  Telemetry
                </span>
                <h3 className="text-sm font-extrabold mt-1">Behavior Log</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowLogPanel(false)}
                className="bg-white/10 px-2.5 py-1 rounded-lg text-xs font-bold"
              >
                Tutup ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto mt-3 space-y-2 font-mono text-[11px]">
              {logs.length === 0 && <p className="text-white/50">Belum ada event. Klik-klik dulu…</p>}
              {logs.map((l) => (
                <div key={l.id} className="bg-white/5 border border-white/15 rounded-lg p-2.5">
                  <div className="flex justify-between text-[#B6FF00] font-bold">
                    <span>[{l.event}]</span>
                    <span className="text-white/50">{l.ts}</span>
                  </div>
                  <div className="text-white/80 mt-1 break-all">{JSON.stringify(l.payload)}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
