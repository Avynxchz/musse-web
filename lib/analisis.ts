/**
 * lib/analisis.ts — Analisis AI beneran dari data quiz user.
 *
 * AI #2 (Guru Autopsi): analisis cara belajar dari 1 attempt terakhir.
 * AI #3 (Ruang AI): analisis kumulatif soal salah per mapel dari history.
 *
 * Data disimpan di localStorage oleh app/arena/page.tsx saat finishQuiz
 * (via saveAttempt):
 * - KEY_LAST_ATTEMPT ('musse_last_attempt'): detail attempt terakhir
 * - KEY_QUIZ_HISTORY ('musse_quiz_history'): array attempt (maks MAX_QUIZ_HISTORY)
 */

// ================= Tipe data =================

export interface PerSoalResult {
  nomor: number;
  tipe: string;
  topik: string;
  status: 'benar' | 'salah' | 'kosong';
  durasiDetik: number;
  gantiJawaban: number;
}

export interface QuizAttempt {
  mapel: string;
  mapelName: string;
  paket: number;
  mode: string;
  tanggal: string;
  benar: number;
  total: number;
  perSoal: PerSoalResult[];
}

// ================= Helper localStorage =================

/** Key penyimpanan — single source of truth (dipakai arena + analisis). */
export const KEY_LAST_ATTEMPT = 'musse_last_attempt';
export const KEY_QUIZ_HISTORY = 'musse_quiz_history';
/** Batas history agar localStorage tidak membengkak. */
export const MAX_QUIZ_HISTORY = 50;

function safeGet<T>(key: string, fallback: T): T {
  try {
    if (typeof window === 'undefined') return fallback;
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function getLastAttempt(): QuizAttempt | null {
  return safeGet<QuizAttempt | null>(KEY_LAST_ATTEMPT, null);
}

export function getQuizHistory(): QuizAttempt[] {
  return safeGet<QuizAttempt[]>(KEY_QUIZ_HISTORY, []);
}

/** Simpan 1 attempt: tulis last_attempt + append ke history (maks MAX_QUIZ_HISTORY).
 *  Dipakai app/arena/page.tsx saat finishQuiz. Aman dipanggil berkali-kali. */
export function saveAttempt(attempt: QuizAttempt): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEY_LAST_ATTEMPT, JSON.stringify(attempt));
    const hist = getQuizHistory();
    hist.push(attempt);
    localStorage.setItem(KEY_QUIZ_HISTORY, JSON.stringify(hist.slice(-MAX_QUIZ_HISTORY)));
  } catch {
    /* abaikan error storage */
  }
}

// ================= AI #2: Analisis cara belajar =================

export interface Observasi {
  html: string; // boleh pakai <b>
}

export interface PolaTerdeteksi {
  nama: string;        // mis. "Terburu-buru"
  judul: string;       // mis. "Terburu-buru di Soal Multi-Pernyataan"
  bukti: string;       // kalimat bukti dari data
  soalContoh?: number; // nomor soal untuk tombol "Bedah Soal"
}

export interface HasilAnalisisBelajar {
  adaData: boolean;
  observasi: Observasi[];
  pola: PolaTerdeteksi[];
  rataRataDetik: number;
}

/** Tipe soal yang dianggap "kompleks" (butuh baca & cek lebih lama). */
const TIPE_KOMPLEKS = ['Pilihan Ganda Kompleks', 'Benar-Salah', 'Matriks', 'Pernyataan-Label'];

