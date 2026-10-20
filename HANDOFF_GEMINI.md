# HANDOFF: musse-web (desain-v0) → Gemini Argon 4

> Dokumen ini disiapkan 18 Okt 2026 untuk serah terima project dari Muse ke Gemini Argon 4.
> Repo: https://github.com/Avynxchz/musse-web — Branch: `desain-v0`

---

## 1. APA INI?

**musse** = aplikasi web latihan soal TKA (Tes Kemampuan Akademik) untuk siswa SMA/SMK Indonesia.
- **Founder:** Agus (18 tahun, phone-only — dia cek semua dari HP, tidak bisa coding langsung)
- **Stack:** Next.js + Tailwind CSS + TypeScript, deploy di Vercel
- **Data:** 991 soal, 27 mapel, 49 paket — disimpan sebagai JSON di Supabase Storage (bukan database tabel)
- **AI Tutor:** Proxy Next.js (`app/api/tutor/route.ts`) → Railway backend (`https://tka-master.up.railway.app/api/tutor/chat`) → Groq LLM

**Preview branch (auto-update tiap push):**
https://musse-git-desain-v0-avynxchzchannel-1823s-projects.vercel.app

---

## 2. ATURAN KERAS AGUS (JANGAN DILANGGAR!)

1. **JANGAN kerjakan/pindah ke tampilan DESKTOP** kecuali Agus bilang eksplisit. Fokus MOBILE.
2. **Jangan pilih shortcut** — kerjakan dengan benar, bukan jalan pintas.
3. **Jangan push ke `main`** — hanya ke branch `desain-v0`. Merge = wewenang Agus.
4. **Jangan ubah palet warna** — audit warna ditunda atas perintah Agus ("untuk warna nanti aja").
5. **Rendering soal HARUS sama persis dengan app lama** (main railway):
   - Gambar inline dalam alur teks (kecil ≤55px di samping teks tanpa border; besar block-centered)
   - JANGAN pakai card box untuk gambar
   - Opsi jawaban: render HTML resmi jika ada (`opt.html`), termasuk gambar
6. **Bahasa:** santai Indonesia, singkat. Istilah teknis langsung dikasih arti sederhana dalam kurung.
7. **Jangan klaim "selesai/fixed"** dari push/build saja. Verdict akhir = HP Agus.
8. **TikTok & NIB sudah beres** — jangan ditanya lagi.
9. **Guest dihapus** — login Google wajib untuk akses penuh.

---

## 3. STRUKTUR PROJECT

```
app/
├── arena/page.tsx          # Halaman soal (paling penting!) — timer, navigasi, AI Tutor chat, 5 pilar
├── arena/data.ts           # Definisi tipe Question, MAPEL_CATALOG (27 mapel)
├── beranda/page.tsx        # Daftar mapel (27 kartu, filter kategori, search)
├── hasil/page.tsx          # Hasil quiz + Guru Autopsi AI
├── ruang/page.tsx          # Ruang AI per mapel (coach)
├── akun/page.tsx           # Profil + disclosure privasi
├── api/tutor/route.ts      # Proxy ke Railway (jangan ubah logika!)
└── components/ui.tsx       # Komponen shared (PilarText, Latex, BottomNav, hooks)

lib/
├── soal.ts                 # renderHtmlWithImages (URL Supabase), loadSoal
└── analisis.ts             # analyzeLearningPattern, analyzeRuangAI, saveAttempt

scripts/
└── storage_json_100pct/    # 49 file JSON soal (6.6MB total)
```

---

## 4. YANG SUDAH SELESAI (18 Okt 2026)

### Rendering & Format Teks
- **PilarText** (`ui.tsx`): auto-format `•` → bullet list, `1.` → numbered, `\n` → paragraf, kalimat (`.`) → paragraf baru
- **Nested bullets**: `Header:- Sub1- Sub2` → nested list rapi
- **`**bold**`** → `<strong>` beneran
- **`['A:Benar', ...]`** → `A: Benar, B: Salah` (rapi)
- **Form feed bug**: `\frac` yang korup jadi `rac` (karakter `\x0c`) → diperbaiki di `autoWrapBareLatex` + `normalizeLatex`
- **AI Tutor HTML**: `<b>`, `<br/>`, `&amp;` dari output AI → dibersihkan/dirender beneran

### 3 AI
| # | Nama | Status | Lokasi |
|---|------|--------|--------|
| 1 | AI Tutor (chat per-soal) | ✅ BENERAN (Railway/Groq) | `app/arena/page.tsx` + `app/api/tutor/route.ts` |
| 2 | Guru Autopsi (analisis cara belajar) | ✅ BENERAN (rule-based dari data real) | `app/hasil/page.tsx` + `lib/analisis.ts` |
| 3 | Ruang AI (analisis soal salah per mapel) | ✅ BENERAN (dari localStorage) | `app/ruang/page.tsx` + `lib/analisis.ts` |

### Data
- 991 soal, 27 mapel, 49 paket — 100% di Supabase Storage bucket `soal`
- 972 gambar di bucket `soal-images`
- Semua punya pembahasan 5 pilar

### Performa & Keamanan
- External log store (hilangkan 50-100 re-render per sesi quiz)
- Scroll rAF throttle
- content-visibility untuk 5 pilar
- AbortController untuk AI Tutor (cegah race condition)
- XSS aman, tidak ada secret di client

---

## 5. CARA AKSES KODE

**Opsi A — Download ZIP (paling gampang dari HP):**
1. Buka https://github.com/Avynxchz/musse-web di browser HP
2. Tap tombol `<> Code` (hijau) → `Download ZIP`
3. Pilih branch `desain-v0` dulu sebelum download (tap branch dropdown → pilih `desain-v0`)
4. Extract ZIP di HP, upload file yang dibutuhkan ke chatbot Gemini

**Opsi B — Baca langsung file penting via GitHub web:**
- `app/components/ui.tsx` → https://github.com/Avynxchz/musse-web/blob/desain-v0/app/components/ui.tsx
- `app/arena/page.tsx` → https://github.com/Avynxchz/musse-web/blob/desain-v0/app/arena/page.tsx
- `lib/analisis.ts` → https://github.com/Avynxchz/musse-web/blob/desain-v0/lib/analisis.ts

**Catatan:** Chatbot Gemini tidak bisa fetch URL GitHub (keterbatasan chatbot). Jadi HARUS download/upload manual.

---

## 6. YANG BELUM / NEXT STEPS

1. **Verdict HP Agus** — semua fix di atas butuh konfirmasi dari HP-nya
2. **Audit warna** — ditunda (Agus bilang "nanti aja")
3. **Desktop** — JANGAN disentuh kecuali disuruh
4. **Supabase RLS** — policy `profiles`/`behavior_logs` belum diaudit ulang
5. **Policy "Upload soal"** — Agus diminta hapus via SQL, konfirmasi belum diterima:
   ```sql
   DROP POLICY IF EXISTS "Upload soal" ON storage.objects;
   ```

---

## 7. KONTAK PENTING

- **Supabase:** `https://auhqgzrrgvjbfvzvayzg.supabase.co` (project `tka-master`)
- **Railway (AI Tutor):** `https://tka-master.up.railway.app/api/tutor/chat`
- **Preview:** https://musse-git-desain-v0-avynxchzchannel-1823s-projects.vercel.app
- **Production:** https://musseapp.vercel.app/ (jangan ganggu!)

---

*Dokumen ini dibuat oleh Muse (Meta) untuk serah terima ke Gemini Argon 4. 18 Oktober 2026.*
