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

/* ================= Data dummy coach per mapel ================= */

const COACH_DATA: Record<string, { kuat: string; kuatPct: string; lemah: string; lemahPct: string; pesan: string }> = {
  matematika: {
    kuat: 'SPLDV & Matriks',
    kuatPct: '88%',
    lemah: 'Fungsi Kuadrat',
    lemahPct: '52%',
    pesan:
      'Halo Agus! Dari 2 paket terakhir, aljabar linearmu udah mantap. Tapi di Fungsi Kuadrat kamu sering lupa syarat titik puncak. Mau latihan sekarang?',
  },
  fisika: {
    kuat: 'Kinematika',
    kuatPct: '81%',
    lemah: 'Dinamika Rotasi',
    lemahPct: '47%',
    pesan:
      'Halo Agus! Gerak lurusmu rapi banget. Tapi soal torsi & momen inersia masih sering kepleset. Kita bedah bareng?',
  },
  tkj: {
    kuat: 'Subnetting Dasar',
    kuatPct: '90%',
    lemah: 'VLAN & Routing',
    lemahPct: '55%',
    pesan:
      'Halo Agus! Perhitungan subnet udah kenceng. Tapi konfigurasi VLAN antar-switch masih goyang. Mau simulasi lagi?',
  },
  inggris: {
    kuat: 'Reading Comprehension',
    kuatPct: '85%',
    lemah: 'Structure & Written Expression',
    lemahPct: '58%',
    pesan:
      'Halo Agus! Reading-mu stabil. Tapi soal structure (tenses & clause) masih jadi kebocoran. Latihan fokus 10 soal?',
  },
};

const MAPEL_OPTIONS = [
  { value: 'matematika', label: 'Matematika (Wajib)' },
  { value: 'fisika', label: 'Fisika (Saintek)' },
  { value: 'tkj', label: 'SMK - Teknik Jaringan (TKJ)' },
  { value: 'inggris', label: 'Bahasa Inggris' },
];

/* ================= Halaman ================= */

export default function RuangPage() {
  const router = useRouter();

  const [mapelCoach, setMapelCoach] = useState('matematika');
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
    console.log('[ruang]', event, payload);
  }, []);

  const showToastMsg = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const coach = COACH_DATA[mapelCoach] ?? COACH_DATA.matematika;

  const gantiMapel = (v: string) => {
    setMapelCoach(v);
    logEvent('switch_ai_room', { mapel: v });
  };

  return (
    <div className="min-h-screen bg-[#18181B] flex justify-center">
      <div className="relative w-full max-w-[430px] min-h-screen bg-[#FAFAF7] flex flex-col sm:border-x-2 sm:border-[#111] overflow-hidden">
        {/* ===== Header ===== */}
        <header className="bg-white border-b-2 border-[#111] px-4 py-3 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-base font-extrabold">Ruang AI & Progres Belajar</h2>
            <p className="text-[11px] text-neutral-500">Analisis kumulatif & konsultasi AI Coach per mapel</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowLogPanel((v) => !v)}
              className="text-[11px] font-extrabold bg-[#B6FF00] border-2 border-[#111] rounded-full px-2.5 py-1"
              title="Behavior log"
            >
              📡 {logs.length}
            </button>
            <span className="border-2 border-[#111] shadow-[0_4px_0_#111] bg-[#B6FF00] px-2.5 py-1 rounded-full text-[11px] font-extrabold">
              Akurasi 74%
            </span>
          </div>
        </header>

        {/* ===== Konten scroll ===== */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">
          {/* 3 kartu statistik */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-xl p-3 text-center bg-white">
              <p className="font-mono text-lg text-[#111] font-extrabold">142</p>
              <p className="text-[10px] font-bold text-neutral-500 uppercase mt-1">Soal Selesai</p>
            </div>
            <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-xl p-3 text-center bg-[#B6FF00]">
              <p className="font-mono text-lg text-[#111] font-extrabold">74%</p>
              <p className="text-[10px] font-extrabold text-[#111] uppercase mt-1">Akurasi</p>
            </div>
            <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-xl p-3 text-center bg-white">
              <p className="font-mono text-lg text-[#4F46E5] font-extrabold">6.4j</p>
              <p className="text-[10px] font-bold text-neutral-500 uppercase mt-1">Jam Fokus</p>
            </div>
          </div>

          {/* Kartu Ruang AI Coach */}
          <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#4F46E5]">
                🧠 Ruang AI Coach Mapel
              </span>
              <select
                value={mapelCoach}
                onChange={(e) => gantiMapel(e.target.value)}
                className="border-2 border-[#111] rounded-lg px-2 py-1 text-xs font-extrabold bg-[#FAFAF7]"
              >
                {MAPEL_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-green-50 border border-[#111] rounded-xl p-2.5">
                <span className="text-[10px] font-extrabold text-green-800 uppercase">💪 Topik Terkuat</span>
                <p className="font-extrabold mt-0.5">
                  {coach.kuat} ({coach.kuatPct})
                </p>
              </div>
              <div className="bg-red-50 border border-[#111] rounded-xl p-2.5">
                <span className="text-[10px] font-extrabold text-red-800 uppercase">⚠️ Perlu Dikejar</span>
                <p className="font-extrabold mt-0.5">
                  {coach.lemah} ({coach.lemahPct})
                </p>
              </div>
            </div>

            <div className="bg-[#FAFAF7] border-2 border-[#111] rounded-xl p-3 space-y-2">
              <div className="text-xs bg-white border border-[#111] rounded-xl p-2.5">
                <span className="font-extrabold text-[#4F46E5]">Coach:</span> {coach.pesan}
              </div>
              <div className="flex gap-2">
                <NeoBtn
                  onClick={() => {
                    logEvent('coach_latih_topik_lemah', { mapel: mapelCoach, topik: coach.lemah });
                    router.push('/beranda');
                  }}
                  className="flex-1 bg-[#B6FF00] py-2 rounded-xl text-xs"
                >
                  🎯 Latih Topik Lemah
                </NeoBtn>
                <NeoBtn
                  onClick={() => {
                    logEvent('coach_diskusi_click', { mapel: mapelCoach });
                    showToastMsg('💬 Diskusi Coach — segera hadir');
                  }}
                  className="flex-1 bg-white py-2 rounded-xl text-xs"
                >
                  💬 Diskusi sama Coach
                </NeoBtn>
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-neutral-400">
            Data dummy — statistik nyata menyusul setelah konek backend.
          </p>
        </div>

        {/* ===== Bottom nav ===== */}
        <BottomNav active="ruang" />

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
