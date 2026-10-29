'use client';

import { useEffect, useState } from 'react';
import { createClient } from '../../lib/supabase';

/**
 * Halaman /beli — alur beli Full Akses tahap testing (QRIS / DANA via DOKU).
 * Halaman baru (tidak mengubah halaman lain) supaya branch fitur ini bersih.
 * Pass dicek server-side lewat /api/payment/status, bukan localStorage.
 */
export default function BeliPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [passExpiresAt, setPassExpiresAt] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [tkaDate, setTkaDate] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  async function refreshStatus() {
    setStatusLoading(true);
    try {
      const res = await fetch('/api/payment/status');
      const data = await res.json();
      if (data.status === 'ok') {
        setIsPaid(!!data.isPaid);
        setPassExpiresAt(data.pass_expires_at || null);
      }
    } catch {
      // Status gagal dimuat — tombol "Perbarui status" bisa dicoba lagi.
    } finally {
      setStatusLoading(false);
    }
  }

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserEmail(user?.email || null);
      setAuthChecked(true);
      if (user) refreshStatus();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleBuy() {
    setError('');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(tkaDate)) {
      setError('Pilih tanggal TKA dulu.');
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tka_date: tkaDate }),
      });
      const data = await res.json();
      if (data.status === 'ok' && data.payment_url) {
        window.location.href = data.payment_url;
        return;
      }
      setError(data.message || 'Gagal membuat pembayaran, coba lagi.');
    } catch {
      setError('Gagal menghubungi server, coba lagi.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-dvh bg-[#FAFAF7] flex justify-center">
      <div className="w-full max-w-[430px] px-5 py-8">
        <h1 className="text-2xl font-bold text-[#111]">Full Akses MUSSE</h1>
        <p className="text-sm text-[#555] mt-1">
          Sekali bayar <b className="text-[#111]">Rp5.000</b>, aktif sampai tanggal TKA kamu.
          Tahap testing.
        </p>

        {!authChecked ? (
          <p className="text-sm text-[#555] mt-6">Memeriksa login…</p>
        ) : !userEmail ? (
          <div className="mt-6 border-2 border-[#111] bg-white p-4">
            <p className="text-sm font-bold text-[#111]">Login dulu</p>
            <p className="text-sm text-[#555] mt-1">
              Pembelian wajib login Google supaya pass nempel ke akun kamu.
            </p>
            <a
              href="/login"
              className="inline-block mt-3 border-2 border-[#111] bg-[#111] text-white text-sm font-bold px-4 py-2"
            >
              Ke halaman login
            </a>
          </div>
        ) : isPaid ? (
          <div className="mt-6 border-2 border-[#111] bg-[#D9F99D] p-4">
            <p className="text-sm font-bold text-[#111]">Full Akses aktif ✅</p>
            <p className="text-sm text-[#111] mt-1">
              Berlaku sampai <b>{passExpiresAt}</b> (tanggal TKA kamu).
            </p>
            <a
              href="/beranda"
              className="inline-block mt-3 border-2 border-[#111] bg-white text-sm font-bold px-4 py-2"
            >
              Ke Beranda
            </a>
          </div>
        ) : (
          <div className="mt-6 border-2 border-[#111] bg-white p-4">
            <p className="text-sm font-bold text-[#111]">Yang kamu dapat</p>
            <ul className="text-sm text-[#333] mt-2 list-disc pl-5 space-y-1">
              <li>Pembahasan full 5 pilar semua soal</li>
              <li>Autopsi belajar full per simulasi</li>
              <li>Daily study plan + soal serupa tertarget</li>
              <li>Ringkasan untuk orang tua</li>
              <li>AI Tutor 100 chat / hari</li>
            </ul>

            <label className="block text-sm font-bold text-[#111] mt-5" htmlFor="tka-date">
              Tanggal TKA kamu
            </label>
            <input
              id="tka-date"
              type="date"
              value={tkaDate}
              onChange={(e) => setTkaDate(e.target.value)}
              className="mt-1 w-full border-2 border-[#111] px-3 py-2 text-sm"
            />
            <p className="text-xs text-[#777] mt-1">
              Pass aktif sampai tanggal ini. Isi sesuai jadwal TKA kamu.
            </p>

            {error && <p className="text-sm text-red-600 font-bold mt-3">{error}</p>}

            <button
              onClick={handleBuy}
              disabled={creating}
              className="mt-4 w-full border-2 border-[#111] bg-[#BEF264] text-sm font-bold py-3 disabled:opacity-50"
            >
              {creating ? 'Membuat pembayaran…' : 'Bayar Rp5.000 (QRIS / DANA)'}
            </button>
            <p className="text-xs text-[#777] mt-2">
              Setelah bayar, kamu kembali ke halaman ini — status diperbarui otomatis
              begitu DOKU mengonfirmasi.
            </p>
            <button
              onClick={refreshStatus}
              disabled={statusLoading}
              className="mt-3 w-full border-2 border-[#111] bg-white text-sm font-bold py-2 disabled:opacity-50"
            >
              {statusLoading ? 'Memeriksa…' : 'Perbarui status'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
