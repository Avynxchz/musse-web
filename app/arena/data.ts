// Data DUMMY untuk Arena Soal — dari mockup Argon v2, belum konek backend.
// Dipakai oleh app/arena/page.tsx

export type MapelCat = 'Wajib' | 'Saintek' | 'Soshum' | 'SMK' | 'Bahasa';

export interface Mapel {
  key: string;
  name: string;
  cat: MapelCat;
  fav: boolean;
  p1: number; // jumlah soal paket 1
  p2: number; // jumlah soal paket 2 (0 = tidak ada)
  prog: number; // progress persen
  jatahMenitPerSoal: number;
}

export const MAPEL_CATALOG: Mapel[] = [
  { key: 'matematika', name: 'Matematika (Wajib)', cat: 'Wajib', fav: true, p1: 46, p2: 25, prog: 33, jatahMenitPerSoal: 3.0 },
  { key: 'indonesia', name: 'Bahasa Indonesia (Wajib)', cat: 'Wajib', fav: true, p1: 20, p2: 25, prog: 60, jatahMenitPerSoal: 2.5 },
  { key: 'inggris', name: 'Bahasa Inggris (Wajib)', cat: 'Wajib', fav: true, p1: 20, p2: 25, prog: 0, jatahMenitPerSoal: 2.5 },
  { key: 'fisika', name: 'Fisika (Peminatan)', cat: 'Saintek', fav: true, p1: 20, p2: 24, prog: 15, jatahMenitPerSoal: 2.4 },
  { key: 'kimia', name: 'Kimia (Peminatan)', cat: 'Saintek', fav: false, p1: 20, p2: 24, prog: 0, jatahMenitPerSoal: 2.4 },
  { key: 'biologi', name: 'Biologi (Peminatan)', cat: 'Saintek', fav: false, p1: 20, p2: 29, prog: 0, jatahMenitPerSoal: 2.4 },
  { key: 'ekonomi', name: 'Ekonomi (Peminatan)', cat: 'Soshum', fav: false, p1: 20, p2: 29, prog: 0, jatahMenitPerSoal: 2.4 },
  { key: 'sosiologi', name: 'Sosiologi (Peminatan)', cat: 'Soshum', fav: false, p1: 20, p2: 30, prog: 0, jatahMenitPerSoal: 2.4 },
  { key: 'tkj', name: 'SMK - Teknik Jaringan (TKJ)', cat: 'SMK', fav: false, p1: 25, p2: 0, prog: 0, jatahMenitPerSoal: 2.4 },
  { key: 'tkr', name: 'SMK - Teknik Otomotif (TKR)', cat: 'SMK', fav: false, p1: 25, p2: 0, prog: 0, jatahMenitPerSoal: 2.4 },
  { key: 'jepang', name: 'Bahasa Jepang', cat: 'Bahasa', fav: false, p1: 10, p2: 29, prog: 0, jatahMenitPerSoal: 2.4 },
];

// ---------- Soal ----------

export type TipeSoal = 'Pilihan Ganda' | 'Pilihan Ganda Kompleks' | 'Benar-Salah';

export interface Opsi {
  key: string;
  text: string;
}

export interface Statement {
  key: string;
  text: string;
}

export interface SimilarSoal {
  q: string;
  opts: string[];
  ans: number; // index jawaban benar
  exp: string; // penjelasan
}

export interface Question {
  nomor: number;
  tipe: TipeSoal;
  topik: string;
  stimulus: string; // '' = tidak ada stimulus
  prompt: string;
  options?: Opsi[]; // untuk PG & PG Kompleks
  statements?: Statement[]; // untuk Benar-Salah
  kunci: string | string[] | Record<string, 'Benar' | 'Salah'>;
  ringkas: string;
  pilar1: string;
  pilar3: string;
  pilar4: string[];
  pilar5: string;
  similar: SimilarSoal;
}

