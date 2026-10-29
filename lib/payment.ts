/**
 * Konstanta & helper pembayaran MUSSE (DOKU) — tidak bergantung ke API DOKU,
 * jadi bisa dipakai route mana pun.
 */

// Harga full akses tahap testing (rupiah). Jangan terima harga dari klien:
// route create selalu pakai nilai ini.
export const PASS_PRICE_IDR = 5000;

// Gerbang utama: selama false, route payment menolak membuat order baru.
// Diubah jadi true hanya saat go-live (setelah kunci produksi terpasang).
export const PAYMENT_ENABLED = process.env.PAYMENT_ENABLED === 'true';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'expired';

export interface PaymentRow {
  order_id: string;
  status: PaymentStatus;
  tka_date: string | null;
  paid_at: string | null;
  created_at: string;
}

// Pass aktif kalau ada pembayaran 'paid' yang tanggal TKA-nya belum lewat.
// Format YYYY-MM-DD bisa dibandingkan sebagai string (leksikografis = kronologis).
export function isPassActive(tkaDate: string | null, todayYmd: string): boolean {
  if (!tkaDate) return false;
  return tkaDate >= todayYmd;
}

// Tanggal hari ini (WIB) dalam format YYYY-MM-DD, tanpa dependensi timezone server.
export function todayWibYmd(now = new Date()): string {
  const wib = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  return wib.toISOString().slice(0, 10);
}
