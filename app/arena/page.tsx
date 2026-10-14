'use client';

import { Suspense, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  QUESTIONS,
  QuizMode,
  evaluateQuestion,
  formatKunci,
  getDurasiDetik,
  getMapel,
} from './data';
import {
  ChatInput,
  LogPanel,
  NeoBtn,
  Toast,
  type LogEntry,
} from '../components/ui';

/* ================= Behavior log (dummy: console + counter) ================= */

let logId = 1;

/* ================= Komponen kecil ================= */

function formatHMS(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

const FONT_SCALES = [90, 100, 115, 130];

type Answer = string | string[] | Record<string, string> | undefined;

/* ================= Timer terisolasi ================= */

/**
 * Timer countdown dengan state sendiri: detak tiap detik HANYA me-render
 * chip timer ini, bukan seluruh halaman arena (hemat re-render).
 * Callback kedaluwarsa selalu versi terbaru via ref (tanpa stale closure).
 */
const ArenaTimer = memo(function ArenaTimer({
  durasiDetik,
  mode,
  onSimulasiExpired,
  onLatihanExpired,
}: {
  durasiDetik: number;
  mode: QuizMode;
  onSimulasiExpired: () => void;
  onLatihanExpired: () => void;
}) {
  const [timerSec, setTimerSec] = useState(durasiDetik);
  const cbRef = useRef({ onSimulasiExpired, onLatihanExpired, mode });
  // Sinkronisasi ref di effect (bukan saat render) — pola "latest ref" resmi
  useEffect(() => {
    cbRef.current = { onSimulasiExpired, onLatihanExpired, mode };
  });

  useEffect(() => {
    if (timerSec <= 0) return;
    const t = setTimeout(() => {
      if (timerSec - 1 <= 0) {
        setTimerSec(0);
        const cb = cbRef.current;
        if (cb.mode === 'latihan') cb.onLatihanExpired();
        else cb.onSimulasiExpired();
      } else {
        setTimerSec(timerSec - 1);
      }
    }, 1000);
    return () => clearTimeout(t);
  }, [timerSec]);

  const timerDanger = timerSec <= 300;

  return (
    <div
      className={`border-2 border-[#111] shadow-[0_3px_0_#111] px-2 py-1 rounded-lg font-mono text-xs font-extrabold flex items-center gap-1 shrink-0 ${
        timerDanger ? 'bg-red-100 text-red-900 animate-pulse' : 'bg-[#FAFAF7]'
      }`}
    >
      <span>⏱</span>
      <span>{formatHMS(timerSec)}</span>
    </div>
  );
});

/* ================= Komponen utama ================= */

function ArenaClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // --- params ---
  const mode: QuizMode = searchParams.get('mode') === 'simulasi' ? 'simulasi' : 'latihan';
  const mapelKey = searchParams.get('mapel') || 'matematika';
  const paket: 1 | 2 = searchParams.get('paket') === '2' ? 2 : 1;
  const mapel = useMemo(() => getMapel(mapelKey), [mapelKey]);
  const durasiDetik = useMemo(() => getDurasiDetik(mapel, paket), [mapel, paket]);

  // --- state ---
  const [qIndex, setQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, Answer>>({});
  const [ragu, setRagu] = useState<Record<number, boolean>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [pilarExpanded, setPilarExpanded] = useState(false);
  const [fontScaleIdx, setFontScaleIdx] = useState(1);
  const [tutorQuota, setTutorQuota] = useState(24);
  const [showPeta, setShowPeta] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [timeUpLatihan, setTimeUpLatihan] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>(() => [
    {
      id: 1,
      event: 'quiz_start',
      ts: new Date().toLocaleTimeString('id-ID'),
      payload: { mapel: mapelKey, paket, mode },
    },
  ]);
  const [showLogPanel, setShowLogPanel] = useState(false);
  const [simSoalOpen, setSimSoalOpen] = useState(false);
  const [simFeedback, setSimFeedback] = useState<string | null>(null);
  const [previewSoalOpen, setPreviewSoalOpen] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<{ from: 'ai' | 'user'; html: string }[]>([]);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const evalRef = useRef<HTMLDivElement>(null);
  // Guard anti double-submit / double-finish (race condition)
  const finishingRef = useRef(false);
  const lastChatRef = useRef<{ msg: string; ts: number }>({ msg: '', ts: 0 });

  // Cleanup: cegah setState setelah unmount (toast timer)
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  const q = QUESTIONS[qIndex];
  const isLast = qIndex === QUESTIONS.length - 1;
  const fontScale = FONT_SCALES[fontScaleIdx];

  // --- behavior log ---
  const logEvent = useCallback((event: string, payload: Record<string, unknown> = {}) => {
    const entry: LogEntry = {
      id: ++logId,
      event,
      ts: new Date().toLocaleTimeString('id-ID'),
      payload,
    };
    console.log(`[arena] ${event}`, payload);
    setLogs((prev) => [entry, ...prev].slice(0, 200));
  }, []);

  const showToastMsg = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  // --- timer ---
  const finishQuiz = (endedBy: 'user' | 'timer') => {
    // Guard: cegah double-finish (double-click / timer + klik manual bersamaan)
    if (finishingRef.current) return;
    finishingRef.current = true;
    const hasil = QUESTIONS.map((qq, i) => evaluateQuestion(qq, answers[i]));
    const benar = hasil.filter((h) => h === 'benar').length;
    logEvent('attempt_finish', {
      mode,
      ended_by: endedBy,
      benar,
      total: QUESTIONS.length,
    });
    router.push(`/hasil?mode=${mode}&mapel=${mapel.key}&paket=${paket}&benar=${benar}&total=${QUESTIONS.length}`);
  };

  // --- timer: state countdown hidup di <ArenaTimer> (terisolasi).
  // Callback kedaluwarsa stabil via ref agar tanpa stale closure.
  const finishQuizRef = useRef(finishQuiz);
  useEffect(() => {
    finishQuizRef.current = finishQuiz;
  });

  const handleTimerSimulasiExpired = useCallback(() => {
    logEvent('timer_expired_simulasi_autosubmit', {});
    finishQuizRef.current('timer');
  }, [logEvent]);

  const handleTimerLatihanExpired = useCallback(() => {
    setTimeUpLatihan(true);
    logEvent('timer_expired_latihan', {});
    showToastMsg('⏰ Waktu acuan habis! Lanjut santai.');
  }, [logEvent, showToastMsg]);

  // --- navigasi soal ---
  const goSoal = (idx: number) => {
    if (idx < 0 || idx >= QUESTIONS.length) return;
    setQIndex(idx);
    setPilarExpanded(false);
    setSimSoalOpen(false);
    setSimFeedback(null);
    logEvent('soal_view', { soal_no: QUESTIONS[idx].nomor, tipe: QUESTIONS[idx].tipe, mode });
    scrollBodyRef.current?.scrollTo({ top: 0 });
  };

  // --- pilih opsi ---
  const pickOption = (key: string) => {
    const isComplex = q.tipe === 'Pilihan Ganda Kompleks';
    setAnswers((prev) => {
      const cur = prev[qIndex];
      if (isComplex) {
        const arr = Array.isArray(cur) ? [...cur] : [];
        const next = arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key];
        return { ...prev, [qIndex]: next };
      }
      return { ...prev, [qIndex]: key };
    });
    setChecked((prev) => ({ ...prev, [qIndex]: false }));
    logEvent('option_click', { soal_no: q.nomor, opsi: key, mode });
  };

  const pickBs = (stmtKey: string, val: 'Benar' | 'Salah') => {
    setAnswers((prev) => {
      const cur = (prev[qIndex] as Record<string, string>) || {};
      return { ...prev, [qIndex]: { ...cur, [stmtKey]: val } };
    });
    setChecked((prev) => ({ ...prev, [qIndex]: false }));
    logEvent('option_click_bs', { soal_no: q.nomor, statement: stmtKey, val, mode });
  };

  const toggleRagu = () => {
    setRagu((prev) => ({ ...prev, [qIndex]: !prev[qIndex] }));
    logEvent('flag_ragu', { soal_no: q.nomor, ragu: !ragu[qIndex] });
  };

  // --- aksi utama ---
  const handlePrimary = () => {
    if (mode === 'simulasi') {
      if (isLast) finishQuiz('user');
      else goSoal(qIndex + 1);
      return;
    }
    // mode latihan
    if (!checked[qIndex]) {
      const ans = answers[qIndex];
      const kosong =
        ans === undefined ||
        (typeof ans === 'string' && ans === '') ||
        (Array.isArray(ans) && ans.length === 0);
      if (kosong) {
        showToastMsg('⚠️ Pilih jawabanmu dulu sebelum Cek Jawaban!');
        return;
      }
      setChecked((prev) => ({ ...prev, [qIndex]: true }));
      logEvent('check_answer', { soal_no: q.nomor, jawaban: ans });
      setTimeout(() => evalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 120);
    } else {
      if (isLast) finishQuiz('user');
      else goSoal(qIndex + 1);
    }
  };

  const cycleFontScale = () => {
    const next = (fontScaleIdx + 1) % FONT_SCALES.length;
    setFontScaleIdx(next);
    showToastMsg(`Ukuran teks: ${FONT_SCALES[next]}%`);
    logEvent('font_scale_change', { scale: FONT_SCALES[next] });
  };

  // --- AI tutor ---
  const openTutor = () => {
    setShowTutor(true);
    const note =
      mode === 'simulasi'
        ? 'Mode Simulasi: aku kasih petunjuk konsep tanpa bocorin kunci ya!'
        : `Aku udah baca <b>Soal #${q.nomor} (${q.topik})</b>. Bagian mana yang bikin bingung?`;
    setChatMsgs([
      { from: 'ai', html: `<b>AI Tutor</b><br/>Halo! ${note}` },
    ]);
    setPreviewSoalOpen(false);
    logEvent('ai_tutor_open', { soal_no: q.nomor, mode });
  };

  const sendChat = (text: string) => {
    const msg = text.trim();
    if (!msg) return;
    // Guard: cegah pesan duplikat dari double-click submit (<500ms, pesan sama)
    // eslint-disable-next-line react-hooks/purity -- Date.now() di event handler (bukan render), aman
    const now = Date.now();
    if (lastChatRef.current.msg === msg && now - lastChatRef.current.ts < 500) return;
    lastChatRef.current = { msg, ts: now };
    setTutorQuota((qt) => Math.max(0, qt - 1));
    const reply =
      mode === 'simulasi'
        ? `<b>Petunjuk konsep (${q.topik}):</b><br/>${q.pilar1}`
        : `${q.ringkas}<br/><br/>💡 <b>Trik:</b> ${q.pilar5}`;
    setChatMsgs((prev) => [
      ...prev,
      { from: 'user', html: msg },
      { from: 'ai', html: reply },
    ]);
    logEvent('ai_tutor_ask', { soal_no: q.nomor, prompt: msg.slice(0, 60) });
  };

  // --- soal serupa ---
  const checkSimilar = (idx: number) => {
    const sim = q.similar;
    const ok = idx === sim.ans;
    setSimFeedback(`${ok ? '✅' : '❌'} ${sim.exp}`);
    logEvent('similar_question_answer', { soal_no: q.nomor, benar: ok });
  };

  // --- render helpers ---
  const status = evaluateQuestion(q, answers[qIndex]);
  const isChecked = !!checked[qIndex];
  const showEval = mode === 'latihan' && isChecked;
  const kunciStr = formatKunci(q);

  const primaryLabel =
    mode === 'simulasi'
      ? isLast
        ? 'Selesai & Kumpulkan 🏁'
        : 'Selanjutnya →'
      : !isChecked
        ? 'Cek Jawaban ✓'
        : isLast
          ? 'Selesai & Autopsi 🏁'
          : 'Soal Selanjutnya →';

  const primaryStyle =
    mode === 'simulasi' || (isChecked && isLast)
      ? 'bg-[#111] text-[#B6FF00]'
      : !isChecked
        ? 'bg-[#B6FF00] text-[#111]'
        : 'bg-[#4F46E5] text-white';

  const mapelShort = mapel.name.split(' ')[0];
  const soalLabel = `${mapelShort} · P${paket}`;

  return (
    <div className="min-h-dvh bg-[#18181B] flex justify-center">
      <div className="relative w-full max-w-[430px] min-h-dvh bg-[#FAFAF7] flex flex-col sm:border-x-2 sm:border-[#111] overflow-hidden">
        {/* ===== TOP BAR ===== */}
        <header className="bg-white border-b-2 border-[#111] px-3 py-2.5 flex items-center justify-between gap-1.5 shrink-0 sticky top-0 z-30">
          <NeoBtn
            onClick={() => setShowExitConfirm(true)}
            className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-xs shrink-0"
            title="Keluar ke Beranda"
          >
            ✕
          </NeoBtn>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1">
              <span
                className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-[#111] shrink-0 ${
                  mode === 'simulasi' ? 'bg-amber-300' : 'bg-[#B6FF00]'
                }`}
              >
                {mode === 'simulasi' ? '⚡ Simulasi' : '🌱 Latihan'}
              </span>
              <span className="text-xs font-extrabold truncate">{soalLabel}</span>
              <span className="bg-[#111] text-[#B6FF00] text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0">
                {q.nomor}/{QUESTIONS.length}
              </span>
            </div>
          </div>
          <ArenaTimer
            key={`${mapelKey}-p${paket}`}
            durasiDetik={durasiDetik}
            mode={mode}
            onSimulasiExpired={handleTimerSimulasiExpired}
            onLatihanExpired={handleTimerLatihanExpired}
          />
          <NeoBtn
            onClick={cycleFontScale}
            className="px-2 py-1 rounded-lg bg-white text-[11px] shrink-0"
            title="Ukuran teks"
          >
            Aa
          </NeoBtn>
          <NeoBtn
            onClick={() => {
              setShowPeta(true);
              logEvent('peta_soal_open', { soal_no: q.nomor });
            }}
            className="px-2 py-1 rounded-lg bg-[#E0E7FF] text-xs flex items-center gap-1 shrink-0"
          >
            <span>▦</span>
            <span>Peta</span>
          </NeoBtn>
          {/* behavior log counter */}
          <button
            onClick={() => setShowLogPanel(true)}
            className="shrink-0 bg-[#111] text-[#B6FF00] text-[10px] font-extrabold px-1.5 py-1 rounded-full"
            title="Behavior log"
          >
            📡{logs.length}
          </button>
        </header>

        {/* ===== PROGRESS BAR ===== */}
        <div className="w-full h-1.5 bg-neutral-200 border-b border-[#111] shrink-0">
          <div
            className="h-full w-full bg-[#B6FF00] transition-transform duration-300 origin-left"
            style={{ transform: `scaleX(${(((qIndex + 1) / QUESTIONS.length)).toFixed(4)})` }}
          />
        </div>

        {/* ===== BANNER WAKTU HABIS (latihan) ===== */}
        {timeUpLatihan && mode === 'latihan' && (
          <div className="bg-amber-300 border-b-2 border-[#111] px-3.5 py-2 text-xs font-extrabold flex items-center justify-between gap-2 shrink-0">
            <span>⏰ Waktu acuan habis! Di Mode Latihan kamu bebas lanjut sampai paham.</span>
            <button onClick={() => setTimeUpLatihan(false)} className="underline text-[11px] shrink-0">
              Tutup
            </button>
          </div>
        )}

        {/* ===== AREA SOAL ===== */}
        <div
          ref={scrollBodyRef}
          className="flex-1 overflow-y-auto p-4 pb-28"
          style={{ fontSize: `${fontScale}%` }}
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="bg-[#E0E7FF] border border-[#111] px-2.5 py-0.5 rounded-full text-[11px] font-extrabold">
                  {q.tipe}
                </span>
                <span className="bg-white border border-[#111] px-2 py-0.5 rounded-full text-[10px] font-bold text-neutral-600">
                  {q.topik}
                </span>
              </div>
              <button
                onClick={() => {
                  logEvent('bug_report_click', { soal_no: q.nomor });
                  showToastMsg(`Laporan kendala Soal #${q.nomor} terkirim!`);
                }}
                className="text-[11px] font-bold text-neutral-500"
              >
                ⚑ Lapor Soal
              </button>
            </div>

            {/* Kartu soal */}
            <div className="bg-white border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-4 space-y-3">
              {q.stimulus && (
                <div className="bg-[#FAFAF7] border-2 border-dashed border-neutral-300 rounded-xl p-3 text-xs leading-relaxed">
                  {q.stimulus}
                </div>
              )}
              <div className="font-semibold leading-relaxed text-[0.95em]">{q.prompt}</div>

              {q.tipe === 'Pilihan Ganda Kompleks' && (
                <div className="bg-[#E0E7FF] border-2 border-[#111] rounded-xl px-3 py-2 text-xs font-extrabold">
                  ☑️ Pilihan Ganda Kompleks · Pilih lebih dari satu jawaban yang benar!
                </div>
              )}

              {/* Opsi PG / PG Kompleks */}
              {q.options && (
                <div className="space-y-2 pt-1">
                  {q.options.map((opt) => {
                    const ans = answers[qIndex];
                    const selected =
                      q.tipe === 'Pilihan Ganda Kompleks'
                        ? Array.isArray(ans) && ans.includes(opt.key)
                        : ans === opt.key;
                    const isComplex = q.tipe === 'Pilihan Ganda Kompleks';
                    return (
                      <button
                        key={opt.key}
                        onClick={() => pickOption(opt.key)}
                        className={`w-full p-3 rounded-xl text-left flex items-center gap-3 text-xs font-bold border-2 border-[#111] shadow-[0_3px_0_#111] active:translate-y-[2px] active:shadow-[0_1px_0_#111] transition-all ${
                          selected ? 'bg-[#B6FF00]' : 'bg-white'
                        }`}
                      >
                        <span
                          className={`w-6 h-6 ${isComplex ? 'rounded-md' : 'rounded-full'} border-2 border-[#111] bg-white flex items-center justify-center font-extrabold text-[11px] shrink-0`}
                        >
                          {isComplex && selected ? '✓' : opt.key}
                        </span>
                        <span className="flex-1">{opt.text}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tabel Benar-Salah */}
              {q.statements && (
                <div className="border-2 border-[#111] rounded-xl overflow-hidden text-xs">
                  <div className="bg-[#111] text-white font-extrabold px-3 py-2 flex justify-between">
                    <span>Pernyataan</span>
                    <span className="w-28 text-center">Pilihanmu</span>
                  </div>
                  {q.statements.map((st) => {
                    const cur = (answers[qIndex] as Record<string, string>) || {};
                    return (
                      <div
                        key={st.key}
                        className="p-3 border-t border-neutral-200 flex items-center justify-between gap-2 bg-white"
                      >
                        <div className="flex-1">
                          <b className="mr-1">{st.key}.</b>
                          {st.text}
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <NeoBtn
                            onClick={() => pickBs(st.key, 'Benar')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] ${cur[st.key] === 'Benar' ? 'bg-[#B6FF00]' : 'bg-white'}`}
                          >
                            Benar
                          </NeoBtn>
                          <NeoBtn
                            onClick={() => pickBs(st.key, 'Salah')}
                            className={`px-2.5 py-1 rounded-lg text-[11px] ${cur[st.key] === 'Salah' ? 'bg-red-200' : 'bg-white'}`}
                          >
                            Salah
                          </NeoBtn>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ===== EVALUASI + PEMBAHASAN INLINE (latihan, setelah cek) ===== */}
            {showEval && (
              <div ref={evalRef} className="space-y-3">
                <div
                  className={`border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-3.5 ${
                    status === 'benar' ? 'bg-[#B6FF00]' : 'bg-red-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold">
                      {status === 'benar'
                        ? '✅ Mantap! Jawabanmu Tepat!'
                        : status === 'kosong'
                          ? '⚪ Soal Ini Belum Dijawab'
                          : '❌ Belum Tepat — Yuk Cek Pembahasannya!'}
                    </span>
                    <span className="text-[11px] font-bold">Soal #{q.nomor}</span>
                  </div>
                </div>

                <div className="bg-white border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-4">
                  <div className="flex items-center justify-between border-b-2 border-[#111] pb-2.5">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#B6FF00] border border-[#111] px-2 py-0.5 rounded">
                        Kunci Resmi
                      </span>
                      <h3 className="text-sm font-extrabold mt-1">Kunci Jawaban: {kunciStr}</h3>
                    </div>
                    <NeoBtn
                      onClick={() => {
                        setPilarExpanded((v) => !v);
                        logEvent('pembahasan_5pilar_toggle', { soal_no: q.nomor });
                      }}
                      className="bg-[#E0E7FF] px-3 py-1 rounded-full text-[11px]"
                    >
                      {pilarExpanded ? '🔼 Ciutkan' : '📖 5 Pilar Lengkap'}
                    </NeoBtn>
                  </div>

                  <div className="mt-3 text-xs leading-relaxed text-neutral-800">
                    <b>Inti Logika:</b> {q.ringkas}
                  </div>

                  {pilarExpanded && (
                    <div className="mt-4 space-y-3 border-t-2 border-dashed border-neutral-300 pt-3 text-xs">
                      <div className="bg-[#FAFAF7] border border-[#111] rounded-xl p-3">
                        <div className="font-extrabold text-[#4F46E5] uppercase text-[10px]">
                          Pilar 1 · Diketahui & Konsep Kunci
                        </div>
                        <p className="mt-1 font-medium">{q.pilar1}</p>
                      </div>
                      <div className="bg-[#FAFAF7] border border-[#111] rounded-xl p-3">
                        <div className="font-extrabold text-[#4F46E5] uppercase text-[10px]">
                          Pilar 2 & 3 · Glosarium & Alasan Logis
                        </div>
                        <p className="mt-1 font-medium">{q.pilar3}</p>
                      </div>
                      <div className="bg-[#F0FFB8] border border-[#111] rounded-xl p-3">
                        <div className="font-extrabold uppercase text-[10px]">
                          Pilar 4 · Langkah Penyelesaian Rinci
                        </div>
                        <ol className="mt-1.5 space-y-1.5 list-decimal list-inside font-semibold">
                          {q.pilar4.map((s, i) => (
                            <li key={i}>{s}</li>
                          ))}
                        </ol>
                      </div>
                      <div className="bg-[#FFEDD5] border border-[#111] rounded-xl p-3">
                        <div className="font-extrabold text-amber-900 uppercase text-[10px]">
                          Pilar 5 · Trik Cepat & Jebakan Umum
                        </div>
                        <p className="mt-1 font-medium">{q.pilar5}</p>
                      </div>
                    </div>
                  )}

                  <div className="mt-4 pt-3 border-t border-neutral-200 flex gap-2">
                    <NeoBtn
                      onClick={openTutor}
                      className="flex-1 bg-[#111] text-white py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5"
                    >
                      <span>✨</span>
                      <span>Tanya AI Bagian Bingung</span>
                    </NeoBtn>
                    <NeoBtn
                      onClick={() => {
                        setSimSoalOpen((v) => !v);
                        setSimFeedback(null);
                        logEvent('similar_question_open', { soal_no: q.nomor });
                      }}
                      className="bg-[#B6FF00] text-[#111] py-2 px-3 rounded-xl text-xs"
                    >
                      🔄 Soal Serupa
                    </NeoBtn>
                  </div>
                </div>

                {/* Soal serupa */}
                {simSoalOpen && (
                  <div className="bg-[#E0E7FF] border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white border border-[#111] px-2 py-0.5 rounded">
                        Uji Paham · Soal Serupa
                      </span>
                      <button onClick={() => setSimSoalOpen(false)} className="text-xs font-bold">
                        Tutup ✕
                      </button>
                    </div>
                    <p className="text-xs font-bold mt-2">{q.similar.q}</p>
                    <div className="mt-2.5 space-y-1.5">
                      {q.similar.opts.map((o, i) => (
                        <NeoBtn
                          key={i}
                          onClick={() => checkSimilar(i)}
                          className="w-full bg-white px-3 py-2 rounded-xl text-left text-xs block"
                        >
                          {o}
                        </NeoBtn>
                      ))}
                    </div>
                    {simFeedback && (
                      <div className="mt-2.5 p-2.5 rounded-xl border border-[#111] bg-white text-xs font-bold">
                        {simFeedback}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        {/* ===== BOTTOM BAR ===== */}
        <footer className="absolute bottom-0 left-0 right-0 bg-white border-t-2 border-[#111] px-3 py-2.5 flex items-center gap-2 shrink-0 z-30">
          <NeoBtn
            onClick={() => goSoal(qIndex - 1)}
            disabled={qIndex === 0}
            className="px-3 py-2.5 rounded-xl bg-white text-xs"
          >
            ←
          </NeoBtn>
          <NeoBtn
            onClick={toggleRagu}
            className={`px-3 py-2.5 rounded-xl text-xs flex items-center gap-1 ${ragu[qIndex] ? 'bg-amber-300' : 'bg-white'}`}
          >
            <span>⚑</span>
            <span>Ragu</span>
          </NeoBtn>
          <NeoBtn
            onClick={openTutor}
            className="px-3 py-2.5 rounded-xl bg-[#E0E7FF] text-xs flex items-center gap-1"
          >
            <span>✨</span>
            <span>AI ({tutorQuota})</span>
          </NeoBtn>
          {mode === 'simulasi' && (
            <button
              onClick={() => {
                showToastMsg('🔒 Mode Simulasi: kunci & pembahasan dibuka setelah Selesai!');
                logEvent('simulasi_locked_check_attempt', { soal_no: q.nomor });
              }}
              className="px-2.5 py-2.5 rounded-xl bg-neutral-200 text-neutral-600 text-[11px] font-extrabold border-2 border-[#111] shadow-[0_3px_0_#111] flex items-center gap-1"
              title="Cek Jawaban dikunci selama Mode Simulasi"
            >
              🔒 Cek Dikunci
            </button>
          )}
          <NeoBtn
            onClick={handlePrimary}
            className={`flex-1 py-2.5 px-3 rounded-xl text-xs text-center truncate ${primaryStyle}`}
          >
            {primaryLabel}
          </NeoBtn>
        </footer>

        {/* ===== DRAWER PETA SOAL ===== */}
        {showPeta && (
          <div className="absolute inset-0 z-40 bg-black/50 flex flex-col justify-end" onClick={() => setShowPeta(false)}>
            <div
              className="bg-[#FAFAF7] border-t-2 border-[#111] rounded-t-3xl p-4 space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-extrabold">Peta Nomor Soal</h3>
                <NeoBtn onClick={() => setShowPeta(false)} className="w-7 h-7 rounded-lg bg-white text-xs">
                  ✕
                </NeoBtn>
              </div>
              <div className="flex gap-3 text-[11px] font-bold">
                <span className="flex items-center gap-1">
                  <i className="w-3 h-3 inline-block bg-[#B6FF00] border border-[#111] rounded" /> Dijawab
                </span>
                <span className="flex items-center gap-1">
                  <i className="w-3 h-3 inline-block bg-amber-300 border border-[#111] rounded" /> Ragu-ragu
                </span>
                <span className="flex items-center gap-1">
                  <i className="w-3 h-3 inline-block bg-white border border-[#111] rounded" /> Belum
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {QUESTIONS.map((qq, i) => {
                  const ans = answers[i];
                  const dijawab =
                    ans !== undefined &&
                    !(typeof ans === 'string' && ans === '') &&
                    !(Array.isArray(ans) && ans.length === 0);
                  const bg = ragu[i] ? 'bg-amber-300' : dijawab ? 'bg-[#B6FF00]' : 'bg-white';
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        goSoal(i);
                        setShowPeta(false);
                      }}
                      className={`h-11 rounded-xl font-extrabold text-xs border-2 border-[#111] shadow-[0_3px_0_#111] ${bg} ${
                        i === qIndex ? 'ring-2 ring-[#4F46E5]' : ''
                      }`}
                    >
                      {qq.nomor}
                    </button>
                  );
                })}
              </div>
              <NeoBtn
                onClick={() => finishQuiz('user')}
                className="w-full bg-[#111] text-[#B6FF00] py-3 rounded-xl text-xs"
              >
                🏁 Selesai & Kumpulkan Jawaban
              </NeoBtn>
            </div>
          </div>
        )}

        {/* ===== AI TUTOR SHEET ===== */}
        {showTutor && (
          <div className="absolute inset-0 z-40 bg-black/50 flex flex-col justify-end" onClick={() => setShowTutor(false)}>
            <div
              className="bg-[#FAFAF7] border-t-2 border-[#111] rounded-t-3xl h-[82%] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white border-b-2 border-[#111] px-4 py-3 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-full bg-[#B6FF00] border border-[#111] flex items-center justify-center text-xs font-extrabold">
                    ✨
                  </span>
                  <div>
                    <h3 className="text-xs font-extrabold">AI Tutor {mapelShort}</h3>
                    <p className="text-[10px] text-green-700 font-bold">✓ Paham konteks Soal #{q.nomor}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-[#E0E7FF] border border-[#111] px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                    {tutorQuota}/25 Tanya
                  </span>
                  <NeoBtn onClick={() => setShowTutor(false)} className="w-7 h-7 rounded-lg bg-white text-xs">
                    ✕
                  </NeoBtn>
                </div>
              </div>

              <div className="bg-[#FFFBEB] border-b-2 border-[#111] px-4 py-2 shrink-0">
                <button
                  onClick={() => setPreviewSoalOpen((v) => !v)}
                  className="w-full flex items-center justify-between text-left text-xs font-extrabold"
                >
                  <span>📌 Intip Soal #{q.nomor} (klik buka/tutup)</span>
                  <span>{previewSoalOpen ? '▲' : '▼'}</span>
                </button>
                {previewSoalOpen && (
                  <div className="mt-2 pt-2 border-t border-amber-300 text-xs text-neutral-800">{q.prompt}</div>
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                {chatMsgs.map((m, i) =>
                  m.from === 'user' ? (
                    <div key={i} className="flex justify-end">
                      <div className="bg-[#111] text-white rounded-2xl rounded-br-sm px-3 py-2 max-w-[85%] font-semibold">
                        {m.html}
                      </div>
                    </div>
                  ) : (
                    <div
                      key={i}
                      className="bg-[#F0FFB8] border-2 border-[#111] shadow-[0_3px_0_#111] rounded-2xl rounded-bl-sm p-3 max-w-[92%]"
                    >
                      <p className="font-medium" dangerouslySetInnerHTML={{ __html: m.html }} />
                    </div>
                  )
                )}
              </div>

              <div className="px-3 py-2 bg-white border-t border-neutral-200 flex gap-1.5 overflow-x-auto shrink-0">
                {['Petunjuk konsep', 'Ada cara cepatnya?', 'Analogi gampang'].map((qp) => (
                  <button
                    key={qp}
                    onClick={() => sendChat(qp === 'Petunjuk konsep' ? 'Beri petunjuk konsep tanpa bocorin kunci' : qp)}
                    className="shrink-0 bg-[#FAFAF7] border-2 border-[#111] shadow-[0_3px_0_#111] px-2.5 py-1 rounded-full text-[11px] font-bold"
                  >
                    {qp}
                  </button>
                ))}
              </div>

              <ChatInput
                placeholder="Tanya langkah atau konsep soal ini..."
                onSend={sendChat}
              />
            </div>
          </div>
        )}

        {/* ===== MODAL KONFIRMASI KELUAR ===== */}
        {showExitConfirm && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
            <div className="bg-white border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-5 w-full max-w-[300px] text-center">
              <div className="text-3xl mb-2">🚪</div>
              <p className="text-sm font-bold mb-4">Keluar ke Beranda? Progres latihanmu tetap aman.</p>
              <div className="flex gap-2">
                <NeoBtn
                  onClick={() => {
                    setShowExitConfirm(false);
                    logEvent('exit_arena', {});
                    router.push('/');
                  }}
                  className="flex-1 bg-[#B6FF00] py-2.5 rounded-xl text-xs"
                >
                  Ya, Keluar
                </NeoBtn>
                <NeoBtn onClick={() => setShowExitConfirm(false)} className="flex-1 bg-white py-2.5 rounded-xl text-xs">
                  Batal
                </NeoBtn>
              </div>
            </div>
          </div>
        )}

        {/* ===== TOAST ===== */}
        <Toast message={toast} className="bottom-24 shadow-lg pointer-events-none" />

        {/* ===== PANEL BEHAVIOR LOG ===== */}
        {showLogPanel && (
          <LogPanel
            logs={logs}
            onClose={() => setShowLogPanel(false)}
            badge="Dummy Telemetry"
            title={`Behavior Log (${logs.length})`}
            description="Versi dummy: event dicatat via console.log + counter. Belum dikirim ke Supabase."
          />
        )}
      </div>
    </div>
  );
}

/* ================= Page (Suspense boundary untuk useSearchParams) ================= */

export default function ArenaPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[#18181B] flex items-center justify-center">
          <div className="bg-white border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl px-6 py-4 text-sm font-extrabold">
            Memuat arena…
          </div>
        </div>
      }
    >
      <ArenaClient />
    </Suspense>
  );
}
