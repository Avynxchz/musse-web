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
  /** Berapa kali user pindah meninggalkan soal ini tanpa mengunci jawaban */
  pindahTanpaJawab?: number;
  /** Durasi membaca pembahasan/pilar (detik) saat cek jawaban dibuka */
  durasiPilarDetik?: number;
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
  /** Total event pindah soal tanpa menjawab selama sesi */
  pindahTanpaJawabCount?: number;
}

// ================= Helper localStorage =================

/** Key penyimpanan — single source of truth (dipakai arena + analisis). */
export const KEY_LAST_ATTEMPT = 'musse_last_attempt';
export const KEY_QUIZ_HISTORY = 'musse_quiz_history';
export const KEY_AI1_INSIGHT = 'musse_ai1_insight';
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

// ================= AI #1 (Guru Autopsi): Analisis pola perilaku =================

export interface Observasi {
  html: string; // boleh pakai <b>
}

export interface PolaTerdeteksi {
  nama: string;        // mis. "Terburu-buru"
  judul: string;       // mis. "Terburu-buru di Soal Multi-Pernyataan"
  bukti: string;       // kalimat bukti dari data (wajib sebut nomor soal + topik)
  soalContoh?: number; // nomor soal untuk tombol "Bedah Soal"
  topikContoh?: string; // topik dari soal contoh
  rekomendasi?: string; // rekomendasi aksi konkret per pola
}

export interface HasilAnalisisBelajar {
  adaData: boolean;
  observasi: Observasi[];
  pola: PolaTerdeteksi[];
  rataRataDetik: number;
  ringkasan: string;
  rekomendasi: string[];
}

export interface AI1InsightItem {
  mapel: string;
  mapelName?: string;
  paket: number;
  tanggal: string;
  pola: PolaTerdeteksi[];
  ringkasan: string;
  rekomendasi: string[];
  rataRataDetik?: number;
}

export interface AI1Insight extends AI1InsightItem {
  /** Indeks per `${mapel}_p${paket}` agar AI #3 bisa baca insight spesifik per mapel+paket */
  perPaket?: Record<string, AI1InsightItem>;
}

/** Simpan insight AI #1 ke localStorage (musse_ai1_insight). */
export function saveAI1Insight(item: AI1InsightItem): void {
  try {
    if (typeof window === 'undefined' || !item.mapel) return;
    const existing = safeGet<AI1Insight | null>(KEY_AI1_INSIGHT, null);
    const perPaket: Record<string, AI1InsightItem> = {
      ...(existing?.perPaket ?? {}),
    };
    if (existing?.mapel && existing?.paket) {
      const prevKey = `${existing.mapel}_p${Number(existing.paket) === 2 ? 2 : 1}`;
      if (!perPaket[prevKey]) {
        perPaket[prevKey] = {
          mapel: existing.mapel,
          mapelName: existing.mapelName,
          paket: existing.paket,
          tanggal: existing.tanggal,
          pola: existing.pola ?? [],
          ringkasan: existing.ringkasan ?? '',
          rekomendasi: existing.rekomendasi ?? [],
          rataRataDetik: existing.rataRataDetik,
        };
      }
    }
    const key = `${item.mapel}_p${Number(item.paket) === 2 ? 2 : 1}`;
    perPaket[key] = item;
    const payload: AI1Insight = {
      ...item,
      perPaket,
    };
    localStorage.setItem(KEY_AI1_INSIGHT, JSON.stringify(payload));
  } catch {
    /* abaikan error storage */
  }
}

/** Baca insight AI #1 (bisa global terakhir atau spesifik per mapel + paket untuk AI #3). */
export function getAI1Insight(mapel?: string, paket?: number): AI1InsightItem | null {
  const stored = safeGet<AI1Insight | null>(KEY_AI1_INSIGHT, null);
  if (!mapel) return stored;
  const pkt = paket !== undefined ? (Number(paket) === 2 ? 2 : 1) : undefined;
  if (stored) {
    if (pkt !== undefined && stored.perPaket?.[`${mapel}_p${pkt}`]) {
      return stored.perPaket[`${mapel}_p${pkt}`];
    }
    if (
      stored.mapel === mapel &&
      (pkt === undefined || (Number(stored.paket) === 2 ? 2 : 1) === pkt)
    ) {
      return stored;
    }
  }
  return null;
}

