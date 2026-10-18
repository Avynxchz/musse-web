# PROMPT UNTUK GEMINI ARGON 4 — Sisa 20% Mobile

> Cara pakai: copy-paste SATU prompt per sesi ke Gemini. Jangan digabung!
> Urutan: P0 (konteks) → P1 → P2 → P3 → P4

---

## PROMPT P0 — KONTEKS PROJECT (kirim duluan!)

```
Baca file HANDOFF_GEMINI.md di root project ini sampai paham 100%.

Ringkasan cepat:
- Project: musse-web, aplikasi latihan soal TKA (Tes Kemampuan Akademik) untuk siswa SMA/SMK Indonesia
- Branch kerja: desain-v0 (JANGAN sentuh main!)
- Stack: Next.js + Tailwind + TypeScript, deploy Vercel
- Data: 991 soal / 27 mapel / 49 paket di Supabase Storage (bucket `soal`, format JSON)
- AI Tutor: proxy Next.js → Railway backend → Groq LLM

ATURAN KERAS (jangan dilanggar):
1. JANGAN kerjakan tampilan DESKTOP. Fokus MOBILE saja.
2. JANGAN push ke branch main. Hanya desain-v0.
3. JANGAN ubah palet warna.
4. Rendering soal HARUS sama persis app lama (gambar inline, tanpa card box).
5. Jangan klaim "selesai" sebelum diverifikasi.

Kondisikan dirimu: kamu adalah developer yang melanjutkan project ini.
Konfirmasi dengan SATU kalimat bahwa kamu sudah paham konteks + aturan.
```

---

## PROMPT P1 — BERANDA JADI BENERAN (bukan dummy)

```
KONTEKS: Baca HANDOFF_GEMINI.md dulu.

MASALAH: Halaman Beranda (app/beranda/page.tsx) masih terasa template/dummy.
Kartu mapel statis, tidak ada personalisasi, tidak mencerminkan progres user.

TUGAS: Bikin Beranda jadi BENERAN hidup dengan data real.

YANG HARUS DILAKUKAN:
1. Baca riwayat quiz user dari localStorage (key: musse_quiz_history, format ada di lib/analisis.ts).
2. Tampilkan di tiap kartu mapel:
   - Progress: X/Y soal selesai (per paket!)
   - Akurasi terakhir per mapel
   - Badge "Lanjut" jika ada paket yang belum selesai
3. Section "Lanjutkan Terakhir": mapel + paket terakhir yang dikerjakan user (dari musse_last_attempt).
4. Jika belum ada data: tampilkan empty state yang jujur ("Belum ada progres, yuk mulai!") — JANGAN angka palsu.
5. Data per PAKET harus misah: MTK Paket 1 ≠ MTK Paket 2. Jangan digabung!

JANGAN UBAH:
- Desain kartu, warna, layout (visual 100% sama, cuma datanya yang jadi real)
- Logika navigasi ke arena

VERIFIKASI: npx tsc --noEmit harus 0 error.
```

---

## PROMPT P2 — AI #1: ANALISIS POLA PERILAKU (jadi lebih pintar)

```
KONTEKS: Baca HANDOFF_GEMINI.md + lib/analisis.ts (fungsi analyzeLearningPattern).

SITUASI SAAT INI: AI #1 (Guru Autopsi di app/hasil/page.tsx) sudah jalan tapi masih RULE-BASED sederhana (5 pola: terburu-buru, kurang yakin, dll).

TUGAS: Upgrade AI #1 agar analisisnya lebih dalam dan personal.

ALUR KERJA YANG DIMAU:
1. Saat user klik "Selesai" → sistem sudah merekam log: waktu per soal, ganti jawaban, pindah soal, buka pilar, dll.
2. AI #1 "melahap" semua log ini dan menyimpulkan POLA PERILAKU user.
3. Kesimpulan ditampilkan saat user buka hasil/autopsi.

YANG HARUS DILAKUKAN:
1. Perdalam analyzeLearningPattern() di lib/analisis.ts:
   - Tambah pola baru: "loncat-loncat soal" (pindah soal >3x tanpa jawab), "baca pembahasan kilat" (<5 detik di pilar), "stuck" (>3 menit di 1 soal), "pola waktu menurun" (makin cepat di soal akhir = kelelahan).
   - Tiap pola kasih CONTOH SOAL SPESIFIK dari data (nomor soal + topik).
   - Kasih REKOMENDASI AKSI konkret per pola ("Coba kerjakan 10 soal tanpa pindah...", bukan nasihat generik).
2. Simpan HASIL ANALISIS AI #1 ke localStorage (key baru: musse_ai1_insight) dengan format:
   { mapel, paket, tanggal, pola: [...], ringkasan: "...", rekomendasi: [...] }
3. AI #3 (nanti) akan baca insight ini — jadi formatnya harus konsisten!

JANGAN UBAH:
- Tampilan kartu Guru Autopsi (visual sama, cuma kontennya lebih pintar)
- 5 pola yang sudah ada (tambah, jangan hapus)

VERIFIKASI: npx tsc --noEmit 0 error. Test dengan data dummy: bikin 3 skenario (user cepat, user lambat, user loncat-loncat) dan pastikan polanya terdeteksi benar.
```

