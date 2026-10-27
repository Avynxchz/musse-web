'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Rute /dashboard sudah tidak dipakai (placeholder lama "lagi dibangun").
 * Dialihkan ke /beranda supaya tidak ada lagi halaman placeholder
 * + tombol ke app lama Railway.
 */
export default function DashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/beranda');
  }, [router]);
  return (
    <main className="flex min-h-dvh items-center justify-center bg-white">
      <p className="text-neutral-500">Mengalihkan ke beranda…</p>
    </main>
  );
}