export const QUESTIONS: Question[] = [
  {
    nomor: 1,
    tipe: 'Pilihan Ganda',
    topik: 'SPLDV',
    stimulus: '',
    prompt:
      'Harga 3 buku tulis dan 2 penggaris adalah Rp21.000. Jika harga 2 buku tulis dan 3 penggaris adalah Rp19.000, maka harga 1 buku tulis adalah …',
    options: [
      { key: 'A', text: 'Rp4.000' },
      { key: 'B', text: 'Rp5.000' },
      { key: 'C', text: 'Rp5.500' },
      { key: 'D', text: 'Rp6.000' },
      { key: 'E', text: 'Rp7.000' },
    ],
    kunci: 'B',
    ringkas:
      'Eliminasi variabel penggaris (p) dari kedua persamaan linear menghasilkan 5b = 25.000, sehingga harga 1 buku tulis (b) = Rp5.000.',
    pilar1:
      'Diketahui: 3b + 2p = 21.000 dan 2b + 3p = 19.000. Ditanyakan: Nilai b (harga 1 buku tulis).',
    pilar3:
      'Karena kita hanya butuh variabel b, kita samakan koefisien p menjadi 6 agar langsung habis saat dikurangkan.',
    pilar4: [
      'Kalikan persamaan (1) × 3 → 9b + 6p = 63.000',
      'Kalikan persamaan (2) × 2 → 4b + 6p = 38.000',
      'Kurangkan kedua persamaan → 5b = 25.000 → b = Rp5.000',
    ],
    pilar5:
      'Trik Cepat: Jumlahkan lalu kurangkan kedua persamaan (5b+5p = 40.000 → b+p = 8.000, dan b-p = 2.000). Maka 2b = 10.000 → b = 5.000 dalam 5 detik!',
    similar: {
      q: 'Jika 4 pensil dan 1 penghapus harganya Rp14.000, sedangkan 2 pensil dan 1 penghapus harganya Rp8.000, berapa harga 1 pensil?',
      opts: ['A. Rp2.000', 'B. Rp3.000', 'C. Rp4.000'],
      ans: 1,
      exp: 'Benar! Kurangkan langsung: (4p + h) - (2p + h) = 14.000 - 8.000 → 2p = 6.000 → p = Rp3.000.',
    },
  },
  {
    nomor: 2,
    tipe: 'Pilihan Ganda Kompleks',
    topik: 'FUNGSI KUADRAT',
    stimulus: 'Perhatikan fungsi kuadrat f(x) = x² - 4x + 3 pada bidang koordinat Cartesius.',
    prompt:
      'Manakah di antara pernyataan berikut yang BENAR mengenai grafik fungsi f(x) tersebut? (Pilih 2 jawaban benar)',
    options: [
      { key: 'A', text: 'Grafik membuka ke atas karena koefisien a > 0' },
      { key: 'B', text: 'Titik puncak berada di koordinat (2, -1)' },
      { key: 'C', text: 'Grafik memotong sumbu-Y di titik (0, -3)' },
      { key: 'D', text: 'Grafik tidak memotong sumbu-X' },
    ],
    kunci: ['A', 'B'],
    ringkas:
      'Koefisien a = 1 (> 0) membuat kurva membuka ke atas (A benar), dan titik puncak xp = -b/2a = 2 dengan yp = 2² - 4(2) + 3 = -1 (B benar).',
    pilar1:
      'Diketahui: f(x) = x² - 4x + 3 (a=1, b=-4, c=3). Ditanyakan: Seluruh pernyataan sifat grafik yang bernilai benar.',
    pilar3:
      'Soal Pilihan Ganda Kompleks menguji ketelitian memverifikasi beberapa sifat fungsi sekaligus tanpa berhenti di opsi pertama.',
    pilar4: [
      'Cek arah bukaan: a = 1 > 0 → membuka ke atas (Opsi A Benar)',
      'Cek titik puncak: xp = -(-4)/(2·1) = 2, yp = 4 - 8 + 3 = -1 → (2, -1) (Opsi B Benar)',
      'Cek potong sumbu-Y (x=0): y = 3 → (0, 3), bukan (0, -3) (Opsi C Salah)',
    ],
    pilar5:
      'Jebakan Umum: Siswa sering hanya mencentang opsi A karena sudah yakin benar, padahal PG Kompleks menuntut semua kunci (A dan B) dicentang.',
    similar: {
      q: 'Untuk f(x) = x² - 2x - 3, manakah titik potong sumbu-Y yang benar?',
      opts: ['A. (0, 3)', 'B. (0, -3)', 'C. (1, -4)'],
      ans: 1,
      exp: 'Tepat! Substitusi x = 0 menghasilkan f(0) = -3, jadi memotong sumbu-Y di (0, -3).',
    },
  },
  {
    nomor: 3,
    tipe: 'Benar-Salah',
    topik: 'STATISTIKA DATA',
    stimulus: 'Data nilai ujian 5 siswa adalah: 60, 70, 70, 80, 95.',
    prompt: 'Tentukan apakah setiap pernyataan statistik di bawah ini Benar atau Salah!',
    statements: [
      { key: 'A', text: 'Modus dari data nilai tersebut adalah 70.' },
      { key: 'B', text: 'Median (nilai tengah) data tersebut adalah 70.' },
      { key: 'C', text: 'Rata-rata (mean) data tersebut adalah 80.' },
    ],
    kunci: { A: 'Benar', B: 'Benar', C: 'Salah' },
    ringkas:
      'Modus = 70 (muncul 2x), Median data ke-3 = 70, sedangkan Rata-rata = (60+70+70+80+95)/5 = 375/5 = 75 (bukan 80).',
    pilar1: 'Data terurut (n=5): 60, 70, 70, 80, 95. Evaluasi kebenaran Modus, Median, dan Mean.',
    pilar3:
      'Tabel Benar/Salah menuntut kita menghitung nilai eksak rata-rata dan tidak menebak dari angka yang tampak di tengah.',
    pilar4: [
      'Pernyataan A: Nilai 70 muncul 2 kali (paling sering) → Benar',
      'Pernyataan B: Data ke-3 dari 5 data terurut adalah 70 → Benar',
      'Pernyataan C: Jumlah = 375, dibagi 5 = 75 ≠ 80 → Salah',
    ],
    pilar5:
      'Trik Cepat: Jumlahkan digit terakhirnya (0+0+0+0+5 = 5, dibagi 5 pasti berakhiran 5, tidak mungkin genap 80).',
    similar: {
      q: 'Berapakah jangkauan (range) dari data 60, 70, 70, 80, 95 di atas?',
      opts: ['A. 25', 'B. 35', 'C. 45'],
      ans: 1,
      exp: 'Mantap! Jangkauan = Nilai terbesar - Nilai terkecil = 95 - 60 = 35.',
    },
  },
];