export function analyzeLearningPattern(attempt: QuizAttempt | null): HasilAnalisisBelajar {
  if (!attempt || !attempt.perSoal || attempt.perSoal.length === 0) {
    return { adaData: false, observasi: [], pola: [], rataRataDetik: 0 };
  }

  const soal = attempt.perSoal.filter((s) => s.status !== 'kosong');
  const observasi: Observasi[] = [];
  const pola: PolaTerdeteksi[] = [];

  if (soal.length === 0) {
    return { adaData: false, observasi: [], pola: [], rataRataDetik: 0 };
  }

  // --- Observasi per soal (maks 4, prioritaskan yang menarik) ---
  // Urutan prioritas: salah+ganti jawaban > salah > ganti jawaban > cepat benar > lambat
  const scored = soal.map((s) => {
    let skor = 0;
    if (s.status === 'salah') skor += 10;
    if (s.gantiJawaban > 0) skor += 5 + s.gantiJawaban;
    if (s.durasiDetik < 12 && TIPE_KOMPLEKS.includes(s.tipe)) skor += 4;
    if (s.durasiDetik > 120) skor += 3;
    if (s.status === 'benar' && s.durasiDetik < 20) skor += 2;
    return { s, skor };
  });
  scored.sort((a, b) => b.skor - a.skor);

  for (const { s } of scored.slice(0, 4)) {
    const topik = s.topik ? ` (${s.topik})` : '';
    const statusTxt = s.status === 'benar' ? 'benar' : s.status === 'salah' ? 'salah' : 'kosong';
    let detail = '';
    if (s.gantiJawaban > 0) {
      detail = `, sempat ganti jawaban ${s.gantiJawaban}×`;
    } else if (s.status === 'benar' && s.durasiDetik <= 30) {
      detail = ` tanpa ganti opsi`;
    }
    observasi.push({
      html: `Di <b>Soal #${s.nomor}${topik}</b> [${s.tipe}], jawabanmu <b>${statusTxt}</b> dalam ${s.durasiDetik} detik${detail}.`,
    });
  }

  // --- Deteksi pola dari aturan ---
  const totalDurasi = soal.reduce((a, s) => a + s.durasiDetik, 0);
  const rataRata = soal.length > 0 ? Math.round(totalDurasi / soal.length) : 0;

  // Pola 1: Terburu-buru — rata-rata <15 dtk di soal kompleks
  const kompleks = soal.filter((s) => TIPE_KOMPLEKS.includes(s.tipe));
  if (kompleks.length > 0) {
    const avgKompleks = kompleks.reduce((a, s) => a + s.durasiDetik, 0) / kompleks.length;
    if (avgKompleks < 15) {
      const contoh = kompleks.sort((a, b) => a.durasiDetik - b.durasiDetik)[0];
      pola.push({
        nama: 'Terburu-buru',
        judul: 'Terburu-buru di Soal Multi-Pernyataan',
        bukti: `Waktu baca rata-rata ${Math.round(avgKompleks)} detik pada ${kompleks.length} soal ${kompleks[0].tipe} — padahal tipe ini butuh pengecekan lebih dari satu kondisi.`,
        soalContoh: contoh.nomor,
      });
    }
  }

  // Pola 2: Kurang yakin — sering ganti jawaban
  const seringGanti = soal.filter((s) => s.gantiJawaban >= 2);
  if (seringGanti.length >= 2) {
    const contoh = seringGanti[0];
    pola.push({
      nama: 'Kurang yakin',
      judul: 'Sering Ganti Jawaban',
      bukti: `Di ${seringGanti.length} soal kamu ganti jawaban ≥2× — tanda konsep belum nempel kuat, jawaban awal cuma tebakan.`,
      soalContoh: contoh.nomor,
    });
  } else if (soal.filter((s) => s.gantiJawaban === 1).length >= 3) {
    pola.push({
      nama: 'Kurang yakin',
      judul: 'Ragu-ragu Saat Menjawab',
      bukti: `Di ${soal.filter((s) => s.gantiJawaban === 1).length} soal kamu sempat mengganti pilihan 1× — coba baca soal sampai tuntas sebelum pilih.`,
    });
  }

  // Pola 3: Konsep belum nempel — lama di soal tapi tetap salah
  const lamaTapiSalah = soal.filter((s) => s.durasiDetik > 90 && s.status === 'salah');
  if (lamaTapiSalah.length > 0) {
    const topiks = [...new Set(lamaTapiSalah.map((s) => s.topik).filter(Boolean))];
    pola.push({
      nama: 'Konsep belum nempel',
      judul: 'Lama Mengerjakan tapi Tetap Salah',
      bukti: `Di ${lamaTapiSalah.length} soal kamu mikir >90 detik tapi jawabannya salah${topiks.length > 0 ? ` (topik: ${topiks.slice(0, 3).join(', ')})` : ''} — ini sinyal konsep dasarnya yang bolong, bukan kurang teliti.`,
      soalContoh: lamaTapiSalah[0].nomor,
    });
  }

  // Pola 4: Sudah mantap — cepat & benar konsisten
  const cepatBenar = soal.filter((s) => s.status === 'benar' && s.durasiDetik <= 30 && s.gantiJawaban === 0);
  if (cepatBenar.length >= 3 && cepatBenar.length / soal.length >= 0.4) {
    pola.push({
      nama: 'Sudah mantap',
      judul: 'Cepat & Tepat — Pertahankan!',
      bukti: `${cepatBenar.length} soal dijawab benar dalam ≤30 detik tanpa ganti opsi — ritme ini yang bikin skor stabil.`,
    });
  }

  // Pola 5: Topik bermasalah — banyak salah di topik yang sama
  const salahPerTopik: Record<string, number> = {};
  for (const s of soal) {
    if (s.status === 'salah' && s.topik) {
      salahPerTopik[s.topik] = (salahPerTopik[s.topik] || 0) + 1;
    }
  }
  const topikBermasalah = Object.entries(salahPerTopik)
    .filter(([, n]) => n >= 2)
    .sort((a, b) => b[1] - a[1])[0];
  if (topikBermasalah) {
    pola.push({
      nama: 'Topik bolong',
      judul: `Topik "${topikBermasalah[0]}" Perlu Perhatian`,
      bukti: `${topikBermasalah[1]} soal dengan topik ini salah — waktunya bedah konsepnya, bukan cuma latihan soal.`,
    });
  }

  return { adaData: true, observasi, pola, rataRataDetik: rataRata };
}

// ================= AI #3: Analisis kumulatif per mapel =================

