// Data dummy untuk SKETSA struktur app (bukan data beneran)
export const MAPELS = [
  { id: 'mtk', nama: 'Matematika', emoji: '📐', paket1: { soal: 25, durasi: '75 mnt', progress: 48 }, paket2: { soal: 25, durasi: '75 mnt', progress: 0 } },
  { id: 'bindo', nama: 'B. Indonesia', emoji: '🇮🇩', paket1: { soal: 30, durasi: '75 mnt', progress: 0 }, paket2: { soal: 30, durasi: '75 mnt', progress: 0 } },
  { id: 'bing', nama: 'B. Inggris', emoji: '🇬🇧', paket1: { soal: 30, durasi: '75 mnt', progress: 0 }, paket2: { soal: 30, durasi: '75 mnt', progress: 0 } },
  { id: 'fis', nama: 'Fisika', emoji: '⚛️', paket1: { soal: 25, durasi: '60 mnt', progress: 0 }, paket2: { soal: 25, durasi: '60 mnt', progress: 0 } },
  { id: 'bio', nama: 'Biologi', emoji: '🧬', paket1: { soal: 25, durasi: '60 mnt', progress: 0 }, paket2: { soal: 25, durasi: '60 mnt', progress: 0 } },
];

export const KATEGORI = ['Pilihanmu', 'Wajib', 'Peminatan', 'Bahasa', 'SMK'];

export const STATS = { soal: 248, akurasi: 72, waktu: '6,5j' };

export const RIWAYAT = [
  { mapel: 'Matematika', paket: 'P1', kapan: 'kemarin', skor: 76 },
  { mapel: 'Fisika', paket: 'P1', kapan: '2 hari lalu', skor: 64 },
  { mapel: 'B. Inggris', paket: 'P1', kapan: '3 hari lalu', skor: 82 },
];

export const SOAL_DUMMY = {
  no: 12,
  total: 25,
  tipe: 'PILIHAN GANDA KOMPLEKS',
  teks: 'Perhatikan grafik fungsi kuadrat berikut...',
  opsi: ['Pernyataan 1 benar', 'Pernyataan 2 benar', 'Pernyataan 3 benar'],
  timer: '48:15',
};
