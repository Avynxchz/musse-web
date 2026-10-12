export interface PreviewQuestion {
  id: number
  pertanyaan: string
  opsi: { key: string; text: string }[]
  kunci: string
  pembahasan: string[] // langkah per langkah
  pembahasanTerkunci: boolean // false = full terbuka (hook), true = dikunci
}

export const previewQuestions: PreviewQuestion[] = [
  {
    id: 1,
    pertanyaan:
      'Harga 3 buah buku dan 2 buah penggaris Rp18.000,00. Jika harga sebuah buku Rp1.000,00 lebih mahal dari sebuah penggaris, harga 2 buah buku dan 5 buah penggaris adalah....',
    opsi: [
      { key: 'A', text: 'Rp19.000,00' },
      { key: 'B', text: 'Rp23.000,00' },
      { key: 'C', text: 'Rp25.000,00' },
      { key: 'D', text: 'Rp27.000,00' },
      { key: 'E', text: 'Rp30.000,00' },
    ],
    kunci: 'B',
    pembahasan: [
      'Misal harga buku = x, harga penggaris = y.',
      'Dari soal: 3x + 2y = 18.000 dan x = y + 1.000.',
      'Substitusi: 3(y + 1.000) + 2y = 18.000 → 5y + 3.000 = 18.000 → 5y = 15.000 → y = 3.000.',
      'Maka x = 3.000 + 1.000 = 4.000.',
      'Ditanya 2x + 5y = 2(4.000) + 5(3.000) = 8.000 + 15.000 = Rp23.000,00. Jawaban: B.',
    ],
    pembahasanTerkunci: false, // HOOK: full terbuka biar "wah enak nih"
  },
  {
    id: 2,
    pertanyaan:
      'Fungsi f: R → R dan g: R → R. Jika g(x) = x − 1 dan (f ∘ g)(x) = x³ − 4x, nilai dari f(2) = ….',
    opsi: [
      { key: 'A', text: '9' },
      { key: 'B', text: '13' },
      { key: 'C', text: '15' },
      { key: 'D', text: '17' },
      { key: 'E', text: '25' },
    ],
    kunci: 'C',
    pembahasan: [],
    pembahasanTerkunci: true,
  },
  {
    id: 3,
    pertanyaan:
      'Diketahui barisan aritmetika dengan suku pertama 5 dan beda 4. Jumlah 20 suku pertama barisan tersebut adalah....',
    opsi: [
      { key: 'A', text: '820' },
      { key: 'B', text: '840' },
      { key: 'C', text: '860' },
      { key: 'D', text: '880' },
      { key: 'E', text: '900' },
    ],
    kunci: 'C',
    pembahasan: [],
    pembahasanTerkunci: true,
  },
]

// Demo AI Chat siap-saji (bukan AI live — anti abuse)
export const aiDemoConversation = [
  {
    role: 'user' as const,
    text: 'Kenapa jawaban soal buku tadi B? Aku nggak ngerti substitusinya.',
  },
  {
    role: 'ai' as const,
    text: 'Oke, pelan-pelan ya! Intinya kita punya 2 info: total harga (3x + 2y = 18.000) dan selisih harga (x = y + 1.000). Triknya: karena x sudah dinyatakan dalam y, langsung ganti x di persamaan pertama. Jadi 3(y+1000) + 2y = 18000. Tinggal buka kurung: 3y + 3000 + 2y = 18000, gabung jadi 5y = 15000. Dapat y = 3000, x = 4000. Terakhir hitung yang ditanya: 2(4000) + 5(3000) = 23000. 💡 Tips: kalau ada "lebih mahal dari", langsung tulis sebagai persamaan kedua!',
  },
]
