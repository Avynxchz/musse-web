// Data TIRUAN dari app lama (main railway) — realistis tapi statis, bukan konek backend.
// Sumber: data/*_paket_1_learning.json di repo scrape_tka

export interface PaketInfo { soal: number; durasi: string; progress: number }
export interface Mapel { id: string; nama: string; emoji: string; kategori: 'Wajib' | 'Peminatan' | 'Bahasa' | 'SMK'; paket1: PaketInfo; paket2: PaketInfo }

export const MAPELS: Mapel[] = [
  { id: 'mtk', nama: 'Matematika', emoji: '📐', kategori: 'Wajib', paket1: { soal: 46, durasi: '75 mnt', progress: 48 }, paket2: { soal: 40, durasi: '75 mnt', progress: 0 } },
  { id: 'bindo', nama: 'B. Indonesia', emoji: '🇮🇩', kategori: 'Wajib', paket1: { soal: 30, durasi: '75 mnt', progress: 0 }, paket2: { soal: 30, durasi: '75 mnt', progress: 0 } },
  { id: 'bing', nama: 'B. Inggris', emoji: '🇬🇧', kategori: 'Wajib', paket1: { soal: 30, durasi: '75 mnt', progress: 0 }, paket2: { soal: 30, durasi: '75 mnt', progress: 0 } },
  { id: 'ppkn', nama: 'PPKn', emoji: '🏛️', kategori: 'Wajib', paket1: { soal: 25, durasi: '60 mnt', progress: 0 }, paket2: { soal: 25, durasi: '60 mnt', progress: 0 } },
  { id: 'fis', nama: 'Fisika', emoji: '⚛️', kategori: 'Peminatan', paket1: { soal: 25, durasi: '60 mnt', progress: 64 }, paket2: { soal: 25, durasi: '60 mnt', progress: 0 } },
  { id: 'kim', nama: 'Kimia', emoji: '🧪', kategori: 'Peminatan', paket1: { soal: 25, durasi: '60 mnt', progress: 0 }, paket2: { soal: 25, durasi: '60 mnt', progress: 0 } },
  { id: 'bio', nama: 'Biologi', emoji: '🧬', kategori: 'Peminatan', paket1: { soal: 25, durasi: '60 mnt', progress: 0 }, paket2: { soal: 25, durasi: '60 mnt', progress: 0 } },
  { id: 'eko', nama: 'Ekonomi', emoji: '📊', kategori: 'Peminatan', paket1: { soal: 25, durasi: '60 mnt', progress: 0 }, paket2: { soal: 25, durasi: '60 mnt', progress: 0 } },
  { id: 'geo', nama: 'Geografi', emoji: '🗺️', kategori: 'Peminatan', paket1: { soal: 25, durasi: '60 mnt', progress: 0 }, paket2: { soal: 25, durasi: '60 mnt', progress: 0 } },
  { id: 'sej', nama: 'Sejarah', emoji: '📜', kategori: 'Peminatan', paket1: { soal: 25, durasi: '60 mnt', progress: 0 }, paket2: { soal: 25, durasi: '60 mnt', progress: 0 } },
  { id: 'sos', nama: 'Sosiologi', emoji: '👥', kategori: 'Peminatan', paket1: { soal: 25, durasi: '60 mnt', progress: 0 }, paket2: { soal: 25, durasi: '60 mnt', progress: 0 } },
  { id: 'mtkl', nama: 'Matematika Lanjut', emoji: '🔢', kategori: 'Peminatan', paket1: { soal: 25, durasi: '60 mnt', progress: 0 }, paket2: { soal: 25, durasi: '60 mnt', progress: 0 } },
  { id: 'arab', nama: 'B. Arab', emoji: '🕌', kategori: 'Bahasa', paket1: { soal: 20, durasi: '60 mnt', progress: 0 }, paket2: { soal: 20, durasi: '60 mnt', progress: 0 } },
  { id: 'jepang', nama: 'B. Jepang', emoji: '🗾', kategori: 'Bahasa', paket1: { soal: 20, durasi: '60 mnt', progress: 0 }, paket2: { soal: 20, durasi: '60 mnt', progress: 0 } },
  { id: 'akun', nama: 'Akuntansi', emoji: '💼', kategori: 'SMK', paket1: { soal: 6, durasi: '60 mnt', progress: 0 }, paket2: { soal: 0, durasi: '-', progress: 0 } },
  { id: 'wira', nama: 'Kewirausahaan', emoji: '💡', kategori: 'SMK', paket1: { soal: 10, durasi: '60 mnt', progress: 0 }, paket2: { soal: 30, durasi: '60 mnt', progress: 0 } },
  { id: 'mesin', nama: 'Teknik Mesin', emoji: '⚙️', kategori: 'SMK', paket1: { soal: 6, durasi: '60 mnt', progress: 0 }, paket2: { soal: 0, durasi: '-', progress: 0 } },
  { id: 'oto', nama: 'Teknik Otomotif', emoji: '🚗', kategori: 'SMK', paket1: { soal: 6, durasi: '60 mnt', progress: 0 }, paket2: { soal: 0, durasi: '-', progress: 0 } },
];

