'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MAPEL_CATALOG, Mapel, MapelCat, QuizMode, getMapel } from '../arena/data';
import {
  analyzeLearningPattern,
  getLastAttempt,
  getQuizHistory,
  type QuizAttempt,
} from '../../lib/analisis';
import { DesktopSidebar } from '../components/DesktopSidebar';
import {
  BottomNav,
  LogPanelLive,
  NeoBtn,
  Toast,
  useBehaviorLog,
  useToast,
} from '../components/ui';

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

/** Ringkasan progres real per (mapel, paket) dari localStorage. */
interface PaketProgress {
  adaAttempt: boolean;
  dikerjakan: number;
  total: number;
  benar: number;
  akurasiPct: number;
  belumSelesai: boolean;
  selesai: boolean;
  topikTerakhir: string;
}

function buildPaketProgress(
  m: Mapel,
  paket: 1 | 2,
  att: QuizAttempt | undefined
): PaketProgress {
  const catalogTotal = paket === 1 ? m.p1 : m.p2;
  if (!att) {
    return {
      adaAttempt: false,
      dikerjakan: 0,
      total: catalogTotal,
      benar: 0,
      akurasiPct: 0,
      belumSelesai: false,
      selesai: false,
      topikTerakhir: '',
    };
  }
  const total = typeof att.total === 'number' && att.total > 0 ? att.total : catalogTotal;
  const rawAnswered =
    Array.isArray(att.perSoal) && att.perSoal.length > 0
      ? att.perSoal.filter((s) => s.status !== 'kosong').length
      : typeof att.total === 'number' && att.total > 0
        ? att.total
        : att.benar || 0;
  const dikerjakan = total > 0 ? Math.min(rawAnswered, total) : rawAnswered;
  const benar = Math.max(0, Math.min(att.benar || 0, dikerjakan || total));
  const penyebutAkurasi = dikerjakan > 0 ? dikerjakan : total;
  const akurasiPct =
    penyebutAkurasi > 0 ? Math.min(100, Math.round((benar / penyebutAkurasi) * 100)) : 0;
  const belumSelesai = total > 0 && dikerjakan < total;
  const selesai = total > 0 && dikerjakan >= total;

  const uniqueTopiks = Array.from(
    new Set(
      (att.perSoal || [])
        .filter(
          (s) =>
            s.status !== 'kosong' &&
            s.topik &&
            s.topik !== att.mapelName &&
            s.topik !== m.name &&
            s.topik !== att.mapel
        )
        .map((s) => s.topik.trim())
        .filter(Boolean)
    )
  );

  return {
    adaAttempt: true,
    dikerjakan,
    total,
    benar,
    akurasiPct,
    belumSelesai,
    selesai,
    topikTerakhir: uniqueTopiks.slice(0, 2).join(' & '),
  };
}

/**
 * Kartu mapel ter-memo: tidak re-render saat user mengetik di search
 * (referensi objek mapel tidak berubah), + content-visibility agar
 * browser skip render kartu di luar viewport.
 */
/** Badge count terisolasi: hanya komponen kecil ini yang re-render saat log bertambah. */
const LogBadgeCount = memo(function LogBadgeCount({ useLogCount }: { useLogCount: () => number }) {
  const count = useLogCount();
  return <>{count}</>;
});

