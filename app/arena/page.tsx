'use client';

import { Suspense, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  QUESTIONS,
  QuizMode,
  STMT_IMG_FIRST_RE,
  evaluateQuestion,
  formatKunci,
  getDurasiDetik,
  getMapel,
  isAnswerFilled,
  type Answer,
  type Question,
  type Statement,
} from './data';
import {
  ChatInput,
  Latex,
  LogPanelLive,
  NeoBtn,
  PilarText,
  Toast,
  createLogStore,
  renderLatexToHtml,
  type LogStore,
} from '../components/ui';
import { dbRowToQuestion, getSoal } from '../../lib/soal';
import { saveAttempt } from '../../lib/analisis';

/* ================= Konstanta & Helper Kecil ================= */

function formatHMS(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const hh = String(Math.floor(s / 3600)).padStart(2, '0');
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

const FONT_SCALES = [90, 100, 115, 130];
const TUTOR_QUICK_PROMPTS = ['Petunjuk konsep', 'Ada cara cepatnya?', 'Analogi gampang'] as const;

function buildTutorGreeting(mode: QuizMode, q: Question): string {
  const note =
    mode === 'simulasi'
      ? 'Mode Simulasi: aku kasih petunjuk konsep tanpa bocorin kunci ya!'
      : `Aku udah baca <b>Soal #${q.nomor} (${q.topik})</b>. Bagian mana yang bikin bingung?`;
  return `<b>AI Tutor</b><br/>Halo! ${note}`;
}

const KEY_ARENA_PROGRESS = 'musse_arena_progress';
const ARENA_PROGRESS_TTL_MS = 24 * 60 * 60 * 1000; // 24 jam

interface ArenaProgressData {
  mapel: string;
  paket: 1 | 2;
  mode: QuizMode;
  qIndex: number;
  answers: Record<number, Answer>;
  timestamp: number;
}

function readArenaProgress(mapel: string, paket: 1 | 2, mode: QuizMode): ArenaProgressData | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(KEY_ARENA_PROGRESS);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ArenaProgressData>;
    if (!parsed || typeof parsed !== 'object') {
      window.localStorage.removeItem(KEY_ARENA_PROGRESS);
      return null;
    }
    const ts = typeof parsed.timestamp === 'number' ? parsed.timestamp : 0;
    if (!ts || Date.now() - ts > ARENA_PROGRESS_TTL_MS) {
      // Kedaluwarsa setelah 24 jam → hapus otomatis
      window.localStorage.removeItem(KEY_ARENA_PROGRESS);
      return null;
    }
    if (
      parsed.mapel !== mapel ||
      Number(parsed.paket) !== paket ||
      parsed.mode !== mode
    ) {
      return null;
    }
    const rawAnswers = parsed.answers && typeof parsed.answers === 'object' ? parsed.answers : {};
    const normalizedAnswers: Record<number, Answer> = {};
    for (const [k, v] of Object.entries(rawAnswers)) {
      const idx = Number(k);
      if (Number.isFinite(idx) && isAnswerFilled(v as Answer)) {
        normalizedAnswers[idx] = v as Answer;
      }
    }
    const qIdx = typeof parsed.qIndex === 'number' && Number.isFinite(parsed.qIndex) ? parsed.qIndex : 0;
    return {
      mapel,
      paket,
      mode,
      qIndex: Math.max(0, qIdx),
      answers: normalizedAnswers,
      timestamp: ts,
    };
  } catch {
    return null;
  }
}

function writeArenaProgress(data: ArenaProgressData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY_ARENA_PROGRESS, JSON.stringify(data));
  } catch {
    // Abaikan jika storage penuh / private mode
  }
}

function clearArenaProgress(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(KEY_ARENA_PROGRESS);
  } catch {
    // Abaikan
  }
}

/* ================= Sub-Komponen Terisolasi ================= */

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

/** Badge count terisolasi untuk arena: hanya komponen kecil ini re-render saat log bertambah. */
const ArenaLogCount = memo(function ArenaLogCount({ useLogCount }: { useLogCount: () => number }) {
  const count = useLogCount();
  return <>{count}</>;
});

/**
 * Render isi pernyataan (Benar-Salah / Matriks / Pernyataan-Label) ter-memo di level modul
 * agar klik opsi/timer/modal tidak meng-unmount & me-mount ulang DOM gambar pernyataan.
 */
const ArenaStatementBody = memo(function ArenaStatementBody({
  st,
  onZoom,
}: {
  st: Statement;
  onZoom: (url: string) => void;
}) {
  if (st.html) {
    return <span className="opsi-html" dangerouslySetInnerHTML={{ __html: st.html }} />;
  }
  const txt = (st.text || '').trim();
  const imgEl = st.image_url ? (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={st.image_url}
      alt={`Pernyataan ${st.key}`}
      title="Klik untuk memperbesar gambar"
      onClick={(e) => {
        e.stopPropagation();
        onZoom(st.image_url!);
      }}
      className="bs-stmt-img"
      loading="lazy"
    />
  ) : null;
  if (!txt) return <>{imgEl}</>;
  const imgFirst = STMT_IMG_FIRST_RE.test(txt);
  if (!imgEl) return <span>{txt}</span>;
  return imgFirst ? (
    <>
      {imgEl}
      <span> {txt}</span>
    </>
  ) : (
    <>
      <span>{txt} </span>
      {imgEl}
    </>
  );
});

