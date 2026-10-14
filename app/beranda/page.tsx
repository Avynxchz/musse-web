'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MAPEL_CATALOG, Mapel, MapelCat, QuizMode, getMapel } from '../arena/data';

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
  title,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  title?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`border-2 border-[#111] shadow-[0_3px_0_#111] active:translate-y-[2px] active:shadow-[0_1px_0_#111] transition-all font-extrabold ${className}`}
    >
      {children}
    </button>
  );
}

type Category = 'pilihanmu' | MapelCat;

const CATEGORIES: { key: Category; label: string }[] = [
  { key: 'pilihanmu', label: '⭐ Pilihanmu' },
  { key: 'Wajib', label: 'Wajib' },
  { key: 'Saintek', label: 'Saintek' },
  { key: 'Soshum', label: 'Soshum' },
  { key: 'SMK', label: 'Kejuruan SMK' },
  { key: 'Bahasa', label: 'Bahasa Asing' },
];

interface ModeSheetConfig {
  mapelKey: string;
  mapelName: string;
  paket: 1 | 2;
  resume?: boolean;
}

export default function BerandaPage() {
  const router = useRouter();

  /* ---------- state ---------- */
  const [activeCategory, setActiveCategory] = useState<Category>('pilihanmu');
  const [searchQuery, setSearchQuery] = useState('');
  const [favOverrides, setFavOverrides] = useState<Record<string, boolean>>({});
  const [modeSheet, setModeSheet] = useState<ModeSheetConfig | null>(null);
  const [quizMode, setQuizMode] = useState<QuizMode>('latihan');
  const [aturOpen, setAturOpen] = useState(false);
  const [aturChecks, setAturChecks] = useState<Record<string, boolean>>({});
  const [strategiOpen, setStrategiOpen] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [dateInput, setDateInput] = useState('');
  const [countdownText, setCountdownText] = useState('H-12 TKA');
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
    // eslint-disable-next-line no-console
    console.log('[beranda]', event, payload);
  }, []);

  const showToastMsg = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  /* ---------- mapel list (dengan fav override) ---------- */
  const mapelList: Mapel[] = useMemo(
    () =>
      MAPEL_CATALOG.map((m) => ({
        ...m,
        fav: favOverrides[m.key] ?? m.fav,
      })),
    [favOverrides]
  );

  const favCount = useMemo(() => mapelList.filter((m) => m.fav).length, [mapelList]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return mapelList.filter((m) => {
      const matchSearch =
        q === '' || m.name.toLowerCase().includes(q) || m.cat.toLowerCase().includes(q);
      const matchCat = activeCategory === 'pilihanmu' ? m.fav : m.cat === activeCategory;
      return q !== '' ? matchSearch : matchCat && matchSearch;
    });
  }, [mapelList, searchQuery, activeCategory]);

  /* ---------- handlers ---------- */
  const openModeSheet = useCallback(
    (mapelKey: string, mapelName: string, paket: 1 | 2, resume = false) => {
      setQuizMode('latihan');
      setModeSheet({ mapelKey, mapelName, paket, resume });
      logEvent('mode_selector_open', { mapel: mapelKey, paket, resume });
    },
    [logEvent]
  );

  const confirmStartQuiz = useCallback(() => {
    if (!modeSheet) return;
    logEvent('quiz_start', {
      mapel: modeSheet.mapelKey,
      paket: modeSheet.paket,
      mode: quizMode,
    });
    setModeSheet(null);
    const params = new URLSearchParams({
      mode: quizMode,
      mapel: modeSheet.mapelKey,
      paket: String(modeSheet.paket),
    });
    router.push(`/arena?${params.toString()}`);
  }, [modeSheet, quizMode, logEvent, router]);

  const openAtur = useCallback(() => {
    const init: Record<string, boolean> = {};
    mapelList.forEach((m) => {
      init[m.key] = m.fav;
    });
    setAturChecks(init);
    setAturOpen(true);
    logEvent('atur_mapel_open', {});
  }, [mapelList, logEvent]);

  const saveAtur = useCallback(() => {
    const selected = Object.entries(aturChecks)
      .filter(([, v]) => v)
      .map(([k]) => k);
    if (selected.length === 0) {
      showToastMsg('⚠️ Pilih minimal 1 mapel!');
      return;
    }
    setFavOverrides(aturChecks);
    setAturOpen(false);
    showToastMsg(`✓ ${selected.length} mapel disimpan!`);
    logEvent('atur_mapel_saved', { count: selected.length });
  }, [aturChecks, showToastMsg, logEvent]);

  const saveDate = useCallback(() => {
    const v = dateInput.trim();
    if (v) {
      setCountdownText(`🎯 ${v}`);
      logEvent('tka_date_update', { new_date: v });
    }
    setDateOpen(false);
    setDateInput('');
  }, [dateInput, logEvent]);

  const menitPaket = (m: Mapel, paket: 1 | 2) =>
    Math.round((paket === 1 ? m.p1 : m.p2) * m.jatahMenitPerSoal);

  /* ================= render ================= */
  return (
    <div className="min-h-screen bg-[#18181B] flex justify-center">
      <div className="relative w-full max-w-[430px] min-h-screen bg-[#FAFAF7] flex flex-col sm:border-x-2 sm:border-[#111] overflow-hidden">
        {/* ===== Header sticky ===== */}
        <header className="bg-white border-b-2 border-[#111] px-4 py-3 flex items-center justify-between shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#B6FF00] border-2 border-[#111] flex items-center justify-center font-extrabold text-xs">
              AG
            </div>
            <div>
              <p className="text-[11px] text-neutral-500 font-semibold leading-none">
                Siap tempur hari ini,
              </p>
              <p className="text-sm font-extrabold text-[#111] leading-tight">Agus Putra 👋</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLogPanel(true)}
              className="border-2 border-[#111] shadow-[0_3px_0_#111] px-2 py-1 rounded-full flex items-center gap-1 text-[11px] font-extrabold bg-[#111] text-[#B6FF00]"
              title="Behavior log"
            >
              📡 {logs.length}
            </button>
            <div className="border-2 border-[#111] shadow-[0_3px_0_#111] px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-extrabold bg-[#FFEDD5]">
              <span>🔥</span>
              <span>14</span>
            </div>
            <NeoBtn
              onClick={() => setDateOpen(true)}
              className="px-2.5 py-1 rounded-full flex items-center gap-1 text-xs bg-[#E0E7FF] text-[#111]"
              title="Ubah tanggal TKA"
            >
              <span>🎯</span>
              <span>{countdownText}</span>
            </NeoBtn>
          </div>
        </header>

        {/* ===== Konten scroll ===== */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 pb-28">
          {/* Kartu Lanjutkan Terakhir */}
          <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-4 bg-[#111] text-white relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="bg-[#B6FF00] text-[#111] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                Lanjutkan Terakhir
              </span>
              <span className="text-xs text-white/70 font-semibold">Soal 2 / 3 (Demo) • 46 Soal Asli</span>
            </div>
            <h2 className="text-lg font-extrabold mt-2">Matematika (Wajib) · Paket 1</h2>
            <p className="text-xs text-white/75 mt-0.5">
              Terakhir dikerjakan: Sistem Persamaan &amp; Fungsi Kuadrat
            </p>
            <div className="mt-3 flex items-center gap-3">
              <div className="flex-1 h-2.5 bg-white/15 rounded-full overflow-hidden border border-white/30">
                <div className="h-full bg-[#B6FF00] w-[33%]" />
              </div>
              <span className="text-xs font-extrabold text-[#B6FF00]">33%</span>
            </div>
            <NeoBtn
              onClick={() => openModeSheet('matematika', 'Matematika (Wajib)', 1, true)}
              className="mt-3.5 w-full bg-[#B6FF00] text-[#111] py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5"
            >
              Lanjutkan Paket Ini (Pilih Mode) →
            </NeoBtn>
          </div>

          {/* Kartu Catatan Autopsi */}
          <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-3.5 bg-[#FFFBEB] flex items-center justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="text-lg">🔍</span>
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-200 px-1.5 py-0.5 rounded">
                  Catatan Guru Autopsi
                </span>
                <p className="text-xs font-bold text-[#111] mt-1">
                  Waspada pola &quot;Terburu-buru&quot; (&lt;15 dtk/soal)
                </p>
                <p className="text-[11px] text-neutral-600">
                  Terdeteksi di tryout terakhir. Baca kembali kalimat tanya sebelum klik.
                </p>
              </div>
            </div>
            <NeoBtn
              onClick={() => {
                setStrategiOpen(true);
                logEvent('strategy_modal_open', { from: 'beranda' });
              }}
              className="shrink-0 bg-white px-2.5 py-1.5 rounded-xl text-[11px]"
            >
              Strategi
            </NeoBtn>
          </div>

          {/* Section katalog mapel */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="text-base font-extrabold text-[#111]">Pilih Mapel &amp; Paket Soal</h3>
              <button
                type="button"
                onClick={openAtur}
                className="text-xs font-extrabold text-[#4F46E5] underline decoration-2 underline-offset-2"
              >
                ⚙️ Atur Pilihanmu
              </button>
            </div>

            <div className="relative mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Matematika, TKJ, Fisika, Bahasa Jepang..."
                className="w-full bg-white border-2 border-[#111] rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:shadow-[0_0_0_2px_#B6FF00]"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-3 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {CATEGORIES.map((c) => {
                const isOn = activeCategory === c.key;
                const label =
                  c.key === 'pilihanmu' ? `⭐ Pilihanmu (${favCount})` : c.label;
                return (
                  <button
                    key={c.key}
                    type="button"
                    onClick={() => {
                      setActiveCategory(c.key);
                      logEvent('filter_category', { category: c.key });
                    }}
                    className={`border-2 border-[#111] shadow-[0_3px_0_#111] px-3 py-1 rounded-full text-xs shrink-0 transition-all ${
                      isOn ? 'font-extrabold bg-[#B6FF00]' : 'font-bold bg-white'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
              <NeoBtn
                onClick={openAtur}
                className="px-3 py-1 rounded-full text-xs bg-[#E0E7FF] text-[#111] shrink-0 flex items-center gap-1"
              >
                <span>⚙️</span>
                <span>Atur Mapel</span>
              </NeoBtn>
            </div>

            {/* Daftar kartu mapel */}
            <div className="space-y-3">
              {filtered.length === 0 && (
                <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-6 text-center bg-white">
                  <p className="text-xs font-bold text-neutral-500">
                    {searchQuery
                      ? 'Mapel tidak ditemukan.'
                      : 'Belum ada mapel di Pilihanmu. Atur dulu yuk!'}
                  </p>
                  <NeoBtn
                    onClick={openAtur}
                    className="mt-3 bg-[#B6FF00] px-4 py-2 rounded-xl text-xs"
                  >
                    ⚙️ Atur Mapel Pilihan
                  </NeoBtn>
                </div>
              )}
              {filtered.map((m) => (
                <div
                  key={m.key}
                  className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-3.5 bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">
                        {m.cat} · Resmi Pusmendik
                      </span>
                      <h4 className="text-sm font-extrabold text-[#111]">{m.name}</h4>
                    </div>
                    {m.prog > 0 ? (
                      <span className="bg-[#B6FF00] border border-[#111] px-2 py-0.5 rounded-md text-[10px] font-extrabold">
                        {m.prog}% Selesai
                      </span>
                    ) : (
                      <span className="bg-neutral-100 border border-[#111] px-2 py-0.5 rounded-md text-[10px] font-bold">
                        Baru
                      </span>
                    )}
                  </div>
                  <div className={`mt-3 grid ${m.p2 ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                    <NeoBtn
                      onClick={() => openModeSheet(m.key, m.name, 1)}
                      className="bg-[#FAFAF7] hover:bg-[#B6FF00] py-2 px-3 rounded-xl text-left flex items-center justify-between"
                    >
                      <span>
                        <span className="block text-xs font-extrabold">Paket 1</span>
                        <span className="block text-[10px] text-neutral-500 font-semibold">
                          {m.p1} Soal • {menitPaket(m, 1)} Menit
                        </span>
                      </span>
                      <span className="text-xs font-extrabold">→</span>
                    </NeoBtn>
                    {m.p2 > 0 && (
                      <NeoBtn
                        onClick={() => openModeSheet(m.key, m.name, 2)}
                        className="bg-[#FAFAF7] hover:bg-[#B6FF00] py-2 px-3 rounded-xl text-left flex items-center justify-between"
                      >
                        <span>
                          <span className="block text-xs font-extrabold">Paket 2</span>
                          <span className="block text-[10px] text-neutral-500 font-semibold">
                            {m.p2} Soal • {menitPaket(m, 2)} Menit
                          </span>
                        </span>
                        <span className="text-xs font-extrabold">→</span>
                      </NeoBtn>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== Bottom nav ===== */}
        <nav className="bg-white border-t-2 border-[#111] px-6 py-2 flex items-center justify-around shrink-0 sticky bottom-0 z-20">
          <button type="button" className="flex flex-col items-center gap-0.5 text-[#111] font-extrabold">
            <span className="bg-[#B6FF00] border-2 border-[#111] px-3 py-0.5 rounded-full text-xs">
              📝
            </span>
            <span className="text-[11px]">Latihan</span>
          </button>
          <button
            type="button"
            onClick={() => showToastMsg('🚧 Ruang & Progres (segera hadir)')}
            className="flex flex-col items-center gap-0.5 text-neutral-500 font-bold"
          >
            <span className="px-3 py-0.5 text-xs">🧠</span>
            <span className="text-[11px]">Ruang &amp; Progres</span>
          </button>
          <button
            type="button"
            onClick={() => showToastMsg('🚧 Akun (segera hadir)')}
            className="flex flex-col items-center gap-0.5 text-neutral-500 font-bold"
          >
            <span className="px-3 py-0.5 text-xs">👤</span>
            <span className="text-[11px]">Akun</span>
          </button>
        </nav>

        {/* ===== Bottom-sheet Pilih Mode ===== */}
        {modeSheet && (
          <div className="absolute inset-0 z-40 bg-black/60 flex flex-col justify-end">
            <div className="bg-[#FAFAF7] border-t-2 border-[#111] rounded-t-3xl p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="bg-[#E0E7FF] border border-[#111] px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                    Pilih Mode Pengerjaan
                  </span>
                  <h3 className="text-base font-extrabold mt-1">
                    {modeSheet.mapelName} · Paket {modeSheet.paket}
                  </h3>
                  <p className="text-xs text-neutral-500 font-semibold">
                    {(() => {
                      const m = getMapel(modeSheet.mapelKey);
                      const soal = modeSheet.paket === 1 ? m.p1 : m.p2;
                      const menit = menitPaket(m, modeSheet.paket);
                      return modeSheet.resume
                        ? `Lanjutkan • ${soal} Soal (${menit} Menit)`
                        : `${soal} Soal • ${menit} Menit`;
                    })()}
                  </p>
                </div>
                <NeoBtn
                  onClick={() => setModeSheet(null)}
                  className="w-7 h-7 rounded-lg bg-white text-xs"
                >
                  ✕
                </NeoBtn>
              </div>

              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => setQuizMode('latihan')}
                  className={`border-2 border-[#111] shadow-[0_3px_0_#111] w-full p-3.5 rounded-2xl text-left flex items-start gap-3 ${
                    quizMode === 'latihan' ? 'bg-[#B6FF00]' : 'bg-white'
                  }`}
                >
                  <span className="w-8 h-8 rounded-xl border-2 border-[#111] bg-white flex items-center justify-center text-base shrink-0 mt-0.5">
                    🌱
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center justify-between">
                      <span className="text-xs font-extrabold">Mode Latihan (Santai &amp; Paham)</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          quizMode === 'latihan'
                            ? 'font-extrabold bg-[#111] text-[#B6FF00]'
                            : 'font-bold text-neutral-400'
                        }`}
                      >
                        {quizMode === 'latihan' ? 'Terpilih ✓' : 'Pilih'}
                      </span>
                    </span>
                    <ul className="text-[11px] text-[#111]/85 font-semibold mt-1.5 space-y-0.5 list-disc list-inside">
                      <li>
                        Tombol <b>Cek Jawaban</b> aktif langsung di tiap soal
                      </li>
                      <li>
                        <b>Pembahasan 5 Pilar &amp; Soal Serupa</b> langsung terbuka
                      </li>
                      <li>Timer jalan sebagai acuan (kalau habis tetap bisa lanjut)</li>
                    </ul>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setQuizMode('simulasi')}
                  className={`border-2 border-[#111] shadow-[0_3px_0_#111] w-full p-3.5 rounded-2xl text-left flex items-start gap-3 ${
                    quizMode === 'simulasi' ? 'bg-[#B6FF00]' : 'bg-white'
                  }`}
                >
                  <span className="w-8 h-8 rounded-xl border-2 border-[#111] bg-[#E0E7FF] flex items-center justify-center text-base shrink-0 mt-0.5">
                    ⚡
                  </span>
                  <span className="flex-1">
                    <span className="flex items-center justify-between">
                      <span className="text-xs font-extrabold">Mode Simulasi TKA (Ujian Hari-H)</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${
                          quizMode === 'simulasi'
                            ? 'font-extrabold bg-[#111] text-[#B6FF00]'
                            : 'font-bold text-neutral-400'
                        }`}
                      >
                        {quizMode === 'simulasi' ? 'Terpilih ✓' : 'Pilih'}
                      </span>
                    </span>
                    <ul className="text-[11px] text-neutral-600 font-semibold mt-1.5 space-y-0.5 list-disc list-inside">
                      <li>
                        Tombol <b>Cek Jawaban DIKUNCI</b> selama ujian berlangsung
                      </li>
                      <li>
                        Timer ketat — <b>otomatis kumpul</b> saat waktu habis
                      </li>
                      <li>
                        Jawaban, 5 Pilar &amp; <b>Guru Autopsi</b> dibuka setelah selesai
                      </li>
                    </ul>
                  </span>
                </button>
              </div>

              <NeoBtn
                onClick={confirmStartQuiz}
                className="w-full bg-[#111] text-[#B6FF00] py-3.5 rounded-2xl text-xs flex items-center justify-center gap-2"
              >
                <span>{quizMode === 'latihan' ? '🌱 Mulai Mode Latihan →' : '⚡ Mulai Simulasi →'}</span>
              </NeoBtn>
            </div>
          </div>
        )}

        {/* ===== Modal Atur Mapel ===== */}
        {aturOpen && (
          <div className="absolute inset-0 z-40 bg-black/60 flex flex-col justify-end">
            <div className="bg-[#FAFAF7] border-t-2 border-[#111] rounded-t-3xl h-[80%] flex flex-col overflow-hidden">
              <div className="bg-white border-b-2 border-[#111] px-4 py-3 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="text-sm font-extrabold">⚙️ Atur Mapel Pilihanmu</h3>
                  <p className="text-[11px] text-neutral-500">
                    Pilih mapel yang tampil di tab ⭐ Pilihanmu
                  </p>
                </div>
                <NeoBtn onClick={() => setAturOpen(false)} className="w-7 h-7 rounded-lg bg-white text-xs">
                  ✕
                </NeoBtn>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {mapelList.map((m) => (
                  <label
                    key={m.key}
                    className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-xl p-3 flex items-center justify-between cursor-pointer bg-white"
                  >
                    <span>
                      <span className="block text-[10px] font-extrabold uppercase text-[#4F46E5]">
                        {m.cat}
                      </span>
                      <span className="block text-xs font-extrabold">{m.name}</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={!!aturChecks[m.key]}
                      onChange={(e) =>
                        setAturChecks((prev) => ({ ...prev, [m.key]: e.target.checked }))
                      }
                      className="w-5 h-5 accent-[#111] rounded cursor-pointer"
                    />
                  </label>
                ))}
              </div>
              <div className="p-4 bg-white border-t-2 border-[#111] flex gap-2 shrink-0">
                <NeoBtn onClick={() => setAturOpen(false)} className="px-4 py-2.5 rounded-xl bg-white text-xs">
                  Batal
                </NeoBtn>
                <NeoBtn
                  onClick={saveAtur}
                  className="flex-1 py-2.5 rounded-xl bg-[#B6FF00] text-[#111] text-xs"
                >
                  Simpan Pilihan Mapel ✓
                </NeoBtn>
              </div>
            </div>
          </div>
        )}

        {/* ===== Modal Strategi ===== */}
        {strategiOpen && (
          <div className="absolute inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
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
              <h3 className="text-base font-extrabold">Strategi Anti-Ceroboh &amp; Cek Ulang</h3>
              <ul className="space-y-2 text-xs text-neutral-700 leading-relaxed">
                <li>
                  <b>1. Tunjuk kalimat tanya terakhir:</b> Pastikan apakah soal meminta nilai x,
                  pernyataan yang <i>salah</i>, atau kesimpulan.
                </li>
                <li>
                  <b>2. Cek tanda (+/-) &amp; satuan:</b> Luangkan 5 detik sebelum klik tombol
                  Selanjutnya.
                </li>
                <li>
                  <b>3. Pada PG Kompleks:</b> Uji satu per satu opsi dari atas ke bawah, jangan
                  menebak hanya 1 opsi.
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

        {/* ===== Modal Tanggal TKA (custom, bukan prompt) ===== */}
        {dateOpen && (
          <div className="absolute inset-0 z-40 bg-black/50 flex items-center justify-center p-6">
            <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-5 bg-white w-full max-w-[300px] text-center">
              <div className="text-3xl mb-2">📅</div>
              <p className="text-sm font-bold text-[#111] mb-3">
                Target tanggal TKA
                <span className="block text-[11px] font-semibold text-neutral-500">
                  (contoh: 26 Okt 2026)
                </span>
              </p>
              <input
                type="text"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                placeholder="26 Okt 2026"
                className="w-full border-2 border-[#111] rounded-xl px-3 py-2 text-sm font-semibold mb-3 focus:outline-none"
              />
              <div className="flex gap-2">
                <NeoBtn
                  onClick={saveDate}
                  className="flex-1 bg-[#B6FF00] py-2.5 rounded-xl text-xs"
                >
                  Simpan
                </NeoBtn>
                <NeoBtn
                  onClick={() => {
                    setDateOpen(false);
                    setDateInput('');
                  }}
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
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-50 bg-[#111] text-white border-2 border-[#B6FF00] px-4 py-2 rounded-full text-xs font-extrabold shadow-lg whitespace-nowrap">
            {toast}
          </div>
        )}

        {/* ===== Panel behavior log ===== */}
        {showLogPanel && (
          <div className="absolute inset-0 z-40 bg-[#111]/95 text-white flex flex-col p-4">
            <div className="flex items-center justify-between border-b border-white/20 pb-3">
              <div>
                <span className="text-[10px] font-extrabold uppercase bg-[#B6FF00] text-[#111] px-2 py-0.5 rounded">
                  Real-Time Telemetry
                </span>
                <h3 className="text-sm font-extrabold mt-1">Behavior Log (Beranda)</h3>
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
              {logs.length === 0 && (
                <p className="text-white/50">Belum ada event. Klik-klik dulu…</p>
              )}
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