/** Simpan 1 attempt: tulis last_attempt + append ke history (maks MAX_QUIZ_HISTORY)
 *  + langsung jalankan AI #1 untuk menyimpan musse_ai1_insight.
 *  Dipakai app/arena/page.tsx saat finishQuiz. Aman dipanggil berkali-kali. */
export function saveAttempt(attempt: QuizAttempt): void {
  try {
    if (typeof window === 'undefined') return;
    localStorage.setItem(KEY_LAST_ATTEMPT, JSON.stringify(attempt));
    const hist = getQuizHistory();
    hist.push(attempt);
    localStorage.setItem(KEY_QUIZ_HISTORY, JSON.stringify(hist.slice(-MAX_QUIZ_HISTORY)));
    analyzeLearningPattern(attempt);
  } catch {
    /* abaikan error storage */
  }
}

/** Tipe soal yang dianggap "kompleks" (butuh baca & cek lebih lama). */
const TIPE_KOMPLEKS = ['Pilihan Ganda Kompleks', 'Benar-Salah', 'Matriks', 'Pernyataan-Label'];

function labelTopik(s: PerSoalResult | undefined, attempt: QuizAttempt): string {
  const t = s?.topik?.trim();
  if (t) return t;
  return attempt.mapelName || attempt.mapel || 'Materi Utama';
}

