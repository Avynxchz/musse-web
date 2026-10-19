'use client';

import { Suspense, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QUESTIONS, formatKunci, getMapel, type Question, type Statement } from '../arena/data';
import { Latex, LogCounterLive, LogPanelLive, NeoBtn, PilarText, useBehaviorLog } from '../components/ui';
import { dbRowToQuestion, getSoal } from '../../lib/soal';
import { analyzeLearningPattern, getLastAttempt } from '../../lib/analisis';

/* ================= Sheet Bedah Soal ================= */

// Render isi pernyataan persis app lama (tanpa lightbox di halaman hasil):
// 1) HTML resmi CBT bila ada, 2) gambar + teks — gambar di depan bila teks
//    diawali kata kerja ("merupakan…", "adalah…", dst), 3) teks saja.
const STMT_IMG_FIRST_RE = /^(merupakan|adalah|sama dengan|lebih|kurang|termasuk)\b/i;
const StatementBodyHasil = memo(function StatementBodyHasil({ st }: { st: Statement }) {
  if (st.html) {
    return <span className="opsi-html" dangerouslySetInnerHTML={{ __html: st.html }} />;
  }
  const txt = (st.text || '').trim();
  const imgEl = st.image_url ? (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={st.image_url}
      alt={`Pernyataan ${st.key}`}
      className="bs-stmt-img"
      loading="lazy"
    />
  ) : null;
  if (!txt) return <>{imgEl}</>;
  if (!imgEl) return <span>{txt}</span>;
  return STMT_IMG_FIRST_RE.test(txt) ? (
    <>{imgEl}<span> {txt}</span></>
  ) : (
    <><span>{txt} </span>{imgEl}</>
  );
});