export interface StatRuang {
  adaData: boolean;
  totalSoal: number;
  akurasiPct: number;
  jamFokus: string;
  perMapel: Record<string, StatMapel>;
}

export interface StatMapel {
  mapelName: string;
  totalSoal: number;
  akurasiPct: number;
  topikLemah: string[]; // topik dengan salah terbanyak
  topikKuat: string[];  // topik dengan benar terbanyak
  pesanCoach: string;
}

export function analyzeRuangAI(history: QuizAttempt[]): StatRuang {
  if (!history || history.length === 0) {
    return { adaData: false, totalSoal: 0, akurasiPct: 0, jamFokus: '0j', perMapel: {} };
  }

  let totalSoal = 0;
  let totalBenar = 0;
  let totalDetik = 0;
  const perMapel: Record<string, StatMapel> = {};

  for (const att of history) {
    const key = att.mapel;
    if (!perMapel[key]) {
      perMapel[key] = {
        mapelName: att.mapelName || key,
        totalSoal: 0,
        akurasiPct: 0,
        topikLemah: [],
        topikKuat: [],
        pesanCoach: '',
      };
    }
    const m = perMapel[key];
    // Agregat topik (disimpan sementara di objek)
    const agg = ((m as unknown as { _agg?: { benarPerTopik: Record<string, number>; salahPerTopik: Record<string, number> } })._agg) || {
      benarPerTopik: {},
      salahPerTopik: {},
    };

    for (const s of att.perSoal || []) {
      if (s.status === 'kosong') continue;
      totalSoal++;
      m.totalSoal++;
      totalDetik += s.durasiDetik || 0;
      if (s.status === 'benar') {
        totalBenar++;
        if (s.topik) agg.benarPerTopik[s.topik] = (agg.benarPerTopik[s.topik] || 0) + 1;
      } else if (s.status === 'salah') {
        if (s.topik) agg.salahPerTopik[s.topik] = (agg.salahPerTopik[s.topik] || 0) + 1;
      }
    }
    (m as unknown as { _agg?: unknown })._agg = agg;
  }

  const akurasiPct = totalSoal > 0 ? Math.round((totalBenar / totalSoal) * 100) : 0;
  const jam = totalDetik / 3600;
  const jamFokus = jam >= 1 ? `${jam.toFixed(1)}j` : `${Math.round(totalDetik / 60)}mnt`;

  // Hitung per mapel: akurasi, topik kuat/lemah, pesan coach personal
  for (const key of Object.keys(perMapel)) {
    const m = perMapel[key];
    const agg = (m as unknown as { _agg?: { benarPerTopik: Record<string, number>; salahPerTopik: Record<string, number> } })._agg || {
      benarPerTopik: {},
      salahPerTopik: {},
    };
    // Hapus field internal agar tidak bocor ke render
    delete (m as unknown as { _agg?: unknown })._agg;

    // Akurasi per mapel = benar / (benar + salah)
    const benarTopik = Object.values(agg.benarPerTopik).reduce((a, b) => a + b, 0);
    const salahTopik = Object.values(agg.salahPerTopik).reduce((a, b) => a + b, 0);
    const totTopik = benarTopik + salahTopik;
    m.akurasiPct = totTopik > 0 ? Math.round((benarTopik / totTopik) * 100) : 0;

    m.topikLemah = Object.entries(agg.salahPerTopik)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t);
    m.topikKuat = Object.entries(agg.benarPerTopik)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([t]) => t);

    // Pesan coach personal berdasarkan data real
    const lemahTxt = m.topikLemah.length > 0 ? m.topikLemah[0] : null;
    const kuatTxt = m.topikKuat.length > 0 ? m.topikKuat[0] : null;
    if (m.totalSoal === 0) {
      m.pesanCoach = `Belum ada data ${m.mapelName}. Yuk kerjakan paket soalnya dulu, nanti aku analisis polanya!`;
    } else if (m.akurasiPct < 60) {
      m.pesanCoach = `Dari ${m.totalSoal} soal ${m.mapelName}, akurasimu ${m.akurasiPct}%. Fokus ke ${lemahTxt ? `"${lemahTxt}"` : 'konsep dasar'} dulu — itu sumber kebocoran terbesarmu. Mau kita bedah bareng?`;
    } else if (m.akurasiPct < 80) {
      m.pesanCoach = `Lumayan! Akurasi ${m.mapelName}-mu ${m.akurasiPct}% dari ${m.totalSoal} soal.${lemahTxt ? ` Tinggal beresin "${lemahTxt}" biar tembus 80%.` : ''}${kuatTxt ? ` "${kuatTxt}"-mu udah solid, pertahankan!` : ''}`;
    } else {
      m.pesanCoach = `Mantap! Akurasi ${m.mapelName}-mu ${m.akurasiPct}% dari ${m.totalSoal} soal.${kuatTxt ? ` "${kuatTxt}" udah jadi senjata andalanmu.` : ''} Tinggal jaga konsistensi!`;
    }
  }

  return { adaData: true, totalSoal, akurasiPct, jamFokus, perMapel };
}