export function analyzeLearningPattern(attempt: QuizAttempt | null): HasilAnalisisBelajar {
  if (!attempt || !attempt.perSoal || attempt.perSoal.length === 0) {
    return {
      adaData: false,
      observasi: [],
      pola: [],
      rataRataDetik: 0,
      ringkasan: '',
      rekomendasi: [],
    };
  }

  const allSoal = attempt.perSoal;
  const soal = allSoal.filter((s) => s.status !== 'kosong');
  const adaAktivitas =
    soal.length > 0 ||
    allSoal.some((s) => (s.pindahTanpaJawab || 0) > 0 || s.durasiDetik > 0) ||
    (attempt.pindahTanpaJawabCount || 0) > 0;

  if (!adaAktivitas) {
    return {
      adaData: false,
      observasi: [],
      pola: [],
      rataRataDetik: 0,
      ringkasan: '',
      rekomendasi: [],
    };
  }

  const observasi: Observasi[] = [];
  const pola: PolaTerdeteksi[] = [];

  // --- Observasi per soal (maks 4, prioritaskan yang menarik) ---
  // Urutan prioritas: salah+ganti jawaban > stuck > salah > loncat > ganti jawaban > cepat benar > lambat
  const basisObservasi = soal.length > 0 ? soal : allSoal;
  const scored = basisObservasi.map((s) => {
    let skor = 0;
    if (s.status === 'salah') skor += 10;
    if (s.durasiDetik > 180) skor += 8;
    if (s.gantiJawaban > 0) skor += 5 + s.gantiJawaban;
    if ((s.pindahTanpaJawab || 0) > 0) skor += 4 + (s.pindahTanpaJawab || 0);
    if (s.durasiDetik < 12 && TIPE_KOMPLEKS.includes(s.tipe)) skor += 4;
    if (s.durasiDetik > 120) skor += 3;
    if (s.status === 'benar' && s.durasiDetik < 20) skor += 2;
    return { s, skor };
  });
  scored.sort((a, b) => b.skor - a.skor);

  for (const { s } of scored.slice(0, 4)) {
    const topik = s.topik ? ` (${s.topik})` : '';
    const statusTxt = s.status === 'benar' ? 'benar' : s.status === 'salah' ? 'salah' : 'kosong';
    const extras: string[] = [];
    if (s.gantiJawaban > 0) {
      extras.push(`sempat ganti jawaban ${s.gantiJawaban}×`);
    } else if (s.status === 'benar' && s.durasiDetik <= 30) {
      extras.push('tanpa ganti opsi');
    }
    if ((s.pindahTanpaJawab || 0) > 0) {
      extras.push(`dilewati ${s.pindahTanpaJawab}× tanpa jawab`);
    }
    if (typeof s.durasiPilarDetik === 'number' && s.durasiPilarDetik > 0) {
      extras.push(`baca pilar ${s.durasiPilarDetik} dtk`);
    }
    const detail = extras.length > 0 ? `, ${extras.join(', ')}` : '';
    observasi.push({
      html: `Di <b>Soal #${s.nomor}${topik}</b> [${s.tipe}], jawabanmu <b>${statusTxt}</b> dalam ${s.durasiDetik} detik${detail}.`,
    });
  }

  // --- Deteksi pola dari aturan ---
  const soalBerwaktu = soal.length > 0 ? soal : allSoal.filter((s) => s.durasiDetik > 0);
  const totalDurasi = soalBerwaktu.reduce((a, s) => a + s.durasiDetik, 0);
  const rataRata = soalBerwaktu.length > 0 ? Math.round(totalDurasi / soalBerwaktu.length) : 0;

  // Pola 1 (existing): Terburu-buru — rata-rata <15 dtk di soal kompleks (atau rata-rata total <15 dtk)
  const kompleks = soal.filter((s) => TIPE_KOMPLEKS.includes(s.tipe));
  const kompleksKilat = kompleks.filter((s) => s.durasiDetik < 15);
  if (kompleks.length > 0 && (kompleks.reduce((a, s) => a + s.durasiDetik, 0) / kompleks.length <= 15 || kompleksKilat.length >= 2)) {
    const avgKompleks = kompleks.reduce((a, s) => a + s.durasiDetik, 0) / kompleks.length;
    const contoh = [...kompleks].sort((a, b) => a.durasiDetik - b.durasiDetik)[0];
    const tpk = labelTopik(contoh, attempt);
    pola.push({
      nama: 'Terburu-buru',
      judul: 'Terburu-buru di Soal Multi-Pernyataan',
      bukti: `Waktu baca rata-rata ${Math.round(avgKompleks)} detik pada ${kompleks.length} soal ${kompleks[0].tipe} (contoh: Soal #${contoh.nomor} · ${tpk} hanya ${contoh.durasiDetik} detik) — padahal tipe ini butuh pengecekan lebih dari satu kondisi.`,
      soalContoh: contoh.nomor,
      topikContoh: tpk,
      rekomendasi: `Di Soal #${contoh.nomor} (${tpk}), tahan minimal 20 detik untuk mengecek tiap pernyataan satu per satu dari atas ke bawah sebelum mengunci jawaban.`,
    });
  } else if (soal.length >= 2 && rataRata > 0 && rataRata < 15) {
    const cepatSalah = soal.filter((s) => s.durasiDetik < 15 && s.status === 'salah');
    const contoh = (cepatSalah.length > 0 ? cepatSalah : [...soal].sort((a, b) => a.durasiDetik - b.durasiDetik))[0];
    const tpk = labelTopik(contoh, attempt);
    pola.push({
      nama: 'Terburu-buru',
      judul: 'Menjawab Terlalu Cepat (<15 Detik/Soal)',
      bukti: `Rata-rata pengerjaanmu cuma ${rataRata} detik/soal (contoh: Soal #${contoh.nomor} · ${tpk} dijawab dalam ${contoh.durasiDetik} detik) — rawan terpeleset jebakan kalimat tanya.`,
      soalContoh: contoh.nomor,
      topikContoh: tpk,
      rekomendasi: `Terapkan jeda wajib 15 detik di materi ${tpk} (mulai dari Soal #${contoh.nomor}): garis bawahi kata kunci yang ditanyakan sebelum memilih opsi.`,
    });
  }

  // Pola 2 (existing): Kurang yakin — sering ganti jawaban
  const seringGanti = soal.filter((s) => s.gantiJawaban >= 2);
  if (seringGanti.length >= 2) {
    const contoh = seringGanti[0];
    const tpk = labelTopik(contoh, attempt);
    pola.push({
      nama: 'Kurang yakin',
      judul: 'Sering Ganti Jawaban',
      bukti: `Di ${seringGanti.length} soal kamu ganti jawaban ≥2× (contoh: Soal #${contoh.nomor} · ${tpk}, ganti ${contoh.gantiJawaban}×) — tanda konsep belum nempel kuat, jawaban awal cuma tebakan.`,
      soalContoh: contoh.nomor,
      topikContoh: tpk,
      rekomendasi: `Selesaikan hitungan/coretan di kertas buram dulu sebelum menyentuh opsi pada Soal #${contoh.nomor} (${tpk}), dan jangan ubah pilihan awal kecuali menemukan salah hitung yang jelas.`,
    });
  } else if (soal.filter((s) => s.gantiJawaban === 1).length >= 3) {
    const gantiSatu = soal.filter((s) => s.gantiJawaban === 1);
    const contoh = gantiSatu[0];
    const tpk = labelTopik(contoh, attempt);
    pola.push({
      nama: 'Kurang yakin',
      judul: 'Ragu-ragu Saat Menjawab',
      bukti: `Di ${gantiSatu.length} soal kamu sempat mengganti pilihan 1× (contoh: Soal #${contoh.nomor} · ${tpk}) — coba baca soal sampai tuntas sebelum pilih.`,
      soalContoh: contoh.nomor,
      topikContoh: tpk,
      rekomendasi: `Eliminasi minimal 2 opsi pengecoh dulu di Soal #${contoh.nomor} (${tpk}) baru klik satu jawaban final tanpa gonta-ganti lagi.`,
    });
  }

  // Pola 3 (existing): Konsep belum nempel — lama di soal tapi tetap salah
  const lamaTapiSalah = soal.filter((s) => s.durasiDetik > 90 && s.status === 'salah');
  if (lamaTapiSalah.length > 0) {
    const contoh = [...lamaTapiSalah].sort((a, b) => b.durasiDetik - a.durasiDetik)[0];
    const tpk = labelTopik(contoh, attempt);
    const topiks = [...new Set(lamaTapiSalah.map((s) => s.topik).filter(Boolean))];
    pola.push({
      nama: 'Konsep belum nempel',
      judul: 'Lama Mengerjakan tapi Tetap Salah',
      bukti: `Di ${lamaTapiSalah.length} soal kamu mikir >90 detik tapi jawabannya salah (contoh: Soal #${contoh.nomor} · ${tpk}, ${contoh.durasiDetik} detik${topiks.length > 1 ? `; topik: ${topiks.slice(0, 3).join(', ')}` : ''}) — ini sinyal konsep dasarnya yang bolong, bukan kurang teliti.`,
      soalContoh: contoh.nomor,
      topikContoh: tpk,
      rekomendasi: `Bedah Pilar 1 (Konsep Kunci) & Pilar 4 (Langkah Rinci) di Soal #${contoh.nomor} (${tpk}), catat rumusnya, lalu langsung kerjakan 1 Soal Serupa sampai benar mandiri.`,
    });
  }

  // Pola 4 (existing): Sudah mantap — cepat & benar konsisten
  const cepatBenar = soal.filter((s) => s.status === 'benar' && s.durasiDetik <= 30 && s.gantiJawaban === 0);
  if (cepatBenar.length >= 3 && cepatBenar.length / soal.length >= 0.4) {
    const contoh = cepatBenar[0];
    const tpk = labelTopik(contoh, attempt);
    pola.push({
      nama: 'Sudah mantap',
      judul: 'Cepat & Tepat — Pertahankan!',
      bukti: `${cepatBenar.length} soal dijawab benar dalam ≤30 detik tanpa ganti opsi (contoh: Soal #${contoh.nomor} · ${tpk} selesai dalam ${contoh.durasiDetik} detik) — ritme ini yang bikin skor stabil.`,
      soalContoh: contoh.nomor,
      topikContoh: tpk,
      rekomendasi: `Pertahankan penguasaan topik ${tpk} (seperti di Soal #${contoh.nomor}) dan uji kecepatanmu di Mode Simulasi TKA dengan timer ketat.`,
    });
  }

  // Pola 5 (existing): Topik bermasalah — banyak salah di topik yang sama
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
    const contoh =
      soal.find((s) => s.status === 'salah' && s.topik === topikBermasalah[0]) ?? soal[0];
    pola.push({
      nama: 'Topik bolong',
      judul: `Topik "${topikBermasalah[0]}" Perlu Perhatian`,
      bukti: `${topikBermasalah[1]} soal dengan topik "${topikBermasalah[0]}" salah (contoh: Soal #${contoh.nomor} · ${topikBermasalah[0]}) — waktunya bedah konsepnya, bukan cuma latihan soal.`,
      soalContoh: contoh.nomor,
      topikContoh: topikBermasalah[0],
      rekomendasi: `Pelajari ulang 5 Pilar pada Soal #${contoh.nomor} (${topikBermasalah[0]}), lalu buka Ruang AI untuk diskusi khusus topik "${topikBermasalah[0]}" sebelum lanjut paket berikutnya.`,
    });
  }

  // Pola 6 (BARU): Loncat-loncat soal — >3x pindah soal tanpa jawab
  let lastAnsweredIdx = -1;
  allSoal.forEach((s, idx) => {
    if (s.status !== 'kosong') lastAnsweredIdx = idx;
  });
  const totalExplicitPindah =
    (attempt.pindahTanpaJawabCount || 0) ||
    allSoal.reduce((sum, s) => sum + (s.pindahTanpaJawab || 0), 0);
  const soalLoncat = allSoal.filter(
    (s, idx) =>
      (s.pindahTanpaJawab || 0) > 0 ||
      (s.status === 'kosong' && (s.durasiDetik > 0 || idx < lastAnsweredIdx))
  );
  const jumlahLoncat = Math.max(totalExplicitPindah, soalLoncat.length);
  if (jumlahLoncat > 3) {
    const kandidat = soalLoncat.length > 0 ? soalLoncat : allSoal;
    const contoh = [...kandidat].sort(
      (a, b) => (b.pindahTanpaJawab || 0) - (a.pindahTanpaJawab || 0) || b.durasiDetik - a.durasiDetik
    )[0];
    const tpk = labelTopik(contoh, attempt);
    pola.push({
      nama: 'Loncat-loncat soal',
      judul: 'Loncat-loncat Soal (>3× Pindah Tanpa Jawab)',
      bukti: `Kamu tercatat ${jumlahLoncat}× pindah/melewati soal tanpa mengunci jawaban (contoh: Soal #${contoh.nomor} · ${tpk}) — bolak-balik baca stimulus dari awal menguras waktu ujian.`,
      soalContoh: contoh.nomor,
      topikContoh: tpk,
      rekomendasi: `Coba kerjakan 10 soal berurutan tanpa pindah nomor; jika mentok di Soal #${contoh.nomor} (${tpk}), eliminasi 2 opsi salah, kunci 1 pilihan terbaik + tandai Ragu, baru lanjut.`,
    });
  }

  // Pola 7 (BARU): Baca pilar kilat — <5 detik di pembahasan/pilar
  const soalPilarKilat = allSoal.filter((s) => {
    if (typeof s.durasiPilarDetik === 'number') {
      return s.durasiPilarDetik > 0 && s.durasiPilarDetik < 5;
    }
    return s.status !== 'kosong' && s.durasiDetik > 0 && s.durasiDetik < 5;
  });
  if (soalPilarKilat.length > 0) {
    const contoh = [...soalPilarKilat].sort(
      (a, b) =>
        (a.status === 'salah' ? -1 : 1) - (b.status === 'salah' ? -1 : 1) ||
        (a.durasiPilarDetik ?? a.durasiDetik) - (b.durasiPilarDetik ?? b.durasiDetik)
    )[0];
    const dtk = contoh.durasiPilarDetik ?? contoh.durasiDetik;
    const tpk = labelTopik(contoh, attempt);
    pola.push({
      nama: 'Baca pilar kilat',
      judul: 'Baca Pembahasan Pilar Kilat (<5 Detik)',
      bukti: `Di ${soalPilarKilat.length} soal kamu menutup/melewati pembahasan dalam <5 detik (contoh: Soal #${contoh.nomor} · ${tpk} hanya ${dtk} detik), sehingga langkah logis & jebakan konsepnya terlewat.`,
      soalContoh: contoh.nomor,
      topikContoh: tpk,
      rekomendasi: `Buka kembali Soal #${contoh.nomor} (${tpk}), baca Pilar 3 sampai Pilar 5 minimal 15 detik, lalu kerjakan fitur Soal Serupa di bawahnya untuk memastikan paham.`,
    });
  }

  // Pola 8 (BARU): Stuck — >3 menit (>180 detik) di 1 soal
  const soalStuck = allSoal.filter((s) => s.durasiDetik > 180);
  if (soalStuck.length > 0) {
    const contoh = [...soalStuck].sort((a, b) => b.durasiDetik - a.durasiDetik)[0];
    const menitTxt = (contoh.durasiDetik / 60).toFixed(1).replace('.0', '');
    const tpk = labelTopik(contoh, attempt);
    pola.push({
      nama: 'Stuck',
      judul: 'Stuck >3 Menit di Satu Soal',
      bukti: `Kamu tertahan di ${soalStuck.length} soal selama >3 menit — paling lama di Soal #${contoh.nomor} (${tpk}) selama ${contoh.durasiDetik} detik (~${menitTxt} menit), yang memakan jatah waktu soal lainnya.`,
      soalContoh: contoh.nomor,
      topikContoh: tpk,
      rekomendasi: `Pasang batas waktu 90 detik per soal: saat ketemu soal berat seperti Soal #${contoh.nomor} (${tpk}), pakai Trik Cepat di Pilar 5 atau tandai Ragu di detik ke-90 agar tidak kehabisan waktu.`,
    });
  }

  // Pola 9 (BARU): Kelelahan — makin cepat drastis di soal akhir (pola waktu menurun)
  const soalUrut = [...allSoal]
    .filter((s) => s.status !== 'kosong' || s.durasiDetik > 0)
    .sort((a, b) => a.nomor - b.nomor);
  if (soalUrut.length >= 4) {
    const mid = Math.floor(soalUrut.length / 2);
    const paruhAwal = soalUrut.slice(0, mid);
    const paruhAkhir = soalUrut.slice(mid);
    const avgAwal = paruhAwal.reduce((sum, s) => sum + s.durasiDetik, 0) / paruhAwal.length;
    const avgAkhir = paruhAkhir.reduce((sum, s) => sum + s.durasiDetik, 0) / paruhAkhir.length;
    if (avgAwal >= 20 && avgAkhir > 0 && avgAkhir <= avgAwal * 0.55) {
      const contoh = [...paruhAkhir].sort(
        (a, b) =>
          (a.status === 'salah' ? -1 : 1) - (b.status === 'salah' ? -1 : 1) ||
          a.durasiDetik - b.durasiDetik
      )[0];
      const tpk = labelTopik(contoh, attempt);
      pola.push({
        nama: 'Kelelahan',
        judul: 'Pola Waktu Menurun di Soal Akhir (Kelelahan)',
        bukti: `Tempo pengerjaanmu merosot dari rata-rata ${Math.round(avgAwal)} detik/soal di awal menjadi ${Math.round(avgAkhir)} detik/soal di soal-soal akhir (contoh: Soal #${contoh.nomor} · ${tpk} hanya ${contoh.durasiDetik} detik) — indikasi fokus mulai habis.`,
        soalContoh: contoh.nomor,
        topikContoh: tpk,
        rekomendasi: `Pecah pengerjaan menjadi blok 10 soal dan ambil jeda napas 10 detik tiap ganti blok, lalu cek ulang jawaban soal akhir mulai dari Soal #${contoh.nomor} (${tpk}).`,
      });
    }
  }

  const rekomendasi =
    pola.length > 0
      ? pola.map((p) => p.rekomendasi).filter((r): r is string => Boolean(r))
      : [
          `Pertahankan ritme pengerjaanmu yang stabil (${rataRata} detik/soal) dan lanjutkan latihan ke paket soal berikutnya.`,
        ];

  const mapelLabel = attempt.mapelName || attempt.mapel || 'Mapel';
  const ringkasan =
    pola.length > 0
      ? `Di ${mapelLabel} Paket ${attempt.paket}, terdeteksi ${pola.length} pola perilaku (${pola.map((p) => p.nama).join(', ')}) dengan rata-rata ${rataRata} detik/soal. Prioritas utama: ${pola[0].judul}.`
      : `Di ${mapelLabel} Paket ${attempt.paket}, ritme pengerjaanmu stabil (rata-rata ${rataRata} detik/soal) tanpa pola kebocoran utama.`;

  // Simpan hasil analisis AI #1 ke localStorage (musse_ai1_insight) agar bisa dibaca AI #3
  if (attempt.mapel) {
    saveAI1Insight({
      mapel: attempt.mapel,
      mapelName: attempt.mapelName || attempt.mapel,
      paket: Number(attempt.paket) === 2 ? 2 : 1,
      tanggal: attempt.tanggal || new Date().toISOString(),
      pola,
      ringkasan,
      rekomendasi,
      rataRataDetik: rataRata,
    });
  }

  return {
    adaData: true,
    observasi,
    pola,
    rataRataDetik: rataRata,
    ringkasan,
    rekomendasi,
  };
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
