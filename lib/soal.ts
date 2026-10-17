// Fetch soal asli dari Supabase STORAGE (per-paket JSON), bukan PostgREST.
// Alasan: payload JSONB pembahasan terlalu besar untuk PostgREST (koneksi diputus).
// Storage file-based jauh lebih reliable untuk data statis seperti soal.
// Dibuat untuk migrasi 10%: semua mapel, 5 soal per paket.

import type { Question, TipeSoal } from '../app/arena/data';

const SUPABASE_URL = 'https://auhqgzrrgvjbfvzvayzg.supabase.co';

/** Format 1 soal di file JSON Storage (sama dengan baris tabel `soal`) */
export interface SoalRow {
  id: string;
  mapel: string;
  mapel_nama: string;
  paket: number;
  nomor: number;
  tipe: string;
  stimulus: { text: string; html: string; images: Array<{ filename: string }> } | null;
  pertanyaan: { text: string; html: string; images: Array<{ filename: string }> };
  pilihan: Array<{ key: string; text: string; latex: string | null; image: { filename: string } | null }> | null;
  pernyataan: Array<{ key: string; text: string }> | null;
  kunci: string | string[];
  pembahasan: {
    diketahui?: string;
    ditanyakan?: string;
    reasoning?: string;
    steps?: Array<string | { step?: number; title?: string; explanation?: string }>;
    tips?: string | string[];
    why_correct?: string;
    common_mistakes?: string | string[];
    concept_kunci?: string[];
    concept_tags?: string[];
    glossary?: Array<{ term?: string; meaning?: string }>;
    difficulty?: string;
    estimated_time_seconds?: number;
  } | null;
  soal_serupa: {
    pertanyaan?: string;
    pilihan?: Array<{ key: string; text: string }>;
    kunci?: string;
    pembahasan?: string;
    pembahasan_singkat?: string;
    pembahasan_serupa?: string;
  } | null;
  gambar_url?: string[]; // legacy (gabungan) — dipertahankan untuk kompatibilitas
  stimulus_url?: string[];
  pertanyaan_url?: string[];
}

// Mapping key katalog Next.js -> nilai `mapel` di nama file Storage
const MAPEL_DB_MAP: Record<string, string> = {
  matematika: 'matematika',
  indonesia: 'bahasa_indonesia',
  inggris: 'bahasa_inggris',
  fisika: 'fisika',
  kimia: 'kimia',
  biologi: 'biologi',
  ekonomi: 'ekonomi',
  sosiologi: 'sosiologi',
  tkj: 'teknik_jaringan',
  tkr: 'teknik_otomotif',
  jepang: 'bahasa_jepang',
  akuntansi: 'akuntansi',
  antropologi: 'antropologi',
  arab: 'bahasa_arab',
  indonesia_lanjut: 'bahasa_indonesia_lanjut',
  inggris_lanjut: 'bahasa_inggris_lanjut',
  jerman: 'bahasa_jerman',
  korea: 'bahasa_korea',
  mandarin: 'bahasa_mandarin',
  prancis: 'bahasa_prancis',
  geografi: 'geografi',
  kewirausahaan: 'kewirausahaan',
  mp: 'manajemen_perkantoran',
  matlanjut: 'matematika_lanjut',
  ppkn: 'ppkn',
  sejarah: 'sejarah',
  mesin: 'teknik_mesin',
};

/** Ambil soal dari Supabase Storage: 1 file JSON per (mapel, paket), sudah lengkap dengan pembahasan */
export async function getSoal(mapel: string, paket: number): Promise<SoalRow[]> {
  const dbMapel = MAPEL_DB_MAP[mapel] ?? mapel;
  const url = `${SUPABASE_URL}/storage/v1/object/public/soal/${dbMapel}_paket_${paket}.json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Gagal memuat soal (${res.status}): ${dbMapel} paket ${paket}`);
  }
  const rows = (await res.json()) as SoalRow[];
  // Pastikan urut nomor
  rows.sort((a, b) => a.nomor - b.nomor);
  return rows;
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

/**
 * Ganti src gambar lama di HTML soal → URL Supabase Storage (bucket soal-images).
 * Menangani varian: /tka/cbt_images/x.png, images/x.png, ./images/x.png,
 * dan URL absolut lama yang mengandung /tka/cbt_images/ atau /images/.
 * Seperti app lama: gambar dibiarkan inline di dalam HTML (tidak dipisah).
 */