---

## PROMPT P3 — AI #3: RUANG AI JADI PINTAR (data per mapel per paket!)

```
KONTEKS: Baca HANDOFF_GEMINI.md + lib/analisis.ts + PROMPT P2 (AI #1).

SITUASI SAAT INI: Ruang AI (app/ruang/page.tsx) sudah pakai data real tapi masih sederhana.

TUGAS: Bikin AI #3 jadi tempat diskusi yang pintar.

ALUR KERJA YANG DIMAU:
1. User buka Ruang AI → pilih mapel (misal: Matematika).
2. AI #3 ambil data dari DUA sumber dan COMBINE:
   a. LOG per mapel per paket (PENTING: MTK Paket 1 dan MTK Paket 2 MISAH! Jangan digabung!)
   b. HASIL ANALISIS AI #1 (dari localStorage key musse_ai1_insight)
3. AI #3 menyajikan: "Di MTK Paket 1, kamu lemah di [topik]. AI #1 bilang kamu [pola]. Yuk bahas!"
4. User bisa CHAT dengan AI #3 untuk diskusi kesalahan.

YANG HARUS DILAKUKAN:
1. Refactor lib/analisis.ts: fungsi analyzeRuangAI() harus terima parameter (mapel, paket) dan HANYA pakai data mapel+paket tersebut.
2. Buat fungsi getAI1Insight(mapel, paket) untuk baca insight AI #1.
3. Di app/ruang/page.tsx:
   - Tambah selector PAKET (1/2) per mapel — default ke paket terakhir yang dikerjakan.
   - Tampilkan insight gabungan: statistik + pola AI #1 + topik lemah.
   - Chat AI #3: kirim konteks (mapel, paket, topik lemah, pola AI #1) ke AI Tutor backend agar jawabannya relevan. Endpoint: POST /api/tutor dengan tambahan field konteks.
4. Jika user pilih mapel+paket yang belum ada datanya: tampilkan "Belum ada data untuk [mapel] Paket [N]. Kerjakan dulu yuk!" — jangan tampilkan data paket lain!

JANGAN UBAH:
- Desain Ruang AI (visual sama)
- AI Tutor di arena (jangan diutak-atik!)

VERIFIKASI: npx tsc --noEmit 0 error.
```

---

## PROMPT P4 — VERIFIKASI AI #2 (Tanya AI di soal)

```
KONTEKS: Baca HANDOFF_GEMINI.md.

TUGAS: Audit (JANGAN ubah dulu!) AI #2 — fitur "Tanya AI" di dalam soal (app/arena/page.tsx, fungsi sendChat).

YANG HARUS DICEK:
1. Apakah konteks yang dikirim ke backend LENGKAP? Harusnya ada: soal, opsi jawaban, pilar pembahasan, nomor soal, mapel, paket.
2. Buka app/api/tutor/route.ts — apakah semua konteks di atas diteruskan ke Railway?
3. Apakah ada konteks yang HILANG? (misal: gambar soal tidak dikirim, pilar tidak ikut)
4. Apakah fallback template (saat backend mati) masih masuk akal?

OUTPUT: Laporan audit saja — JANGAN ubah kode dulu.
Format:
1. Konteks yang sudah dikirim (lengkap/tidak)
2. Konteks yang hilang (jika ada)
3. Rekomendasi perbaikan (tunggu persetujuan dulu)
```

---

*Dibuat oleh Muse untuk Agus. 18 Okt 2026.*
*Urutan eksekusi: P0 → P1 → P2 → P3 → P4. Satu per sesi!*
