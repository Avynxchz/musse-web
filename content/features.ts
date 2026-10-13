/* Data statis section fitur — dipindah dari Features.tsx (isi tidak diubah).
 * Kolom visual/mini memakai key string; mapping ke komponen ada di
 * components/landing/features/Features.tsx supaya file ini murni data. */

export type MainCardVisual = 'pembahasan' | 'ai-chat' | 'ruang-ai'
export type BalokMini = 'mapel' | 'benar-salah' | 'autopsi' | 'progres' | 'misi' | 'tryout' | 'streak' | 'countdown' | 'mode'

export const PEMBAHASAN_STEPS = [
  'Tulis harga yang diketahui',
  'Buat persamaan dari soal',
  'Selesaikan persamaan',
  'Cek kembali jawaban',
  'Tulis jawaban akhir',
]

export const RUANG_MAPEL_CHIPS = ['MTK', 'FIS', 'KIM', 'BIO']

export const MAIN_CARDS: {
  title: string
  desc: string
  visual: MainCardVisual
  checks: string[]
  circleBg: string
}[] = [
  {
    title: 'Pembahasan langkah demi langkah',
    desc: 'Tiap soal ada pembahasan AI yang jelas, bukan cuma kunci jawaban.',
    visual: 'pembahasan',
    checks: ['Dijelaskan langkah demi langkah', 'Bukan cuma kunci jawaban', 'Ada di tiap soal'],
    circleBg: 'bg-[#E0E7FF]',
  },
  {
    title: 'AI Chat yang paham konteks soal',
    desc: 'Nanya soal nomor berapa pun, AI ngerti soal mana yang kamu maksud.',
    visual: 'ai-chat',
    checks: ['Tanpa copy-paste soal', 'Tahu soal mana yang kamu maksud', 'Jawab sesuai konteks'],
    circleBg: 'bg-[#F0FFB8]',
  },
  {
    title: 'Ruang AI & Pendamping Belajar TKA',
    desc: 'Diskusi di ruang tiap mapel, sementara AI nyatet pola belajarmu otomatis dan ngasih tau apa yang perlu diperbaiki.',
    visual: 'ruang-ai',
    checks: [
      'Ruang diskusi khusus tiap mapel',
      'AI nyatet pola belajarmu otomatis',
      'Dikasih tahu apa yang perlu diperbaiki',
    ],
    circleBg: 'bg-[#FFEDD5]',
  },
]

export const BALOK_ICON_PATHS: Record<string, string> = {
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z',
  check: 'M20 6 9 17l-5-5',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16ZM21 21l-4.3-4.3',
  chart: 'M3 3v18h18M7 16l3-4 3 2 5-7',
  target:
    'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12ZM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
  clipboard: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2M9 2h6v4H9V2Z',
  flame: 'M12 22c4 0 7-2.7 7-6.5 0-3.2-2-5.4-4.2-7.5.1 2.2-1 3.5-2 4.2.3-4.2-1.8-7-4.2-9.2.2 4-3.6 6.4-3.6 10.5C5 18.9 8.1 22 12 22Z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20ZM12 6v6l4 2',
  layers: 'm12 2 9 5-9 5-9-5 9-5ZM3 12l9 5 9-5M3 17l9 5 9-5',
}

const CIRCLE_LIME = 'bg-[var(--musse-lime)]'
const CIRCLE_INDIGO = 'bg-[#E0E7FF]'
const CIRCLE_ORANGE = 'bg-[#FFEDD5]'
const CIRCLE_SKY = 'bg-[#E0F2FE]'

export const BALOKS: {
  title: string
  desc: string
  icon: string
  iconBg: string
  mini: BalokMini
}[] = [
  { title: '27 mapel', desc: 'SMA sampai mapel kejuruan SMK.', icon: 'book', iconBg: CIRCLE_LIME, mini: 'mapel' },
  { title: 'Benar/salah langsung', desc: 'Tahu hasil tanpa menunggu.', icon: 'check', iconBg: CIRCLE_INDIGO, mini: 'benar-salah' },
  {
    title: 'Autopsi kelemahan',
    desc: 'AI bedah hasil tryout-mu: salah karena terburu-buru, salah konsep, atau apa.',
    icon: 'search',
    iconBg: CIRCLE_ORANGE,
    mini: 'autopsi',
  },
  { title: 'Progres belajar', desc: 'Perkembanganmu selalu terlihat.', icon: 'chart', iconBg: CIRCLE_SKY, mini: 'progres' },
  { title: 'Misi harian', desc: 'Tantangan fokus setiap hari.', icon: 'target', iconBg: CIRCLE_LIME, mini: 'misi' },
  { title: 'Tryout simulasi', desc: 'Latihan persis seperti hari-H.', icon: 'clipboard', iconBg: CIRCLE_INDIGO, mini: 'tryout' },
  { title: 'Streak', desc: 'Jaga ritme belajar beruntun.', icon: 'flame', iconBg: CIRCLE_ORANGE, mini: 'streak' },
  { title: 'Countdown TKA', desc: 'Tahu berapa hari menuju hari-H.', icon: 'clock', iconBg: CIRCLE_SKY, mini: 'countdown' },
  { title: 'Mode latihan vs simulasi', desc: 'Santai belajar atau uji mental.', icon: 'layers', iconBg: CIRCLE_LIME, mini: 'mode' },
]
