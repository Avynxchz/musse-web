'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { analyzeRuangAI, getAI1Insight } from '../../lib/analisis';
import { MAPEL_CATALOG } from '../arena/data';
import { DesktopSidebar } from '../components/DesktopSidebar';
import {
  BottomNav,
  ChatInput,
  LogCounterLive,
  NeoBtn,
  Toast,
  renderLatexToHtml,
  useBehaviorLog,
  useToast,
} from '../components/ui';

// Lazy-load LogPanelLive agar panel telemetry tidak menambah ukuran bundle awal halaman
const LogPanelLive = dynamic(() => import('../components/ui').then((m) => m.LogPanelLive), {
  ssr: false,
});

const MAPEL_OPTIONS = MAPEL_CATALOG.map((m) => ({
  value: m.key,
  label: m.name,
}));

const COACH_QUICK_PROMPTS = ['Jelasin topik lemahku', 'Bahas pola AI #1-ku', 'Tips ujian paket ini'] as const;

function buildCoachGreeting(
  mapelLabel: string,
  paketCoach: 1 | 2,
  coachPesan: string,
  pola: { nama: string; bukti: string }[] | undefined
): string {
  const detailAI1 =
    pola && pola.length > 0
      ? `<br/><br/>🔍 <b>Temuan AI #1 (Guru Autopsi):</b><br/>• ${pola
          .map((p) => `<b>${p.nama}</b>: ${p.bukti}`)
          .join('<br/>• ')}`
      : '';
  return `<b>Coach ${mapelLabel} · Paket ${paketCoach}</b><br/>${coachPesan}${detailAI1}`;
}

/** Isi percakapan Coach (daftar balon chat + quick prompts + input) untuk Desktop & Mobile. */
const RuangCoachChatBody = memo(function RuangCoachChatBody({
  variant,
  chatBoxRef,
  messages,
  mapelLabel,
  paketCoach,
  loading,
  onSend,
  coachError,
  onRetryCoach,
}: {
  variant: 'desktop' | 'mobile';
  chatBoxRef?: React.RefObject<HTMLDivElement | null>;
  messages: { from: 'user' | 'ai'; html: string; id?: number }[];
  mapelLabel: string;
  paketCoach: 1 | 2;
  loading?: boolean;
  onSend: (text: string) => void;
  coachError: string | null;
  onRetryCoach: () => void;
}) {
  const isDesktop = variant === 'desktop';
  return (
    <>
      <div
        ref={chatBoxRef}
        className={
          isDesktop
            ? 'flex-1 overflow-y-auto p-6 space-y-3.5 text-xs md:text-sm'
            : 'flex-1 overflow-y-auto p-4 space-y-3 text-xs'
        }
      >
        {messages.map((m, i) =>
          m.from === 'user' ? (
            <div key={m.id ?? i} className="flex justify-end">
              <div
                className={
                  isDesktop
                    ? 'bg-[#111] text-white rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%] font-semibold'
                    : 'bg-[#111] text-white rounded-2xl rounded-br-sm px-3 py-2 max-w-[85%] font-semibold'
                }
              >
                {m.html}
              </div>
            </div>
          ) : (
            <div
              key={m.id ?? i}
              className={
                isDesktop
                  ? 'bg-[#F0FFB8] border-2 border-[#111] shadow-[0_3px_0_#111] rounded-2xl rounded-bl-sm p-4 max-w-[88%]'
                  : 'bg-[#F0FFB8] border-2 border-[#111] shadow-[0_3px_0_#111] rounded-2xl rounded-bl-sm p-3 max-w-[92%]'
              }
            >
              <p
                className={isDesktop ? 'font-medium leading-relaxed' : 'font-medium'}
                dangerouslySetInnerHTML={{ __html: renderLatexToHtml(m.html) }}
              />
            </div>
          )
        )}
      </div>

      {coachError && (
        <div
          className={
            isDesktop
              ? 'px-5 py-2.5 bg-white border-t border-neutral-200 flex items-center gap-2 shrink-0'
              : 'px-3 py-2 bg-white border-t border-neutral-200 flex items-center gap-1.5 shrink-0'
          }
        >
          <span className="text-[11px] font-bold text-red-600">⚠️ Coach gagal terhubung</span>
          <button
            type="button"
            onClick={onRetryCoach}
            className={
              isDesktop
                ? 'shrink-0 bg-[#FAFAF7] hover:bg-[#B6FF00] transition-colors border-2 border-[#111] shadow-[0_3px_0_#111] px-3 py-1.5 rounded-full text-xs font-bold'
                : 'shrink-0 bg-[#FAFAF7] border-2 border-[#111] shadow-[0_3px_0_#111] px-2.5 py-1 rounded-full text-[11px] font-bold'
            }
          >
            🔄 Coba lagi
          </button>
        </div>
      )}

      <div
        className={
          isDesktop
            ? 'px-5 py-2.5 bg-white border-t border-neutral-200 flex gap-2 overflow-x-auto shrink-0'
            : 'px-3 py-2 bg-white border-t border-neutral-200 flex gap-1.5 overflow-x-auto shrink-0'
        }
      >
        {COACH_QUICK_PROMPTS.map((qp) => (
          <button
            key={qp}
            type="button"
            disabled={loading}
            onClick={() => onSend(qp)}
            className={
              isDesktop
                ? 'shrink-0 bg-[#FAFAF7] hover:bg-[#B6FF00] transition-colors border-2 border-[#111] shadow-[0_3px_0_#111] px-3 py-1.5 rounded-full text-xs font-bold disabled:opacity-50'
                : 'shrink-0 bg-[#FAFAF7] border-2 border-[#111] shadow-[0_3px_0_#111] px-2.5 py-1 rounded-full text-[11px] font-bold disabled:opacity-50'
            }
          >
            {qp}
          </button>
        ))}
      </div>

      <ChatInput
        placeholder={`Tanya Coach ${mapelLabel} Paket ${paketCoach}...`}
        disabled={loading}
        onSend={onSend}
      />
    </>
  );
});