/** Kartu Pembahasan 5 Pilar yang dipakai bersama di Mobile (inline) dan Desktop (modal lebar). */
const ArenaPilarCards = memo(function ArenaPilarCards({ q }: { q: Question }) {
  return (
    <>
      {/* ===== PILAR 1: Identifikasi Masalah (kartu mandiri) ===== */}
      <article className="pilar-cv bg-white border-2 border-[#111] shadow-[0_3px_0_#111] rounded-[18px] overflow-hidden w-full">
        <header className="flex items-center justify-between px-3.5 py-2.5 border-b-2 border-[#111] bg-[#FAFAF7]">
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg border-[1.5px] border-[#111] text-[11px] font-extrabold uppercase tracking-[0.06em] bg-[#B6FF00]">Pilar 1</span>
          <h2 className="text-[12px] font-extrabold uppercase tracking-[0.05em]">Identifikasi Masalah</h2>
        </header>
        <div className="p-3.5 flex flex-col gap-3">
          {q.diketahui ? (
            <div className="bg-[#FAFAF7] border-[1.5px] border-[#111] rounded-[14px] p-3">
              <span className="inline-block text-[10.5px] font-extrabold uppercase tracking-[0.07em] px-2 py-0.5 rounded-md border-[1.5px] border-[#111] mb-2 bg-[#E0E7FF]">📋 Diketahui</span>
              <PilarText text={q.diketahui} />
            </div>
          ) : null}
          {q.ditanyakan ? (
            <div className="bg-[#FAFAF7] border-[1.5px] border-[#111] rounded-[14px] p-3">
              <span className="inline-block text-[10.5px] font-extrabold uppercase tracking-[0.07em] px-2 py-0.5 rounded-md border-[1.5px] border-[#111] mb-2 bg-[#FDE68A]">🎯 Ditanyakan</span>
              <PilarText text={q.ditanyakan} />
            </div>
          ) : null}
          {!(q.diketahui || q.ditanyakan) ? (
            <PilarText text={q.pilar1} />
          ) : null}
          {(q.conceptKunci?.length ?? 0) > 0 && (
            <div>
              <span className="inline-block text-[10.5px] font-extrabold uppercase tracking-[0.07em] px-2 py-0.5 rounded-md border-[1.5px] border-[#111] mb-2 bg-[#B6FF00]">🔑 Konsep & Rumus Utama</span>
              <div className="flex flex-wrap gap-1.5">
                {q.conceptKunci!.map((c, i) => (
                  <span key={i} className="bg-[#B6FF00] border-[1.5px] border-[#111] shadow-[0_2px_0_#111] rounded-full px-2.5 py-1 text-xs font-extrabold"><Latex text={c} /></span>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
      {/* ===== PILAR 2: Glosarium (kartu mandiri, tidak digabung dengan Pilar 3) ===== */}
      {(q.glossary?.length ?? 0) > 0 && (
        <article className="pilar-cv bg-white border-2 border-[#111] shadow-[0_3px_0_#111] rounded-[18px] overflow-hidden w-full">
          <header className="flex items-center justify-between px-3.5 py-2.5 border-b-2 border-[#111] bg-[#FAFAF7]">
            <span className="inline-flex items-center px-2 py-0.5 rounded-lg border-[1.5px] border-[#111] text-[11px] font-extrabold uppercase tracking-[0.06em] bg-[#E0E7FF]">Pilar 2</span>
            <h2 className="text-[12px] font-extrabold uppercase tracking-[0.05em]">Glosarium</h2>
          </header>
          <div className="p-3.5 flex flex-col gap-3">
            {q.glossary!.map((g, i) => (
              <div key={i} className="border-[1.5px] border-[#111] rounded-[14px] p-3 bg-[#FAFAF7]">
                <div className="inline-block bg-[#E0E7FF] border-[1.5px] border-[#111] rounded-[7px] px-2 py-0.5 text-[12px] font-extrabold mb-1.5"><Latex text={g.term} /></div>
                <p className="text-sm font-medium leading-relaxed"><Latex text={g.meaning} /></p>
              </div>
            ))}
          </div>
        </article>
      )}
      {/* ===== PILAR 3: Mengapa Rumus Ini Dipakai? (kartu mandiri) ===== */}
      <article className="pilar-cv bg-white border-2 border-[#111] shadow-[0_3px_0_#111] rounded-[18px] overflow-hidden w-full">
        <header className="flex items-center justify-between px-3.5 py-2.5 border-b-2 border-[#111] bg-[#FAFAF7]">
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg border-[1.5px] border-[#111] text-[11px] font-extrabold uppercase tracking-[0.06em] bg-[#FDE68A]">Pilar 3</span>
          <h2 className="text-[12px] font-extrabold uppercase tracking-[0.05em]">Mengapa Rumus Ini Dipakai?</h2>
        </header>
        <div className="p-3.5">
          <div className="border-[1.5px] border-[#111] border-l-[5px] border-l-[#4F46E5] rounded-[14px] p-3 bg-[#F5F7FF]">
            <PilarText text={q.pilar3} />
          </div>
        </div>
      </article>
      {/* ===== PILAR 4: Langkah-Langkah Pengerjaan (kartu mandiri) ===== */}
      <article className="pilar-cv bg-white border-2 border-[#111] shadow-[0_3px_0_#111] rounded-[18px] overflow-hidden w-full">
        <header className="flex items-center justify-between px-3.5 py-2.5 border-b-2 border-[#111] bg-[#FAFAF7]">
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg border-[1.5px] border-[#111] text-[11px] font-extrabold uppercase tracking-[0.06em] bg-[#B6FF00]">Pilar 4</span>
          <h2 className="text-[12px] font-extrabold uppercase tracking-[0.05em]">Langkah-Langkah Pengerjaan</h2>
        </header>
        <div className="p-3.5 flex flex-col gap-3">
          {q.stepsDetailed?.length ? (
            q.stepsDetailed.map((s, i, arr) => (
              <div key={i} className={`border-[1.5px] border-[#111] rounded-[14px] p-3 flex flex-col gap-1.5 ${i === arr.length - 1 && arr.length > 1 ? 'bg-[#F4FFD6]' : 'bg-[#FAFAF7]'}`}>
                <div className="flex items-start gap-2">
                  <span className="bg-[#111] text-[#B6FF00] text-[10px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-[0.05em] shrink-0 mt-0.5">Langkah {String(i + 1).padStart(2, '0')}</span>
                  {s.title ? <h3 className="text-[13.5px] font-extrabold leading-snug"><Latex text={s.title} /></h3> : null}
                </div>
                <PilarText text={s.explanation} />
              </div>
            ))
          ) : (
            (q.pilar4 ?? []).map((s, i, arr) => (
              <div key={i} className={`border-[1.5px] border-[#111] rounded-[14px] p-3 ${i === arr.length - 1 && arr.length > 1 ? 'bg-[#F4FFD6]' : 'bg-[#FAFAF7]'}`}>
                <div className="flex items-start gap-2">
                  <span className="bg-[#111] text-[#B6FF00] text-[10px] font-extrabold px-1.5 py-0.5 rounded-md uppercase tracking-[0.05em] shrink-0 mt-0.5">Langkah {String(i + 1).padStart(2, '0')}</span>
                  <PilarText text={s} />
                </div>
              </div>
            ))
          )}
        </div>
      </article>
      {/* ===== PILAR 5: Trik Cepat & Jebakan Umum (kartu mandiri) ===== */}
      <article className="pilar-cv bg-white border-2 border-[#111] shadow-[0_3px_0_#111] rounded-[18px] overflow-hidden w-full">
        <header className="flex items-center justify-between px-3.5 py-2.5 border-b-2 border-[#111] bg-[#FAFAF7]">
          <span className="inline-flex items-center px-2 py-0.5 rounded-lg border-[1.5px] border-[#111] text-[11px] font-extrabold uppercase tracking-[0.06em] bg-[#FDE68A]">Pilar 5</span>
          <h2 className="text-[12px] font-extrabold uppercase tracking-[0.05em]">Trik Cepat & Jebakan Umum</h2>
        </header>
        <div className="p-3.5 flex flex-col gap-3">
          {q.pilar5 ? (
            <div className="bg-[#DCFCE7] border-[1.5px] border-[#111] rounded-[14px] p-3">
              <span className="inline-block text-[10.5px] font-extrabold uppercase tracking-[0.07em] px-2 py-0.5 rounded-md border-[1.5px] border-[#111] mb-2 bg-[#B6FF00]">⚡ Trik Cepat</span>
              <PilarText text={q.pilar5} />
            </div>
          ) : null}
          {(q.commonMistakes?.length ?? 0) > 0 && (
            <div className="bg-[#FEE2E2] border-[1.5px] border-[#111] rounded-[14px] p-3">
              <span className="inline-block text-[10.5px] font-extrabold uppercase tracking-[0.07em] px-2 py-0.5 rounded-md border-[1.5px] border-[#111] mb-2 bg-[#FCA5A5]">⚠️ Jebakan Umum</span>
              <div className="text-sm font-medium leading-relaxed space-y-1.5">
                {q.commonMistakes!.map((m, i) => (
                  <PilarText key={i} text={m} />
                ))}
              </div>
            </div>
          )}
        </div>
      </article>
    </>
  );
});

/** Isi Peta Nomor Soal (legenda + grid tombol nomor + tombol selesai) untuk Desktop & Mobile. */
function ArenaPetaBody({
  variant,
  questions,
  answers,
  answersRef,
  ragu,
  qIndex,
  petaDijawabCount,
  petaRaguCount,
  petaBelumCount,
  onSelectSoal,
  onFinish,
}: {
  variant: 'desktop' | 'mobile';
  questions: Question[];
  answers: Record<number, Answer>;
  answersRef: React.MutableRefObject<Record<number, Answer>>;
  ragu: Record<number, boolean>;
  qIndex: number;
  petaDijawabCount: number;
  petaRaguCount: number;
  petaBelumCount: number;
  onSelectSoal: (index: number) => void;
  onFinish: () => void;
}) {
  const isDesktop = variant === 'desktop';
  return (
    <>
      <div className={isDesktop ? 'flex flex-wrap gap-3 text-[11px] font-bold' : 'flex gap-3 text-[11px] font-bold shrink-0'}>
        <span className="flex items-center gap-1">
          <i className="w-3 h-3 inline-block bg-[#B6FF00] border border-[#111] rounded" /> Dijawab ({petaDijawabCount})
        </span>
        <span className="flex items-center gap-1">
          <i className="w-3 h-3 inline-block bg-amber-300 border border-[#111] rounded" /> Ragu-ragu ({petaRaguCount})
        </span>
        <span className="flex items-center gap-1">
          <i className="w-3 h-3 inline-block bg-white border border-[#111] rounded" /> Belum ({petaBelumCount})
        </span>
      </div>
      <div
        className={
          isDesktop
            ? 'grid grid-cols-5 lg:grid-cols-6 gap-2 p-1.5'
            : 'grid grid-cols-5 gap-2 max-h-[52dvh] overflow-y-auto p-0.5'
        }
      >
        {questions.map((qq, i) => {
          const ans = answers[i] ?? answersRef.current[i];
          const dijawab = isAnswerFilled(ans) && evaluateQuestion(qq, ans) !== 'kosong';
          const bg = ragu[i] ? 'bg-amber-300' : dijawab ? 'bg-[#B6FF00]' : 'bg-white';
          return (
            <button
              key={qq.nomor ?? i}
              type="button"
              onClick={() => onSelectSoal(i)}
              className={`${isDesktop ? 'h-10' : 'h-11'} rounded-xl font-extrabold text-xs border-2 border-[#111] shadow-[0_3px_0_#111] ${bg} ${
                i === qIndex ? 'ring-2 ring-[#4F46E5]' : ''
              }`}
            >
              {qq.nomor}
            </button>
          );
        })}
      </div>
      <NeoBtn
        onClick={onFinish}
        className={
          isDesktop
            ? 'w-full bg-[#111] text-[#B6FF00] py-2.5 rounded-xl text-xs'
            : 'w-full bg-[#111] text-[#B6FF00] py-3 rounded-xl text-xs shrink-0'
        }
      >
        🏁 Selesai & Kumpulkan Jawaban
      </NeoBtn>
    </>
  );
}

/** Isi ruang percakapan AI Tutor (intip soal + daftar chat + quick prompts + input) untuk Desktop & Mobile. */
function ArenaTutorChatBody({
  variant,
  q,
  previewSoalOpen,
  onTogglePreviewSoal,
  messages,
  onSendChat,
  tutorError,
  onRetryTutor,
}: {
  variant: 'desktop' | 'mobile';
  q: Question;
  previewSoalOpen: boolean;
  onTogglePreviewSoal: () => void;
  messages: { from: 'user' | 'ai'; html: string }[];
  onSendChat: (text: string) => void;
  tutorError: string | null;
  onRetryTutor: () => void;
}) {
  const isDesktop = variant === 'desktop';
  return (
    <>
      <div className="bg-[#FFFBEB] border-b-2 border-[#111] px-4 py-2 shrink-0">
        <button
          onClick={onTogglePreviewSoal}
          className="w-full flex items-center justify-between text-left text-xs font-extrabold"
        >
          <span>📌 Intip Soal #{q.nomor} (klik buka/tutup)</span>
          <span>{previewSoalOpen ? '▲' : '▼'}</span>
        </button>
        {previewSoalOpen && (
          <div className="mt-2 pt-2 border-t border-amber-300 text-xs text-neutral-800">{q.prompt}</div>
        )}
      </div>

      <div className={`${isDesktop ? 'max-h-[260px]' : 'flex-1'} overflow-y-auto p-4 space-y-3 text-xs`}>
        {messages.map((m, i) =>
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
              <p className="font-medium" dangerouslySetInnerHTML={{ __html: renderLatexToHtml(m.html) }} />
            </div>
          )
        )}
      </div>

      {tutorError && (
        <div className="px-3 py-2 bg-white border-t border-neutral-200 flex items-center gap-2 shrink-0">
          <span className="text-[11px] font-bold text-red-600">⚠️ AI gagal terhubung</span>
          <button
            type="button"
            onClick={onRetryTutor}
            className="shrink-0 bg-[#FAFAF7] border-2 border-[#111] shadow-[0_3px_0_#111] px-2.5 py-1 rounded-full text-[11px] font-bold"
          >
            🔄 Coba lagi
          </button>
        </div>
      )}

      <div className="px-3 py-2 bg-white border-t border-neutral-200 flex gap-1.5 overflow-x-auto shrink-0">
        {TUTOR_QUICK_PROMPTS.map((qp) => (
          <button
            key={qp}
            onClick={() => onSendChat(qp === 'Petunjuk konsep' ? 'Beri petunjuk konsep tanpa bocorin kunci' : qp)}
            className="shrink-0 bg-[#FAFAF7] border-2 border-[#111] shadow-[0_3px_0_#111] px-2.5 py-1 rounded-full text-[11px] font-bold"
          >
            {qp}
          </button>
        ))}
      </div>

      <ChatInput
        placeholder="Tanya langkah atau konsep soal ini..."
        onSend={onSendChat}
      />
    </>
  );
}

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
  const answersRef = useRef<Record<number, Answer>>({});
  const [ragu, setRagu] = useState<Record<number, boolean>>({});
  const [checked, setChecked] = useState<Record<number, boolean>>({});
  const [pilarExpanded, setPilarExpanded] = useState(false);
  const [fontScaleIdx, setFontScaleIdx] = useState(1);
  const [tutorQuota, setTutorQuota] = useState(24);
  const [tutorError, setTutorError] = useState<string | null>(null);
  const [showPeta, setShowPeta] = useState(false);
  const [showTutor, setShowTutor] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [resumeDialog, setResumeDialog] = useState<{
    resumeIdx: number;
    resumeNomor: number;
    answers: Record<number, Answer>;
  } | null>(null);
  const [zoomImg, setZoomImg] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1); // 1 = 100%, bisa zoom in/out
  // Ref untuk kontainer HTML soal (stimulus + pertanyaan) — dipakai untuk klasifikasi
  // ukuran gambar otomatis (inline vs diagram) seperti app lama
  const soalHtmlRef = useRef<HTMLDivElement>(null);
  // Ref untuk kontainer opsi PG — dipakai untuk klasifikasi gambar opsi
  // (rumus kecil → inline, diagram besar → blok) seperti app lama
  const opsiHtmlRef = useRef<HTMLDivElement>(null);
  // Ref untuk kontainer tabel pernyataan (Benar-Salah / Matriks / Pernyataan-Label)
  // — dipakai untuk klasifikasi gambar dalam HTML pernyataan seperti app lama
  const stmtRef = useRef<HTMLDivElement>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [timeUpLatihan, setTimeUpLatihan] = useState(false);
  const logStoreRef = useRef<LogStore | null>(null);
  if (!logStoreRef.current) {
    logStoreRef.current = createLogStore('arena');
    logStoreRef.current.logEvent('quiz_start', { mapel: mapelKey, paket, mode });
  }
  const { useLogCount, useLogs } = logStoreRef.current;
  const [showLogPanel, setShowLogPanel] = useState(false);
  const [simSoalOpen, setSimSoalOpen] = useState(false);
  const [simFeedback, setSimFeedback] = useState<string | null>(null);
  const [previewSoalOpen, setPreviewSoalOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'peta' | 'ai' | 'pilar'>('peta');
  const [sidebarHidden, setSidebarHidden] = useState(false);
  const [chatMsgs, setChatMsgs] = useState<{ from: 'ai' | 'user'; html: string }[]>([]);

  // --- soal dari Supabase (fallback ke dummy jika gagal) ---
  const [questions, setQuestions] = useState<Question[]>(QUESTIONS);
  const [soalLoading, setSoalLoading] = useState(true);
  const [soalError, setSoalError] = useState<string | null>(null);
  const [soalSource, setSoalSource] = useState<'supabase' | 'dummy'>('dummy');

  useEffect(() => {
    let cancelled = false;
    sessionTanggalRef.current = new Date().toISOString();
    answersRef.current = {};
    durasiPerSoalRef.current = {};
    gantiJawabanRef.current = {};
    pindahTanpaJawabRef.current = {};
    pilarStartTimeRef.current = {};
    durasiPilarRef.current = {};
    pembahasanScrolledRef.current = {};
    setAnswers({});
    setRagu({});
    setChecked({});
    setQIndex(0);
    setResumeDialog(null);
    (async () => {
      let loadedQuestions: Question[] = QUESTIONS;
      try {
        const rows = await getSoal(mapelKey, paket);
        if (cancelled) return;
        if (rows.length > 0) {
          // Parse per-soal: 1 soal rusak tidak menggagalkan semua
          const parsed: Question[] = [];
          const failed: number[] = [];
          for (const row of rows) {
            try {
              parsed.push(dbRowToQuestion(row));
            } catch (err) {
              failed.push(row.nomor ?? -1);
              console.error(`[soal] Gagal parse soal nomor ${row.nomor}:`, err);
            }
          }
          if (parsed.length > 0) {
            loadedQuestions = parsed;
            setQuestions(parsed);
            setSoalSource('supabase');
            setSoalError(
              failed.length > 0
                ? `\u26a0\ufe0f ${failed.length} soal gagal dimuat (nomor: ${failed.join(', ')})`
                : null
            );
            if (failed.length > 0) {
              logEvent('soal_parse_failed', { failed_nomor: failed, mapel: mapelKey, paket });
            }
          } else {
            // Semua soal gagal di-parse → pakai dummy
            loadedQuestions = QUESTIONS;
            setQuestions(QUESTIONS);
            setSoalSource('dummy');
            setSoalError('\u26a0\ufe0f Semua soal gagal di-parse, pakai soal contoh');
          }
        } else {
          // Supabase kosong untuk mapel+paket ini → pakai dummy
          loadedQuestions = QUESTIONS;
          setQuestions(QUESTIONS);
          setSoalSource('dummy');
        }
        // Mulai timer durasi untuk soal pertama
        soalStartTimeRef.current = Date.now();
      } catch (e) {
        if (cancelled) return;
        // Gagal fetch → fallback dummy agar tidak blank
        loadedQuestions = QUESTIONS;
        setQuestions(QUESTIONS);
        setSoalSource('dummy');
        setSoalError(e instanceof Error ? e.message : 'Gagal memuat soal');
      } finally {
        if (!cancelled) {
          const saved = readArenaProgress(mapelKey, paket, mode);
          if (saved && loadedQuestions.length > 0) {
            const totalQ = loadedQuestions.length;
            const validAnswers: Record<number, Answer> = {};
            for (const [k, v] of Object.entries(saved.answers)) {
              const idx = Number(k);
              if (Number.isFinite(idx) && idx >= 0 && idx < totalQ && isAnswerFilled(v)) {
                validAnswers[idx] = v;
              }
            }
            const answeredCount = Object.keys(validAnswers).length;
            const clampedSavedIdx = Math.min(Math.max(0, saved.qIndex), totalQ - 1);
            const hasProgress = answeredCount > 0 || clampedSavedIdx > 0;
            if (hasProgress) {
              // Jika soal pada saved.qIndex sudah dijawab dan soal berikutnya masih kosong,
              // arahkan ke soal berikutnya (contoh: jawab 3 soal #1-#3 → "Lanjutkan dari soal #4?")
              const nextIdx =
                isAnswerFilled(validAnswers[clampedSavedIdx]) &&
                clampedSavedIdx + 1 < totalQ &&
                !isAnswerFilled(validAnswers[clampedSavedIdx + 1])
                  ? clampedSavedIdx + 1
                  : clampedSavedIdx;
              const resumeNomor = loadedQuestions[nextIdx]?.nomor ?? nextIdx + 1;
              answersRef.current = validAnswers;
              setAnswers(validAnswers);
              setQIndex(nextIdx);
              setResumeDialog({
                resumeIdx: nextIdx,
                resumeNomor,
                answers: validAnswers,
              });
            }
          }
          setSoalLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mapelKey, paket, mode]);

  // Page view logging
  useEffect(() => {
    logEvent('page_view', { page: 'arena' });
  }, []);

  // Scroll depth tracking untuk pembahasan (80% dari area scroll utama).
  // scrollTrackRef disinkron tiap render (lihat di bawah, setelah `q` terdefinisi).
  const scrollTrackRef = useRef<{ checked: Record<number, boolean>; qIndex: number; q: Question | undefined; mode: QuizMode } | null>(null);
  useEffect(() => {
    const scrollEl = scrollBodyRef.current;
    if (!scrollEl) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        ticking = false;
        const snap = scrollTrackRef.current;
        if (!snap) return;
        const { checked: ck, qIndex: qi, q: qq, mode: md } = snap;
        // Hanya track jika pembahasan sedang tampil (sudah cek jawaban)
        const isChecked = !!ck[qi];
        if (!isChecked || !qq) return;
        const soalNo = qq.nomor;
        if (pembahasanScrolledRef.current[soalNo]) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollEl;
        if (scrollHeight <= clientHeight) return;
        const scrolledRatio = (scrollTop + clientHeight) / scrollHeight;
        if (scrolledRatio >= 0.8) {
          pembahasanScrolledRef.current[soalNo] = true;
          logEvent('pembahasan_scroll_full', { soal_no: soalNo, mode: md });
        }
      });
    };
    scrollEl.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollEl.removeEventListener('scroll', onScroll);
  }, []);

  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const evalScrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionTanggalRef = useRef<string>(new Date().toISOString());
  // Timer untuk durasi per soal (behavior logging) - harus di atas fetch effect
  const soalStartTimeRef = useRef<number>(Date.now());
  // Tracking untuk analisis AI: durasi per soal, ganti jawaban, pindah tanpa jawab, & durasi baca pilar
  const durasiPerSoalRef = useRef<Record<number, number>>({});
  const gantiJawabanRef = useRef<Record<number, number>>({});
  const pindahTanpaJawabRef = useRef<Record<number, number>>({});
  const pilarStartTimeRef = useRef<Record<number, number>>({});
  const durasiPilarRef = useRef<Record<number, number>>({});
  const scrollBodyRef = useRef<HTMLDivElement>(null);
  const evalRef = useRef<HTMLDivElement>(null);
  // Flag untuk tracking scroll depth pembahasan (sekali per soal)
  const pembahasanScrolledRef = useRef<Record<number, boolean>>({});
  // Guard anti double-submit / double-finish (race condition)
  const finishingRef = useRef(false);
  const lastChatRef = useRef<{ msg: string; ts: number }>({ msg: '', ts: 0 });
  const chatAbortRef = useRef<AbortController | null>(null);

  // Cleanup: cegah setState / timer / fetch menggantung setelah unmount
  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
      if (evalScrollTimerRef.current) clearTimeout(evalScrollTimerRef.current);
      if (chatAbortRef.current) chatAbortRef.current.abort();
    };
  }, []);

  const q = questions[qIndex];

  // Sinkron ref untuk scroll listener (agar tidak re-subscribe tiap render)
  scrollTrackRef.current = { checked, qIndex, q, mode };

  // Klasifikasi gambar inline di HTML soal & opsi seperti app lama.
  // Soal: kecil (height <=55px atau width <=95px) -> inline-symbol-img (sebaris teks,
  //   tanpa border); besar -> diagram-img (blok tengah, max-height 320px di mobile).
  // Opsi: rumus (atribut data-latex) atau kecil (height <=65px) -> opt-math-img
  //   (sebaris teks); besar -> opt-diagram-img (blok, max-height 280px).
  // PENTING: Gambar di dalam tombol opsi PG (opsiHtmlRef) TIDAK boleh memanggil
  // stopPropagation agar tap pada rumus/gambar di HP tetap memilih opsi jawaban!
  useEffect(() => {
    const cleanups: Array<() => void> = [];
    const wireContainer = (
      container: HTMLElement | null,
      selector: string,
      classify: (el: HTMLImageElement) => void,
      allowZoom = true,
    ) => {
      if (!container) return;
      const imgs = Array.from(container.querySelectorAll(selector));
      imgs.forEach((img) => {
        const el = img as HTMLImageElement;
        if (allowZoom) {
          const openZoom = (e: Event) => {
            e.stopPropagation();
            e.preventDefault();
            setZoomImg(el.currentSrc || el.src);
            setZoomLevel(1);
          };
          el.style.cursor = 'zoom-in';
          el.addEventListener('click', openZoom);
          cleanups.push(() => el.removeEventListener('click', openZoom));
        } else {
          el.style.cursor = 'pointer';
        }
        if (el.complete && el.naturalHeight > 0) {
          classify(el);
        } else {
          const onLoad = () => classify(el);
          el.addEventListener('load', onLoad);
          cleanups.push(() => el.removeEventListener('load', onLoad));
        }
      });
    };
    wireContainer(
      soalHtmlRef.current,
      'img',
      (el) => {
        if (el.naturalHeight <= 55 || el.naturalWidth <= 95) {
          el.classList.add('inline-symbol-img');
        } else {
          el.classList.add('diagram-img');
        }
      },
      true
    );
    wireContainer(
      opsiHtmlRef.current,
      '.opsi-html img',
      (el) => {
        const isFormula = el.hasAttribute('data-latex') || (el.naturalHeight > 0 && el.naturalHeight <= 65);
        if (isFormula) {
          el.classList.add('opt-math-img');
        } else {
          el.classList.add('opt-diagram-img');
        }
      },
      false
    );
    // Pernyataan (Benar-Salah / Matriks / Pernyataan-Label): klasifikasi gambar
    // dalam HTML pernyataan dengan aturan yang sama seperti opsi (rumus kecil
    // → inline, diagram besar → blok). Klik gambar → lightbox, tanpa toggle nilai.
    wireContainer(
      stmtRef.current,
      '.opsi-html img',
      (el) => {
        const isFormula = el.hasAttribute('data-latex') || (el.naturalHeight > 0 && el.naturalHeight <= 65);
        if (isFormula) {
          el.classList.add('opt-math-img');
        } else {
          el.classList.add('opt-diagram-img');
        }
      },
      true
    );
    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [q?.stimulusHtml, q?.pertanyaanHtml, q?.options, q?.statements, qIndex, soalLoading]);

  const handleZoomImg = useCallback((url: string) => {
    setZoomImg(url);
    setZoomLevel(1);
  }, []);

  const isLast = qIndex === questions.length - 1;
  const fontScale = FONT_SCALES[fontScaleIdx];

  // --- behavior log (external store: tidak re-render halaman) ---
  const logEvent = logStoreRef.current!.logEvent;

  const showToastMsg = useCallback((msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  // Simpan snapshot pengerjaan secara real-time setiap jawaban dipilih
  const syncAttemptProgress = (answerMap: Record<number, Answer>) => {
    const hasil = questions.map((qq, i) => evaluateQuestion(qq, answerMap[i]));
    const benar = hasil.filter((h) => h === 'benar').length;
    const totalPindahTanpaJawab = Object.values(pindahTanpaJawabRef.current).reduce(
      (a, b) => a + b,
      0
    );
    saveAttempt({
      mapel: mapelKey,
      mapelName: mapel?.name || mapelKey,
      paket,
      mode,
      tanggal: sessionTanggalRef.current,
      benar,
      total: questions.length,
      pindahTanpaJawabCount: totalPindahTanpaJawab,
      perSoal: questions.map((qq, i) => ({
        nomor: qq.nomor,
        tipe: qq.tipe,
        topik: qq.topik || '',
        status: hasil[i],
        durasiDetik: durasiPerSoalRef.current[i] || 0,
        gantiJawaban: gantiJawabanRef.current[i] || 0,
        pindahTanpaJawab: pindahTanpaJawabRef.current[i] || 0,
        durasiPilarDetik: durasiPilarRef.current[i],
      })),
    });
  };

  // --- timer ---
  const finishQuiz = (endedBy: 'user' | 'timer') => {
    // Guard: cegah double-finish (double-click / timer + klik manual bersamaan)
    // Reset otomatis setelah 3 detik sebagai pengaman kalau navigasi gagal
    if (finishingRef.current) return;
    finishingRef.current = true;
    if (finishTimerRef.current) clearTimeout(finishTimerRef.current);
    finishTimerRef.current = setTimeout(() => {
      finishingRef.current = false;
    }, 3000);
    let benar = 0, salah = 0, kosong = 0;
    try {
    const mergedAnswers: Record<number, Answer> = { ...answers, ...answersRef.current };
    answersRef.current = mergedAnswers;
    const hasil = questions.map((qq, i) => evaluateQuestion(qq, mergedAnswers[i]));
    benar = hasil.filter((h) => h === 'benar').length;
    salah = hasil.filter((h) => h === 'salah').length;
    kosong = hasil.filter((h) => h === 'kosong').length;
    // Log durasi soal terakhir
    const now = Date.now();
    const durasiMs = now - soalStartTimeRef.current;
    const durasiDetik = Math.round(durasiMs / 1000);
    if (questions[qIndex]) {
      logEvent('soal_duration', {
        soal_no: questions[qIndex].nomor,
        durasi_detik: durasiDetik,
        mode,
      });
      durasiPerSoalRef.current[qIndex] = (durasiPerSoalRef.current[qIndex] || 0) + durasiDetik;
      if (pilarStartTimeRef.current[qIndex]) {
        const pilarSec = Math.max(1, Math.round((now - pilarStartTimeRef.current[qIndex]) / 1000));
        durasiPilarRef.current[qIndex] = (durasiPilarRef.current[qIndex] || 0) + pilarSec;
        pilarStartTimeRef.current[qIndex] = 0;
      }
    }
    logEvent('attempt_finish', {
      mode,
      ended_by: endedBy,
      benar,
      salah,
      kosong,
      total: questions.length,
    });
    // === Simpan detail attempt ke localStorage untuk analisis AI ===
    // (last_attempt → halaman hasil / AI #1, history → ruang / AI #3)
    syncAttemptProgress(mergedAnswers);
    // Hapus progress sesi yang sudah selesai
    try { clearArenaProgress(); } catch {}
    } catch (e) {
      console.error('finishQuiz error:', e);
      finishingRef.current = false;
    }
    // Navigasi SELALU dijalankan walau save gagal — jangan kunci user di arena
    try {
      router.push(
        `/hasil?mode=${mode}&mapel=${mapel.key}&paket=${paket}&benar=${benar}&salah=${salah}&kosong=${kosong}&total=${questions.length}${endedBy === 'timer' ? '&autosubmit=1' : ''}`
      );
    } catch {
      // Fallback: hard navigation bila router gagal
      window.location.href = `/hasil?mode=${mode}&mapel=${mapel.key}&paket=${paket}&benar=${benar}&salah=${salah}&kosong=${kosong}&total=${questions.length}${endedBy === 'timer' ? '&autosubmit=1' : ''}`;
    }
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

  // --- dialog lanjut / mulai baru ---
  const handleResumeContinue = () => {
    if (!resumeDialog) return;
    answersRef.current = resumeDialog.answers;
    setAnswers(resumeDialog.answers);
    setQIndex(resumeDialog.resumeIdx);
    writeArenaProgress({
      mapel: mapelKey,
      paket,
      mode,
      qIndex: resumeDialog.resumeIdx,
      answers: resumeDialog.answers,
      timestamp: Date.now(),
    });
    setResumeDialog(null);
  };

  const handleResumeReset = () => {
    clearArenaProgress();
    answersRef.current = {};
    setAnswers({});
    setRagu({});
    setChecked({});
    setQIndex(0);
    setResumeDialog(null);
  };

  // --- navigasi soal ---
  const goSoal = (idx: number) => {
    if (idx < 0 || idx >= questions.length) return;
    try {
      // Log durasi soal sebelumnya
      const now = Date.now();
      const durasiMs = now - soalStartTimeRef.current;
      const durasiDetik = Math.round(durasiMs / 1000);
      if (questions[qIndex]) {
        logEvent('soal_duration', {
          soal_no: questions[qIndex].nomor,
          durasi_detik: durasiDetik,
          mode,
        });
        // Simpan ke ref untuk analisis AI (akumulasi jika soal dikunjungi ulang)
        const qIdx = qIndex;
        durasiPerSoalRef.current[qIdx] = (durasiPerSoalRef.current[qIdx] || 0) + durasiDetik;
        if (pilarStartTimeRef.current[qIdx]) {
          const pilarSec = Math.max(1, Math.round((now - pilarStartTimeRef.current[qIdx]) / 1000));
          durasiPilarRef.current[qIdx] = (durasiPilarRef.current[qIdx] || 0) + pilarSec;
          pilarStartTimeRef.current[qIdx] = 0;
        }
        const curAns = answersRef.current[qIdx] ?? answers[qIdx];
        if (idx !== qIdx && !isAnswerFilled(curAns)) {
          pindahTanpaJawabRef.current[qIdx] = (pindahTanpaJawabRef.current[qIdx] || 0) + 1;
        }
      }
    } catch (e) { /* abaikan error logging */ }
    // Reset timer untuk soal baru
    soalStartTimeRef.current = Date.now();
    // Reset flag scroll pembahasan untuk soal baru
    // (gunakan nomor soal sebagai key)
    setQIndex(idx);
    writeArenaProgress({
      mapel: mapelKey,
      paket,
      mode,
      qIndex: idx,
      answers: { ...answers, ...answersRef.current },
      timestamp: Date.now(),
    });
    setPilarExpanded(false);
    setSimSoalOpen(false);
    setSimFeedback(null);
    try {
    logEvent('soal_view', { soal_no: questions[idx].nomor, tipe: questions[idx].tipe, mode });
    } catch (e) { /* abaikan */ }
    scrollBodyRef.current?.scrollTo({ top: 0 });
  };

  // --- pilih opsi ---
  const pickOption = (key: string) => {
    const isComplex = q.tipe === 'Pilihan Ganda Kompleks';
    // Track ganti jawaban untuk analisis AI
    const prevAns = answersRef.current[qIndex] ?? answers[qIndex];
    const sudahAdaJawaban = isAnswerFilled(prevAns);
    if (sudahAdaJawaban) {
      gantiJawabanRef.current[qIndex] = (gantiJawabanRef.current[qIndex] || 0) + 1;
    }
    const nextAns: Answer = isComplex
      ? (() => {
          const arr = Array.isArray(prevAns) ? [...prevAns] : [];
          return arr.includes(key) ? arr.filter((k) => k !== key) : [...arr, key];
        })()
      : key;
    const updated: Record<number, Answer> = { ...answers, ...answersRef.current };
    if (isAnswerFilled(nextAns)) {
      updated[qIndex] = nextAns;
    } else {
      delete updated[qIndex];
    }
    answersRef.current = updated;
    setAnswers(updated);
    setChecked((prev) => ({ ...prev, [qIndex]: false }));
    writeArenaProgress({
      mapel: mapelKey,
      paket,
      mode,
      qIndex,
      answers: updated,
      timestamp: Date.now(),
    });
    syncAttemptProgress(updated);
    logEvent('option_click', { soal_no: q.nomor, opsi: key, mode });
  };

  const pickBs = (stmtKey: string, val: string) => {
    // Track ganti jawaban untuk analisis AI
    const prevAns = (answersRef.current[qIndex] ?? answers[qIndex]) as Record<string, string> | undefined;
    if (prevAns && prevAns[stmtKey] && prevAns[stmtKey] !== val) {
      gantiJawabanRef.current[qIndex] = (gantiJawabanRef.current[qIndex] || 0) + 1;
    }
    const cur = (prevAns && typeof prevAns === 'object' && !Array.isArray(prevAns)) ? prevAns : {};
    const updated: Record<number, Answer> = {
      ...answers,
      ...answersRef.current,
      [qIndex]: { ...cur, [stmtKey]: val },
    };
    answersRef.current = updated;
    setAnswers(updated);
    setChecked((prev) => ({ ...prev, [qIndex]: false }));
    writeArenaProgress({
      mapel: mapelKey,
      paket,
      mode,
      qIndex,
      answers: updated,
      timestamp: Date.now(),
    });
    syncAttemptProgress(updated);
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
      const ans = answersRef.current[qIndex] ?? answers[qIndex];
      const kosong = evaluateQuestion(q, ans) === 'kosong';
      if (kosong) {
        showToastMsg('⚠️ Pilih jawabanmu dulu sebelum Cek Jawaban!');
        return;
      }
      setChecked((prev) => ({ ...prev, [qIndex]: true }));
      setSidebarTab('pilar');
      pilarStartTimeRef.current[qIndex] = Date.now();
      logEvent('check_answer', { soal_no: q.nomor, jawaban: ans });
      // Catat pilar pembahasan yang tersedia saat user cek jawaban
      const pilarTersedia: string[] = [];
      if (q.pilar1?.trim()) pilarTersedia.push('pilar1');
      if (q.pilar3?.trim()) pilarTersedia.push('pilar3');
      if (q.pilar4?.length) pilarTersedia.push('pilar4');
      if (q.pilar5?.trim()) pilarTersedia.push('pilar5');
      logEvent('pembahasan_view', {
        soal_no: q.nomor,
        tipe: q.tipe,
        pilar_tersedia: pilarTersedia,
        mode,
      });
      if (evalScrollTimerRef.current) clearTimeout(evalScrollTimerRef.current);
      evalScrollTimerRef.current = setTimeout(
        () => evalRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }),
        120
      );
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
  // Error tutor hanya berlaku untuk soal saat ini; ganti soal -> bersihkan
  // supaya tombol "Coba lagi" tidak mengirim pertanyaan soal lama ke soal baru.
  useEffect(() => {
    setTutorError(null);
  }, [qIndex]);

  const openTutor = () => {
    setShowTutor(true);
    setChatMsgs([{ from: 'ai', html: buildTutorGreeting(mode, q) }]);
    setPreviewSoalOpen(false);
    logEvent('ai_tutor_open', { soal_no: q.nomor, mode });
  };

  const sendChat = async (text: string) => {
    const msg = text.trim();
    if (!msg) return;
    // Guard: cegah pesan duplikat dari double-click submit (<500ms, pesan sama)
    // eslint-disable-next-line react-hooks/purity -- Date.now() di event handler (bukan render), aman
    const now = Date.now();
    if (lastChatRef.current.msg === msg && now - lastChatRef.current.ts < 500) return;
    lastChatRef.current = { msg, ts: now };
    setTutorError(null);

    // Ambil 2-3 chat terakhir di soal ini (sebelum pesan baru ditambahkan) agar tanya lanjutan nyambung
    const recentTurns = chatMsgs
      .slice(1) // lewati sapaan pembuka
      .filter((m) => !m.html.includes('AI sedang berpikir'))
      .slice(-3)
      .map((m) => {
        const plain = m.html
          .replace(/<br\s*\/?>/gi, ' ')
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        return `${m.from === 'user' ? 'Siswa' : 'Tutor'}: ${plain.slice(0, 220)}`;
      });

    // Tampilkan pesan user + indikator loading
    setChatMsgs((prev) => [
      ...prev,
      { from: 'user', html: msg },
      { from: 'ai', html: '⏳ <i>AI sedang berpikir...</i>' },
    ]);
    logEvent('ai_tutor_ask', { soal_no: q.nomor, prompt: msg.slice(0, 60) });

    // Rekomendasi 3: Fallback template berjenjang (anti kosong saat backend offline)
    const konsepDasar =
      [q.diketahui, q.ditanyakan].filter(Boolean).join(' ') ||
      q.pilar1 ||
      `Topik ${q.topik}`;
    const trikAtauJebakan =
      q.pilar5 ||
      (q.commonMistakes && q.commonMistakes.length > 0 ? q.commonMistakes[0] : '');

    // Rekomendasi 1 & 2: Susun konteks lengkap (soal, opsi/pernyataan, gambar, jawaban siswa, 5 pilar, & riwayat chat)
    const curAns = answersRef.current[qIndex] ?? answers[qIndex];
    const formattedAns = !isAnswerFilled(curAns)
      ? 'Belum memilih jawaban'
      : typeof curAns === 'string'
        ? curAns
        : Array.isArray(curAns)
          ? curAns.join(', ')
          : Object.entries(curAns ?? {})
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ');

    const opsiSummary = q.options?.length
      ? q.options.map((o) => `${o.key}. ${o.text}`).join(' | ')
      : q.statements?.length
        ? q.statements.map((s) => `${s.key}. ${s.text}`).join(' | ')
        : '-';

    const hasVisual =
      Boolean(q.stimulus_url?.length || q.pertanyaan_url?.length || q.gambar_url?.length) ||
      Boolean(q.options?.some((o) => o.image_url || /<img/i.test(o.html || ''))) ||
      Boolean(q.statements?.some((s) => s.image_url || /<img/i.test(s.html || '')));

    const pilarStepsSummary =
      q.pilar4 && q.pilar4.length > 0
        ? q.pilar4.map((s, idx) => `(${idx + 1}) ${s}`).join(' ')
        : '-';

    const modeInstruction =
      mode === 'simulasi'
        ? 'MODE SIMULASI UJIAN: JANGAN bocorkan huruf kunci jawaban secara langsung; berikan petunjuk konsep & arahkan langkah berpikir.'
        : `MODE LATIHAN${checked[qIndex] ? ' (Sudah Cek Jawaban)' : ''}: Jelaskan dengan ramah dan mengacu pada pembahasan 5 Pilar. Kunci resmi: ${formatKunci(q)}`;

    const contextualMessage =
      `[KONTEKS SOAL AI TUTOR - ${mapel.name} (${mapelKey}) Paket ${paket} · Soal #${q.nomor}]\n` +
      `- Instruksi Mode: ${modeInstruction}\n` +
      `- Tipe & Topik: ${q.tipe} · ${q.topik}\n` +
      (q.stimulus ? `- Stimulus: ${q.stimulus.slice(0, 450)}\n` : '') +
      `- Pertanyaan: ${q.prompt}\n` +
      `- Opsi/Pernyataan: ${opsiSummary}\n` +
      (hasVisual ? `- Info Visual: Soal/opsi ini memuat gambar atau rumus visual di layar siswa.\n` : '') +
      `- Jawaban Siswa Saat Ini: ${formattedAns}\n` +
      `- Pegangan 5 Pilar:\n` +
      `  • Pilar 1 (Konsep/Diketahui): ${konsepDasar}\n` +
      (q.pilar3 ? `  • Pilar 3 (Alasan Rumus): ${q.pilar3}\n` : '') +
      `  • Pilar 4 (Langkah): ${pilarStepsSummary}\n` +
      (trikAtauJebakan ? `  • Pilar 5 (Trik/Jebakan): ${trikAtauJebakan}\n` : '') +
      (recentTurns.length > 0 ? `- Riwayat Chat Sebelumnya:\n  ${recentTurns.join('\n  ')}\n` : '') +
      `\nPertanyaan Siswa: ${msg}`;

    // Abort request sebelumnya jika masih jalan (cegah race condition)
    if (chatAbortRef.current) chatAbortRef.current.abort();
    const aborter = new AbortController();
    chatAbortRef.current = aborter;

    try {
      const res = await fetch('/api/tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: mapelKey,
          paket,
          nomor: q.nomor,
          message: contextualMessage,
        }),
        signal: aborter.signal,
      });
      const data = await res.json();

      let replyHtml: string;
      if (data.status === 'success' && data.reply) {
        // AI beneran jawab! Format plain text -> HTML sederhana
        const escaped = data.reply
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n\n/g, '<br/><br/>')
          .replace(/\n/g, '<br/>');
        replyHtml = `<b>🤖 AI Tutor:</b><br/>${escaped}`;
        // Kuota hanya kepotong kalau AI beneran jawab (bukan saat gagal)
        setTutorQuota((qt) => Math.max(0, qt - 1));
      } else if (data.status === 'rate_limited') {
        replyHtml = `⏸️ <b>${data.message || 'Kuota habis, coba lagi nanti.'}</b>`;
      } else {
        // Backend error -> tampilkan error jujur, JANGAN jawaban template
        const errMsg = String(data.message || 'Gagal mendapatkan respons AI.')
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        replyHtml = `⚠️ <b>AI gagal terhubung.</b> ${errMsg} Tekan tombol "Coba lagi" di bawah untuk mengulang pertanyaanmu.`;
        setTutorError(errMsg);
      }

      // Ganti pesan loading dengan jawaban asli
      setChatMsgs((prev) => {
        const next = [...prev];
        next[next.length - 1] = { from: 'ai', html: replyHtml };
        return next;
      });
    } catch (e) {
      // Abort (request dibatalkan) -> jangan update UI, bukan error
      if (e instanceof Error && e.name === 'AbortError') return;
      // Network error -> tampilkan error jujur, JANGAN jawaban template
      setTutorError('Koneksi AI gagal.');
      setChatMsgs((prev) => {
        const next = [...prev];
        next[next.length - 1] = {
          from: 'ai',
          html: `⚠️ <b>Koneksi AI gagal.</b> Periksa koneksimu lalu tekan tombol "Coba lagi" di bawah.`,
        };
        return next;
      });
    }
  };

  // Kirim ulang pertanyaan terakhir saat AI gagal (tombol "Coba lagi")
  const retryTutor = () => {
    if (lastChatRef.current.msg) sendChat(lastChatRef.current.msg);
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

  // Loading / error state untuk fetch soal
  if (soalLoading || !q) {
    return (
      <div className="min-h-dvh bg-[#18181B] flex justify-center">
        <div className="relative w-full max-w-[430px] md:max-w-[1600px] 2xl:max-w-[1840px] min-h-dvh bg-[#FAFAF7] flex flex-col items-center justify-center sm:border-x-2 sm:border-[#111] p-6">
          <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl px-6 py-4 text-sm font-extrabold bg-white text-center">
            <div className="text-2xl mb-2">📚</div>
            Memuat soal…
          </div>
        </div>
      </div>
    );
  }

  let petaDijawabCount = 0;
  let petaRaguCount = 0;
  let petaBelumCount = 0;
  questions.forEach((qq, i) => {
    const ans = answers[i] ?? answersRef.current[i];
    const dijawab = isAnswerFilled(ans) && evaluateQuestion(qq, ans) !== 'kosong';
    if (ragu[i]) petaRaguCount++;
    if (dijawab) petaDijawabCount++;
    else petaBelumCount++;
  });

  const desktopChatMsgs =
    chatMsgs.length > 0 ? chatMsgs : [{ from: 'ai' as const, html: buildTutorGreeting(mode, q) }];

  return (
    <div className="min-h-dvh bg-[#18181B] flex justify-center">
      <div className="relative w-full max-w-[430px] md:max-w-[1600px] 2xl:max-w-[1840px] min-h-dvh bg-[#FAFAF7] flex flex-col sm:border-x-2 sm:border-[#111] overflow-hidden md:overflow-visible">
        {/* Badge sumber soal + error (tidak mengganggu tampilan utama) */}
        {soalError && soalSource === 'dummy' && (
          <div className="bg-amber-100 border-b-2 border-[#111] px-3 py-1.5 text-[11px] font-bold text-amber-900 text-center shrink-0">
            ⚠️ {soalError}
          </div>
        )}
        {/* ===== TOP BAR ===== */}
        <header className="bg-white border-b-2 border-[#111] px-3 md:px-6 py-2.5 md:py-3 flex items-center justify-between gap-1.5 md:gap-3 shrink-0 sticky top-0 z-30">
          <NeoBtn
            onClick={() => setShowExitConfirm(true)}
            className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-xs shrink-0"
            title="Keluar ke Beranda"
          >
            ✕
          </NeoBtn>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1 md:gap-2">
              <span
                className={`text-[10px] md:text-xs font-extrabold px-1.5 md:px-2.5 py-0.5 rounded border border-[#111] shrink-0 ${
                  mode === 'simulasi' ? 'bg-amber-300' : 'bg-[#B6FF00]'
                }`}
              >
                {mode === 'simulasi' ? '⚡ Simulasi' : '🌱 Latihan'}
              </span>
              <span className="text-xs md:text-sm font-extrabold truncate">{soalLabel}</span>
              <span className="bg-[#111] text-[#B6FF00] text-[10px] md:text-xs font-extrabold px-1.5 md:px-2 py-0.5 rounded shrink-0">
                {q.nomor}/{questions.length}
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
            className="px-2 py-1 rounded-lg bg-[#E0E7FF] text-xs flex md:hidden items-center gap-1 shrink-0"
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
            📡<ArenaLogCount useLogCount={useLogCount} />
          </button>
        </header>

        {/* ===== PROGRESS BAR ===== */}
        <div className="w-full h-1.5 bg-neutral-200 border-b border-[#111] shrink-0 md:sticky md:top-[53px] md:z-20">
          <div
            className="h-full w-full bg-[#B6FF00] transition-transform duration-300 origin-left"
            style={{ transform: `scaleX(${(((qIndex + 1) / questions.length)).toFixed(4)})` }}
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

        {/* ===== DESKTOP 2-COLUMN WRAPPER (Mobile: flex-col utuh, Desktop: 60% kiri + 40% kanan sticky) ===== */}
        <div className="flex-1 flex flex-col md:flex-row md:items-start md:gap-6 md:p-6">
          {/* ===== KOLOM KIRI (60% di desktop): Navigasi Prev/Next Kiri-Kanan + Area Soal + Action Bar ===== */}
          <div className={`flex-1 flex flex-col w-full ${sidebarHidden ? 'md:w-full' : 'md:w-[60%]'} md:min-w-0`}>
            <div className="flex-1 flex flex-col md:flex-row md:items-start md:gap-3">
              {/* Tombol Navigasi Soal Sebelumnya (Besar di Kiri Area Soal - Desktop Only) */}
              <NeoBtn
                onClick={() => goSoal(qIndex - 1)}
                disabled={qIndex === 0}
                title="Soal Sebelumnya"
                className="hidden md:flex w-12 h-16 rounded-2xl bg-white items-center justify-center text-lg shrink-0 sticky top-24"
              >
                ←
              </NeoBtn>

              {/* ===== AREA SOAL ===== */}
              <div
                ref={scrollBodyRef}
                className="flex-1 overflow-y-auto md:overflow-visible p-4 pb-28 md:p-0 md:pb-4 min-w-0"
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
              {/* Gaya gambar inline persis app lama: kecil → sebaris teks, besar → blok tengah */}
              <style>{`
                .soal-html img { cursor: zoom-in; }
                .soal-html img.inline-symbol-img { display: inline-block; margin: 0 3px; max-height: 3.2em; width: auto; vertical-align: middle; border: none; background: transparent; }
                .soal-html img.diagram-img { display: block; margin: 14px auto; max-width: 100%; max-height: 320px; width: auto; height: auto; object-fit: contain; border-radius: 8px; border: 1px solid #e5e5e5; background: #ffffff; }
                .opsi-html { display: inline; }
                .opsi-html p { margin: 0; display: inline; }
                .opsi-html img { cursor: zoom-in; }
                .opsi-html img.opt-math-img { display: inline-block; margin: 0 3px; padding: 0 2px; max-height: 3.2em; width: auto; vertical-align: middle; border: none; background: transparent; object-fit: contain; }
                .opsi-html img.opt-diagram-img { display: block; margin: 6px 0; max-width: 100%; max-height: 280px; width: auto; height: auto; object-fit: contain; border-radius: 8px; border: 1px solid #e5e5e5; background: #ffffff; padding: 6px; }
                /* Gambar dalam pernyataan Benar-Salah / Matriks (persis app lama:
                   kecil inline sebaris teks, klik -> lightbox) */
                .bs-stmt-img { max-width: 100%; max-height: 48px; width: auto; height: auto; vertical-align: middle; cursor: zoom-in; object-fit: contain; }
              `}</style>
              <div ref={soalHtmlRef}>
                {/* Stimulus: HTML asli (gambar inline) seperti app lama; fallback ke teks */}
                {q.stimulusHtml && /<img/i.test(q.stimulusHtml) ? (
                  <div className="soal-html text-xs leading-relaxed" dangerouslySetInnerHTML={{ __html: q.stimulusHtml }} />
                ) : q.stimulus ? (
                  <div className="bg-[#FAFAF7] border-2 border-dashed border-neutral-300 rounded-xl p-3 text-xs leading-relaxed">
                    {q.stimulus}
                  </div>
                ) : null}
                {/* Pertanyaan: HTML asli bila ada gambar inline; selain itu pakai Latex */}
                {q.pertanyaanHtml && /<img/i.test(q.pertanyaanHtml) ? (
                  <div className="soal-html font-semibold leading-relaxed text-[1.1em]" dangerouslySetInnerHTML={{ __html: q.pertanyaanHtml }} />
                ) : (
                  <div className="font-semibold leading-relaxed text-[1.1em]"><Latex text={q.prompt} /></div>
                )}
              </div>

              {q.tipe === 'Pilihan Ganda Kompleks' && (
                <div className="bg-[#E0E7FF] border-2 border-[#111] rounded-xl px-3 py-2 text-xs font-extrabold">
                  ☑️ Pilihan Ganda Kompleks · Pilih lebih dari satu jawaban yang benar!
                </div>
              )}

              {/* Opsi PG / PG Kompleks */}
              {q.options && (
                <div className="space-y-2 pt-1" ref={opsiHtmlRef}>
                  {q.options.map((opt) => {
                    const ans = answers[qIndex] ?? answersRef.current[qIndex];
                    const selected =
                      q.tipe === 'Pilihan Ganda Kompleks'
                        ? Array.isArray(ans) && ans.includes(opt.key)
                        : ans === opt.key;
                    const isComplex = q.tipe === 'Pilihan Ganda Kompleks';
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => pickOption(opt.key)}
                        className={`w-full p-3 rounded-xl text-left flex items-center gap-3 text-xs font-bold border-2 border-[#111] shadow-[0_3px_0_#111] active:translate-y-[2px] active:shadow-[0_1px_0_#111] transition-all ${
                          selected ? 'bg-[#B6FF00]' : 'bg-white'
                        }`}
                      >
                        {!(opt.image_url && !opt.text) && (
                          <span
                            className={`w-6 h-6 ${isComplex ? 'rounded-md' : 'rounded-full'} border-2 border-[#111] bg-white flex items-center justify-center font-extrabold text-[11px] shrink-0 pointer-events-none`}
                          >
                            {isComplex && selected ? '✓' : opt.key}
                          </span>
                        )}
                        {/* Prioritas render opsi seperti app lama:
                            1) HTML resmi CBT (gambar rumus inline),
                            2) gambar + teks, 3) teks/latex via KaTeX */}
                        {opt.html ? (
                          <span className="flex-1 opsi-html pointer-events-none" dangerouslySetInnerHTML={{ __html: opt.html }} />
                        ) : (
                          <>
                            {opt.text ? (
                              <span className="flex-1 pointer-events-none"><Latex text={opt.text} /></span>
                            ) : null}
                            {/* Gambar opsi: kecil inline di samping teks (seperti app lama, ~40px) */}
                            {opt.image_url && (
                              <span className={`${opt.text ? 'shrink-0' : 'flex-1 flex justify-center'} border-[1.5px] border-[#111] rounded-lg overflow-hidden bg-white pointer-events-none`}>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={opt.image_url}
                                  alt={`Gambar opsi ${opt.key}`}
                                  className={opt.text ? 'h-10 w-auto object-contain' : 'w-full h-auto max-h-80 object-contain'}
                                  loading="lazy"
                                />
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Tabel Benar-Salah / Matriks / Pernyataan-Label
                  (dibungkus stmtRef untuk klasifikasi gambar pernyataan) */}
              <div ref={stmtRef}>
              {/* Tabel Benar-Salah */}
              {q.statements && q.tipe === 'Benar-Salah' && (
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
                          <ArenaStatementBody st={st} onZoom={handleZoomImg} />
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

              {/* Tabel Matriks / Pernyataan-Label (label kolom custom) */}
              {q.statements && (q.tipe === 'Matriks' || q.tipe === 'Pernyataan-Label') && (
                <div className="border-2 border-[#111] rounded-xl overflow-hidden text-xs">
                  <div className="bg-[#111] text-white font-extrabold px-3 py-2">
                    <div className="mb-1">
                      {q.tipe === 'Matriks' ? '▦ Matriks' : '🏷️ Pernyataan-Label'} · Pilih satu label per pernyataan
                    </div>
                    <div className="flex">
                      <span className="flex-1">Pernyataan</span>
                      {(q.labelOptions ?? []).map((lb) => (
                        <span key={lb} className="w-20 text-center shrink-0">
                          {lb}
                        </span>
                      ))}
                    </div>
                  </div>
                  {q.statements.map((st) => {
                    const cur = (answers[qIndex] as Record<string, string>) || {};
                    const labels = q.labelOptions ?? [];
                    return (
                      <div
                        key={st.key}
                        className="p-3 border-t border-neutral-200 bg-white"
                      >
                        <div className="mb-2">
                          <b className="mr-1">{st.key}.</b>
                          <ArenaStatementBody st={st} onZoom={handleZoomImg} />
                        </div>
                        <div className="flex gap-1">
                          <span className="flex-1" />
                          {labels.map((lb, li) => (
                            <NeoBtn
                              key={lb}
                              onClick={() => pickBs(st.key, lb)}
                              className={`w-20 py-1 rounded-lg text-[11px] shrink-0 ${cur[st.key] === lb ? (li === 0 ? 'bg-[#B6FF00]' : 'bg-[#E0E7FF]') : 'bg-white'}`}
                            >
                              {lb}
                            </NeoBtn>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
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
                        const willExpand = !pilarExpanded;
                        setPilarExpanded(willExpand);
                        logEvent('pembahasan_5pilar_toggle', { soal_no: q.nomor });
                        if (willExpand) {
                          // Catat pilar mana yang tersedia isinya
                          const pilarTersedia: string[] = [];
                          if (q.pilar1?.trim()) pilarTersedia.push('pilar1');
                          if (q.pilar3?.trim()) pilarTersedia.push('pilar3');
                          if (q.pilar4?.length) pilarTersedia.push('pilar4');
                          if (q.pilar5?.trim()) pilarTersedia.push('pilar5');
                          logEvent('pilar_open', {
                            soal_no: q.nomor,
                            pilar_tersedia: pilarTersedia,
                          });
                        }
                      }}
                      className="bg-[#E0E7FF] px-3 py-1 rounded-full text-[11px]"
                    >
                      {pilarExpanded ? '🔼 Ciutkan' : '📖 5 Pilar Lengkap'}
                    </NeoBtn>
                  </div>

                  <div className="mt-3 text-xs leading-relaxed text-neutral-800">
                    <b>Inti Logika:</b>
                    <PilarText text={q.ringkas} className="text-xs leading-relaxed text-neutral-800" />
                  </div>

                  {pilarExpanded && (
                    <div className="mt-4 space-y-4 border-t-2 border-dashed border-neutral-300 pt-3 md:hidden">
                      <ArenaPilarCards q={q} />
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
                          <Latex text={o} />
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

              {/* Tombol Navigasi Soal Selanjutnya (Besar di Kanan Area Soal - Desktop Only) */}
              <NeoBtn
                onClick={() => goSoal(qIndex + 1)}
                disabled={isLast}
                title="Soal Selanjutnya"
                className="hidden md:flex w-12 h-16 rounded-2xl bg-white items-center justify-center text-lg shrink-0 sticky top-24"
              >
                →
              </NeoBtn>
            </div>

            {/* ===== BOTTOM BAR ===== */}
            <footer className="absolute bottom-0 left-0 right-0 md:static md:mt-2 md:mx-15 bg-white border-t-2 md:border-2 border-[#111] md:rounded-2xl md:shadow-[0_4px_0_#111] px-3 md:px-4 py-2.5 md:py-3 flex items-center gap-2 shrink-0 z-30">
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
                className="px-3 py-2.5 rounded-xl bg-[#E0E7FF] text-xs flex md:hidden items-center gap-1"
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
          </div>

          {/* Tombol tampilkan sidebar (saat sidebar tersembunyi) */}
          {sidebarHidden && (
            <div className="hidden md:flex md:sticky md:top-1/2 md:-translate-y-1/2 z-40 self-start -mr-2">
              <button
                type="button"
                onClick={() => setSidebarHidden(false)}
                className="w-8 h-16 bg-[#B6FF00] border-2 border-[#111] rounded-xl flex items-center justify-center text-sm font-extrabold shadow-[-2px_0_0_#111] hover:bg-[#c8ff2e] transition-all cursor-pointer"
                title="Tampilkan sidebar"
              >
                ◀
              </button>
            </div>
          )}
          {/* ===== KOLOM KANAN (40% di desktop): Tab Peta / AI Tutor / 5 Pilar ===== */}
          {!sidebarHidden && (
            <aside className="hidden md:flex md:w-[40%] md:shrink-0 md:flex-col md:sticky md:top-16 md:max-h-[calc(100dvh-5rem)] relative">
              {/* Tombol sembunyikan sidebar (saat sidebar terbuka) */}
              <button
                type="button"
                onClick={() => setSidebarHidden(true)}
                className="hidden md:flex absolute -left-10 top-1/2 -translate-y-1/2 z-40 w-8 h-16 bg-[#B6FF00] border-2 border-[#111] rounded-xl items-center justify-center text-sm font-extrabold shadow-[-2px_0_0_#111] hover:bg-[#c8ff2e] transition-all cursor-pointer"
                title="Sembunyikan sidebar"
              >
                ▶
              </button>
            {/* Tab buttons */}
            <div className="flex border-2 border-[#111] rounded-t-2xl overflow-hidden shrink-0 bg-white shadow-[0_4px_0_#111]">
              <button
                type="button"
                onClick={() => setSidebarTab('peta')}
                className={`flex-1 px-3 py-3 text-xs font-extrabold flex items-center justify-center gap-1.5 transition-all ${sidebarTab === 'peta' ? 'bg-[#B6FF00]' : 'bg-white hover:bg-[#FAFAF7]'}`}
              >
                <span>🗺️</span><span>Peta</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('ai')}
                className={`flex-1 px-3 py-3 text-xs font-extrabold flex items-center justify-center gap-1.5 border-l-2 border-[#111] transition-all ${sidebarTab === 'ai' ? 'bg-[#B6FF00]' : 'bg-white hover:bg-[#FAFAF7]'}`}
              >
                <span>✨</span><span>AI Tutor</span>
              </button>
              <button
                type="button"
                onClick={() => setSidebarTab('pilar')}
                className={`flex-1 px-3 py-3 text-xs font-extrabold flex items-center justify-center gap-1.5 border-l-2 border-[#111] transition-all ${sidebarTab === 'pilar' ? 'bg-[#B6FF00]' : 'bg-white hover:bg-[#FAFAF7]'}`}
              >
                <span>📖</span><span>5 Pilar</span>
              </button>
            </div>
            {/* Tab content */}
            <div className="flex-1 overflow-y-auto border-2 border-t-0 border-[#111] rounded-b-2xl bg-white shadow-[0_4px_0_#111] p-4">
              {sidebarTab === 'peta' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-extrabold flex items-center gap-1.5">
                      <span>▦</span><span>Peta Nomor Soal</span>
                    </h3>
                    <span className="bg-[#111] text-[#B6FF00] text-[10px] font-extrabold px-2 py-0.5 rounded">
                      Soal #{q.nomor}/{questions.length}
                    </span>
                  </div>
                  <ArenaPetaBody
                    variant="desktop"
                    questions={questions}
                    answers={answers}
                    answersRef={answersRef}
                    ragu={ragu}
                    qIndex={qIndex}
                    petaDijawabCount={petaDijawabCount}
                    petaRaguCount={petaRaguCount}
                    petaBelumCount={petaBelumCount}
                    onSelectSoal={goSoal}
                    onFinish={() => finishQuiz('user')}
                  />
                </div>
              )}
              {sidebarTab === 'ai' && (
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="w-7 h-7 rounded-full bg-[#B6FF00] border border-[#111] flex items-center justify-center text-xs font-extrabold">✨</span>
                    <div>
                      <h3 className="text-xs font-extrabold">AI Tutor {mapelShort}</h3>
                      {tutorError ? (
                        <p className="text-[10px] text-red-600 font-bold">⚠️ AI tidak terhubung — jawaban terakhir gagal</p>
                      ) : (
                        <p className="text-[10px] text-green-700 font-bold">✓ Paham konteks Soal #{q.nomor}</p>
                      )}
                    </div>
                    <span className="ml-auto bg-[#E0E7FF] border border-[#111] px-2 py-0.5 rounded-full text-[10px] font-extrabold">{tutorQuota}/25</span>
                  </div>
                  <ArenaTutorChatBody
                    variant="desktop"
                    q={q}
                    previewSoalOpen={previewSoalOpen}
                    onTogglePreviewSoal={() => setPreviewSoalOpen((v) => !v)}
                    messages={desktopChatMsgs}
                    onSendChat={sendChat}
                    tutorError={tutorError}
                    onRetryTutor={retryTutor}
                  />
                </div>
              )}
              {sidebarTab === 'pilar' && (
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold">📖 Pembahasan 5 Pilar</h3>
                  {showEval ? (
                    <ArenaPilarCards q={q} />
                  ) : (
                    <p className="text-xs text-neutral-500 text-center py-8">
                      Klik "Cek Jawaban" untuk melihat pembahasan 5 pilar di sini.
                    </p>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
        </div>

        {/* ===== MODAL LEBAR PEMBAHASAN 5 PILAR (Desktop Only) ===== */}
        {showEval && pilarExpanded && (
          <div
            className="hidden md:flex fixed inset-0 z-50 bg-black/50 items-center justify-center p-6"
            onClick={() => setPilarExpanded(false)}
          >
            <div
              className="bg-[#FAFAF7] border-2 border-[#111] shadow-[0_6px_0_#111] rounded-3xl w-full max-w-3xl max-h-[85dvh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white border-b-2 border-[#111] px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#B6FF00] border border-[#111] px-2 py-0.5 rounded">
                    📖 Pembahasan 5 Pilar · Soal #{q.nomor}
                  </span>
                  <h3 className="text-base font-extrabold mt-1">Kunci Jawaban: {kunciStr}</h3>
                </div>
                <NeoBtn
                  onClick={() => setPilarExpanded(false)}
                  className="w-8 h-8 rounded-lg bg-white text-xs flex items-center justify-center"
                >
                  ✕
                </NeoBtn>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <ArenaPilarCards q={q} />
              </div>
              <div className="bg-white border-t-2 border-[#111] px-6 py-3 flex items-center justify-end gap-2 shrink-0">
                <NeoBtn
                  onClick={() => setPilarExpanded(false)}
                  className="bg-[#B6FF00] px-4 py-2 rounded-xl text-xs"
                >
                  Tutup Pembahasan
                </NeoBtn>
              </div>
            </div>
          </div>
        )}

        {/* ===== MODAL ZOOM GAMBAR (lightbox dengan +, -, 100%, X seperti app lama) ===== */}
        {zoomImg && (
          <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setZoomImg(null)}>
            <div
              className="bg-white border-2 border-[#111] rounded-2xl p-2 max-w-full max-h-full overflow-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center gap-2 pb-2 border-b-2 border-[#111] mb-2">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.5, +(z - 0.25).toFixed(2)))}
                  className="w-9 h-9 rounded-lg bg-white border-2 border-[#111] shadow-[0_2px_0_#111] font-extrabold text-lg active:translate-y-[2px] active:shadow-none"
                  aria-label="Perkecil"
                >
                  −
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="h-9 px-3 rounded-lg bg-[#B6FF00] border-2 border-[#111] shadow-[0_2px_0_#111] font-extrabold text-xs active:translate-y-[2px] active:shadow-none"
                >
                  {Math.round(zoomLevel * 100)}%
                </button>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(3, +(z + 0.25).toFixed(2)))}
                  className="w-9 h-9 rounded-lg bg-white border-2 border-[#111] shadow-[0_2px_0_#111] font-extrabold text-lg active:translate-y-[2px] active:shadow-none"
                  aria-label="Perbesar"
                >
                  +
                </button>
                <button
                  onClick={() => setZoomImg(null)}
                  className="w-9 h-9 rounded-lg bg-red-100 border-2 border-[#111] shadow-[0_2px_0_#111] font-extrabold text-sm active:translate-y-[2px] active:shadow-none"
                  aria-label="Tutup"
                >
                  ✕
                </button>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={zoomImg}
                alt="Gambar soal diperbesar"
                className="h-auto mx-auto transition-transform"
                style={{ maxWidth: `${zoomLevel * 100}%`, width: zoomLevel > 1 ? `${zoomLevel * 100}%` : undefined }}
              />
              <div className="text-center text-xs font-bold py-2">Tap di luar untuk tutup</div>
            </div>
          </div>
        )}

        {/* ===== DRAWER PETA SOAL (Mobile Only) ===== */}
        {showPeta && (
          <div className="fixed inset-0 z-40 bg-black/50 flex md:hidden flex-col justify-end" onClick={() => setShowPeta(false)}>
            <div
              className="bg-[#FAFAF7] border-t-2 border-[#111] rounded-t-3xl p-4 space-y-4 max-h-[85dvh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between shrink-0">
                <h3 className="text-sm font-extrabold">Peta Nomor Soal</h3>
                <NeoBtn onClick={() => setShowPeta(false)} className="w-7 h-7 rounded-lg bg-white text-xs">
                  ✕
                </NeoBtn>
              </div>
              <ArenaPetaBody
                variant="mobile"
                questions={questions}
                answers={answers}
                answersRef={answersRef}
                ragu={ragu}
                qIndex={qIndex}
                petaDijawabCount={petaDijawabCount}
                petaRaguCount={petaRaguCount}
                petaBelumCount={petaBelumCount}
                onSelectSoal={(i) => {
                  goSoal(i);
                  setShowPeta(false);
                }}
                onFinish={() => finishQuiz('user')}
              />
            </div>
          </div>
        )}

        {/* ===== AI TUTOR SHEET (Mobile Only) ===== */}
        {showTutor && (
          <div className="fixed inset-0 z-40 bg-black/50 flex md:hidden flex-col justify-end" onClick={() => setShowTutor(false)}>
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
                    {tutorError ? (
                      <p className="text-[10px] text-red-600 font-bold">⚠️ AI tidak terhubung — jawaban terakhir gagal</p>
                    ) : (
                      <p className="text-[10px] text-green-700 font-bold">✓ Paham konteks Soal #{q.nomor}</p>
                    )}
                    <p className="text-[9px] text-neutral-400">AI beneran (Railway) + fallback template</p>
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

              <ArenaTutorChatBody
                variant="mobile"
                q={q}
                previewSoalOpen={previewSoalOpen}
                onTogglePreviewSoal={() => setPreviewSoalOpen((v) => !v)}
                messages={chatMsgs}
                onSendChat={sendChat}
                tutorError={tutorError}
                onRetryTutor={retryTutor}
              />
            </div>
          </div>
        )}

        {/* ===== MODAL KONFIRMASI KELUAR ===== */}
        {showExitConfirm && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
            <div className="bg-white border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-5 w-full max-w-[300px] text-center">
              <div className="text-3xl mb-2">🚪</div>
              <p className="text-sm font-bold mb-4">Keluar ke Beranda? Progres latihanmu tetap aman.</p>
              <div className="flex gap-2">
                <NeoBtn
                  onClick={() => {
                    setShowExitConfirm(false);
                    logEvent('exit_arena', {});
                    router.push('/beranda');
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

        {/* ===== MODAL LANJUTKAN PROGRESS ===== */}
        {resumeDialog && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6">
            <div className="bg-white border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-5 w-full max-w-[300px] text-center">
              <div className="text-3xl mb-2">📌</div>
              <p className="text-sm font-bold mb-4">Lanjutkan dari soal #{resumeDialog.resumeNomor}?</p>
              <div className="flex gap-2">
                <NeoBtn
                  onClick={handleResumeContinue}
                  className="flex-1 bg-[#B6FF00] py-2.5 rounded-xl text-xs"
                >
                  Lanjut
                </NeoBtn>
                <NeoBtn
                  onClick={handleResumeReset}
                  className="flex-1 bg-white py-2.5 rounded-xl text-xs"
                >
                  Mulai Baru
                </NeoBtn>
              </div>
            </div>
          </div>
        )}

        {/* ===== TOAST ===== */}
        <Toast message={toast} className="bottom-24 shadow-lg pointer-events-none" />

        {/* ===== PANEL BEHAVIOR LOG ===== */}
        {showLogPanel && (
          <LogPanelLive
            useLogs={useLogs}
            onClose={() => setShowLogPanel(false)}
            badge="Dummy Telemetry"
            title="Behavior Log"
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