// ---------- Helper ----------

export type QuizMode = 'latihan' | 'simulasi';

export function getMapel(key: string): Mapel {
  return MAPEL_CATALOG.find((m) => m.key === key) ?? MAPEL_CATALOG[0];
}

/** Durasi paket dalam detik, dari jumlah soal × jatah menit per soal */
export function getDurasiDetik(mapel: Mapel, paket: 1 | 2): number {
  const jumlahSoal = paket === 1 ? mapel.p1 : mapel.p2;
  return Math.round(jumlahSoal * mapel.jatahMenitPerSoal * 60);
}

/** Cek jawaban user untuk satu soal: 'benar' | 'salah' | 'kosong' */
export function evaluateQuestion(
  q: Question,
  answer: string | string[] | Record<string, string> | undefined
): 'benar' | 'salah' | 'kosong' {
  if (answer === undefined) return 'kosong';
  if (q.tipe === 'Pilihan Ganda') {
    if (typeof answer !== 'string' || answer === '') return 'kosong';
    return answer === q.kunci ? 'benar' : 'salah';
  }
  if (q.tipe === 'Pilihan Ganda Kompleks') {
    if (!Array.isArray(answer) || answer.length === 0) return 'kosong';
    const u = [...answer].sort().join(',');
    const k = [...(q.kunci as string[])].sort().join(',');
    return u === k ? 'benar' : 'salah';
  }
  // Benar-Salah
  if (q.tipe === 'Benar-Salah') {
    if (typeof answer !== 'object' || Array.isArray(answer)) return 'kosong';
    const kunci = q.kunci as Record<string, string>;
    const stmts = q.statements ?? [];
    if (!stmts.every((s) => answer[s.key])) return 'kosong';
    return stmts.every((s) => answer[s.key] === kunci[s.key]) ? 'benar' : 'salah';
  }
  return 'kosong';
}

export function formatKunci(q: Question): string {
  if (typeof q.kunci === 'string') return q.kunci;
  if (Array.isArray(q.kunci)) return q.kunci.join(', ');
  return Object.entries(q.kunci)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');
}