/* ================= Halaman ================= */

export default function RuangPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [storageTick, setStorageTick] = useState(0);
  const [mapelCoach, setMapelCoach] = useState('matematika');
  const [paketCoach, setPaketCoach] = useState<1 | 2>(1);
  const { toast, showToastMsg } = useToast();
  const { logEvent, useLogCount, useLogs, showLogPanel, setShowLogPanel } = useBehaviorLog('ruang');

  useEffect(() => {
    setMounted(true);
    const onSync = () => setStorageTick((t) => t + 1);
    window.addEventListener('focus', onSync);
    window.addEventListener('storage', onSync);
    return () => {
      window.removeEventListener('focus', onSync);
      window.removeEventListener('storage', onSync);
    };
  }, []);

  /* ---------- AI #3: Kombinasi Log per (mapel, paket) + Insight AI #1 ---------- */
  const statRuang = useMemo(() => {
    if (!mounted) return analyzeRuangAI(mapelCoach, paketCoach, []);
    return analyzeRuangAI(mapelCoach, paketCoach);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, mapelCoach, paketCoach, storageTick]);

  const ai1Insight = useMemo(() => {
    if (!mounted) return null;
    return getAI1Insight(mapelCoach, paketCoach);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, mapelCoach, paketCoach, storageTick]);

  const mapelLabel =
    MAPEL_OPTIONS.find((o) => o.value === mapelCoach)?.label ?? statRuang.mapelName ?? 'Matematika (Wajib)';

  const coachKuat = statRuang.adaData
    ? statRuang.topikKuat[0] ?? 'Belum ada topik dominan'
    : 'Belum ada data';
  const coachLemah = statRuang.adaData
    ? statRuang.topikLemah[0] ?? 'Tidak ada kebocoran topik'
    : 'Belum ada data';
  const coachPesan = statRuang.adaData
    ? statRuang.pesanCoach
    : `Belum ada data untuk ${mapelLabel} Paket ${paketCoach}!`;

  /* ===== Chat Coach per mapel + paket ===== */
  const [showCoach, setShowCoach] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<{ from: 'user' | 'ai'; html: string; id?: number }[]>([]);
  const [coachQuota, setCoachQuota] = useState(24);
  const [coachError, setCoachError] = useState<string | null>(null);
  const [coachLoading, setCoachLoading] = useState(false);
  const chatBoxRef = useRef<HTMLDivElement | null>(null);
  const greetedKeyRef = useRef<string>('');
  // Guard anti double-submit chat (<500ms, pesan sama)
  const lastCoachMsgRef = useRef<{ msg: string; ts: number }>({ msg: '', ts: 0 });
  const coachIdRef = useRef(0);
  const coachAbortRef = useRef<AbortController | null>(null);

  // Page view logging + cleanup AbortController saat unmount
  useEffect(() => {
    logEvent('page_view', { page: 'ruang' });
    return () => {
      if (coachAbortRef.current) coachAbortRef.current.abort();
    };
  }, [logEvent]);

  const gantiMapel = useCallback((v: string) => {
    if (coachAbortRef.current) coachAbortRef.current.abort();
    setCoachLoading(false);
    setMapelCoach(v);
    setChatMsgs([]);
    greetedKeyRef.current = '';
    logEvent('switch_ai_room', { mapel: v, paket: paketCoach });
  }, [logEvent, paketCoach]);

  const gantiPaket = useCallback((p: 1 | 2) => {
    if (coachAbortRef.current) coachAbortRef.current.abort();
    setCoachLoading(false);
    setPaketCoach(p);
    setChatMsgs([]);
    greetedKeyRef.current = '';
    logEvent('switch_ai_room_paket', { mapel: mapelCoach, paket: p });
  }, [logEvent, mapelCoach]);

  const openCoach = useCallback(() => {
    setShowCoach(true);
    logEvent('coach_chat_open', { mapel: mapelCoach, paket: paketCoach });
    const sessionKey = `${mapelCoach}_p${paketCoach}_${statRuang.adaData ? statRuang.totalSoal : 0}`;
    if (greetedKeyRef.current !== sessionKey) {
      greetedKeyRef.current = sessionKey;
      setChatMsgs([
        {
          from: 'ai',
          html: buildCoachGreeting(mapelLabel, paketCoach, coachPesan, ai1Insight?.pola),
          id: ++coachIdRef.current,
        },
      ]);
    }
  }, [ai1Insight?.pola, coachPesan, logEvent, mapelCoach, mapelLabel, paketCoach, statRuang.adaData, statRuang.totalSoal]);

  // Error Coach hanya berlaku untuk konteks mapel/paket saat ini; ganti
  // konteks -> bersihkan supaya "Coba lagi" tidak mengirim ke konteks baru.
  useEffect(() => {
    setCoachError(null);
  }, [mapelCoach, paketCoach]);

  const sendCoachMsg = useCallback(async (text: string) => {
    const msg = text.trim();
    if (!msg) return;
    // Guard: cegah pesan duplikat dari double-click (<500ms, pesan sama)
    // eslint-disable-next-line react-hooks/purity -- Date.now() di event handler (bukan render), aman
    const now = Date.now();
    if (lastCoachMsgRef.current.msg === msg && now - lastCoachMsgRef.current.ts < 500) return;
    lastCoachMsgRef.current = { msg, ts: now };
    if (coachQuota <= 0) {
      showToastMsg('⚠️ Kuota tanya habis hari ini');
      return;
    }

    setCoachError(null);
    const safeUserHtml = msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    setChatMsgs((prev) => [
      ...prev,
      { from: 'user', html: safeUserHtml, id: ++coachIdRef.current },
      { from: 'ai', html: '⏳ <i>Coach sedang menganalisis datamu...</i>', id: ++coachIdRef.current },
    ]);
    logEvent('coach_chat_ask', {
      mapel: mapelCoach,
      paket: paketCoach,
      prompt: msg.slice(0, 60),
      quota_remaining: coachQuota,
    });

    const polaContext =
      statRuang.polaAI1.length > 0
        ? statRuang.polaAI1
            .map(
              (p) =>
                `${p.nama} (${p.bukti}${p.rekomendasi ? ` | Rekomendasi: ${p.rekomendasi}` : ''})`
            )
            .join('; ')
        : 'Tidak ada pola kebocoran spesifik';
    const lemahContext =
      statRuang.topikLemah.length > 0 ? statRuang.topikLemah.join(', ') : 'Tidak ada topik lemah';
    const kuatContext =
      statRuang.topikKuat.length > 0 ? statRuang.topikKuat.join(', ') : '-';
    const nomorSalahContext =
      statRuang.soalSalahNomor.length > 0
        ? `Soal #${statRuang.soalSalahNomor.slice(0, 10).join(', #')}`
        : 'Tidak ada';
    const nomorRef = statRuang.soalSalahNomor[0] || statRuang.polaAI1[0]?.soalContoh || 1;

    // Pertanyaan siswa ditaruh PALING DEPAN + aturan prioritas eksplisit
    // (pola yang sama seperti fix arena PR #9: konteks panjang di bawah ini
    // sebelumnya bisa "membajak" jawaban kalau pertanyaan tidak berkaitan).
    const contextualMessage =
      `Pertanyaan siswa: ${msg}\n` +
      `\nATURAN UTAMA: Jawab PERTANYAAN SISWA di atas. Konteks statistik di bawah HANYA dipakai kalau pertanyaan berkaitan dengan progres belajar mapel ini. Kalau pertanyaan TIDAK berkaitan dengan progres tersebut (misalnya pertanyaan umum, pelajaran lain, atau hitungan lain), jawab pertanyaan itu saja secara langsung — JANGAN membahas statistik, dan JANGAN menampilkan insight/pola yang tidak ditanyakan.\n` +
      `\n[KONTEKS DISKUSI RUANG AI #3 - ${mapelLabel} Paket ${paketCoach}]\n` +
      `- Status Data: ${statRuang.adaData ? `Akurasi ${statRuang.akurasiPct}% (${statRuang.totalBenar}/${statRuang.totalSoal} soal benar)` : `Belum ada data pengerjaan untuk ${mapelLabel} Paket ${paketCoach}`}\n` +
      `- Topik Lemah (${mapelLabel} Paket ${paketCoach}): ${lemahContext}\n` +
      `- Topik Kuat (${mapelLabel} Paket ${paketCoach}): ${kuatContext}\n` +
      `- Nomor Soal Salah: ${nomorSalahContext}\n` +
      `- Insight AI #1 (Guru Autopsi): ${polaContext}\n\n` +
      `Pertanyaan siswa: ${msg}`;

    if (coachAbortRef.current) coachAbortRef.current.abort();
    const aborter = new AbortController();
    coachAbortRef.current = aborter;
    setCoachLoading(true);

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: mapelCoach,
          paket: paketCoach,
          nomor: nomorRef,
          topik_lemah: statRuang.topikLemah,
          pola_ai1: statRuang.polaAI1.map((p) => p.nama),
          message: contextualMessage,
        }),
        signal: aborter.signal,
      });
      const data = await res.json();

      let replyHtml: string;
      if (data.status === 'success' && data.reply) {
        const escaped = String(data.reply)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n\n/g, '<br/><br/>')
          .replace(/\n/g, '<br/>');
        replyHtml = `<b>🤖 Coach ${mapelLabel} (P${paketCoach}):</b><br/>${escaped}`;
        // Kuota hanya kepotong kalau Coach beneran jawab
        setCoachQuota((q) => Math.max(0, q - 1));
      } else if (data.status === 'rate_limited') {
        replyHtml = `⏸️ <b>${data.message || 'Kuota habis, coba lagi nanti.'}</b>`;
      } else {
        // Backend error -> tampilkan error jujur, JANGAN jawaban fallback
        const errMsg = String(data.message || 'Gagal mendapatkan respons AI.')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        replyHtml = `⚠️ <b>Coach gagal terhubung.</b> ${errMsg} Tekan tombol "Coba lagi" di bawah untuk mengulang pertanyaanmu.`;
        setCoachError(errMsg);
      }

      setChatMsgs((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...next[next.length - 1], from: 'ai', html: replyHtml };
        return next;
      });
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return;
      setCoachError('Koneksi Coach gagal.');
      setChatMsgs((prev) => {
        const next = [...prev];
        next[next.length - 1] = { ...next[next.length - 1], from: 'ai', html: `⚠️ <b>Koneksi Coach gagal.</b> Periksa koneksimu lalu tekan tombol "Coba lagi" di bawah.` };
        return next;
      });
    } finally {
      setCoachLoading(false);
    }
  }, [coachQuota, logEvent, mapelCoach, mapelLabel, paketCoach, showToastMsg, statRuang]);

  // Kirim ulang pertanyaan terakhir saat Coach gagal (tombol "Coba lagi")
  const retryCoach = () => {
    if (lastCoachMsgRef.current.msg) sendCoachMsg(lastCoachMsgRef.current.msg);
  };

  useEffect(() => {
    const el = chatBoxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMsgs, showCoach]);

  const desktopCoachMsgs =
    chatMsgs.length > 0
      ? chatMsgs
      : [
          {
            from: 'ai' as const,
            html: buildCoachGreeting(mapelLabel, paketCoach, coachPesan, ai1Insight?.pola),
          },
        ];

  return (
    <div className="min-h-dvh bg-[#18181B] flex justify-center">
      <div className="relative w-full max-w-[430px] md:max-w-none min-h-dvh bg-[#FAFAF7] flex flex-col md:flex-row sm:border-x-2 md:border-x-0 sm:border-[#111] overflow-hidden md:overflow-visible">
        {/* ===== Sidebar Kiri Desktop (md:+) ===== */}
        <DesktopSidebar active="ruang" />

        {/* ===== Kolom Utama Konten ===== */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* ===== Header ===== */}
          <header className="bg-white border-b-2 border-[#111] px-4 md:px-8 py-3 md:py-4 flex items-center justify-between shrink-0 md:sticky md:top-0 md:z-20">
          <div>
            <h2 className="text-base md:text-lg font-extrabold">Ruang AI & Progres Belajar</h2>
            <p className="text-[11px] md:text-xs text-neutral-500">Analisis kumulatif & konsultasi AI Coach per mapel</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LogCounterLive useLogCount={useLogCount} onClick={() => setShowLogPanel((v) => !v)} />
            <span className="border-2 border-[#111] shadow-[0_4px_0_#111] bg-[#B6FF00] px-2.5 py-1 rounded-full text-[11px] font-extrabold">
              Akurasi {statRuang.adaData ? `${statRuang.akurasiPct}%` : '—'}
            </span>
          </div>
        </header>

        {/* ===== Konten scroll (Mobile: 1 kolom, Desktop: 2 kolom 35% kiri sticky + 65% kanan chat Coach) ===== */}
        <div className="flex-1 overflow-y-auto md:overflow-visible p-4 md:p-6 space-y-4 md:space-y-0 pb-8 md:flex md:flex-row md:items-start md:gap-6">
          {/* ===== KOLOM KIRI (35% di desktop, sticky): Selector Mapel/Paket + Statistik + Topik ===== */}
          <div className="w-full md:w-[35%] md:shrink-0 md:sticky md:top-24 space-y-4">
            {/* 3 kartu statistik — DATA BENERAN khusus (mapelCoach, paketCoach) */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-xl p-3 text-center bg-white">
                <p className="font-mono text-lg text-[#111] font-extrabold">
                  {statRuang.adaData ? statRuang.totalSoal : '—'}
                </p>
                <p className="text-[10px] font-bold text-neutral-500 uppercase mt-1">Soal Selesai</p>
              </div>
              <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-xl p-3 text-center bg-[#B6FF00]">
                <p className="font-mono text-lg text-[#111] font-extrabold">
                  {statRuang.adaData ? `${statRuang.akurasiPct}%` : '—'}
                </p>
                <p className="text-[10px] font-extrabold text-[#111] uppercase mt-1">Akurasi</p>
              </div>
              <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-xl p-3 text-center bg-white">
                <p className="font-mono text-lg text-[#4F46E5] font-extrabold">
                  {statRuang.adaData ? statRuang.jamFokus : '—'}
                </p>
                <p className="text-[10px] font-bold text-neutral-500 uppercase mt-1">Jam Fokus</p>
              </div>
            </div>
            {!statRuang.adaData && (
              <div className="border-2 border-dashed border-neutral-300 rounded-xl p-3 text-center">
                <p className="text-xs text-neutral-500 font-medium">
                  📊 Belum ada data untuk {mapelLabel} Paket {paketCoach}!
                </p>
              </div>
            )}

            {/* Kartu Ruang AI Coach */}
            <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-4 bg-white space-y-3">
              <div className="flex items-center justify-between gap-2 md:flex-col md:items-stretch">
                <span className="text-xs font-extrabold uppercase tracking-wider text-[#4F46E5] shrink-0">
                  🧠 Ruang AI Coach
                </span>
                <div className="flex items-center gap-1.5 min-w-0">
                  <select
                    value={mapelCoach}
                    onChange={(e) => gantiMapel(e.target.value)}
                    className="border-2 border-[#111] rounded-lg px-2 py-1 md:py-1.5 text-xs font-extrabold bg-[#FAFAF7] min-w-0 flex-1 truncate"
                    aria-label="Pilih Mapel"
                  >
                    {MAPEL_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={paketCoach}
                    onChange={(e) => gantiPaket(Number(e.target.value) === 2 ? 2 : 1)}
                    className="border-2 border-[#111] rounded-lg px-2 py-1 md:py-1.5 text-xs font-extrabold bg-[#FAFAF7] shrink-0"
                    aria-label="Pilih Paket"
                  >
                    <option value={1}>Paket 1</option>
                    <option value={2}>Paket 2</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-green-50 border border-[#111] rounded-xl p-2.5">
                  <span className="text-[10px] font-extrabold text-green-800 uppercase">💪 Topik Terkuat</span>
                  <p className="font-extrabold mt-0.5">{coachKuat}</p>
                </div>
                <div className="bg-red-50 border border-[#111] rounded-xl p-2.5">
                  <span className="text-[10px] font-extrabold text-red-800 uppercase">⚠️ Perlu Dikejar</span>
                  <p className="font-extrabold mt-0.5">{coachLemah}</p>
                </div>
              </div>

              <div className="bg-[#FAFAF7] border-2 border-[#111] rounded-xl p-3 space-y-2">
                <div className="text-xs bg-white border border-[#111] rounded-xl p-2.5 space-y-1">
                  <div>
                    <span className="font-extrabold text-[#4F46E5]">Coach:</span> {coachPesan}
                  </div>
                  {statRuang.adaData && statRuang.polaAI1.length > 0 && statRuang.polaAI1[0].rekomendasi && (
                    <p className="text-[11px] text-neutral-700 pt-1 border-t border-dashed border-neutral-200">
                      <b>💡 Saran AI #1:</b> {statRuang.polaAI1[0].rekomendasi}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <NeoBtn
                    onClick={() => {
                      logEvent('coach_latih_topik_lemah', {
                        mapel: mapelCoach,
                        paket: paketCoach,
                        topik: coachLemah,
                      });
                      router.push(`/arena?mapel=${mapelCoach}&paket=${paketCoach}&mode=latihan`);
                    }}
                    className="flex-1 bg-[#B6FF00] py-2 rounded-xl text-xs"
                  >
                    🎯 Latih Paket {paketCoach}
                  </NeoBtn>
                  <NeoBtn onClick={openCoach} className="flex-1 bg-white py-2 rounded-xl text-xs md:hidden">
                    💬 Diskusi sama Coach
                  </NeoBtn>
                </div>
              </div>
            </div>

            {!statRuang.adaData && (
              <p className="text-center text-[11px] text-neutral-400">
                Kerjakan {mapelLabel} Paket {paketCoach} untuk melihat analisis AI #1 & AI #3.
              </p>
            )}
          </div>

          {/* ===== KOLOM KANAN (65% di desktop): Chat Coach Permanen & Lebar ===== */}
          <div className="hidden md:flex md:w-[65%] md:min-w-0 md:flex-col">
            <div className="bg-[#FAFAF7] border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl h-[calc(100dvh-10rem)] min-h-[540px] flex flex-col overflow-hidden">
              <div className="bg-white border-b-2 border-[#111] px-5 py-3.5 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-[#B6FF00] border-2 border-[#111] flex items-center justify-center text-sm font-extrabold shrink-0">
                    ✨
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-sm font-extrabold truncate">
                      Coach {mapelLabel} · Paket {paketCoach}
                    </h3>
                    <p className="text-xs text-green-700 font-bold truncate">
                      ✓ {statRuang.adaData ? `Siap bahas ${coachLemah}` : `Belum ada data Paket ${paketCoach}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="bg-[#E0E7FF] border-2 border-[#111] px-3 py-1 rounded-full text-xs font-extrabold">
                    {coachQuota}/25 Tanya
                  </span>
                </div>
              </div>

              <RuangCoachChatBody
                variant="desktop"
                chatBoxRef={showCoach ? undefined : chatBoxRef}
                messages={desktopCoachMsgs}
                mapelLabel={mapelLabel}
                paketCoach={paketCoach}
                loading={coachLoading}
                onSend={sendCoachMsg}
                coachError={coachError}
                onRetryCoach={retryCoach}
              />
            </div>
          </div>
        </div>

        {/* ===== Bottom nav (Hanya tampil di Mobile) ===== */}
        <div className="h-20 shrink-0 md:hidden" />
        <div className="md:hidden">
          <BottomNav active="ruang" />
        </div>

        {/* ===== COACH CHAT SHEET (Mobile Only) ===== */}
        {showCoach && (
          <div
            className="absolute inset-0 z-40 bg-black/50 flex md:hidden flex-col justify-end"
            onClick={() => setShowCoach(false)}
          >
            <div
              className="bg-[#FAFAF7] border-t-2 border-[#111] rounded-t-3xl h-[82%] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white border-b-2 border-[#111] px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-7 h-7 rounded-full bg-[#B6FF00] border border-[#111] flex items-center justify-center text-xs font-extrabold shrink-0">
                    ✨
                  </span>
                  <div className="min-w-0">
                    <h3 className="text-xs font-extrabold truncate">
                      Coach {mapelLabel} · Paket {paketCoach}
                    </h3>
                    <p className="text-[10px] text-green-700 font-bold truncate">
                      ✓ {statRuang.adaData ? `Siap bahas ${coachLemah}` : `Belum ada data Paket ${paketCoach}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="bg-[#E0E7FF] border border-[#111] px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                    {coachQuota}/25 Tanya
                  </span>
                  <NeoBtn onClick={() => setShowCoach(false)} className="w-7 h-7 rounded-lg bg-white text-xs">
                    ✕
                  </NeoBtn>
                </div>
              </div>

              <RuangCoachChatBody
                variant="mobile"
                chatBoxRef={chatBoxRef}
                messages={chatMsgs}
                mapelLabel={mapelLabel}
                paketCoach={paketCoach}
                loading={coachLoading}
                onSend={sendCoachMsg}
                coachError={coachError}
                onRetryCoach={retryCoach}
              />
            </div>
          </div>
        )}

        {/* ===== Toast ===== */}
        <Toast message={toast} className="bottom-20" />

        {/* ===== Panel behavior log ===== */}
        {showLogPanel && (
          <LogPanelLive
            useLogs={useLogs}
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
