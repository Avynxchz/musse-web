import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import {
  PASS_PRICE_IDR,
  PAYMENT_ENABLED,
  SUPABASE_ANON_KEY,
  SUPABASE_URL,
  todayWibYmd,
} from '@/lib/payment';
import { createCheckoutPayment, getDokuConfig } from '@/lib/doku';

/**
 * API Route: POST /api/payment/create
 * Login wajib. Harga selalu dari server (Rp5.000), bukan dari klien.
 * Idempoten: order pending < 55 menit yang sudah punya payment_url dipakai ulang.
 * Urutan: panggil DOKU dulu, baru simpan baris pending — jadi tidak ada baris
 * yatim kalau DOKU gagal, dan tidak butuh policy UPDATE (cukup insert-own).
 * Response: { status: 'ok', payment_url, order_id, reused? } | { status: 'error', ... }
 */

function makeOrderId(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rnd = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `MUSSE-${ts}-${rnd}`;
}

export async function POST(req: NextRequest) {
  try {
    let body: { tka_date?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { status: 'error', message: 'Payload JSON tidak valid.' },
        { status: 400 }
      );
    }

    const tkaDate = body.tka_date;
    const today = todayWibYmd();
    if (
      typeof tkaDate !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(tkaDate) ||
      tkaDate < today
    ) {
      return NextResponse.json(
        { status: 'error', message: 'Tanggal TKA tidak valid (pakai format YYYY-MM-DD, hari ini atau setelahnya).' },
        { status: 400 }
      );
    }

    if (!PAYMENT_ENABLED) {
      return NextResponse.json(
        { status: 'error', message: 'Pembayaran belum dibuka.' },
        { status: 503 }
      );
    }

    const cfg = getDokuConfig();
    if (!cfg) {
      return NextResponse.json(
        { status: 'error', message: 'Konfigurasi pembayaran belum lengkap.' },
        { status: 503 }
      );
    }

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
            // Abaikan — set cookie bisa gagal di route handler.
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

    // Idempotensi: order pending yang masih segar (< 55 menit, sudah punya URL)
    // dipakai ulang supaya user tidak menumpuk order DOKU.
    const cutoff = new Date(Date.now() - 55 * 60 * 1000).toISOString();
    const { data: existing } = await supabase
      .from('payments')
      .select('order_id, payment_url, created_at')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .not('payment_url', 'is', null)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.payment_url) {
      return NextResponse.json({
        status: 'ok',
        payment_url: existing.payment_url,
        order_id: existing.order_id,
        reused: true,
      });
    }

    const proto = req.headers.get('x-forwarded-proto') ?? 'https';
    const host = req.headers.get('host');
    if (!host) {
      return NextResponse.json(
        { status: 'error', message: 'Gagal menentukan alamat aplikasi.' },
        { status: 500 }
      );
    }
    const origin = `${proto}://${host}`;

    const orderId = makeOrderId();
    let paymentUrl: string;
    try {
      const result = await createCheckoutPayment(cfg, {
        invoiceNumber: orderId,
        amount: PASS_PRICE_IDR,
        customerEmail: user.email || undefined,
        customerName:
          user.user_metadata?.full_name || user.user_metadata?.name || undefined,
        customerId: user.id,
        callbackBaseUrl: origin,
        notificationUrl: `${origin}/api/payment/webhook`,
      });
      paymentUrl = result.paymentUrl;
    } catch {
      return NextResponse.json(
        { status: 'error', message: 'Gagal membuat pembayaran, coba lagi sebentar.' },
        { status: 502 }
      );
    }

    // Simpan SETELAH DOKU sukses (RLS insert-own: hanya atas nama sendiri).
    const { error: insertError } = await supabase.from('payments').insert({
      order_id: orderId,
      user_id: user.id,
      amount: PASS_PRICE_IDR,
      status: 'pending',
      payment_url: paymentUrl,
      tka_date: tkaDate,
    });
    if (insertError) {
      // Order DOKU sudah terbit tapi baris tidak tersimpan: user tidak bisa
      // membayar order ini (URL tidak dikembalikan), dan webhook-nya nanti
      // ditolak sebagai invoice tak dikenal. Order itu kedaluwarsa sendiri
      // dalam 60 menit. Jangan kembalikan URL tanpa baris.
      console.error('[payment/create] insert failed', insertError.code);
      return NextResponse.json(
        { status: 'error', message: 'Gagal menyimpan order, coba lagi sebentar.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ status: 'ok', payment_url: paymentUrl, order_id: orderId });
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Gagal memproses permintaan.' },
      { status: 500 }
    );
  }
}
