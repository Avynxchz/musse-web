// Fetch soal asli dari Supabase + konversi ke format Question arena.
// Dibuat untuk migrasi 10%: semua mapel, 5 soal per paket.

import { createClient } from '@supabase/supabase-js';
import type { Question, TipeSoal } from '../app/arena/data';

const supabase = createClient(
  'https://auhqgzrrgvjbfvzvayzg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1aHFnenJyZ3ZqYmZ2enZheXpnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEyNzUwNDgsImV4cCI6MjEwNjg1MTA0OH0.lthMo0A1QcAGOnp4NJ65-FDsP7yOCpA-OikA-Ei1gqY'
);

/** Format baris tabel `soal` di Supabase */
export interface SoalRow {
  id: string;
  mapel: string;
  mapel_nama: string;
  paket: number;
  nomor: number;
  tipe: string;
  stimulus: { text: string; html: string; images: string[] } | null;
  pertanyaan: { text: string; html: string; images: string[] };
  pilihan: Array<{ key: string; text: string; latex: string | null; image: unknown }> | null;
  pernyataan: Array<{ key: string; text: string }> | null;
  kunci: string | string[];
  pembahasan: {
    diketahui?: string;
    ditanyakan?: string;
    reasoning?: string;
    steps?: string[];
    tips?: string;
    why_correct?: string;
    common_mistakes?: string;
  } | null;
  soal_serupa: {
    pertanyaan?: string;
    pilihan?: Array<{ key: string; text: string }>;
    kunci?: string;
    pembahasan?: string;
    pembahasan_singkat?: string;
    pembahasan_serupa?: string;
  } | null;
}

/** Ambil soal dari Supabase berdasarkan mapel + paket, urut nomor */
export async function getSoal(mapel: string, paket: number): Promise<SoalRow[]> {
  const { data, error } = await supabase
    .from('soal')
    .select('*')
    .eq('mapel', mapel)
    .eq('paket', paket)
    .order('nomor');
  if (error) throw error;
  return (data ?? []) as SoalRow[];
}

/** Parse kunci format "A:Benar" menjadi {A: 'Benar'} + daftar label unik */
function parseKunciLabel(kunci: string[]): { map: Record<string, string>; labels: string[] } {
  const map: Record<string, string> = {};
  const labelSet: string[] = [];
  for (const k of kunci) {
    const idx = k.indexOf(':');
    if (idx === -1) continue;
    const key = k.slice(0, idx).trim();
    const label = k.slice(idx + 1).trim();
    map[key] = label;
    if (!labelSet.includes(label)) labelSet.push(label);
  }
  return { map, labels: labelSet };
}

/** Strip tag HTML sederhana untuk fallback teks */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Konversi 1 baris DB → format Question yang dipakai arena */
export function dbRowToQuestion(row: SoalRow): Question {
  const tipe = row.tipe as TipeSoal;

  // Stimulus: pakai text, fallback ke html yang di-strip
  const stimulus = row.stimulus?.text?.trim()
    ? row.stimulus.text.trim()
    : row.stimulus?.html
      ? stripHtml(row.stimulus.html)
      : '';

  // Prompt: pertanyaan.text, fallback ke html
  const prompt = row.pertanyaan?.text?.trim()
    ? row.pertanyaan.text.trim()
    : row.pertanyaan?.html
      ? stripHtml(row.pertanyaan.html)
      : '';

  // Topik: dari mapel_nama (contoh: "Matematika (Wajib)")
  const topik = row.mapel_nama ?? row.mapel;

  // Opsi PG: gabung text + latex jika text kosong
  const options = (row.pilihan ?? []).map((p) => ({
    key: p.key,
    text: p.text?.trim() ? p.text.trim() : p.latex ? `$${p.latex}$` : p.key,
  }));

  // Pernyataan untuk Benar-Salah / Matriks / Pernyataan-Label
  const statements = (row.pernyataan ?? []).map((s) => ({
    key: s.key,
    text: s.text,
  }));

  // Kunci + labelOptions
  let kunci: Question['kunci'] = '';
  let labelOptions: string[] | undefined;
  if (tipe === 'Pilihan Ganda') {
    kunci = typeof row.kunci === 'string' ? row.kunci : '';
  } else if (tipe === 'Pilihan Ganda Kompleks') {
    kunci = Array.isArray(row.kunci) ? row.kunci : [];
  } else {
    // Benar-Salah, Matriks, Pernyataan-Label: kunci = ["A:Label", ...]
    const arr = Array.isArray(row.kunci) ? row.kunci : [];
    const { map, labels } = parseKunciLabel(arr);
    kunci = map;
    // Untuk Benar-Salah, label default Benar/Salah (jangan tampilkan dari DB jika sudah standar)
    if (tipe !== 'Benar-Salah') {
      labelOptions = labels;
    }
  }

  // Pembahasan → format 5 pilar
  const p = row.pembahasan ?? {};
  const diketahui = (p.diketahui ?? '').trim();
  const ditanyakan = (p.ditanyakan ?? '').trim();
  const ringkas = (p.why_correct ?? p.reasoning ?? '').trim().slice(0, 300);
  const pilar1 = [diketahui, ditanyakan].filter(Boolean).join(' ').trim() || topik;
  const pilar3 = (p.reasoning ?? '').trim();
  const pilar4 = Array.isArray(p.steps) ? p.steps : [];
  const pilar5 = (p.tips ?? '').trim();

  // Soal serupa
  const ss = row.soal_serupa ?? {};
  const ssPilihan = Array.isArray(ss.pilihan) ? ss.pilihan : [];
  const ssKunci = typeof ss.kunci === 'string' ? ss.kunci.trim() : '';
  const ssAnsIdx = Math.max(
    0,
    ssPilihan.findIndex((o) => o.key === ssKunci)
  );
  const similar = {
    q: (ss.pertanyaan ?? '').trim() || 'Soal serupa belum tersedia.',
    opts: ssPilihan.map((o) => `${o.key}. ${o.text}`),
    ans: ssAnsIdx,
    exp: (ss.pembahasan ?? ss.pembahasan_singkat ?? ss.pembahasan_serupa ?? '').trim(),
  };

  return {
    nomor: row.nomor,
    tipe,
    topik,
    stimulus,
    prompt,
    options: options.length > 0 ? options : undefined,
    statements: statements.length > 0 ? statements : undefined,
    labelOptions,
    kunci,
    ringkas,
    pilar1,
    pilar3,
    pilar4,
    pilar5,
    similar,
  };
}