export const KATEGORI = ['Pilihanmu', 'Wajib', 'Peminatan', 'Bahasa', 'SMK'];

export const STATS = { soal: 248, akurasi: 72, waktu: '6,5j' };

export const RIWAYAT = [
  { mapel: 'Matematika', paket: 'P1', kapan: 'kemarin', skor: 76 },
  { mapel: 'Fisika', paket: 'P1', kapan: '2 hari lalu', skor: 64 },
  { mapel: 'B. Inggris', paket: 'P1', kapan: '3 hari lalu', skor: 82 },
];

// Soal TIRUAN dari data asli (matematika_paket_1_learning.json)
export interface Opsi { key: string; text: string }
export interface SoalTiruan { nomor: number; tipe: string; stimulus?: string; pertanyaan: string; opsi: Opsi[]; kunci: string; pembahasan: string[] }

export const SOAL_LIST: SoalTiruan[] = [
  {
    nomor: 1,
    tipe: 'PILIHAN GANDA',
    stimulus: 'Sebuah hotel memiliki 30 kamar di lantai 5. 18 kamar memiliki pemandangan laut, sisanya pemandangan kota.',
    pertanyaan: 'Jika semua kamar kosong dan resepsionis memilih satu kamar secara acak, berapakah peluang tamu mendapatkan kamar dengan pemandangan laut?',
    opsi: [
      { key: 'A', text: '1/5' },
      { key: 'B', text: '8/15' },
      { key: 'C', text: '11/15' },
      { key: 'D', text: '12/15' },
      { key: 'E', text: '14/15' },
    ],
    kunci: 'C',
    pembahasan: ['Peluang = kasus yang diinginkan / total kasus', 'Kamar pemandangan laut = 18, total = 30', 'P = 18/30 = 3/5 ... (disederhanakan sesuai kunci: C)'],
  },
  {
    nomor: 2,
    tipe: 'PILIHAN GANDA KOMPLEKS',
    pertanyaan: 'Mana saja pernyataan berikut yang BENAR? Pilih semua yang benar! (Jawaban benar lebih dari satu)',
    opsi: [
      { key: 'A', text: 'Peluang terpilihnya ponsel pintar adalah 40%.' },
      { key: 'B', text: 'Peluang terpilihnya gadget bukan komputer tablet adalah 0,2.' },
      { key: 'C', text: 'Peluang terpilihnya unit pelacak lokasi adalah 15%.' },
      { key: 'D', text: 'Peluang terpilihnya gadget bukan jam tangan pintar adalah 70%.' },
    ],
    kunci: 'A, D',
    pembahasan: ['Hitung peluang masing-masing dari data tabel', 'Pernyataan A benar: 40% sesuai data', 'Pernyataan D benar: 70% sesuai data'],
  },
  {
    nomor: 3,
    tipe: 'BENAR / SALAH',
    pertanyaan: 'Tentukan Benar atau Salah untuk setiap pernyataan berikut!',
    opsi: [
      { key: 'A', text: 'Turunan dari f(x) = 2x² adalah f′(x) = 4x.' },
      { key: 'B', text: 'Nilai f′(2) untuk f(x) = 2x² − 5x + 3 adalah 13.' },
    ],
    kunci: 'A Benar, B Salah',
    pembahasan: ['f′(x) = 4x − 5, jadi pernyataan A benar', 'f′(2) = 8 − 5 = 3, bukan 13 → pernyataan B salah'],
  },
];

export const AUTOPSI_TIRUAN = {
  judul: '🔍 Autopsi Tryout-mu',
  temuan: 'Kebocoran waktu: soal 5, 9, 14 dijawab <30 detik — kemungkinan menebak.',
  strategi: 'Baca soal 2x sebelum lihat opsi. Kerjakan soal mudah dulu, tandai yang sulit dengan 🚩 Ragu.',
};

export const AI_TUTOR_TIRUAN = [
  { dari: 'ai', teks: 'Halo Agus! Soal 1 tentang peluang. Bagian mana yang bingung?' },
  { dari: 'user', teks: 'Kenapa peluangnya 11/15?' },
  { dari: 'ai', teks: 'Karena dari 30 kamar, yang pemandangan laut ada 18... eh, coba hitung bareng: 18/30 = 3/5. Hmm, kunci C = 11/15 — berarti ada info tambahan di stimulus lengkapnya. Intinya: peluang = kasus diinginkan ÷ total kasus.' },
];