export function renderHtmlWithImages(html: string, mapelDb: string, paket: number): string {
  if (!html) return html;
  const prefix = `${SUPABASE_URL}/storage/v1/object/public/soal-images/${mapelDb}_paket_${paket}/`;
  return html.replace(
    /src=(["'])(?:https?:\/\/[^"']*)?(?:\/tka\/cbt_images\/|(?:\.\/)?images\/)([^"'/]+\.(?:png|jpe?g|gif|webp|svg))\1/gi,
    (_m, quote: string, filename: string) => `src=${quote}${prefix}${filename}${quote}`
  );
}

/** Konversi 1 baris soal → format Question yang dipakai arena */
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

  // Opsi PG: gabung text + latex jika text kosong; sertakan image_url per opsi
  const imgPrefix = `${SUPABASE_URL}/storage/v1/object/public/soal-images/${row.mapel}_paket_${row.paket}/`;
  const toImgUrl = (fn: string | undefined | null) =>
    fn && !/logo|loader/i.test(fn) ? imgPrefix + fn : undefined;
  const options = (row.pilihan ?? []).map((p) => ({
    key: p.key,
    text: p.text?.trim() ? p.text.trim() : p.latex ? `$${p.latex}$` : p.key,
    image_url: toImgUrl(p.image?.filename),
  }));

  // Gambar stimulus & pertanyaan (dipisah, seperti app lama)
  const stimulus_url = (row.stimulus?.images ?? [])
    .map((img) => toImgUrl(img?.filename))
    .filter((u): u is string => !!u);
  const pertanyaan_url = (row.pertanyaan?.images ?? [])
    .map((img) => toImgUrl(img?.filename))
    .filter((u): u is string => !!u);

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
  const pilar4 = Array.isArray(p.steps)
    ? p.steps.map((s: any) =>
        typeof s === 'string' ? s : `${s.title ?? ''}${s.explanation ? ': ' + s.explanation : ''}`.trim()
      ).filter(Boolean)
    : [];
  const pilar5 = Array.isArray(p.tips) ? p.tips.join(' ').trim() : String(p.tips ?? '').trim();

  // Field terstruktur untuk layout 5 pilar ala app lama
  const conceptKunci = Array.isArray(p.concept_kunci)
    ? p.concept_kunci.map((c) => String(c ?? '').trim()).filter(Boolean)
    : [];
  const glossary = Array.isArray(p.glossary)
    ? p.glossary
        .map((g) => ({
          term: String(g?.term ?? '').trim(),
          meaning: String(g?.meaning ?? '').trim(),
        }))
        .filter((g) => g.term || g.meaning)
    : [];
  const commonMistakes = Array.isArray(p.common_mistakes)
    ? p.common_mistakes.map((c) => String(c ?? '').trim()).filter(Boolean)
    : p.common_mistakes
      ? [String(p.common_mistakes).trim()].filter(Boolean)
      : [];
  const stepsDetailed = Array.isArray(p.steps)
    ? p.steps.map((s) =>
        typeof s === 'string'
          ? { title: '', explanation: s }
          : { title: String(s?.title ?? '').trim(), explanation: String(s?.explanation ?? '').trim() }
      )
    : [];

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
    id: row.id,
    nomor: row.nomor,
    tipe,
    topik,
    stimulus,
    // HTML mentah (dengan <img> inline seperti app lama) — URL gambar sudah diganti ke Supabase
    stimulusHtml: row.stimulus?.html ? renderHtmlWithImages(row.stimulus.html, row.mapel, row.paket) : undefined,
    pertanyaanHtml: row.pertanyaan?.html ? renderHtmlWithImages(row.pertanyaan.html, row.mapel, row.paket) : undefined,
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
    diketahui: diketahui || undefined,
    ditanyakan: ditanyakan || undefined,
    conceptKunci: conceptKunci.length ? conceptKunci : undefined,
    glossary: glossary.length ? glossary : undefined,
    commonMistakes: commonMistakes.length ? commonMistakes : undefined,
    stepsDetailed: stepsDetailed.length ? stepsDetailed : undefined,
    gambar_url: Array.isArray(row.gambar_url) && row.gambar_url.length ? row.gambar_url : undefined,
    stimulus_url: stimulus_url.length ? stimulus_url : undefined,
    pertanyaan_url: pertanyaan_url.length ? pertanyaan_url : undefined,
    similar,
  };
}
