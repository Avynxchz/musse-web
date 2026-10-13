'use client'

/*
 * Konten & konstanta panggung demo "Lihat cara kerjanya".
 * File ini murni data — tidak ada logika di sini.
 */

/* Panggung di-scale agar muat di mobile: interior tetap 560px, di-scale turun mengikuti lebar kolom. */
export const DESIGN_W = 560
export const STAGE_H = 620

/*
 * SATU master timeline (state machine bertahap, cleanup di useLoopAnimation):
 * 9,4 dtk aksi + 0,6 dtk jeda (fade 0,4 dtk, kosong maksimal 0,2 dtk) = loop 10 dtk.
 */
export const TL_DEMO: [number, number][] = [
  [0, 1], // kartu soal spring-in, opsi naik berurutan dari bawah
  [1400, 2], // kursor meluncur dari kanan-bawah ke tengah opsi B (0,9 dtk)
  [2500, 3], // hover B (border tebal) + kursor menekan
  [2900, 4], // klik: ripple, B jadi lime + centang, badge + confetti, kursor fade out
  [3600, 5], // kartu yang SAMA mengecil jadi baris ringkasan (0,5 dtk)
  [4200, 6], // pertanyaan diketik huruf per huruf
  [5200, 7], // titik mengetik AI
  [6000, 8], // balasan AI masuk dari bawah
  [6400, 9], // Langkah 1
  [6750, 10], // Langkah 2
  [7100, 11], // Langkah 3
  [8000, 12], // chip streak pop (ruang sudah dicadangkan)
  [9400, 13], // semua fade out 0,4 dtk
]
export const LOOP_DEMO = 10000

export const OPTIONS = [
  { key: 'A', text: 'Rp4.000' },
  { key: 'B', text: 'Rp5.000' },
  { key: 'C', text: 'Rp6.000' },
  { key: 'D', text: 'Rp7.000' },
  { key: 'E', text: 'Rp8.000' },
]

export const LANGKAH = ['3b + 2p = 21.000', '2b + 3p = 19.000', 'Eliminasi → b = Rp5.000']

/* 14 partikel confetti: deterministik, jarak 50-80px, warna lime/indigo/oranye */
export const CONFETTI = Array.from({ length: 14 }, (_, i) => {
  const angle = (i / 14) * Math.PI * 2 + 0.35
  const dist = 50 + (i % 4) * 10
  return {
    dx: Math.cos(angle) * dist,
    dy: Math.sin(angle) * dist,
    c: ['#B6FF00', '#4F46E5', '#F97316'][i % 3],
    size: i % 2 === 0 ? 8 : 6,
  }
})

export const POINTS = [
  'Jawab soal, langsung tahu benar atau salah.',
  'Tiap soal ada pembahasan langkah demi langkah.',
  'Masih bingung? Tanya AI yang paham konteks soalmu.',
]

/* Step terakhir timeline — dipakai sebagai frame statis saat reduced-motion. */
export const FINAL_STEP = TL_DEMO[TL_DEMO.length - 1][1]
