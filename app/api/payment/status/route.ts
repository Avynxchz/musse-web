import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';
import { isPassActive, todayWibYmd, type PaymentRow } from '@/lib/payment';

/**
 * API Route: GET /api/payment/status
 * Mengembalikan status pass user yang login (server-side, bukan localStorage).
 * Response: { status: 'ok', isPaid, pass_expires_at } | { status: 'error', ... }
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Di route GET, set cookie bisa gagal — abaikan.
          }
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ status: 'error', message: 'Belum login.' }, { status: 401 });
    }

    // RLS payments_select_own memastikan hanya baris milik user ini yang kembali.
    const { data, error } = await supabase
      .from('payments')
      .select('order_id, status, tka_date, paid_at, created_at')
      .eq('user_id', user.id)
      .eq('status', 'paid');

    if (error) {
      console.error('[payment/status] supabase error', error.code);
      return NextResponse.json(
        { status: 'error', message: 'Gagal memeriksa status.' },
        { status: 502 }
      );
    }

    const rows = (data || []) as PaymentRow[];
    const today = todayWibYmd();
    const active = rows.filter((r) => isPassActive(r.tka_date, today));
    const passExpiresAt = active.length
      ? active.map((r) => r.tka_date as string).sort().at(-1)!
      : null;

    return NextResponse.json({
      status: 'ok',
      isPaid: active.length > 0,
      pass_expires_at: passExpiresAt,
    });
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Gagal memproses permintaan.' },
      { status: 500 }
    );
  }
}
