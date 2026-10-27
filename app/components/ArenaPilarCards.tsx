import { memo } from 'react';
import type { Question } from '../arena/data';
import { Latex, PilarText } from './ui';

/** Kartu Pembahasan 5 Pilar yang dipakai bersama di Mobile (inline) dan Desktop (modal lebar). */
export const ArenaPilarCards = memo(function ArenaPilarCards({ q }: { q: Question }) {
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
