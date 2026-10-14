'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { QUESTIONS, formatKunci, getMapel, type Question } from '../arena/data';
import { LogCounter, LogPanel, NeoBtn, useBehaviorLog } from '../components/ui';
import { dbRowToQuestion, getSoal } from '../../lib/soal';

/* ================= Sheet Bedah Soal ================= */

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
      className="absolute inset-0 z-50 bg-black/50 flex flex-col justify-end"
      onClick={onClose}
      role="dialog"
      aria-label={`Bedah Soal ${q.nomor}`}
    >
      <div
        className="bg-[#FAFAF7] border-t-2 border-[#111] rounded-t-3xl max-h-[88%] flex flex-col overflow-hidden"
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
              <div className="border-2 border-[#111] rounded-xl overflow-hidden">
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
                        {st.text}
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
              <div className="space-y-2">
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
                      <span className="flex-1">{opt.text}</span>
                      {kunci && <span className="text-xs font-extrabold">✓ Kunci</span>}
                    </div>
                  );
                })}
              </div>
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
              <b>Inti Logika:</b> {q.ringkas}
            </p>
            {pilarOpen && (
              <div className="mt-3 space-y-3 border-t-2 border-dashed border-neutral-300 pt-3">
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
                  <div className="font-extrabold text-[#111] uppercase text-[10px]">
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
          setQuestions(rows.map(dbRowToQuestion));
        }
      } catch {
        // fallback ke dummy, tidak blank
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mapelKey, paket]);

  const total = Number.isFinite(totalParam) && totalParam > 0 ? totalParam : questions.length;
  const benar = Number.isFinite(benarParam) && benarParam >= 0 ? Math.min(benarParam, total) : 0;
  // Dummy: 1 salah (kalau ada sisa), sisanya kosong
  const salah = total - benar > 0 ? 1 : 0;
  const kosong = Math.max(0, total - benar - salah);
  const skor = total > 0 ? Math.round((benar / total) * 100) : 0;

  const mapel = getMapel(mapelKey);
  const mapelName = mapel ? mapel.name : 'Matematika (Wajib)';

  /* ---------- state ---------- */
  const [strategiOpen, setStrategiOpen] = useState(false);
  const [bedahIdx, setBedahIdx] = useState<number | null>(null);
  const { logs, logEvent, showLogPanel, setShowLogPanel } = useBehaviorLog('hasil');

  /* ---------- status per soal (dummy) ---------- */
  const statusPerSoal: ('benar' | 'salah' | 'kosong')[] = useMemo(() => {
    return questions.map((_, i) => {
      if (i < benar) return 'benar';
      if (i === benar && salah > 0) return 'salah';
      return 'kosong';
    });
  }, [questions, benar, salah]);

  const openStrategi = useCallback(() => {
    setStrategiOpen(true);
    logEvent('strategy_modal_open', { pola: 'terburu-buru' });
  }, [logEvent]);

  /* ================= render ================= */

  return (
    <div className="min-h-dvh bg-[#18181B] flex justify-center">
      <div className="relative w-full max-w-[430px] min-h-dvh bg-[#FAFAF7] flex flex-col sm:border-x-2 sm:border-[#111] overflow-hidden">
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
            <LogCounter count={logs.length} onClick={() => setShowLogPanel((v) => !v)} />
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

            <div className="space-y-3">
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
                    setBedahIdx(1);
                    logEvent('autopsi_bedah_soal', { soal_no: 2 });
                  }}
                  className="flex-1 bg-[#B6FF00] py-2 px-3 rounded-xl text-xs"
                >
                  🎯 Bedah Soal #2
                </NeoBtn>
              </div>
            </div>

            </div>

            {/* Daftar bedah soal */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-neutral-500 mb-2">
                Bedah Soal per Nomor
              </h4>
              <div className="space-y-2 lg:grid-cols-3">
                {questions.map((q, i) => {
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
                        setBedahIdx(i);
                        logEvent('autopsi_jump_to_review', { soal_no: q.nomor });
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
          <LogPanel
            logs={logs}
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
          <div className="w-full max-w-[430px] min-h-dvh bg-[#FAFAF7] flex items-center justify-center">
            <p className="text-sm font-bold">Memuat hasil…</p>
          </div>
        </div>
      }
    >
      <HasilContent />
    </Suspense>
  );
}