const MapelCard = memo(function MapelCard({
  m,
  p1Stat,
  p2Stat,
  akurasiTerakhir,
  onOpen,
}: {
  m: Mapel;
  p1Stat: PaketProgress;
  p2Stat: PaketProgress;
  akurasiTerakhir: number | null;
  onOpen: (mapelKey: string, mapelName: string, paket: 1 | 2, resume?: boolean) => void;
}) {
  const menit1 = Math.round(m.p1 * m.jatahMenitPerSoal);
  const menit2 = Math.round(m.p2 * m.jatahMenitPerSoal);
  const hasP2 = m.p2 > 0;
  const adaProgresMapel = p1Stat.adaAttempt || (hasP2 && p2Stat.adaAttempt);
  const semuaPaketSelesai = p1Stat.selesai && (!hasP2 || p2Stat.selesai);
  const mapelBelumSelesai = adaProgresMapel && !semuaPaketSelesai;

  return (
    <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-3.5 bg-white [content-visibility:auto] [contain-intrinsic-size:auto_180px] md:flex md:flex-col md:justify-between">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-neutral-500">
            {m.cat} · Resmi Pusmendik
          </span>
          <h4 className="text-sm font-extrabold text-[#111] truncate">{m.name}</h4>
        </div>
        {mapelBelumSelesai ? (
          <span className="bg-[#B6FF00] border border-[#111] px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0">
            Lanjut{akurasiTerakhir !== null ? ` · ${akurasiTerakhir}%` : ''}
          </span>
        ) : semuaPaketSelesai ? (
          <span className="bg-[#B6FF00] border border-[#111] px-2 py-0.5 rounded-md text-[10px] font-extrabold shrink-0">
            Selesai{akurasiTerakhir !== null ? ` · ${akurasiTerakhir}%` : ''}
          </span>
        ) : (
          <span className="bg-neutral-100 border border-[#111] px-2 py-0.5 rounded-md text-[10px] font-bold text-neutral-600 shrink-0">
            Belum ada progres
          </span>
        )}
      </div>
      <div className={`mt-3 grid ${hasP2 ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
        <NeoBtn
          onClick={() => onOpen(m.key, m.name, 1, p1Stat.belumSelesai)}
          className="bg-[#FAFAF7] hover:bg-[#B6FF00] py-2 px-3 rounded-xl text-left flex items-center justify-between gap-1"
        >
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <span className="text-xs font-extrabold">Paket 1</span>
              {p1Stat.belumSelesai && (
                <span className="bg-[#B6FF00] border border-[#111] px-1.5 py-0.5 rounded text-[9px] font-extrabold leading-none text-[#111]">
                  Lanjut
                </span>
              )}
              {p1Stat.selesai && (
                <span className="bg-[#B6FF00] border border-[#111] px-1.5 py-0.5 rounded text-[9px] font-extrabold leading-none text-[#111]">
                  ✓
                </span>
              )}
            </span>
            <span className="block text-[10px] text-neutral-500 font-semibold truncate">
              {p1Stat.adaAttempt
                ? `${p1Stat.dikerjakan}/${p1Stat.total} Soal • Akurasi ${p1Stat.akurasiPct}%`
                : `0/${m.p1} Soal • ${menit1} Menit`}
            </span>
          </span>
          <span className="text-xs font-extrabold shrink-0">→</span>
        </NeoBtn>
        {hasP2 && (
          <NeoBtn
            onClick={() => onOpen(m.key, m.name, 2, p2Stat.belumSelesai)}
            className="bg-[#FAFAF7] hover:bg-[#B6FF00] py-2 px-3 rounded-xl text-left flex items-center justify-between gap-1"
          >
            <span className="min-w-0">
              <span className="flex items-center gap-1.5">
                <span className="text-xs font-extrabold">Paket 2</span>
                {p2Stat.belumSelesai && (
                  <span className="bg-[#B6FF00] border border-[#111] px-1.5 py-0.5 rounded text-[9px] font-extrabold leading-none text-[#111]">
                    Lanjut
                  </span>
                )}
                {p2Stat.selesai && (
                  <span className="bg-[#B6FF00] border border-[#111] px-1.5 py-0.5 rounded text-[9px] font-extrabold leading-none text-[#111]">
                    ✓
                  </span>
                )}
              </span>
              <span className="block text-[10px] text-neutral-500 font-semibold truncate">
                {p2Stat.adaAttempt
                  ? `${p2Stat.dikerjakan}/${p2Stat.total} Soal • Akurasi ${p2Stat.akurasiPct}%`
                  : `0/${m.p2} Soal • ${menit2} Menit`}
              </span>
            </span>
            <span className="text-xs font-extrabold shrink-0">→</span>
          </NeoBtn>
        )}
      </div>
    </div>
  );
});

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
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  // Guard anti double-start quiz (double-click tombol Mulai)
  const startingRef = useRef(false);
  const startingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast, showToastMsg } = useToast();
  const { logEvent, useLogCount, useLogs, showLogPanel, setShowLogPanel } = useBehaviorLog('beranda');

  // Baca data real dari localStorage + page view logging
  useEffect(() => {
    logEvent('page_view', { page: 'beranda' });
    const syncStorage = () => {
      setQuizHistory(getQuizHistory());
      setLastAttempt(getLastAttempt());
    };
    syncStorage();
    window.addEventListener('focus', syncStorage);
    window.addEventListener('storage', syncStorage);
    return () => {
      window.removeEventListener('focus', syncStorage);
      window.removeEventListener('storage', syncStorage);
      if (startingTimerRef.current) clearTimeout(startingTimerRef.current);
    };
  }, [logEvent]);

  /* ---------- progres real per (mapel, paket) — MTK Paket 1 != MTK Paket 2 ---------- */
  const latestPerPaket = useMemo(() => {
    const map: Record<string, QuizAttempt> = {};
    for (const att of quizHistory) {
      if (!att || !att.mapel) continue;
      const p = Number(att.paket) === 2 ? 2 : 1;
      map[`${att.mapel}_p${p}`] = att;
    }
    if (lastAttempt && lastAttempt.mapel) {
      const p = Number(lastAttempt.paket) === 2 ? 2 : 1;
      const key = `${lastAttempt.mapel}_p${p}`;
      if (!map[key]) {
        map[key] = lastAttempt;
      }
    }
    return map;
  }, [quizHistory, lastAttempt]);

  const effectiveLastAttempt = useMemo(() => {
    if (lastAttempt && lastAttempt.mapel) return lastAttempt;
    if (quizHistory.length > 0) return quizHistory[quizHistory.length - 1];
    return null;
  }, [lastAttempt, quizHistory]);

  const lastAttemptSummary = useMemo(() => {
    if (!effectiveLastAttempt) return null;
    const m = getMapel(effectiveLastAttempt.mapel);
    const paket: 1 | 2 = Number(effectiveLastAttempt.paket) === 2 ? 2 : 1;
    const mapelName = effectiveLastAttempt.mapelName || m.name;
    const stat = buildPaketProgress(m, paket, effectiveLastAttempt);
    const progPct = stat.total > 0 ? Math.round((stat.dikerjakan / stat.total) * 100) : 0;
    return {
      mapelKey: effectiveLastAttempt.mapel,
      mapelName,
      paket,
      mode: effectiveLastAttempt.mode,
      stat,
      progPct,
    };
  }, [effectiveLastAttempt]);

  const autopsiTerakhir = useMemo(
    () => analyzeLearningPattern(effectiveLastAttempt),
    [effectiveLastAttempt]
  );

  const activeDaysCount = useMemo(() => {
    const dates = new Set<string>();
    for (const att of quizHistory) {
      if (att?.tanggal) dates.add(att.tanggal.slice(0, 10));
    }
    if (effectiveLastAttempt?.tanggal) {
      dates.add(effectiveLastAttempt.tanggal.slice(0, 10));
    }
    return dates.size;
  }, [quizHistory, effectiveLastAttempt]);

  const mapelStatsMap = useMemo(() => {
    const result: Record<
      string,
      { p1: PaketProgress; p2: PaketProgress; akurasiTerakhir: number | null }
    > = {};
    for (const m of MAPEL_CATALOG) {
      const att1 = latestPerPaket[`${m.key}_p1`];
      const att2 = latestPerPaket[`${m.key}_p2`];
      const p1 = buildPaketProgress(m, 1, att1);
      const p2 = buildPaketProgress(m, 2, att2);

      let latestAtt: QuizAttempt | undefined;
      for (let i = quizHistory.length - 1; i >= 0; i--) {
        if (quizHistory[i]?.mapel === m.key) {
          latestAtt = quizHistory[i];
          break;
        }
      }
      if (!latestAtt && lastAttempt?.mapel === m.key) {
        latestAtt = lastAttempt;
      }
      let akurasiTerakhir: number | null = null;
      if (latestAtt) {
        const pkt: 1 | 2 = Number(latestAtt.paket) === 2 ? 2 : 1;
        akurasiTerakhir = (pkt === 2 ? p2 : p1).akurasiPct;
      }

      result[m.key] = { p1, p2, akurasiTerakhir };
    }
    return result;
  }, [latestPerPaket, quizHistory, lastAttempt]);

  /* ---------- mapel list (dengan fav override, tanpa prog dummy) ---------- */
  const mapelList: Mapel[] = useMemo(
    () =>
      MAPEL_CATALOG.map((m) => ({
        ...m,
        prog: 0,
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
    // Guard: cegah double-push dari double-click tombol Mulai
    // Reset otomatis setelah 3 detik sebagai pengaman kalau navigasi gagal
    if (startingRef.current) return;
    startingRef.current = true;
    if (startingTimerRef.current) clearTimeout(startingTimerRef.current);
    startingTimerRef.current = setTimeout(() => {
      startingRef.current = false;
    }, 3000);
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
    <div className="min-h-dvh bg-[#18181B] flex justify-center">
      <div className="relative w-full max-w-[430px] md:max-w-none min-h-dvh bg-[#FAFAF7] flex flex-col md:flex-row sm:border-x-2 md:border-x-0 sm:border-[#111] overflow-hidden">
        {/* ===== Sidebar Kiri (KHUSUS DESKTOP md:+) ===== */}
        <DesktopSidebar
          active="beranda"
          footerExtra={
            <div className="flex items-center gap-1.5">
              <div className="border-2 border-[#111] shadow-[0_2px_0_#111] px-2.5 py-1 rounded-full flex items-center gap-1 text-[11px] font-extrabold bg-[#FFEDD5]">
                <span>🔥</span>
                <span>{activeDaysCount} Hari</span>
              </div>
              <NeoBtn
                onClick={() => setDateOpen(true)}
                className="flex-1 px-2.5 py-1 rounded-full flex items-center justify-center gap-1 text-[11px] bg-[#E0E7FF] text-[#111] truncate"
                title="Ubah tanggal TKA"
              >
                <span>🎯</span>
                <span className="truncate">{countdownText}</span>
              </NeoBtn>
            </div>
          }
        />

        {/* ===== Kolom Utama ===== */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* ===== Header sticky ===== */}
          <header className="bg-white border-b-2 border-[#111] px-4 md:px-8 py-3 shrink-0 sticky top-0 z-20">
            <div className="w-full max-w-[1200px] mx-auto flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-[#B6FF00] border-2 border-[#111] flex items-center justify-center font-extrabold text-xs md:hidden">
                  AG
                </div>
                <div>
                  <p className="text-[11px] text-neutral-500 font-semibold leading-none">
                    Siap tempur hari ini,
                  </p>
                  <p className="text-sm md:text-base font-extrabold text-[#111] leading-tight">
                    Agus Putra 👋
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowLogPanel(true)}
                  className="border-2 border-[#111] shadow-[0_3px_0_#111] px-2 py-1 rounded-full flex items-center gap-1 text-[11px] font-extrabold bg-[#111] text-[#B6FF00]"
                  title="Behavior log"
                >
                  📡 <LogBadgeCount useLogCount={useLogCount} />
                </button>
                <div className="border-2 border-[#111] shadow-[0_3px_0_#111] px-2.5 py-1 rounded-full flex items-center gap-1 text-xs font-extrabold bg-[#FFEDD5]">
                  <span>🔥</span>
                  <span>{activeDaysCount}</span>
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
            </div>
          </header>

          {/* ===== Konten scroll ===== */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-28 md:pb-10">
            <div className="w-full max-w-[1200px] mx-auto space-y-5 md:space-y-6">
              <div className="space-y-5 md:space-y-4">
                {/* Kartu Lanjutkan Terakhir (Mobile: kartu vertikal | Desktop: hero banner horizontal) */}
                <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-4 md:p-6 bg-[#111] text-white relative overflow-hidden md:flex md:items-center md:justify-between md:gap-8">
                  {lastAttemptSummary ? (
                    <>
                      <div className="md:flex-1 min-w-0">
                        <div className="flex items-center justify-between md:justify-start gap-2 md:gap-3">
                          <span className="bg-[#B6FF00] text-[#111] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded shrink-0">
                            Lanjutkan Terakhir
                          </span>
                          <span className="text-xs text-white/70 font-semibold truncate">
                            Soal {lastAttemptSummary.stat.dikerjakan} / {lastAttemptSummary.stat.total} • Akurasi {lastAttemptSummary.stat.akurasiPct}%
                          </span>
                        </div>
                        <h2 className="text-lg md:text-2xl font-extrabold mt-2">
                          {lastAttemptSummary.mapelName} · Paket {lastAttemptSummary.paket}
                        </h2>
                        <p className="text-xs md:text-sm text-white/75 mt-0.5">
                          {lastAttemptSummary.stat.topikTerakhir
                            ? `Terakhir dikerjakan: ${lastAttemptSummary.stat.topikTerakhir} (${lastAttemptSummary.stat.benar}/${lastAttemptSummary.stat.total} benar)`
                            : `Skor terakhir: ${lastAttemptSummary.stat.benar}/${lastAttemptSummary.stat.total} benar • Akurasi ${lastAttemptSummary.stat.akurasiPct}%`}
                        </p>
                      </div>
                      <div className="md:w-[340px] lg:w-[400px] md:shrink-0">
                        <div className="mt-3 md:mt-0 flex items-center gap-3">
                          <div className="flex-1 h-2.5 bg-white/15 rounded-full overflow-hidden border border-white/30">
                            <div
                              className="h-full bg-[#B6FF00] transition-all"
                              style={{ width: `${lastAttemptSummary.progPct}%` }}
                            />
                          </div>
                          <span className="text-xs font-extrabold text-[#B6FF00]">
                            {lastAttemptSummary.progPct}%
                          </span>
                        </div>
                        <NeoBtn
                          onClick={() =>
                            openModeSheet(
                              lastAttemptSummary.mapelKey,
                              lastAttemptSummary.mapelName,
                              lastAttemptSummary.paket,
                              true
                            )
                          }
                          className="mt-3.5 md:mt-3 w-full bg-[#B6FF00] text-[#111] py-2.5 md:py-3 rounded-xl text-xs flex items-center justify-center gap-1.5"
                        >
                          Lanjutkan Paket Ini (Pilih Mode) →
                        </NeoBtn>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="md:flex-1 min-w-0">
                        <div className="flex items-center justify-between md:justify-start md:gap-3">
                          <span className="bg-[#B6FF00] text-[#111] text-[10px] font-extrabold uppercase px-2 py-0.5 rounded">
                            Lanjutkan Terakhir
                          </span>
                          <span className="text-xs text-white/70 font-semibold">0 / 0 Soal</span>
                        </div>
                        <h2 className="text-lg md:text-2xl font-extrabold mt-2">Belum ada progres!</h2>
                        <p className="text-xs md:text-sm text-white/75 mt-0.5">
                          Kamu belum mengerjakan soal. Pilih mapel &amp; paket di bawah buat mulai latihan!
                        </p>
                      </div>
                      <div className="md:w-[320px] lg:w-[380px] md:shrink-0">
                        <div className="mt-3 md:mt-0 flex items-center gap-3">
                          <div className="flex-1 h-2.5 bg-white/15 rounded-full overflow-hidden border border-white/30">
                            <div className="h-full bg-[#B6FF00] w-0" />
                          </div>
                          <span className="text-xs font-extrabold text-[#B6FF00]">0%</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Kartu Catatan Autopsi */}
                <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-3.5 md:px-5 md:py-4 bg-[#FFFBEB] flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <span className="text-lg">🔍</span>
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 bg-amber-200 px-1.5 py-0.5 rounded">
                        Catatan Guru Autopsi
                      </span>
                      {autopsiTerakhir.adaData && autopsiTerakhir.pola.length > 0 ? (
                        <>
                          <p className="text-xs font-bold text-[#111] mt-1">
                            {autopsiTerakhir.pola[0].judul}
                          </p>
                          <p className="text-[11px] text-neutral-600">
                            {autopsiTerakhir.pola[0].bukti}
                          </p>
                        </>
                      ) : autopsiTerakhir.adaData ? (
                        <>
                          <p className="text-xs font-bold text-[#111] mt-1">
                            Ritme pengerjaan stabil ({autopsiTerakhir.rataRataDetik} dtk/soal)
                          </p>
                          <p className="text-[11px] text-neutral-600">
                            Belum ada pola rawan terdeteksi di paket terakhir. Pertahankan fokusmu!
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs font-bold text-[#111] mt-1">
                            Belum ada progres!
                          </p>
                          <p className="text-[11px] text-neutral-600">
                            Kerjakan minimal 1 paket soal supaya Guru Autopsi bisa membaca pola belajarmu.
                          </p>
                        </>
                      )}
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
              </div>

              {/* Section katalog mapel */}
              <div>
                <div className="flex items-center justify-between mb-2.5 md:mb-3">
                  <h3 className="text-base md:text-lg font-extrabold text-[#111]">
                    Pilih Mapel &amp; Paket Soal
                  </h3>
                  <button
                    type="button"
                    onClick={openAtur}
                    className="text-xs font-extrabold text-[#4F46E5] underline decoration-2 underline-offset-2"
                  >
                    ⚙️ Atur Pilihanmu
                  </button>
                </div>

                {/* Toolbar Search + Filter (Mobile: stacked | Desktop: satu baris toolbar atas) */}
                <div className="md:flex md:items-center md:justify-between md:gap-3 md:mb-4">
                  <div className="relative mb-3 md:mb-0 md:w-72 lg:w-80 shrink-0">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari Matematika, TKJ, Fisika, Bahasa Jepang..."
                      className="w-full bg-white border-2 border-[#111] rounded-xl px-3.5 py-2 text-xs font-semibold focus:outline-none focus:shadow-[0_0_0_2px_#B6FF00]"
                    />
                  </div>

                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 mb-3 md:pb-0 md:mb-0 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                </div>

                {/* Daftar kartu mapel (Mobile: 1 kolom space-y-3 | Desktop: grid 3-4 kolom) */}
                <div className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 xl:grid-cols-4 md:gap-4">
                  {filtered.length === 0 && (
                    <div className="md:col-span-full border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-6 text-center bg-white">
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
                  {filtered.map((m) => {
                    const stats = mapelStatsMap[m.key];
                    return (
                      <MapelCard
                        key={m.key}
                        m={m}
                        p1Stat={stats.p1}
                        p2Stat={stats.p2}
                        akurasiTerakhir={stats.akurasiTerakhir}
                        onOpen={openModeSheet}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* ===== Bottom nav (Hanya tampil di Mobile) ===== */}
          <div className="h-20 shrink-0 md:hidden" />
          <div className="md:hidden">
            <BottomNav active="latihan" />
          </div>
        </div>

        {/* ===== Bottom-sheet Pilih Mode ===== */}
        {modeSheet && (
          <div className="fixed inset-0 z-40 bg-black/60 flex justify-center items-end md:items-center md:p-4">
            <div className="bg-[#FAFAF7] border-t-2 md:border-2 border-[#111] rounded-t-3xl md:rounded-3xl md:shadow-[0_6px_0_#111] p-4 space-y-3 max-h-[85dvh] overflow-y-auto w-full max-w-[430px] md:max-w-[460px]">
              <div className="flex items-start justify-between">
                <div>
                  <span className="bg-[#E0E7FF] border border-[#111] px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                    Pilih Mode Pengerjaan
                  </span>
                  <h3 className="text-sm font-extrabold mt-0.5">
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

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setQuizMode('latihan')}
                  className={`border-2 border-[#111] shadow-[0_3px_0_#111] w-full p-3 rounded-2xl text-left flex items-start gap-3 ${
                    quizMode === 'latihan' ? 'bg-[#B6FF00]' : 'bg-white'
                  }`}
                >
                  <span className="w-7 h-7 rounded-xl border-2 border-[#111] bg-white flex items-center justify-center text-sm shrink-0 mt-0.5">
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
                    <ul className="text-[10px] text-[#111]/85 font-semibold mt-1 space-y-0 list-disc list-inside">
                      <li>
                        <b>Cek Jawaban</b> langsung per soal
                      </li>
                      <li>Pembahasan &amp; soal serupa terbuka</li>
                      <li>Timer acuan (bisa lanjut)</li>
                    </ul>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setQuizMode('simulasi')}
                  className={`border-2 border-[#111] shadow-[0_3px_0_#111] w-full p-3 rounded-2xl text-left flex items-start gap-3 ${
                    quizMode === 'simulasi' ? 'bg-[#B6FF00]' : 'bg-white'
                  }`}
                >
                  <span className="w-7 h-7 rounded-xl border-2 border-[#111] bg-[#E0E7FF] flex items-center justify-center text-sm shrink-0 mt-0.5">
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
                    <ul className="text-[10px] text-neutral-600 font-semibold mt-1 space-y-0 list-disc list-inside">
                      <li>
                        <b>Cek Jawaban dikunci</b> selama ujian
                      </li>
                      <li>
                        Timer ketat — <b>otomatis kumpul</b>
                      </li>
                      <li>
                        Pembahasan &amp; <b>Guru Autopsi</b> setelah selesai
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
          <div className="fixed inset-0 z-40 bg-black/60 flex justify-center items-end md:items-center md:p-4">
            <div className="bg-[#FAFAF7] border-t-2 md:border-2 border-[#111] rounded-t-3xl md:rounded-3xl md:shadow-[0_6px_0_#111] h-[80%] md:h-[75dvh] md:w-full md:max-w-[520px] flex flex-col overflow-hidden">
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
              <div className="flex-1 overflow-y-auto p-4 space-y-2 md:space-y-0 md:grid md:grid-cols-2 md:gap-2.5 md:content-start">
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
          <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-4">
            <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-5 bg-white w-full md:max-w-[460px] space-y-3">
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
          <div className="fixed inset-0 z-40 bg-black/50 flex items-center justify-center p-6">
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
        <Toast message={toast} className="bottom-24 shadow-lg" />

        {/* ===== Panel behavior log ===== */}
        {showLogPanel && (
          <LogPanelLive
            useLogs={useLogs}
            onClose={() => setShowLogPanel(false)}
            badge="Real-Time Telemetry"
            title="Behavior Log (Beranda)"
            zIndex="z-40"
          />
        )}
      </div>
    </div>
  );
}