function BedahSoalSheet({
  q,
  onClose,
  logEvent,
}: {
  q: Question;
  onClose: () => void;
  logEvent: (event: string, payload: Record<string, unknown>) => void;
}) {
  const [pilarOpen, setPilarOpen] = useState(false);
  const [similarOpen, setSimilarOpen] = useState(false);
  const [similarPick, setSimilarPick] = useState<number | null>(null);
  const opsiRef = useRef<HTMLDivElement>(null);
  const stmtRef = useRef<HTMLDivElement>(null);

  // Klasifikasi gambar opsi & pernyataan seperti app lama: rumus (data-latex) atau
  // kecil (height <=65px) -> opt-math-img (sebaris teks); besar -> opt-diagram-img (blok)
  useEffect(() => {
    const containers = [opsiRef.current, stmtRef.current];
    const cleanups: Array<() => void> = [];
    containers.forEach((container) => {
      if (!container) return;
      Array.from(container.querySelectorAll('.opsi-html img')).forEach((img) => {
        const el = img as HTMLImageElement;
        const classify = () => {
          const isFormula = el.hasAttribute('data-latex') || (el.naturalHeight > 0 && el.naturalHeight <= 65);
          el.classList.add(isFormula ? 'opt-math-img' : 'opt-diagram-img');
        };
        if (el.complete && el.naturalHeight > 0) {
          classify();
        } else {
          const onLoad = () => classify();
          el.addEventListener('load', onLoad);
          cleanups.push(() => el.removeEventListener('load', onLoad));
        }
      });
    });
    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [q]);

  const isKunciOpt = (key: string) =>
    typeof q.kunci === 'string'
      ? q.kunci === key
      : Array.isArray(q.kunci)
        ? q.kunci.includes(key)
        : false;

  const pickSimilar = (i: number) => {
    setSimilarPick(i);
    logEvent('bedah_similar_answer', { soal_no: q.nomor, correct: i === q.similar.ans });
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex flex-col justify-end md:items-center md:justify-center md:p-6"
      onClick={onClose}
      role="dialog"
      aria-label={`Bedah Soal ${q.nomor}`}
    >
      <div
        className="bg-[#FAFAF7] border-t-2 md:border-2 border-[#111] rounded-t-3xl md:rounded-3xl md:shadow-[0_6px_0_#111] md:w-full md:max-w-3xl max-h-[88%] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* header */}
        <div className="bg-white border-b-2 border-[#111] px-4 py-3 flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-sm font-extrabold">Bedah Soal #{q.nomor}</h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="bg-[#E0E7FF] border border-[#111] px-2 py-0.5 rounded-full text-[10px] font-extrabold">
                {q.tipe}
              </span>
              <span className="bg-white border border-[#111] px-2 py-0.5 rounded-full text-[10px] font-bold text-neutral-600">
                {q.topik}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="border-2 border-[#111] shadow-[0_3px_0_#111] w-7 h-7 rounded-lg bg-white font-extrabold text-xs"
            aria-label="Tutup bedah soal"
          >
            ✕
          </button>
        </div>

        {/* body scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          {/* kartu soal */}
          <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-4 bg-white space-y-3">
            {q.stimulus && (
              <div className="bg-[#FAFAF7] border-2 border-dashed border-neutral-300 rounded-xl p-3 text-xs leading-relaxed">
                {q.stimulus}
              </div>
            )}
            <p className="font-semibold text-[#111] leading-relaxed">{q.prompt}</p>

            {/* opsi jawaban — kunci ditandai lime */}
            {(q.tipe === 'Benar-Salah' || q.tipe === 'Matriks' || q.tipe === 'Pernyataan-Label') && q.statements ? (
              <div className="border-2 border-[#111] rounded-xl overflow-hidden" ref={stmtRef}>
                <div className="bg-[#111] text-white font-extrabold px-3 py-2 flex justify-between">
                  <span>Pernyataan</span>
                  <span className="w-28 text-center">Kunci</span>
                </div>
                {q.statements.map((st) => {
                  const kunciMap = q.kunci as Record<string, string>;
                  const benar = kunciMap[st.key];
                  const labels: string[] =
                    q.tipe === 'Benar-Salah' ? ['Benar', 'Salah'] : (q.labelOptions ?? Object.values(kunciMap));
                  return (
                    <div
                      key={st.key}
                      className="p-3 border-t border-neutral-200 flex items-center justify-between gap-2 bg-white"
                    >
                      <div className="flex-1">
                        <b className="mr-1">{st.key}.</b>
                        <StatementBodyHasil st={st} />
                      </div>
                      <div className="flex gap-1 shrink-0 flex-wrap justify-end">
                        {labels.map((v) => (
                          <span
                            key={v}
                            className={`px-2.5 py-1 rounded-lg font-extrabold text-[11px] border-2 border-[#111] ${
                              benar === v ? 'bg-[#B6FF00]' : 'bg-neutral-100 text-neutral-500'
                            }`}
                          >
                            {benar === v ? '✓ ' : ''}
                            {v}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
              <style>{`
                .opsi-html { display: inline; }
                .opsi-html p { margin: 0; display: inline; }
                .opsi-html img.opt-math-img { display: inline-block; margin: 0 3px; padding: 0 2px; max-height: 3.2em; width: auto; vertical-align: middle; border: none; background: transparent; object-fit: contain; }
                .opsi-html img.opt-diagram-img { display: block; margin: 6px 0; max-width: 100%; max-height: 280px; width: auto; height: auto; object-fit: contain; border-radius: 8px; border: 1px solid #e5e5e5; background: #ffffff; padding: 6px; }
                /* Gambar dalam pernyataan (persis app lama: kecil inline sebaris teks) */
                .bs-stmt-img { max-width: 100%; max-height: 48px; width: auto; height: auto; vertical-align: middle; object-fit: contain; }
              `}</style>
              <div className="space-y-2" ref={opsiRef}>
                {q.options?.map((opt) => {
                  const kunci = isKunciOpt(opt.key);
                  return (
                    <div
                      key={opt.key}
                      className={`border-2 border-[#111] p-3 rounded-xl flex items-center gap-3 font-bold ${
                        kunci ? 'bg-[#B6FF00]' : 'bg-white'
                      }`}
                    >
                      <span className="w-6 h-6 rounded-full border-2 border-[#111] bg-white flex items-center justify-center font-extrabold text-[11px] shrink-0">
                        {opt.key}
                      </span>
                      {opt.html ? (
                        <span className="flex-1 opsi-html" dangerouslySetInnerHTML={{ __html: opt.html }} />
                      ) : (
                        <span className="flex-1"><Latex text={opt.text} /></span>
                      )}
                      {kunci && <span className="text-xs font-extrabold">✓ Kunci</span>}
                    </div>
                  );
                })}
              </div>
              </>
            )}
          </div>

          {/* kartu pembahasan */}
          <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-4 bg-white">
            <div className="flex items-center justify-between border-b-2 border-[#111] pb-2.5">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider bg-[#B6FF00] border border-[#111] px-2 py-0.5 rounded">
                  Kunci Resmi Pusmendik
                </span>
                <h4 className="text-sm font-extrabold mt-1">Kunci Jawaban: {formatKunci(q)}</h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPilarOpen((v) => !v);
                  logEvent('bedah_pembahasan_toggle', {
                    soal_no: q.nomor,
                    mode: pilarOpen ? 'ringkas' : 'lengkap',
                  });
                }}
                className="border-2 border-[#111] shadow-[0_3px_0_#111] bg-[#E0E7FF] px-3 py-1 rounded-full text-[11px] font-extrabold shrink-0"
              >
                {pilarOpen ? '🔼 Ciutkan ke Ringkas' : '📖 Buka 5 Pilar'}
              </button>
            </div>
            <p className="mt-3 leading-relaxed text-neutral-800">
              <b>Inti Logika:</b>
            </p>
            <PilarText text={q.ringkas} className="mt-1 leading-relaxed text-neutral-800" />
            {pilarOpen && (
              <div className="mt-3 space-y-3 border-t-2 border-dashed border-neutral-300 pt-3">
                <div className="bg-[#FAFAF7] border border-[#111] rounded-xl p-3">
                  <div className="font-extrabold text-[#4F46E5] uppercase text-[10px]">
                    Pilar 1 · Diketahui & Konsep Kunci
                  </div>
                  <PilarText text={q.pilar1} className="mt-1 font-medium" />
                </div>
                <div className="bg-[#FAFAF7] border border-[#111] rounded-xl p-3">
                  <div className="font-extrabold text-[#4F46E5] uppercase text-[10px]">
                    Pilar 2 & 3 · Glosarium & Alasan Logis
                  </div>
                  <PilarText text={q.pilar3} className="mt-1 font-medium" />
                </div>
                <div className="bg-[#F0FFB8] border border-[#111] rounded-xl p-3">
                  <div className="font-extrabold text-[#111] uppercase text-[10px]">
                    Pilar 4 · Langkah Penyelesaian Rinci
                  </div>
                  <ol className="mt-1.5 space-y-1.5 list-decimal list-inside font-semibold">
                    {(q.pilar4 ?? []).map((s, i) => (
                      <li key={i}><Latex text={s} /></li>
                    ))}
                  </ol>
                </div>
                <div className="bg-[#FFEDD5] border border-[#111] rounded-xl p-3">
                  <div className="font-extrabold text-amber-900 uppercase text-[10px]">
                    Pilar 5 · Trik Cepat & Jebakan Umum
                  </div>
                  <PilarText text={q.pilar5} className="mt-1 font-medium" />
                </div>
              </div>
            )}
            <div className="mt-4 pt-3 border-t border-neutral-200">
              <button
                type="button"
                onClick={() => {
                  setSimilarOpen((v) => !v);
                  if (!similarOpen) logEvent('bedah_similar_open', { soal_no: q.nomor });
                }}
                className="border-2 border-[#111] shadow-[0_3px_0_#111] bg-[#B6FF00] text-[#111] py-2 px-3 rounded-xl text-xs font-extrabold"
              >
                🔄 Soal Serupa
              </button>
            </div>
          </div>

          {/* kartu soal serupa interaktif */}
          {similarOpen && (
            <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-4 bg-[#E0E7FF]">
              <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white border border-[#111] px-2 py-0.5 rounded">
                Uji Paham · Soal Serupa
              </span>
              <p className="text-xs font-bold mt-2">{q.similar.q}</p>
              <div className="mt-2.5 space-y-1.5">
                {q.similar.opts.map((o, i) => {
                  const picked = similarPick === i;
                  const benar = i === q.similar.ans;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => pickSimilar(i)}
                      disabled={similarPick !== null}
                      className={`border-2 border-[#111] w-full px-3 py-2 rounded-xl text-left text-xs font-bold block transition-all ${
                        similarPick === null
                          ? 'bg-white hover:bg-[#B6FF00]'
                          : picked && benar
                            ? 'bg-[#B6FF00]'
                            : picked
                              ? 'bg-red-200'
                              : benar
                                ? 'bg-[#B6FF00]'
                                : 'bg-white opacity-60'
                      } ${similarPick !== null ? '' : 'shadow-[0_3px_0_#111] active:translate-y-[2px] active:shadow-[0_1px_0_#111]'}`}
                    >
                      {o}
                    </button>
                  );
                })}
              </div>
              {similarPick !== null && (
                <div className="mt-2.5 p-2.5 rounded-xl border border-[#111] bg-white text-xs font-bold">
                  {similarPick === q.similar.ans ? '✅ ' : '❌ '}
                  {q.similar.exp}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
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
  const salahParam = parseInt(searchParams.get('salah') || '', 10);
  const kosongParam = parseInt(searchParams.get('kosong') || '', 10);
  const totalParam = parseInt(searchParams.get('total') || '', 10);
  const autoSubmit = searchParams.get('autosubmit') === '1';

  // Soal dari Supabase (fallback ke dummy)
  const [questions, setQuestions] = useState<Question[]>(QUESTIONS);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const rows = await getSoal(mapelKey, paket);
        if (!cancelled && rows.length > 0) {
          const parsed: Question[] = [];
          for (const row of rows) {
            try {
              parsed.push(dbRowToQuestion(row));
            } catch {
              /* skip soal rusak */
            }
          }
          if (parsed.length > 0) setQuestions(parsed);
        }
      } catch {
        // fallback ke dummy, tidak blank
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mapelKey, paket]);

  // Baca attempt terakhir yang cocok dengan mapel + paket ini
  const [lastAttempt, setLastAttempt] = useState(() => getLastAttempt());
  useEffect(() => {
    setLastAttempt(getLastAttempt());
  }, [mapelKey, paket]);

  const matchedAttempt = useMemo(() => {
    if (!lastAttempt) return null;
    const attemptPaket = Number(lastAttempt.paket) === 2 ? 2 : 1;
    if (lastAttempt.mapel !== mapelKey || attemptPaket !== paket) return null;
    return lastAttempt;
  }, [lastAttempt, mapelKey, paket]);

  const total =
    matchedAttempt && matchedAttempt.perSoal.length > 0
      ? matchedAttempt.total || matchedAttempt.perSoal.length
      : Number.isFinite(totalParam) && totalParam > 0
        ? totalParam
        : questions.length;
  const benar =
    matchedAttempt && matchedAttempt.perSoal.length > 0
      ? matchedAttempt.perSoal.filter((s) => s.status === 'benar').length
      : Number.isFinite(benarParam) && benarParam >= 0
        ? Math.min(benarParam, total)
        : 0;
  const salah =
    matchedAttempt && matchedAttempt.perSoal.length > 0
      ? matchedAttempt.perSoal.filter((s) => s.status === 'salah').length
      : Number.isFinite(salahParam) && salahParam >= 0
        ? Math.min(salahParam, total - benar)
        : 0;
  const kosong =
    matchedAttempt && matchedAttempt.perSoal.length > 0
      ? matchedAttempt.perSoal.filter((s) => s.status === 'kosong').length
      : Number.isFinite(kosongParam) && kosongParam >= 0
        ? Math.min(kosongParam, total - benar - salah)
        : Math.max(0, total - benar - salah);
  const skor = total > 0 ? Math.round((benar / total) * 100) : 0;

  const mapel = getMapel(mapelKey);
  const mapelName = mapel ? mapel.name : 'Matematika (Wajib)';

  /* ---------- state ---------- */
  const [strategiOpen, setStrategiOpen] = useState(false);
  const [bedahIdx, setBedahIdx] = useState<number | null>(null);
  const { logEvent, useLogCount, useLogs, showLogPanel, setShowLogPanel } = useBehaviorLog('hasil');

  // Page view logging
  useEffect(() => {
    logEvent('page_view', { page: 'hasil' });
  }, []);

  /* ---------- status per soal (real dari attempt, fallback URL params) ---------- */
  const statusPerSoal: ('benar' | 'salah' | 'kosong')[] = useMemo(() => {
    if (matchedAttempt && matchedAttempt.perSoal.length > 0) {
      const byNomor = new Map(matchedAttempt.perSoal.map((ps) => [ps.nomor, ps.status]));
      return questions.map((q, i) => byNomor.get(q.nomor) ?? matchedAttempt.perSoal[i]?.status ?? 'kosong');
    }
    return questions.map((_, i) => {
      if (i < benar) return 'benar';
      if (i < benar + salah) return 'salah';
      return 'kosong';
    });
  }, [questions, matchedAttempt, benar, salah]);

  const openStrategi = useCallback(() => {
    setStrategiOpen(true);
    logEvent('strategy_modal_open', { pola: 'terburu-buru' });
  }, [logEvent]);

  /* ---------- AI #1: Analisis cara belajar (Guru Autopsi) - DATA BENERAN ---------- */
  const analisis = useMemo(() => {
    return analyzeLearningPattern(matchedAttempt);
  }, [matchedAttempt]);

  /* ================= render ================= */

  const pctBenar = total > 0 ? Math.round((benar / total) * 100) : 0;
  const pctSalah = total > 0 ? Math.round((salah / total) * 100) : 0;
  const pctKosong = Math.max(0, 100 - pctBenar - pctSalah);

  return (
    <div className="min-h-dvh bg-[#18181B] flex justify-center">
      <div className="relative w-full max-w-[430px] md:max-w-[1280px] min-h-dvh bg-[#FAFAF7] flex flex-col sm:border-x-2 sm:border-[#111] overflow-hidden md:overflow-visible">
        {/* ===== Header + Toolbar Horizontal Aksi (Desktop) ===== */}
        <header className="bg-white border-b-2 border-[#111] px-4 md:px-6 py-3 md:py-4 flex items-center justify-between gap-3 shrink-0 md:sticky md:top-0 md:z-30">
          <div className="min-w-0">
            <span
              className={`text-[10px] font-extrabold uppercase border border-[#111] px-2 py-0.5 rounded ${
                mode === 'simulasi' ? 'bg-amber-300' : 'bg-[#B6FF00]'
              }`}
            >
              {mode === 'simulasi' ? '⚡ Hasil Simulasi' : '🌱 Hasil Latihan'}
            </span>
            <h2 className="text-base md:text-lg font-extrabold mt-0.5 truncate">
              {mapelName} · Paket {paket}
            </h2>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <LogCounterLive useLogCount={useLogCount} onClick={() => setShowLogPanel((v) => !v)} />
            {/* Toolbar horizontal tombol aksi di desktop: Ulangi, Bedah Soal, Beranda */}
            <NeoBtn
              onClick={() => router.push(`/arena?mapel=${mapelKey}&paket=${paket}&mode=${mode}`)}
              className="hidden md:inline-flex items-center gap-1.5 bg-[#B6FF00] px-3.5 py-2 rounded-xl text-xs"
            >
              <span>🔄</span>
              <span>Ulangi</span>
            </NeoBtn>
            <NeoBtn
              onClick={() => {
                setBedahIdx(0);
                logEvent('autopsi_jump_to_review', { soal_no: questions[0]?.nomor ?? 1 });
              }}
              className="hidden md:inline-flex items-center gap-1.5 bg-[#E0E7FF] px-3.5 py-2 rounded-xl text-xs"
            >
              <span>📖</span>
              <span>Bedah Soal</span>
            </NeoBtn>
            <NeoBtn onClick={() => router.push('/beranda')} className="bg-white px-3 md:px-3.5 py-1.5 md:py-2 rounded-xl text-xs">
              Ke Beranda →
            </NeoBtn>
          </div>
        </header>

        {/* ===== Konten scroll ===== */}
        <div className="flex-1 overflow-y-auto md:overflow-visible p-4 md:p-6 space-y-4 md:space-y-6 pb-8">
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

          {/* ===== DESKTOP 2-COLUMN LAYOUT: Kiri = Skor + Statistik + Ringkasan (40%), Kanan = Guru Autopsi AI + Bedah Soal (60%) ===== */}
          <div className="flex flex-col md:flex-row md:items-start gap-4 md:gap-6">
            {/* ===== KOLOM KIRI (40% di desktop) ===== */}
            <div className="w-full md:w-[40%] md:shrink-0 md:sticky md:top-24 space-y-4">
              {/* ===== Kartu skor ===== */}
              <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-4 md:p-6 bg-[#111] text-white">
                <div className="flex items-center justify-between md:flex-col md:items-stretch md:gap-4">
                  <div className="md:flex md:items-baseline md:justify-between">
                    <p className="text-xs md:text-sm text-white/70 font-semibold">Skor Akhir Kamu</p>
                    <p className="font-mono text-3xl md:text-5xl text-[#B6FF00] mt-1 md:mt-0 font-extrabold">{skor}%</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 md:gap-3 text-center">
                    <div className="bg-white/10 px-2.5 py-1.5 md:py-3 rounded-xl border border-white/20">
                      <p className="text-sm md:text-xl font-extrabold text-[#B6FF00]">{benar}</p>
                      <p className="text-[10px] md:text-xs text-white/70">Benar</p>
                    </div>
                    <div className="bg-white/10 px-2.5 py-1.5 md:py-3 rounded-xl border border-white/20">
                      <p className="text-sm md:text-xl font-extrabold text-red-400">{salah}</p>
                      <p className="text-[10px] md:text-xs text-white/70">Salah</p>
                    </div>
                    <div className="bg-white/10 px-2.5 py-1.5 md:py-3 rounded-xl border border-white/20">
                      <p className="text-sm md:text-xl font-extrabold text-white">{kosong}</p>
                      <p className="text-[10px] md:text-xs text-white/70">Kosong</p>
                    </div>
                  </div>
                </div>

                {/* Grafik proporsi jawaban (Desktop Only - manfaatkan lebar layar) */}
                <div className="hidden md:block mt-5 pt-4 border-t border-white/15 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-white/80">
                    <span>Distribusi Jawaban ({total} Soal)</span>
                    <span className="text-[#B6FF00]">{pctBenar}% Akurasi</span>
                  </div>
                  <div className="w-full h-3.5 bg-white/10 rounded-full overflow-hidden flex border border-white/20">
                    {pctBenar > 0 && (
                      <div
                        className="h-full bg-[#B6FF00]"
                        style={{ width: `${pctBenar}%` }}
                        title={`Benar: ${benar} (${pctBenar}%)`}
                      />
                    )}
                    {pctSalah > 0 && (
                      <div
                        className="h-full bg-red-400"
                        style={{ width: `${pctSalah}%` }}
                        title={`Salah: ${salah} (${pctSalah}%)`}
                      />
                    )}
                    {pctKosong > 0 && (
                      <div
                        className="h-full bg-white/30"
                        style={{ width: `${pctKosong}%` }}
                        title={`Kosong: ${kosong} (${pctKosong}%)`}
                      />
                    )}
                  </div>
                </div>

                <div className="mt-3 md:mt-4 pt-2.5 md:pt-3 border-t border-white/15 flex items-center justify-between text-[11px] md:text-xs text-white/80">
                  <span>{autoSubmit ? '⏰ Auto-Submit (Waktu Habis)' : '🏁 Diselesaikan'}</span>
                  <span>
                    ⚡ Rata-rata: <b>{analisis.adaData ? `${analisis.rataRataDetik} dtk/soal` : '24 dtk/soal'}</b>
                  </span>
                  <span>✓ Tersimpan</span>
                </div>
              </div>

              {/* ===== Kartu Ringkasan & Statistik Detail (Desktop Only) ===== */}
              <div className="hidden md:block border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-5 bg-white space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold">📊 Ringkasan Pengerjaan</h3>
                  <span className="bg-[#FAFAF7] border border-[#111] px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                    {mode === 'simulasi' ? 'Simulasi' : 'Latihan'}
                  </span>
                </div>
                <div className="space-y-2.5 text-xs">
                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span>✓ Jawaban Benar</span>
                      <span>{benar} dari {total} soal ({pctBenar}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden border border-[#111]">
                      <div className="h-full bg-[#B6FF00]" style={{ width: `${pctBenar}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span>✕ Jawaban Salah</span>
                      <span>{salah} dari {total} soal ({pctSalah}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden border border-[#111]">
                      <div className="h-full bg-red-300" style={{ width: `${pctSalah}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-bold mb-1">
                      <span>○ Tidak Dijawab</span>
                      <span>{kosong} dari {total} soal ({pctKosong}%)</span>
                    </div>
                    <div className="w-full h-2.5 bg-neutral-200 rounded-full overflow-hidden border border-[#111]">
                      <div className="h-full bg-neutral-400" style={{ width: `${pctKosong}%` }} />
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-neutral-200 flex gap-2">
                  <NeoBtn
                    onClick={() => router.push(`/arena?mapel=${mapelKey}&paket=${paket}&mode=${mode}`)}
                    className="flex-1 bg-[#B6FF00] py-2.5 px-3 rounded-xl text-xs"
                  >
                    🔄 Ulangi Paket Ini
                  </NeoBtn>
                  <NeoBtn
                    onClick={() => router.push('/ruang')}
                    className="flex-1 bg-[#E0E7FF] py-2.5 px-3 rounded-xl text-xs"
                  >
                    🧠 Buka Ruang AI
                  </NeoBtn>
                </div>
              </div>
            </div>

            {/* ===== KOLOM KANAN (60% di desktop): Guru Autopsi AI + Bedah Soal Grid ===== */}
            <div className="w-full md:w-[60%] md:min-w-0">
              {/* ===== Guru Autopsi AI ===== */}
              <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-4 md:p-6 bg-white space-y-3 md:space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔍</span>
                    <div>
                      <h3 className="text-sm md:text-base font-extrabold">Guru Autopsi AI</h3>
                      <p className="text-[11px] md:text-xs text-neutral-500">
                        Dari ritme waktu, klik opsi & pergantian jawabanmu
                      </p>
                    </div>
                  </div>
                  <span className="bg-[#B6FF00] border border-[#111] px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0">
                    ✨ Analisis AI
                  </span>
                </div>

                <div className="space-y-3">
                {/* Observasi — DATA BENERAN dari attempt terakhir */}
                <div className="bg-[#FAFAF7] border-2 border-[#111] rounded-xl p-3 md:p-4 text-xs space-y-1">
                  <p className="font-extrabold text-[#111]">👀 Yang Saya Lihat:</p>
                  {analisis.adaData && analisis.observasi.length > 0 ? (
                    <ul className="list-disc list-inside text-neutral-700 space-y-1 mt-1">
                      {analisis.observasi.map((o, i) => (
                        <li key={i} dangerouslySetInnerHTML={{ __html: o.html }} />
                      ))}
                    </ul>
                  ) : (
                    <p className="text-neutral-500 mt-1">
                      Belum ada data pengerjaan. Kerjakan soal dulu, nanti aku analisis polamu di sini!
                    </p>
                  )}
                </div>

                {/* Pola terdeteksi — DATA BENERAN dari aturan analisis */}
                {analisis.adaData && analisis.pola.length > 0 ? (
                  analisis.pola.map((p, i) => (
                    <div key={i} className="bg-[#FFFBEB] border-2 border-[#111] rounded-xl p-3.5 md:p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-extrabold uppercase bg-amber-300 border border-[#111] px-2 py-0.5 rounded">
                          {i === 0 ? 'Kebocoran Utama' : `Pola #${i + 1}`}
                        </span>
                        <span className="text-[11px] font-bold text-red-700">Pola: {p.nama}</span>
                      </div>
                      <h4 className="text-sm font-extrabold mt-1.5">{p.judul}</h4>
                      <p className="text-xs text-neutral-700 mt-1">
                        <b>Bukti:</b> {p.bukti}
                      </p>
                      {p.rekomendasi && (
                        <p className="text-xs text-neutral-800 mt-1.5">
                          <b>💡 Rekomendasi Aksi:</b> {p.rekomendasi}
                        </p>
                      )}
                      <div className="mt-3 flex gap-2">
                        <NeoBtn onClick={openStrategi} className="flex-1 bg-white py-2 px-3 rounded-xl text-xs">
                          📚 Pelajari 5 Strategi
                        </NeoBtn>
                        {p.soalContoh !== undefined && (
                          <NeoBtn
                            onClick={() => {
                              // Cari index soal berdasarkan nomor
                              const idx = questions.findIndex((qq) => qq.nomor === p.soalContoh);
                              setBedahIdx(idx >= 0 ? idx : 0);
                              logEvent('autopsi_bedah_soal', { soal_no: p.soalContoh });
                            }}
                            className="flex-1 bg-[#B6FF00] py-2 px-3 rounded-xl text-xs"
                          >
                            🎯 Bedah Soal #{p.soalContoh}
                          </NeoBtn>
                        )}
                      </div>
                    </div>
                  ))
                ) : analisis.adaData ? (
                  <div className="bg-[#F0FDF4] border-2 border-[#111] rounded-xl p-3.5">
                    <p className="text-xs font-bold text-green-800">
                      ✅ Tidak ada pola bermasalah yang terdeteksi. Ritme belajarmu stabil — pertahankan!
                    </p>
                  </div>
                ) : null}

                </div>

                {/* Daftar bedah soal */}
                <div>
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 mb-2">
                    Bedah Soal per Nomor
                  </h4>
                  <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-2.5">
                    {questions.map((q, i) => {
                      const st = statusPerSoal[i];
                      const badge =
                        st === 'benar' ? (
                          <span className="bg-green-100 text-green-800 border border-green-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                            ✓ Benar
                          </span>
                        ) : st === 'salah' ? (
                          <span className="bg-red-100 text-red-800 border border-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                            ✕ Salah
                          </span>
                        ) : (
                          <span className="bg-neutral-100 text-neutral-700 border border-neutral-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0">
                            ○ Kosong
                          </span>
                        );
                      return (
                        <button
                          key={q.nomor}
                          type="button"
                          onClick={() => {
                            setBedahIdx(i);
                            logEvent('autopsi_jump_to_review', { soal_no: q.nomor });
                          }}
                          className="w-full text-left border-2 border-[#111] rounded-xl p-2.5 flex items-center justify-between gap-2 bg-white hover:bg-[#FAFAF7]"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span
                              className={`w-7 h-7 rounded-lg border border-[#111] flex items-center justify-center font-extrabold text-xs shrink-0 ${
                                st === 'benar' ? 'bg-[#B6FF00]' : 'bg-red-200'
                              }`}
                            >
                              {q.nomor}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-extrabold truncate">
                                {q.topik} · {q.tipe}
                              </p>
                              <p className="text-[11px] text-neutral-500 truncate">Klik untuk buka pembahasan →</p>
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
          </div>
        </div>

        {/* ===== Modal strategi ===== */}
        {strategiOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="border-2 border-[#111] shadow-[0_4px_0_#111] rounded-2xl p-5 bg-white w-full md:max-w-lg space-y-3">
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

        {/* ===== Sheet Bedah Soal ===== */}
        {bedahIdx !== null && questions[bedahIdx] && (
          <BedahSoalSheet
            key={questions[bedahIdx].nomor}
            q={questions[bedahIdx]}
            onClose={() => setBedahIdx(null)}
            logEvent={logEvent}
          />
        )}

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
  );
}

/* ================= Page (Suspense boundary untuk useSearchParams) ================= */

export default function HasilPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[#18181B] flex justify-center">
          <div className="w-full max-w-[430px] md:max-w-[1280px] min-h-dvh bg-[#FAFAF7] flex items-center justify-center">
            <p className="text-sm font-bold">Memuat hasil…</p>
          </div>
        </div>
      }
    >
      <HasilContent />
    </Suspense>
  );
}
