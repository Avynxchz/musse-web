'use client';

import { Suspense, useCallback, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QUESTIONS, getMapel } from '../arena/data';

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

/* ================= Isi halaman ================= */

function HasilContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  /* ---------- baca URL params ---------- */
  const mode = searchParams.get('mode') === 'simulasi' ? 'simulasi' : 'latihan';
  const mapelKey = searchParams.get('mapel') || 'matematika';
  const paket = searchParams.get('paket') === '2' ? 2 : 1;
  const benarParam = parseInt(searchParams.get('benar') || '', 10);
  const totalParam = parseInt(searchParams.get('total') || '', 10);
  const autoSubmit = searchParams.get('autosubmit') === '1';

  const total = Number.isFinite(totalParam) && totalParam > 0 ? totalParam : QUESTIONS.length;
  const benar = Number.isFinite(benarParam) && benarParam >= 0 ? Math.min(benarParam, total) : 0;
  // Dummy: 1 salah (kalau ada sisa), sisanya kosong
  const salah = total - benar > 0 ? 1 : 0;
  const kosong = Math.max(0, total - benar - salah);
  const skor = total > 0 ? Math.round((benar / total) * 100) : 0;

  const mapel = getMapel(mapelKey);
  const mapelName = mapel ? mapel.name : 'Matematika (Wajib)';

  /* ---------- state ---------- */
  const [strategiOpen, setStrategiOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [showLogPanel, setShowLogPanel] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ---------- behavior log ---------- */
  const logEvent = useCallback((event: string, payload: Record<string, unknown> = {}) => {
    const entry: LogEntry = {
      id: logId++,
      event,
      ts: new Date().toLocaleTimeString('id-ID'),
      payload,
    };
    setLogs((prev) => [entry, ...prev].slice(0, 100));
    console.log('[hasil]', event, payload);
  }, []);

  const showToastMsg = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  /* ---------- status per soal (dummy) ---------- */
  const statusPerSoal: ('benar' | 'salah' | 'kosong')[] = useMemo(() => {
    return QUESTIONS.map((_, i) => {
      if (i < benar) return 'benar';
      if (i === benar && salah > 0) return 'salah';
      return 'kosong';
    });
  }, [benar, salah]);

  const openStrategi = useCallback(() => {
    setStrategiOpen(true);
    logEvent('strategy_modal_open', { pola: 'terburu-buru' });
  }, [logEvent]);

  /* ================= render ================= */

  return (
    <div className="min-h-screen bg-[#18181B] flex justify-center">
      <div className="relative w-full max-w-[430px] min-h-screen bg-[#FAFAF7] flex flex-col sm:border-x-2 sm:border-[#111] overflow-hidden">
        {/* ===== Header ===== */}
        <header className="bg-white border-b-2 border-[#111] px-4 py-3 flex items-center justify-between shrink-0">
          <div className="min-w-0">
            <span
              className={`text-[10px] font-extrabold uppercase border border-[#111] px-2 py-0.5 rounded ${
                mode === 'simulasi' ? 'bg-amber-300' : 'bg-[#B6FF00]'
              }`}
            >
              {mode === 'simulasi' ? '⚡ Hasil Simulasi' : '🌱 Hasil Latihan'}
            </span>
            <h2 className="text-base font-extrabold mt-0.5 truncate">
              {mapelName} · Paket {paket}
            </h2>
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
            <NeoBtn onClick={() => router.push('/beranda')} className="bg-white px-3 py-1.5 rounded-xl text-xs">
              Ke Beranda →
            </NeoBtn>
          </div>
        </header>

        {/* ===== Konten scroll ===== */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-8">
          {/* Banner auto-submit */}
          {autoSubmit && (
            <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-3.5 bg-red-100 text-xs font-bold text-red-900 flex items-center gap-2.5">
              <span className="text-lg">⏰</span>
              <div>
                <p className="font-extrabold">Waktu Habis! (Auto-Submit)</p>
                <p className="text-[11px] font-medium">
                  Jawabanmu otomatis dikumpulkan. Semua kunci & pembahasan sudah terbuka!
                </p>
              </div>
            </div>
          )}

          {/* ===== Kartu skor ===== */}
          <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-4 bg-[#111] text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-white/70 font-semibold">Skor Akhir Kamu</p>
                <p className="font-mono text-3xl text-[#B6FF00] mt-1 font-extrabold">{skor}%</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/20">
                  <p className="text-sm font-extrabold text-[#B6FF00]">{benar}</p>
                  <p className="text-[10px] text-white/70">Benar</p>
                </div>
                <div className="bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/20">
                  <p className="text-sm font-extrabold text-red-400">{salah}</p>
                  <p className="text-[10px] text-white/70">Salah</p>
                </div>
                <div className="bg-white/10 px-2.5 py-1.5 rounded-xl border border-white/20">
                  <p className="text-sm font-extrabold text-white">{kosong}</p>
                  <p className="text-[10px] text-white/70">Kosong</p>
                </div>
              </div>
            </div>
            <div className="mt-3 pt-2.5 border-t border-white/15 flex items-center justify-between text-[11px] text-white/80">
              <span>{autoSubmit ? '⏰ Auto-Submit (Waktu Habis)' : '🏁 Diselesaikan'}</span>
              <span>
                ⚡ Rata-rata: <b>24 dtk/soal</b>
              </span>
              <span>✓ Tersimpan</span>
            </div>
          </div>

          {/* ===== Guru Autopsi AI ===== */}
          <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-4 bg-white space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔍</span>
                <div>
                  <h3 className="text-sm font-extrabold">Guru Autopsi AI</h3>
                  <p className="text-[11px] text-neutral-500">
                    Dari ritme waktu, klik opsi & pergantian jawabanmu
                  </p>
                </div>
              </div>
              <span className="bg-[#B6FF00] border border-[#111] px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0">
                ✨ Analisis AI
              </span>
            </div>

            {/* Observasi */}
            <div className="bg-[#FAFAF7] border-2 border-[#111] rounded-xl p-3 text-xs space-y-1">
              <p className="font-extrabold text-[#111]">👀 Yang Saya Lihat:</p>
              <ul className="list-disc list-inside text-neutral-700 space-y-1 mt-1">
                <li>
                  Di <b>Soal #1 (SPLDV)</b>, kamu menjawab mantap dalam 18 detik tanpa ganti opsi.
                </li>
                <li>
                  Di <b>Soal #2 (PG Kompleks)</b>, kamu sempat mengganti pilihan dan kurang teliti memilih
                  semua kunci benar.
                </li>
                <li>
                  Di <b>Soal #3 (Benar/Salah)</b>, kamu klik terlalu cepat (&lt;12 detik) pada pernyataan C.
                </li>
              </ul>
            </div>

            {/* Kebocoran pola */}
            <div className="bg-[#FFFBEB] border-2 border-[#111] rounded-xl p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase bg-amber-300 border border-[#111] px-2 py-0.5 rounded">
                  Kebocoran Utama #1
                </span>
                <span className="text-[11px] font-bold text-red-700">Pola: Terburu-buru</span>
              </div>
              <h4 className="text-sm font-extrabold mt-1.5">Terburu-buru di Soal Multi-Pernyataan</h4>
              <p className="text-xs text-neutral-700 mt-1">
                <b>Bukti:</b> Waktu baca rata-rata di bawah 15 detik pada soal yang butuh pengecekan lebih
                dari satu kondisi.
              </p>
              <div className="mt-3 flex gap-2">
                <NeoBtn onClick={openStrategi} className="flex-1 bg-white py-2 px-3 rounded-xl text-xs">
                  📚 Pelajari 5 Strategi
                </NeoBtn>
                <NeoBtn
                  onClick={() => {
                    logEvent('autopsi_bedah_soal', { soal_no: 2 });
                    showToastMsg('🎯 Bedah Soal #2 — halaman reviu belum tersedia');
                  }}
                  className="flex-1 bg-[#B6FF00] py-2 px-3 rounded-xl text-xs"
                >
                  🎯 Bedah Soal #2
                </NeoBtn>
              </div>
            </div>

            {/* Daftar bedah soal */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 mb-2">
                Bedah Soal per Nomor
              </h4>
              <div className="space-y-2">
                {QUESTIONS.map((q, i) => {
                  const st = statusPerSoal[i];
                  const badge =
                    st === 'benar' ? (
                      <span className="bg-green-100 text-green-800 border border-green-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        ✓ Benar
                      </span>
                    ) : st === 'salah' ? (
                      <span className="bg-red-100 text-red-800 border border-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        ✕ Salah
                      </span>
                    ) : (
                      <span className="bg-neutral-100 text-neutral-700 border border-neutral-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                        ○ Kosong
                      </span>
                    );
                  return (
                    <button
                      key={q.nomor}
                      type="button"
                      onClick={() => {
                        logEvent('autopsi_jump_to_review', { soal_no: q.nomor });
                        showToastMsg(`📖 Pembahasan Soal #${q.nomor} — halaman reviu belum tersedia`);
                      }}
                      className="w-full text-left border-2 border-[#111] rounded-xl p-2.5 flex items-center justify-between bg-white hover:bg-[#FAFAF7]"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-7 h-7 rounded-lg border border-[#111] flex items-center justify-center font-extrabold text-xs ${
                            st === 'benar' ? 'bg-[#B6FF00]' : 'bg-red-200'
                          }`}
                        >
                          {q.nomor}
                        </span>
                        <div>
                          <p className="text-xs font-extrabold">
                            {q.topik} · {q.tipe}
                          </p>
                          <p className="text-[11px] text-neutral-500">Klik untuk buka pembahasan →</p>
                        </div>
                      </div>
                      {badge}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ===== Modal strategi ===== */}
        {strategiOpen && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-5 bg-white w-full space-y-3">
              <div className="flex items-center justify-between">
                <span className="bg-amber-300 border border-[#111] px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                  Panduan Anti-Bocor
                </span>
                <button
                  type="button"
                  onClick={() => setStrategiOpen(false)}
                  className="font-extrabold text-sm"
                >
                  ✕
                </button>
              </div>
              <h3 className="text-base font-extrabold">Strategi Anti-Ceroboh & Cek Ulang</h3>
              <ul className="space-y-2 text-xs text-neutral-700 leading-relaxed">
                <li>
                  <b>1. Tunjuk kalimat tanya terakhir:</b> pastikan apakah soal meminta nilai x, pernyataan
                  yang <i>salah</i>, atau kesimpulan.
                </li>
                <li>
                  <b>2. Cek tanda (+/-) & satuan:</b> luangkan 5 detik sebelum klik tombol Selanjutnya.
                </li>
                <li>
                  <b>3. Pada PG Kompleks:</b> uji satu per satu opsi dari atas ke bawah, jangan menebak hanya
                  1 opsi.
                </li>
              </ul>
              <NeoBtn
                onClick={() => setStrategiOpen(false)}
                className="w-full bg-[#B6FF00] py-2.5 rounded-xl text-xs"
              >
                Siap Dipraktikkan!
              </NeoBtn>
            </div>
          </div>
        )}

        {/* ===== Toast ===== */}
        {toast && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 bg-[#111] text-white border-2 border-[#B6FF00] px-4 py-2 rounded-full text-xs font-extrabold whitespace-nowrap">
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

/* ================= Page (Suspense boundary untuk useSearchParams) ================= */

export default function HasilPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#18181B] flex justify-center">
          <div className="w-full max-w-[430px] min-h-screen bg-[#FAFAF7] flex items-center justify-center">
            <p className="text-sm font-bold">Memuat hasil…</p>
          </div>
        </div>
      }
    >
      <HasilContent />
    </Suspense>
  );
}
