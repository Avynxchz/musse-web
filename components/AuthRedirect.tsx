'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';

/**
 * Kalau user sudah login (ada sesi Supabase), langsung redirect ke /beranda.
 * Dipasang di landing page agar user yang close tab lalu buka lagi
 * otomatis masuk tanpa klik login lagi.
 */
export default function AuthRedirect() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/beranda');
      }
    });
  }, [router]);

  return null;
}
